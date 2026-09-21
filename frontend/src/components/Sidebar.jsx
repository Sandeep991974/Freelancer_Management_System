import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, User, PlusCircle, Search, Users, Shield, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: isActive(path) ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
    borderLeft: isActive(path) ? '3px solid var(--accent-primary)' : '3px solid transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive(path) ? '600' : '400',
    transition: 'var(--transition)',
    marginBottom: '4px',
  });

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/find-projects', icon: <Search size={18} />, label: 'Find Jobs' },
    ...(user.role === 'client' ? [
      { to: '/post-job', icon: <PlusCircle size={18} />, label: 'Post a Job' },
      { to: '/freelancers', icon: <Users size={18} />, label: 'Hire Freelancers' },
    ] : []),
    { to: '/profile', icon: <User size={18} />, label: 'My Profile' },
  ];

  return (
    <aside
      className="glass-panel app-sidebar-el"
      style={{
        position: 'fixed',
        top: 'var(--navbar-height)',
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        padding: '20px 12px',
        zIndex: 90,
        borderTop: 'none',
        borderLeft: 'none',
        borderBottom: 'none',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // Mobile: controlled by isOpen via inline style
        transform: undefined, // desktop: CSS handles this (translateX(0))
      }}
    >
      {/* ── Mobile close button ── */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        style={{
          alignSelf: 'flex-end',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: '4px',
          marginBottom: '8px',
          borderRadius: '6px',
          display: 'none', // shown via CSS below on mobile
        }}
        className="sidebar-close-btn"
      >
        <X size={20} />
      </button>

      {/* ── Nav links ── */}
      <div>
        <div style={{
          color: 'var(--text-muted)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 10px 14px 10px',
          fontWeight: '700',
        }}>
          Navigation
        </div>

        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={getLinkStyle(item.to)}
            onClick={onClose}
          >
            <span style={{ color: isActive(item.to) ? 'var(--accent-secondary)' : 'currentColor', display: 'flex' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Bottom status ── */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        {user.role === 'admin' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '8px', color: 'var(--danger)',
            fontWeight: '600', fontSize: '11px',
          }}>
            <Shield size={13} />
            <span>Admin Panel</span>
          </div>
        )}
        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', fontSize: '13px' }}>
          {user.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
          Online
        </div>
      </div>

      {/* Scoped mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .app-sidebar-el {
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
}
