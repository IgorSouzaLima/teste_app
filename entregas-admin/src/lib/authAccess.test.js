import {
  getAccessValidationError,
  getLoginErrorMessage,
} from './authAccess';

describe('authAccess', () => {
  test('aceita perfil admin valido', () => {
    expect(getAccessValidationError({ role: 'admin' }, 'admin')).toBeNull();
  });

  test('rejeita usuario sem documento de perfil', () => {
    expect(getAccessValidationError(undefined, 'admin')).toBe('profile-missing');
  });

  test('rejeita usuario com role diferente', () => {
    expect(getAccessValidationError({ role: 'cliente' }, 'admin')).toBe('role-mismatch');
  });

  test('gera mensagem clara para perfil admin ausente', () => {
    expect(getLoginErrorMessage({ code: 'auth/profile-missing' })).toMatch(/perfil admin/i);
  });

  test('gera mensagem clara para role sem permissao', () => {
    expect(getLoginErrorMessage({ code: 'auth/not-authorized-role' })).toMatch(/sem permissao/i);
  });
});
