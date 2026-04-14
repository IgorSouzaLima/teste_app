// src/pages/Viagens.js
import React, { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc, getDocs, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import MapaViagem from '../components/MapaViagem';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabel = { agendada: 'Agendada', em_rota: 'Em rota', entregue: 'Entregue', cancelada: 'Cancelada' };
const statusBadge = { agendada: 'badge-gray', em_rota: 'badge-info', entregue: 'badge-success', cancelada: 'badge-danger' };
const comprovanteBadge = { pendente: 'badge-warning', confirmado: 'badge-success' };

const EMPTY_FORM = {
  motoristaId: '', motoristaNome: '', motoristaPlaca: '',
  clienteId: '', clienteNome: '',
  notasRaw: '', cidadeDestino: '', observacoes: ''
};

export default function Viagens() {
  const [viagens, setViagens] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const q = query(collection(db, 'viagens'), orderBy('criadoEm', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setViagens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    getDocs(collection(db, 'motoristas')).then(snap => {
      setMotoristas(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.ativo));
    });

    getDocs(collection(db, 'clientes')).then(snap => {
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.ativo));
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!showDetalhes?.id) return;
    const atualizada = viagens.find((v) => v.id === showDetalhes.id);
    if (atualizada) {
      setShowDetalhes(atualizada);
    }
  }, [viagens, showDetalhes?.id]);

  const handleMotoristaChange = (id) => {
    const m = motoristas.find(x => x.id === id);
    setForm(f => ({ ...f, motoristaId: id, motoristaNome: m?.nome || '', motoristaPlaca: m?.placa || '' }));
  };

  const handleClienteChange = (id) => {
    const c = clientes.find(x => x.id === id);
    setForm(f => ({ ...f, clienteId: id, clienteNome: c?.razaoSocial || '' }));
  };

  const handleSalvar = async () => {
    if (!form.motoristaId || !form.clienteId || !form.notasRaw || !form.cidadeDestino) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const notas = form.notasRaw.split(',').map(n => n.trim()).filter(Boolean);
      await addDoc(collection(db, 'viagens'), {
        motoristaId: form.motoristaId,
        motoristaNome: form.motoristaNome,
        motoristaPlaca: form.motoristaPlaca,
        clienteId: form.clienteId,
        clienteNome: form.clienteNome,
        notas,
        cidadeDestino: form.cidadeDestino,
        observacoes: form.observacoes,
        status: 'agendada',
        criadoEm: serverTimestamp(),
        saidaEm: null,
        entregaEm: null,
        localizacaoAtual: null,
      });
      toast.success('Viagem lançada com sucesso!');
      setForm(EMPTY_FORM);
      setShowModal(false);
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelarViagem = async (id) => {
    if (!window.confirm('Cancelar esta viagem?')) return;
    await updateDoc(doc(db, 'viagens', id), { status: 'cancelada' });
    toast.success('Viagem cancelada');
  };

  const fmtData = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM/yy HH:mm", { locale: ptBR });
  };

  const getComprovanteDaViagem = (viagem) => (
    viagem?.comprovanteFotoUrl ? {
      viagemId: viagem.id,
      fotoUrl: viagem.comprovanteFotoUrl,
      status: viagem.comprovanteStatus || 'pendente',
      latitude: viagem.comprovanteLatitude ?? null,
      longitude: viagem.comprovanteLongitude ?? null,
      enviadoEm: viagem.comprovanteEnviadoEm || viagem.entregaEm || null,
      motoristaNome: viagem.comprovanteMotoristaNome || viagem.motoristaNome,
    } : null
  );

  const confirmarComprovante = async (viagem) => {
    const comprovante = getComprovanteDaViagem(viagem);
    if (!comprovante) return;

    await updateDoc(doc(db, 'viagens', viagem.id), { comprovanteStatus: 'confirmado' });

    const relacionados = await getDocs(query(collection(db, 'comprovantes'), where('viagemId', '==', viagem.id)));
    await Promise.all(relacionados.docs.map((snap) => updateDoc(doc(db, 'comprovantes', snap.id), { status: 'confirmado' })));

    toast.success('Comprovante confirmado');
  };

  const viagensFiltradas = filtro === 'todos'
    ? viagens
    : viagens.filter(v => v.status === filtro);

  return (
    <Layout title="Viagens">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['todos', 'agendada', 'em_rota', 'entregue', 'cancelada'].map(f => (
            <button key={f}
              className={`btn btn-sm ${filtro === f ? 'btn-primary' : ''}`}
              onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todas' : statusLabel[f]}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova viagem
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Motorista / Placa</th>
                <th>Cliente</th>
                <th>Notas fiscais</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Criada</th>
                <th>Saída</th>
                <th>Entrega</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {viagensFiltradas.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhuma viagem encontrada
                </td></tr>
              )}
              {viagensFiltradas.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{v.motoristaNome}</div>
                    <div className="text-sm text-muted">{v.motoristaPlaca}</div>
                  </td>
                  <td>{v.clienteNome}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {(v.notas || []).map(n => (
                        <span key={n} style={{
                          background: 'var(--primary-bg)', color: 'var(--primary-text)',
                          borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 500
                        }}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td>{v.cidadeDestino}</td>
                  <td><span className={`badge ${statusBadge[v.status]}`}>{statusLabel[v.status]}</span></td>
                  <td className="text-muted text-sm">{fmtData(v.criadoEm)}</td>
                  <td className="text-muted text-sm">{fmtData(v.saidaEm)}</td>
                  <td className="text-muted text-sm">{fmtData(v.entregaEm)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => setShowDetalhes(v)}>Ações</button>
                      {v.status === 'agendada' && (
                        <button className="btn btn-sm btn-danger" onClick={() => cancelarViagem(v.id)}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nova viagem */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Lançar nova viagem</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Motorista *</label>
                  <select className="form-select" value={form.motoristaId}
                    onChange={e => handleMotoristaChange(e.target.value)}>
                    <option value="">Selecione...</option>
                    {motoristas.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} — {m.placa}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Placa (auto)</label>
                  <input className="form-input" value={form.motoristaPlaca} readOnly
                    placeholder="Selecionado ao escolher motorista" style={{ background: 'var(--bg)' }} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select className="form-select" value={form.clienteId}
                    onChange={e => handleClienteChange(e.target.value)}>
                    <option value="">Selecione...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razaoSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade destino *</label>
                  <input className="form-input" value={form.cidadeDestino}
                    onChange={e => setForm(f => ({ ...f, cidadeDestino: e.target.value }))}
                    placeholder="Ex: Pouso Alegre - MG" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Números das notas fiscais * (separadas por vírgula)</label>
                <input className="form-input" value={form.notasRaw}
                  onChange={e => setForm(f => ({ ...f, notasRaw: e.target.value }))}
                  placeholder="Ex: NF 4521, NF 4522, NF 4523" />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Instruções especiais, horário de entrega, etc." />
              </div>

              <div style={{
                background: 'var(--primary-bg)', borderRadius: 6, padding: '10px 12px',
                fontSize: 12, color: 'var(--primary-text)'
              }}>
                O motorista receberá uma notificação no app Android assim que a viagem for lançada.
                O cliente poderá acompanhar o rastreamento em tempo real pelo portal.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
                {saving ? 'Salvando...' : 'Lançar viagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhes */}
      {showDetalhes && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetalhes(null)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>Viagem — {showDetalhes.clienteNome}</h3>
              <button className="btn-close" onClick={() => setShowDetalhes(null)}>×</button>
            </div>
            <div className="modal-body">
              {(() => {
                const comprovante = getComprovanteDaViagem(showDetalhes);
                return (
                  <>
              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="text-muted text-sm">Motorista</div>
                  <div style={{ fontWeight: 500 }}>{showDetalhes.motoristaNome}</div>
                  <div className="text-muted text-sm">{showDetalhes.motoristaPlaca}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Status</div>
                  <span className={`badge ${statusBadge[showDetalhes.status]}`}>
                    {statusLabel[showDetalhes.status]}
                  </span>
                </div>
                <div>
                  <div className="text-muted text-sm">Destino</div>
                  <div style={{ fontWeight: 500 }}>{showDetalhes.cidadeDestino}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Notas fiscais</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    {(showDetalhes.notas || []).map(n => (
                      <span key={n} style={{
                        background: 'var(--primary-bg)', color: 'var(--primary-text)',
                        borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 500
                      }}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>

              {showDetalhes.status === 'em_rota' && (
                <>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>Rastreamento ao vivo</div>
                  <MapaViagem viagemId={showDetalhes.id} />
                </>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Comprovante da entrega</div>
                    <div className="text-muted text-sm">
                      {comprovante ? 'Foto enviada pelo motorista dentro desta viagem.' : 'Ainda nao foi enviado nenhum comprovante.'}
                    </div>
                  </div>
                  {comprovante && (
                    <span className={`badge ${comprovanteBadge[comprovante.status] || 'badge-warning'}`}>
                      {comprovante.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                    </span>
                  )}
                </div>

                {comprovante ? (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div className="form-grid-2" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="text-muted text-sm">Enviado em</div>
                        <div style={{ fontWeight: 500 }}>{fmtData(comprovante.enviadoEm)}</div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">Motorista</div>
                        <div style={{ fontWeight: 500 }}>{comprovante.motoristaNome}</div>
                      </div>
                      <div>
                        <div className="text-muted text-sm">GPS do envio</div>
                        <div>
                          {comprovante.latitude != null
                            ? `${comprovante.latitude.toFixed(4)}, ${comprovante.longitude.toFixed(4)}`
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <img
                      src={comprovante.fotoUrl}
                      alt="Comprovante da viagem"
                      className="proof-img"
                      style={{ width: '100%' }}
                    />

                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <a href={comprovante.fotoUrl} target="_blank" rel="noreferrer" className="btn">
                        Abrir comprovante
                      </a>
                      {comprovante.status !== 'confirmado' && (
                        <button className="btn btn-success" onClick={() => confirmarComprovante(showDetalhes)}>
                          Confirmar comprovante
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: 16, color: 'var(--text-2)' }}>
                    Assim que o motorista enviar a foto, ela aparecera aqui.
                  </div>
                )}
              </div>

              {showDetalhes.observacoes && (
                <div style={{ marginTop: 16 }}>
                  <div className="text-muted text-sm">Observações</div>
                  <div style={{ marginTop: 4 }}>{showDetalhes.observacoes}</div>
                </div>
              )}
                  </>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetalhes(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
