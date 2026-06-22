import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { useTheme } from '../../ThemeContext';
import { R, S } from '../../theme';

export default function SignupScreen({ navigation }) {
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { C } = useTheme();

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Oops', 'Enter your name');
    if (!email.includes('@')) return Alert.alert('Oops', 'Enter a valid email address');
    if (password.length < 6) return Alert.alert('Oops', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await AppwriteService.signUp(name.trim(), email, password);
      await login(user);
      navigation.replace('CommunitySelect');
    } catch (e) {
      Alert.alert('Sign Up Failed', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, name: fname, right }) => (
    <View style={[styles.field, focused === fname && styles.fieldFocused]}>
      <Text style={styles.fieldIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={() => setFocused(fname)}
        onBlur={() => setFocused('')}
      />
      {right}
    </View>
  );

  const styles = getStyles(C, R, S);

  return (
    <ImageBackground source={require('../../../assets/bg.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>,</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.greeting}>Join the community</Text>
            <Text style={styles.title}>Create your account</Text>

            <Field icon="👤" placeholder="Full name" value={name} onChangeText={setName} name="name" />
            <Field icon="✉️" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" name="email" />
            <Field
              icon="🔒" placeholder="Password" value={password} onChangeText={setPassword}
              secureTextEntry={obscure} name="password"
              right={
                <TouchableOpacity onPress={() => setObscure(p => !p)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{obscure ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.replace('Login')} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const getStyles = (C, R, S) => StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoBox: { width: 72, height: 72, backgroundColor: '#fff', borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', ...S.lg },
  logoText: { fontSize: 48, fontWeight: '900', color: C.primary, lineHeight: 56 },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: 28, ...S.lg },
  greeting: { fontSize: 13, color: C.muted, marginBottom: 4, letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: '800', color: C.primary, marginBottom: 28, letterSpacing: -0.5 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: R.md, marginBottom: 14, borderWidth: 1.5, borderColor: 'transparent' },
  fieldFocused: { borderColor: C.primary, backgroundColor: '#fff' },
  fieldIcon: { fontSize: 16, paddingLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 15, color: C.primary },
  eyeBtn: { paddingRight: 14 },
  eyeIcon: { fontSize: 16 },
  btn: { backgroundColor: C.primary, borderRadius: R.md, padding: 16, alignItems: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.muted, fontSize: 13, marginHorizontal: 12 },
  secondaryBtn: { backgroundColor: C.input, borderRadius: R.md, padding: 16, alignItems: 'center' },
  secondaryBtnText: { color: C.primary, fontSize: 15, fontWeight: '600' },
});
