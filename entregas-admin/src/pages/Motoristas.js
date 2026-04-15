// src/pages/Motoristas.js
import React, { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { createAuthUserWithSecondaryApp } from '../lib/createAuthUser';
import { db, firebaseConfig } from '../lib/firebase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const EMPTY = { nome: '', cpf: '', telefone: '', placa: '', veiculo: '', cnh: '', email: '', senha: '' };

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'motoristas'), orderBy('nome'));
    return onSnapshot(q, snap => {
      setMotoristas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNovo = () => { setForm(EMPTY); setEditando(null); setShowModal(true); };
  const abrirEditar = (m) => {
    setForm({ ...m, senha: '' });
    setEditando(m.id);
    setShowModal(true);
  };

  const handleSalvar = async () => {
    if (!form.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editando) {
        const { senha, email, ...data } = form;
        await updateDoc(doc(db, 'motoristas', editando), { ...data });
        toast.success('Motorista atualizado!');
      } else {
        if (!form.email || !form.senha) { toast.error('E-mail e senha necessários para novo motorista'); setSaving(false); return; }
        const userId = await createAuthUserWithSecondaryApp(firebaseConfig, form.email, form.senha);
        const motRef = await addDoc(collection(db, 'motoristas'), {
          userId,
          nome: form.nome, cpf: form.cpf, telefone: form.telefone,
          placa: form.placa, veiculo: form.veiculo, cnh: form.cnh,
          ativo: true, criadoEm: serverTimestamp(), ultimaLocalizacao: null,
        });
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', userId), {
          uid: userId, email: form.email, nome: form.nome,
          role: 'motorista', motoristaId: motRef.id, criadoEm: serverTimestamp(), ativo: true,
        });
        toast.success('Motorista cadastrado e conta criada!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (m) => {
    await updateDoc(doc(db, 'motoristas', m.id), { ativo: !m.ativo });
    toast.success(m.ativo ? 'Motorista desativado' : 'Motorista reativado');
  };

  return (
    <Layout title="Motoristas">
      <div className="page-toolbar">
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Equipe de motoristas</div>
          <div className="card-subtitle">Gerencie condutores ativos, acessos ao app e dados legados mantidos no sistema.</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo motorista
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>CPF</th><th>Telefone</th>
                <th>Placa / Veículo</th><th>CNH</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {motoristas.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhum motorista cadastrado
                </td></tr>
              )}
              {motoristas.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.nome}</td>
                  <td className="text-muted text-sm">{m.cpf || '—'}</td>
                  <td>{m.telefone || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.placa}</div>
                    <div className="text-sm text-muted">{m.veiculo}</div>
                  </td>
                  <td>{m.cnh || '—'}</td>
                  <td>
                    <span className={`badge ${m.ativo ? 'badge-success' : 'badge-gray'}`}>
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => abrirEditar(m)}>Editar</button>
                      <button className="btn btn-sm" onClick={() => toggleAtivo(m)}>
                        {m.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editando ? 'Editar motorista' : 'Novo motorista'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nome completo *</label>
                  <input className="form-input" value={form.nome} onChange={e => setF('nome', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input className="form-input" value={form.cpf} onChange={e => setF('cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input className="form-input" value={form.telefone} onChange={e => setF('telefone', e.target.value)} placeholder="(35) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label">CNH</label>
                  <input className="form-input" value={form.cnh} onChange={e => setF('cnh', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa legada / opcional</label>
                  <input className="form-input" value={form.placa} onChange={e => setF('placa', e.target.value.toUpperCase())} placeholder="ABC-1234" />
                </div>
                <div className="form-group">
                  <label className="form-label">Veículo legado / opcional</label>
                  <input className="form-input" value={form.veiculo} onChange={e => setF('veiculo', e.target.value)} placeholder="Fiat Toro 2022" />
                </div>
              </div>
              <div style={{
                background: 'var(--bg)', borderRadius: 8, padding: '10px 12px',
                fontSize: 12, color: 'var(--text-2)', marginTop: 4
              }}>
                Para novos cadastros, o ideal agora é vincular o veículo no lançamento da viagem.
                Estes campos continuam aqui só para compatibilidade com os motoristas antigos.
              </div>
              {!editando && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0 14px' }} />
                  <p className="text-muted text-sm" style={{ marginBottom: 10 }}>
                    Acesso ao app Android — crie o e-mail e senha que o motorista usará para fazer login:
                  </p>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">E-mail de acesso *</label>
                      <input className="form-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Senha inicial *</label>
                      <input className="form-input" type="password" value={form.senha} onChange={e => setF('senha', e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
