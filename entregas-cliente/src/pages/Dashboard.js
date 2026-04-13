// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import CardViagem from '../components/CardViagem';

export default function Dashboard() {
  const { clienteData, logout } = useAuth();
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('ativas');

  useEffect(() => {
    if (!clienteData?.id) return;
    const q = query(
      collection(db, 'viagens'),
      where('clienteId', '==', clienteData.id),
      orderBy('criadoEm', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setViagens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [clienteData]);

  const ativas = viagens.filter(v => v.status === 'agendada' || v.status === 'em_rota');
  const historico = viagens.filter(v => v.status === 'entregue' || v.status === 'cancelada');
  const emRota = viagens.filter(v => v.status === 'em_rota');

  const lista = aba === 'ativas' ? ativas : historico;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Minhas entregas</div>
          <div className="topbar-sub">{clienteData?.razaoSocial}</div>
        </div>
        <button className="topbar-logout" onClick={logout}>Sair</button>
      </div>

      <div className="page">

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
              {aba === 'ativas' ? 'Nenhuma entrega em andamento' : 'Nenhuma entrega no histórico'}
            </div>
            <div className="empty-sub">
              {aba === 'ativas'
                ? 'Quando uma entrega for lançada para você, ela aparecerá aqui.'
                : 'Suas entregas concluídas aparecerão aqui.'}
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
