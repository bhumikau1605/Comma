import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ImageBackground } from 'react-native';
import { AppwriteService } from '../services/appwrite';
import { useAppState } from '../context/AppContext';
import { useTheme } from '../ThemeContext';
import { R, S } from '../theme';

export default function SplashScreen({ navigation }) {
  const { login } = useAppState();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const user = await AppwriteService.getCurrentUser();
      if (user) {
        await login(user);
        navigation.replace('CommunitySelect');
      } else {
        navigation.replace('Login');
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground source={require('../../assets/bg.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }, { scale }] }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>,</Text>
        </View>
        <Text style={styles.appName}>Comma</Text>
        <Text style={styles.tagline}>Buy · Sell · Belong</Text>
      </Animated.View>
      <Animated.View style={[styles.bottom, { opacity: fade }]}>
        <View style={styles.dot} /><View style={[styles.dot, styles.dotMid]} /><View style={styles.dot} />
      </Animated.View>
    </ImageBackground>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 88, height: 88, backgroundColor: '#fff', borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 28, ...S.lg },
  logoText: { fontSize: 58, fontWeight: '900', color: C.primary, lineHeight: 66 },
  appName: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 10, letterSpacing: 1.5 },
  bottom: { position: 'absolute', bottom: 52, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotMid: { backgroundColor: '#fff', width: 20, borderRadius: 3 },
});
