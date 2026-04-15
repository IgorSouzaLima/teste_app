// src/pages/Viagens.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc, getDocs, where, limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import MapaViagem from '../components/MapaViagem';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../lib/AuthContext';
import { registrarAuditoria } from '../lib/auditoria';
import { buildAlertasOperacionais, buildViagensCsv, filterViagensPorPainel } from '../lib/operacaoView';
import {
  buildNovaViagemPayload,
  getComprovanteDaViagem,
  getResumoVeiculo,
  normalizarComprovanteDaColecao,
} from '../lib/viagemView';

const statusLabel = { agendada: 'Agendada', em_rota: 'Em rota', entregue: 'Entregue', cancelada: 'Cancelada' };
const statusBadge = { agendada: 'badge-gray', em_rota: 'badge-info', entregue: 'badge-success', cancelada: 'badge-danger' };
const comprovanteBadge = { pendente: 'badge-warning', confirmado: 'badge-success' };

const EMPTY_FORM = {
  motoristaId: '', motoristaNome: '', motoristaPlaca: '',
  motoristaPlacaLegacy: '',
  veiculoId: '', veiculoNome: '', veiculoPlaca: '',
  clienteId: '', clienteNome: '',
  notasRaw: '', cidadeDestino: '', observacoes: ''
};

