// src/pages/Comprovantes.js
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Comprovantes() {
  const [comprovantes, setComprovantes] = useState([]);
  const [fotoAberta, setFotoAberta] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const mergeComprovantes = (viagensDocs, comprovanteDocs) => {
      const merged = new Map();

      comprovanteDocs.forEach((item) => {
        const key = item.viagemId || item.id;
        merged.set(key, item);
      });

      viagensDocs.forEach((item) => {
        const key = item.viagemId || item.id;
        merged.set(key, item);
      });

      return Array.from(merged.values()).sort((a, b) => {
        const aMs = a.criadoEm?.toMillis?.() || 0;
        const bMs = b.criadoEm?.toMillis?.() || 0;
        return bMs - aMs;
      });
    };

    let viagensState = [];
    let comprovantesState = [];

    const viagensQuery = query(collection(db, 'viagens'), orderBy('entregaEm', 'desc'));
    const unsubViagens = onSnapshot(
      viagensQuery,
      (snap) => {
        viagensState = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((v) => !!v.comprovanteFotoUrl)
          .map((v) => ({
            id: `viagem-${v.id}`,
            viagemId: v.id,
            motoristaNome: v.comprovanteMotoristaNome || v.motoristaNome,
            clienteNome: v.clienteNome,
            notas: v.notas || [],
            latitude: v.comprovanteLatitude ?? null,
            longitude: v.comprovanteLongitude ?? null,
            status: v.comprovanteStatus || 'pendente',
            fotoUrl: v.comprovanteFotoUrl,
            fotoPath: v.comprovantePublicId || null,
            criadoEm: v.comprovanteEnviadoEm || v.entregaEm || null,
            source: 'viagem',
          }));

        setComprovantes(mergeComprovantes(viagensState, comprovantesState));
        setErro('');
      },
      () => setErro('Nao foi possivel carregar os comprovantes das viagens.')
    );

    const comprovantesQuery = query(collection(db, 'comprovantes'), orderBy('criadoEm', 'desc'));
    const unsubComprovantes = onSnapshot(
      comprovantesQuery,
      (snap) => {
        comprovantesState = snap.docs.map((d) => ({ id: d.id, ...d.data(), source: 'collection' }));
        setComprovantes(mergeComprovantes(viagensState, comprovantesState));
        setErro('');
      },
      () => setErro('Nao foi possivel carregar a colecao de comprovantes.')
    );

    return () => {
      unsubViagens();
      unsubComprovantes();
    };
  }, []);

  const fmtData = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const confirmar = async (item) => {
    if (item.viagemId) {
      await updateDoc(doc(db, 'viagens', item.viagemId), { comprovanteStatus: 'confirmado' });
    }

    if (item.source === 'collection') {
      await updateDoc(doc(db, 'comprovantes', item.id), { status: 'confirmado' });
    } else if (item.viagemId) {
      const related = await getDocs(query(collection(db, 'comprovantes'), where('viagemId', '==', item.viagemId)));
      await Promise.all(related.docs.map((snap) => updateDoc(doc(db, 'comprovantes', snap.id), { status: 'confirmado' })));
    }

    toast.success('Comprovante confirmado');
  };

  return (
    <Layout title="Comprovantes de entrega">
      <div className="card" style={{ marginBottom: 0 }}>
        {erro && (
          <div style={{ padding: 16, color: 'var(--danger)' }}>{erro}</div>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Motorista</th>
                <th>Cliente</th>
                <th>Notas fiscais</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Comprovante</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprovantes.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhum comprovante recebido ainda
                </td></tr>
              )}
              {comprovantes.map(c => (
                <tr key={c.id}>
                  <td className="text-sm text-muted">{fmtData(c.criadoEm)}</td>
                  <td style={{ fontWeight: 500 }}>{c.motoristaNome}</td>
                  <td>{c.clienteNome}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {(c.notas || []).map(n => (
                        <span key={n} style={{
                          background: 'var(--primary-bg)', color: 'var(--primary-text)',
                          borderRadius: 4, padding: '1px 6px', fontSize: 11
                        }}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-sm text-muted">
                    {c.latitude ? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'confirmado' ? 'badge-success' : 'badge-warning'}`}>
                      {c.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </td>
                  <td>
                    {c.fotoUrl ? (
                      <img
                        src={c.fotoUrl}
                        alt="Comprovante"
                        style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={() => setFotoAberta(c)}
                      />
                    ) : <span className="text-muted text-sm">—</span>}
                  </td>
                  <td>
                    {c.status !== 'confirmado' && (
                      <button className="btn btn-sm btn-success" onClick={() => confirmar(c)}>
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal foto ampliada */}
      {fotoAberta && (
        <div className="modal-overlay" onClick={() => setFotoAberta(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Comprovante — {fotoAberta.clienteNome}</h3>
              <button className="btn-close" onClick={() => setFotoAberta(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div className="text-muted text-sm">Motorista</div>
                  <div style={{ fontWeight: 500 }}>{fotoAberta.motoristaNome}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Data</div>
                  <div>{fmtData(fotoAberta.criadoEm)}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Notas fiscais</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {(fotoAberta.notas || []).map(n => (
                      <span key={n} style={{
                        background: 'var(--primary-bg)', color: 'var(--primary-text)',
                        borderRadius: 4, padding: '2px 7px', fontSize: 12
                      }}>{n}</span>
                    ))}
                  </div>
                </div>
                {fotoAberta.latitude && (
                  <div>
                    <div className="text-muted text-sm">GPS no momento da entrega</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>
                      {fotoAberta.latitude.toFixed(6)}, {fotoAberta.longitude.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
              <img
                src={fotoAberta.fotoUrl}
                alt="Comprovante de entrega"
                className="proof-img"
                style={{ width: '100%' }}
              />
            </div>
            <div className="modal-footer">
              {fotoAberta.status !== 'confirmado' && (
                <button className="btn btn-success" onClick={() => { confirmar(fotoAberta); setFotoAberta(null); }}>
                  Confirmar entrega
                </button>
              )}
              <a href={fotoAberta.fotoUrl} target="_blank" rel="noreferrer" className="btn">
                Abrir foto original
              </a>
              <button className="btn" onClick={() => setFotoAberta(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
