import { Client, Account, Databases, Storage, Query, ID } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setPlatform('com.comma.app');

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const LISTINGS_COL = process.env.EXPO_PUBLIC_APPWRITE_LISTINGS_COLLECTION_ID;
const PROFILES_COL = process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;
const MESSAGES_COL = process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID;
const TRANSACTIONS_COL = process.env.EXPO_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;
const REVIEWS_COL = process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID;
const FOLLOWS_COL = process.env.EXPO_PUBLIC_APPWRITE_FOLLOWS_COLLECTION_ID;
const OFFERS_COL = process.env.EXPO_PUBLIC_APPWRITE_OFFERS_COLLECTION_ID;
const COMMUNITIES_COL = process.env.EXPO_PUBLIC_APPWRITE_COMMUNITIES_COLLECTION_ID;
const REPORTS_COL = process.env.EXPO_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID;
const BLOCKS_COL = process.env.EXPO_PUBLIC_APPWRITE_BLOCKS_COLLECTION_ID;
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;

const buildUrl = (fileId) => {
  const ep = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const pid = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  return `${ep}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${pid}&mode=admin`;
};

export const AppwriteService = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async signUp(name, email, password) {
    const user = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    await databases.createDocument(DB_ID, PROFILES_COL, user.$id, { name, email, points: 0, badges: [], notifications_enabled: true });
    return { id: user.$id, name, email, bio: '', avatarUrl: '', notificationsEnabled: true, badges: [] };
  },

  async signIn(email, password) {
    try { await account.deleteSession('current'); } catch {}
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, user.$id);
    return {
      id: user.$id,
      name: profile.name || user.name || email.split('@')[0],
      email: user.email,
      bio: profile.bio ?? '',
      avatarUrl: profile.avatar_url ?? '',
      isAvailable: profile.is_available ?? true,
      notificationsEnabled: profile.notifications_enabled ?? true,
      badges: profile.badges ?? [],
      isVerified: profile.verification_status === 'verified',
      verificationStatus: profile.verification_status ?? 'none',
    };
  },

  async signOut() {
    await account.deleteSession('current');
  },

  async getCurrentUser() {
    try {
      const user = await account.get();
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, user.$id);
      return {
        id: user.$id,
        name: profile.name || user.name || user.email.split('@')[0],
        email: user.email,
        bio: profile.bio ?? '',
        avatarUrl: profile.avatar_url ?? '',
        isAvailable: profile.is_available ?? true,
        notificationsEnabled: profile.notifications_enabled ?? true,
        badges: profile.badges ?? [],
        isVerified: profile.verification_status === 'verified',
        verificationStatus: profile.verification_status ?? 'none',
      };
    } catch {
      return null;
    }
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  async updateProfile(userId, { name, bio, avatarUri, isAvailable, notificationsEnabled }) {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (isAvailable !== undefined) updates.is_available = isAvailable;
    if (notificationsEnabled !== undefined) updates.notifications_enabled = notificationsEnabled;
    if (avatarUri) {
      updates.avatar_url = await AppwriteService.uploadImage(avatarUri, `avatar_${userId}_${Date.now()}.jpg`);
    }
    await databases.updateDocument(DB_ID, PROFILES_COL, userId, updates);
    return updates;
  },

  // ── Listings ──────────────────────────────────────────────────────────────

  async fetchListings(communityId) {
    const queries = [Query.orderDesc('$createdAt')];
    if (communityId) queries.push(Query.equal('community_id', communityId));
    const res = await databases.listDocuments(DB_ID, LISTINGS_COL, queries);
    return res.documents.map(listingFromDoc);
  },

  async fetchSellerListings(sellerId) {
    const res = await databases.listDocuments(DB_ID, LISTINGS_COL, [
      Query.equal('seller_id', sellerId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents.map(listingFromDoc);
  },

  async createListing(listing) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const doc = await databases.createDocument(DB_ID, LISTINGS_COL, ID.unique(), {
      title: listing.isAnonymous ? 'Anonymous Listing' : listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      community_id: listing.communityId,
      seller_id: listing.sellerId,
      seller_name: listing.isAnonymous ? 'Anonymous' : listing.sellerName,
      image_url: listing.imageUrl,
      expires_at: expiresAt,
      condition: listing.condition ?? '',
      is_anonymous: listing.isAnonymous ?? false,
    });
    await AppwriteService.addPoints(listing.sellerId, 10);
    await AppwriteService.logTransaction(listing.sellerId, 'post', doc.$id, listing.title, 10);
    await AppwriteService.checkAndAwardBadges(listing.sellerId);
  },

  async updateListing(listingId, updates) {
    // Fetch current price to build history
    try {
      const doc = await databases.getDocument(DB_ID, LISTINGS_COL, listingId);
      const oldPrice = doc.price;
      const newPrice = updates.price;
      if (oldPrice !== newPrice) {
        const existing = JSON.parse(doc.price_history ?? '[]');
        const entry = { price: oldPrice, date: new Date().toISOString() };
        const history = [...existing, entry].slice(-10); // keep last 10
        await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, {
          title: updates.title,
          description: updates.description,
          price: updates.price,
          category: updates.category,
          price_history: JSON.stringify(history),
        });
        return;
      }
    } catch {}
    await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, {
      title: updates.title,
      description: updates.description,
      price: updates.price,
      category: updates.category,
    });
  },

  async deleteListing(listingId) {
    await databases.deleteDocument(DB_ID, LISTINGS_COL, listingId);
  },

  // ── Points ────────────────────────────────────────────────────────────────

  async getPoints(userId) {
    try {
      const doc = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      return doc.points ?? 0;
    } catch {
      return 0;
    }
  },

  async addPoints(userId, amount) {
    try {
      const doc = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      const current = doc.points ?? 0;
      await databases.updateDocument(DB_ID, PROFILES_COL, userId, { points: current + amount });
      return current + amount;
    } catch {
      return 0;
    }
  },

  async markAsSold(listingId, sellerId, listingTitle) {
    await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, { status: 'sold' });
    await AppwriteService.addPoints(sellerId, 20);
    await AppwriteService.logTransaction(sellerId, 'sell', listingId, listingTitle, 20);
    await AppwriteService.checkAndAwardBadges(sellerId);
  },

  async markAsDonated(listingId, sellerId, listingTitle) {
    await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, { status: 'donated' });
    await AppwriteService.addPoints(sellerId, 25);
    await AppwriteService.logTransaction(sellerId, 'donate', listingId, listingTitle, 25);
    await AppwriteService.checkAndAwardBadges(sellerId);
  },

  // ── Transactions ──────────────────────────────────────────────────────────

  async logTransaction(userId, type, listingId, listingTitle, pointsEarned) {
    try {
      await databases.createDocument(DB_ID, TRANSACTIONS_COL, ID.unique(), {
        user_id: userId,
        type,
        listing_id: listingId ?? 'none',
        listing_title: listingTitle ?? '',
        points_earned: pointsEarned,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[TX] Failed:', e.message);
    }
  },

  async fetchTransactions(userId) {
    const res = await databases.listDocuments(DB_ID, TRANSACTIONS_COL, [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents;
  },

  // ── Reviews ───────────────────────────────────────────────────────────────

  async submitReview(reviewerId, reviewerName, sellerId, listingId, rating, comment) {
    await databases.createDocument(DB_ID, REVIEWS_COL, ID.unique(), {
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      seller_id: sellerId,
      listing_id: listingId ?? 'general',
      rating,
      comment: comment ?? '',
    });
    await AppwriteService.checkAndAwardBadges(sellerId);
  },

  async fetchReviews(sellerId) {
    const res = await databases.listDocuments(DB_ID, REVIEWS_COL, [
      Query.equal('seller_id', sellerId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents;
  },

  async getAverageRating(sellerId) {
    const reviews = await AppwriteService.fetchReviews(sellerId);
    if (!reviews.length) return { average: 0, count: 0 };
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return { average: Math.round(avg * 10) / 10, count: reviews.length };
  },

  async hasReviewed(reviewerId, listingId) {
    if (!listingId) return false;
    const res = await databases.listDocuments(DB_ID, REVIEWS_COL, [
      Query.equal('reviewer_id', reviewerId),
      Query.equal('listing_id', listingId),
    ]);
    return res.documents.length > 0;
  },

  // ── Follows ───────────────────────────────────────────────────────────────

  async followSeller(followerId, followingId) {
    await databases.createDocument(DB_ID, FOLLOWS_COL, ID.unique(), {
      follower_id: followerId,
      following_id: followingId,
    });
  },

  async unfollowSeller(followerId, followingId) {
    const res = await databases.listDocuments(DB_ID, FOLLOWS_COL, [
      Query.equal('follower_id', followerId),
      Query.equal('following_id', followingId),
    ]);
    if (res.documents.length > 0) {
      await databases.deleteDocument(DB_ID, FOLLOWS_COL, res.documents[0].$id);
    }
  },

  async isFollowing(followerId, followingId) {
    const res = await databases.listDocuments(DB_ID, FOLLOWS_COL, [
      Query.equal('follower_id', followerId),
      Query.equal('following_id', followingId),
    ]);
    return res.documents.length > 0;
  },

  async getFollowerCount(userId) {
    const res = await databases.listDocuments(DB_ID, FOLLOWS_COL, [
      Query.equal('following_id', userId),
    ]);
    return res.total;
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────

  async fetchLeaderboard() {
    const res = await databases.listDocuments(DB_ID, PROFILES_COL, [
      Query.orderDesc('points'),
      Query.limit(20),
    ]);
    return res.documents;
  },

  // ── Badges ────────────────────────────────────────────────────────────────

  async checkAndAwardBadges(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      const points = profile.points ?? 0;
      const existing = profile.badges ?? [];
      const earned = [...existing];

      let txs = [];
      try {
        const txRes = await databases.listDocuments(DB_ID, TRANSACTIONS_COL, [
          Query.equal('user_id', userId),
          Query.limit(100),
        ]);
        txs = txRes.documents;
      } catch {}

      const sells     = txs.filter(t => t.type === 'sell').length;
      const donations = txs.filter(t => t.type === 'donate').length;
      const posts     = txs.filter(t => t.type === 'post').length;

      let reviewCount = 0;
      try {
        const reviewRes = await databases.listDocuments(DB_ID, REVIEWS_COL, [
          Query.equal('seller_id', userId),
          Query.limit(100),
        ]);
        reviewCount = reviewRes.total;
      } catch {}

      const add = (badge) => { if (!earned.includes(badge)) earned.push(badge); };

      if (posts >= 1)       add('first_listing');
      if (sells >= 1)       add('first_sale');
      if (donations >= 1)   add('first_donation');
      if (sells >= 5)       add('power_seller');
      if (donations >= 3)   add('generous');
      if (points >= 100)    add('century');
      if (points >= 300)    add('legend');
      if (reviewCount >= 5) add('trusted');

      await databases.updateDocument(DB_ID, PROFILES_COL, userId, { badges: earned });
      return earned;
    } catch (e) {
      return [];
    }
  },

  // ── Communities ───────────────────────────────────────────────────────────

  async fetchCommunities(userId) {
    const res = await databases.listDocuments(DB_ID, COMMUNITIES_COL, [
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents.map(communityFromDoc);
  },

  async createCommunity(userId, { name, description, type }) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const doc = await databases.createDocument(DB_ID, COMMUNITIES_COL, ID.unique(), {
      name,
      description,
      type,
      member_count: 1,
      created_by: userId,
      invite_code: inviteCode,
    });
    await AppwriteService.joinCommunityById(userId, doc.$id);
    return communityFromDoc(doc);
  },

  async joinByInviteCode(userId, code) {
    const res = await databases.listDocuments(DB_ID, COMMUNITIES_COL, [
      Query.equal('invite_code', code.toUpperCase().trim()),
    ]);
    if (res.documents.length === 0) throw new Error('Invalid community code. Please check and try again.');
    const community = res.documents[0];
    await AppwriteService.joinCommunityById(userId, community.$id);
    await databases.updateDocument(DB_ID, COMMUNITIES_COL, community.$id, {
      member_count: (community.member_count ?? 0) + 1,
    });
    return communityFromDoc(community);
  },

  async joinCommunityById(userId, communityId) {
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
    const joined = profile.joined_communities ?? [];
    if (!joined.includes(communityId)) {
      await databases.updateDocument(DB_ID, PROFILES_COL, userId, {
        joined_communities: [...joined, communityId],
      });
    }
  },

  async getUserCommunities(userId) {
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
    const joined = profile.joined_communities ?? [];
    if (joined.length === 0) return [];
    const res = await databases.listDocuments(DB_ID, COMMUNITIES_COL, [
      Query.equal('$id', joined),
    ]);
    return res.documents.map(communityFromDoc);
  },

  // ── Offers ────────────────────────────────────────────────────────────────

  async makeOffer(listingId, listingTitle, buyerId, buyerName, sellerId, amount) {
    await databases.createDocument(DB_ID, OFFERS_COL, ID.unique(), {
      listing_id: listingId,
      listing_title: listingTitle,
      buyer_id: buyerId,
      buyer_name: buyerName,
      seller_id: sellerId,
      amount,
      status: 'pending',
    });
  },

  async fetchOffersForSeller(sellerId) {
    const res = await databases.listDocuments(DB_ID, OFFERS_COL, [
      Query.equal('seller_id', sellerId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents;
  },

  async fetchOffersForBuyer(buyerId) {
    const res = await databases.listDocuments(DB_ID, OFFERS_COL, [
      Query.equal('buyer_id', buyerId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents;
  },

  async fetchOfferForBuyer(listingId, buyerId) {
    const res = await databases.listDocuments(DB_ID, OFFERS_COL, [
      Query.equal('listing_id', listingId),
      Query.equal('buyer_id', buyerId),
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents[0] || null;
  },

  async updateOffer(offerId, amount) {
    await databases.updateDocument(DB_ID, OFFERS_COL, offerId, {
      amount,
      status: 'pending',
    });
  },

  async cancelOffer(offerId) {
    await databases.updateDocument(DB_ID, OFFERS_COL, offerId, { status: 'canceled' });
  },

  async respondToOffer(offerId, status) {
    const offer = await databases.getDocument(DB_ID, OFFERS_COL, offerId);
    await databases.updateDocument(DB_ID, OFFERS_COL, offerId, { status });
    if (status === 'accepted' && offer) {
      await databases.updateDocument(DB_ID, LISTINGS_COL, offer.listing_id, { status: 'sold' });
      await AppwriteService.addPoints(offer.seller_id, 20);
      await AppwriteService.addPoints(offer.buyer_id, 15);
      await AppwriteService.logTransaction(offer.seller_id, 'sell', offer.listing_id, offer.listing_title, 20);
      await AppwriteService.logTransaction(offer.buyer_id, 'buy', offer.listing_id, offer.listing_title, 15);
      await AppwriteService.checkAndAwardBadges(offer.seller_id);
      await AppwriteService.checkAndAwardBadges(offer.buyer_id);
    }
  },

  // ── Streak ────────────────────────────────────────────────────────────────

  async checkAndUpdateStreak(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lastCheckin = profile.last_checkin ?? null;
      const currentStreak = profile.streak ?? 0;

      if (lastCheckin === todayStr) {
        // Already checked in today
        return { streak: currentStreak, pointsEarned: 0, alreadyCheckedIn: true };
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newStreak = lastCheckin === yesterdayStr ? currentStreak + 1 : 1;
      const pointsEarned = Math.min(2 + Math.floor(newStreak / 7) * 3, 15); // 2 base, bonus every 7 days, max 15

      await databases.updateDocument(DB_ID, PROFILES_COL, userId, {
        streak: newStreak,
        last_checkin: todayStr,
      });
      await AppwriteService.addPoints(userId, pointsEarned);
      await AppwriteService.logTransaction(userId, 'checkin', 'daily', 'Daily check-in', pointsEarned);

      return { streak: newStreak, pointsEarned, alreadyCheckedIn: false };
    } catch {
      return { streak: 0, pointsEarned: 0, alreadyCheckedIn: true };
    }
  },

  async getStreak(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      return { streak: profile.streak ?? 0, lastCheckin: profile.last_checkin ?? null };
    } catch {
      return { streak: 0, lastCheckin: null };
    }
  },

  // ── Follow Feed ───────────────────────────────────────────────────────────

  async fetchFollowingIds(userId) {
    const res = await databases.listDocuments(DB_ID, FOLLOWS_COL, [
      Query.equal('follower_id', userId),
      Query.limit(100),
    ]);
    return res.documents.map(d => d.following_id);
  },

  async fetchFollowFeed(userId, communityId) {
    const followingIds = await AppwriteService.fetchFollowingIds(userId);
    if (followingIds.length === 0) return [];
    const queries = [
      Query.equal('seller_id', followingIds),
      Query.orderDesc('$createdAt'),
      Query.limit(30),
    ];
    if (communityId) queries.push(Query.equal('community_id', communityId));
    const res = await databases.listDocuments(DB_ID, LISTINGS_COL, queries);
    return res.documents.map(listingFromDoc);
  },

  // ── Reactions ─────────────────────────────────────────────────────────────

  async getReactions(listingId) {
    try {
      const res = await databases.listDocuments(DB_ID, LISTINGS_COL, []);
      const doc = await databases.getDocument(DB_ID, LISTINGS_COL, listingId);
      return {
        eyes:  doc.react_eyes  ?? 0,
        heart: doc.react_heart ?? 0,
        fire:  doc.react_fire  ?? 0,
      };
    } catch {
      return { eyes: 0, heart: 0, fire: 0 };
    }
  },

  async addReaction(listingId, type) {
    // type: 'eyes' | 'heart' | 'fire'
    try {
      const doc = await databases.getDocument(DB_ID, LISTINGS_COL, listingId);
      const field = `react_${type}`;
      await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, {
        [field]: (doc[field] ?? 0) + 1,
      });
    } catch {}
  },

  // ── Reports ───────────────────────────────────────────────────────────────

  async reportListing(reporterId, listingId, sellerId, reason) {
    try {
      // Check if already reported by this user
      const existing = await databases.listDocuments(DB_ID, REPORTS_COL, [
        Query.equal('reporter_id', reporterId),
        Query.equal('listing_id', listingId),
      ]);
      if (existing.documents.length > 0) throw new Error('You have already reported this listing.');
      await databases.createDocument(DB_ID, REPORTS_COL, ID.unique(), {
        reporter_id: reporterId,
        listing_id: listingId,
        seller_id: sellerId,
        reason,
        created_at: new Date().toISOString(),
      });
      // Increment report count on listing
      const listing = await databases.getDocument(DB_ID, LISTINGS_COL, listingId);
      await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, {
        report_count: (listing.report_count ?? 0) + 1,
      });
    } catch (e) {
      throw e;
    }
  },

  async getReportCount(listingId) {
    try {
      const doc = await databases.getDocument(DB_ID, LISTINGS_COL, listingId);
      return doc.report_count ?? 0;
    } catch { return 0; }
  },

  // ── Blocks ────────────────────────────────────────────────────────────────

  async blockUser(blockerId, blockedId) {
    try {
      const existing = await databases.listDocuments(DB_ID, BLOCKS_COL, [
        Query.equal('blocker_id', blockerId),
        Query.equal('blocked_id', blockedId),
      ]);
      if (existing.documents.length > 0) return; // already blocked
      await databases.createDocument(DB_ID, BLOCKS_COL, ID.unique(), {
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(),
      });
    } catch {}
  },

  async unblockUser(blockerId, blockedId) {
    try {
      const res = await databases.listDocuments(DB_ID, BLOCKS_COL, [
        Query.equal('blocker_id', blockerId),
        Query.equal('blocked_id', blockedId),
      ]);
      if (res.documents.length > 0) {
        await databases.deleteDocument(DB_ID, BLOCKS_COL, res.documents[0].$id);
      }
    } catch {}
  },

  async isBlocked(blockerId, blockedId) {
    try {
      const res = await databases.listDocuments(DB_ID, BLOCKS_COL, [
        Query.equal('blocker_id', blockerId),
        Query.equal('blocked_id', blockedId),
      ]);
      return res.documents.length > 0;
    } catch { return false; }
  },

  async getBlockedIds(userId) {
    try {
      const res = await databases.listDocuments(DB_ID, BLOCKS_COL, [
        Query.equal('blocker_id', userId),
        Query.limit(100),
      ]);
      return res.documents.map(d => d.blocked_id);
    } catch { return []; }
  },

  // ── Verification ──────────────────────────────────────────────────────────

  async requestVerification(userId) {
    // Mark profile as pending verification
    await databases.updateDocument(DB_ID, PROFILES_COL, userId, {
      verification_status: 'pending',
    });
  },

  async getVerificationStatus(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      return profile.verification_status ?? 'none'; // 'none' | 'pending' | 'verified'
    } catch { return 'none'; }
  },

  // ── Streak ───────────────────────────────────────────────────────────────

  async checkAndUpdateStreak(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      const today = new Date().toISOString().split('T')[0];
      const lastCheckin = profile.last_checkin ?? '';
      const streak = profile.streak ?? 0;

      if (lastCheckin === today) {
        return { streak, alreadyCheckedIn: true, pointsEarned: 0 };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const newStreak = lastCheckin === yStr ? streak + 1 : 1;
      const bonus = newStreak % 7 === 0 ? 20 : 5;

      await databases.updateDocument(DB_ID, PROFILES_COL, userId, {
        last_checkin: today,
        streak: newStreak,
      });
      await AppwriteService.addPoints(userId, bonus);
      await AppwriteService.logTransaction(userId, 'post', 'daily', 'Daily check-in', bonus);

      return { streak: newStreak, alreadyCheckedIn: false, pointsEarned: bonus };
    } catch {
      return { streak: 0, alreadyCheckedIn: true, pointsEarned: 0 };
    }
  },

  // ── Follow Feed ─────────────────────────────────────────────────────────

  async fetchFollowFeed(userId, communityId) {
    try {
      const followRes = await databases.listDocuments(DB_ID, FOLLOWS_COL, [
        Query.equal('follower_id', userId),
      ]);
      const followingIds = followRes.documents.map(f => f.following_id);
      if (followingIds.length === 0) return [];
      const queries = [Query.equal('seller_id', followingIds), Query.orderDesc('$createdAt')];
      if (communityId) queries.push(Query.equal('community_id', communityId));
      const res = await databases.listDocuments(DB_ID, LISTINGS_COL, queries);
      return res.documents.map(listingFromDoc);
    } catch {
      return [];
    }
  },

  // ── Block ────────────────────────────────────────────────────────────────

  async blockUser(blockerId, blockedId) {
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, blockerId);
    const current = profile.blocked_users ?? [];
    if (!current.includes(blockedId)) {
      await databases.updateDocument(DB_ID, PROFILES_COL, blockerId, {
        blocked_users: [...current, blockedId],
      });
    }
  },

  async unblockUser(blockerId, blockedId) {
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, blockerId);
    const current = profile.blocked_users ?? [];
    await databases.updateDocument(DB_ID, PROFILES_COL, blockerId, {
      blocked_users: current.filter(id => id !== blockedId),
    });
  },

  async getBlockedIds(userId) {
    try {
      const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
      return profile.blocked_users ?? [];
    } catch {
      return [];
    }
  },

  // ── Offers (extra) ────────────────────────────────────────────────────────

  async fetchOfferForBuyer(listingId, buyerId) {
    try {
      const res = await databases.listDocuments(DB_ID, OFFERS_COL, [
        Query.equal('listing_id', listingId),
        Query.equal('buyer_id', buyerId),
        Query.orderDesc('$createdAt'),
      ]);
      return res.documents[0] ?? null;
    } catch {
      return null;
    }
  },

  async updateOffer(offerId, amount) {
    await databases.updateDocument(DB_ID, OFFERS_COL, offerId, { amount });
  },

  async cancelOffer(offerId) {
    await databases.updateDocument(DB_ID, OFFERS_COL, offerId, { status: 'canceled' });
  },

  // ── Boost ─────────────────────────────────────────────────────────────────

  async boostListing(listingId, userId) {
    const profile = await databases.getDocument(DB_ID, PROFILES_COL, userId);
    const currentPoints = profile.points ?? 0;
    if (currentPoints < 50) throw new Error('You need at least 50 points to boost a listing');
    const boostExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await databases.updateDocument(DB_ID, LISTINGS_COL, listingId, {
      is_boosted: true,
      boost_expires_at: boostExpiresAt,
    });
    await databases.updateDocument(DB_ID, PROFILES_COL, userId, { points: currentPoints - 50 });
    return boostExpiresAt;
  },

  // ── Barcode ───────────────────────────────────────────────────────────────

  async lookupBarcode(barcode) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const p = data.product;
        return {
          title: p.product_name || p.abbreviated_product_name || '',
          category: mapCategory(p.categories_tags?.[0] ?? ''),
          description: p.generic_name || p.ingredients_text || '',
        };
      }
      const res2 = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data2 = await res2.json();
      if (data2.items?.length > 0) {
        const item = data2.items[0];
        return {
          title: item.title || '',
          category: mapCategory(item.category || ''),
          description: item.description || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  // ── Storage ───────────────────────────────────────────────────────────────

  async uploadImage(uri, fileName) {
    const fileId = ID.unique();
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = { uri, name: fileName, type: 'image/jpeg', size: blob.size };
    await storage.createFile(BUCKET_ID, fileId, file);
    return buildUrl(fileId);
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  async fetchMessages(listingId) {
    const res = await databases.listDocuments(DB_ID, MESSAGES_COL, [
      Query.equal('listing_id', listingId),
      Query.orderAsc('$createdAt'),
      Query.limit(200),
    ]);
    return res.documents;
  },

  subscribeMessages(listingId, callback) {
    const channel = `databases.${DB_ID}.collections.${MESSAGES_COL}.documents`;
    AppwriteService.fetchMessages(listingId).then(callback);
    const unsub = client.subscribe(channel, (event) => {
      if (event.payload?.listing_id === listingId) {
        AppwriteService.fetchMessages(listingId).then(callback);
      }
    });
    return unsub;
  },

  async sendMessage({ listingId, senderId, senderName, receiverId, text }) {
    await databases.createDocument(DB_ID, MESSAGES_COL, ID.unique(), {
      listing_id: listingId,
      sender_id: senderId,
      sender_name: senderName ?? '',
      receiver_id: receiverId,
      text,
      is_read: false,
    });
  },

  async markMessagesRead(listingId, readerId) {
    try {
      const res = await databases.listDocuments(DB_ID, MESSAGES_COL, [
        Query.equal('listing_id', listingId),
        Query.equal('receiver_id', readerId),
        Query.equal('is_read', false),
        Query.limit(50),
      ]);
      await Promise.all(
        res.documents.map(doc =>
          databases.updateDocument(DB_ID, MESSAGES_COL, doc.$id, { is_read: true })
        )
      );
    } catch {}
  },

  // Fetch unique people who have chatted about a listing (for mark-as-sold flow)
  async fetchChatParticipants(listingId, sellerId) {
    try {
      const res = await databases.listDocuments(DB_ID, MESSAGES_COL, [
        Query.equal('listing_id', listingId),
        Query.limit(200),
      ]);
      // Get unique sender IDs excluding the seller
      const seen = new Set();
      const participants = [];
      for (const msg of res.documents) {
        const uid = msg.sender_id;
        if (uid !== sellerId && !seen.has(uid)) {
          seen.add(uid);
          participants.push({ id: uid, name: msg.sender_name ?? 'Community member' });
        }
      }
      return participants;
    } catch {
      return [];
    }
  },
};

function communityFromDoc(doc) {
  return {
    id: doc.$id,
    name: doc.name,
    description: doc.description,
    type: doc.type,
    memberCount: doc.member_count ?? 0,
    createdBy: doc.created_by,
    inviteCode: doc.invite_code,
  };
}

function mapCategory(tag) {
  const t = tag.toLowerCase();
  if (t.includes('electronic') || t.includes('phone') || t.includes('computer')) return 'Electronics';
  if (t.includes('book') || t.includes('magazine')) return 'Books';
  if (t.includes('cloth') || t.includes('apparel') || t.includes('fashion')) return 'Clothing';
  if (t.includes('sport') || t.includes('fitness')) return 'Sports';
  if (t.includes('furniture') || t.includes('home')) return 'Furniture';
  return 'General';
}

function listingFromDoc(doc) {
  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description,
    price: Number(doc.price),
    imageUrl: doc.image_url ?? '',
    sellerId: doc.seller_id,
    sellerName: doc.seller_name ?? 'Unknown',
    category: doc.category,
    communityId: doc.community_id,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
    status: doc.status ?? 'active',
    expiresAt: doc.expires_at ?? null,
    isBoosted: doc.is_boosted ?? false,
    boostExpiresAt: doc.boost_expires_at ?? null,
    condition: doc.condition ?? '',
    isAnonymous: doc.is_anonymous ?? false,
    reactions: {
      eyes:  doc.react_eyes  ?? 0,
      heart: doc.react_heart ?? 0,
      fire:  doc.react_fire  ?? 0,
    },
    isSellerAvailable: doc.seller_is_available ?? true,
    isSellerVerified: doc.seller_is_verified ?? false,
    reportCount: doc.report_count ?? 0,
    priceHistory: (() => {
      try { return JSON.parse(doc.price_history ?? '[]'); } catch { return []; }
    })(),
  };
}