export default function Viagens() {
  const { user, userData } = useAuth();
  const [viagens, setViagens] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(null);
  const [comprovanteDetalhes, setComprovanteDetalhes] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [buscaNota, setBuscaNota] = useState('');
  const [periodo, setPeriodo] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'viagens'), orderBy('criadoEm', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setViagens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    getDocs(collection(db, 'motoristas')).then(snap => {
      setMotoristas(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.ativo));
    });

    getDocs(collection(db, 'veiculos')).then(snap => {
      setVeiculos(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.ativo));
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

  useEffect(() => {
    if (!showDetalhes?.id || showDetalhes.status !== 'entregue') {
      setComprovanteDetalhes(null);
      return;
    }

    const q = query(
      collection(db, 'comprovantes'),
      where('viagemId', '==', showDetalhes.id),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setComprovanteDetalhes(normalizarComprovanteDaColecao(showDetalhes, { id: snap.docs[0].id, ...snap.docs[0].data() }));
        } else {
          setComprovanteDetalhes(null);
        }
      },
      () => setComprovanteDetalhes(null)
    );

    return unsub;
  }, [showDetalhes?.id, showDetalhes?.status]);

  const handleMotoristaChange = (id) => {
    const m = motoristas.find(x => x.id === id);
    setForm((current) => ({
      ...current,
      motoristaId: id,
      motoristaNome: m?.nome || '',
      motoristaPlacaLegacy: m?.placa || '',
      motoristaPlaca: current.veiculoPlaca || m?.placa || '',
    }));
  };

  const handleVeiculoChange = (id) => {
    const veiculo = veiculos.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      veiculoId: id,
      veiculoNome: veiculo?.descricao || '',
      veiculoPlaca: veiculo?.placa || '',
      motoristaPlaca: veiculo?.placa || current.motoristaPlacaLegacy || '',
    }));
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
      const payload = buildNovaViagemPayload(form, serverTimestamp());
      const ref = await addDoc(collection(db, 'viagens'), payload);
      await registrarAuditoria({
        ator: { uid: user?.uid, nome: userData?.nome, email: userData?.email || user?.email },
        acao: 'viagem.criada',
        entidade: 'viagem',
        entidadeId: ref.id,
        descricao: `Viagem lançada para ${form.clienteNome} com destino em ${form.cidadeDestino}.`,
        meta: {
          motorista: form.motoristaNome,
          veiculo: form.veiculoPlaca || form.motoristaPlacaLegacy || '—',
          notas: payload.notas.join(', '),
        },
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
    const viagem = viagens.find((item) => item.id === id);
    await updateDoc(doc(db, 'viagens', id), { status: 'cancelada' });
    await registrarAuditoria({
      ator: { uid: user?.uid, nome: userData?.nome, email: userData?.email || user?.email },
      acao: 'viagem.cancelada',
      entidade: 'viagem',
      entidadeId: id,
      descricao: `Viagem para ${viagem?.clienteNome || 'cliente'} foi cancelada.`,
      meta: {
        destino: viagem?.cidadeDestino || '—',
        notas: (viagem?.notas || []).join(', ') || '—',
      },
    });
    toast.success('Viagem cancelada');
  };

  const fmtData = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd/MM/yy HH:mm", { locale: ptBR });
  };

  const getComprovanteEfetivo = (viagem) => getComprovanteDaViagem(viagem) || comprovanteDetalhes;

  const confirmarComprovante = async (viagem) => {
    const comprovante = getComprovanteEfetivo(viagem);
    if (!comprovante) return;

    await updateDoc(doc(db, 'viagens', viagem.id), { comprovanteStatus: 'confirmado' });

    const relacionados = await getDocs(query(collection(db, 'comprovantes'), where('viagemId', '==', viagem.id)));
    await Promise.all(relacionados.docs.map((snap) => updateDoc(doc(db, 'comprovantes', snap.id), { status: 'confirmado' })));
    await registrarAuditoria({
      ator: { uid: user?.uid, nome: userData?.nome, email: userData?.email || user?.email },
      acao: 'comprovante.confirmado',
      entidade: 'viagem',
      entidadeId: viagem.id,
      descricao: `Comprovante da viagem para ${viagem.clienteNome} foi confirmado.`,
      meta: {
        motorista: viagem.motoristaNome,
        destino: viagem.cidadeDestino,
      },
    });

    toast.success('Comprovante confirmado');
  };

  const viagensFiltradasPorNota = useMemo(
    () => filterViagensPorPainel(viagens, { status: filtro, nota: buscaNota, periodo }),
    [viagens, filtro, buscaNota, periodo]
  );
  const alertas = useMemo(
    () => buildAlertasOperacionais(filterViagensPorPainel(viagens, { status: 'todos', nota: '', periodo })),
    [viagens, periodo]
  );

  const handleExportar = () => {
    const csv = buildViagensCsv(viagensFiltradasPorNota);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viagens-${filtro}-${periodo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Viagens">
      <div className="page-toolbar">
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Central de viagens</div>
          <div className="card-subtitle">Filtre a operação, acompanhe status e lance novas cargas com motorista e veículo separados.</div>
        </div>
        <div className="toolbar-group">
          {['todos', 'agendada', 'em_rota', 'entregue', 'cancelada'].map(f => (
            <button key={f}
              className={`btn btn-sm ${filtro === f ? 'btn-primary' : ''}`}
              onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todas' : statusLabel[f]}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <select className="form-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ minWidth: 170 }}>
            <option value="all">Período completo</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="1d">Hoje</option>
          </select>
          <input
            className="form-input"
            value={buscaNota}
            onChange={(e) => setBuscaNota(e.target.value)}
            placeholder="Buscar por número da nota"
            style={{ minWidth: 220 }}
          />
          <button className="btn" onClick={handleExportar}>Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova viagem
          </button>
        </div>
      </div>

      <div className="alert-grid" style={{ marginBottom: 18 }}>
        {alertas.length === 0 ? (
          <div className="alert-card alert-card-neutral">
            <div className="alert-card-title">Sem alertas neste recorte</div>
            <div className="alert-card-copy">O período selecionado não tem comprovantes pendentes nem viagens exigindo atenção imediata.</div>
          </div>
        ) : alertas.map((alerta) => (
          <div key={alerta.id} className={`alert-card alert-card-${alerta.tone}`}>
            <div className="alert-card-kicker">{alerta.count} ocorrência{alerta.count > 1 ? 's' : ''}</div>
            <div className="alert-card-title">{alerta.title}</div>
            <div className="alert-card-copy">{alerta.description}</div>
          </div>
        ))}
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
              {viagensFiltradasPorNota.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhuma viagem encontrada
                </td></tr>
              )}
              {viagensFiltradasPorNota.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{v.motoristaNome}</div>
                    <div className="text-sm text-muted">{getResumoVeiculo(v)}</div>
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
                      <option key={m.id} value={m.id}>{m.nome}{m.placa ? ` — ${m.placa}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Veículo</label>
                  <select className="form-select" value={form.veiculoId}
                    onChange={e => handleVeiculoChange(e.target.value)}>
                    <option value="">Selecionar depois / usar legado</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.placa} — {v.descricao}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Placa usada na viagem</label>
                  <input className="form-input" value={form.motoristaPlaca} readOnly
                    placeholder="Definida ao escolher veículo ou motorista legado" style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição do veículo</label>
                  <input className="form-input" value={form.veiculoNome} readOnly
                    placeholder="Selecionado ao escolher veículo" style={{ background: 'var(--bg)' }} />
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
                const comprovante = getComprovanteEfetivo(showDetalhes);
                return (
                  <>
              <div className="form-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="text-muted text-sm">Motorista</div>
                  <div style={{ fontWeight: 500 }}>{showDetalhes.motoristaNome}</div>
                  <div className="text-muted text-sm">{getResumoVeiculo(showDetalhes)}</div>
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
