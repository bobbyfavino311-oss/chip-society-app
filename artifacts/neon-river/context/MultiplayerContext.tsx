import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import type { ClientGameState, LobbyTable, StakeTier } from '@/lib/multiplayerTypes';

function getSocketUrl(): string {
  // Web: use window.location origin — proxy handles /api/socket.io routing
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Native: derive origin from EXPO_PUBLIC_API_URL (e.g. https://domain.com/api → https://domain.com)
  const explicit = process.env['EXPO_PUBLIC_API_URL'];
  if (explicit) return explicit.replace(/\/api\/?$/, '');
  // Native: derive from Expo manifest bundle URL
  try {
    const bundleUrl =
      (Constants.manifest as Record<string, unknown> | null)?.['bundleUrl'] as string | undefined ??
      (Constants as unknown as { manifest2?: { launchAsset?: { url?: string } } }).manifest2?.launchAsset?.url;
    if (bundleUrl) {
      const parsed = new URL(bundleUrl);
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch { /* ignore */ }
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  if (domain) return `https://${domain}`;
  // Hardcoded Railway fallback — permanent 24/7 multiplayer server.
  return 'https://api-server-production-bbc2.up.railway.app';
}

const SOCKET_PATH = '/api/socket.io';

interface MultiplayerContextValue {
  connected: boolean;
  connecting: boolean;
  tableId: string | null;
  gameState: ClientGameState | null;
  lobbyTables: LobbyTable[];
  error: string | null;
  buyIn: number | null;

  connect: () => void;
  disconnect: () => void;
  getLobby: () => void;
  createTable: (stakeTier: StakeTier, maxPlayers: number, userId: string, username: string, avatarId: number, chips: number) => void;
  joinTable: (tableId: string, userId: string, username: string, avatarId: number, chips: number) => void;
  leaveTable: () => void;
  sendAction: (type: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number) => void;
  clearError: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [lobbyTables, setLobbyTables] = useState<LobbyTable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buyIn, setBuyIn] = useState<number | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    const url = getSocketUrl();
    if (!url) {
      setError('Cannot connect: server URL unavailable.');
      return;
    }
    setConnecting(true);

    const socket = io(url, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      socket.emit('get_lobby');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setTableId(null);
      setGameState(null);
    });

    socket.on('connect_error', (err: Error) => {
      setConnecting(false);
      setError(`Connection failed: ${err.message}`);
    });

    socket.on('lobby_state', (data: { tables: LobbyTable[] }) => {
      setLobbyTables(data.tables ?? []);
    });

    socket.on('joined_table', (data: { tableId: string; state: ClientGameState }) => {
      setTableId(data.tableId);
      setGameState(data.state);
      // Capture buy-in from my seat's starting chip count
      const mySeatData = data.state.mySeat !== -1 ? data.state.seats[data.state.mySeat] : null;
      if (mySeatData) setBuyIn(mySeatData.chips);
    });

    socket.on('game_state', (state: ClientGameState) => {
      setGameState(state);
    });

    socket.on('left_table', () => {
      setTableId(null);
      setGameState(null);
      setBuyIn(null);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setConnecting(false);
    setTableId(null);
    setGameState(null);
  }, []);

  const getLobby = useCallback(() => {
    socketRef.current?.emit('get_lobby');
  }, []);

  const createTable = useCallback((
    stakeTier: StakeTier, maxPlayers: number,
    userId: string, username: string, avatarId: number, chips: number
  ) => {
    socketRef.current?.emit('create_table', { stakeTier, maxPlayers, userId, username, avatarId, chips });
  }, []);

  const joinTable = useCallback((
    tableId: string, userId: string, username: string, avatarId: number, chips: number
  ) => {
    socketRef.current?.emit('join_table', { tableId, userId, username, avatarId, chips });
  }, []);

  const leaveTable = useCallback(() => {
    socketRef.current?.emit('leave_table');
  }, []);

  const sendAction = useCallback((
    type: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number
  ) => {
    socketRef.current?.emit('player_action', { type, amount });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  return (
    <MultiplayerContext.Provider value={{
      connected, connecting, tableId, gameState, lobbyTables, error, buyIn,
      connect, disconnect, getLobby, createTable, joinTable, leaveTable, sendAction, clearError,
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error('useMultiplayer must be used inside MultiplayerProvider');
  return ctx;
}
