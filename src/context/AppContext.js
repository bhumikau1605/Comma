import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AppwriteService } from '../services/appwrite';

const DEFAULT_COMMUNITIES = [
  { id: 'c1', name: 'IIT Delhi', description: 'Campus marketplace for IIT Delhi students', type: 'college', memberCount: 1200, inviteCode: 'IITDEL' },
  { id: 'c2', name: 'Koramangala', description: 'Buy & sell in Koramangala, Bangalore', type: 'locality', memberCount: 850, inviteCode: 'KORMAN' },
  { id: 'c3', name: 'Photography Lovers', description: 'Gear, prints & more for photo enthusiasts', type: 'hobby', memberCount: 430, inviteCode: 'PHOTO1' },
  { id: 'c4', name: 'BITS Pilani', description: 'Campus marketplace for BITS Pilani', type: 'college', memberCount: 980, inviteCode: 'BITSPIL' },
  { id: 'c5', name: 'Indiranagar', description: 'Local marketplace for Indiranagar residents', type: 'locality', memberCount: 620, inviteCode: 'INDNGR' },
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [followFeed, setFollowFeed] = useState([]);
  const [loadingFollowFeed, setLoadingFollowFeed] = useState(false);
  const [blockedIds, setBlockedIds] = useState(new Set());

  const loadCommunities = useCallback(async (userId) => {
    try {
      const userCommunities = await AppwriteService.getUserCommunities(userId);
      const dbCommunities = await AppwriteService.fetchCommunities(userId);
      const merged = [...DEFAULT_COMMUNITIES];
      dbCommunities.forEach(c => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });
      setCommunities(merged);
    } catch {
      setCommunities(DEFAULT_COMMUNITIES);
    }
  }, []);

  const login = useCallback(async (user) => {
    setCurrentUser(user);
    const p = await AppwriteService.getPoints(user.id);
    setPoints(p);
    const badges = await AppwriteService.checkAndAwardBadges(user.id);
    const userWithBadges = { ...user, badges };
    setCurrentUser(userWithBadges);
    loadCommunities(user.id);

    // Load blocked users
    const blocked = await AppwriteService.getBlockedIds(user.id);
    setBlockedIds(new Set(blocked));

    // Daily streak check-in
    const streakData = await AppwriteService.checkAndUpdateStreak(user.id);
    setStreak(streakData.streak);
    if (!streakData.alreadyCheckedIn && streakData.pointsEarned > 0) {
      // Refresh points after streak bonus
      const newPoints = await AppwriteService.getPoints(user.id);
      setPoints(newPoints);
      setTimeout(() => {
        Alert.alert(
          `🔥 Day ${streakData.streak} Streak!`,
          `You earned +${streakData.pointsEarned} pts for checking in today!${streakData.streak % 7 === 0 ? '\n\n🎉 7-day bonus!' : ''}`
        );
      }, 1500);
    }
  }, [loadCommunities]);

  const refreshPoints = useCallback(async (userId) => {
    const p = await AppwriteService.getPoints(userId);
    setPoints(p);
  }, []);

  const refreshBadges = useCallback(async (userId) => {
    try {
      const badges = await AppwriteService.checkAndAwardBadges(userId);
      setCurrentUser(prev => prev ? { ...prev, badges } : null);
    } catch (e) {
      console.error('Error refreshing badges:', e);
    }
  }, []);

  const refreshUserData = useCallback(async (userId) => {
    try {
      const user = await AppwriteService.getCurrentUser();
      if (user) {
        const p = await AppwriteService.getPoints(userId);
        setCurrentUser(user);
        setPoints(p);
      }
    } catch (e) {
      console.error('Error refreshing user data:', e);
    }
  }, []);

  const updateProfile = useCallback(async ({ name, bio, avatarUri, isAvailable, notificationsEnabled }) => {
    const updates = await AppwriteService.updateProfile(currentUser.id, { name, bio, avatarUri, isAvailable, notificationsEnabled });
    setCurrentUser(prev => ({
      ...prev,
      name: updates.name ?? prev.name,
      bio: updates.bio ?? prev.bio,
      avatarUrl: updates.avatar_url ?? prev.avatarUrl,
      isAvailable: updates.is_available ?? prev.isAvailable,
      notificationsEnabled: updates.notifications_enabled ?? prev.notificationsEnabled,
    }));
  }, [currentUser]);

  const logout = useCallback(async () => {
    await AppwriteService.signOut();
    setCurrentUser(null);
    setSelectedCommunity(null);
    setListings([]);
    setPoints(0);
    setStreak(0);
    setFollowFeed([]);
    setBlockedIds(new Set());
    setCommunities(DEFAULT_COMMUNITIES);
  }, []);

  const loadListings = useCallback(async (communityId) => {
    setLoadingListings(true);
    try {
      const data = await AppwriteService.fetchListings(communityId);
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const selectCommunity = useCallback(async (community) => {
    setSelectedCommunity(community);
    await loadListings(community.id);
  }, [loadListings]);

  const loadFollowFeed = useCallback(async () => {
    if (!currentUser) return;
    setLoadingFollowFeed(true);
    try {
      const data = await AppwriteService.fetchFollowFeed(currentUser.id, selectedCommunity?.id);
      setFollowFeed(data);
    } catch {
      setFollowFeed([]);
    } finally {
      setLoadingFollowFeed(false);
    }
  }, [currentUser, selectedCommunity]);

  const addListing = useCallback(async (listing) => {
    try {
      await AppwriteService.createListing(listing);
      await loadListings(listing.communityId);
      if (currentUser?.id) {
        await refreshPoints(currentUser.id);
        await refreshBadges(currentUser.id);
      }
    } catch {
      setListings(prev => [listing, ...prev]);
    }
  }, [loadListings, currentUser?.id, refreshPoints, refreshBadges]);

  const deleteListing = useCallback(async (listingId) => {
    await AppwriteService.deleteListing(listingId);
    setListings(prev => prev.filter(l => l.id !== listingId));
  }, []);

  const toggleSave = useCallback((id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isSaved = useCallback((id) => savedIds.has(id), [savedIds]);

  // Block / unblock
  const blockUser = useCallback(async (blockedId) => {
    if (!currentUser) return;
    await AppwriteService.blockUser(currentUser.id, blockedId);
    setBlockedIds(prev => new Set([...prev, blockedId]));
  }, [currentUser]);

  const unblockUser = useCallback(async (blockedId) => {
    if (!currentUser) return;
    await AppwriteService.unblockUser(currentUser.id, blockedId);
    setBlockedIds(prev => { const next = new Set(prev); next.delete(blockedId); return next; });
  }, [currentUser]);

  const isBlocked = useCallback((userId) => blockedIds.has(userId), [blockedIds]);

  // Filter out sold/donated listings after grace period AND blocked users
  const GRACE_MS = 60 * 60 * 1000;
  const visibleListings = listings.filter(l => {
    if (blockedIds.has(l.sellerId)) return false;
    if (l.status === 'active') return true;
    const updatedAt = new Date(l.updatedAt ?? l.createdAt).getTime();
    return Date.now() - updatedAt < GRACE_MS;
  });

  const savedListings = visibleListings.filter(l => savedIds.has(l.id));

  return (
    <AppContext.Provider value={{
      currentUser, isLoggedIn: !!currentUser,
      selectedCommunity, communities,
      listings: visibleListings, loadingListings, savedIds, savedListings,
      points, refreshPoints, refreshBadges, refreshUserData, updateProfile, loadCommunities,
      streak,
      followFeed, loadingFollowFeed, loadFollowFeed,
      blockedIds, blockUser, unblockUser, isBlocked,
      login, logout, selectCommunity, loadListings, addListing, deleteListing, toggleSave, isSaved,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppState = () => useContext(AppContext);
