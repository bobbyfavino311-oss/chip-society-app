import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import type { Colors } from '@/constants/colors';
import { useNotifications, type AppNotification } from '@/context/NotificationContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function createStyles(c: Colors) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: c.background },

    header:  { paddingHorizontal: 16, paddingBottom: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 16, color: c.primary, letterSpacing: 3 },
    headerSub:   { color: c.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
    markAllBtn: {
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 10, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    markAllText: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    divider: { height: 1, backgroundColor: c.border, marginHorizontal: 16, marginBottom: 8 },

    scroll: { paddingHorizontal: 14, paddingTop: 6, gap: 6 },

    emptyWrap: { paddingVertical: 72, alignItems: 'center', gap: 12 },
    emptyIcon: {
      width: 64, height: 64, borderRadius: 32,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyText: { color: c.text, fontSize: 15, fontWeight: '700' },
    emptySub:  { color: c.textMuted, fontSize: 12 },

    card: {
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, overflow: 'hidden',
    },
    cardUnread: { borderColor: c.primaryDim },
    cardInner: { flexDirection: 'row', padding: 13, gap: 11, alignItems: 'flex-start' },
    iconWrap: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    unreadBar: { width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2 },
    cardBody: { flex: 1, gap: 3 },
    cardTitle: {
      fontFamily: 'Orbitron_700Bold', fontSize: 11,
      color: c.text, letterSpacing: 0.3, lineHeight: 16,
    },
    cardMsg: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    timestamp: { color: c.textDim, fontSize: 10, letterSpacing: 0.2 },

    actionRow: { borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row' },
    actionBtn: {
      flex: 1, paddingVertical: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    actionBtnText: {
      fontSize: 10, fontWeight: '800', letterSpacing: 1,
      fontFamily: 'Orbitron_700Bold',
    },
    dismissBtn: {
      borderLeftWidth: 1, borderLeftColor: c.border,
      paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
    },
  });
}

// ─── Single notification card ─────────────────────────────────────────────────

function NotifCard({ notif, styles, colors }: {
  notif: AppNotification;
  styles: ReturnType<typeof createStyles>;
  colors: Colors;
}) {
  const { markRead, dismiss } = useNotifications();

  const handleAction = () => {
    markRead(notif.id);
    if (notif.actionRoute) router.push(notif.actionRoute as any);
  };

  return (
    <View style={[styles.card, !notif.read && styles.cardUnread]}>
      {!notif.read && (
        <View style={[styles.unreadBar, { backgroundColor: notif.iconColor }]} />
      )}
      {!notif.read && (
        <LinearGradient
          colors={[`${notif.iconColor}07`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.cardInner}>
        <View style={[styles.iconWrap, { backgroundColor: `${notif.iconColor}18`, borderWidth: 1, borderColor: `${notif.iconColor}30` }]}>
          <Ionicons name={notif.icon as any} size={20} color={notif.iconColor} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{notif.title}</Text>
          <Text style={styles.cardMsg} numberOfLines={2}>{notif.message}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.timestamp}>{timeAgo(notif.createdAt)}</Text>
          </View>
        </View>
      </View>

      {(notif.actionRoute && notif.actionLabel) && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAction} activeOpacity={0.7}>
            <Text style={[styles.actionBtnText, { color: notif.iconColor }]}>
              {notif.actionLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => dismiss(notif.id)} activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={colors.textDim} />
          </TouchableOpacity>
        </View>
      )}
      {(!notif.actionRoute || !notif.actionLabel) && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => dismiss(notif.id)} activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={colors.textDim} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  // Auto-mark all as read when the screen is opened
  useEffect(() => {
    const t = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(t);
  }, [markAllRead]);

  // Newest first
  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt - a.createdAt),
    [notifications],
  );

  const bgGrad = isDark
    ? (['#120030', '#050010', '#020d22'] as const)
    : ([colors.background, colors.surfaceElevated, colors.background] as const);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={bgGrad} style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 12) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllRead}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.markAllText, unreadCount === 0 && { opacity: 0.35 }]}>
              READ ALL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Notification list */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={26} color={colors.textDim} />
            </View>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          sorted.map(notif => (
            <NotifCard key={notif.id} notif={notif} styles={styles} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
