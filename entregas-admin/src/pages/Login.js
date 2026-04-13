// src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';
import { getLoginErrorMessage } from '../lib/authAccess';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err) {
      toast.error(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--primary)',
            borderRadius: 12, margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 3h15l4 5v13H1z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="16.5" cy="17.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Painel de Entregas</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>Acesso administrativo</p>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@suaempresa.com"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
