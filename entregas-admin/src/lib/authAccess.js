export function getAccessValidationError(profile, requiredRole) {
  if (!profile) return 'profile-missing';
  if (profile.role !== requiredRole) return 'role-mismatch';
  return null;
}

export function getLoginErrorMessage(error) {
  switch (error?.code) {
    case 'auth/profile-missing':
      return 'Login autenticado, mas o perfil admin nao existe no Firestore.';
    case 'auth/not-authorized-role':
      return 'Usuario autenticado, mas sem permissao de administrador.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Sem permissao para ler o perfil deste usuario no Firestore.';
    case 'auth/invalid-login-credentials':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    default:
      return 'Nao foi possivel entrar. Verifique o usuario admin no Firebase.';
  }
}
