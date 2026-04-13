// src/lib/firebase.js
// ⚠️  Use os MESMOS valores do projeto Firebase do painel admin

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCo-4jTCPFPcvKcuGV9m3Ge9djEX_vclnE",
  authDomain: "entregas-prod.firebaseapp.com",
  projectId: "entregas-prod",
  storageBucket: "entregas-prod.firebasestorage.app",
  messagingSenderId: "141219868223",
  appId: "1:141219868223:web:398b02882d660c2e2b528a",
  measurementId: "G-WNNQM9QDKW"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
