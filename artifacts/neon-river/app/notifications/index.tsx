import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useNotifications, type AppNotification, type NotifCategory } from '@/context/NotificationContext';

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

// ─── Category tabs config ─────────────────────────────────────────────────────

type TabKey = 'all' | NotifCategory;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'all',         label: 'ALL',         icon: 'apps-outline' },
  { key: 'reward',      label: 'REWARDS',     icon: 'gift-outline' },
  { key: 'social',      label: 'SOCIAL',      icon: 'people-outline' },
  { key: 'tournament',  label: 'TOURNAMENTS', icon: 'trophy-outline' },
  { key: 'gameplay',    label: 'GAMEPLAY',    icon: 'game-controller-outline' },
  { key: 'system',      label: 'SYSTEM',      icon: 'settings-outline' },
];

const TAB_ACCENT: Record<TabKey, string> = {
  all:        '#00d4ff',
  reward:     '#bf5fff',
  social:     '#ff0090',
  tournament: '#ffd700',
  gameplay:   '#00ff88',
  system:     '#8888aa',
};

// ─── Styles factory ───────────────────────────────────────────────────────────

function createStyles(c: Colors) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: c.background },

    header:  { paddingHorizontal: 16, paddingBottom: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 16, color: c.primary, letterSpacing: 3 },
    headerSub:   { color: c.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
    actionRow:   { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'flex-end' },
    headerBtn: {
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 10, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    headerBtnText: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    divider: { height: 1, backgroundColor: c.border, marginBottom: 0 },

    // Category tabs
    tabsWrap: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    tabsScroll: { gap: 6 },
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 11, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface,
    },
    tabActive: { borderColor: 'transparent' },
    tabLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, fontFamily: 'Orbitron_700Bold', color: c.textMuted },
    tabLabelActive: { color: '#050010' },
    tabBadge: {
      minWidth: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    tabBadgeText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)' },

    scroll: { paddingHorizontal: 14, paddingTop: 10, gap: 8 },

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
    categoryBadge: {
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    categoryText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

    cardActionRow: { borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row' },
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

// ─── Category color map ───────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<NotifCategory, string> = {
  reward:     '#bf5fff',
  social:     '#ff0090',
  tournament: '#ffd700',
  gameplay:   '#00ff88',
  system:     '#8888aa',
};

const CATEGORY_LABEL: Record<NotifCategory, string> = {
  reward:     'REWARD',
  social:     'SOCIAL',
  tournament: 'TOURNAMENT',
  gameplay:   'GAMEPLAY',
  system:     'SYSTEM',
};

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

  const catColor = CATEGORY_COLOR[notif.category] ?? colors.primary;
  const catLabel = CATEGORY_LABEL[notif.category] ?? notif.category.toUpperCase();

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
            <View style={[styles.categoryBadge, { backgroundColor: `${catColor}18` }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{catLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActionRow}>
        {(notif.actionRoute && notif.actionLabel) ? (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAction} activeOpacity={0.7}>
              <Text style={[styles.actionBtnText, { color: notif.iconColor }]}>
                {notif.actionLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={() => dismiss(notif.id)} activeOpacity={0.7}>
              <Ionicons name="close" size={14} color={colors.textDim} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { flexDirection: 'row', gap: 6 }]}
            onPress={() => dismiss(notif.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color={colors.textDim} />
            <Text style={[styles.actionBtnText, { color: colors.textDim }]}>DISMISS</Text>
          </TouchableOpacity>
        )}
      </View>
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

  // Auto-mark all as read after 1.5 s on screen
  useEffect(() => {
    const t = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(t);
  }, [markAllRead]);

  // Filter + sort: unread first, then newest
  const filtered = useMemo(() => {
    const base = activeTab === 'all'
      ? notifications
      : notifications.filter(n => n.category === activeTab);
    return [...base].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [notifications, activeTab]);

  // Unread counts per category for badges
  const unreadPerCat = useMemo(() => {
    const map: Partial<Record<TabKey, number>> = { all: unreadCount };
    notifications.forEach(n => {
      if (!n.read) map[n.category] = (map[n.category] ?? 0) + 1;
    });
    return map;
  }, [notifications, unreadCount]);

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
          {/* Spacer to balance back button */}
          <View style={{ width: 38 }} />
        </View>

        {/* Action buttons row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={clearAllRead}
            disabled={notifications.every(n => !n.read)}
          >
            <Ionicons name="trash-outline" size={12} color={colors.textMuted} />
            <Text style={styles.headerBtnText}>CLEAR READ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={markAllRead}
            disabled={unreadCount === 0}
          >
            <Ionicons name="checkmark-done-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.headerBtnText, unreadCount === 0 && { opacity: 0.35 }]}>
              READ ALL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Category filter tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const accent   = TAB_ACCENT[tab.key];
            const badgeNum = unreadPerCat[tab.key] ?? 0;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && [styles.tabActive, { backgroundColor: accent }]]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={11}
                  color={isActive ? '#050010' : colors.textMuted}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {badgeNum > 0 && !isActive && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badgeNum}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notification list */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={26} color={colors.textDim} />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? 'No notifications' : `No ${activeTab} notifications`}
            </Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
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
