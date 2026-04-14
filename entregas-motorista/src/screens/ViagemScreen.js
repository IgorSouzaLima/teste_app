// src/screens/ViagemScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { uploadComprovanteParaCloudinary } from '../lib/cloudinary';
import { iniciarRastreamento, pararRastreamento } from '../lib/gpsTask';
import { colors, s } from '../styles';

function normalizarFotoSelecionada(asset) {
  if (!asset?.uri) return null;

  const mimeType = asset.mimeType?.startsWith('image/')
    ? asset.mimeType
    : 'image/jpeg';

  const extByName = asset.fileName?.split('.').pop()?.toLowerCase();
  const extByMime = mimeType.split('/')[1]?.toLowerCase();

  return {
    ...asset,
    fileName: asset.fileName || `comprovante.${extByName || extByMime || 'jpg'}`,
    mimeType,
  };
}

function formatarErroUpload(error) {
  if (error?.message) {
    return error.message;
  }

  return 'Nao foi possivel enviar o comprovante agora.';
}

export default function ViagemScreen({ route, navigation }) {
  const { viagem: viagemInicial } = route.params;
  const { motorista } = useAuth();
  const [viagem, setViagem] = useState(viagemInicial);
  const [historico, setHistorico] = useState([]);
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const scrollRef = useRef(null);

  // Ouvir updates da viagem em tempo real
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'viagens', viagem.id),
      snap => {
        if (!snap.exists()) return;

        const data = { id: snap.id, ...snap.data() };
        setViagem(data);

        const atual = data.localizacaoAtual;
        if (atual?.lat != null && atual?.lng != null) {
          setPosicaoAtual({ latitude: atual.lat, longitude: atual.lng });
          const atualizado = atual.atualizadoEm?.toDate?.() || null;
          if (atualizado) {
            setUltimaAtualizacao(atualizado);
          }
        }

        setTrackingError('');
      },
      () => setTrackingError('Nao foi possivel acompanhar o rastreamento desta viagem.')
    );
    return unsub;
  }, [viagem.id]);

  // Ouvir histórico de localizações
  useEffect(() => {
    const q = query(
      collection(db, 'viagens', viagem.id, 'localizacoes'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const locs = snap.docs
          .map(d => d.data())
          .filter(l => l.lat != null && l.lng != null);
        const coords = locs.map(l => ({ latitude: l.lat, longitude: l.lng }));

        setHistorico(coords);

        if (coords.length > 0) {
          const ultima = coords[coords.length - 1];
          setPosicaoAtual(ultima);
          const atualizado = locs[locs.length - 1]?.timestamp?.toDate?.() || null;
          if (atualizado) {
            setUltimaAtualizacao(atualizado);
          }
        }

        setTrackingError('');
      },
      () => setTrackingError('Nao foi possivel carregar o historico de localizacao.')
    );
    return unsub;
  }, [viagem.id]);

  const iniciarViagem = async () => {
    Alert.alert(
      'Iniciar viagem',
      `Confirma a saída para ${viagem.cidadeDestino}?\n\nO GPS será ativado e o cliente poderá acompanhar em tempo real.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar', style: 'default',
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Ative a localização para iniciar a viagem.');
                return;
              }
              await iniciarRastreamento(viagem.id, motorista.id);
              await updateDoc(doc(db, 'viagens', viagem.id), {
                status: 'em_rota',
                saidaEm: serverTimestamp(),
              });
            } catch (e) {
              Alert.alert('Erro', e.message);
            }
          }
        }
      ]
    );
  };

  const escolherFoto = async () => {
    Alert.alert(
      'Comprovante de entrega',
      'Como deseja adicionar a foto?',
      [
        { text: 'Câmera', onPress: () => abrirCamera() },
        { text: 'Galeria', onPress: () => abrirGaleria() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const abrirCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Ative a câmera.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false,
    });
    if (!result.canceled) setFotoSelecionada(normalizarFotoSelecionada(result.assets[0]));
  };

  const abrirGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (!result.canceled) setFotoSelecionada(normalizarFotoSelecionada(result.assets[0]));
  };

  const confirmarEntrega = async () => {
    if (!fotoSelecionada?.uri) { Alert.alert('Foto obrigatória', 'Tire ou selecione a foto do comprovante.'); return; }

    Alert.alert(
      'Confirmar entrega',
      'Tem certeza? Esta ação registrará a entrega como concluída.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar entrega', style: 'default',
          onPress: async () => {
            setUploading(true);
            try {
              // Pegar posição atual
              let lat = null, lng = null;
              try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
              } catch (_) {}

              setUploadProgress(25);
              const upload = await uploadComprovanteParaCloudinary(fotoSelecionada, viagem.id);
              setUploadProgress(85);

              // Salvar comprovante
              await addDoc(collection(db, 'comprovantes'), {
                viagemId: viagem.id,
                motoristaId: motorista.id,
                motoristaNome: motorista.nome,
                clienteId: viagem.clienteId,
                clienteNome: viagem.clienteNome,
                notas: viagem.notas,
                fotoUrl: upload.fotoUrl,
                fotoPath: upload.fotoPublicId,
                fotoProvider: 'cloudinary',
                fotoPublicId: upload.fotoPublicId,
                fotoBytes: upload.bytes,
                fotoFormat: upload.format,
                fotoWidth: upload.width,
                fotoHeight: upload.height,
                latitude: lat,
                longitude: lng,
                criadoEm: serverTimestamp(),
                status: 'pendente',
              });
              setUploadProgress(100);

              // Atualizar viagem como entregue
              await updateDoc(doc(db, 'viagens', viagem.id), {
                status: 'entregue',
                entregaEm: serverTimestamp(),
              });

              // Parar GPS
              await pararRastreamento();

              Alert.alert(
                'Entrega registrada!',
                'O comprovante foi enviado ao administrador e ao cliente. Boa viagem!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e) {
              Alert.alert('Erro', `Falha ao enviar comprovante: ${formatarErroUpload(e)}`);
            } finally {
              setUploading(false);
              setUploadProgress(0);
            }
          }
        }
      ]
    );
  };

  const isEmRota = viagem.status === 'em_rota';
  const isAgendada = viagem.status === 'agendada';
  const fmtCoords = (valor) => (typeof valor === 'number' ? valor.toFixed(5) : '—');
  const fmtHora = (data) => {
    if (!data) return 'Aguardando primeira atualizacao';
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView ref={scrollRef} style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

      {/* Cabeçalho da viagem */}
      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{viagem.clienteNome}</Text>
            <Text style={{ fontSize: 13, color: colors.text2, marginTop: 2 }}>Destino: {viagem.cidadeDestino}</Text>
          </View>
          <View style={[{
            backgroundColor: isEmRota ? colors.primaryBg : isAgendada ? '#F1EFE8' : colors.successBg,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
          }]}>
            <Text style={{
              fontSize: 11, fontWeight: '600',
              color: isEmRota ? colors.primaryText : isAgendada ? '#5F5E5A' : colors.success,
            }}>
              {isEmRota ? 'Em rota' : isAgendada ? 'Agendada' : 'Entregue'}
            </Text>
          </View>
        </View>

        {/* Notas fiscais */}
        <Text style={[s.label, { marginBottom: 6 }]}>Notas fiscais</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
          {(viagem.notas || []).map(n => (
            <View key={n} style={s.notaTag}>
              <Text style={s.notaTagText}>{n}</Text>
            </View>
          ))}
        </View>

        {viagem.observacoes ? (
          <View style={{ marginTop: 10, backgroundColor: colors.bg, borderRadius: 6, padding: 10 }}>
            <Text style={[s.label, { marginBottom: 2 }]}>Observações do admin</Text>
            <Text style={{ fontSize: 13, color: colors.text }}>{viagem.observacoes}</Text>
          </View>
        ) : null}
      </View>

      {/* Timeline */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Progresso da entrega</Text>
        <View style={s.tlContainer}>
          <View style={s.tlItem}>
            <View style={[s.tlDot, { backgroundColor: colors.success }]} />
            <View>
              <Text style={s.tlTitle}>Viagem recebida</Text>
              <Text style={s.tlSub}>Lançada pelo administrador</Text>
            </View>
          </View>

          <View style={s.tlItem}>
            <View style={[s.tlDot, {
              backgroundColor: isEmRota || viagem.status === 'entregue' ? colors.success : colors.border,
              borderWidth: isAgendada ? 1.5 : 0,
              borderColor: isAgendada ? colors.primary : 'transparent',
            }]} />
            <View>
              <Text style={[s.tlTitle, isAgendada && { color: colors.primary }]}>
                {isEmRota || viagem.status === 'entregue' ? 'Saída registrada' : 'Aguardando início'}
              </Text>
              <Text style={s.tlSub}>
                {isEmRota ? 'GPS ativo — posição sendo enviada' : 'Toque em "Iniciar viagem" abaixo'}
              </Text>
            </View>
          </View>

          <View style={s.tlItem}>
            <View style={[s.tlDot, {
              backgroundColor: viagem.status === 'entregue' ? colors.success : colors.border,
            }]} />
            <View>
              <Text style={[s.tlTitle, { color: viagem.status === 'entregue' ? colors.success : colors.text3 }]}>
                {viagem.status === 'entregue' ? 'Entrega concluída!' : 'Entrega + comprovante'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Mapa GPS */}
      {isEmRota && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Rastreamento ativo</Text>
          <View style={{
            backgroundColor: colors.primaryBg,
            borderRadius: 10,
            padding: 14,
            borderWidth: 1,
            borderColor: '#B5D4F4',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primaryText }}>
              GPS enviando sua localizacao
            </Text>
            <Text style={{ fontSize: 13, color: colors.primaryText, marginTop: 6 }}>
              Ultima atualizacao: {fmtHora(ultimaAtualizacao)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.primaryText, marginTop: 4 }}>
              Latitude: {fmtCoords(posicaoAtual?.latitude)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.primaryText, marginTop: 2 }}>
              Longitude: {fmtCoords(posicaoAtual?.longitude)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.primaryText, marginTop: 10 }}>
              {historico.length > 1
                ? `${historico.length} pontos enviados para o admin e o cliente.`
                : 'A primeira posicao pode levar alguns segundos para aparecer.'}
            </Text>
          </View>
          {trackingError ? (
            <Text style={[s.small, { marginTop: 8, textAlign: 'center', color: colors.danger }]}>
              {trackingError}
            </Text>
          ) : (
            <Text style={[s.small, { marginTop: 8, textAlign: 'center' }]}>
              Admin e cliente recebem as atualizacoes em tempo real.
            </Text>
          )}
        </View>
      )}

      {/* Botão iniciar viagem */}
      {isAgendada && (
        <TouchableOpacity style={[s.btn, s.btnPrimary, { marginBottom: 12 }]} onPress={iniciarViagem}>
          <Text style={[s.btnText, s.btnPrimaryText, { fontSize: 15 }]}>Iniciar viagem e ativar GPS</Text>
        </TouchableOpacity>
      )}

      {/* Seção comprovante */}
      {isEmRota && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Registrar entrega</Text>
          <Text style={{ fontSize: 13, color: colors.text2, marginBottom: 4 }}>
            Ao chegar no destino, fotografe o comprovante assinado pelo cliente.
          </Text>

          {!fotoSelecionada?.uri ? (
            <TouchableOpacity style={s.uploadArea} onPress={escolherFoto}>
              <Text style={{ fontSize: 28 }}>📷</Text>
              <Text style={s.uploadTitle}>Fotografar comprovante</Text>
              <Text style={s.uploadSub}>Câmera ou galeria</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Image source={{ uri: fotoSelecionada.uri }} style={{ width: '100%', height: 200, borderRadius: 8 }} />
              <TouchableOpacity
                style={{ marginTop: 8, alignItems: 'center' }}
                onPress={() => setFotoSelecionada(null)}
              >
                <Text style={{ color: colors.danger, fontSize: 13 }}>Tirar outra foto</Text>
              </TouchableOpacity>
            </View>
          )}

          {uploading && (
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>
                Enviando... {uploadProgress}%
              </Text>
            </View>
          )}

          {fotoSelecionada?.uri && !uploading && (
            <TouchableOpacity
              style={[s.btn, s.btnSuccess, { marginTop: 14 }]}
              onPress={confirmarEntrega}
            >
              <Text style={[s.btnText, s.btnSuccessText, { fontSize: 15 }]}>
                Confirmar entrega e enviar comprovante
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}
