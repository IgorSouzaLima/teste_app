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
    <div className="admin-login-shell">
      <div className="admin-login-box">
        <section className="admin-login-hero">
          <div className="admin-login-chip">
            <span>Controle operacional</span>
          </div>
          <h1>Administre cada viagem com mais clareza.</h1>
          <p>
            Um painel com visão rápida da operação, rastreamento ao vivo e histórico confiável para
            acompanhar lançamentos, entregas e comprovantes sem perder contexto.
          </p>
          <div className="admin-login-feature-list">
            <div className="admin-login-feature">
              <strong>Viagens em contexto</strong>
              <span>Visualize status, filtros e detalhes da carga em um único lugar.</span>
            </div>
            <div className="admin-login-feature">
              <strong>Equipe e frota organizadas</strong>
              <span>Cadastre motoristas, veículos e clientes sem perder a compatibilidade existente.</span>
            </div>
            <div className="admin-login-feature">
              <strong>Rastreamento com prova de entrega</strong>
              <span>Monitore a operação e confirme cada etapa com dados salvos em tempo real.</span>
            </div>
          </div>
        </section>

        <section className="admin-login-panel">
          <div className="admin-login-header">
            <div className="admin-login-mark">
              <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 3h15l4 5v13H1z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="16.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
            <h2>Painel de Entregas</h2>
            <p>Acesso administrativo para operação e acompanhamento completo.</p>
          </div>

          <div className="card">
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
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
