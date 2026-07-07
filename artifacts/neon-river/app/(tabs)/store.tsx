import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import type { Colors } from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { formatChips, getChipColor } from '@/utils/chipColor';
import ChipIcon from '@/components/ChipIcon';
import { useSubscription, CHIP_BUNDLE_MAP, TICKET_BUNDLE_MAP, type ChipBundle } from '@/lib/revenuecat';

// ─── Shared styles factory ─────────────────────────────────────────────────────
function createStyles(c: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll:    { paddingHorizontal: 16, gap: 16 },

    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: c.text, fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
    headerSub:   { color: c.textMuted, fontSize: 10, fontFamily: 'Orbitron_400Regular', letterSpacing: 2, marginTop: 2 },
    balanceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primaryDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: c.primaryGlow },
    balanceText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },

    sectionLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
    sectionSub:   { color: c.textDim, fontSize: 11, marginTop: -6 },
    sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    freeSection:  { gap: 10 },
    bonusCard:    { borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: c.surface },
    bonusLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bonusEmoji:   { fontSize: 28 },
    bonusTitle:   { color: c.text, fontSize: 14, fontWeight: '700' },
    bonusSub:     { color: c.textMuted, fontSize: 11, marginTop: 2 },
    bonusAmount:  { fontSize: 18, fontWeight: '900', fontFamily: 'Inter_700Bold', textAlign: 'right' },
    claimBtn:     { marginTop: 4, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-end' },
    claimBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

    packagesSection: { gap: 10 },
    packageCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, position: 'relative', backgroundColor: c.surface },
    packageHighlight: { borderWidth: 1.5 },
    packageBadge: { position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 10, borderTopRightRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    packageBadgeText: { color: '#050010', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    packageLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    packageName:  { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
    packageChips: { fontSize: 16, fontWeight: '900', fontFamily: 'Inter_700Bold', marginTop: 1 },
    packageRate:  { color: c.textDim, fontSize: 10, marginTop: 1 },
    packagePriceBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 64, alignItems: 'center' },
    packagePrice: { color: '#050010', fontSize: 14, fontWeight: '900' },

    vipCard:      { borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(191,95,255,0.4)', overflow: 'hidden', position: 'relative', backgroundColor: c.surface },
    vipBadge:     { position: 'absolute', top: 0, left: 0, backgroundColor: '#bf5fff', borderBottomRightRadius: 10, borderTopLeftRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
    vipBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
    vipContent:   { padding: 20, paddingTop: 40, gap: 14 },
    vipHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
    vipTitle:     { color: c.text, fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold', flex: 1 },
    vipPrice:     { alignItems: 'flex-end' },
    vipPriceText: { color: '#bf5fff', fontSize: 20, fontWeight: '900', fontFamily: 'Inter_700Bold' },
    vipPriceSub:  { color: c.textMuted, fontSize: 10 },
    vipBenefits:  { gap: 8 },
    vipBenefitRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
    vipBenefitText:{ color: c.textMuted, fontSize: 13 },
    vipCta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(191,95,255,0.2)', paddingTop: 14 },
    vipCtaText:   { color: '#bf5fff', fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

    legal: { color: c.textDim, fontSize: 10, textAlign: 'center', lineHeight: 16 },

    scratchSection: { gap: 10 },
    ticketBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(191,95,255,0.15)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(191,95,255,0.3)', paddingHorizontal: 8, paddingVertical: 3 },
    ticketBadgeText:{ color: '#bf5fff', fontSize: 10, fontWeight: '800' },
    scratchPlayCard:{ borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: c.surface },
    scratchPlayLeft:{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    scratchPlayEmoji:   { fontSize: 30 },
    scratchPlayTitle:   { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
    scratchPlaySub:     { color: c.textMuted, fontSize: 11, marginTop: 2 },
    scratchPlayBtn:     { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 64, alignItems: 'center' },
    scratchPlayBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    ticketPackRow: { flexDirection: 'row', gap: 8 },
    ticketPack:    { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden', paddingVertical: 12, alignItems: 'center', gap: 4, position: 'relative', backgroundColor: c.surface },
    ticketPackBest:    { position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 8, borderTopRightRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    ticketPackBestText:{ color: '#050010', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
    ticketPackCount: { fontSize: 20, fontWeight: '900', fontFamily: 'Inter_700Bold' },
    ticketPackPrice: { fontSize: 11, fontWeight: '700' },
  });
}

// ─── FortuneCookieSection ─────────────────────────────────────────────────────
function FortuneCookieSection() {
  const { profile, canClaimFreeCookie, claimFreeCookie } = useUser();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [claiming, setClaiming] = useState(false);

  const total = (profile.commonCookies ?? 0) + (profile.rareCookies ?? 0) + (profile.epicCookies ?? 0) + (profile.legendaryCookies ?? 0) + (profile.mythicCookies ?? 0);
  const hasAny = total > 0;
  const canOpen = hasAny || canClaimFreeCookie;

  const dailyTimeLeft = useMemo(() => {
    if (canClaimFreeCookie || !profile.lastFreeCookie) return '';
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, new Date(profile.lastFreeCookie).getTime() + COOLDOWN_MS - Date.now());
    const h = Math.floor(remaining / 3_600_000);
    const m = Math.floor((remaining % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [canClaimFreeCookie, profile.lastFreeCookie]);

  const handleOpen = async () => {
    if (!canOpen || claiming) return;
    if (!hasAny && canClaimFreeCookie) {
      setClaiming(true);
      await claimFreeCookie();
      setClaiming(false);
    }
    router.push('/rewards/cookie');
  };

  return (
    <View style={fc.section}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>🥠 FORTUNE COOKIES</Text>
        <View style={[styles.ticketBadge, { borderColor: 'rgba(212,160,23,0.40)', backgroundColor: 'rgba(212,160,23,0.12)' }]}>
          <Text style={[styles.ticketBadgeText, { color: '#D4A017' }]}>{total} cookies</Text>
        </View>
      </View>
      <Text style={[styles.sectionSub, { marginTop: -8 }]}>Crack open a fortune and discover your reward.</Text>

      {/* Main cookie card — daily status integrated */}
      <TouchableOpacity
        style={[fc.card, { borderColor: canOpen ? 'rgba(212,160,23,0.55)' : colors.border }]}
        onPress={handleOpen}
        activeOpacity={0.82}
        disabled={!canOpen || claiming}
      >
        <LinearGradient
          colors={canOpen ? ['rgba(212,160,23,0.18)', 'rgba(212,160,23,0.05)'] : ['rgba(0,0,0,0.01)', 'transparent']}
          style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={fc.cardLeft}>
          <Text style={fc.cardEmoji}>🥠</Text>
          <View style={{ flex: 1 }}>
            <Text style={[fc.cardTitle, { color: canOpen ? '#D4A017' : colors.textDim }]}>
              {hasAny ? 'OPEN COOKIE' : canClaimFreeCookie ? 'DAILY FORTUNE AVAILABLE' : 'NO COOKIES'}
            </Text>
            <Text style={fc.cardSub}>
              {hasAny
                ? `${total} cookie${total !== 1 ? 's' : ''} ready to open`
                : canClaimFreeCookie
                ? '🥠 Ready to open — tap to claim!'
                : 'Come back tomorrow for your free cookie'}
            </Text>
            {hasAny && (
              <View style={fc.typeRow}>
                {(profile.commonCookies    ?? 0) > 0 && <Text style={[fc.typeTag, { color: '#9CA3AF' }]}>🥠 Common ×{profile.commonCookies}</Text>}
                {(profile.rareCookies      ?? 0) > 0 && <Text style={[fc.typeTag, { color: '#60A5FA' }]}>🥠 Rare ×{profile.rareCookies}</Text>}
                {(profile.epicCookies      ?? 0) > 0 && <Text style={[fc.typeTag, { color: '#A855F7' }]}>🥠 Epic ×{profile.epicCookies}</Text>}
                {(profile.legendaryCookies ?? 0) > 0 && <Text style={[fc.typeTag, { color: '#F59E0B' }]}>🥠 Legendary ×{profile.legendaryCookies}</Text>}
                {(profile.mythicCookies    ?? 0) > 0 && <Text style={[fc.typeTag, { color: '#FF0090' }]}>🥠 Mythic ×{profile.mythicCookies}</Text>}
              </View>
            )}
            {/* Daily status — always visible inside the card */}
            <View style={fc.dailyStrip}>
              {canClaimFreeCookie ? (
                <Text style={fc.dailyReady}>DAILY 🥠 READY</Text>
              ) : (
                <Text style={fc.dailyTimer}>Next Free 🥠 In {dailyTimeLeft || '—'}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={[fc.openBtn, { backgroundColor: canOpen ? '#D4A017' : colors.border }]}>
          <Text style={[fc.openBtnText, { color: canOpen ? '#050010' : colors.textDim }]}>
            {claiming ? '...' : canOpen ? 'OPEN' : 'LOCKED'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Rarity guide */}
      <View style={fc.rarityRow}>
        {([
          { label: 'COMMON',    color: '#9CA3AF', desc: '5K–25K chips' },
          { label: 'RARE',      color: '#60A5FA', desc: '25K–150K chips' },
          { label: 'EPIC',      color: '#A855F7', desc: '150K–750K chips' },
          { label: 'LEGENDARY', color: '#F59E0B', desc: '750K–2M chips' },
        ] as const).map(r => (
          <View key={r.label} style={fc.rarityItem}>
            <View style={[fc.rarityDot, { backgroundColor: r.color }]} />
            <Text style={[fc.rarityLbl, { color: r.color }]}>{r.label}</Text>
            <Text style={fc.rarityDesc}>{r.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const fc = StyleSheet.create({
  section:    { gap: 10 },
  card: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardEmoji:   { fontSize: 30 },
  cardTitle:   { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  cardSub:     { color: 'rgba(255,255,255,0.40)', fontSize: 11, marginTop: 2 },
  typeRow:     { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  typeTag:     { color: 'rgba(212,160,23,0.70)', fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  openBtn:     { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 64, alignItems: 'center' },
  openBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  dailyStrip:  { marginTop: 6 },
  dailyReady:  { color: '#D4A017', fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  dailyTimer:  { color: 'rgba(255,255,255,0.30)', fontSize: 10, fontFamily: 'Inter_700Bold' },

  rarityRow:  { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  rarityItem: { flex: 1, minWidth: 70, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 7, gap: 3, alignItems: 'center' },
  rarityDot:  { width: 8, height: 8, borderRadius: 4 },
  rarityLbl:  { fontSize: 7, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  rarityDesc: { color: 'rgba(255,255,255,0.30)', fontSize: 9, textAlign: 'center' },
});

// ─── PackageCard ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, bundle, isPurchasing, onPress }: { pkg: PurchasesPackage; bundle: ChipBundle; isPurchasing: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.packageCard, { borderColor: `${bundle.color}44` }]}
      onPress={onPress} activeOpacity={0.8} disabled={isPurchasing}
    >
      <LinearGradient
        colors={[`${bundle.color}12`, 'transparent']}
        style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      {bundle.bonus && (
        <View style={[styles.packageBadge, { backgroundColor: bundle.color }]}>
          <Text style={styles.packageBadgeText}>{bundle.bonus}</Text>
        </View>
      )}
      <View style={styles.packageLeft}>
        <ChipIcon variant="gold" size={32} />
        <View style={{ gap: 2 }}>
          <Text style={[styles.packageName, { color: colors.text }]}>{bundle.label.toUpperCase()}</Text>
          <Text style={[styles.packageChips, { color: bundle.color }]}>{formatChips(bundle.chips)} chips</Text>
        </View>
      </View>
      <View style={[styles.packagePriceBtn, { backgroundColor: bundle.color }]}>
        {isPurchasing ? (
          <ActivityIndicator color="#050010" />
        ) : (
          <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── DailyBonusCard ───────────────────────────────────────────────────────────
function DailyBonusCard() {
  const { canClaimDaily, dailyRewardAmount, claimDailyReward, profile } = useUser();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [claiming, setClaiming] = useState(false);

  const handleDaily = async () => {
    if (!canClaimDaily || claiming) return;
    setClaiming(true);
    const reward = await claimDailyReward();
    setClaiming(false);
    if (reward > 0) Alert.alert('Daily Bonus!', `You received ${formatChips(reward)} chips!`);
  };

  return (
    <View style={styles.freeSection}>
      <Text style={styles.sectionLabel}>FREE CHIPS</Text>
      {/* Daily Bonus Streak */}
      <TouchableOpacity
        style={[styles.bonusCard, { borderColor: canClaimDaily ? '#ffd70066' : colors.border }]}
        onPress={handleDaily} activeOpacity={0.8}
      >
        <LinearGradient
          colors={canClaimDaily ? ['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)'] : ['rgba(0,0,0,0.01)', 'transparent']}
          style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
    </View>
  );
}

// ─── ScratchSection ───────────────────────────────────────────────────────────
function ScratchSection() {
  const { profile, addScratchTickets } = useUser();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canPlay = profile.scratchTickets > 0;
  const { offerings, purchase } = useSubscription();
  const [activeTicketPkg, setActiveTicketPkg] = useState<string | null>(null);

  const ticketPackages = (offerings?.current?.availablePackages ?? []).filter(
    (p) => TICKET_BUNDLE_MAP[p.product.identifier],
  );

  const handleBuyTickets = async (pkg: PurchasesPackage) => {
    const bundle = TICKET_BUNDLE_MAP[pkg.product.identifier];
    if (!bundle) return;
    setActiveTicketPkg(pkg.identifier);
    try {
      await purchase(pkg);
      await addScratchTickets(bundle.tickets);
      Alert.alert('Tickets Added!', `+${bundle.tickets} scratch tickets added to your account.`);
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert('Purchase Failed', e?.message ?? 'Please try again.');
    } finally {
      setActiveTicketPkg(null);
    }
  };

  return (
    <View style={styles.scratchSection}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>SCRATCH & WIN</Text>
        <View style={styles.ticketBadge}>
          <Ionicons name="ticket" size={11} color="#bf5fff" />
          <Text style={styles.ticketBadgeText}>{profile.scratchTickets} tickets</Text>
        </View>
      </View>
      <Text style={[styles.sectionSub, { marginTop: -8 }]}>Match 3 symbols · Win up to 250K chips</Text>

      <TouchableOpacity
        style={[styles.scratchPlayCard, { borderColor: canPlay ? 'rgba(191,95,255,0.55)' : colors.border }]}
        onPress={() => router.push('/rewards/scratch')} activeOpacity={0.82} disabled={!canPlay}
      >
        <LinearGradient
          colors={canPlay ? ['rgba(191,95,255,0.18)', 'rgba(191,95,255,0.05)'] : ['rgba(0,0,0,0.01)', 'transparent']}
          style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={styles.scratchPlayLeft}>
          <Text style={styles.scratchPlayEmoji}>🎫</Text>
          <View>
            <Text style={[styles.scratchPlayTitle, { color: canPlay ? '#bf5fff' : colors.textDim }]}>
              {canPlay ? 'SCRATCH NOW' : 'NO TICKETS'}
            </Text>
            <Text style={styles.scratchPlaySub}>
              {canPlay ? `${profile.scratchTickets} ticket${profile.scratchTickets !== 1 ? 's' : ''} available` : 'Get free or buy tickets below'}
            </Text>
          </View>
        </View>
        <View style={[styles.scratchPlayBtn, { backgroundColor: canPlay ? '#bf5fff' : colors.border }]}>
          <Text style={[styles.scratchPlayBtnText, { color: canPlay ? '#fff' : colors.textDim }]}>
            {canPlay ? 'PLAY' : 'LOCKED'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.ticketPackRow}>
        {ticketPackages.length === 0 && (
          <Text style={[styles.sectionSub, { marginTop: 4 }]}>Loading ticket packs…</Text>
        )}
        {ticketPackages.map(pkg => {
          const bundle = TICKET_BUNDLE_MAP[pkg.product.identifier]!;
          const isBest = pkg.product.identifier === 'tickets_10';
          const isActive = activeTicketPkg === pkg.identifier;
          return (
            <TouchableOpacity
              key={pkg.identifier}
              style={[styles.ticketPack, { borderColor: `${bundle.color}44` }, isBest && { borderWidth: 1.5 }]}
              onPress={() => handleBuyTickets(pkg)} activeOpacity={0.8} disabled={isActive}
            >
              <LinearGradient colors={[`${bundle.color}18`, 'transparent']} style={StyleSheet.absoluteFill} />
              {isBest && <View style={[styles.ticketPackBest, { backgroundColor: bundle.color }]}><Text style={styles.ticketPackBestText}>BEST</Text></View>}
              {isActive ? (
                <ActivityIndicator color={bundle.color} />
              ) : (
                <>
                  <Text style={[styles.ticketPackCount, { color: bundle.color }]}>{bundle.tickets}×</Text>
                  <Text style={[styles.ticketPackPrice, { color: bundle.color }]}>{pkg.product.priceString}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips } = useUser();
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { offerings, isLoading, purchase } = useSubscription();
  const [activeChipPkg, setActiveChipPkg] = useState<string | null>(null);

  const chipPackages = (offerings?.current?.availablePackages ?? []).filter(
    (p) => CHIP_BUNDLE_MAP[p.product.identifier],
  );

  const handlePurchase = async (pkg: PurchasesPackage) => {
    const bundle = CHIP_BUNDLE_MAP[pkg.product.identifier];
    if (!bundle) return;
    setActiveChipPkg(pkg.identifier);
    try {
      await purchase(pkg);
      await addChips(bundle.chips);
      Alert.alert('Chips Added!', `+${formatChips(bundle.chips)} chips added to your stack!`);
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert('Purchase Failed', e?.message ?? 'Please try again.');
    } finally {
      setActiveChipPkg(null);
    }
  };

  const handleVIP = () => {
    Alert.alert('CHIP SOCIETY VIP', 'VIP membership will be available when the app launches on the App Store.\n\nBenefits include daily chip bonuses, exclusive tables, VIP badge, and more.', [{ text: 'Got it' }]);
  };

  const bgGrad = isDark
    ? (['#0e0030', '#050010', '#000520'] as const)
    : ([colors.background, colors.surfaceElevated, colors.background] as const);

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgGrad} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CHIP STORE</Text>
            <Text style={styles.headerSub}>CHIP SOCIETY</Text>
          </View>
          <View style={[styles.balanceChip, { borderColor: `${getChipColor(profile.chips)}44` }]}>
            <ChipIcon variant={profile.chips < 5_000 ? 'red' : profile.chips < 30_000 ? 'gold' : 'green'} size={20} />
            <Text style={[styles.balanceText, { color: getChipColor(profile.chips) }]}>{formatChips(profile.chips)}</Text>
          </View>
        </View>

        <FortuneCookieSection />
        <ScratchSection />

        <View style={styles.packagesSection}>
          <Text style={styles.sectionLabel}>CHIP PACKAGES</Text>
          <Text style={styles.sectionSub}>Virtual chips · No real-money value</Text>
          {isLoading && chipPackages.length === 0 && (
            <Text style={styles.sectionSub}>Loading chip packages…</Text>
          )}
          {chipPackages.map(pkg => {
            const bundle = CHIP_BUNDLE_MAP[pkg.product.identifier]!;
            return (
              <PackageCard
                key={pkg.identifier}
                pkg={pkg}
                bundle={bundle}
                isPurchasing={activeChipPkg === pkg.identifier}
                onPress={() => handlePurchase(pkg)}
              />
            );
          })}
        </View>

        <TouchableOpacity style={styles.vipCard} onPress={handleVIP} activeOpacity={0.85}>
          <LinearGradient
            colors={['rgba(191,95,255,0.22)', 'rgba(255,0,144,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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
                'Daily streaks double',
                '1 extra wheel spin per day',
                '1 Mythic Fortune Cookie per month',
                'Double XP on every hand',
                'VIP Badge on your profile',
              ].map((b, i) => (
                <View key={i} style={styles.vipBenefitRow}>
                  <Ionicons name="checkmark-circle" size={13} color="#bf5fff" />
                  <Text style={styles.vipBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={styles.vipCta}>
              <Ionicons name="time-outline" size={14} color="#bf5fff" />
              <Text style={styles.vipCtaText}>COMING SOON</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.legal}>
          CHIP SOCIETY is a social poker entertainment game. All chips are virtual and
          have no real-money value. No cash payouts. No real gambling.{'\n'}
          In-app purchases available through Apple App Store only.
        </Text>
      </ScrollView>
    </View>
  );
}
