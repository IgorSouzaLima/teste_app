// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../styles';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { Alert.alert('Atenção', 'Preencha e-mail e senha'); return; }
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (e) {
      Alert.alert('Erro', 'E-mail ou senha incorretos. Verifique com o administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={st.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={st.inner}>
        <View style={st.iconWrap}>
          <Text style={st.iconText}>🚛</Text>
        </View>
        <Text style={st.title}>Entregas</Text>
        <Text style={st.subtitle}>Acesso para motoristas</Text>

        <View style={st.form}>
          <Text style={st.label}>E-mail</Text>
          <TextInput
            style={st.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={colors.text3}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={st.label}>Senha</Text>
          <TextInput
            style={st.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            placeholderTextColor={colors.text3}
            secureTextEntry
          />

          <TouchableOpacity style={st.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={st.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <Text style={st.hint}>
            Problemas para entrar? Entre em contato com o administrador.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  iconWrap: {
    width: 72, height: 72, backgroundColor: colors.primary,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 32 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.text2, textAlign: 'center', marginTop: 4, marginBottom: 32 },
  form: { backgroundColor: colors.surface, borderRadius: 14, padding: 20, borderWidth: 0.5, borderColor: colors.border },
  label: { fontSize: 12, fontWeight: '500', color: colors.text2, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: colors.text, marginBottom: 14, backgroundColor: colors.bg,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, color: colors.text3, textAlign: 'center', marginTop: 14 },
});
