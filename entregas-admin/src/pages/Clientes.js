// src/pages/Clientes.js
import React, { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc, setDoc
} from 'firebase/firestore';
import { createAuthUserWithSecondaryApp } from '../lib/createAuthUser';
import { db, firebaseConfig } from '../lib/firebase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';
import { registrarAuditoria } from '../lib/auditoria';

const EMPTY = { razaoSocial: '', cnpj: '', contato: '', telefone: '', email: '', cidade: '', senha: '' };

export default function Clientes() {
  const { user, userData } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'clientes'), orderBy('razaoSocial'));
    return onSnapshot(q, snap => {
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const abrirNovo = () => { setForm(EMPTY); setEditando(null); setShowModal(true); };
  const abrirEditar = (c) => { setForm({ ...c, senha: '' }); setEditando(c.id); setShowModal(true); };

  const handleSalvar = async () => {
    if (!form.razaoSocial || !form.email) { toast.error('Razão social e e-mail são obrigatórios'); return; }
    setSaving(true);
    try {
      const ator = { uid: user?.uid, nome: userData?.nome, email: userData?.email || user?.email };
      if (editando) {
        const { senha, ...data } = form;
        await updateDoc(doc(db, 'clientes', editando), data);
        await registrarAuditoria({
          ator,
          acao: 'cliente.atualizado',
          entidade: 'cliente',
          entidadeId: editando,
          descricao: `Cliente ${form.razaoSocial} atualizado no painel.`,
          meta: { cidade: form.cidade || '—', email: form.email },
        });
        toast.success('Cliente atualizado!');
      } else {
        if (!form.senha) { toast.error('Senha necessária para novo cliente'); setSaving(false); return; }
        const userId = await createAuthUserWithSecondaryApp(firebaseConfig, form.email, form.senha);
        const cliRef = await addDoc(collection(db, 'clientes'), {
          userId,
          razaoSocial: form.razaoSocial, cnpj: form.cnpj,
          contato: form.contato, telefone: form.telefone,
          email: form.email, cidade: form.cidade,
          ativo: true, criadoEm: serverTimestamp(),
        });
        await setDoc(doc(db, 'users', userId), {
          uid: userId, email: form.email, nome: form.razaoSocial,
          role: 'cliente', clienteId: cliRef.id,
          criadoEm: serverTimestamp(), ativo: true,
        });
        await registrarAuditoria({
          ator,
          acao: 'cliente.criado',
          entidade: 'cliente',
          entidadeId: cliRef.id,
          descricao: `Cliente ${form.razaoSocial} cadastrado com acesso ao portal.`,
          meta: { cidade: form.cidade || '—', email: form.email },
        });
        toast.success('Cliente cadastrado!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (c) => {
    await updateDoc(doc(db, 'clientes', c.id), { ativo: !c.ativo });
    await registrarAuditoria({
      ator: { uid: user?.uid, nome: userData?.nome, email: userData?.email || user?.email },
      acao: c.ativo ? 'cliente.desativado' : 'cliente.ativado',
      entidade: 'cliente',
      entidadeId: c.id,
      descricao: `Cliente ${c.razaoSocial} foi ${c.ativo ? 'desativado' : 'ativado'}.`,
      meta: { email: c.email, cidade: c.cidade || '—' },
    });
  };

  return (
    <Layout title="Clientes">
      <div className="page-toolbar">
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Base de clientes</div>
          <div className="card-subtitle">Cadastre empresas atendidas, contatos e acessos do portal do cliente.</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo cliente
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Razão social</th><th>CNPJ</th><th>Contato</th>
                <th>Telefone</th><th>Cidade</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhum cliente cadastrado
                </td></tr>
              )}
              {clientes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.razaoSocial}</td>
                  <td className="text-muted text-sm">{c.cnpj || '—'}</td>
                  <td>{c.contato || '—'}</td>
                  <td>{c.telefone || '—'}</td>
                  <td>{c.cidade || '—'}</td>
                  <td><span className={`badge ${c.ativo ? 'badge-success' : 'badge-gray'}`}>{c.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => abrirEditar(c)}>Editar</button>
                      <button className="btn btn-sm" onClick={() => toggleAtivo(c)}>{c.ativo ? 'Desativar' : 'Ativar'}</button>
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
              <h3>{editando ? 'Editar cliente' : 'Novo cliente'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Razão social *</label>
                  <input className="form-input" value={form.razaoSocial} onChange={e => setF('razaoSocial', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input className="form-input" value={form.cnpj} onChange={e => setF('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" value={form.cidade} onChange={e => setF('cidade', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do contato</label>
                  <input className="form-input" value={form.contato} onChange={e => setF('contato', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-input" value={form.telefone} onChange={e => setF('telefone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail de acesso *</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setF('email', e.target.value)} disabled={!!editando} />
                </div>
                {!editando && (
                  <div className="form-group">
                    <label className="form-label">Senha inicial *</label>
                    <input className="form-input" type="password" value={form.senha} onChange={e => setF('senha', e.target.value)} />
                  </div>
                )}
              </div>
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
