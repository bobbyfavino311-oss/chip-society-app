import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

type Tab = 'create' | 'join';
type BlindLevel = 'beginner' | 'casual' | 'mid' | 'highroller';

const BLIND_LEVELS = [
  { id: 'beginner' as BlindLevel,   label: 'Beginner',    blinds: '25 / 50',        color: '#00d4aa' },
  { id: 'casual' as BlindLevel,     label: 'Casual',      blinds: '100 / 200',      color: '#00d4ff' },
  { id: 'mid' as BlindLevel,        label: 'Mid Stakes',  blinds: '500 / 1,000',    color: '#ffd700' },
  { id: 'highroller' as BlindLevel, label: 'High Roller', blinds: '5K / 10K',       color: '#ff8800' },
];

const WORDS = ['VICE', 'ROOK', 'ECHO', 'FLUX', 'NOVA', 'HAZE', 'GRID', 'VOLT', 'APEX', 'CYAN', 'DUSK', 'GLOW'];

function generateCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}-${num}`;
}

export default function PrivateTableScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('create');
  const [blind, setBlind] = useState<BlindLevel>('casual');
  const [bots, setBots] = useState(4);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const codePulse = useRef(new Animated.Value(1)).current;

  const handleCreate = () => {
    const code = generateCode();
    setRoomCode(code);
    Animated.sequence([
      Animated.timing(codePulse, { toValue: 1.06, duration: 200, useNativeDriver: true }),
      Animated.timing(codePulse, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleCopy = () => {
    if (!roomCode) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (!roomCode) return;
    router.replace('/game/practice');
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 5) {
      Alert.alert('Invalid Code', 'Please enter a valid table code like VICE-742.');
      return;
    }
    // Validate format loosely (WORD-NNN)
    if (!/^[A-Z]{3,6}-\d{3}$/.test(code)) {
      Alert.alert('Invalid Code', 'Code format should be like VICE-742. Check the code and try again.');
      return;
    }
    router.replace('/game/practice');
  };

  const blazeColor = '#ff0090';

  return (
    <View style={p.container}>
      <LinearGradient colors={['#180010', '#050010', '#100020']} style={StyleSheet.absoluteFill} />
      <View style={p.glowPink} />

      {/* Header */}
      <View style={[p.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={p.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={blazeColor} />
        </TouchableOpacity>
        <Text style={p.title}>PRIVATE TABLE</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={p.tabs}>
        {(['create', 'join'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[p.tab, tab === t && p.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            {tab === t && <LinearGradient colors={['rgba(255,0,144,0.18)', 'transparent']} style={StyleSheet.absoluteFill} />}
            <Ionicons name={t === 'create' ? 'add-circle-outline' : 'enter-outline'} size={16} color={tab === t ? blazeColor : colors.textDim} />
            <Text style={[p.tabText, tab === t && p.tabTextActive]}>{t === 'create' ? 'CREATE TABLE' : 'JOIN TABLE'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[p.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {tab === 'create' && (
          <>
            {/* Blind level */}
            <Text style={p.sectionLabel}>BLIND LEVEL</Text>
            <View style={p.blindGrid}>
              {BLIND_LEVELS.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[p.blindCard, { borderColor: blind === b.id ? `${b.color}88` : colors.border }]}
                  onPress={() => setBlind(b.id)}
                  activeOpacity={0.8}
                >
                  {blind === b.id && <LinearGradient colors={[`${b.color}22`, 'transparent']} style={StyleSheet.absoluteFill} />}
                  <View style={[p.blindDot, { backgroundColor: b.color }]} />
                  <Text style={[p.blindLabel, { color: blind === b.id ? b.color : colors.text }]}>{b.label}</Text>
                  <Text style={[p.blindBlinds, { color: blind === b.id ? b.color : colors.textDim }]}>{b.blinds}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bot count */}
            <Text style={p.sectionLabel}>AI OPPONENTS</Text>
            <View style={p.botRow}>
              {[1, 2, 3, 4].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[p.botBtn, bots === n && { borderColor: `${blazeColor}88`, backgroundColor: `${blazeColor}18` }]}
                  onPress={() => setBots(n)}
                  activeOpacity={0.8}
                >
                  <Text style={[p.botNum, bots === n && { color: blazeColor }]}>{n}</Text>
                  <Text style={[p.botLabel, bots === n && { color: blazeColor }]}>{n === 1 ? 'bot' : 'bots'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Generate code */}
            {!roomCode ? (
              <TouchableOpacity style={p.createBtn} onPress={handleCreate} activeOpacity={0.85}>
                <LinearGradient colors={[blazeColor, '#cc00ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={p.createBtnText}>GENERATE ROOM CODE</Text>
              </TouchableOpacity>
            ) : (
              <View style={p.codeSection}>
                <Text style={p.codeSectionLabel}>ROOM CODE</Text>
                <Animated.View style={[p.codeBox, { transform: [{ scale: codePulse }] }]}>
                  <LinearGradient colors={['rgba(255,0,144,0.15)', 'rgba(191,95,255,0.1)']} style={StyleSheet.absoluteFill} />
                  <Text style={p.codeText}>{roomCode}</Text>
                  <TouchableOpacity onPress={handleCopy} style={p.copyBtn} activeOpacity={0.7}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.success : colors.textMuted} />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={p.codeHint}>Share this code with friends so they can join your table.</Text>
                <TouchableOpacity style={p.startBtn} onPress={handleStartGame} activeOpacity={0.85}>
                  <LinearGradient colors={[blazeColor, '#cc00ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={p.startBtnText}>START GAME</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRoomCode(null)} style={p.newCodeBtn}>
                  <Ionicons name="refresh" size={14} color={colors.textDim} />
                  <Text style={p.newCodeText}>Generate new code</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'join' && (
          <>
            <View style={p.joinCard}>
              <LinearGradient colors={['rgba(255,0,144,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <Ionicons name="key" size={36} color={blazeColor} style={{ marginBottom: 8 }} />
              <Text style={p.joinTitle}>Enter Room Code</Text>
              <Text style={p.joinSub}>Get the code from your host. Example: VICE-742</Text>
              <TextInput
                style={p.codeInput}
                value={joinCode}
                onChangeText={t => setJoinCode(t.toUpperCase())}
                placeholder="XXXX-000"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
              />
              <TouchableOpacity
                style={[p.joinBtn2, { opacity: joinCode.trim().length >= 5 ? 1 : 0.5 }]}
                onPress={handleJoin}
                activeOpacity={0.85}
                disabled={joinCode.trim().length < 5}
              >
                <LinearGradient colors={[blazeColor, '#cc00ff']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="enter" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={p.joinBtnText}>JOIN TABLE</Text>
              </TouchableOpacity>
            </View>

            <View style={p.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={p.infoText}>
                Private tables are invite-only. Only players with the code can join. AI bots fill any empty seats.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowPink: { position: 'absolute', top: -40, left: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,0,144,0.06)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,0,144,0.1)', borderWidth: 1, borderColor: 'rgba(255,0,144,0.25)' },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#ff0090' },
  tabText: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive: { color: '#ff0090' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  blindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  blindCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, overflow: 'hidden' },
  blindDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  blindLabel: { fontSize: 12, fontWeight: '700' },
  blindBlinds: { fontSize: 10 },
  botRow: { flexDirection: 'row', gap: 10 },
  botBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', gap: 2 },
  botNum: { color: colors.text, fontSize: 20, fontWeight: '900' },
  botLabel: { color: colors.textDim, fontSize: 9 },
  createBtn: { height: 56, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  codeSection: { gap: 12, alignItems: 'center' },
  codeSectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular', alignSelf: 'flex-start' },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,0,144,0.5)', paddingHorizontal: 28, paddingVertical: 18, overflow: 'hidden', width: '100%' },
  codeText: { color: '#ff0090', fontSize: 32, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 4 },
  copyBtn: { padding: 4 },
  codeHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  startBtn: { height: 56, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  newCodeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newCodeText: { color: colors.textDim, fontSize: 11 },
  joinCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,0,144,0.3)', padding: 24, alignItems: 'center', gap: 10, overflow: 'hidden' },
  joinTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  joinSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  codeInput: { width: '100%', height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,0,144,0.4)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#ff0090', fontSize: 26, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 4, textAlign: 'center', marginTop: 6 },
  joinBtn2: { height: 54, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 4 },
  joinBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  infoBox: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryDim, padding: 14 },
  infoText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
