import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../../context/AppContext';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

export default function InboxScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { listings } = useAppState();
  const threads = listings.slice(0, 10);
  const { C } = useTheme();

  const styles = getStyles(C, R, S);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Inbox</Text>
      </View>
      {threads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptyHint}>Start a conversation from any listing</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Chat', { listing: item, sellerName: item.sellerName })} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={styles.tileBody}>
                <Text style={styles.name}>{item.sellerName}</Text>
                <Text style={styles.sub} numberOfLines={1}>Re: {item.title}</Text>
              </View>
              <Text style={styles.time}>now</Text>
            </TouchableOpacity>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.primary, marginTop: 12 },
  emptyHint: { color: C.muted, fontSize: 13, marginTop: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  tile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: C.card, borderRadius: R.md, paddingHorizontal: 14, marginBottom: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '700', fontSize: 14, color: C.primary },
  sub: { color: C.muted, fontSize: 12, marginTop: 2 },
  time: { color: C.muted, fontSize: 11 },
  divider: { height: 8 },
});
