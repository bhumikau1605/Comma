import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import { useAppState } from '../../context/AppContext';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const ALL_BADGES = [
  { key: 'first_listing', emoji: '📦', name: 'First Listing',   desc: 'Post your first listing' },
  { key: 'first_sale',    emoji: '💰', name: 'First Sale',      desc: 'Sell your first item' },
  { key: 'first_donation',emoji: '🎁', name: 'First Donation',  desc: 'Donate your first item' },
  { key: 'power_seller',  emoji: '⚡', name: 'Power Seller',    desc: 'Sell 5 items' },
  { key: 'generous',      emoji: '💝', name: 'Generous',        desc: 'Donate 3 items' },
  { key: 'century',       emoji: '💯', name: 'Century',         desc: 'Earn 100 points' },
  { key: 'legend',        emoji: '👑', name: 'Legend',          desc: 'Earn 300 points' },
  { key: 'trusted',       emoji: '✅', name: 'Trusted Seller',  desc: 'Receive 5 reviews' },
];

export default function BadgesScreen() {
  const { currentUser, refreshBadges } = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const { C } = useTheme();
  const earned = currentUser?.badges ?? [];
  const earnedCount = ALL_BADGES.filter(b => earned.includes(b.key)).length;
  const styles = getStyles(C, R, S);

  useEffect(() => {
    if (currentUser?.id) {
      refreshBadges(currentUser.id ,currentUser.badges);
    }
  }, []);

  const handleRefresh = async () => {
    if (!currentUser?.id) return;
    setRefreshing(true);
    try {
      await refreshBadges(currentUser.id);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={ALL_BADGES}
        keyExtractor={b => b.key}
        numColumns={2}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerEmoji}>🏅</Text>
                <Text style={styles.headerTitle}>Your Badges</Text>
              </View>
              <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <ActivityIndicator color={C.primary} />
                ) : (
                  <Text style={styles.refreshBtn}>🔄</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSub}>{earnedCount} / {ALL_BADGES.length} earned</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${(earnedCount / ALL_BADGES.length) * 100}%` }]} />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isEarned = earned.includes(item.key);
          return (
            <View style={[styles.badge, isEarned ? styles.badgeEarned : styles.badgeLocked]}>
              <Text style={[styles.badgeEmoji, !isEarned && styles.locked]}>{item.emoji}</Text>
              <Text style={[styles.badgeName, !isEarned && styles.lockedText]}>{item.name}</Text>
              <Text style={[styles.badgeDesc, !isEarned && styles.lockedText]}>{item.desc}</Text>
              {isEarned && <Text style={styles.earnedTag}>✅ Earned</Text>}
              {!isEarned && <Text style={styles.lockedTag}>🔒 Locked</Text>}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20, backgroundColor: C.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.primary },
  headerSub: { fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 16 },
  debugText: { fontSize: 10, color: C.muted, opacity: 0.5, marginTop: 8 },
  refreshBtn: { fontSize: 24 },
  progressBg: { width: '100%', height: 8, backgroundColor: C.border, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: C.green, borderRadius: 4 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  badge: { width: '48%', borderRadius: 16, padding: 16, alignItems: 'center' },
  badgeEarned: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  badgeLocked: { backgroundColor: C.card, opacity: 0.5, borderWidth: 1, borderColor: C.border },
  badgeEmoji: { fontSize: 36, marginBottom: 8 },
  locked: { opacity: 0.4 },
  badgeName: { fontSize: 13, fontWeight: '700', color: C.primary, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 4 },
  lockedText: { color: C.muted, opacity: 0.6 },
  earnedTag: { fontSize: 11, color: C.green, fontWeight: '600', marginTop: 8 },
  lockedTag: { fontSize: 11, color: C.muted, marginTop: 8, opacity: 0.6 },
});
