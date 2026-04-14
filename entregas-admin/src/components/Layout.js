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
      to: '/clientes', label: 'Clientes',
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Entregas</h1>
          <p>Painel administrativo</p>
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
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, paddingLeft: 4 }}>
            {userData?.nome || userData?.email}
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
          <h2>{title}</h2>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
