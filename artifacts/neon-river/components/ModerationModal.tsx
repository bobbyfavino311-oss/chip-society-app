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
import { Ionicons } from '@expo/vector-icons';

export type ModerationEvent = {
  type: 'warning' | 'suspension' | 'ban';
  reason: string;
  message?: string | null;
  expiresAt?: string | null;
  actionId: string;
};

interface Props {
  event: ModerationEvent | null;
  onDismiss: () => void;
  onForceSignOut?: () => void;
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  if (ms <= 0) return 'Suspension has expired';
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(hours / 24);
  const rem   = hours % 24;
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}${rem > 0 ? ` ${rem}h` : ''}`;
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

const CONFIG = {
  warning: {
    icon:    'warning' as const,
    iconColor: '#ffd700',
    label:   'WARNING RECEIVED',
    grad:    ['#0d0a00', '#1a1200', '#0d0a00'] as const,
    border:  '#ffd700',
    glow:    'rgba(255,215,0,0.25)',
    btn:     '#ffd700',
    btnText: '#000',
  },
  suspension: {
    icon:    'time' as const,
    iconColor: '#ff8c00',
    label:   'ACCOUNT SUSPENDED',
    grad:    ['#0d0500', '#1a0a00', '#0d0500'] as const,
    border:  '#ff8c00',
    glow:    'rgba(255,140,0,0.25)',
    btn:     '#ff8c00',
    btnText: '#000',
  },
  ban: {
    icon:    'ban' as const,
    iconColor: '#ff0040',
    label:   'ACCOUNT BANNED',
    grad:    ['#0d0005', '#1a000a', '#0d0005'] as const,
    border:  '#ff0040',
    glow:    'rgba(255,0,64,0.25)',
    btn:     '#ff0040',
    btnText: '#fff',
  },
};

export default function ModerationModal({ event, onDismiss, onForceSignOut }: Props) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const visible  = event !== null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [visible]);

  if (!event) return null;
  const cfg = CONFIG[event.type];
  const eventSnapshot = event;

  function handleDismiss() {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDismiss();
      if (eventSnapshot.type !== 'warning') onForceSignOut?.();
    });
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={cfg.grad} style={styles.gradient}>

            {/* Glow ring */}
            <View style={[styles.iconRing, { borderColor: cfg.border, shadowColor: cfg.glow }]}>
              <Ionicons name={cfg.icon} size={32} color={cfg.iconColor} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: cfg.border }]}>{cfg.label}</Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: cfg.border + '40' }]} />

            {/* Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REASON</Text>
              <Text style={styles.sectionValue}>{event.reason}</Text>
            </View>

            {/* Suspension expiry */}
            {event.type === 'suspension' && event.expiresAt && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SUSPENSION ENDS</Text>
                <Text style={[styles.sectionValue, { color: cfg.iconColor }]}>
                  {new Date(event.expiresAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.expiryRemaining}>({formatExpiry(event.expiresAt)} remaining)</Text>
              </View>
            )}

            {/* Message */}
            {event.message ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{event.message}</Text>
              </View>
            ) : null}

            {/* Notice for suspension/ban */}
            {event.type !== 'warning' && (
              <Text style={styles.noticeText}>
                {event.type === 'suspension'
                  ? 'Your session will end. You may log in again after the suspension expires.'
                  : 'This account has been permanently banned and cannot be used.'}
              </Text>
            )}

            {/* Action button */}
            <Pressable
              style={[styles.btn, { backgroundColor: cfg.btn }]}
              onPress={handleDismiss}
            >
              <Text style={[styles.btnText, { color: cfg.btnText }]}>
                {event.type === 'warning' ? 'UNDERSTOOD' : 'OK'}
              </Text>
            </Pressable>

          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 28,
    alignItems: 'center',
    borderRadius: 20,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  sectionValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  expiryRemaining: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  noticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    letterSpacing: 2,
  },
});
