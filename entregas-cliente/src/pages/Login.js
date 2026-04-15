// src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch {
      setErro('E-mail ou senha incorretos. Entre em contato com seu fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <section className="login-showcase">
          <div className="login-kicker">Portal do cliente</div>
          <h1>Veja a entrega com contexto e transparência.</h1>
          <p>
            Acompanhe o andamento da carga, receba o comprovante correto de cada entrega e consulte o histórico
            sempre que precisar.
          </p>
          <div className="login-showcase-grid">
            <div className="login-showcase-card">
              <strong>Rastreamento claro</strong>
              <span>Entregas em rota ficam visíveis com localização atualizada e progresso completo.</span>
            </div>
            <div className="login-showcase-card">
              <strong>Comprovantes organizados</strong>
              <span>Cada entrega concluída mostra a própria foto, sem misturar dados de outras viagens.</span>
            </div>
            <div className="login-showcase-card">
              <strong>Consulta rápida</strong>
              <span>Pesquise por nota fiscal e navegue entre entregas em andamento e histórico.</span>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-head">
            <div className="login-logo">
              <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 3h15l4 5v13H1z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="16.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
            <h1 className="login-title">Acompanhar entrega</h1>
            <p className="login-sub">Acesse com os dados enviados pelo seu fornecedor</p>
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-input" type="password" value={senha}
                  onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary" type="submit"
                style={{ marginTop: 6 }} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
