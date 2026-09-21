import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, KeyRound, Sparkles, Loader, Shield, Briefcase } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('freelancer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, rgba(29, 140, 248, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.15), transparent 40%)',
      padding: '30px 20px'
    }}>
      <div className="glass-panel animated-fade" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <img
            src="/logo.png"
            alt="HunarConnect"
            style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '25px', fontWeight: '500' }}>Create Your Account</h2>
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  style={{ paddingLeft: '45px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{ paddingLeft: '45px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  style={{ paddingLeft: '45px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '500' }}>
                Join As A
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div
                  onClick={() => setRole('freelancer')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${role === 'freelancer' ? 'var(--accent-secondary)' : 'var(--glass-border)'}`,
                    background: role === 'freelancer' ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition)'
                  }}
                >
                  <Briefcase size={22} color={role === 'freelancer' ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: role === 'freelancer' ? '#fff' : 'var(--text-secondary)' }}>Freelancer</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Work on projects & earn</span>
                </div>

                <div
                  onClick={() => setRole('client')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${role === 'client' ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                    background: role === 'client' ? 'rgba(29, 140, 248, 0.08)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition)'
                  }}
                >
                  <Shield size={22} color={role === 'client' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: role === 'client' ? '#fff' : 'var(--text-secondary)' }}>Client</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Hire talents & post jobs</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '45px', gap: '10px' }}>
              {loading ? <Loader size={18} className="spin-animation" /> : <Sparkles size={18} />}
              <span>{loading ? 'Creating Account...' : 'Register'}</span>
            </button>
          </form>

          <p style={{ marginTop: '25px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: '600' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
