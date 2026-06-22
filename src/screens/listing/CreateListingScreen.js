import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { GroqService } from '../../services/groq';
import { saveTemplate } from './TemplatesScreen';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

export const CATEGORIES = [
  { key: 'General',     icon: '🛍' },
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
  { key: 'Other',       icon: '📦' },
];

const CONDITIONS = [
  { key: 'Like New',  emoji: '✨', desc: 'Barely used, no signs of wear' },
  { key: 'Good',      emoji: '👍', desc: 'Minor signs of use' },
  { key: 'Fair',      emoji: '🙂', desc: 'Visible wear but fully functional' },
  { key: 'For Parts', emoji: '🔧', desc: 'Not fully functional' },
];

export default function CreateListingScreen({ route, navigation }) {
  const { currentUser, selectedCommunity, addListing } = useAppState();
  const prefill = route?.params?.prefill;

  const [title, setTitle] = useState(prefill?.title ?? '');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(prefill?.category ?? 'General');
  const [condition, setCondition] = useState('Good');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [posting, setPosting] = useState(false);
  const [aiLoading, setAiLoading] = useState(null); // 'price' | 'desc' | null

  const { C } = useTheme();
  useEffect(() => {
    if (prefill?.title) Alert.alert('🎉 Product Found!', `Auto-filled: ${prefill.title}`);
  }, []);

  const styles = getStyles(C, R, S);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) setImageUri(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveTemplate = async () => {
    if (!title.trim()) return Alert.alert('Add a title first', 'Template needs at least a title.');
    await saveTemplate({ title: title.trim(), description: description.trim(), price, category, condition });
    Alert.alert('✅ Template Saved', 'You can reuse it from the Templates screen.');
  };

  const handleAiPrice = async () => {
    if (!title.trim()) return Alert.alert('Add a title first', 'AI needs the item title to suggest a price.');
    setAiLoading('price');
    try {
      const suggested = await GroqService.suggestPrice(title, category, condition);
      setPrice(String(suggested));
      Alert.alert('✨ AI Price Suggestion', `Suggested price: ₹${suggested}\n\nFeel free to adjust it.`);
    } catch (e) {
      Alert.alert('AI Error', e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiDesc = async () => {
    if (!title.trim()) return Alert.alert('Add a title first', 'AI needs the item title to write a description.');
    setAiLoading('desc');
    try {
      const generated = await GroqService.generateDescription(title, category, condition);
      setDescription(generated);
    } catch (e) {
      Alert.alert('AI Error', e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !price) return Alert.alert('Error', 'All fields are required');
    setPosting(true);
    try {
      let imageUrl = '';
      if (imageUri) imageUrl = await AppwriteService.uploadImage(imageUri, `${Date.now()}.jpg`);
      await addListing({
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        imageUrl,
        sellerId: currentUser?.id ?? 'user1',
        sellerName: currentUser?.name ?? 'You',
        category,
        condition,
        isAnonymous,
        communityId: selectedCommunity?.id ?? 'general',
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to post: ' + e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Image picker */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageIcon}>📷</Text>
            <Text style={styles.imageHint}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.quickRow}>
        {imageUri && (
          <TouchableOpacity style={styles.quickBtn} onPress={pickImage}>
            <Text style={styles.quickBtnText}>✏️ Change</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('BarcodeScanner')}>
          <Text style={styles.quickBtnText}>📷 Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Templates')}>
          <Text style={styles.quickBtnText}>📋 Templates</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="What are you selling?"
        placeholderTextColor={C.muted}
        value={title}
        onChangeText={setTitle}
      />

      {/* Description with AI button */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Description</Text>
        <TouchableOpacity
          style={[styles.aiBtn, aiLoading === 'desc' && styles.aiBtnLoading]}
          onPress={handleAiDesc}
          disabled={!!aiLoading}
          activeOpacity={0.8}
        >
          {aiLoading === 'desc' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.aiBtnText}>✨ AI Write</Text>
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe your item..."
        placeholderTextColor={C.muted}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Price with AI button */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Price (₹)</Text>
        <TouchableOpacity
          style={[styles.aiBtn, aiLoading === 'price' && styles.aiBtnLoading]}
          onPress={handleAiPrice}
          disabled={!!aiLoading}
          activeOpacity={0.8}
        >
          {aiLoading === 'price' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.aiBtnText}>✨ AI Price</Text>
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="0 for free"
        placeholderTextColor={C.muted}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.catGrid}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catChip, category === c.key && styles.catChipActive]}
            onPress={() => setCategory(c.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.catChipIcon}>{c.icon}</Text>
            <Text style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>{c.key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Condition */}
      <Text style={styles.label}>Condition</Text>
      <View style={styles.conditionGrid}>
        {CONDITIONS.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.conditionCard, condition === c.key && styles.conditionCardActive]}
            onPress={() => setCondition(c.key)}
            activeOpacity={0.85}
          >
            <Text style={styles.conditionEmoji}>{c.emoji}</Text>
            <Text style={[styles.conditionKey, condition === c.key && styles.conditionKeyActive]}>{c.key}</Text>
            <Text style={styles.conditionDesc}>{c.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Anonymous toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>🕵️ Post Anonymously</Text>
          <Text style={styles.toggleSub}>Your name won't be shown on this listing</Text>
        </View>
        <Switch
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ false: C.border, true: C.primary }}
          thumbColor="#fff"
        />
      </View>

      {isAnonymous && (
        <View style={styles.anonBanner}>
          <Text style={styles.anonBannerText}>👤 This listing will show as "Anonymous"</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, posting && { opacity: 0.6 }]}
        onPress={submit}
        disabled={posting}
        activeOpacity={0.85}
      >
        {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post Listing</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.templateBtn} onPress={handleSaveTemplate} activeOpacity={0.8}>
        <Text style={styles.templateBtnText}>📋 Save as Template</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 50 },
  imagePicker: { height: 200, backgroundColor: C.border, borderRadius: R.lg, overflow: 'hidden', marginBottom: 10 },
  preview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imageIcon: { fontSize: 40 },
  imageHint: { color: C.muted, fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 10, alignItems: 'center', ...S.sm },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#6C47FF', borderRadius: R.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  aiBtnLoading: { opacity: 0.7 },
  aiBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: C.card, borderRadius: R.md, padding: 14, fontSize: 15, color: C.primary, marginBottom: 16, ...S.sm },
  multiline: { height: 90, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card, borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 7, ...S.sm },
  catChipActive: { backgroundColor: C.primary },
  catChipIcon: { fontSize: 14 },
  catChipText: { fontSize: 12, fontWeight: '600', color: C.primary },
  catChipTextActive: { color: '#fff' },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  conditionCard: { width: '47%', backgroundColor: C.card, borderRadius: R.md, padding: 14, borderWidth: 2, borderColor: 'transparent', ...S.sm },
  conditionCardActive: { borderColor: C.primary, backgroundColor: '#F0EDE6' },
  conditionEmoji: { fontSize: 24, marginBottom: 6 },
  conditionKey: { fontSize: 14, fontWeight: '700', color: C.primary },
  conditionKeyActive: { color: C.primary },
  conditionDesc: { fontSize: 11, color: C.muted, marginTop: 3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.md, padding: 16, marginBottom: 10, ...S.sm },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: C.primary },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  anonBanner: { backgroundColor: '#F0EDE6', borderRadius: R.md, padding: 12, marginBottom: 16, alignItems: 'center' },
  anonBannerText: { fontSize: 13, color: C.primary, fontWeight: '500' },
  btn: { backgroundColor: C.primary, borderRadius: R.md, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  templateBtn: { backgroundColor: C.card, borderRadius: R.md, padding: 14, alignItems: 'center', marginTop: 10, ...S.sm },
  templateBtnText: { color: C.primary, fontSize: 14, fontWeight: '600' },
});
