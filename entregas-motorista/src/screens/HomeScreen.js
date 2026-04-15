// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { colors, s } from '../styles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabel = { agendada: 'Agendada', em_rota: 'Em rota', entregue: 'Entregue', cancelada: 'Cancelada' };
const statusColor = {
  agendada: { bg: '#F1EFE8', text: '#5F5E5A' },
  em_rota: { bg: colors.primaryBg, text: colors.primaryText },
  entregue: { bg: colors.successBg, text: colors.success },
  cancelada: { bg: colors.dangerBg, text: colors.danger },
};

export default function HomeScreen({ navigation }) {
  const { motorista, logout } = useAuth();
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!motorista?.id) {
      setViagens([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    const q = query(
      collection(db, 'viagens'),
      where('motoristaId', '==', motorista.id)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTs = a.criadoEm?.toMillis?.() || 0;
            const bTs = b.criadoEm?.toMillis?.() || 0;
            return bTs - aTs;
          });

        setViagens(docs);
        setLoadError('');
        setLoading(false);
      },
      error => {
        console.warn('Erro ao carregar viagens do motorista:', error);
        setViagens([]);
        setLoadError('Nao foi possivel carregar suas cargas agora.');
        setLoading(false);
      }
    );

    return unsub;
  }, [motorista]);

  const fmtData = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM HH:mm", { locale: ptBR });
  };

  const viagensAgendadas = viagens.filter((item) => item.status === 'agendada');
  const viagensEmRota = viagens.filter((item) => item.status === 'em_rota');
  const viagensEntregues = viagens.filter((item) => item.status === 'entregue');

  const renderViagem = ({ item }) => {
    const sc = statusColor[item.status] || statusColor.agendada;
    const podeTap = item.status === 'agendada' || item.status === 'em_rota';

    return (
      <TouchableOpacity
        style={[st.itemCard, !podeTap && { opacity: 0.6 }]}
        onPress={() => podeTap && navigation.navigate('Viagem', { viagem: item })}
        activeOpacity={podeTap ? 0.7 : 1}
      >
        <View style={st.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={st.itemCliente}>{item.clienteNome}</Text>
            <Text style={st.itemDestino}>{item.cidadeDestino}</Text>
          </View>
          <View style={[st.badge, { backgroundColor: sc.bg }]}>
            <Text style={[st.badgeText, { color: sc.text }]}>{statusLabel[item.status]}</Text>
          </View>
        </View>

        <View style={st.notasRow}>
          {(item.notas || []).map(n => (
            <View key={n} style={s.notaTag}>
              <Text style={s.notaTagText}>{n}</Text>
            </View>
          ))}
        </View>

        <Text style={st.dataText}>{fmtData(item.criadoEm)}</Text>

        {item.status === 'agendada' && (
          <View style={st.tapHint}>
            <Text style={st.tapHintText}>Toque para iniciar esta viagem →</Text>
          </View>
        )}
        {item.status === 'em_rota' && (
          <View style={[st.tapHint, { backgroundColor: colors.primaryBg }]}>
            <Text style={[st.tapHintText, { color: colors.primaryText }]}>Em andamento — toque para gerenciar →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Olá, {motorista?.nome?.split(' ')[0]}</Text>
        <Text style={s.headerSub}>{motorista?.placa} · {motorista?.veiculo}</Text>
      </View>

      <View style={st.alertPanel}>
        <Text style={st.alertTitle}>Central de avisos</Text>
        <View style={st.alertGrid}>
          <View style={[st.alertCard, { backgroundColor: colors.primaryBg }]}>
            <Text style={[st.alertCount, { color: colors.primaryText }]}>{viagensAgendadas.length}</Text>
            <Text style={st.alertLabel}>Aguardando início</Text>
          </View>
          <View style={[st.alertCard, { backgroundColor: '#eef6ff' }]}>
            <Text style={[st.alertCount, { color: colors.primary }]}>{viagensEmRota.length}</Text>
            <Text style={st.alertLabel}>Em andamento</Text>
          </View>
          <View style={[st.alertCard, { backgroundColor: colors.successBg }]}>
            <Text style={[st.alertCount, { color: colors.success }]}>{viagensEntregues.length}</Text>
            <Text style={st.alertLabel}>Já concluídas</Text>
          </View>
        </View>
        <Text style={st.alertCopy}>
          {viagensAgendadas.length > 0
            ? 'As viagens novas aparecem acima e podem ser iniciadas diretamente pela lista.'
            : 'Sem novas cargas pendentes. Assim que o admin lançar uma viagem, ela aparece aqui.'}
        </Text>
      </View>

      <FlatList
        data={viagens}
        keyExtractor={item => item.id}
        renderItem={renderViagem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>
              {loadError ? 'Erro ao carregar' : 'Nenhuma viagem'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text2, marginTop: 4 }}>
              {loadError || 'Aguardando lançamento pelo administrador'}
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={false} tintColor={colors.primary} />}
      />
    </View>
  );
}

const st = StyleSheet.create({
  alertPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  alertGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  alertCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
  },
  alertCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  alertLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text2,
    fontWeight: '500',
  },
  alertCopy: {
    marginTop: 12,
    fontSize: 12,
    color: colors.text2,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemCliente: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemDestino: { fontSize: 12, color: colors.text2, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  notasRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  dataText: { fontSize: 11, color: colors.text3 },
  tapHint: {
    marginTop: 8, backgroundColor: colors.bg, borderRadius: 6,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  tapHintText: { fontSize: 12, color: colors.text2, fontWeight: '500' },
});
