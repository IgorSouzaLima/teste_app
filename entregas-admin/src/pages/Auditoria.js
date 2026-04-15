import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Layout from '../components/Layout';
import { db } from '../lib/firebase';

const badgeByEntity = {
  viagem: 'badge-info',
  cliente: 'badge-success',
  motorista: 'badge-warning',
  veiculo: 'badge-gray',
};

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'auditoria'), orderBy('criadoEm', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, []);

  const logsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return logs;

    return logs.filter((log) => [
      log.atorNome,
      log.atorEmail,
      log.acao,
      log.entidade,
      log.entidadeId,
      log.descricao,
      JSON.stringify(log.meta || {}),
    ].some((item) => String(item || '').toLowerCase().includes(termo)));
  }, [logs, busca]);

  const fmtData = (ts) => {
    if (!ts) return '—';
    const data = ts.toDate ? ts.toDate() : new Date(ts);
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Layout title="Auditoria">
      <div className="page-toolbar">
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Histórico operacional</div>
          <div className="card-subtitle">Veja quem criou, editou, cancelou ou confirmou ações no painel administrativo.</div>
        </div>
        <div className="toolbar-actions">
          <input
            className="form-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por ator, ação ou entidade"
            style={{ minWidth: 260 }}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Responsável</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                    Nenhum evento de auditoria encontrado.
                  </td>
                </tr>
              )}
              {logsFiltrados.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted text-sm">{fmtData(log.criadoEm)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.atorNome || 'Administrador'}</div>
                    <div className="text-muted text-sm">{log.atorEmail || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.acao}</div>
                    <div className="text-muted text-sm">{log.entidadeId || 'Sem entidade vinculada'}</div>
                  </td>
                  <td>
                    <span className={`badge ${badgeByEntity[log.entidade] || 'badge-gray'}`}>
                      {log.entidade || 'sistema'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{log.descricao || '—'}</div>
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                        {Object.entries(log.meta).map(([key, value]) => `${key}: ${value}`).join(' · ')}
                      </div>
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
