import { matchesNota } from './viagemCliente';

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

export function getStatusTabsCliente(viagens) {
  const ids = ['todos', 'agendada', 'em_rota', 'entregue', 'cancelada'];
  const labels = {
    todos: 'Todas',
    agendada: 'Agendadas',
    em_rota: 'Em rota',
    entregue: 'Entregues',
    cancelada: 'Canceladas',
  };

  return ids.map((id) => ({
    id,
    label: labels[id],
    count: id === 'todos' ? viagens.length : viagens.filter((viagem) => viagem.status === id).length,
  }));
}

export function filterViagensCliente(viagens, { status = 'todos', nota = '', periodo = 'all', now = new Date() } = {}) {
  return viagens
    .filter((viagem) => status === 'todos' || viagem.status === status)
    .filter((viagem) => matchesNota(viagem, nota))
    .filter((viagem) => isWithinPeriod(viagem, periodo, now));
}

export function buildAlertasCliente(viagens) {
  const emRota = viagens.filter((viagem) => viagem.status === 'em_rota');
  const comComprovante = viagens.filter((viagem) => viagem.status === 'entregue' && !!viagem.comprovanteFotoUrl);
  const agendadas = viagens.filter((viagem) => viagem.status === 'agendada');

  return [
    emRota.length > 0 && {
      id: 'entrega-em-rota',
      tone: 'info',
      count: emRota.length,
      title: 'Entrega em rota agora',
      description: 'Acompanhe o motorista em tempo real e veja a última atualização do trajeto.',
    },
    comComprovante.length > 0 && {
      id: 'comprovante-disponivel',
      tone: 'success',
      count: comComprovante.length,
      title: 'Comprovante disponível',
      description: 'Uma ou mais entregas concluídas já têm comprovante disponível para consulta.',
    },
    agendadas.length > 0 && {
      id: 'entrega-agendada',
      tone: 'neutral',
      count: agendadas.length,
      title: 'Entrega aguardando início',
      description: 'Há cargas lançadas e aguardando o motorista iniciar a rota.',
    },
  ].filter(Boolean);
}

export function buildViagensClienteCsv(viagens) {
  const header = [
    'ID',
    'Destino',
    'Motorista',
    'Placa',
    'Notas',
    'Status',
    'Criada em',
    'Entrega',
  ];

  const rows = viagens.map((viagem) => [
    viagem.id,
    viagem.cidadeDestino,
    viagem.motoristaNome,
    viagem.motoristaPlaca,
    (viagem.notas || []).join(' / '),
    viagem.status,
    new Date(getMillis(viagem.criadoEm) || 0).toISOString(),
    viagem.entregaEm ? new Date(getMillis(viagem.entregaEm)).toISOString() : '',
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}
