import React, { useEffect, useState } from 'react';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const EMPTY = { placa: '', descricao: '', tipo: '', observacoes: '' };

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'veiculos'), orderBy('placa'));
    return onSnapshot(q, (snap) => {
      setVeiculos(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, []);

  const setF = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const abrirNovo = () => {
    setForm(EMPTY);
    setEditando(null);
    setShowModal(true);
  };
  const abrirEditar = (veiculo) => {
    setForm({
      placa: veiculo.placa || '',
      descricao: veiculo.descricao || '',
      tipo: veiculo.tipo || '',
      observacoes: veiculo.observacoes || '',
    });
    setEditando(veiculo.id);
    setShowModal(true);
  };

  const handleSalvar = async () => {
    if (!form.placa || !form.descricao) {
      toast.error('Placa e descrição são obrigatórias');
      return;
    }

    setSaving(true);
    try {
      const data = {
        placa: form.placa.trim().toUpperCase(),
        descricao: form.descricao.trim(),
        tipo: form.tipo.trim(),
        observacoes: form.observacoes.trim(),
      };

      if (editando) {
        await updateDoc(doc(db, 'veiculos', editando), data);
        toast.success('Veículo atualizado!');
      } else {
        await addDoc(collection(db, 'veiculos'), {
          ...data,
          ativo: true,
          criadoEm: serverTimestamp(),
        });
        toast.success('Veículo cadastrado!');
      }

      setShowModal(false);
      setForm(EMPTY);
      setEditando(null);
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (veiculo) => {
    await updateDoc(doc(db, 'veiculos', veiculo.id), { ativo: !veiculo.ativo });
    toast.success(veiculo.ativo ? 'Veículo desativado' : 'Veículo ativado');
  };

  return (
    <Layout title="Veículos">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo veículo
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Observações</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
                  Nenhum veículo cadastrado
                </td></tr>
              )}
              {veiculos.map((veiculo) => (
                <tr key={veiculo.id}>
                  <td style={{ fontWeight: 600 }}>{veiculo.placa}</td>
                  <td>{veiculo.descricao}</td>
                  <td>{veiculo.tipo || '—'}</td>
                  <td className="text-muted text-sm">{veiculo.observacoes || '—'}</td>
                  <td>
                    <span className={`badge ${veiculo.ativo ? 'badge-success' : 'badge-gray'}`}>
                      {veiculo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => abrirEditar(veiculo)}>Editar</button>
                      <button className="btn btn-sm" onClick={() => toggleAtivo(veiculo)}>
                        {veiculo.ativo ? 'Desativar' : 'Ativar'}
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
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editando ? 'Editar veículo' : 'Novo veículo'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    className="form-input"
                    value={form.placa}
                    onChange={(e) => setF('placa', e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    className="form-input"
                    value={form.descricao}
                    onChange={(e) => setF('descricao', e.target.value)}
                    placeholder="Fiat Toro 2022"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <input
                    className="form-input"
                    value={form.tipo}
                    onChange={(e) => setF('tipo', e.target.value)}
                    placeholder="Utilitário, caminhão, van..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <input
                    className="form-input"
                    value={form.observacoes}
                    onChange={(e) => setF('observacoes', e.target.value)}
                    placeholder="Dados opcionais do veículo"
                  />
                </div>
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
