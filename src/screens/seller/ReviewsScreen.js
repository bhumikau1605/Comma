import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppwriteService } from '../../services/appwrite';
import { useAppState } from '../../context/AppContext';

export default function ReviewsScreen({ route }) {
  const { sellerId, sellerName, listingId, canReview } = route.params;
  const { currentUser, refreshBadges } = useAppState();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });

  const load = async () => {
    const [r, avg, reviewed] = await Promise.all([
      AppwriteService.fetchReviews(sellerId),
      AppwriteService.getAverageRating(sellerId),
      listingId ? AppwriteService.hasReviewed(currentUser.id, listingId) : Promise.resolve(false),
    ]);
    setReviews(r);
    setAvgRating(avg);
    setAlreadyReviewed(reviewed);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!comment.trim()) return Alert.alert('Error', 'Please write a comment');
    setSubmitting(true);
    try {
      await AppwriteService.submitReview(currentUser.id, currentUser.name, sellerId, listingId, rating, comment.trim());
      await refreshBadges(sellerId);
      setComment('');
      setAlreadyReviewed(true);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3A3A3A" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={r => r.$id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* Rating summary */}
            <View style={styles.summary}>
              <Text style={styles.avgScore}>{avgRating.average || '—'}</Text>
              <View>
                <Text style={styles.avgStars}>{avgRating.average ? stars(Math.round(avgRating.average)) : '☆☆☆☆☆'}</Text>
                <Text style={styles.avgCount}>{avgRating.count} review{avgRating.count !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Write review */}
            {canReview && !alreadyReviewed && currentUser?.id !== sellerId && (
              <View style={styles.writeCard}>
                <Text style={styles.writeTitle}>Rate {sellerName}</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Text style={[styles.starBtn, s <= rating && styles.starActive]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your experience..."
                  placeholderTextColor="#aaa"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
                <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Review</Text>}
                </TouchableOpacity>
              </View>
            )}

            {alreadyReviewed && <View style={styles.reviewedBanner}><Text style={styles.reviewedText}>✅ You've already reviewed this seller</Text></View>}

            <Text style={styles.sectionTitle}>All Reviews</Text>
            {reviews.length === 0 && <Text style={styles.empty}>No reviews yet</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}><Text style={{ fontSize: 16 }}>👤</Text></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.reviewerName}>{item.reviewer_name}</Text>
                <Text style={styles.reviewStars}>{stars(item.rating)}</Text>
              </View>
              <Text style={styles.reviewDate}>{new Date(item.$createdAt).toLocaleDateString()}</Text>
            </View>
            {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 16, paddingBottom: 40 },
  summary: { backgroundColor: '#3A3A3A', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  avgScore: { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  avgStars: { fontSize: 22, color: '#FFD700' },
  avgCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  writeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  writeTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { fontSize: 32, color: '#ddd' },
  starActive: { color: '#FFD700' },
  commentInput: { backgroundColor: '#F5F1E8', borderRadius: 12, padding: 12, fontSize: 14, color: '#3A3A3A', minHeight: 80, marginBottom: 12 },
  submitBtn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  reviewedBanner: { backgroundColor: '#D6F0E0', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
  reviewedText: { color: '#3A7A50', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center' },
  reviewerName: { fontSize: 13, fontWeight: '600' },
  reviewStars: { fontSize: 14, color: '#FFD700' },
  reviewDate: { fontSize: 11, color: '#aaa' },
  reviewComment: { fontSize: 13, color: '#555', lineHeight: 20 },
});
