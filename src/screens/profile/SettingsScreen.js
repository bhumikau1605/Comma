import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useTheme } from '../../ThemeContext';
import { useAppState } from '../../context/AppContext';
import { R, S } from '../../theme';

function SettingRow({ icon, title, subtitle, right, onPress, danger }) {
  const { C } = useTheme();
  const s = rowStyles(C);
  const content = (
    <View style={s.row}>
      <View style={[s.iconWrap, danger && s.iconWrapDanger]}>
        <Text style={s.icon}>{icon}</Text>
      </View>
      <View style={s.text}>
        <Text style={[s.title, danger && s.titleDanger]}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={s.right}>{right}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  return content;
}

function Section({ label, children, C }) {
  const s = secStyles(C);
  return (
    <View style={s.section}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.card}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme, C } = useTheme();
  const { currentUser, logout } = useAppState();
  const insets = useSafeAreaInsets();
  const styles = mainStyles(C, R);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Account */}
        <Section label="ACCOUNT" C={C}>
          <SettingRow
            icon="👤"
            title={currentUser?.name ?? 'Your Name'}
            subtitle={currentUser?.email ?? ''}
            onPress={() => navigation.navigate('EditProfile')}
            right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>}
          />
        </Section>

        {/* Appearance */}
        <Section label="APPEARANCE" C={C}>
          <SettingRow
            icon={isDark ? '🌙' : '☀️'}
            title="Dark Mode"
            subtitle={isDark ? 'Currently dark' : 'Currently light'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.border, true: C.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Section>

        {/* Activity */}
        <Section label="ACTIVITY" C={C}>
          <SettingRow icon="🎡" title="Spin the Wheel" subtitle="Earn daily bonus points" onPress={() => navigation.navigate('SpinWheel')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
          <Divider C={C} />
          <SettingRow icon="🏅" title="My Badges" subtitle="View earned achievements" onPress={() => navigation.navigate('Badges')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
          <Divider C={C} />
          <SettingRow icon="📋" title="Transaction History" subtitle="Points earned log" onPress={() => navigation.navigate('TransactionHistory')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
          <Divider C={C} />
          <SettingRow icon="🏆" title="Leaderboard" subtitle="Community rankings" onPress={() => navigation.navigate('Leaderboard')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
        </Section>

        {/* Community */}
        <Section label="COMMUNITY" C={C}>
          <SettingRow icon="👥" title="Switch Community" subtitle="Change your active community" onPress={() => navigation.navigate('CommunitySelect')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
          <Divider C={C} />
          <SettingRow icon="🤝" title="My Offers" subtitle="View sent and received offers" onPress={() => navigation.navigate('Offers')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
        </Section>

        {/* Support */}
        <Section label="SUPPORT" C={C}>
          <SettingRow icon="⭐" title="Rate the App" subtitle="Help us improve Comma" onPress={() => Alert.alert('Thank you!', 'Rating coming soon on the app store.')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
          <Divider C={C} />
          <SettingRow icon="📧" title="Contact Us" subtitle="Get help or send feedback" onPress={() => Linking.openURL('mailto:support@comma.app')} right={<Text style={{ color: C.muted, fontSize: 18 }}>›</Text>} />
        </Section>

        {/* Danger */}
        <Section label="" C={C}>
          <SettingRow icon="🚪" title="Sign Out" onPress={handleLogout} danger right={null} />
        </Section>

        <Text style={styles.version}>Comma v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function Divider({ C }) {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: 56 }} />;
}

const rowStyles = (C) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  iconWrapDanger: { backgroundColor: '#FDE8E8' },
  icon: { fontSize: 18 },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: C.primary },
  titleDanger: { color: '#D94F4F' },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  right: { marginLeft: 8 },
});

const secStyles = (C) => StyleSheet.create({
  section: { marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: C.card, borderRadius: R.lg, overflow: 'hidden', ...S.sm },
});

const mainStyles = (C, R) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.primary, letterSpacing: -0.5, marginBottom: 24, marginTop: 8 },
  version: { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 16 },
});
