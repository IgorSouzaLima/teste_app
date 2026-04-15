jest.mock('./firebase', () => ({
  db: {},
}));

import { buildAuditEntry } from './auditoria';

describe('auditoria', () => {
  test('monta registro com dados do ator e metadados da acao', () => {
    const criadoEm = 'timestamp-demo';
    const entry = buildAuditEntry({
      ator: { uid: 'admin-1', nome: 'Igor Souza', email: 'admin@empresa.com' },
      acao: 'viagem.criada',
      entidade: 'viagem',
      entidadeId: 'trip-1',
      descricao: 'Nova viagem lancada',
      meta: { clienteNome: 'Cliente XPTO' },
    }, criadoEm);

    expect(entry).toEqual({
      atorUid: 'admin-1',
      atorNome: 'Igor Souza',
      atorEmail: 'admin@empresa.com',
      acao: 'viagem.criada',
      entidade: 'viagem',
      entidadeId: 'trip-1',
      descricao: 'Nova viagem lancada',
      meta: { clienteNome: 'Cliente XPTO' },
      criadoEm,
    });
  });

  test('usa fallback quando o ator nao tiver nome', () => {
    const entry = buildAuditEntry({
      ator: { uid: 'admin-2', email: 'sem-nome@empresa.com' },
      acao: 'cliente.atualizado',
      entidade: 'cliente',
      descricao: 'Cliente atualizado',
    }, 'timestamp-demo');

    expect(entry.atorNome).toBe('sem-nome@empresa.com');
    expect(entry.entidadeId).toBeNull();
    expect(entry.meta).toEqual({});
  });
});
