import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
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
import {
  useNotifications,
  type AppNotification,
  type NotifCategory,
} from '@/context/NotificationContext';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = 'all' | NotifCategory;
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',        label: 'All'          },
  { key: 'reward',     label: 'Rewards'      },
  { key: 'social',     label: 'Social'       },
  { key: 'tournament', label: 'Tournaments'  },
  { key: 'system',     label: 'System'       },
  { key: 'gameplay',   label: 'Gameplay'     },
];

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

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortNotifications(list: AppNotification[]): AppNotification[] {
  return [...list].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (po !== 0) return po;
    return b.createdAt - a.createdAt;
  });
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function createStyles(c: Colors) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: c.background },
    header:  { paddingHorizontal: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 16, color: c.primary, letterSpacing: 3 },
    headerSub:   { color: c.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
    actionBtn: {
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 10, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    actionBtnText: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    tabBar: { paddingHorizontal: 14, paddingBottom: 8 },
    tabContent: { gap: 6, paddingRight: 4 },
    tab: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    tabActive: { borderColor: c.primary, backgroundColor: c.primaryDim },
    tabText:       { fontSize: 11, fontWeight: '700', color: c.textMuted, letterSpacing: 0.3 },
    tabTextActive: { color: c.primary },

    divider: { height: 1, backgroundColor: c.border, marginHorizontal: 14, marginBottom: 6 },

    scroll: { paddingHorizontal: 14, gap: 8, paddingBottom: 40 },

    emptyWrap: { paddingVertical: 60, alignItems: 'center', gap: 10 },
    emptyIcon: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    emptySub:  { color: c.textDim,   fontSize: 11 },

    card: {
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, overflow: 'hidden',
    },
    cardUnread: { borderColor: c.primaryDim },
    cardInner: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start' },
    iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardBody:  { flex: 1, gap: 2 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: c.text, flex: 1, letterSpacing: 0.3 },
    unreadDot: { width: 7, height: 7, borderRadius: 3.5 },
    cardMsg: { color: c.textMuted, fontSize: 11, lineHeight: 15 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    timestamp:  { color: c.textDim, fontSize: 9, letterSpacing: 0.3 },
    priorityDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priorityText: { fontSize: 8, letterSpacing: 0.5, fontWeight: '700' },
    cardActions: {
      flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border,
    },
    actionBtnCard: {
      flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    },
    actionBtnCardText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, fontFamily: 'Orbitron_700Bold' },
    dismissBtn: {
      borderLeftWidth: 1, borderLeftColor: c.border,
      paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
    },

    clearRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 6 },
    clearBtn: { paddingHorizontal: 10, paddingVertical: 4 },
    clearBtnText: { color: c.error, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  });
}

// ─── Priority visuals ─────────────────────────────────────────────────────────

const PRIORITY_COLORS = { high: '#ff4455', medium: '#ffd700', low: '#8888aa' };
const PRIORITY_LABELS = { high: 'HIGH',    medium: 'MED',    low: 'LOW'  };

// ─── Notification Card ────────────────────────────────────────────────────────

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

  const handleDismiss = () => dismiss(notif.id);

  return (
    <View style={[styles.card, !notif.read && styles.cardUnread]}>
      {!notif.read && (
        <LinearGradient
          colors={[`${colors.primary}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      <Pressable onPress={() => !notif.read && markRead(notif.id)}>
        <View style={styles.cardInner}>
          <View style={[styles.iconWrap, { backgroundColor: `${notif.iconColor}18`, borderWidth: 1, borderColor: `${notif.iconColor}33` }]}>
            <Ionicons name={notif.icon as any} size={20} color={notif.iconColor} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>{notif.title}</Text>
              {!notif.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={styles.cardMsg} numberOfLines={3}>{notif.message}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.timestamp}>{timeAgo(notif.createdAt)}</Text>
              <View style={styles.priorityDot}>
                <View style={[styles.unreadDot, { backgroundColor: PRIORITY_COLORS[notif.priority] }]} />
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[notif.priority] }]}>
                  {PRIORITY_LABELS[notif.priority]}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {(notif.actionRoute || true) && (
        <View style={styles.cardActions}>
          {notif.actionRoute && notif.actionLabel && (
            <TouchableOpacity style={styles.actionBtnCard} onPress={handleAction} activeOpacity={0.7}>
              <Text style={[styles.actionBtnCardText, { color: notif.iconColor }]}>
                {notif.actionLabel}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
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
  const { notifications, unreadCount, markAllRead, clearAllRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filtered = useMemo(() => {
    const list = activeTab === 'all'
      ? notifications
      : notifications.filter(n => n.category === activeTab);
    return sortNotifications(list);
  }, [notifications, activeTab]);

  const readCount = notifications.filter(n => n.read).length;

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
            <Text style={styles.headerTitle}>ALERTS</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={markAllRead}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.actionBtnText, unreadCount === 0 && { opacity: 0.4 }]}>
              READ ALL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* Clear read row */}
      {readCount > 0 && (
        <View style={styles.clearRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={clearAllRead}>
            <Text style={styles.clearBtnText}>Clear {readCount} read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={24} color={colors.textDim} />
            </View>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all' ? "You're all caught up!" : `No ${activeTab} alerts yet.`}
            </Text>
          </View>
        ) : (
          filtered.map(notif => (
            <NotifCard key={notif.id} notif={notif} styles={styles} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
