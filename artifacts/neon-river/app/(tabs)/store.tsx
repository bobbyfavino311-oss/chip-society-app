import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatBalance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1000).toLocaleString()}K`;
  return n.toLocaleString();
}

// ─── SVG chip icon ─────────────────────────────────────────────────────────────
function MiniChip({ size = 20, color = '#00d4ff' }: { size?: number; color?: string }) {
  const r = size / 2;
  const outerR = r - 1;
  const N = 6;
  const segLen = r * 0.22;
  const segs = Array.from({ length: N }, (_, i) => {
    const a = (i * (360 / N) - 90) * (Math.PI / 180);
    return {
      x1: r + outerR * Math.cos(a), y1: r + outerR * Math.sin(a),
      x2: r + (outerR - segLen) * Math.cos(a), y2: r + (outerR - segLen) * Math.sin(a),
    };
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={outerR} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
      <Circle cx={r} cy={r} r={outerR * 0.5} fill={`${color}25`} />
      {segs.map((s, i) => (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

// ─── Chip packages ─────────────────────────────────────────────────────────────
interface ChipPackage {
  id: string;
  name: string;
  chips: number;
  price: string;
  priceNum: number;
  color: string;
  highlight?: boolean;
  badge?: string;
}

const PACKAGES: ChipPackage[] = [
  { id: 'starter',    name: 'STARTER STACK',   chips: 100_000,     price: '$1.99',  priceNum: 1.99,  color: '#00d4ff' },
  { id: 'neon',       name: 'NEON STACK',       chips: 500_000,     price: '$4.99',  priceNum: 4.99,  color: '#bf5fff' },
  { id: 'highroller', name: 'HIGH ROLLER',      chips: 2_000_000,   price: '$19.99', priceNum: 19.99, color: '#ffd700', highlight: true, badge: 'BEST VALUE' },
  { id: 'vault',      name: 'VAULT STACK',      chips: 10_000_000,  price: '$49.99', priceNum: 49.99, color: '#ff0090' },
  { id: 'legend',     name: 'LEGEND STACK',     chips: 50_000_000,  price: '$99.99', priceNum: 99.99, color: '#ff6600', badge: 'ULTIMATE' },
];

function PackageCard({ pkg, onPress }: { pkg: ChipPackage; onPress: () => void }) {
  const chipsPerDollar = Math.floor(pkg.chips / pkg.priceNum / 1000);

  return (
    <TouchableOpacity
      style={[styles.packageCard, pkg.highlight && styles.packageHighlight, { borderColor: `${pkg.color}44` }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={pkg.highlight ? [`${pkg.color}22`, `${pkg.color}08`] : [`${pkg.color}12`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {pkg.badge && (
        <View style={[styles.packageBadge, { backgroundColor: pkg.color }]}>
          <Text style={styles.packageBadgeText}>{pkg.badge}</Text>
        </View>
      )}
      <View style={styles.packageLeft}>
        <MiniChip size={32} color={pkg.color} />
        <View style={{ gap: 2 }}>
          <Text style={[styles.packageName, { color: pkg.highlight ? pkg.color : colors.text }]}>{pkg.name}</Text>
          <Text style={[styles.packageChips, { color: pkg.color }]}>
            {formatChips(pkg.chips)} chips
          </Text>
          <Text style={styles.packageRate}>{chipsPerDollar}K chips / $1</Text>
        </View>
      </View>
      <View style={[styles.packagePriceBtn, { backgroundColor: pkg.color }]}>
        <Text style={styles.packagePrice}>{pkg.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Daily bonus card ──────────────────────────────────────────────────────────
function DailyBonusCard() {
  const { canClaimDaily, dailyRewardAmount, claimDailyReward, profile, canClaimHourly, claimHourlyBonus, nextHourlyIn } = useUser();
  const [claiming, setClaiming] = useState(false);
  const [claimingHourly, setClaimingHourly] = useState(false);

  const handleDaily = async () => {
    if (!canClaimDaily || claiming) return;
    setClaiming(true);
    const reward = await claimDailyReward();
    setClaiming(false);
    if (reward > 0) Alert.alert('Daily Bonus!', `You received ${formatChips(reward)} chips! 🔥`);
  };

  const handleHourly = async () => {
    if (!canClaimHourly || claimingHourly) return;
    setClaimingHourly(true);
    const bonus = await claimHourlyBonus();
    setClaimingHourly(false);
    if (bonus > 0) Alert.alert('Hourly Bonus!', `You received ${formatChips(bonus)} chips!`);
  };

  return (
    <View style={styles.freeSection}>
      <Text style={styles.sectionLabel}>FREE CHIPS</Text>
      {/* Daily */}
      <TouchableOpacity
        style={[styles.bonusCard, { borderColor: canClaimDaily ? '#ffd70066' : colors.border }]}
        onPress={handleDaily}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canClaimDaily ? ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)'] : ['rgba(255,255,255,0.03)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <View style={styles.bonusLeft}>
          <Text style={styles.bonusEmoji}>🔥</Text>
          <View>
            <Text style={styles.bonusTitle}>Daily Bonus</Text>
            <Text style={styles.bonusSub}>Day {profile.streakDays + (canClaimDaily ? 1 : 0)} Streak</Text>
          </View>
        </View>
        <View>
          <Text style={[styles.bonusAmount, { color: '#ffd700' }]}>+{formatChips(dailyRewardAmount)}</Text>
          <View style={[styles.claimBtn, { backgroundColor: canClaimDaily ? '#ffd700' : colors.border }]}>
            <Text style={[styles.claimBtnText, { color: canClaimDaily ? '#050010' : colors.textDim }]}>
              {canClaimDaily ? 'CLAIM' : 'CLAIMED'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      {/* Hourly */}
      <TouchableOpacity
        style={[styles.bonusCard, { borderColor: canClaimHourly ? '#00d4ff44' : colors.border }]}
        onPress={handleHourly}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canClaimHourly ? ['rgba(0,212,255,0.1)', 'transparent'] : ['rgba(255,255,255,0.03)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <View style={styles.bonusLeft}>
          <Text style={styles.bonusEmoji}>⏰</Text>
          <View>
            <Text style={styles.bonusTitle}>Hourly Bonus</Text>
            <Text style={styles.bonusSub}>
              {canClaimHourly ? 'Ready to collect!' : `Next in ${nextHourlyIn}m`}
            </Text>
          </View>
        </View>
        <View>
          <Text style={[styles.bonusAmount, { color: '#00d4ff' }]}>+5K</Text>
          <View style={[styles.claimBtn, { backgroundColor: canClaimHourly ? '#00d4ff' : colors.border }]}>
            <Text style={[styles.claimBtnText, { color: canClaimHourly ? '#050010' : colors.textDim }]}>
              {canClaimHourly ? 'CLAIM' : 'WAIT'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  const handlePurchase = (pkg: ChipPackage) => {
    Alert.alert(
      `${pkg.name}`,
      `${formatChips(pkg.chips)} chips for ${pkg.price}\n\nIn-app purchases will be available when the app launches on the App Store.`,
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleVIP = () => {
    Alert.alert(
      'CHIP SOCIETY VIP',
      'VIP membership will be available when the app launches on the App Store.\n\nBenefits include daily chip bonuses, exclusive tables, VIP badge, and more.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={['#0e0030', '#050010', '#000520']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowPink]} />
      <View style={[styles.glowBlue]} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CHIP STORE</Text>
            <Text style={styles.headerSub}>CHIP SOCIETY</Text>
          </View>
          <View style={styles.balanceChip}>
            <MiniChip size={18} color="#00d4ff" />
            <Text style={styles.balanceText}>{formatBalance(profile.chips)}</Text>
          </View>
        </View>

        {/* Daily / Hourly bonuses */}
        <DailyBonusCard />

        {/* Chip packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionLabel}>CHIP PACKAGES</Text>
          <Text style={styles.sectionSub}>Virtual chips · No real-money value</Text>
          {PACKAGES.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} onPress={() => handlePurchase(pkg)} />
          ))}
        </View>

        {/* VIP Membership */}
        <TouchableOpacity style={styles.vipCard} onPress={handleVIP} activeOpacity={0.85}>
          <LinearGradient
            colors={['rgba(191,95,255,0.22)', 'rgba(255,0,144,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
          <View style={styles.vipContent}>
            <View style={styles.vipHeader}>
              <Ionicons name="diamond" size={22} color="#bf5fff" />
              <Text style={styles.vipTitle}>CHIP SOCIETY VIP</Text>
              <View style={styles.vipPrice}>
                <Text style={styles.vipPriceText}>$9.99</Text>
                <Text style={styles.vipPriceSub}>/mo</Text>
              </View>
            </View>
            <View style={styles.vipBenefits}>
              {[
                '50% daily bonus chips every day',
                'Exclusive VIP neon table themes',
                'VIP badge + avatar glow effect',
                'Bonus XP on every hand played',
                'Access to VIP Lounge tables',
              ].map((b, i) => (
                <View key={i} style={styles.vipBenefitRow}>
                  <Ionicons name="checkmark-circle" size={13} color="#bf5fff" />
                  <Text style={styles.vipBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={styles.vipCta}>
              <Text style={styles.vipCtaText}>UNLOCK VIP ACCESS</Text>
              <Ionicons name="chevron-forward" size={14} color="#bf5fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legal}>
          CHIP SOCIETY is a social poker entertainment game. All chips are virtual and
          have no real-money value. No cash payouts. No real gambling.{'\n'}
          In-app purchases available through Apple App Store only.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 16 },
  glowPink: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, top: -50, right: -80,
    backgroundColor: 'rgba(255,0,144,0.06)',
  },
  glowBlue: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, bottom: 200, left: -60,
    backgroundColor: 'rgba(0,212,255,0.05)',
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: {
    color: colors.text, fontSize: 22, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 3,
  },
  headerSub: {
    color: colors.textMuted, fontSize: 10, fontFamily: 'Orbitron_400Regular',
    letterSpacing: 2, marginTop: 2,
  },
  balanceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
  },
  balanceText: {
    color: '#00d4ff', fontSize: 13, fontWeight: '700',
    fontFamily: 'Orbitron_700Bold',
  },

  sectionLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  sectionSub: { color: colors.textDim, fontSize: 11, marginTop: -6 },

  freeSection: { gap: 10 },
  bonusCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  bonusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bonusEmoji: { fontSize: 28 },
  bonusTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  bonusSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  bonusAmount: { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold', textAlign: 'right' },
  claimBtn: {
    marginTop: 4, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-end',
  },
  claimBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  packagesSection: { gap: 10 },
  packageCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, position: 'relative',
  },
  packageHighlight: {
    borderWidth: 1.5,
  },
  packageBadge: {
    position: 'absolute', top: 0, right: 0,
    borderBottomLeftRadius: 10, borderTopRightRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  packageBadgeText: { color: '#050010', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  packageLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  packageName: { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  packageChips: { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', marginTop: 1 },
  packageRate: { color: colors.textDim, fontSize: 10, marginTop: 1 },
  packagePriceBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    minWidth: 64, alignItems: 'center',
  },
  packagePrice: { color: '#050010', fontSize: 14, fontWeight: '900' },

  vipCard: {
    borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(191,95,255,0.4)',
    overflow: 'hidden', position: 'relative',
  },
  vipBadge: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: '#bf5fff',
    borderBottomRightRadius: 10, borderTopLeftRadius: 16,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  vipBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  vipContent: { padding: 20, paddingTop: 40, gap: 14 },
  vipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vipTitle: {
    color: colors.text, fontSize: 16, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', flex: 1,
  },
  vipPrice: { alignItems: 'flex-end' },
  vipPriceText: { color: '#bf5fff', fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
  vipPriceSub: { color: colors.textMuted, fontSize: 10 },
  vipBenefits: { gap: 8 },
  vipBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vipBenefitText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  vipCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(191,95,255,0.2)',
    paddingTop: 14,
  },
  vipCtaText: {
    color: '#bf5fff', fontSize: 13, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  legal: {
    color: 'rgba(255,255,255,0.2)', fontSize: 10,
    textAlign: 'center', lineHeight: 16,
  },
});
