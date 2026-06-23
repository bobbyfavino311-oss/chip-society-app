import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SoundEngine } from '@/lib/soundEngine';

export interface BonusNotification {
  notificationId: string;
  amount: number;
  reason: string;
  message?: string | null;
  createdAt: string;
}

interface Props {
  notification: BonusNotification | null;
  onDismiss: () => void;
}

export default function BonusNotificationModal({ notification, onDismiss }: Props) {
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const countAnim  = useRef(new Animated.Value(0)).current;
  const displayCount = useRef(0);
  const [countDisplay, setCountDisplay] = React.useState(0);

  const visible = notification !== null;

  useEffect(() => {
    if (!visible) return;

    // Reset
    scaleAnim.setValue(0.7);
    opacityAnim.setValue(0);
    glowAnim.setValue(0);
    countAnim.setValue(0);
    setCountDisplay(0);

    // Play sound
    void SoundEngine.prizeCollect();

    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Chip counter animation
    const target = notification!.amount;
    const duration = Math.min(2000, Math.max(800, target / 1000));
    countAnim.addListener(({ value }) => {
      const v = Math.round(value);
      if (v !== displayCount.current) {
        displayCount.current = v;
        setCountDisplay(v);
      }
    });
    Animated.timing(countAnim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      countAnim.removeAllListeners();
    };
  }, [visible, notification?.notificationId]);

  if (!notification) return null;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
          {/* Outer glow */}
          <Animated.View style={[styles.outerGlow, { opacity: glowOpacity }]} />

          <LinearGradient
            colors={['#1a1200', '#0d0900', '#050005']}
            style={styles.card}
          >
            {/* Top accent bar */}
            <LinearGradient
              colors={['#ffd700', '#ff8c00', '#ffd700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topBar}
            />

            {/* Gold coin icon */}
            <View style={styles.coinWrapper}>
              <LinearGradient
                colors={['#ffe066', '#ffd700', '#b8860b']}
                style={styles.coinOuter}
              >
                <LinearGradient
                  colors={['#fff3b0', '#ffd700', '#e6a800']}
                  style={styles.coinInner}
                >
                  <Text style={styles.coinSymbol}>$</Text>
                </LinearGradient>
              </LinearGradient>
            </View>

            {/* Header */}
            <Text style={styles.header}>CASINO BONUS</Text>
            <Text style={styles.subheader}>RECEIVED</Text>

            {/* Chip count */}
            <View style={styles.amountRow}>
              <Text style={styles.plusSign}>+</Text>
              <Text style={styles.amount}>{countDisplay.toLocaleString()}</Text>
            </View>
            <Text style={styles.chipsLabel}>CHIPS</Text>

            {/* Reason badge */}
            <View style={styles.reasonBadge}>
              <Text style={styles.reasonText}>{notification.reason}</Text>
            </View>

            {/* Optional message */}
            {!!notification.message && (
              <View style={styles.messageBox}>
                <Text style={styles.messageFrom}>Message from Chip Society:</Text>
                <Text style={styles.messageText}>"{notification.message}"</Text>
              </View>
            )}

            {/* Divider */}
            <LinearGradient
              colors={['transparent', '#ffd70040', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />

            {/* Claim button */}
            <Pressable onPress={onDismiss} style={({ pressed }) => [styles.claimBtn, pressed && styles.claimBtnPressed]}>
              <LinearGradient
                colors={['#ffd700', '#ff8c00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimGradient}
              >
                <Text style={styles.claimText}>CLAIM BONUS</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.footerNote}>Balance updated instantly</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 320,
    height: 420,
    borderRadius: 28,
    backgroundColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#ffd70060',
  },
  topBar: {
    width: '100%',
    height: 4,
    marginBottom: 28,
  },
  coinWrapper: {
    marginBottom: 20,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  coinOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinSymbol: {
    fontSize: 32,
    fontWeight: '900',
    color: '#5a3a00',
  },
  header: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 4,
    marginBottom: 2,
  },
  subheader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff8c00',
    letterSpacing: 6,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  plusSign: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffd700',
    marginTop: 4,
    marginRight: 2,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: -1,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff8c00',
    letterSpacing: 5,
    marginTop: 2,
    marginBottom: 16,
  },
  reasonBadge: {
    backgroundColor: '#ffd70015',
    borderWidth: 1,
    borderColor: '#ffd70040',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffd700',
    letterSpacing: 1,
  },
  messageBox: {
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    width: '88%',
  },
  messageFrom: {
    fontSize: 10,
    color: '#ff8c00',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#ffffffcc',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  divider: {
    width: '80%',
    height: 1,
    marginBottom: 20,
  },
  claimBtn: {
    width: '80%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  claimBtnPressed: {
    opacity: 0.8,
  },
  claimGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  claimText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a0900',
    letterSpacing: 3,
  },
  footerNote: {
    fontSize: 10,
    color: '#ffffff40',
    letterSpacing: 0.5,
  },
});
