import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, DollarSign, Clock, FileText, ArrowRight, Clipboard, AlertCircle, Wallet, Bell, CheckSquare } from 'lucide-react';

export default function FreelancerDashboard() {
  const { token, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab State: 'dashboard', 'wallet', 'notifications'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchWalletData();
    fetchNotifications();

    // Listen to real-time notifications if available
    const socketInterval = setInterval(() => {
      fetchNotifications();
    }, 15000); // Poll every 15s to keep notifications sync'd

    return () => clearInterval(socketInterval);
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch dashboard projects.');
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
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !bankDetails) {
      setError('Please provide a valid withdrawal amount and bank/account details.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/payments/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount), bankDetails })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess(data.message || 'Withdrawal request submitted successfully.');
      setWithdrawAmount('');
      setBankDetails('');
      fetchWalletData();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Compute freelancer metrics
  const totalBids = projects.length;
  const activeJobs = projects.filter(p => p.status === 'in_progress' && p.bid_status === 'accepted').length;
  const completedJobs = projects.filter(p => p.status === 'completed' && p.bid_status === 'accepted').length;
  const totalEarnings = payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);

  const statusBadgeClass = (status) => {
    if (status === 'open') return 'badge-open';
    if (status === 'in_progress') return 'badge-in_progress';
    if (status === 'completed') return 'badge-completed';
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
      label: 'Total Proposals', value: totalBids,
      icon: <Clipboard size={22} />, color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)'
    },
    {
      label: 'Active Contracts', value: activeJobs,
      icon: <Clock size={22} />, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      label: 'Jobs Completed', value: completedJobs,
      icon: <FileText size={22} />, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: 'Total Earnings', value: `$${totalEarnings.toLocaleString()}`,
      icon: <DollarSign size={22} />, color: 'var(--accent-secondary)', bg: 'rgba(6, 182, 212, 0.1)'
    },
  ];

  return (
    <div className="animated-fade">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Freelancer Workspace</h1>
          <p>Bid on open projects, upload work submissions, and message clients in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/find-projects" className="btn btn-primary">
            <Search size={16} />
            <span>Browse Jobs</span>
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
          <Wallet size={16} /> My Wallet (${walletBalance})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'notifications' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
            fontWeight: '600', fontSize: '15px', padding: '6px 12px', borderBottom: activeTab === 'notifications' ? '2px solid var(--accent-secondary)' : 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Bell size={16} /> Notifications ({notifications.filter(n => !n.is_read).length})
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

          {/* Bids & Projects Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px' }}>Your Bids & Active Projects</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{totalBids} proposal{totalBids !== 1 ? 's' : ''}</span>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel empty-state">
              <Clipboard size={42} color="var(--text-muted)" />
              <p>You haven't bid on any projects yet. Start by exploring available jobs!</p>
              <Link to="/find-projects" className="btn btn-primary">
                <Search size={15} /> Explore Jobs
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
                        {project.status === 'in_progress' ? 'In Progress' : project.status}
                      </span>
                      <span className={`badge badge-${project.bid_status}`}>
                        Proposal: {project.bid_status}
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
                      <span>Client: <strong>{project.client_name}</strong></span>
                      <span>Budget: <strong>${project.budget}</strong></span>
                      <span>Your Bid: <strong style={{ color: 'var(--accent-secondary)' }}>${project.bid_amount}</strong></span>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`} className="btn btn-secondary" style={{ flexShrink: 0 }}>
                    <span>{project.bid_status === 'accepted' ? 'Workspace' : 'View Proposal'}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'wallet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'flex-start' }}>
          {/* Transaction logs */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Earning Logs & Payments</h2>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payment logs recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {payments.map(pay => (
                  <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Escrow Release</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Project #{pay.project_id} | {new Date(pay.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '16px' }}>
                      +${pay.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '18px', marginTop: '30px', marginBottom: '20px' }}>Withdrawal Requests</h2>
            {withdrawals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No withdrawal logs recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {withdrawals.map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Bank Wire Withdrawal</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Requested on {new Date(w.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '16px' }}>-${w.amount}</div>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                        background: w.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : w.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: w.status === 'pending' ? 'var(--warning)' : w.status === 'approved' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Make Withdrawal Form */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet /> Request Withdrawal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Withdraw your earnings directly to your bank account. Minimum withdrawal amount: $5.00
            </p>
            <form onSubmit={handleWithdrawalRequest}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Amount to Withdraw ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={5.00}
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Available: ${walletBalance}</span>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bank Account Details / Wire Info</label>
                <textarea
                  rows={4}
                  required
                  value={bankDetails}
                  onChange={e => setBankDetails(e.target.value)}
                  placeholder="Bank Name:&#10;Account Number:&#10;Routing/Swift Code:&#10;Account Holder Name:"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>Notification History</h2>
            {notifications.length > 0 && (
              <button onClick={markAllNotificationsRead} className="btn btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '36px' }}>
                <CheckSquare size={16} /> Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No notifications to show.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: n.is_read ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.05)',
                    borderLeft: `3px solid ${n.is_read ? 'transparent' : 'var(--accent-primary)'}`,
                    borderTop: '1px solid var(--glass-border)',
                    borderRight: '1px solid var(--glass-border)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ color: '#fff', fontSize: '14px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
