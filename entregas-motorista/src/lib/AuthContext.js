// src/lib/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [motorista, setMotorista] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userSnap.data();
        if (userData?.role === 'motorista' && userData?.motoristaId) {
          const motSnap = await getDoc(doc(db, 'motoristas', userData.motoristaId));
          setUser({ ...firebaseUser, ...userData });
          setMotorista({ id: motSnap.id, ...motSnap.data() });
        } else {
          await signOut(auth);
          setUser(null);
          setMotorista(null);
        }
      } else {
        setUser(null);
        setMotorista(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, motorista, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
