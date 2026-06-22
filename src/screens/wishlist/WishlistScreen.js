import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../../context/AppContext';
import ListingCard from '../../components/ListingCard';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

export default function WishlistScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { savedListings } = useAppState();
  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.count}>{savedListings.length} item{savedListings.length !== 1 ? 's' : ''}</Text>
      </View>
      {savedListings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyText}>No saved listings yet</Text>
          <Text style={styles.emptyHint}>Tap ♡ on any listing to save it</Text>
        </View>
      ) : (
        <FlatList
          data={savedListings}
          keyExtractor={l => l.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListingCard listing={item} onPress={() => navigation.navigate('ListingDetail', { listing: item })} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  titleWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: C.primary, letterSpacing: -0.8 },
  count: { fontSize: 13, color: C.muted, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.primary, marginTop: 12 },
  emptyHint: { color: C.muted, fontSize: 13, marginTop: 6 },
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  cardWrap: { width: '48.5%' },
});
