import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, ScrollView, Alert, TextInput, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMultiplayer } from '@/context/MultiplayerContext';
import { useUser } from '@/context/UserContext';
import { STAKE_LABELS, STAKE_COLORS, formatChips } from '@/lib/multiplayerTypes';
import type { LobbyTable, StakeTier } from '@/lib/multiplayerTypes';

const TIERS: StakeTier[] = ['MICRO', 'LOW', 'STANDARD', 'HIGH_ROLLER', 'VIP', 'ELITE'];

const TIER_BLINDS: Record<StakeTier, string> = {
  MICRO:       '25 / 50',
  LOW:         '100 / 200',
  STANDARD:    '500 / 1K',
  HIGH_ROLLER: '2.5K / 5K',
  VIP:         '10K / 20K',
  ELITE:       '50K / 100K',
};

const TIER_MIN_BUYIN: Record<StakeTier, number> = {
  MICRO:       1_000,
  LOW:         4_000,
  STANDARD:    20_000,
  HIGH_ROLLER: 100_000,
  VIP:         400_000,
  ELITE:       2_000_000,
};

export default function MultiplayerLobby() {
  const { profile, removeChips } = useUser();
  const params = useLocalSearchParams<{ code?: string; mode?: string }>();

  const {
    connected, connecting, lobbyTables, error,
    connect, getLobby, createTable, joinTable, quickJoin, spectate, tableId, clearError,
  } = useMultiplayer();

  const [showCreate, setShowCreate]       = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [selectedTier, setSelectedTier]   = useState<StakeTier>('MICRO');
  const [quickTier, setQuickTier]         = useState<StakeTier>('MICRO');
  const [maxPlayers, setMaxPlayers]       = useState(5);
  const [joining, setJoining]             = useState<string | null>(null);

  const [showJoinCode, setShowJoinCode] = useState(false);
  const [codeInput, setCodeInput]       = useState('');
  const [codeCopied, setCodeCopied]     = useState(false);
  const codeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!connected && !connecting) connect();
  }, []);

  useEffect(() => {
    if (connected) getLobby();
    const interval = setInterval(() => { if (connected) getLobby(); }, 5000);
    return () => clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    if (tableId) router.replace('/multiplayer/game' as any);
  }, [tableId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  useEffect(() => {
    if (params.code && connected) {
      setCodeInput(params.code.toUpperCase());
      setShowJoinCode(true);
    } else if (params.mode === 'host') {
      setShowCreate(true);
    }
  }, [params.code, params.mode, connected]);

  const userId = profile.playerId ?? profile.username;

  const handleJoin = (table: LobbyTable) => {
    const chips = profile.chips ?? 0;
    if (chips < table.minBuyIn) {
      Alert.alert('Not enough chips', `This table requires ${formatChips(table.minBuyIn)} minimum.`);
      return;
    }
    const buyIn = Math.min(chips, table.minBuyIn * 5);
    Alert.alert(
      'Join Table',
      `Buy in for ${formatChips(buyIn)} chips?\n\nYou can win or lose this amount.\nYour remaining balance will be returned when you leave.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Buy In — ${formatChips(buyIn)}`, onPress: () => {
          setJoining(table.id);
          removeChips(buyIn);
          joinTable(table.id, userId, profile.username, profile.avatarIndex ?? 1, buyIn);
        }},
      ]
    );
  };

  const handleJoinByCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length < 4) return;
    const table = lobbyTables.find(t => t.id.toUpperCase() === code);
    if (!table) {
      Alert.alert('Not found', `No open table with code "${code}". Ask your host to check the code.`);
      return;
    }
    handleJoin(table);
  };

  const handleCreate = () => {
    const chips = profile.chips ?? 0;
    const minBuy = TIER_MIN_BUYIN[selectedTier];
    if (chips < minBuy) {
      Alert.alert('Not enough chips', `This stake requires ${formatChips(minBuy)} minimum.`);
      return;
    }
    const buyIn = Math.min(chips, minBuy * 5);
    setShowCreate(false);
    removeChips(buyIn);
    createTable(selectedTier, maxPlayers, userId, profile.username, profile.avatarIndex ?? 1, buyIn);
  };

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleQuickJoin = () => {
    const chips = profile.chips ?? 0;
    const minBuy = TIER_MIN_BUYIN[quickTier];
    if (chips < minBuy) {
      Alert.alert('Not enough chips', `Quick Match at this level requires ${formatChips(minBuy)} minimum.`);
      return;
    }
    setShowQuickJoin(false);
    quickJoin(quickTier, userId, profile.username, profile.avatarIndex ?? 1);
  };

  const handleSpectate = (item: LobbyTable) => {
    spectate(item.id);
    router.replace('/multiplayer/game' as any);
  };

  const renderTable = ({ item }: { item: LobbyTable }) => {
    const color = STAKE_COLORS[item.stakeTier];
    const isFull = item.playerCount >= item.maxPlayers;
    const inProgress = item.phase !== 'waiting';
    const canAfford = (profile.chips ?? 0) >= item.minBuyIn;
    const phaseLabel = inProgress ? 'IN PROGRESS' : 'WAITING';

    return (
      <View style={[styles.tableCard, { borderColor: color + '40' }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tableHeader}>
          <View style={[styles.tierBadge, { backgroundColor: color + '20', borderColor: color + '60' }]}>
            <Text style={[styles.tierText, { color }]}>{STAKE_LABELS[item.stakeTier]}</Text>
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text style={styles.codeValue}>{item.id}</Text>
          </View>
          <Text style={[styles.phaseTag, { color: inProgress ? '#ffcc00' : '#00ff88' }]}>
            {phaseLabel}
          </Text>
        </View>
        <View style={styles.tableInfo}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>BLINDS</Text>
            <Text style={[styles.infoValue, { color }]}>{TIER_BLINDS[item.stakeTier]}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>PLAYERS</Text>
            <Text style={styles.infoValue}>{item.playerCount} / {item.maxPlayers}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>MIN BUY-IN</Text>
            <Text style={styles.infoValue}>{formatChips(item.minBuyIn)}</Text>
          </View>
        </View>
        <View style={styles.btnRow}>
          {inProgress || isFull ? (
            <TouchableOpacity
              style={[styles.spectateBtn, { borderColor: color + '50' }]}
              onPress={() => handleSpectate(item)}
            >
              <Ionicons name="eye-outline" size={14} color={color} />
              <Text style={[styles.spectateTxt, { color }]}>SPECTATE</Text>
            </TouchableOpacity>
          ) : null}
          {!isFull && (
            <TouchableOpacity
              style={[styles.joinBtn,
                { flex: inProgress ? 0 : 1,
                  backgroundColor: !canAfford ? '#333' : color + '25',
                  borderColor: !canAfford ? '#444' : color }]}
              onPress={() => handleJoin(item)}
              disabled={!canAfford || joining === item.id}
            >
              {joining === item.id
                ? <ActivityIndicator color={color} size="small" />
                : <Text style={[styles.joinBtnText, { color: !canAfford ? '#555' : color }]}>
                    {!canAfford ? 'NEED MORE CHIPS' : 'JOIN'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#050010', '#0a0020', '#050010']} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.title}>MULTIPLAYER</Text>
          <View style={styles.chipsDisplay}>
            <Text style={styles.chipsLabel}>MY CHIPS</Text>
            <Text style={styles.chipsValue}>{formatChips(profile.chips ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#00ff88' : connecting ? '#ffcc00' : '#ff4444' }]} />
          <Text style={styles.statusText}>
            {connected ? 'CONNECTED' : connecting ? 'CONNECTING...' : 'OFFLINE'}
          </Text>
          {connected && (
            <Text style={styles.tableCount}>{lobbyTables.length} TABLE{lobbyTables.length !== 1 ? 'S' : ''} OPEN</Text>
          )}
        </View>

        {/* Action buttons row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} disabled={!connected}>
            <LinearGradient colors={['#bf5fff', '#7b2fff']} style={styles.createGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.createText}>CREATE</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => setShowQuickJoin(true)} disabled={!connected}>
            <LinearGradient colors={['#00d4ff', '#0066cc']} style={styles.quickGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.quickText}>QUICK MATCH</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.codeBtn} onPress={() => setShowJoinCode(true)} disabled={!connected}>
            <Ionicons name="keypad-outline" size={16} color="#ff0090" />
            <Text style={styles.codeBtnText}>JOIN BY CODE</Text>
          </TouchableOpacity>
        </View>

        {!connected && !connecting && (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>Could not connect to server.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={connect}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {connecting && (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#00d4ff" size="large" />
            <Text style={styles.connectingText}>CONNECTING TO SERVER...</Text>
          </View>
        )}

        {connected && lobbyTables.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="people-outline" size={40} color="#222" />
            <Text style={styles.emptyText}>NO TABLES OPEN</Text>
            <Text style={styles.emptySubText}>Create one and share your code with friends</Text>
          </View>
        )}

        {connected && lobbyTables.length > 0 && (
          <FlatList
            data={lobbyTables}
            keyExtractor={t => t.id}
            renderItem={renderTable}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Create Table Modal */}
        <Modal visible={showCreate} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>CREATE TABLE</Text>

              <Text style={styles.sectionLabel}>STAKE LEVEL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierRow}>
                {TIERS.map(tier => {
                  const color = STAKE_COLORS[tier];
                  const canAfford = (profile.chips ?? 0) >= TIER_MIN_BUYIN[tier];
                  return (
                    <TouchableOpacity
                      key={tier}
                      style={[styles.tierChip,
                        { borderColor: selectedTier === tier ? color : '#333',
                          backgroundColor: selectedTier === tier ? color + '25' : 'transparent',
                          opacity: canAfford ? 1 : 0.4 }]}
                      onPress={() => canAfford && setSelectedTier(tier)}
                    >
                      <Text style={[styles.tierChipText, { color: selectedTier === tier ? color : '#888' }]}>
                        {STAKE_LABELS[tier]}
                      </Text>
                      <Text style={styles.tierChipBlinds}>{TIER_BLINDS[tier]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionLabel}>MAX PLAYERS</Text>
              <View style={styles.playerRow}>
                {[2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.playerChip,
                      { borderColor: maxPlayers === n ? '#bf5fff' : '#333',
                        backgroundColor: maxPlayers === n ? '#bf5fff25' : 'transparent' }]}
                    onPress={() => setMaxPlayers(n)}
                  >
                    <Text style={[styles.playerChipText, { color: maxPlayers === n ? '#bf5fff' : '#888' }]}>{n}P</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate}>
                  <LinearGradient colors={['#bf5fff', '#7b2fff']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.confirmText}>CREATE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quick Match Modal */}
        <Modal visible={showQuickJoin} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>QUICK MATCH</Text>
              <Text style={styles.joinCodeSub}>Find or create a table instantly — no code needed</Text>

              <Text style={styles.sectionLabel}>STAKE LEVEL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierRow}>
                {TIERS.map(tier => {
                  const color = STAKE_COLORS[tier];
                  const canAfford = (profile.chips ?? 0) >= TIER_MIN_BUYIN[tier];
                  return (
                    <TouchableOpacity
                      key={tier}
                      style={[styles.tierChip,
                        { borderColor: quickTier === tier ? color : '#333',
                          backgroundColor: quickTier === tier ? color + '25' : 'transparent',
                          opacity: canAfford ? 1 : 0.4 }]}
                      onPress={() => canAfford && setQuickTier(tier)}
                    >
                      <Text style={[styles.tierChipText, { color: quickTier === tier ? color : '#888' }]}>
                        {STAKE_LABELS[tier]}
                      </Text>
                      <Text style={styles.tierChipBlinds}>{TIER_BLINDS[tier]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowQuickJoin(false)}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleQuickJoin}>
                  <LinearGradient colors={['#00d4ff', '#0066cc']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="flash" size={14} color="#fff" />
                    <Text style={styles.confirmText}>FIND GAME</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join by Code Modal */}
        <Modal visible={showJoinCode} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>JOIN BY CODE</Text>
              <Text style={styles.joinCodeSub}>Ask your host for their 6-letter table code</Text>

              <TextInput
                ref={codeRef}
                style={styles.codeInput}
                value={codeInput}
                onChangeText={t => setCodeInput(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                placeholderTextColor="#333"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleJoinByCode}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowJoinCode(false); setCodeInput(''); }}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { opacity: codeInput.length < 4 ? 0.4 : 1 }]}
                  onPress={handleJoinByCode}
                  disabled={codeInput.length < 4}
                >
                  <LinearGradient colors={['#ff0090', '#cc0070']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.confirmText}>JOIN</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  backText: { color: '#00d4ff', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontFamily: 'Orbitron_900Black', fontSize: 18, letterSpacing: 3 },
  chipsDisplay: { alignItems: 'flex-end' },
  chipsLabel: { color: '#666', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  chipsValue: { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 14 },
  statusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#888', fontFamily: 'Orbitron_400Regular', fontSize: 10, letterSpacing: 1 },
  tableCount: { marginLeft: 'auto', color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  createBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  createGrad: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  createText: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1.5 },
  quickBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  quickGrad: { paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  quickText: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1.5 },
  codeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#ff009055', borderRadius: 10, paddingVertical: 13, backgroundColor: 'rgba(255,0,144,0.07)' },
  codeBtnText: { color: '#ff0090', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  tableCard: { borderRadius: 14, borderWidth: 1, padding: 16, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  tierBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1.5 },
  codeRow: { flex: 1, alignItems: 'center' },
  codeLabel: { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 1, marginBottom: 1 },
  codeValue: { color: '#888', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
  phaseTag: { fontFamily: 'Orbitron_400Regular', fontSize: 10, letterSpacing: 1 },
  tableInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  infoCol: { alignItems: 'center', flex: 1 },
  infoLabel: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: '#ccc', fontFamily: 'Inter_700Bold', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  spectateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  spectateTxt: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  joinBtn: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  joinBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1.5 },
  offlineBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  offlineText: { color: '#666', fontFamily: 'Orbitron_400Regular', fontSize: 13 },
  retryBtn: { borderWidth: 1, borderColor: '#00d4ff', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#00d4ff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  connectingText: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 12, letterSpacing: 1 },
  emptyText: { color: '#444', fontFamily: 'Orbitron_700Bold', fontSize: 16, letterSpacing: 2 },
  emptySubText: { color: '#333', fontFamily: 'Orbitron_400Regular', fontSize: 12, textAlign: 'center', paddingHorizontal: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0d0025', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: '#bf5fff40' },
  modalTitle: { color: '#fff', fontFamily: 'Orbitron_900Black', fontSize: 18, letterSpacing: 3, marginBottom: 8, textAlign: 'center' },
  joinCodeSub: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 10, textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  codeInput: { borderWidth: 2, borderColor: '#ff009060', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, fontFamily: 'Orbitron_700Bold', fontSize: 28, color: '#ff0090', textAlign: 'center', letterSpacing: 8, backgroundColor: 'rgba(255,0,144,0.05)', marginBottom: 24 },
  sectionLabel: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  tierRow: { marginBottom: 20, flexGrow: 0 },
  tierChip: { borderWidth: 1, borderRadius: 10, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 100 },
  tierChipText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  tierChipBlinds: { color: '#555', fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  playerRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  playerChip: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  playerChipText: { fontFamily: 'Orbitron_700Bold', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#666', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1 },
  confirmBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
});
