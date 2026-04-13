import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';

export async function createAuthUserWithSecondaryApp(firebaseConfig, email, password) {
  const appName = `secondary-auth-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, appName);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    await signOut(tempAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(tempApp);
  }
}
