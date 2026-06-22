import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useAppState } from '../../context/AppContext';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { currentUser, updateProfile } = useAppState();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(C, R, S);

  const [name, setName] = useState(currentUser?.name ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [isAvailable, setIsAvailable] = useState(currentUser?.isAvailable ?? true);
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setAvatarUri(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim(), avatarUri, isAvailable });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = avatarUri ? { uri: avatarUri } : currentUser?.avatarUrl ? { uri: currentUser.avatarUrl } : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarTouch}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 44 }}>👤</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{name || 'Your Name'}</Text>
          <Text style={styles.avatarEmail}>{currentUser?.email ?? ''}</Text>
        </View>

        {/* Info section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
          <View style={[styles.field, focusedField === 'name' && styles.fieldFocused]}>
            <Text style={styles.fieldIcon}>👤</Text>
            <View style={styles.fieldBody}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={C.muted}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.field, styles.fieldMulti, focusedField === 'bio' && styles.fieldFocused]}>
            <Text style={styles.fieldIcon}>✍️</Text>
            <View style={styles.fieldBody}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the community about yourself..."
                placeholderTextColor={C.muted}
                multiline
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          </View>
        </View>

        {/* Availability section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>AVAILABILITY</Text>
          <View style={styles.toggleRow}>
            <View style={[styles.availDot, { backgroundColor: isAvailable ? '#4CAF50' : '#9E9E9E' }]} />
            <View style={styles.toggleBody}>
              <Text style={styles.toggleTitle}>{isAvailable ? 'Available' : 'Away'}</Text>
              <Text style={styles.toggleSub}>
                {isAvailable ? 'Buyers can see you are active and responsive' : 'You appear offline — buyers may not message you'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: C.border, true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarTouch: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: C.primary, borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  cameraIcon: { fontSize: 14 },
  avatarName: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  avatarEmail: { fontSize: 13, color: C.muted, marginTop: 4 },
  sectionCard: { backgroundColor: C.card, borderRadius: R.lg, marginBottom: 16, overflow: 'hidden', ...S.sm },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0 },
  fieldMulti: { alignItems: 'flex-start' },
  fieldFocused: { backgroundColor: C.input },
  fieldIcon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.3, marginBottom: 4 },
  fieldInput: { fontSize: 15, color: C.primary, padding: 0 },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 48 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  availDot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },
  toggleBody: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: C.primary },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 16 },
  saveBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
