import * as Location from 'expo-location';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const GPS_TASK_NAME = 'GPS_TRACKING_TASK';

let _viagemId = null;
let _motoristaId = null;
let _locationSubscription = null;

function setViagemAtiva(viagemId, motoristaId) {
  _viagemId = viagemId;
  _motoristaId = motoristaId;
}

function clearViagemAtiva() {
  _viagemId = null;
  _motoristaId = null;
}

async function persistirLocalizacao(coords) {
  if (!_viagemId || !coords) return;

  const { latitude, longitude, speed, accuracy } = coords;

  await addDoc(collection(db, 'viagens', _viagemId, 'localizacoes'), {
    lat: latitude,
    lng: longitude,
    velocidade: speed ? Math.round(speed * 3.6) : 0,
    precisao: Math.round(accuracy || 0),
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, 'viagens', _viagemId), {
    localizacaoAtual: {
      lat: latitude,
      lng: longitude,
      atualizadoEm: serverTimestamp(),
    },
  });
}

export async function limparRastreamentoLegado() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(GPS_TASK_NAME).catch(() => {});
  }
}

export async function iniciarRastreamento(viagemId, motoristaId) {
  setViagemAtiva(viagemId, motoristaId);
  await limparRastreamentoLegado();

  if (_locationSubscription) {
    return;
  }

  const servicosAtivos = await Location.hasServicesEnabledAsync();
  if (!servicosAtivos) {
    throw new Error('Ative a localizacao do aparelho para iniciar a viagem.');
  }

  try {
    const posicaoInicial = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await persistirLocalizacao(posicaoInicial.coords);
  } catch (error) {
    console.warn('Nao foi possivel obter a posicao inicial:', error);
  }

  _locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 20,
    },
    async (location) => {
      try {
        await persistirLocalizacao(location.coords);
      } catch (error) {
        console.error('Erro ao salvar GPS:', error);
      }
    }
  );
}

export async function pararRastreamento() {
  clearViagemAtiva();
  await limparRastreamentoLegado();

  if (_locationSubscription) {
    _locationSubscription.remove();
    _locationSubscription = null;
  }
}
