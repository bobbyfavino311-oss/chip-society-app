import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  const { profile } = useUser();
  const {
    connected, connecting, lobbyTables, error,
    connect, getLobby, createTable, joinTable, tableId, clearError,
  } = useMultiplayer();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StakeTier>('MICRO');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [joining, setJoining] = useState<string | null>(null);

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

  const handleJoin = (table: LobbyTable) => {
    const chips = profile.chips ?? 0;
    if (chips < table.minBuyIn) {
      Alert.alert('Not enough chips', `This table requires ${formatChips(table.minBuyIn)} minimum.`);
      return;
    }
    setJoining(table.id);
    joinTable(table.id, profile.username, profile.username, profile.avatarIndex ?? 1, Math.min(chips, table.minBuyIn * 5));
  };

  const handleCreate = () => {
    const chips = profile.chips ?? 0;
    const minBuy = TIER_MIN_BUYIN[selectedTier];
    if (chips < minBuy) {
      Alert.alert('Not enough chips', `This stake requires ${formatChips(minBuy)} minimum.`);
      return;
    }
    setShowCreate(false);
    createTable(
      selectedTier, maxPlayers,
      profile.username, profile.username, profile.avatarIndex ?? 1,
      Math.min(chips, minBuy * 5)
    );
  };

  const renderTable = ({ item }: { item: LobbyTable }) => {
    const color = STAKE_COLORS[item.stakeTier];
    const isFull = item.playerCount >= item.maxPlayers;
    const canAfford = (profile.chips ?? 0) >= item.minBuyIn;
    const phaseLabel = item.phase === 'waiting' ? 'WAITING' : 'IN PROGRESS';

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
          <Text style={[styles.phaseTag, { color: item.phase === 'waiting' ? '#00ff88' : '#ffcc00' }]}>
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
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: isFull || !canAfford ? '#333' : color + '25', borderColor: isFull || !canAfford ? '#444' : color }]}
          onPress={() => handleJoin(item)}
          disabled={isFull || !canAfford || joining === item.id}
        >
          {joining === item.id
            ? <ActivityIndicator color={color} size="small" />
            : <Text style={[styles.joinBtnText, { color: isFull || !canAfford ? '#555' : color }]}>
                {isFull ? 'FULL' : !canAfford ? 'NEED MORE CHIPS' : 'JOIN TABLE'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#050010', '#0a0020', '#050010']} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
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

        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#00ff88' : connecting ? '#ffcc00' : '#ff4444' }]} />
          <Text style={styles.statusText}>
            {connected ? 'CONNECTED' : connecting ? 'CONNECTING...' : 'OFFLINE'}
          </Text>
          {connected && (
            <Text style={styles.tableCount}>{lobbyTables.length} TABLE{lobbyTables.length !== 1 ? 'S' : ''} OPEN</Text>
          )}
        </View>

        {/* Create table button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} disabled={!connected}>
          <LinearGradient colors={['#bf5fff', '#7b2fff']} style={styles.createGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.createText}>＋  CREATE TABLE</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Table list */}
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
            <Text style={styles.emptyText}>NO TABLES OPEN</Text>
            <Text style={styles.emptySubText}>Create one to start playing</Text>
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

        {/* Create modal */}
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
  createBtn: { marginHorizontal: 16, marginBottom: 16, borderRadius: 10, overflow: 'hidden' },
  createGrad: { paddingVertical: 14, alignItems: 'center' },
  createText: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  tableCard: { borderRadius: 14, borderWidth: 1, padding: 16, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tierBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1.5 },
  phaseTag: { fontFamily: 'Orbitron_400Regular', fontSize: 10, letterSpacing: 1 },
  tableInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  infoCol: { alignItems: 'center', flex: 1 },
  infoLabel: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: '#ccc', fontFamily: 'Inter_700Bold', fontSize: 14 },
  joinBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  joinBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1.5 },
  offlineBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  offlineText: { color: '#666', fontFamily: 'Orbitron_400Regular', fontSize: 13 },
  retryBtn: { borderWidth: 1, borderColor: '#00d4ff', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#00d4ff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  connectingText: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 12, letterSpacing: 1 },
  emptyText: { color: '#444', fontFamily: 'Orbitron_700Bold', fontSize: 16, letterSpacing: 2 },
  emptySubText: { color: '#333', fontFamily: 'Orbitron_400Regular', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0d0025', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: '#bf5fff40' },
  modalTitle: { color: '#fff', fontFamily: 'Orbitron_900Black', fontSize: 18, letterSpacing: 3, marginBottom: 24, textAlign: 'center' },
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
