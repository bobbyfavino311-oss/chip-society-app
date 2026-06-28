import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import { useSubscription, CHIP_BUNDLE_MAP } from '@/lib/revenuecat';
import type { PurchasesPackage } from 'react-native-purchases';

const { width } = Dimensions.get('window');

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 0)}K`;
  return n.toLocaleString();
}

export default function ChipShop() {
  const insets = useSafeAreaInsets();
  const { addChips } = useUser();
  const { offerings, isLoading, purchase, isPurchasing } = useSubscription();

  const [confirmPkg, setConfirmPkg] = useState<PurchasesPackage | null>(null);
  const [successMsg, setSuccessMsg]  = useState<string | null>(null);
  const [errorMsg, setErrorMsg]      = useState<string | null>(null);
  const [activePkg, setActivePkg]    = useState<string | null>(null);

  const packages: PurchasesPackage[] = offerings?.current?.availablePackages ?? [];

  async function handlePurchase(pkg: PurchasesPackage) {
    setConfirmPkg(null);
    setErrorMsg(null);
    setActivePkg(pkg.identifier);
    try {
      await purchase(pkg);
      const bundle = CHIP_BUNDLE_MAP[pkg.product.identifier];
      const chips  = bundle?.chips ?? 0;
      if (chips > 0) await addChips(chips);
      setSuccessMsg(`+${formatChips(chips)} chips added to your stack!`);
    } catch (e: any) {
      if (e?.userCancelled) {
        // User dismissed the native sheet — silently ignore
      } else {
        setErrorMsg(e?.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      setActivePkg(null);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHIP SHOP</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Virtual chips only · No real gambling
      </Text>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#00d4ff" size="large" />
            <Text style={styles.loadingText}>Loading chip bundles…</Text>
          </View>
        )}

        {!isLoading && packages.length === 0 && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>No bundles available right now.</Text>
            <Text style={styles.loadingSubtext}>Check back soon!</Text>
          </View>
        )}

        {packages.map((pkg) => {
          const bundle   = CHIP_BUNDLE_MAP[pkg.product.identifier];
          if (!bundle) return null;
          const isActive = activePkg === pkg.identifier;

          return (
            <TouchableOpacity
              key={pkg.identifier}
              onPress={() => setConfirmPkg(pkg)}
              disabled={isPurchasing}
              activeOpacity={0.8}
              style={styles.cardOuter}
            >
              <LinearGradient
                colors={['#0d0520', '#12062a']}
                style={[styles.card, { borderColor: bundle.color + '55' }]}
              >
                {/* Left: chip icon + count */}
                <View style={styles.cardLeft}>
                  <LinearGradient
                    colors={[bundle.color + '33', bundle.color + '11']}
                    style={[styles.chipIcon, { borderColor: bundle.color + '66' }]}
                  >
                    <Text style={[styles.chipIconText, { color: bundle.color }]}>♠</Text>
                  </LinearGradient>
                  <View style={styles.chipInfo}>
                    <Text style={[styles.bundleLabel, { color: bundle.color }]}>{bundle.label}</Text>
                    <Text style={styles.chipCount}>{formatChips(bundle.chips)} chips</Text>
                    {bundle.bonus && (
                      <Text style={[styles.bonusText, { color: bundle.color }]}>{bundle.bonus}</Text>
                    )}
                  </View>
                </View>

                {/* Right: price + buy */}
                <View style={styles.cardRight}>
                  {isActive ? (
                    <ActivityIndicator color={bundle.color} />
                  ) : (
                    <LinearGradient
                      colors={[bundle.color + 'bb', bundle.color + '77']}
                      style={styles.buyBtn}
                    >
                      <Text style={styles.buyPrice}>{pkg.product.priceString}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Restore note */}
        {!isLoading && packages.length > 0 && (
          <Text style={styles.restoreNote}>
            Purchases are non-refundable · Virtual chips only
          </Text>
        )}
      </ScrollView>

      {/* ── Confirm modal ────────────────────────────────────────────── */}
      <Modal visible={!!confirmPkg} transparent animationType="fade">
        <View style={styles.modalBack}>
          <LinearGradient colors={['#100830', '#0d0520']} style={styles.modalCard}>
            {confirmPkg && (() => {
              const bundle = CHIP_BUNDLE_MAP[confirmPkg.product.identifier];
              return (
                <>
                  <Text style={[styles.modalTitle, { color: bundle?.color ?? '#00d4ff' }]}>
                    {bundle?.label ?? confirmPkg.product.title}
                  </Text>
                  <Text style={styles.modalChips}>
                    +{formatChips(bundle?.chips ?? 0)} chips
                  </Text>
                  <Text style={styles.modalPrice}>
                    {confirmPkg.product.priceString}
                  </Text>
                  <Text style={styles.modalDisclaimer}>
                    This is a virtual in-app purchase. No real money gambling.
                  </Text>
                  <View style={styles.modalBtns}>
                    <TouchableOpacity
                      onPress={() => setConfirmPkg(null)}
                      style={styles.modalCancel}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePurchase(confirmPkg)}
                      style={styles.modalConfirm}
                    >
                      <LinearGradient
                        colors={[bundle?.color ?? '#00d4ff', (bundle?.color ?? '#00d4ff') + '99']}
                        style={styles.modalConfirmGrad}
                      >
                        <Text style={styles.modalConfirmText}>Buy Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </LinearGradient>
        </View>
      </Modal>

      {/* ── Success modal ───────────────────────────────────────────── */}
      <Modal visible={!!successMsg} transparent animationType="fade">
        <View style={styles.modalBack}>
          <LinearGradient colors={['#100830', '#0d0520']} style={styles.modalCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Chips Added!</Text>
            <Text style={styles.successMsg}>{successMsg}</Text>
            <TouchableOpacity
              onPress={() => { setSuccessMsg(null); router.back(); }}
              style={styles.successBtn}
            >
              <LinearGradient
                colors={['#00d4ff', '#00a0cc']}
                style={styles.successBtnGrad}
              >
                <Text style={styles.successBtnText}>Back to Game</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* ── Error modal ─────────────────────────────────────────────── */}
      <Modal visible={!!errorMsg} transparent animationType="fade">
        <View style={styles.modalBack}>
          <LinearGradient colors={['#100830', '#0d0520']} style={styles.modalCard}>
            <Text style={styles.errorTitle}>Purchase Failed</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => setErrorMsg(null)} style={styles.errorBtn}>
              <Text style={styles.errorBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050010',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00d4ff22',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#00d4ff',
    fontSize: 22,
  },
  headerTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#ffffff55',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: '#ffffff88',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  loadingSubtext: {
    color: '#ffffff44',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  cardOuter: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  chipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipIconText: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
  },
  chipInfo: {
    gap: 2,
    flex: 1,
  },
  bundleLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  chipCount: {
    color: '#ffffffdd',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  bonusText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    opacity: 0.85,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buyBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyPrice: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  restoreNote: {
    textAlign: 'center',
    color: '#ffffff33',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 16,
    letterSpacing: 0.5,
  },

  // Modals
  modalBack: {
    flex: 1,
    backgroundColor: '#00000099',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalChips: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  modalPrice: {
    color: '#ffffff99',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  modalDisclaimer: {
    color: '#ffffff55',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff33',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#ffffff88',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  modalConfirm: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalConfirmGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },

  // Success
  successIcon: { fontSize: 48 },
  successTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    color: '#00d4ff',
    letterSpacing: 2,
  },
  successMsg: {
    color: '#ffffffcc',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  successBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  successBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successBtnText: {
    color: '#000',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },

  // Error
  errorTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: '#ff4466',
    letterSpacing: 1,
  },
  errorMsg: {
    color: '#ffffff99',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  errorBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff446655',
    marginTop: 4,
  },
  errorBtnText: {
    color: '#ff4466',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});
