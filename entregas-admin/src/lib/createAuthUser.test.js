jest.mock('firebase/app', () => ({
  deleteApp: jest.fn(() => Promise.resolve()),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));

import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { createAuthUserWithSecondaryApp } from './createAuthUser';

describe('createAuthUserWithSecondaryApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cria usuario em auth secundaria sem trocar a sessao principal', async () => {
    const tempApp = { name: 'secondary-app' };
    const tempAuth = { app: tempApp };

    initializeApp.mockReturnValue(tempApp);
    getAuth.mockReturnValue(tempAuth);
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid-123' } });

    const uid = await createAuthUserWithSecondaryApp(
      { projectId: 'demo-project' },
      'cliente@empresa.com',
      '12345678'
    );

    expect(uid).toBe('uid-123');
    expect(initializeApp).toHaveBeenCalledWith(
      { projectId: 'demo-project' },
      expect.stringMatching(/^secondary-auth-/)
    );
    expect(getAuth).toHaveBeenCalledWith(tempApp);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      tempAuth,
      'cliente@empresa.com',
      '12345678'
    );
    expect(signOut).toHaveBeenCalledWith(tempAuth);
    expect(deleteApp).toHaveBeenCalledWith(tempApp);
  });
});
