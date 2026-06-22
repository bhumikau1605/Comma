import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, FlatList, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const SCREEN_W = Dimensions.get('window').width;

function PriceHistoryChart({ history, currentPrice }) {
  const { C } = useTheme();
  if (!history || history.length === 0) return null;
  const all = [...history.map(h => h.price), currentPrice];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const points = [...history, { price: currentPrice, date: new Date().toISOString(), current: true }];
  const chartW = SCREEN_W - 80;
  const chartH = 60;

  const ph = getPhStyles(C, R, S);

  return (
    <View style={ph.wrap}>
      <Text style={ph.title}>📈 Price History</Text>
      <View style={ph.chart}>
        {/* Grid line */}
        <View style={ph.gridLine} />
        {/* Points and lines */}
        {points.map((p, i) => {
          const x = points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW;
          const y = chartH - ((p.price - min) / range) * chartH;
          return (
            <View key={i}>
              {i > 0 && (() => {
                const prev = points[i - 1];
                const px = ((i - 1) / (points.length - 1)) * chartW;
                const py = chartH - ((prev.price - min) / range) * chartH;
                const dx = x - px;
                const dy = y - py;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <View style={[ph.line, {
                    left: px, top: py,
                    width: len,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: '0 0',
                  }]} />
                );
              })()}
              <View style={[ph.dot, p.current && ph.dotCurrent, { left: x - 5, top: y - 5 }]} />
            </View>
          );
        })}
      </View>
      <View style={ph.labels}>
        {points.map((p, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={ph.labelPrice}>₹{Math.round(p.price)}</Text>
            <Text style={ph.labelDate}>
              {p.current ? 'Now' : new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const getPhStyles = (C, R, S) => StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: R.lg, padding: 16, marginTop: 20, ...S.sm },
  title: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 12 },
  chart: { height: 60, position: 'relative', marginBottom: 8 },
  gridLine: { position: 'absolute', left: 0, right: 0, top: 30, height: 1, backgroundColor: C.border },
  line: { position: 'absolute', height: 2, backgroundColor: C.green },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: C.muted },
  dotCurrent: { backgroundColor: C.green, width: 12, height: 12, borderRadius: 6 },
  labels: { flexDirection: 'row' },
  labelPrice: { fontSize: 10, fontWeight: '700', color: C.primary },
  labelDate: { fontSize: 9, color: C.muted },
});

