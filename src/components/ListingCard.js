import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useAppState } from '../context/AppContext';
import { AppwriteService } from '../services/appwrite';
import { useTheme } from '../ThemeContext';
import { R, S } from '../theme';

const REACTIONS = [
  { key: 'eyes',  emoji: '👀' },
  { key: 'heart', emoji: '❤️' },
  { key: 'fire',  emoji: '🔥' },
];

export default function ListingCard({ listing, onPress, index = 0 }) {
  const { isSaved, toggleSave } = useAppState();
  const saved = isSaved(listing.id);

  const [reactions, setReactions] = useState(listing.reactions ?? { eyes: 0, heart: 0, fire: 0 });
  const [reacted, setReacted] = useState(null);

  // Press scale animation
  const pressScale = useRef(new Animated.Value(1)).current;
  // Heart bounce
  const heartScale = useRef(new Animated.Value(1)).current;
  // Reaction scales
  const reactScales = useRef(REACTIONS.map(() => new Animated.Value(1))).current;
  // Entrance animation
  const entranceAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      tension: 60,
      friction: 10,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = () => {
    toggleSave(listing.id);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, tension: 300, friction: 6, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const { C } = useTheme();

  const handleReact = async (e, key, i) => {
    e.stopPropagation();
    if (reacted) return;
    setReacted(key);
    setReactions(prev => ({ ...prev, [key]: prev[key] + 1 }));
    // Pop animation
    Animated.sequence([
      Animated.spring(reactScales[i], { toValue: 1.5, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.spring(reactScales[i], { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    await AppwriteService.addReaction(listing.id, key);
  };

  const entranceStyle = {
    opacity: entranceAnim,
    transform: [
      { scale: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
      { translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
    ],
  };

  const styles = getStyles(C, R, S);

  return (
    <Animated.View style={[entranceStyle, { transform: [...(entranceStyle.transform ?? []), { scale: pressScale }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.imageWrap}>
          {listing.imageUrl ? (
            <Image source={{ uri: listing.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ fontSize: 36 }}>🖼</Text>
            </View>
          )}

          {/* Heart button */}
          <Animated.View style={[styles.heartBtn, saved && styles.heartBtnSaved, { transform: [{ scale: heartScale }] }]}>
            <TouchableOpacity
              onPress={handleSave}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.heartIcon, saved && styles.heartIconSaved]}>{saved ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          </Animated.View>

          {listing.isBoosted && (
            <View style={styles.boostTag}>
              <Text style={styles.boostTagText}>🚀</Text>
            </View>
          )}
          {listing.price === 0 && (
            <View style={styles.freeTag}>
              <Text style={styles.freeTagText}>FREE</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.isAnonymous ? 'Anonymous Listing' : listing.title}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>{listing.price === 0 ? 'Free' : `₹${Math.round(listing.price)}`}</Text>
            {listing.condition ? (
              <View style={styles.condBadge}>
                <Text style={styles.condText}>{listing.condition}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sellerRow}>
            <View style={[styles.availDot, { backgroundColor: listing.isSellerAvailable ? C.green : C.muted }]} />
            <Text style={styles.seller} numberOfLines={1}>
              {listing.isAnonymous ? '🕵️ Anonymous' : listing.sellerName}
            </Text>
          </View>

          {/* Reactions */}
          <View style={styles.reactRow}>
            {REACTIONS.map((r, i) => {
              const count = reactions[r.key];
              const isActive = reacted === r.key;
              return (
                <Animated.View key={r.key} style={{ transform: [{ scale: reactScales[i] }] }}>
                  <TouchableOpacity
                    style={[styles.reactBtn, isActive && styles.reactBtnActive]}
                    onPress={(e) => handleReact(e, r.key, i)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactEmoji}>{r.emoji}</Text>
                    {count > 0 && <Text style={styles.reactCount}>{count}</Text>}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.lg, overflow: 'hidden', ...S.sm },
  imageWrap: { height: 150, position: 'relative', backgroundColor: C.border },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EDE6' },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: R.full, width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center', ...S.sm,
  },
  heartBtnSaved: { backgroundColor: '#FFF0F0' },
  heartIcon: { fontSize: 15, color: C.muted },
  heartIconSaved: { color: '#E05C5C' },
  boostTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FFF8E1', borderRadius: R.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  boostTagText: { fontSize: 10 },
  freeTag: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: C.green, borderRadius: R.full,
    paddingHorizontal: 9, paddingVertical: 2,
  },
  freeTagText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  info: { padding: 10 },
  title: { fontSize: 12, fontWeight: '700', color: C.primary, lineHeight: 17, marginBottom: 5 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '800', color: C.green },
  condBadge: { backgroundColor: '#EEF7EE', borderRadius: R.full, paddingHorizontal: 7, paddingVertical: 2 },
  condText: { fontSize: 9, fontWeight: '600', color: C.green },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  seller: { fontSize: 10, color: C.muted, flex: 1 },
  reactRow: { flexDirection: 'row', gap: 6 },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.bg, borderRadius: R.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  reactBtnActive: { backgroundColor: '#FFF3E0' },
  reactEmoji: { fontSize: 12 },
  reactCount: { fontSize: 10, fontWeight: '700', color: C.muted },
});
