// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import CardViagem from '../components/CardViagem';
import {
  filterViagensDaAba,
  sortViagensByCriadoEmDesc,
  splitViagensPorAba,
} from '../lib/viagemCliente';

export default function Dashboard() {
  const { clienteData, logout } = useAuth();
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [aba, setAba] = useState('ativas');
  const [buscaNota, setBuscaNota] = useState('');

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

  const { ativas, historico, emRota } = splitViagensPorAba(viagens);
  const lista = filterViagensDaAba(viagens, aba, buscaNota);

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
              <strong>{ativas.length}</strong>
              <span>Entregas em andamento</span>
            </div>
            <div className="hero-stat">
              <strong>{historico.length}</strong>
              <span>Entregas no histórico</span>
            </div>
            <div className="hero-stat">
              <strong>{viagens.length}</strong>
              <span>Total de viagens vinculadas</span>
            </div>
          </div>
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
        <div className="tabs">
          <button
            className={`tab ${aba === 'ativas' ? 'active' : ''}`}
            onClick={() => setAba('ativas')}
          >
            Em andamento {ativas.length > 0 && `(${ativas.length})`}
          </button>
          <button
            className={`tab ${aba === 'historico' ? 'active' : ''}`}
            onClick={() => setAba('historico')}
          >
            Histórico {historico.length > 0 && `(${historico.length})`}
          </button>
        </div>

        <div className="search-row">
          <input
            className="form-input"
            value={buscaNota}
            onChange={(e) => setBuscaNota(e.target.value)}
            placeholder="Buscar por número da nota"
          />
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
            <div className="empty-icon">{aba === 'ativas' ? '📦' : '✅'}</div>
            <div className="empty-title">
              {loadError || (aba === 'ativas' ? 'Nenhuma entrega em andamento' : 'Nenhuma entrega no histórico')}
            </div>
            <div className="empty-sub">
              {loadError || (aba === 'ativas'
                ? 'Quando uma entrega for lançada para você, ela aparecerá aqui.'
                : 'Suas entregas concluídas aparecerão aqui.')}
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
