// src/lib/gpsTask.js
// Rastreamento GPS em segundo plano — envia posição ao Firestore a cada 10s
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const GPS_TASK_NAME = 'GPS_TRACKING_TASK';

// viagemId ativo (compartilhado via módulo)
let _viagemId = null;
let _motoristaId = null;
export const setViagemAtiva = (viagemId, motoristaId) => {
  _viagemId = viagemId;
  _motoristaId = motoristaId;
};
export const clearViagemAtiva = () => {
  _viagemId = null;
  _motoristaId = null;
};

TaskManager.defineTask(GPS_TASK_NAME, async ({ data, error }) => {
  if (error) { console.error('GPS task error:', error); return; }
  if (!data || !_viagemId) return;

  const { locations } = data;
  const loc = locations[0];
  if (!loc) return;

  const { latitude, longitude, speed, accuracy } = loc.coords;

  try {
    // Salva ponto no histórico
    await addDoc(collection(db, 'viagens', _viagemId, 'localizacoes'), {
      lat: latitude,
      lng: longitude,
      velocidade: speed ? Math.round(speed * 3.6) : 0,
      precisao: Math.round(accuracy),
      timestamp: serverTimestamp(),
    });

    // Atualiza posição atual na viagem (para mapa ao vivo)
    await updateDoc(doc(db, 'viagens', _viagemId), {
      localizacaoAtual: {
        lat: latitude,
        lng: longitude,
        atualizadoEm: serverTimestamp(),
      }
    });
  } catch (e) {
    console.error('Erro ao salvar GPS:', e);
  }
});

export async function iniciarRastreamento(viagemId, motoristaId) {
  setViagemAtiva(viagemId, motoristaId);

  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de localização em segundo plano negada');
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME).catch(() => false);
  if (!isRunning) {
    await Location.startLocationUpdatesAsync(GPS_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,       // a cada 10 segundos
      distanceInterval: 20,      // ou a cada 20 metros
      foregroundService: {
        notificationTitle: 'Entrega em andamento',
        notificationBody: 'Rastreamento GPS ativo — toque para abrir o app',
        notificationColor: '#185FA5',
      },
    });
  }
}

export async function pararRastreamento() {
  clearViagemAtiva();
  const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(GPS_TASK_NAME);
  }
}
