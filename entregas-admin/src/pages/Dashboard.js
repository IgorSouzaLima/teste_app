// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import MapaViagem from '../components/MapaViagem';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabel = { agendada: 'Agendada', em_rota: 'Em rota', entregue: 'Entregue', cancelada: 'Cancelada' };
const statusBadge = { agendada: 'badge-gray', em_rota: 'badge-info', entregue: 'badge-success', cancelada: 'badge-danger' };

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, agendadas: 0, em_rota: 0, entregues: 0 });
  const [viagens, setViagens] = useState([]);
  const [viagemSelecionada, setViagemSelecionada] = useState(null);

  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'viagens'),
      orderBy('criadoEm', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViagens(docs);
      setStats({
        total: docs.length,
        agendadas: docs.filter(v => v.status === 'agendada').length,
        em_rota: docs.filter(v => v.status === 'em_rota').length,
        entregues: docs.filter(v => v.status === 'entregue').length,
      });
    });
    return unsub;
  }, []);

  const fmtData = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM HH:mm", { locale: ptBR });
  };

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de viagens</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--text-2)' }}>{stats.agendadas}</div>
          <div className="stat-label">Agendadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.em_rota}</div>
          <div className="stat-label">Em rota agora</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.entregues}</div>
          <div className="stat-label">Entregues</div>
        </div>
      </div>

      {viagemSelecionada && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Rastreamento — {viagemSelecionada.motoristaNome} → {viagemSelecionada.cidadeDestino}
            </span>
            <button className="btn btn-sm" onClick={() => setViagemSelecionada(null)}>Fechar mapa</button>
          </div>
          <MapaViagem viagemId={viagemSelecionada.id} />
        </div>
      )}

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <span className="card-title">Viagens recentes</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Motorista / Placa</th>
                <th>Cliente</th>
                <th>Notas fiscais</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {viagens.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-2)', padding: 32 }}>
                  Nenhuma viagem cadastrada ainda
                </td></tr>
              )}
              {viagens.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{v.motoristaNome}</div>
                    <div className="text-sm text-muted">{v.motoristaPlaca}</div>
                  </td>
                  <td>{v.clienteNome}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(v.notas || []).map(n => (
                        <span key={n} style={{
                          background: 'var(--primary-bg)', color: 'var(--primary-text)',
                          borderRadius: 4, padding: '2px 6px', fontSize: 11
                        }}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td>{v.cidadeDestino}</td>
                  <td><span className={`badge ${statusBadge[v.status]}`}>{statusLabel[v.status]}</span></td>
                  <td className="text-muted text-sm">{fmtData(v.criadoEm)}</td>
                  <td>
                    {v.status === 'em_rota' && (
                      <button className="btn btn-sm btn-primary"
                        onClick={() => setViagemSelecionada(v)}>
                        Ver mapa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
