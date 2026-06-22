import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const TEMPLATES_KEY = 'listing_templates';

export async function saveTemplate(template) {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  const existing = raw ? JSON.parse(raw) : [];
  const updated = [{ ...template, id: Date.now().toString(), savedAt: new Date().toISOString() }, ...existing];
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated.slice(0, 20)));
}

export async function loadTemplates() {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteTemplate(id) {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  const existing = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(existing.filter(t => t.id !== id)));
}

export default function TemplatesScreen() {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  const handleUse = (template) => {
    navigation.navigate('CreateListing', { prefill: template });
  };

  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  const handleDelete = (id) => {
    Alert.alert('Delete Template', 'Remove this template?', [
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTemplate(id);
          setTemplates(prev => prev.filter(t => t.id !== id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptySub}>When creating a listing, tap "Save as Template" to save it here for reuse.</Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.header}>Your saved templates</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={styles.cardMeta}>{item.category} · {item.condition}</Text>
                {item.price ? <Text style={styles.cardPrice}>₹{Math.round(item.price)}</Text> : null}
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <TouchableOpacity style={styles.useBtn} onPress={() => handleUse(item)} activeOpacity={0.85}>
              <Text style={styles.useBtnText}>Use this template →</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.primary, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: 16, marginBottom: 12, ...S.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.primary },
  cardMeta: { fontSize: 12, color: C.muted, marginTop: 3 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: C.green, marginTop: 4 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  cardDesc: { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 12 },
  useBtn: { backgroundColor: C.primary, borderRadius: R.md, padding: 12, alignItems: 'center' },
  useBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
