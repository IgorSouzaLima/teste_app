// src/screens/PerfilScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { colors, s } from '../styles';

const InfoRow = ({ label, value, last }) => (
  <View style={[s.row, last && s.rowLast]}>
    <Text style={s.label}>{label}</Text>
    <Text style={s.value}>{value || '—'}</Text>
  </View>
);

export default function PerfilScreen() {
  const { motorista, user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.screen}>
      <View style={s.header}>
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 28 }}>👤</Text>
        </View>
        <Text style={[s.headerTitle, { fontSize: 20 }]}>{motorista?.nome}</Text>
        <Text style={s.headerSub}>{user?.email}</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Dados do veículo</Text>
          <InfoRow label="Placa" value={motorista?.placa} />
          <InfoRow label="Veículo" value={motorista?.veiculo} />
          <InfoRow label="CNH" value={motorista?.cnh} last />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Contato</Text>
          <InfoRow label="Telefone" value={motorista?.telefone} />
          <InfoRow label="CPF" value={motorista?.cpf} last />
        </View>

        <View style={{
          backgroundColor: colors.primaryBg, borderRadius: 10, padding: 14, marginBottom: 16,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primaryText, marginBottom: 4 }}>
            GPS em segundo plano
          </Text>
          <Text style={{ fontSize: 12, color: colors.primaryText, lineHeight: 18 }}>
            Durante uma viagem ativa, sua localização é enviada automaticamente a cada 10 segundos,
            mesmo com o app em segundo plano. O rastreamento para automaticamente ao confirmar a entrega.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, s.btnDanger]}
          onPress={handleLogout}
        >
          <Text style={[s.btnText, s.btnDangerText]}>Sair do aplicativo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