export default function ListingDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const { currentUser, refreshPoints, refreshBadges, deleteListing, points, listings } = useAppState();
  const insets = useSafeAreaInsets();
  const isSeller = currentUser?.id === listing.sellerId;

  // Parallax scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [50, 0, -60],
    extrapolate: 'clamp',
  });
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });
  // Header fade
  const headerOpacity = scrollY.interpolate({
    inputRange: [180, 240],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Similar listings: same category, different listing, active only
  const similarListings = useMemo(() =>
    listings.filter(l =>
      l.id !== listing.id &&
      l.category === listing.category &&
      l.status === 'active'
    ).slice(0, 6),
    [listings, listing.id, listing.category]
  );
  const [status, setStatus] = useState(listing.status ?? 'active');
  const [isBoosted, setIsBoosted] = useState(listing.isBoosted ?? false);
  const [loading, setLoading] = useState(false);
  const { C } = useTheme();
  const styles = getStyles(C, R, S);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [existingOffer, setExistingOffer] = useState(null);

  const loadExistingOffer = async () => {
    if (!currentUser || isSeller) return;
    const offer = await AppwriteService.fetchOfferForBuyer(listing.id, currentUser.id);
    setExistingOffer(offer);
    if (offer && offer.status === 'pending') {
      setOfferAmount(`${Math.round(offer.amount)}`);
    }
  };

  useEffect(() => {
    loadExistingOffer();
  }, [listing.id, currentUser?.id, isSeller]);

  const handleBoost = async () => {
    if (points < 50) return Alert.alert('Not enough points', 'You need at least 50 points to boost a listing.');
    Alert.alert('Boost Listing', 'Spend 50 points to pin this listing to the top for 7 days?', [
      { text: 'Boost', onPress: async () => {
        setLoading(true);
        try {
          await AppwriteService.boostListing(listing.id, currentUser.id);
          await refreshPoints(currentUser.id);
          setIsBoosted(true);
          Alert.alert('🚀 Boosted!', 'Your listing is now pinned for 7 days!');
        } catch (e) { Alert.alert('Error', e.message); }
        setLoading(false);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMakeOffer = async () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter a valid offer amount');
    setLoading(true);
    try {
      if (existingOffer?.status === 'pending') {
        await AppwriteService.updateOffer(existingOffer.$id, amount);
        Alert.alert('✅ Offer Updated!', `Your offer has been updated to ₹${Math.round(amount)}.`);
      } else {
        await AppwriteService.makeOffer(listing.id, listing.title, currentUser.id, currentUser.name, listing.sellerId, amount);
        Alert.alert('✅ Offer Sent!', `Your offer of ₹${Math.round(amount)} has been sent to the seller.`);
      }
      setShowOfferInput(false);
      setOfferAmount('');
      await loadExistingOffer();
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const handleCancelOffer = async () => {
    if (!existingOffer) return;
    setLoading(true);
    try {
      await AppwriteService.cancelOffer(existingOffer.$id);
      setExistingOffer({ ...existingOffer, status: 'canceled' });
      Alert.alert('Offer canceled', 'Your pending offer has been canceled.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing? This cannot be undone.', [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteListing(listing.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
            setLoading(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMarkSold = async () => {
    // Fetch people who've chatted about this listing
    const participants = await AppwriteService.fetchChatParticipants(listing.id, currentUser.id);

    const buttons = participants.map(p => ({
      text: `👤 ${p.name}`,
      onPress: () => confirmSold(p.id),
    }));

    buttons.push({
      text: '🌐 Someone outside the community',
      onPress: () => confirmSold(null),
    });

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Mark as Sold',
      participants.length > 0
        ? 'Who did you sell it to?'
        : 'No community chats found. Did you sell it outside?',
      buttons
    );
  };

  const confirmSold = async (buyerId) => {
    setLoading(true);
    try {
      await AppwriteService.markAsSold(listing.id, listing.sellerId, listing.title);
      await refreshPoints(currentUser.id);
      await refreshBadges(currentUser.id);
      setStatus('sold');
      Alert.alert('🎉 Sold!', 'You earned 20 points for selling!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    const REASONS = ['Spam or misleading', 'Inappropriate content', 'Counterfeit item', 'Scam or fraud', 'Other'];
    Alert.alert('Report Listing', 'Why are you reporting this listing?',
      REASONS.map(r => ({
        text: r,
        onPress: async () => {
          try {
            await AppwriteService.reportListing(currentUser.id, listing.id, listing.sellerId, r);
            Alert.alert('Reported', 'Thanks for keeping the community safe. We\'ll review this listing.');
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const handleDonate = async () => {
    Alert.alert('Mark as Donated', 'You\'ll earn 25 points for donating!', [
      {
        text: 'Confirm',
        onPress: async () => {
          setLoading(true);
          try {
            await AppwriteService.markAsDonated(listing.id, listing.sellerId, listing.title);
            await refreshPoints(currentUser.id);
            await refreshBadges(currentUser.id);
            setStatus('donated');
            Alert.alert('🎉 Donated!', 'You earned 25 points for donating!');
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Floating title header that appears on scroll */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity, paddingTop: insets.top }]}>
        <Text style={styles.floatingTitle} numberOfLines={1}>{listing.title}</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Parallax hero image */}
        <View style={styles.imageContainer}>
          {listing.imageUrl ? (
            <Animated.Image
              source={{ uri: listing.imageUrl }}
              style={[styles.image, { transform: [{ translateY: imageTranslate }, { scale: imageScale }] }]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}><Text style={{ fontSize: 60 }}>🖼</Text></View>
          )}
        </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>
            {listing.price === 0 ? 'Free' : `₹${Math.round(listing.price)}`}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.catBadge}><Text style={styles.catText}>{listing.category}</Text></View>
          {listing.condition ? <View style={styles.condBadge}><Text style={styles.condText}>{listing.condition}</Text></View> : null}
          {isBoosted && <View style={styles.boostedBadge}><Text style={styles.boostedText}>🚀 Boosted</Text></View>}
          {listing.isAnonymous && <View style={styles.anonBadge}><Text style={styles.anonText}>🕵️ Anonymous</Text></View>}
          {status !== 'active' && (
            <View style={[styles.statusBadge, status === 'sold' ? styles.soldBadge : styles.donatedBadge]}>
              <Text style={styles.statusText}>{status === 'sold' ? '✅ Sold' : '🎁 Donated'}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {/* Price history */}
        <PriceHistoryChart history={listing.priceHistory} currentPrice={listing.price} />

        <TouchableOpacity style={styles.sellerCard} onPress={() => navigation.navigate('SellerProfile', { sellerId: listing.sellerId, sellerName: listing.sellerName })}>
          <View style={styles.avatar}><Text style={{ fontSize: 20 }}>👤</Text></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              {listing.isSellerVerified && (
                <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
              )}
            </View>
            <Text style={styles.sellerSub}>Tap to view all listings</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Points info banner */}
        <View style={styles.pointsBanner}>
          <Text style={styles.pointsTitle}>🏆 Earn Points</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsItem}>📦 Post listing</Text>
            <Text style={styles.pointsVal}>+10 pts</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsItem}>💰 Sell item</Text>
            <Text style={styles.pointsVal}>+20 pts</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsItem}>🛒 Buy item</Text>
            <Text style={styles.pointsVal}>+15 pts</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsItem}>🎁 Donate item</Text>
            <Text style={styles.pointsVal}>+25 pts</Text>
          </View>
        </View>

        {loading && <ActivityIndicator color="#3A3A3A" style={{ marginTop: 16 }} />}

        {isSeller && status === 'active' && !loading && (
          <View style={styles.sellerActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditListing', { listing })}>
              <Text style={styles.editBtnText}>✏️ Edit Listing</Text>
            </TouchableOpacity>
            {!isBoosted && (
              <TouchableOpacity style={styles.boostBtn} onPress={handleBoost}>
                <Text style={styles.boostBtnText}>🚀 Boost Listing (50 pts)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.soldBtn} onPress={handleMarkSold}>
              <Text style={styles.soldBtnText}>💰 Mark as Sold (+20 pts)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
              <Text style={styles.donateBtnText}>🎁 Mark as Donated (+25 pts)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Delete Listing</Text>
            </TouchableOpacity>
          </View>
        )}

        {isSeller && status !== 'active' && !loading && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑 Delete Listing</Text>
          </TouchableOpacity>
        )}

        {!isSeller && status === 'active' && (
          <View style={styles.buyerActions}>
            {existingOffer ? (
              <View style={styles.offerStatusBox}>
                <Text style={styles.offerStatusLabel}>Your offer</Text>
                <Text style={styles.offerStatusValue}>₹{Math.round(existingOffer.amount)} • {existingOffer.status === 'pending' ? 'Pending' : existingOffer.status === 'accepted' ? 'Accepted' : existingOffer.status === 'rejected' ? 'Rejected' : 'Canceled'}</Text>
                {existingOffer.status === 'pending' && (
                  <TouchableOpacity style={styles.cancelOfferBtn} onPress={handleCancelOffer} disabled={loading}>
                    <Text style={styles.cancelOfferText}>Cancel offer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <TouchableOpacity style={styles.contactBtn} onPress={() => navigation.navigate('Chat', { listing, sellerName: listing.sellerName })}>
              <Text style={styles.contactBtnText}>💬 Contact Seller</Text>
            </TouchableOpacity>
            {existingOffer?.status !== 'accepted' && (
              <TouchableOpacity style={styles.offerBtn} onPress={() => setShowOfferInput(p => !p)}>
                <Text style={styles.offerBtnText}>{existingOffer?.status === 'pending' ? '✏️ Update Offer' : '🤝 Make Offer'}</Text>
              </TouchableOpacity>
            )}
            {showOfferInput && (
              <View style={styles.offerInputRow}>
                <TextInput
                  style={styles.offerInput}
                  placeholder={`Offer amount (listed: ₹${Math.round(listing.price)})`}
                  placeholderTextColor="#aaa"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.sendOfferBtn} onPress={handleMakeOffer} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendOfferText}>{existingOffer?.status === 'pending' ? 'Update' : 'Send'}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {status !== 'active' && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedText}>This listing is no longer available</Text>
          </View>
        )}

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>Similar in {listing.category}</Text>
            <FlatList
              horizontal
              data={similarListings}
              keyExtractor={l => l.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarStrip}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.similarCard}
                  onPress={() => navigation.replace('ListingDetail', { listing: item })}
                  activeOpacity={0.88}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.similarImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.similarImg, styles.similarImgPlaceholder]}>
                      <Text style={{ fontSize: 24 }}>🖼</Text>
                    </View>
                  )}
                  <View style={styles.similarInfo}>
                    <Text style={styles.similarItemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.similarItemPrice}>{item.price === 0 ? 'Free' : `₹${Math.round(item.price)}`}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </Animated.ScrollView>
    </View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  imageContainer: { height: 300, overflow: 'hidden' },
  image: { width: '100%', height: 340 },
  imagePlaceholder: { width: '100%', height: 300, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center' },
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: C.bg, paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  floatingTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
  body: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#3A3A3A', marginRight: 8 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#6B8F71' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  catBadge: { backgroundColor: '#EAE4DC', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontSize: 12, color: '#3A3A3A' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  soldBadge: { backgroundColor: '#D6F0E0' },
  donatedBadge: { backgroundColor: '#F0D6E4' },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionLabel: { fontWeight: '600', fontSize: 15, marginTop: 20, marginBottom: 6 },
  description: { color: '#555', lineHeight: 22 },
  sellerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontWeight: '600', fontSize: 14 },
  sellerSub: { color: '#aaa', fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22, color: '#aaa' },
  pointsBanner: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 20 },
  pointsTitle: { fontWeight: '700', fontSize: 14, marginBottom: 10, color: '#3A3A3A' },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pointsItem: { fontSize: 13, color: '#555' },
  pointsVal: { fontSize: 13, fontWeight: '600', color: '#6B8F71' },
  condBadge: { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  condText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  anonBadge: { backgroundColor: '#F3E5F5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  anonText: { fontSize: 12, fontWeight: '600', color: '#6A1B9A' },
  boostedBadge: { backgroundColor: '#FFF3CD', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  boostedText: { fontSize: 12, fontWeight: '600', color: '#856404' },
  boostBtn: { backgroundColor: '#FFF3CD', borderRadius: 12, padding: 14, alignItems: 'center' },
  boostBtnText: { color: '#856404', fontSize: 15, fontWeight: '600' },
  buyerActions: { marginTop: 24, marginBottom: 40, gap: 10 },
  offerBtn: { backgroundColor: '#EAE4DC', borderRadius: 12, padding: 14, alignItems: 'center' },
  offerBtnText: { color: '#3A3A3A', fontSize: 15, fontWeight: '600' },
  offerInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  offerInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#3A3A3A' },
  sendOfferBtn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, paddingHorizontal: 20 },
  sendOfferText: { color: '#fff', fontWeight: '600' },
  offerStatusBox: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  offerStatusLabel: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '600' },
  offerStatusValue: { fontSize: 16, fontWeight: '700', color: '#3A3A3A' },
  cancelOfferBtn: { marginTop: 8, backgroundColor: '#FDE8E8', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' },
  cancelOfferText: { color: '#C0392B', fontWeight: '700' },
  editBtn: { backgroundColor: '#EAE4DC', borderRadius: 12, padding: 14, alignItems: 'center' },
  editBtnText: { color: '#3A3A3A', fontSize: 15, fontWeight: '600' },
  soldBtn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, alignItems: 'center' },
  soldBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  donateBtn: { backgroundColor: '#F0D6E4', borderRadius: 12, padding: 14, alignItems: 'center' },
  donateBtnText: { color: '#3A3A3A', fontSize: 15, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FDE8E8', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  deleteBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '600' },
  contactBtn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  closedBanner: { backgroundColor: '#EAE4DC', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  closedText: { color: '#888', fontSize: 14 },
  similarSection: { marginTop: 28, marginBottom: 40 },
  similarTitle: { fontSize: 16, fontWeight: '800', color: '#3A3A3A', marginBottom: 14 },
  similarStrip: { gap: 12 },
  similarCard: { width: 140, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', ...S.sm },
  similarImg: { width: '100%', height: 100 },
  similarImgPlaceholder: { backgroundColor: '#EAE4DC', alignItems: 'center', justifyContent: 'center' },
  similarInfo: { padding: 10 },
  similarItemTitle: { fontSize: 12, fontWeight: '600', color: '#3A3A3A', lineHeight: 16, marginBottom: 4 },
  similarItemPrice: { fontSize: 13, fontWeight: '800', color: '#6B8F71' },
});
