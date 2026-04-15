import {
  buildAlertasCliente,
  buildViagensClienteCsv,
  filterViagensCliente,
  getStatusTabsCliente,
} from './painelCliente';

const makeTs = (iso) => {
  const date = new Date(iso);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
};

describe('painelCliente', () => {
  const viagens = [
    { id: 'v1', status: 'agendada', notas: ['1001'], criadoEm: makeTs('2026-04-15T12:00:00Z'), cidadeDestino: 'Belo Horizonte', motoristaNome: 'Igor', motoristaPlaca: 'ABC-1234', clienteNome: 'Cliente A' },
    { id: 'v2', status: 'em_rota', notas: ['2002'], criadoEm: makeTs('2026-04-14T12:00:00Z'), cidadeDestino: 'Contagem', motoristaNome: 'Igor', motoristaPlaca: 'ABC-1234', clienteNome: 'Cliente A' },
    { id: 'v3', status: 'entregue', notas: ['3003'], criadoEm: makeTs('2026-04-13T12:00:00Z'), entregaEm: makeTs('2026-04-15T14:00:00Z'), comprovanteFotoUrl: 'https://img.test/comprovante.jpg', cidadeDestino: 'Betim', motoristaNome: 'Igor', motoristaPlaca: 'ABC-1234', clienteNome: 'Cliente A' },
    { id: 'v4', status: 'cancelada', notas: ['4004'], criadoEm: makeTs('2026-03-01T12:00:00Z'), cidadeDestino: 'Uberlândia', motoristaNome: 'Igor', motoristaPlaca: 'ABC-1234', clienteNome: 'Cliente A' },
  ];

  test('monta tabs com contagem por status e total', () => {
    const tabs = getStatusTabsCliente(viagens);

    expect(tabs.map((item) => [item.id, item.count])).toEqual([
      ['todos', 4],
      ['agendada', 1],
      ['em_rota', 1],
      ['entregue', 1],
      ['cancelada', 1],
    ]);
  });

  test('filtra viagens do cliente por status, nota e periodo', () => {
    const resultado = filterViagensCliente(viagens, {
      status: 'todos',
      nota: '00',
      periodo: '7d',
      now: new Date('2026-04-15T15:00:00Z'),
    });

    expect(resultado.map((item) => item.id)).toEqual(['v1', 'v2', 'v3']);

    const entregues = filterViagensCliente(viagens, {
      status: 'entregue',
      nota: '300',
      periodo: '30d',
      now: new Date('2026-04-15T15:00:00Z'),
    });

    expect(entregues.map((item) => item.id)).toEqual(['v3']);
  });

  test('gera alertas do cliente a partir das viagens mais recentes', () => {
    const alertas = buildAlertasCliente(viagens);

    expect(alertas.map((item) => item.id)).toEqual([
      'entrega-em-rota',
      'comprovante-disponivel',
      'entrega-agendada',
    ]);
    expect(alertas[1]).toMatchObject({ tone: 'success', count: 1 });
  });

  test('gera csv das viagens filtradas do cliente', () => {
    const csv = buildViagensClienteCsv([viagens[2]]);

    expect(csv).toContain('ID,Destino,Motorista,Placa,Notas,Status,Criada em,Entrega');
    expect(csv).toContain('v3,Betim,Igor,ABC-1234,3003,entregue');
  });
});
