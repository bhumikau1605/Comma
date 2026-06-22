import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Easing, Alert,
} from 'react-native';
import { SafeAreaView } from '../../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const SEGMENTS = [
  { label: '2 pts',  points: 2,  color: '#4A7C59' },
  { label: '5 pts',  points: 5,  color: '#4A6FA5' },
  { label: '1 pt',   points: 1,  color: '#9B4A7C' },
  { label: '10 pts', points: 10, color: '#C0622F' },
  { label: '3 pts',  points: 3,  color: '#5B5EA6' },
  { label: '15 pts', points: 15, color: '#2E7D6B' },
  { label: '2 pts',  points: 2,  color: '#7C4A4A' },
  { label: '50 pts', points: 50, color: '#B8860B' },
];

const SPIN_KEY = 'last_spin_date';
const SEG_ANGLE = 360 / SEGMENTS.length;

export default function SpinWheelScreen({ navigation }) {
  const { currentUser, refreshPoints } = useAppState();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [nextSpin, setNextSpin] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0);
  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  useEffect(() => {
    checkCanSpin();
  }, []);

  const checkCanSpin = async () => {
    const last = await AsyncStorage.getItem(SPIN_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (last === today) {
      setCanSpin(false);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow - new Date();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setNextSpin(`${h}h ${m}m`);
    } else {
      setCanSpin(true);
    }
  };

  const spin = async () => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setResult(null);

    // Pick random segment
    const segIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segCenter = segIndex * SEG_ANGLE + SEG_ANGLE / 2;
    // Spin 5 full rotations + land on segment (pointer at top = 0°)
    const targetDeg = currentDeg.current + 360 * 5 + (360 - segCenter);
    currentDeg.current = targetDeg % 360;

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: targetDeg,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      const won = SEGMENTS[segIndex];
      setResult(won);
      setSpinning(false);
      setCanSpin(false);

      // Save today's date
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(SPIN_KEY, today);

      // Award points
      await AppwriteService.addPoints(currentUser.id, won.points);
      await AppwriteService.logTransaction(currentUser.id, 'spin', 'wheel', 'Spin the Wheel', won.points);
      await refreshPoints(currentUser.id);

      setTimeout(() => {
        Alert.alert(
          won.points === 50 ? '🎉 JACKPOT!' : '🎡 You won!',
          `+${won.points} points added to your account!`,
          [{ text: 'Sweet!', onPress: () => navigation.goBack() }]
        );
      }, 300);
    });
  };

  const rotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const WHEEL_SIZE = 280;
  const CENTER = WHEEL_SIZE / 2;
  const RADIUS = CENTER - 10;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎡 Spin the Wheel</Text>
      <Text style={styles.sub}>
        {canSpin ? 'Spin once a day for bonus points!' : `Next spin in ${nextSpin}`}
      </Text>

      {/* Wheel */}
      <View style={styles.wheelWrap}>
        {/* Pointer */}
        <View style={styles.pointer} />

        <Animated.View style={[styles.wheel, { width: WHEEL_SIZE, height: WHEEL_SIZE, transform: [{ rotate }] }]}>
          {SEGMENTS.map((seg, i) => {
            const angle = i * SEG_ANGLE;
            const mid = angle + SEG_ANGLE / 2;
            const rad = (mid - 90) * (Math.PI / 180);
            const tx = CENTER + (RADIUS * 0.62) * Math.cos(rad);
            const ty = CENTER + (RADIUS * 0.62) * Math.sin(rad);

            return (
              <View key={i} style={StyleSheet.absoluteFill}>
                {/* Segment wedge using border trick */}
                <View style={[
                  styles.segment,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                    borderTopColor: seg.color,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopWidth: CENTER,
                    borderLeftWidth: CENTER * Math.tan((SEG_ANGLE / 2) * Math.PI / 180),
                    borderRightWidth: CENTER * Math.tan((SEG_ANGLE / 2) * Math.PI / 180),
                    left: CENTER - CENTER * Math.tan((SEG_ANGLE / 2) * Math.PI / 180),
                    top: 0,
                  }
                ]} />
                {/* Label */}
                <Text style={[styles.segLabel, { left: tx - 20, top: ty - 8 }]}>
                  {seg.label}
                </Text>
              </View>
            );
          })}
          {/* Center circle */}
          <View style={[styles.centerCircle, { left: CENTER - 24, top: CENTER - 24 }]} />
        </Animated.View>
      </View>

      {/* Spin button */}
      <TouchableOpacity
        style={[styles.spinBtn, (!canSpin || spinning) && styles.spinBtnDisabled]}
        onPress={spin}
        disabled={!canSpin || spinning}
        activeOpacity={0.85}
      >
        <Text style={styles.spinBtnText}>
          {spinning ? 'Spinning...' : canSpin ? '🎡 SPIN!' : '⏳ Come back tomorrow'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={[styles.resultCard, { backgroundColor: result.color }]}>
          <Text style={styles.resultText}>🎉 You won {result.points} points!</Text>
        </View>
      )}

      {/* History hint */}
      <Text style={styles.hint}>One free spin per day. Jackpot = 50 pts!</Text>
    </SafeAreaView>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: C.primary, marginTop: 16, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: C.muted, marginTop: 6, marginBottom: 24 },
  wheelWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 24,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: C.primary,
    position: 'absolute', top: -16, zIndex: 10,
  },
  wheel: { borderRadius: 999, overflow: 'hidden', ...S.lg },
  segment: {
    position: 'absolute',
    width: 0, height: 0,
    borderStyle: 'solid',
  },
  segLabel: {
    position: 'absolute',
    width: 40, textAlign: 'center',
    fontSize: 10, fontWeight: '800', color: '#fff',
  },
  centerCircle: {
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.card,
    ...S.md,
  },
  spinBtn: {
    backgroundColor: C.primary, borderRadius: R.xl,
    paddingHorizontal: 48, paddingVertical: 18,
    ...S.lg,
  },
  spinBtnDisabled: { opacity: 0.4 },
  spinBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  resultCard: { borderRadius: R.lg, paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 },
  resultText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 11, color: C.muted, marginTop: 20 },
});
