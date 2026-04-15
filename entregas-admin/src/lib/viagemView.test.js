import {
  buildNovaViagemPayload,
  filterViagensByStatusAndNota,
  getComprovanteDaViagem,
  getResumoVeiculo,
  normalizarComprovanteDaColecao,
  normalizarNotasRaw,
} from './viagemView';

describe('viagemView', () => {
  test('normaliza notas separadas por virgula removendo espacos e vazios', () => {
    expect(normalizarNotasRaw(' 123 , , 456,789 ')).toEqual(['123', '456', '789']);
  });

  test('monta payload da viagem priorizando placa do veiculo sobre placa legada', () => {
    const payload = buildNovaViagemPayload({
      motoristaId: 'mot-1',
      motoristaNome: 'Igor',
      motoristaPlaca: '',
      motoristaPlacaLegacy: 'OLD-1000',
      veiculoId: 'vei-1',
      veiculoNome: 'Sprinter',
      veiculoPlaca: 'NEW-2000',
      clienteId: 'cli-1',
      clienteNome: 'Cliente',
      notasRaw: '1001, 1002',
      cidadeDestino: 'Belo Horizonte',
      observacoes: 'Teste',
    }, 'timestamp-demo');

    expect(payload).toMatchObject({
      motoristaPlaca: 'NEW-2000',
      veiculoId: 'vei-1',
      veiculoPlaca: 'NEW-2000',
      notas: ['1001', '1002'],
      status: 'agendada',
      criadoEm: 'timestamp-demo',
    });
  });

  test('filtra viagens por status e busca de nota', () => {
    const viagens = [
      { id: '1', status: 'agendada', notas: ['111'] },
      { id: '2', status: 'em_rota', notas: ['222'] },
      { id: '3', status: 'entregue', notas: ['322'] },
    ];

    expect(filterViagensByStatusAndNota(viagens, 'todos', '22').map((item) => item.id)).toEqual(['2', '3']);
    expect(filterViagensByStatusAndNota(viagens, 'em_rota', '22').map((item) => item.id)).toEqual(['2']);
  });

  test('resolve resumo do veiculo com placa e descricao quando houver', () => {
    expect(getResumoVeiculo({ veiculoPlaca: 'ABC-1234', veiculoNome: 'Van' })).toBe('ABC-1234 · Van');
    expect(getResumoVeiculo({ motoristaPlaca: 'OLD-1000' })).toBe('OLD-1000');
  });

  test('normaliza comprovante vindo da colecao', () => {
    const prova = normalizarComprovanteDaColecao(
      { id: 'v1', motoristaNome: 'Motorista' },
      { id: 'c1', viagemId: 'v1', secure_url: 'https://img.test/prova.jpg', comprovanteStatus: 'confirmado' }
    );

    expect(prova).toMatchObject({
      id: 'c1',
      viagemId: 'v1',
      fotoUrl: 'https://img.test/prova.jpg',
      status: 'confirmado',
      source: 'collection',
    });
  });

  test('usa comprovante da propria viagem apenas quando entregue', () => {
    expect(getComprovanteDaViagem({
      id: 'v1',
      status: 'entregue',
      comprovanteFotoUrl: 'https://img.test/viagem.jpg',
      motoristaNome: 'Motorista',
    })).toMatchObject({
      id: 'viagem-v1',
      fotoUrl: 'https://img.test/viagem.jpg',
      source: 'viagem',
    });

    expect(getComprovanteDaViagem({
      id: 'v2',
      status: 'em_rota',
      comprovanteFotoUrl: 'https://img.test/viagem.jpg',
    })).toBeNull();
  });
});
