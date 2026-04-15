import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export function buildAuditEntry({
  ator,
  acao,
  entidade,
  entidadeId = null,
  descricao,
  meta = {},
}, criadoEm) {
  return {
    atorUid: ator?.uid || null,
    atorNome: ator?.nome || ator?.email || 'Administrador',
    atorEmail: ator?.email || null,
    acao,
    entidade,
    entidadeId,
    descricao,
    meta,
    criadoEm,
  };
}

export async function registrarAuditoria({
  ator,
  acao,
  entidade,
  entidadeId = null,
  descricao,
  meta = {},
}) {
  try {
    await addDoc(collection(db, 'auditoria'), buildAuditEntry({
      ator,
      acao,
      entidade,
      entidadeId,
      descricao,
      meta,
    }, serverTimestamp()));
    return true;
  } catch (error) {
    console.warn('Falha ao registrar auditoria:', error);
    return false;
  }
}
