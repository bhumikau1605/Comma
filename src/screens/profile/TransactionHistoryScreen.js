import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';

const TYPE_CONFIG = {
  post:   { icon: '📦', label: 'Posted listing',  color: '#D6E4F0' },
  sell:   { icon: '💰', label: 'Sold item',        color: '#D6F0E0' },
  buy:    { icon: '🛒', label: 'Bought item',      color: '#EAE4DC' },
  donate: { icon: '🎁', label: 'Donated item',     color: '#F0D6E4' },
};

export default function TransactionHistoryScreen() {
  const { currentUser } = useAppState();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AppwriteService.fetchTransactions(currentUser.id)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3A3A3A" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={t => t.$id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptyHint}>Start buying, selling or donating to earn points!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.post;
          return (
            <View style={[styles.card, { backgroundColor: config.color }]}>
              <Text style={styles.icon}>{config.icon}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardLabel}>{config.label}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.listing_title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.$createdAt)}</Text>
              </View>
              <Text style={styles.pts}>+{item.points_earned} pts</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10 },
  icon: { fontSize: 28 },
  cardLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#3A3A3A' },
  cardDate: { fontSize: 11, color: '#888', marginTop: 2 },
  pts: { fontSize: 16, fontWeight: '700', color: '#3A7A50' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#3A3A3A', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center' },
});
