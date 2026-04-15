export function getFotoUrl(item) {
  return item?.fotoUrl || item?.comprovanteFotoUrl || item?.secure_url || item?.url || null;
}

export function normalizarComprovanteDaColecao(viagem, item) {
  const fotoUrl = getFotoUrl(item);
  if (!fotoUrl) return null;

  return {
    viagemId: item.viagemId || viagem.id,
    id: item.id,
    fotoUrl,
    status: item.status || item.comprovanteStatus || 'pendente',
    latitude: item.latitude ?? item.comprovanteLatitude ?? null,
    longitude: item.longitude ?? item.comprovanteLongitude ?? null,
    enviadoEm: item.criadoEm || item.enviadoEm || item.comprovanteEnviadoEm || null,
    motoristaNome: item.motoristaNome || item.comprovanteMotoristaNome || viagem.motoristaNome,
    source: 'collection',
  };
}

export function getComprovanteDaViagem(viagem) {
  if (viagem?.status !== 'entregue') return null;

  const fotoUrl = getFotoUrl(viagem);
  if (!fotoUrl) return null;

  return {
    viagemId: viagem.id,
    id: `viagem-${viagem.id}`,
    fotoUrl,
    status: viagem.comprovanteStatus || 'pendente',
    latitude: viagem.comprovanteLatitude ?? null,
    longitude: viagem.comprovanteLongitude ?? null,
    enviadoEm: viagem.comprovanteEnviadoEm || viagem.entregaEm || null,
    motoristaNome: viagem.comprovanteMotoristaNome || viagem.motoristaNome,
    source: 'viagem',
  };
}

export function normalizarNotasRaw(notasRaw) {
  return String(notasRaw || '')
    .split(',')
    .map((nota) => nota.trim())
    .filter(Boolean);
}

export function buildNovaViagemPayload(form, criadoEm) {
  return {
    motoristaId: form.motoristaId,
    motoristaNome: form.motoristaNome,
    motoristaPlaca: form.veiculoPlaca || form.motoristaPlacaLegacy || form.motoristaPlaca,
    veiculoId: form.veiculoId || null,
    veiculoNome: form.veiculoNome || null,
    veiculoPlaca: form.veiculoPlaca || null,
    clienteId: form.clienteId,
    clienteNome: form.clienteNome,
    notas: normalizarNotasRaw(form.notasRaw),
    cidadeDestino: form.cidadeDestino,
    observacoes: form.observacoes,
    status: 'agendada',
    criadoEm,
    saidaEm: null,
    entregaEm: null,
    localizacaoAtual: null,
  };
}

export function matchesNota(viagem, termo) {
  const busca = String(termo || '').trim().toLowerCase();
  if (!busca) return true;

  return (viagem?.notas || []).some((nota) => String(nota).toLowerCase().includes(busca));
}

export function filterViagensByStatusAndNota(viagens, status, termo) {
  const lista = status === 'todos'
    ? viagens
    : viagens.filter((viagem) => viagem.status === status);

  return lista.filter((viagem) => matchesNota(viagem, termo));
}

export function getResumoVeiculo(viagem) {
  if (viagem.veiculoPlaca && viagem.veiculoNome) return `${viagem.veiculoPlaca} · ${viagem.veiculoNome}`;
  if (viagem.veiculoPlaca) return viagem.veiculoPlaca;
  return viagem.motoristaPlaca || '—';
}
