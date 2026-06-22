import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import { AppwriteService } from '../../services/appwrite';
import { useAppState } from '../../context/AppContext';

const STATUS_CONFIG = {
  pending:  { color: '#EAE4DC', text: '⏳ Pending' },
  accepted: { color: '#D6F0E0', text: '✅ Accepted' },
  rejected: { color: '#FDE8E8', text: '❌ Rejected' },
  canceled: { color: '#F5F5F5', text: '🚫 Canceled' },
};

export default function OffersScreen() {
  const { currentUser } = useAppState();
  const [tab, setTab] = useState('received');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = tab === 'received'
        ? await AppwriteService.fetchOffersForSeller(currentUser.id)
        : await AppwriteService.fetchOffersForBuyer(currentUser.id);
      setOffers(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const respond = (offerId, status) => {
    Alert.alert(
      status === 'accepted' ? 'Accept Offer' : 'Reject Offer',
      status === 'accepted' ? 'Accept this offer?' : 'Reject this offer?',
      [
        { text: 'Confirm', onPress: async () => {
          await AppwriteService.respondToOffer(offerId, status);
          load();
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'received' && styles.tabActive]} onPress={() => setTab('received')}>
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>📥 Received</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'sent' && styles.tabActive]} onPress={() => setTab('sent')}>
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>📤 Sent</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ flex: 1 }} color="#3A3A3A" /> : (
        <FlatList
          data={offers}
          keyExtractor={o => o.$id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{tab === 'received' ? '📥' : '📤'}</Text>
              <Text style={styles.emptyText}>No {tab} offers yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
            return (
              <View style={[styles.card, { backgroundColor: config.color }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.listing_title}</Text>
                  <Text style={styles.statusText}>{config.text}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View>
                    <Text style={styles.offerAmount}>₹{Math.round(item.amount)}</Text>
                    <Text style={styles.offerBy}>
                      {tab === 'received' ? `from ${item.buyer_name}` : `to seller`}
                    </Text>
                  </View>
                  {tab === 'received' && item.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => respond(item.$id, 'accepted')}>
                        <Text style={styles.acceptText}>✓ Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => respond(item.$id, 'rejected')}>
                        <Text style={styles.rejectText}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {tab === 'sent' && item.status === 'pending' && (
                    <TouchableOpacity style={[styles.rejectBtn, { marginTop: 12, alignSelf: 'flex-start' }]} onPress={async () => {
                      await AppwriteService.cancelOffer(item.$id);
                      load();
                    }}>
                      <Text style={styles.rejectText}>Cancel Offer</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.date}>{new Date(item.$createdAt).toLocaleDateString()}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#EAE4DC', borderRadius: 14, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#3A3A3A' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#3A3A3A' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listingTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#3A3A3A', marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerAmount: { fontSize: 24, fontWeight: 'bold', color: '#3A3A3A' },
  offerBy: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#3A3A3A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  rejectText: { color: '#e53935', fontWeight: '600', fontSize: 13 },
  date: { fontSize: 11, color: '#aaa', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#aaa', marginTop: 12, fontSize: 15 },
});
