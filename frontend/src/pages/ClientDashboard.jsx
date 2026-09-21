import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Briefcase, CreditCard, Clock, CheckCircle, PlusCircle, ArrowRight, AlertCircle, Wallet, ArrowDownCircle } from 'lucide-react';

export default function ClientDashboard() {
  const { token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab State: 'dashboard', 'wallet'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [payments, setPayments] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    fetchMyProjects();
    fetchWalletData();
  }, [token]);

  const fetchMyProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch projects.');
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWalletBalance(data.balance || 0);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(depositAmount) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess('Funds deposited successfully!');
      setDepositAmount('');
      fetchWalletData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Compute stats
  const totalPosted = projects.length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const totalSpent = payments.filter(p => p.payment_status === 'completed' && p.project_id > 0).reduce((acc, p) => acc + parseFloat(p.amount), 0);
  const freelancersHired = new Set(projects.filter(p => p.freelancer_id).map(p => p.freelancer_id)).size;

  const statusBadgeClass = (status) => {
    if (status === 'open') return 'badge-open';
    if (status === 'in_progress') return 'badge-in_progress';
    if (status === 'completed') return 'badge-completed';
    if (status === 'paused') return 'badge-pending';
    return 'badge-pending';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring"></div>
        <span>Loading your workspace...</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Jobs Posted', value: totalPosted,
      icon: <Briefcase size={22} />, color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)'
    },
    {
      label: 'Active Contracts', value: inProgress,
      icon: <Clock size={22} />, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      label: 'Talents Hired', value: freelancersHired,
      icon: <CheckCircle size={22} />, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: 'Total Expenditures', value: `$${totalSpent.toLocaleString()}`,
      icon: <CreditCard size={22} />, color: 'var(--accent-secondary)', bg: 'rgba(6, 182, 212, 0.1)'
    },
  ];

  return (
    <div className="animated-fade">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Client Workspace</h1>
          <p>Post projects, manage active contracts, and make secure escrow payments.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/post-job" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Post a New Job</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
          {success}
        </div>
      )}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'dashboard' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
            fontWeight: '600', fontSize: '15px', padding: '6px 12px', borderBottom: activeTab === 'dashboard' ? '2px solid var(--accent-secondary)' : 'none', cursor: 'pointer'
          }}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'wallet' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
            fontWeight: '600', fontSize: '15px', padding: '6px 12px', borderBottom: activeTab === 'wallet' ? '2px solid var(--accent-secondary)' : 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Wallet size={16} /> Escrow Wallet (${walletBalance})
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '36px' }}>
            {statCards.map(card => (
              <div key={card.label} className="glass-panel" style={{
                padding: '20px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  backgroundColor: card.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: card.color, flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{card.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Job Postings Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px' }}>Your Job Postings</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{totalPosted} project{totalPosted !== 1 ? 's' : ''}</span>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel empty-state">
              <Briefcase size={42} color="var(--text-muted)" />
              <p>You haven't posted any projects yet. Start by posting your first job!</p>
              <Link to="/post-job" className="btn btn-primary">
                <PlusCircle size={15} /> Post Your First Job
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {projects.map((project) => (
                <div key={project.id} className="glass-panel project-list-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600' }}>{project.title}</h3>
                      <span className={`badge ${statusBadgeClass(project.status)}`}>
                        {project.status === 'in_progress' ? 'In Progress' : project.status.toUpperCase()}
                      </span>
                    </div>

                    <p style={{
                      color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5'
                    }}>
                      {project.description}
                    </p>

                    <div className="project-card-meta">
                      <span>Budget: <strong>${project.budget}</strong></span>
                      {project.skills_required && (
                        <span>Skills: <strong>{project.skills_required}</strong></span>
                      )}
                      {project.freelancer_name && (
                        <span>
                          Hired: <strong style={{ color: 'var(--accent-secondary)' }}>{project.freelancer_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`} className="btn btn-secondary" style={{ flexShrink: 0 }}>
                    <span>Manage Work</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button 
                    onClick={() => {
                      if (window.confirm('Cancel this project? This action cannot be undone.')) {
                        fetch(`http://localhost:5000/api/projects/${project.id}`, {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        }).then(res => {
                          if (res.ok) {
                            setSuccess('Project cancelled.');
                            fetchMyProjects();
                          }
                        });
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ flexShrink: 0, color: 'var(--danger)' }}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'wallet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'flex-start' }}>
          {/* History log */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Escrow Payments History</h2>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {payments.map(pay => (
                  <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {pay.project_id === 0 ? 'Wallet Deposit' : `Escrow Payment (Project #${pay.project_id})`}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(pay.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: pay.project_id === 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold', fontSize: '16px' }}>
                        {pay.project_id === 0 ? `+$${pay.amount}` : `-$${pay.amount}`}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pay.payment_status.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deposit Funds Form */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownCircle /> Deposit Funds
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Add money to your platform wallet. Funds in your wallet can be funded into project milestones or paid directly to hired freelancers.
            </p>
            <form onSubmit={handleDepositSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Deposit Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="100.00"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                Deposit Now (Simulated)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
