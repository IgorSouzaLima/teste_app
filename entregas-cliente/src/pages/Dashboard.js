// src/pages/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, query, where, onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import CardViagem from '../components/CardViagem';
import {
  sortViagensByCriadoEmDesc,
} from '../lib/viagemCliente';
import {
  buildAlertasCliente,
  buildViagensClienteCsv,
  filterViagensCliente,
  getStatusTabsCliente,
} from '../lib/painelCliente';

export default function Dashboard() {
  const { clienteData, logout } = useAuth();
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [buscaNota, setBuscaNota] = useState('');
  const [periodo, setPeriodo] = useState('all');

  useEffect(() => {
    if (!clienteData?.id) {
      setViagens([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    const q = query(
      collection(db, 'viagens'),
      where('clienteId', '==', clienteData.id)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const docs = sortViagensByCriadoEmDesc(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        setViagens(docs);
        setLoadError('');
        setLoading(false);
      },
      () => {
        setViagens([]);
        setLoadError('Nao foi possivel carregar suas entregas agora.');
        setLoading(false);
      }
    );

    return unsub;
  }, [clienteData]);

  const tabs = useMemo(() => getStatusTabsCliente(viagens), [viagens]);
  const lista = useMemo(
    () => filterViagensCliente(viagens, { status: statusFiltro, nota: buscaNota, periodo }),
    [viagens, statusFiltro, buscaNota, periodo]
  );
  const alertas = useMemo(() => buildAlertasCliente(viagens), [viagens]);
  const emRota = viagens.filter((viagem) => viagem.status === 'em_rota');
  const totalHistorico = viagens.filter((viagem) => viagem.status === 'entregue' || viagem.status === 'cancelada').length;
  const totalAgendadas = viagens.filter((viagem) => viagem.status === 'agendada').length;

  const handleExportar = () => {
    const csv = buildViagensClienteCsv(lista);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cliente-entregas-${statusFiltro}-${periodo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="topbar-shell">
        <div className="topbar">
          <div>
            <div className="topbar-title">Minhas entregas</div>
            <div className="topbar-sub">{clienteData?.razaoSocial}</div>
          </div>
          <button className="topbar-logout" onClick={logout}>Sair</button>
        </div>
      </div>

      <div className="page">
        <div className="hero-strip">
          <div className="hero-strip-head">
            <div>
              <div className="hero-strip-title">Acompanhamento em tempo real</div>
              <div className="hero-strip-sub">
                Consulte suas cargas em andamento, acompanhe o histórico e encontre notas fiscais com rapidez.
              </div>
            </div>
            <div className="badge badge-info">
              {emRota.length > 0 ? `${emRota.length} em rota agora` : 'Sem rota ativa agora'}
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{emRota.length}</strong>
              <span>Entregas em rota</span>
            </div>
            <div className="hero-stat">
              <strong>{totalHistorico}</strong>
              <span>Entregas no histórico</span>
            </div>
            <div className="hero-stat">
              <strong>{totalAgendadas}</strong>
              <span>Entregas aguardando início</span>
            </div>
          </div>
        </div>

        <div className="alert-grid">
          {alertas.length === 0 ? (
            <div className="alert-card alert-card-neutral">
              <div className="alert-card-title">Sem novidades agora</div>
              <div className="alert-card-copy">Quando uma entrega sair, for concluída ou liberar comprovante, o resumo aparece aqui.</div>
            </div>
          ) : alertas.map((alerta) => (
            <div key={alerta.id} className={`alert-card alert-card-${alerta.tone}`}>
              <div className="alert-card-kicker">{alerta.count} atualização{alerta.count > 1 ? 'ões' : ''}</div>
              <div className="alert-card-title">{alerta.title}</div>
              <div className="alert-card-copy">{alerta.description}</div>
            </div>
          ))}
        </div>

        {/* Banner de entrega em rota */}
        {emRota.length > 0 && (
          <div style={{
            background: 'var(--primary-bg)',
            border: '1px solid #B5D4F4',
            borderRadius: 12, padding: '12px 16px',
            marginBottom: 14, display: 'flex',
            alignItems: 'center', gap: 10,
          }}>
            <span className="live-dot" style={{ width: 10, height: 10 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-text)' }}>
                {emRota.length === 1 ? '1 entrega em rota agora' : `${emRota.length} entregas em rota agora`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--primary-text)', marginTop: 1 }}>
                Acompanhe a localização em tempo real abaixo
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs tabs-rich">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${statusFiltro === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFiltro(tab.id)}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        <div className="search-row">
          <input
            className="form-input"
            value={buscaNota}
            onChange={(e) => setBuscaNota(e.target.value)}
            placeholder="Buscar por número da nota"
          />
          <select className="form-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ maxWidth: 170 }}>
            <option value="all">Período completo</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="1d">Hoje</option>
          </select>
          <button className="topbar-logout" onClick={handleExportar} style={{ whiteSpace: 'nowrap' }}>
            Exportar CSV
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {/* Lista de viagens */}
        {!loading && lista.length === 0 && (
          <div className="empty">
            <div className="empty-icon">{statusFiltro === 'entregue' || statusFiltro === 'cancelada' ? '✅' : '📦'}</div>
            <div className="empty-title">
              {loadError || 'Nenhuma entrega encontrada'}
            </div>
            <div className="empty-sub">
              {loadError || 'Ajuste os filtros ou aguarde novas atualizações da operação.'}
            </div>
          </div>
        )}

        {!loading && lista.map((v, i) => (
          <CardViagem
            key={v.id}
            viagemId={v.id}
            defaultAberto={i === 0 && v.status === 'em_rota'}
          />
        ))}
      </div>
    </>
  );
}
