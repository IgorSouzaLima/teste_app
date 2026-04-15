import {
  filterViagensDaAba,
  getComprovanteDaViagem,
  normalizarComprovanteDaColecao,
  sortViagensByCriadoEmDesc,
  splitViagensPorAba,
} from './viagemCliente';

describe('viagemCliente', () => {
  test('ordena viagens por criadoEm decrescente', () => {
    const viagens = [
      { id: '1', criadoEm: { toMillis: () => 10 } },
      { id: '2', criadoEm: { toMillis: () => 50 } },
      { id: '3', criadoEm: { toMillis: () => 20 } },
    ];

    expect(sortViagensByCriadoEmDesc(viagens).map((item) => item.id)).toEqual(['2', '3', '1']);
  });

  test('separa viagens entre ativas, historico e em rota', () => {
    const viagens = [
      { id: '1', status: 'agendada' },
      { id: '2', status: 'em_rota' },
      { id: '3', status: 'entregue' },
      { id: '4', status: 'cancelada' },
    ];

    const resultado = splitViagensPorAba(viagens);

    expect(resultado.ativas.map((item) => item.id)).toEqual(['1', '2']);
    expect(resultado.historico.map((item) => item.id)).toEqual(['3', '4']);
    expect(resultado.emRota.map((item) => item.id)).toEqual(['2']);
  });

  test('filtra por aba e numero de nota', () => {
    const viagens = [
      { id: '1', status: 'agendada', notas: ['1001'] },
      { id: '2', status: 'entregue', notas: ['2002'] },
      { id: '3', status: 'cancelada', notas: ['9999'] },
    ];

    expect(filterViagensDaAba(viagens, 'ativas', '100').map((item) => item.id)).toEqual(['1']);
    expect(filterViagensDaAba(viagens, 'historico', '00').map((item) => item.id)).toEqual(['2']);
  });

  test('normaliza comprovante da colecao para o cliente', () => {
    const prova = normalizarComprovanteDaColecao(
      { id: 'v1', clienteNome: 'Cliente', motoristaNome: 'Motorista', notas: ['123'] },
      { id: 'c1', secure_url: 'https://img.test/comprovante.jpg', comprovanteStatus: 'confirmado' }
    );

    expect(prova).toMatchObject({
      id: 'c1',
      viagemId: 'v1',
      fotoUrl: 'https://img.test/comprovante.jpg',
      status: 'confirmado',
      clienteNome: 'Cliente',
    });
  });

  test('usa comprovante salvo na viagem somente quando entregue', () => {
    expect(getComprovanteDaViagem({
      id: 'v1',
      status: 'entregue',
      comprovanteFotoUrl: 'https://img.test/viagem.jpg',
      clienteNome: 'Cliente',
      motoristaNome: 'Motorista',
      notas: ['123'],
    })).toMatchObject({
      id: 'viagem-v1',
      fotoUrl: 'https://img.test/viagem.jpg',
      clienteNome: 'Cliente',
    });

    expect(getComprovanteDaViagem({
      id: 'v2',
      status: 'em_rota',
      comprovanteFotoUrl: 'https://img.test/viagem.jpg',
    })).toBeNull();
  });
});
