import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useSocial } from '@/context/SocialContext';
import { useUser } from '@/context/UserContext';

function TabBarBg() {
  const { isDark } = useTheme();
  const colors = useColors();
  if (Platform.OS === 'ios') {
    return <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <View style={[
      StyleSheet.absoluteFill,
      { backgroundColor: isDark ? 'rgba(5,0,16,0.97)' : 'rgba(242,237,255,0.97)' },
    ]} />
  );
}

function FeedTabIcon({ color, size }: { color: string; size: number }) {
  const { unreadCount } = useSocial();
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="people" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute', top: -3, right: -6,
          minWidth: 14, height: 14, borderRadius: 7,
          backgroundColor: '#ff0090', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { pendingBonuses, unreadDmCount } = useUser();
  const bonusCount = pendingBonuses.length;
  const totalBadge = bonusCount + unreadDmCount;
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="person" size={size} color={color} />
      {totalBadge > 0 && (
        <View style={{
          position: 'absolute', top: -3, right: -6,
          minWidth: 14, height: 14, borderRadius: 7,
          backgroundColor: unreadDmCount > 0 ? '#00d4ff' : '#ffd700',
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#050010', fontSize: 8, fontWeight: '900' }}>
            {totalBadge > 9 ? '9+' : totalBadge}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 88 : 64,
          paddingBottom: Platform.OS === 'web' ? 34 : 10,
          paddingTop: 6,
          backgroundColor: 'transparent',
          position: 'absolute',
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBg />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <FeedTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
