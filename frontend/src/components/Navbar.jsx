import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Sparkles, Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return (
      <nav className="glass-panel" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img
              src="/logo.png"
              alt="HunarConnect"
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>HunarConnect</span>
          </div>
        </div>

        {/* Right: Login/Signup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', borderRadius: '9px', fontSize: '13px' }}
          >
            <span>Login</span>
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn btn-primary"
            style={{ padding: '8px 14px', borderRadius: '9px', fontSize: '13px' }}
          >
            <span>Sign Up</span>
          </button>
        </div>
      </nav>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleColor = user.role === 'admin'
    ? 'var(--danger)'
    : user.role === 'client'
      ? 'var(--accent-secondary)'
      : 'var(--success)';

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--navbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '1px solid var(--glass-border)',
    }}>
      {/* Left: Hamburger (mobile) + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger — visible on mobile only */}
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: '8px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="navbar-hamburger"
        >
          <Menu size={22} />
        </button>

        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img
            src="/logo.png"
            alt="HunarConnect"
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>HunarConnect</span>
        </div>
      </div>

      {/* Right: User info + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* User avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${roleColor}22`,
            border: `1.5px solid ${roleColor}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: roleColor,
            flexShrink: 0,
          }}>
            <User size={17} />
          </div>
          <div style={{ textAlign: 'left' }} className="navbar-user-info">
            <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: 1.2 }}>{user.name}</div>
            <span
              className={`badge badge-${user.role}`}
              style={{ fontSize: '9px', padding: '2px 7px', marginTop: '2px' }}
            >
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', borderRadius: '9px', fontSize: '13px' }}
        >
          <LogOut size={14} />
          <span className="navbar-logout-text">Logout</span>
        </button>
      </div>

      {/* Inline responsive rules */}
      <style>{`
        .navbar-hamburger { display: none !important; }
        @media (max-width: 768px) {
          .navbar-hamburger { display: flex !important; }
          .navbar-brand-text { display: none; }
          .navbar-brand-sparkle { display: none; }
          .navbar-user-info { display: none; }
          .navbar-logout-text { display: none; }
        }
      `}</style>
    </nav>
  );
}
