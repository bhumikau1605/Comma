import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ImageBackground, TextInput, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from '../../utils/safeArea';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

const TYPE_CONFIG = {
  college:  { icon: '🎓', color: '#E8F0FE', accent: '#4A6FA5' },
  locality: { icon: '📍', color: '#E6F4EA', accent: '#4A7C59' },
  hobby:    { icon: '✨', color: '#FCE8F3', accent: '#9B4A7C' },
};

const TYPES = [
  { key: 'college', label: '🎓 College' },
  { key: 'locality', label: '📍 Locality' },
  { key: 'hobby', label: '✨ Hobby' },
];

export default function CommunitySelectScreen({ navigation }) {
  const { communities, selectCommunity, currentUser, loadCommunities } = useAppState();
  const insets = useSafeAreaInsets();

  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('college');
  const [loading, setLoading] = useState(false);
  const { C } = useTheme();
  const styles = getStyles(C, R, S);

  const handleSelect = async (community) => {
    await selectCommunity(community);
    navigation.replace('MainTabs');
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return Alert.alert('Error', 'Enter a community code');
    setLoading(true);
    try {
      const community = await AppwriteService.joinByInviteCode(currentUser.id, inviteCode.trim());
      await loadCommunities(currentUser.id);
      setShowJoin(false);
      setInviteCode('');
      Alert.alert('🎉 Joined!', `You joined ${community.name}`, [
        { text: 'Go there', onPress: () => handleSelect(community) },
        { text: 'Stay here' },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newDesc.trim()) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      const community = await AppwriteService.createCommunity(currentUser.id, {
        name: newName.trim(),
        description: newDesc.trim(),
        type: newType,
      });
      await loadCommunities(currentUser.id);
      setShowCreate(false);
      setNewName(''); setNewDesc('');
      Alert.alert('🎉 Created!', `Your community code is: ${community.inviteCode}\n\nShare this with others to invite them!`, [
        { text: 'Go there', onPress: () => handleSelect(community) },
        { text: 'Stay here' },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../../assets/bg.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View style={styles.logoBox}><Text style={styles.logoText}>,</Text></View>
          <Text style={styles.title}>Choose your{'\n'}community</Text>
          <Text style={styles.sub}>Connect with people around you</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowJoin(true)} activeOpacity={0.85}>
            <Text style={styles.actionBtnIcon}>🔑</Text>
            <Text style={styles.actionBtnText}>Join with Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
            <Text style={styles.actionBtnIcon}>➕</Text>
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Create New</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={communities}
          keyExtractor={c => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] ?? { icon: '👥', color: '#F0EDE6', accent: C.primary };
            return (
              <TouchableOpacity style={styles.tile} onPress={() => handleSelect(item)} activeOpacity={0.88}>
                <View style={[styles.iconWrap, { backgroundColor: cfg.color }]}>
                  <Text style={styles.tileIcon}>{cfg.icon}</Text>
                </View>
                <View style={styles.tileBody}>
                  <View style={styles.tileNameRow}>
                    <Text style={styles.tileName}>{item.name}</Text>
                    {item.inviteCode && (
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>{item.inviteCode}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tileDesc} numberOfLines={1}>{item.description}</Text>
                </View>
                <View style={styles.tileRight}>
                  <Text style={styles.memberCount}>{item.memberCount}</Text>
                  <Text style={styles.memberLabel}>members</Text>
                </View>
                <Text style={[styles.arrow, { color: cfg.accent }]}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Join Modal */}
      <Modal visible={showJoin} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalBg} onPress={() => setShowJoin(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>🔑 Join a Community</Text>
            <Text style={styles.sheetSub}>Enter the invite code shared by the community admin</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. IITDEL"
              placeholderTextColor={C.muted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity style={[styles.sheetBtn, loading && { opacity: 0.6 }]} onPress={handleJoin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Join Community</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalBg} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>➕ Create a Community</Text>
            <Text style={styles.sheetSub}>An invite code will be auto-generated for you to share</Text>

            <TextInput style={styles.sheetInput} placeholder="Community name" placeholderTextColor={C.muted} value={newName} onChangeText={setNewName} />
            <TextInput style={[styles.sheetInput, { height: 70 }]} placeholder="Description" placeholderTextColor={C.muted} value={newDesc} onChangeText={setNewDesc} multiline />

            <Text style={styles.typeLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeChip, newType === t.key && styles.typeChipActive]} onPress={() => setNewType(t.key)}>
                  <Text style={[styles.typeChipText, newType === t.key && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.sheetBtn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Create Community</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  logoBox: { width: 52, height: 52, backgroundColor: '#fff', borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...S.md },
  logoText: { fontSize: 34, fontWeight: '900', color: C.primary, lineHeight: 40 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.8, lineHeight: 40 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: R.md, padding: 12, gap: 6 },
  actionBtnPrimary: { backgroundColor: C.primary },
  actionBtnIcon: { fontSize: 16 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  list: { paddingBottom: 40 },
  tile: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: R.lg, padding: 14, flexDirection: 'row', alignItems: 'center', ...S.sm },
  iconWrap: { width: 46, height: 46, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tileIcon: { fontSize: 20 },
  tileBody: { flex: 1 },
  tileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileName: { fontSize: 14, fontWeight: '700', color: C.primary },
  codeTag: { backgroundColor: C.border, borderRadius: R.full, paddingHorizontal: 6, paddingVertical: 2 },
  codeTagText: { fontSize: 10, fontWeight: '700', color: C.muted },
  tileDesc: { fontSize: 11, color: C.muted, marginTop: 2 },
  tileRight: { alignItems: 'flex-end', marginRight: 8 },
  memberCount: { fontSize: 14, fontWeight: '700', color: C.primary },
  memberLabel: { fontSize: 10, color: C.muted },
  arrow: { fontSize: 22 },
  modalBg: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 24 },
  sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.primary, marginBottom: 6 },
  sheetSub: { fontSize: 13, color: C.muted, marginBottom: 20 },
  codeInput: { backgroundColor: C.card, borderRadius: R.md, padding: 16, fontSize: 22, fontWeight: '800', color: C.primary, letterSpacing: 4, textAlign: 'center', marginBottom: 16, ...S.sm },
  sheetInput: { backgroundColor: C.card, borderRadius: R.md, padding: 14, fontSize: 15, color: C.primary, marginBottom: 12, ...S.sm },
  typeLabel: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: 10, alignItems: 'center', ...S.sm },
  typeChipActive: { backgroundColor: C.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: C.primary },
  sheetBtn: { backgroundColor: C.primary, borderRadius: R.md, padding: 16, alignItems: 'center' },
  sheetBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
