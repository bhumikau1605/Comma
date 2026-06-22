import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import { AppwriteService } from '../../services/appwrite';
import { useAppState } from '../../context/AppContext';

const LEVEL_EMOJI = (pts) => pts < 50 ? '🌱' : pts < 150 ? '⭐' : pts < 300 ? '🔥' : '👑';
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen() {
  const { currentUser } = useAppState();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AppwriteService.fetchLeaderboard()
      .then(setLeaders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3A3A3A" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaders}
        keyExtractor={l => l.$id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.headerTitle}>Community Leaderboard</Text>
            <Text style={styles.headerSub}>Top point earners in your community</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.$id === currentUser?.id;
          return (
            <View style={[styles.card, isMe && styles.cardMe]}>
              <View style={[styles.rank, index < 3 && { backgroundColor: RANK_COLORS[index] }]}>
                <Text style={styles.rankText}>{index < 3 ? ['🥇','🥈','🥉'][index] : index + 1}</Text>
              </View>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}><Text style={{ fontSize: 18 }}>👤</Text></View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {isMe && <Text style={styles.youBadge}>You</Text>}
                </View>
                <Text style={styles.level}>{LEVEL_EMOJI(item.points ?? 0)} {item.points ?? 0} pts</Text>
              </View>
              {(item.badges ?? []).length > 0 && (
                <Text style={styles.badges}>{(item.badges ?? []).slice(0, 2).map(b => BADGE_EMOJI[b] ?? '🏅').join(' ')}</Text>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const BADGE_EMOJI = {
  first_listing: '📦', first_sale: '💰', first_donation: '🎁',
  power_seller: '⚡', generous: '💝', century: '💯', legend: '👑', trusted: '✅',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: '#3A3A3A', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  trophy: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardMe: { backgroundColor: '#D6F0E0', borderWidth: 1.5, borderColor: '#6B8F71' },
  rank: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankText: { fontSize: 14, fontWeight: '700', color: '#3A3A3A' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: '#3A3A3A', flex: 1 },
  youBadge: { backgroundColor: '#6B8F71', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  level: { fontSize: 12, color: '#888', marginTop: 2 },
  badges: { fontSize: 18 },
});
