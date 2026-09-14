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

type TabKey = 'all' | 'reward' | 'social';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'all',    label: 'ALL',     icon: 'apps-outline' },
  { key: 'reward', label: 'REWARDS', icon: 'gift-outline' },
  { key: 'social', label: 'SOCIAL',  icon: 'people-outline' },
];

const TAB_ACCENT: Record<TabKey, string> = {
  all:    '#00d4ff',
  reward: '#bf5fff',
  social: '#ff0090',
};

// ─── Styles factory ───────────────────────────────────────────────────────────

function createStyles(c: Colors) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: c.background },

    header:  { paddingHorizontal: 20, paddingBottom: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(8,3,27,0.82)', borderWidth: 1, borderColor: c.accent,
      shadowColor: c.accent, shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: {
      fontFamily: 'Orbitron_700Bold', fontSize: 20, color: c.primary, letterSpacing: 3.4,
      textShadowColor: c.primaryGlow, textShadowRadius: 12,
    },
    headerSub:   { color: c.textMuted, fontSize: 12, marginTop: 4, letterSpacing: 0.6 },
    actionRow:   { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'flex-end' },
    headerBtn: {
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 12, borderWidth: 1, borderColor: c.borderBright,
      backgroundColor: 'rgba(14,4,38,0.82)', flexDirection: 'row', alignItems: 'center', gap: 7,
      shadowColor: c.accent, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
    },
    headerBtnText: { color: c.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

    divider: { height: 1, backgroundColor: c.border, opacity: 0.7 },

    // Category tabs
    tabsWrap: {
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 8,
    },
    tabsScroll: { gap: 9, flexGrow: 1 },
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 10, flex: 1, justifyContent: 'center',
      borderRadius: 18, borderWidth: 1, borderColor: c.borderBright,
      backgroundColor: 'rgba(12,3,31,0.76)',
    },
    tabActive: {
      borderColor: 'rgba(255,255,255,0.42)',
      shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8,
    },
    tabLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9, fontFamily: 'Orbitron_700Bold', color: c.textMuted },
    tabLabelActive: { color: '#050010' },
    tabBadge: {
      minWidth: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    tabBadgeText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)' },

    scroll: { paddingHorizontal: 18, paddingTop: 10, gap: 16 },

    emptyWrap: { paddingVertical: 72, alignItems: 'center', gap: 12 },
    emptyIcon: {
      width: 64, height: 64, borderRadius: 32,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyText: { color: c.text, fontSize: 15, fontWeight: '700' },
    emptySub:  { color: c.textMuted, fontSize: 12 },

    card: {
      borderRadius: 20, borderWidth: 1.25, borderColor: c.border,
      backgroundColor: 'rgba(7,3,24,0.92)', overflow: 'hidden',
      shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 5 },
      elevation: 9,
    },
    cardUnread: { borderWidth: 1.5 },
    cardInner: { flexDirection: 'row', padding: 16, paddingRight: 42, gap: 13, alignItems: 'flex-start' },
    iconWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      shadowOpacity: 0.72, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
    unreadDot: {
      width: 7, height: 7, borderRadius: 4, position: 'absolute', right: 1, top: 1,
      borderWidth: 1, borderColor: '#ffffff',
    },
    cardBody: { flex: 1, gap: 5 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: {
      fontSize: 15, fontWeight: '800',
      color: c.text, letterSpacing: 0.05, lineHeight: 19, flexShrink: 1,
    },
    cardMsg: { color: c.textMuted, fontSize: 12.5, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 5 },
    timestamp: { color: c.textDim, fontSize: 10.5, letterSpacing: 0.2 },
    categoryBadge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
    },
    categoryText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

    cardActionRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 13 },
    actionBtn: {
      flex: 1, paddingVertical: 11, borderRadius: 11, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    actionBtnText: {
      fontSize: 11, fontWeight: '900', letterSpacing: 1.25,
      fontFamily: 'Orbitron_700Bold',
    },
    dismissBtn: {
      position: 'absolute', right: 12, top: 12,
      width: 28, height: 28, borderRadius: 14, borderWidth: 1,
      borderColor: c.borderBright, backgroundColor: 'rgba(5,0,16,0.72)',
      justifyContent: 'center', alignItems: 'center',
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
  const { dismiss } = useNotifications();

  const handleAction = () => {
    dismiss(notif.id);
    if (notif.actionRoute) router.push(notif.actionRoute as any);
  };

  const catColor = CATEGORY_COLOR[notif.category] ?? colors.primary;
  const catLabel = CATEGORY_LABEL[notif.category] ?? notif.category.toUpperCase();

  return (
    <View style={[
      styles.card,
      { borderColor: `${notif.iconColor}${notif.read ? '55' : 'CC'}`, shadowColor: notif.iconColor },
      !notif.read && styles.cardUnread,
    ]}>
      <LinearGradient
        colors={[`${notif.iconColor}18`, 'rgba(8,3,27,0.88)', `${notif.iconColor}08`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <TouchableOpacity style={styles.dismissBtn} onPress={() => dismiss(notif.id)} activeOpacity={0.7}>
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      <View style={styles.cardInner}>
        <View style={[
          styles.iconWrap,
          {
            backgroundColor: `${notif.iconColor}14`,
            borderWidth: 1.5,
            borderColor: notif.iconColor,
            shadowColor: notif.iconColor,
          },
        ]}>
          <LinearGradient
            colors={[`${notif.iconColor}25`, 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <Ionicons name={notif.icon as any} size={27} color={notif.iconColor} />
          {!notif.read && <View style={[styles.unreadDot, { backgroundColor: notif.iconColor }]} />}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{notif.title}</Text>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: `${catColor}12`, borderColor: `${catColor}88` },
            ]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{catLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardMsg} numberOfLines={3}>{notif.message}</Text>
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={12} color={colors.textDim} />
            <Text style={styles.timestamp}>{timeAgo(notif.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActionRow}>
        {(notif.actionRoute && notif.actionLabel) ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { borderColor: notif.iconColor, shadowColor: notif.iconColor, shadowOpacity: 0.35, shadowRadius: 8 },
              ]}
              onPress={handleAction}
              activeOpacity={0.72}
            >
              <LinearGradient
                colors={[`${notif.iconColor}22`, `${notif.iconColor}08`]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.actionBtnText, { color: notif.iconColor }]}>
                {notif.actionLabel}
              </Text>
                <Ionicons name="arrow-forward" size={15} color={notif.iconColor} />
              </View>
            </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { flexDirection: 'row', gap: 6, borderColor: colors.borderBright }]}
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

  // Unread counts per visible tab for badges
  const unreadPerCat = useMemo(() => {
    const map: Partial<Record<TabKey, number>> = { all: unreadCount };
    notifications.forEach(n => {
      if (!n.read && (n.category === 'reward' || n.category === 'social')) {
        const key = n.category as TabKey;
        map[key] = (map[key] ?? 0) + 1;
      }
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
          <View style={{ width: 46 }} />
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
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { backgroundColor: accent, shadowColor: accent }],
                ]}
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
