import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, ClientGameState, LobbyTable, StakeTier } from '@/lib/multiplayerTypes';

const LAST_ROOM_KEY = 'chip_society_last_room';

const PRODUCTION_SERVER_URL = 'https://api-server-production-bbc2.up.railway.app';

function getSocketUrl(): string {
  // Native apps (Expo Go / standalone) always talk to the stable production
  // server. Never derive this from EXPO_PUBLIC_API_URL / the Expo manifest —
  // those bake in the ephemeral Replit dev-preview domain, which can change
  // across sessions and silently break sockets in a cached JS bundle.
  if (typeof window !== 'undefined' && window.location?.origin) {
    // Web preview only (running inside the Replit workspace) — safe to use
    // the current origin since it's not a persisted/cached native bundle.
    return window.location.origin;
  }
  return PRODUCTION_SERVER_URL;
}

const SOCKET_PATH = '/api/socket.io';

interface LastRoomData {
  roomId: string;
  userId: string;
  username: string;
  avatarId: number;
}

interface MultiplayerContextValue {
  connected: boolean;
  connecting: boolean;
  tableId: string | null;
  gameState: ClientGameState | null;
  lobbyTables: LobbyTable[];
  error: string | null;
  buyIn: number | null;
  chatMessages: ChatMessage[];
  spectating: boolean;

  connect: () => void;
  disconnect: () => void;
  getLobby: () => void;
  createTable: (stakeTier: StakeTier, maxPlayers: number, userId: string, username: string, avatarId: number, chips: number) => void;
  joinTable: (tableId: string, userId: string, username: string, avatarId: number, chips: number) => void;
  quickJoin: (stakeTier: StakeTier, userId: string, username: string, avatarId: number) => void;
  leaveTable: () => void;
  sendAction: (type: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number) => void;
  sendChat: (text: string) => void;
  spectate: (tableId: string) => void;
  stopSpectating: () => void;
  setSitOut: (sitOut: boolean) => void;
  clearError: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const socketRef    = useRef<Socket | null>(null);
  const userInfoRef  = useRef<LastRoomData>({ roomId: '', userId: '', username: '', avatarId: 0 });

  const [connected, setConnected]     = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [tableId, setTableId]         = useState<string | null>(null);
  const [gameState, setGameState]     = useState<ClientGameState | null>(null);
  const [lobbyTables, setLobbyTables] = useState<LobbyTable[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [buyIn, setBuyIn]             = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [spectating, setSpectating]   = useState(false);

  const saveLastRoom = useCallback(async (data: LastRoomData) => {
    try { await AsyncStorage.setItem(LAST_ROOM_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, []);

  const clearLastRoom = useCallback(async () => {
    try { await AsyncStorage.removeItem(LAST_ROOM_KEY); } catch { /* ignore */ }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    const url = getSocketUrl();
    if (!url) { setError('Cannot connect: server URL unavailable.'); return; }
    setConnecting(true);

    const socket = io(url, {
      path: SOCKET_PATH,
      // Railway's edge proxy kills long-held polling connections, which
      // surfaces as a persistent "xhr poll error" on native clients even
      // though the initial handshake succeeds. Skip polling and connect
      // via WebSocket directly.
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      socket.emit('get_lobby');

      // Auto-rejoin previous room on reconnect
      AsyncStorage.getItem(LAST_ROOM_KEY).then((stored) => {
        if (!stored) return;
        try {
          const data: LastRoomData = JSON.parse(stored);
          if (data.roomId && data.userId) {
            socket.emit('rejoin_table', {
              tableId:  data.roomId,
              userId:   data.userId,
              username: data.username,
              avatarId: data.avatarId,
            });
          }
        } catch { /* ignore bad data */ }
      }).catch(() => {});
    });

    socket.on('disconnect', () => {
      setConnected(false);
      // Don't clear tableId/gameState here — allow reconnect to restore state
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
      const mySeatData = data.state.mySeat !== -1 ? data.state.seats[data.state.mySeat] : null;
      if (mySeatData) setBuyIn(mySeatData.chips);

      // Persist for reconnect
      const { userId, username, avatarId } = userInfoRef.current;
      if (userId) {
        const roomData: LastRoomData = { roomId: data.tableId, userId, username, avatarId };
        userInfoRef.current = roomData;
        saveLastRoom(roomData);
      }
    });

    socket.on('game_state', (state: ClientGameState) => {
      setGameState(state);
    });

    socket.on('left_table', () => {
      setTableId(null);
      setGameState(null);
      setBuyIn(null);
      setChatMessages([]);
      clearLastRoom();
    });

    socket.on('rejoin_failed', () => {
      // The room expired — clear stored data and let user rejoin manually
      setTableId(null);
      setGameState(null);
      clearLastRoom();
    });

    socket.on('chat_message', (msg: { playerId: string; playerName: string; text: string; ts: number }) => {
      setChatMessages(prev => {
        const next = [...prev, { id: `${msg.playerId}-${msg.ts}`, ...msg }];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    });

    socket.on('stopped_spectating', () => {
      setSpectating(false);
      setGameState(null);
      setChatMessages([]);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socketRef.current = socket;
  }, [saveLastRoom, clearLastRoom]);

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
    userId: string, username: string, avatarId: number, chips: number,
  ) => {
    userInfoRef.current = { ...userInfoRef.current, userId, username, avatarId };
    socketRef.current?.emit('create_table', { stakeTier, maxPlayers, userId, username, avatarId, chips });
  }, []);

  const joinTable = useCallback((
    tableId: string, userId: string, username: string, avatarId: number, chips: number,
  ) => {
    userInfoRef.current = { ...userInfoRef.current, userId, username, avatarId };
    socketRef.current?.emit('join_table', { tableId, userId, username, avatarId, chips });
  }, []);

  const quickJoin = useCallback((
    stakeTier: StakeTier, userId: string, username: string, avatarId: number,
  ) => {
    userInfoRef.current = { ...userInfoRef.current, userId, username, avatarId };
    socketRef.current?.emit('quick_join', { stakeTier, userId, username, avatarId });
  }, []);

  const leaveTable = useCallback(() => {
    socketRef.current?.emit('leave_table');
  }, []);

  const sendAction = useCallback((
    type: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number,
  ) => {
    socketRef.current?.emit('player_action', { type, amount });
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit('send_chat', { text });
  }, []);

  const spectate = useCallback((tableId: string) => {
    setChatMessages([]);
    socketRef.current?.emit('spectate_table', { tableId });
    setSpectating(true);
  }, []);

  const stopSpectating = useCallback(() => {
    socketRef.current?.emit('stop_spectating');
  }, []);

  const setSitOut = useCallback((sitOut: boolean) => {
    socketRef.current?.emit('sit_out', { sitOut });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  return (
    <MultiplayerContext.Provider value={{
      connected, connecting, tableId, gameState, lobbyTables, error, buyIn,
      chatMessages, spectating,
      connect, disconnect, getLobby, createTable, joinTable, quickJoin, leaveTable,
      sendAction, sendChat, spectate, stopSpectating, setSitOut, clearError,
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
