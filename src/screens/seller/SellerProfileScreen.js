import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import ListingCard from '../../components/ListingCard';

const BADGE_EMOJI = {
  first_listing: '📦', first_sale: '💰', first_donation: '🎁',
  power_seller: '⚡', generous: '💝', century: '💯', legend: '👑', trusted: '✅',
};

export default function SellerProfileScreen({ route }) {
  const { sellerId, sellerName } = route.params;
  const navigation = useNavigation();
  const { currentUser, listings } = useAppState();
  const sellerListings = listings.filter(l => l.sellerId === sellerId);
  const isMe = currentUser?.id === sellerId;

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
  const [badges, setBadges] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [isFollowing, followers, rating, profile] = await Promise.all([
        isMe ? Promise.resolve(false) : AppwriteService.isFollowing(currentUser?.id, sellerId),
        AppwriteService.getFollowerCount(sellerId),
        AppwriteService.getAverageRating(sellerId),
        AppwriteService.fetchLeaderboard().then(l => l.find(p => p.$id === sellerId)),
      ]);
      setFollowing(isFollowing);
      setFollowerCount(followers);
      setAvgRating(rating);
      setBadges(profile?.badges ?? []);
      setIsAvailable(profile?.is_available ?? true);
      setLoading(false);
    };
    load();
  }, [sellerId]);

  const toggleFollow = async () => {
    if (!currentUser) return;
    if (following) {
      await AppwriteService.unfollowSeller(currentUser.id, sellerId);
      setFollowing(false);
      setFollowerCount(p => p - 1);
    } else {
      await AppwriteService.followSeller(currentUser.id, sellerId);
      setFollowing(true);
      setFollowerCount(p => p + 1);
    }
  };

  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return (
    <FlatList
      data={sellerListings}
      keyExtractor={l => l.id}
      numColumns={2}
      contentContainerStyle={styles.content}
      columnWrapperStyle={sellerListings.length > 0 ? styles.row : null}
      style={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.avatar}><Text style={{ fontSize: 40 }}>👤</Text></View>
            <Text style={styles.name}>{sellerName}</Text>

            {/* Availability status */}
            <View style={styles.availRow}>
              <View style={[styles.availDot, { backgroundColor: isAvailable ? '#4A7C59' : '#aaa' }]} />
              <Text style={[styles.availText, { color: isAvailable ? '#4A7C59' : '#aaa' }]}>
                {isAvailable ? 'Available' : 'Away'}
              </Text>
            </View>

            {/* Rating */}
            {avgRating.count > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Reviews', { sellerId, sellerName, canReview: false })}>
                <Text style={styles.rating}>{stars(avgRating.average)} {avgRating.average} ({avgRating.count})</Text>
              </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{sellerListings.length}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{avgRating.count}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>

            {/* Badges */}
            {badges.length > 0 && (
              <View style={styles.badgesRow}>
                {badges.map(b => (
                  <Text key={b} style={styles.badgeEmoji}>{BADGE_EMOJI[b] ?? '🏅'}</Text>
                ))}
              </View>
            )}

            {/* Actions */}
            {!isMe && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.followBtn, following && styles.followingBtn]}
                  onPress={toggleFollow}
                  disabled={loading}
                >
                  <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                    {following ? '✓ Following' : '+ Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => navigation.navigate('Reviews', { sellerId, sellerName, canReview: true })}
                >
                  <Text style={styles.reviewBtnText}>⭐ Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>
            {sellerListings.length} listing{sellerListings.length !== 1 ? 's' : ''}
          </Text>
          {sellerListings.length === 0 && <Text style={styles.empty}>No listings yet</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <ListingCard listing={item} onPress={() => navigation.navigate('ListingDetail', { listing: item })} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 16, paddingBottom: 40 },
  header: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 4 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#3A3A3A' },
  rating: { fontSize: 14, color: '#FFD700', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16, marginBottom: 12 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#3A3A3A' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badgeEmoji: { fontSize: 22 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  followBtn: { flex: 1, backgroundColor: '#3A3A3A', borderRadius: 12, padding: 12, alignItems: 'center' },
  followingBtn: { backgroundColor: '#EAE4DC' },
  followBtnText: { color: '#fff', fontWeight: '600' },
  followingBtnText: { color: '#3A3A3A' },
  reviewBtn: { flex: 1, backgroundColor: '#F5F1E8', borderRadius: 12, padding: 12, alignItems: 'center' },
  reviewBtnText: { color: '#3A3A3A', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  cardWrap: { width: '48%' },
});
