export function getFotoUrl(item) {
  return item?.fotoUrl || item?.comprovanteFotoUrl || item?.secure_url || item?.url || null;
}

export function normalizarComprovanteDaColecao(viagem, item) {
  const fotoUrl = getFotoUrl(item);
  if (!fotoUrl) return null;

  return {
    id: item.id,
    viagemId: item.viagemId || viagem.id,
    clienteNome: item.clienteNome || viagem.clienteNome,
    motoristaNome: item.motoristaNome || item.comprovanteMotoristaNome || viagem.motoristaNome,
    notas: item.notas || viagem.notas || [],
    latitude: item.latitude ?? item.comprovanteLatitude ?? null,
    longitude: item.longitude ?? item.comprovanteLongitude ?? null,
    criadoEm: item.criadoEm || item.enviadoEm || item.comprovanteEnviadoEm || null,
    status: item.status || item.comprovanteStatus || 'pendente',
    fotoUrl,
  };
}

export function getComprovanteDaViagem(viagem) {
  if (viagem?.status !== 'entregue') return null;

  const fotoUrl = getFotoUrl(viagem);
  if (!fotoUrl) return null;

  return {
    id: `viagem-${viagem.id}`,
    viagemId: viagem.id,
    clienteNome: viagem.clienteNome,
    motoristaNome: viagem.comprovanteMotoristaNome || viagem.motoristaNome,
    notas: viagem.notas,
    latitude: viagem.comprovanteLatitude ?? null,
    longitude: viagem.comprovanteLongitude ?? null,
    criadoEm: viagem.comprovanteEnviadoEm || viagem.entregaEm || null,
    status: viagem.comprovanteStatus || 'pendente',
    fotoUrl,
  };
}

export function sortViagensByCriadoEmDesc(viagens) {
  return [...viagens].sort((a, b) => {
    const aTs = a.criadoEm?.toMillis?.() || 0;
    const bTs = b.criadoEm?.toMillis?.() || 0;
    return bTs - aTs;
  });
}

export function matchesNota(viagem, termo) {
  const busca = String(termo || '').trim().toLowerCase();
  if (!busca) return true;

  return (viagem?.notas || []).some((nota) => String(nota).toLowerCase().includes(busca));
}

export function splitViagensPorAba(viagens) {
  return {
    ativas: viagens.filter((viagem) => viagem.status === 'agendada' || viagem.status === 'em_rota'),
    historico: viagens.filter((viagem) => viagem.status === 'entregue' || viagem.status === 'cancelada'),
    emRota: viagens.filter((viagem) => viagem.status === 'em_rota'),
  };
}

export function filterViagensDaAba(viagens, aba, termo) {
  const { ativas, historico } = splitViagensPorAba(viagens);
  const base = aba === 'ativas' ? ativas : historico;
  return base.filter((viagem) => matchesNota(viagem, termo));
}
