// src/components/CardViagem.js
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import MapaAoVivo from './MapaAoVivo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabel = {
  agendada: 'Agendada',
  em_rota: 'Em rota',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};
const statusBadge = {
  agendada: 'badge-gray',
  em_rota: 'badge-info',
  entregue: 'badge-success',
  cancelada: 'badge badge-warning',
};

export default function CardViagem({ viagemId, defaultAberto = false }) {
  const [viagem, setViagem] = useState(null);
  const [aberto, setAberto] = useState(defaultAberto);

  const fmtData = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Ouvir viagem em tempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'viagens', viagemId), snap => {
      if (snap.exists()) setViagem({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [viagemId]);

  if (!viagem) return null;

  const comprovanteDaViagem = viagem.comprovanteFotoUrl ? {
    id: `viagem-${viagem.id}`,
    viagemId: viagem.id,
    clienteNome: viagem.clienteNome,
    motoristaNome: viagem.comprovanteMotoristaNome || viagem.motoristaNome,
    notas: viagem.notas,
    latitude: viagem.comprovanteLatitude ?? null,
    longitude: viagem.comprovanteLongitude ?? null,
    criadoEm: viagem.comprovanteEnviadoEm || viagem.entregaEm || null,
    status: viagem.comprovanteStatus || 'pendente',
    fotoUrl: viagem.comprovanteFotoUrl,
  } : null;

  const comprovanteEfetivo = comprovanteDaViagem;

  const isEmRota = viagem.status === 'em_rota';
  const isEntregue = viagem.status === 'entregue';
  const comprovanteEnviado = !!comprovanteEfetivo;

  return (
    <div className="card" style={{ marginBottom: 14 }}>

      {/* Cabeçalho do card */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setAberto(a => !a)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span className={`badge ${statusBadge[viagem.status]}`}>
              {isEmRota && <span className="live-dot" />}
              {statusLabel[viagem.status]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtData(viagem.criadoEm)}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {viagem.cidadeDestino}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            Motorista: {viagem.motoristaNome} · {viagem.motoristaPlaca}
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--text-3)', marginLeft: 8, userSelect: 'none' }}>
          {aberto ? '▲' : '▼'}
        </span>
      </div>

      {/* Notas fiscais — sempre visíveis */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 8 }}>
        {(viagem.notas || []).map(n => (
          <span key={n} className="nota-tag">{n}</span>
        ))}
      </div>

      {/* Conteúdo expandível */}
      {aberto && (
        <div style={{ marginTop: 14 }}>

          {/* Entrega confirmada */}
          {isEntregue && (
            <div className="entregue-banner">
              <div className="entregue-banner-title">Entrega confirmada!</div>
              <div className="entregue-banner-sub">{fmtData(viagem.entregaEm)}</div>
            </div>
          )}

          {/* Info rows */}
          <div className="info-row">
            <span className="info-label">Motorista</span>
            <span className="info-value">{viagem.motoristaNome}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Placa</span>
            <span className="info-value">{viagem.motoristaPlaca}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Destino</span>
            <span className="info-value">{viagem.cidadeDestino}</span>
          </div>
          {viagem.saidaEm && (
            <div className="info-row">
              <span className="info-label">Saída registrada</span>
              <span className="info-value">{fmtData(viagem.saidaEm)}</span>
            </div>
          )}
          {viagem.entregaEm && (
            <div className="info-row">
              <span className="info-label">Entrega concluída</span>
              <span className="info-value" style={{ color: 'var(--success)' }}>
                {fmtData(viagem.entregaEm)}
              </span>
            </div>
          )}

          {/* Timeline de status */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Progresso
            </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-dot tl-dot-done" />
                <div>
                  <div className="tl-title">Viagem lançada</div>
                  <div className="tl-sub">{fmtData(viagem.criadoEm)}</div>
                </div>
              </div>
              <div className="tl-item">
                <div className={`tl-dot ${viagem.saidaEm ? 'tl-dot-done' : isEmRota ? 'tl-dot-active' : 'tl-dot-pend'}`} />
                <div>
                  <div className="tl-title" style={{ color: isEmRota && !viagem.saidaEm ? 'var(--primary)' : 'inherit' }}>
                    {viagem.saidaEm ? 'Saída confirmada' : 'Aguardando saída'}
                  </div>
                  {viagem.saidaEm && <div className="tl-sub">{fmtData(viagem.saidaEm)} · GPS ativo</div>}
                </div>
              </div>
              <div className="tl-item">
                <div className={`tl-dot ${isEntregue ? 'tl-dot-done' : isEmRota ? 'tl-dot-active' : 'tl-dot-pend'}`} />
                <div>
                  <div className="tl-title" style={{ color: isEmRota ? 'var(--primary)' : 'inherit' }}>
                    {isEmRota ? 'Em rota — rastreando ao vivo' : isEntregue ? 'Entregue' : 'Em rota'}
                  </div>
                  {isEmRota && <div className="tl-sub">Mapa atualizado em tempo real abaixo</div>}
                  {isEntregue && <div className="tl-sub">{fmtData(viagem.entregaEm)}</div>}
                </div>
              </div>
              <div className="tl-item">
                <div className={`tl-dot ${comprovanteEnviado ? 'tl-dot-done' : 'tl-dot-pend'}`} />
                <div>
                  <div className="tl-title">Comprovante de entrega</div>
                  <div className="tl-sub">
                    {comprovanteEnviado
                      ? 'Comprovante enviado pelo motorista — veja abaixo'
                      : 'Aguardando envio pelo motorista'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa ao vivo */}
          {isEmRota && (
            <div style={{ marginTop: 14 }}>
              <div className="card-title" style={{ marginBottom: 4 }}>
                <span className="live-dot" />
                Localização ao vivo
              </div>
              <MapaAoVivo viagemId={viagem.id} motoristaNome={viagem.motoristaNome} />
            </div>
          )}

          {/* Comprovante */}
          {comprovanteEfetivo && (
            <div style={{ marginTop: 16 }}>
              <div className="card-title">Comprovante de entrega</div>
              <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                  Entrega confirmada pelo motorista
                </div>
                <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>
                  {fmtData(comprovanteEfetivo.criadoEm)}
                  {comprovanteEfetivo.latitude && ` · GPS: ${comprovanteEfetivo.latitude.toFixed(4)}, ${comprovanteEfetivo.longitude.toFixed(4)}`}
                </div>
              </div>
              <img
                src={comprovanteEfetivo.fotoUrl}
                alt="Comprovante de entrega"
                className="proof-img"
              />
              <a
                href={comprovanteEfetivo.fotoUrl}
                target="_blank"
                rel="noreferrer"
                className="proof-link"
              >
                Abrir foto em tamanho original ↗
              </a>
            </div>
          )}

          {/* Observações */}
          {viagem.observacoes && (
            <div style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                Observações
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{viagem.observacoes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
