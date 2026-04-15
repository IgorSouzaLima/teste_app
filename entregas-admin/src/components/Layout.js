// src/components/Layout.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label, active, onClick }) => (
  <button className={`nav-link ${active ? 'active' : ''}`} onClick={onClick}>
    {icon}
    {label}
  </button>
);

export default function Layout({ children, title }) {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sectionDescription = {
    Dashboard: 'Visão geral da operação, filtros rápidos e rastreamento ativo.',
    Viagens: 'Lance, acompanhe e finalize as cargas com contexto completo.',
    Motoristas: 'Gerencie cadastro, acesso e compatibilidade dos perfis ativos.',
    Veículos: 'Organize a frota disponível para uso nas próximas viagens.',
    Clientes: 'Controle acessos, contatos e empresas atendidas pelo sistema.',
    Auditoria: 'Acompanhe o histórico das ações administrativas registradas no sistema.',
  };
  const userLabel = userData?.nome || userData?.email || 'Administrador';
  const userInitials = userLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD';

  const handleLogout = async () => {
    await logout();
    toast.success('Saiu do sistema');
  };

  const nav = [
    {
      to: '/', label: 'Dashboard',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    },
    {
      to: '/viagens', label: 'Viagens',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 3h15l4 5v13H1z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>
    },
    {
      to: '/motoristas', label: 'Motoristas',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M2 21c0-4 4.5-7 10-7s10 3 10 7"/></svg>
    },
    {
      to: '/veiculos', label: 'Veículos',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>
    },
    {
      to: '/clientes', label: 'Clientes',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    },
    {
      to: '/auditoria', label: 'Auditoria',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>
    },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-row">
            <div className="sidebar-mark">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 3h15l4 5v13H1z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="16.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <h1>Entregas</h1>
              <p>Painel administrativo</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              onClick={() => navigate(item.to)}
            />
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-label">Sessão ativa</div>
            <div className="sidebar-user-name">{userLabel}</div>
          </div>
          <button className="nav-link" onClick={handleLogout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sair
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="topbar-eyebrow">Operação</span>
            <h2>{title}</h2>
            <p className="topbar-subtitle">{sectionDescription[title] || 'Acompanhe a central de entregas com clareza e contexto.'}</p>
          </div>
          <div className="topbar-meta">
            <div className="topbar-user">
              <span className="topbar-user-mark">{userInitials}</span>
              <span>
                <span className="topbar-user-label">Responsável</span>
                <span className="topbar-user-value">{userLabel}</span>
              </span>
            </div>
          </div>
        </header>
        <main className="content">
          <div className="content-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
