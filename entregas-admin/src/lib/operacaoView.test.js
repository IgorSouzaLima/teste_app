import {
  buildAlertasOperacionais,
  buildViagensCsv,
  filterViagensPorPainel,
} from './operacaoView';

const makeTs = (iso) => {
  const date = new Date(iso);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
};

describe('operacaoView', () => {
  const viagens = [
    {
      id: 'v1',
      clienteNome: 'Cliente A',
      motoristaNome: 'Motorista 1',
      motoristaPlaca: 'ABC-1234',
      notas: ['1001'],
      cidadeDestino: 'Belo Horizonte',
      status: 'agendada',
      criadoEm: makeTs('2026-04-15T12:00:00Z'),
    },
    {
      id: 'v2',
      clienteNome: 'Cliente B',
      motoristaNome: 'Motorista 2',
      motoristaPlaca: 'DEF-5678',
      notas: ['2002'],
      cidadeDestino: 'Contagem',
      status: 'em_rota',
      criadoEm: makeTs('2026-04-14T12:00:00Z'),
    },
    {
      id: 'v3',
      clienteNome: 'Cliente C',
      motoristaNome: 'Motorista 3',
      motoristaPlaca: 'GHI-9012',
      notas: ['3003'],
      cidadeDestino: 'Betim',
      status: 'entregue',
      comprovanteFotoUrl: 'https://img.test/comprovante.jpg',
      comprovanteStatus: 'pendente',
      criadoEm: makeTs('2026-04-13T12:00:00Z'),
      entregaEm: makeTs('2026-04-15T14:00:00Z'),
    },
  ];

  test('monta alertas operacionais a partir do estado das viagens', () => {
    const alertas = buildAlertasOperacionais(viagens);

    expect(alertas.map((item) => item.id)).toEqual([
      'comprovantes-pendentes',
      'viagens-em-rota',
      'viagens-agendadas',
    ]);
    expect(alertas[0]).toMatchObject({
      tone: 'warning',
      count: 1,
    });
  });

  test('filtra viagens por status, nota e periodo', () => {
    const resultado = filterViagensPorPainel(viagens, {
      status: 'todos',
      nota: '00',
      periodo: '7d',
      now: new Date('2026-04-15T15:00:00Z'),
    });

    expect(resultado.map((item) => item.id)).toEqual(['v1', 'v2', 'v3']);

    const apenasEmRota = filterViagensPorPainel(viagens, {
      status: 'em_rota',
      nota: '200',
      periodo: '7d',
      now: new Date('2026-04-15T15:00:00Z'),
    });

    expect(apenasEmRota.map((item) => item.id)).toEqual(['v2']);
  });

  test('gera csv com cabecalho e linhas das viagens filtradas', () => {
    const csv = buildViagensCsv([viagens[1]]);

    expect(csv).toContain('ID,Cliente,Motorista,Veículo,Notas,Destino,Status,Criada em,Saída,Entrega');
    expect(csv).toContain('v2,Cliente B,Motorista 2,DEF-5678,2002,Contagem,em_rota');
  });
});
