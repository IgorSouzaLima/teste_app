// src/lib/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getAccessValidationError } from './authAccess';

const AuthContext = createContext(null);

async function loadAdminProfile(firebaseUser) {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  const data = snap.data();
  const accessError = getAccessValidationError(data, 'admin');

  if (accessError === 'profile-missing') {
    const error = new Error('Perfil admin ausente');
    error.code = 'auth/profile-missing';
    throw error;
  }

  if (accessError === 'role-mismatch') {
    const error = new Error('Usuario sem permissao admin');
    error.code = 'auth/not-authorized-role';
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const data = await loadAdminProfile(firebaseUser);
          setUser(firebaseUser);
          setUserData(data);
        } catch (_) {
          await signOut(auth);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      await loadAdminProfile(cred.user);
      return cred;
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  };
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
