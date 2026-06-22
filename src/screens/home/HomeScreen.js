import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Pressable, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppState } from '../../context/AppContext';
import ListingCard from '../../components/ListingCard';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const CATEGORIES = [
  { key: 'All',         icon: '🏠' },
  { key: 'Electronics', icon: '📱' },
  { key: 'Furniture',   icon: '🪑' },
  { key: 'Books',       icon: '📚' },
  { key: 'Clothing',    icon: '👕' },
  { key: 'Sports',      icon: '⚽' },
  { key: 'Vehicles',    icon: '🚗' },
  { key: 'Music',       icon: '🎸' },
  { key: 'Art',         icon: '🎨' },
  { key: 'Toys',        icon: '🧸' },
  { key: 'Kitchen',     icon: '🍳' },
  { key: 'Garden',      icon: '🌱' },
  { key: 'Stationery',  icon: '✏️' },
  { key: 'General',     icon: '🛍' },
  { key: 'Other',       icon: '📦' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first', icon: '🕐' },
  { key: 'oldest', label: 'Oldest first', icon: '🕰' },
  { key: 'price_asc', label: 'Price: Low to High', icon: '📈' },
  { key: 'price_desc', label: 'Price: High to Low', icon: '📉' },
];

const HOME_TABS = [
  { key: 'browse', label: 'Browse' },
  { key: 'following', label: 'Following' },
];

// Days until expiry
function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Small horizontal card for expiring soon strip
function ExpiringCard({ listing, onPress }) {
  const { C } = useTheme();
  const days = daysUntilExpiry(listing.expiresAt);
  const styles = getStyles(C, R, S);

  return (
    <TouchableOpacity style={styles.expiringCard} onPress={onPress} activeOpacity={0.88}>
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.expiringImg} resizeMode="cover" />
      ) : (
        <View style={[styles.expiringImg, styles.expiringImgPlaceholder]}>
          <Text style={{ fontSize: 22 }}>🖼</Text>
        </View>
      )}
      <View style={styles.expiringInfo}>
        <Text style={styles.expiringTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.expiringPrice}>{listing.price === 0 ? 'Free' : `₹${Math.round(listing.price)}`}</Text>
        <View style={styles.expiringBadge}>
          <Text style={styles.expiringBadgeText}>
            {days <= 0 ? 'Expires today!' : `${days}d left`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { listings, loadingListings, selectedCommunity, currentUser, followFeed, loadingFollowFeed, loadFollowFeed } = useAppState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  // Load follow feed when tab is focused or switched to following
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'following') loadFollowFeed();
    }, [activeTab, loadFollowFeed])
  );

  useEffect(() => {
    if (activeTab === 'following') loadFollowFeed();
  }, [activeTab]);

  // Weekly digest stats
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekListings = listings.filter(l => new Date(l.createdAt).getTime() > oneWeekAgo);
  const weekDonations = listings.filter(l => l.status === 'donated' && new Date(l.updatedAt ?? l.createdAt).getTime() > oneWeekAgo).length;
  const weekFree = weekListings.filter(l => l.price === 0).length;
  const showDigest = weekListings.length > 0;
  const expiringSoon = listings.filter(l => {
    if (l.status !== 'active') return false;
    const days = daysUntilExpiry(l.expiresAt);
    return days !== null && days >= 0 && days <= 5;
  }).sort((a, b) => daysUntilExpiry(a.expiresAt) - daysUntilExpiry(b.expiresAt));

  const filtered = listings
    .filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !search || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
      const matchCat = category === 'All' || l.category === category;
      const matchMin = !minPrice || l.price >= parseFloat(minPrice);
      const matchMax = !maxPrice || l.price <= parseFloat(maxPrice);
      return matchSearch && matchCat && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const activeFilters = (minPrice || maxPrice ? 1 : 0) + (sort !== 'newest' ? 1 : 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const ListHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greetingWrap}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.greetingName}>{currentUser?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('CommunitySelect')} activeOpacity={0.8}>
          <Text style={styles.switchIcon}>👥</Text>
          <View>
            <Text style={styles.switchLabel}>Community</Text>
            <Text style={styles.switchName} numberOfLines={1}>{selectedCommunity?.name ?? 'All'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Weekly digest */}
      {showDigest && activeTab === 'browse' && (
        <View style={styles.digestCard}>
          <Text style={styles.digestTitle}>📊 This week in {selectedCommunity?.name ?? 'your community'}</Text>
          <View style={styles.digestRow}>
            <View style={styles.digestStat}>
              <Text style={styles.digestVal}>{weekListings.length}</Text>
              <Text style={styles.digestLabel}>new listings</Text>
            </View>
            <View style={styles.digestDivider} />
            <View style={styles.digestStat}>
              <Text style={styles.digestVal}>{weekDonations}</Text>
              <Text style={styles.digestLabel}>donated</Text>
            </View>
            <View style={styles.digestDivider} />
            <View style={styles.digestStat}>
              <Text style={styles.digestVal}>{weekFree}</Text>
              <Text style={styles.digestLabel}>free items</Text>
            </View>
          </View>
        </View>
      )}

      {/* Home tabs */}
      <View style={styles.tabRow}>
        {HOME_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'browse' && (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search listings..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={styles.clearIcon}>✕</Text></TouchableOpacity> : null}
            </View>
            <TouchableOpacity style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]} onPress={() => setShowFilter(true)} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
              {activeFilters > 0 && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>

          {/* Expiring soon strip */}
          {expiringSoon.length > 0 && (
            <View style={styles.expiringSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>⏳ Expiring Soon</Text>
                <Text style={styles.sectionHeaderSub}>{expiringSoon.length} listing{expiringSoon.length !== 1 ? 's' : ''}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.expiringStrip}>
                {expiringSoon.map(item => (
                  <ExpiringCard
                    key={item.id}
                    listing={item}
                    onPress={() => navigation.navigate('ListingDetail', { listing: item })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Categories */}
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={c => c.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cats}
            style={{ marginBottom: 20 }}
            renderItem={({ item }) => {
              const active = category === item.key;
              return (
                <TouchableOpacity
                  style={[styles.catBtn, active && styles.catBtnActive]}
                  onPress={() => setCategory(item.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catIcon}>{item.icon}</Text>
                  <Text style={[styles.catText, active && styles.catTextActive]}>{item.key}</Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Count row */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.countSub}>{category !== 'All' ? `in ${category}` : 'across all categories'}</Text>
          </View>
        </>
      )}

      {activeTab === 'following' && (
        <View style={styles.followingHeader}>
          <Text style={styles.followingTitle}>From sellers you follow</Text>
          <Text style={styles.followingSub}>
            {followFeed.length > 0 ? `${followFeed.length} new listing${followFeed.length !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
      )}
    </View>
  );

  // ── Following tab ──────────────────────────────────────────────────────────
  if (activeTab === 'following') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {loadingFollowFeed ? (
          <View style={styles.center}>
            <ListHeader />
            <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 40 }} />
          </View>
        ) : followFeed.length === 0 ? (
          <FlatList
            key="following-empty"
            data={[]}
            ListHeaderComponent={<ListHeader />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={{ fontSize: 52 }}>👥</Text>
                <Text style={styles.emptyTitle}>No listings yet</Text>
                <Text style={styles.emptySub}>Follow sellers to see their new listings here</Text>
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        ) : (
          <FlatList
            key="following-grid"
            data={followFeed}
            keyExtractor={l => l.id}
            numColumns={2}
            ListHeaderComponent={<ListHeader />}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ListingCard listing={item} onPress={() => navigation.navigate('ListingDetail', { listing: item })} />
              </View>
            )}
          />
        )}
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => navigation.navigate('CreateListing')} activeOpacity={0.9}>
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Browse tab ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loadingListings ? (
        <View style={styles.center}>
          <ListHeader />
          <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 40 }} />
        </View>
      ) : filtered.length === 0 ? (
        <FlatList
          key="browse-empty"
          data={[]}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 52 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      ) : (
        <FlatList
          key="browse-grid"
          data={filtered}
          keyExtractor={l => l.id}
          numColumns={2}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListingCard listing={item} onPress={() => navigation.navigate('ListingDetail', { listing: item })} />
            </View>
          )}
        />
      )}

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => navigation.navigate('CreateListing')} activeOpacity={0.9}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalBg} onPress={() => setShowFilter(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter & Sort</Text>
            <Text style={styles.sheetLabel}>Sort by</Text>
            <View style={styles.sortGrid}>
              {SORT_OPTIONS.map(o => (
                <TouchableOpacity key={o.key} style={[styles.sortChip, sort === o.key && styles.sortChipActive]} onPress={() => setSort(o.key)}>
                  <Text>{o.icon}</Text>
                  <Text style={[styles.sortChipText, sort === o.key && styles.sortChipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sheetLabel}>Price Range (₹)</Text>
            <View style={styles.priceRow}>
              <TextInput style={styles.priceInput} placeholder="Min" placeholderTextColor={C.muted} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
              <Text style={{ color: C.muted, paddingHorizontal: 10 }}>—</Text>
              <TextInput style={styles.priceInput} placeholder="Max" placeholderTextColor={C.muted} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
            </View>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setMinPrice(''); setMaxPrice(''); setSort('newest'); }}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilter(false)}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1 },

  // Weekly digest
  digestCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: C.primary, borderRadius: R.lg, padding: 16 },
  digestTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 12, letterSpacing: 0.3 },
  digestRow: { flexDirection: 'row', alignItems: 'center' },
  digestStat: { flex: 1, alignItems: 'center' },
  digestVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
  digestLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  digestDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: R.md, padding: 4, ...S.sm },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: R.sm },
  tabBtnActive: { backgroundColor: C.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  tabBtnTextActive: { color: '#fff' },

  // Greeting
  greetingWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 14, color: C.muted, fontWeight: '500' },
  greetingName: { fontSize: 24, fontWeight: '800', color: C.primary, letterSpacing: -0.5, marginTop: 2 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.lg, paddingHorizontal: 12, paddingVertical: 10, gap: 8, maxWidth: 160, ...S.sm },
  switchIcon: { fontSize: 20 },
  switchLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  switchName: { fontSize: 13, fontWeight: '700', color: C.primary, maxWidth: 100 },

  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 10, alignItems: 'center' },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, paddingHorizontal: 14, height: 48, ...S.sm },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.primary },
  clearIcon: { color: C.muted, fontSize: 14, padding: 4 },
  filterBtn: { backgroundColor: C.card, borderRadius: R.md, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', position: 'relative', ...S.sm },
  filterBtnActive: { backgroundColor: C.primary },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },

  // Expiring soon
  expiringSectionWrap: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '800', color: C.primary },
  sectionHeaderSub: { fontSize: 12, color: C.muted },
  expiringStrip: { paddingHorizontal: 16, gap: 10 },
  expiringCard: { width: 140, backgroundColor: C.card, borderRadius: R.lg, overflow: 'hidden', ...S.sm },
  expiringImg: { width: '100%', height: 90 },
  expiringImgPlaceholder: { backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  expiringInfo: { padding: 10 },
  expiringTitle: { fontSize: 12, fontWeight: '700', color: C.primary, marginBottom: 3 },
  expiringPrice: { fontSize: 13, fontWeight: '800', color: C.green, marginBottom: 6 },
  expiringBadge: { backgroundColor: '#FFF3E0', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  expiringBadgeText: { fontSize: 10, fontWeight: '700', color: '#E65100' },

  // Categories
  cats: { paddingHorizontal: 16, gap: 10 },
  catBtn: { alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10, minWidth: 72, ...S.sm },
  catBtnActive: { backgroundColor: C.primary },
  catIcon: { fontSize: 20, marginBottom: 4 },
  catText: { fontSize: 11, fontWeight: '600', color: C.muted },
  catTextActive: { color: '#fff' },

  // Count
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 20, marginBottom: 14 },
  countText: { fontSize: 16, fontWeight: '800', color: C.primary },
  countSub: { fontSize: 12, color: C.muted },

  // Following tab
  followingHeader: { paddingHorizontal: 20, marginBottom: 16 },
  followingTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
  followingSub: { fontSize: 12, color: C.muted, marginTop: 3 },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  gridRow: { justifyContent: 'space-between', marginBottom: 16 },
  cardWrap: { width: '48.5%' },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.primary, marginTop: 12 },
  emptySub: { fontSize: 13, color: C.muted, marginTop: 6 },

  // FAB
  fab: { position: 'absolute', right: 20, backgroundColor: C.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...S.lg },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },

  // Filter modal
  modalBg: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 24 },
  sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.primary, marginBottom: 20 },
  sheetLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10, gap: 6, ...S.sm },
  sortChipActive: { backgroundColor: C.primary },
  sortChipText: { fontSize: 13, fontWeight: '600', color: C.primary },
  sortChipTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  priceInput: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 14, fontSize: 15, color: C.primary, ...S.sm },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  resetBtn: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 15, alignItems: 'center', ...S.sm },
  resetBtnText: { color: C.primary, fontWeight: '700', fontSize: 15 },
  applyBtn: { flex: 2, backgroundColor: C.primary, borderRadius: R.md, padding: 15, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
