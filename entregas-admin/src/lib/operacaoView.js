import { filterViagensByStatusAndNota, getComprovanteDaViagem, getResumoVeiculo } from './viagemView';

function getMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return new Date(value).getTime();
}

function isWithinPeriod(viagem, periodo, now = new Date()) {
  if (!periodo || periodo === 'all') return true;

  const days = Number(String(periodo).replace('d', ''));
  if (!days) return true;

  const criadoEm = getMillis(viagem?.criadoEm);
  if (!criadoEm) return false;

  return criadoEm >= now.getTime() - (days * 24 * 60 * 60 * 1000);
}

function escapeCsv(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export function buildAlertasOperacionais(viagens) {
  const comprovantesPendentes = viagens.filter((viagem) => {
    const comprovante = getComprovanteDaViagem(viagem);
    return viagem.status === 'entregue' && comprovante && comprovante.status !== 'confirmado';
  });
  const emRota = viagens.filter((viagem) => viagem.status === 'em_rota');
  const agendadas = viagens.filter((viagem) => viagem.status === 'agendada');

  return [
    comprovantesPendentes.length > 0 && {
      id: 'comprovantes-pendentes',
      tone: 'warning',
      count: comprovantesPendentes.length,
      title: 'Comprovantes aguardando confirmação',
      description: 'Há entregas finalizadas com comprovante enviado e pendente de validação no painel.',
    },
    emRota.length > 0 && {
      id: 'viagens-em-rota',
      tone: 'info',
      count: emRota.length,
      title: 'Viagens em rota neste momento',
      description: 'Acompanhe o mapa ao vivo das cargas que já saíram para entrega.',
    },
    agendadas.length > 0 && {
      id: 'viagens-agendadas',
      tone: 'neutral',
      count: agendadas.length,
      title: 'Viagens aguardando início',
      description: 'Existem cargas agendadas esperando aceite e saída do motorista.',
    },
  ].filter(Boolean);
}

export function filterViagensPorPainel(viagens, { status = 'todos', nota = '', periodo = 'all', now = new Date() } = {}) {
  return filterViagensByStatusAndNota(viagens, status, nota)
    .filter((viagem) => isWithinPeriod(viagem, periodo, now));
}

export function buildViagensCsv(viagens) {
  const header = [
    'ID',
    'Cliente',
    'Motorista',
    'Veículo',
    'Notas',
    'Destino',
    'Status',
    'Criada em',
    'Saída',
    'Entrega',
  ];

  const rows = viagens.map((viagem) => [
    viagem.id,
    viagem.clienteNome,
    viagem.motoristaNome,
    getResumoVeiculo(viagem),
    (viagem.notas || []).join(' / '),
    viagem.cidadeDestino,
    viagem.status,
    new Date(getMillis(viagem.criadoEm) || 0).toISOString(),
    viagem.saidaEm ? new Date(getMillis(viagem.saidaEm)).toISOString() : '',
    viagem.entregaEm ? new Date(getMillis(viagem.entregaEm)).toISOString() : '',
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}
