import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../../context/AppContext';
import ListingCard from '../../components/ListingCard';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const ACTIONS = [
  { icon: '✏️', label: 'Edit',    screen: 'EditProfile' },
  { icon: '📋', label: 'History', screen: 'TransactionHistory' },
  { icon: '🏅', label: 'Badges',  screen: 'Badges' },
  { icon: '🏆', label: 'Ranks',   screen: 'Leaderboard' },
  { icon: '🤝', label: 'Offers',  screen: 'Offers' },
  { icon: '🎡', label: 'Spin',    screen: 'SpinWheel' },
];

// Animated counter hook
function useCounter(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));

  return () => anim.removeListener(listener);
  }, [target]);
  return display;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentUser, selectedCommunity, listings, logout, points, streak } = useAppState();
  const { C } = useTheme();
  const styles = getStyles(C, R, S);
  const myListings = listings.filter(l => l.sellerId === currentUser?.id);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Streak pulse
  const pulsAnim = useRef(new Animated.Value(1)).current;

  // Animated counters
  const animPoints = useCounter(points);
  const animListings = useCounter(myListings.length);

  const level = points < 50 ? 'Newcomer' : points < 150 ? 'Trader' : points < 300 ? 'Pro Seller' : 'Legend';
  const levelEmoji = points < 50 ? '🌱' : points < 150 ? '⭐' : points < 300 ? '🔥' : '👑';
  const nextLevel = points < 50 ? 50 : points < 150 ? 150 : points < 300 ? 300 : 300;
  const progress = Math.min((points / nextLevel) * 100, 100);

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(streakAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    // Progress bar fill
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      delay: 400,
      useNativeDriver: false,
    }).start();

    // Streak pulse loop
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulsAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [points, streak]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const makeEntrance = (anim, delay = 0) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={myListings}
        keyExtractor={l => l.id}
        numColumns={2}
        contentContainerStyle={styles.content}
        columnWrapperStyle={myListings.length > 0 ? styles.row : null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <Animated.View style={[styles.topBar, makeEntrance(headerAnim)]}>
              <Text style={styles.screenTitle}>Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
                  <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.logoutIcon}>🚪</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Profile card */}
            <Animated.View style={[styles.profileCard, makeEntrance(cardAnim)]}>
              <View style={styles.profileTop}>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.avatarWrap}>
                  {currentUser?.avatarUrl ? (
                    <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={{ fontSize: 36 }}>👤</Text>
                    </View>
                  )}
                  <View style={styles.editDot} />
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={styles.name} numberOfLines={1}>{currentUser?.name ?? 'Your Name'}</Text>
                  <Text style={styles.email} numberOfLines={1}>{currentUser?.email ?? ''}</Text>
                  {currentUser?.bio ? <Text style={styles.bio} numberOfLines={2}>{currentUser.bio}</Text> : null}
                  <View style={styles.communityTag}>
                    <Text style={styles.communityTagText}>📍 {selectedCommunity?.name ?? 'No community'}</Text>
                  </View>
                </View>
              </View>

              {/* Animated stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{animListings}</Text>
                  <Text style={styles.statLabel}>Listings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{animPoints}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{levelEmoji}</Text>
                  <Text style={styles.statLabel}>{level}</Text>
                </View>
              </View>

              {/* Animated progress bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressBg}>
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>
                <Text style={styles.progressHint}>
                  {points < 300 ? `${nextLevel - points} pts to ${level === 'Newcomer' ? 'Trader' : level === 'Trader' ? 'Pro Seller' : 'Legend'}` : '👑 Max level!'}
                </Text>
              </View>
            </Animated.View>

            {/* Streak card with pulse */}
            {streak > 0 && (
              <Animated.View style={[styles.streakCard, makeEntrance(streakAnim), { transform: [{ scale: pulsAnim }] }]}>
                <View style={styles.streakLeft}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <View>
                    <Text style={styles.streakCount}>{streak} day streak</Text>
                    <Text style={styles.streakSub}>Keep it up — come back tomorrow!</Text>
                  </View>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeText}>
                    {streak >= 30 ? '👑' : streak >= 14 ? '⚡' : streak >= 7 ? '🌟' : '🌱'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Actions with stagger */}
            <View style={styles.actionsRow}>
              {ACTIONS.map((a, i) => {
                const btnAnim = useRef(new Animated.Value(1)).current;
                const onPressIn = () => Animated.spring(btnAnim, { toValue: 0.92, tension: 300, friction: 8, useNativeDriver: true }).start();
                const onPressOut = () => Animated.spring(btnAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
                return (
                  <Animated.View key={a.screen} style={{ flex: 1, transform: [{ scale: btnAnim }] }}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate(a.screen)}
                      onPressIn={onPressIn}
                      onPressOut={onPressOut}
                      activeOpacity={1}
                    >
                      <Text style={styles.actionIcon}>{a.icon}</Text>
                      <Text style={styles.actionLabel}>{a.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* My listings header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <Text style={styles.sectionCount}>{myListings.length}</Text>
            </View>
            {myListings.length === 0 && (
              <View style={styles.emptyListings}>
                <Text style={{ fontSize: 40 }}>📦</Text>
                <Text style={styles.emptyText}>No listings yet</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateListing')}>
                  <Text style={styles.createBtnText}>+ Create your first listing</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardWrap}>
            <ListingCard listing={item} index={index} onPress={() => navigation.navigate('ListingDetail', { listing: item })} />
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { backgroundColor: C.card, borderRadius: R.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...S.sm },
  settingsIcon: { fontSize: 18 },
  logoutBtn: { backgroundColor: C.card, borderRadius: R.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...S.sm },
  logoutIcon: { fontSize: 18 },
  profileCard: { backgroundColor: C.card, borderRadius: R.xl, padding: 20, marginBottom: 16, ...S.md },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarPlaceholder: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  editDot: { position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: C.primary, borderWidth: 2, borderColor: C.card },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  email: { fontSize: 12, color: C.muted, marginTop: 3 },
  bio: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic', lineHeight: 17 },
  communityTag: { backgroundColor: C.bg, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  communityTagText: { fontSize: 11, fontWeight: '600', color: C.muted },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: R.md, padding: 16, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: C.primary },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 3 },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },
  progressWrap: { gap: 6 },
  progressBg: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: C.green, borderRadius: 4 },
  progressHint: { fontSize: 11, color: C.muted },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  actionBtn: { backgroundColor: C.card, borderRadius: R.md, paddingVertical: 14, alignItems: 'center', ...S.sm },
  actionIcon: { fontSize: 20, marginBottom: 5 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: C.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.primary },
  sectionCount: { fontSize: 13, fontWeight: '700', color: C.muted, backgroundColor: C.card, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 3 },
  emptyListings: { alignItems: 'center', paddingVertical: 32, backgroundColor: C.card, borderRadius: R.lg, marginBottom: 16 },
  emptyText: { fontSize: 14, color: C.muted, marginTop: 10, marginBottom: 16 },
  createBtn: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: 20, paddingVertical: 10 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  streakCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF3E0', borderRadius: R.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFE0B2' },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakFire: { fontSize: 28 },
  streakCount: { fontSize: 15, fontWeight: '800', color: '#E65100' },
  streakSub: { fontSize: 11, color: '#BF360C', marginTop: 2 },
  streakBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFE0B2', alignItems: 'center', justifyContent: 'center' },
  streakBadgeText: { fontSize: 20 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  cardWrap: { width: '48.5%' },
});
