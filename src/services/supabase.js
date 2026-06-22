import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  global: { fetch: fetch.bind(globalThis) },
});

export const SupabaseService = {
  async signUp(name, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) throw error;
    await supabase.from('profiles').insert({ id: data.user.id, name, email });
    return { id: data.user.id, name, email };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw error;
    const { data: profile } = await supabase.from('profiles').select().eq('id', data.user.id).single();
    return { id: data.user.id, name: profile?.name ?? email.split('@')[0], email };
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  getCurrentUser() {
    const user = supabase.auth.getUser();
    return user ?? null;
  },

  async fetchListings(communityId) {
    let query = supabase.from('listings').select();
    if (communityId) query = query.eq('community_id', communityId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(listingFromRow);
  },

  async fetchSellerListings(sellerId) {
    const { data, error } = await supabase.from('listings').select().eq('seller_id', sellerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(listingFromRow);
  },

  async createListing(listing) {
    const { error } = await supabase.from('listings').insert({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      community_id: listing.communityId,
      seller_id: listing.sellerId,
      seller_name: listing.sellerName,
      image_url: listing.imageUrl,
    });
    if (error) throw error;
  },

  async uploadImage(uri, fileName) {
    const path = `listings/${fileName}`;
    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: 'image/jpeg' });
    const { error } = await supabase.storage.from('listings').upload(path, formData, { contentType: 'multipart/form-data' });
    if (error) throw error;
    return supabase.storage.from('listings').getPublicUrl(path).data.publicUrl;
  },

  subscribeMessages(listingId, callback) {
    const fetchAndNotify = () => SupabaseService.fetchMessages(listingId).then(callback);
    const channel = supabase
      .channel(`messages:${listingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `listing_id=eq.${listingId}` }, fetchAndNotify)
      .subscribe();
    fetchAndNotify();
    return () => supabase.removeChannel(channel);
  },

  async fetchMessages(listingId) {
    const { data } = await supabase.from('messages').select().eq('listing_id', listingId).order('created_at', { ascending: true });
    return data ?? [];
  },

  async sendMessage({ listingId, senderId, receiverId, text }) {
    await supabase.from('messages').insert({ listing_id: listingId, sender_id: senderId, receiver_id: receiverId, text });
  },
};

function listingFromRow(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    price: Number(e.price),
    imageUrl: e.image_url ?? '',
    sellerId: e.seller_id,
    sellerName: e.seller_name ?? 'Unknown',
    category: e.category,
    communityId: e.community_id,
    createdAt: e.created_at,
  };
}
