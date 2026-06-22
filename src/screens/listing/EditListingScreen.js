import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AppwriteService } from '../../services/appwrite';
import { useAppState } from '../../context/AppContext';

const CATEGORIES = ['General', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Sports', 'Other'];

export default function EditListingScreen({ route, navigation }) {
  const { listing } = route.params;
  const { loadListings, selectedCommunity } = useAppState();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(String(listing.price));
  const [category, setCategory] = useState(listing.category);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !description.trim() || !price) return Alert.alert('Error', 'All fields are required');
    setSaving(true);
    try {
      await AppwriteService.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        category,
      });
      await loadListings(selectedCommunity?.id);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#aaa" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#aaa" value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Price (₹)" placeholderTextColor="#aaa" value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={styles.label}>Category</Text>
      <View style={styles.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 20, paddingBottom: 40 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#3A3A3A', marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, marginHorizontal: -4 },
  catChip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, margin: 4 },
  catChipActive: { backgroundColor: '#3A3A3A' },
  catChipText: { fontSize: 13, color: '#3A3A3A' },
  catChipTextActive: { color: '#fff' },
  btn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
