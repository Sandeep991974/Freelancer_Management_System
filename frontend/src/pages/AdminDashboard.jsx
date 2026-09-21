import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, Briefcase, DollarSign, Activity, Trash2, Shield, AlertCircle, Search, CreditCard, Flag, FileText, Bell, Check } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const [overview, setOverview] = useState({ totalUsers: 0, totalProjects: 0, totalBids: 0, totalPayments: 0, totalClients: 0, totalFreelancers: 0 });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // New Admin States
  const [withdrawals, setWithdrawals] = useState([]);
  const [reports, setReports] = useState([]);
  
  // CMS Content
  const [faqText, setFaqText] = useState('');
  const [termsText, setTermsText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchUsers();
    fetchProjects();
    fetchWithdrawals();
    fetchReports();
    fetchCMS();
  }, [token]);

  const fetchOverview = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOverview(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setWithdrawals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCMS = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/cms');
      const data = await res.json();
      if (res.ok) {
        const faqs = data.find(c => c.content_key === 'faqs');
        const terms = data.find(c => c.content_key === 'terms');
        if (faqs) setFaqText(faqs.content_value);
        if (terms) setTermsText(terms.content_value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserBlock = async (id, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ block: !currentStatus })
      });
      if (res.ok) {
        setSuccess(`User block status changed.`);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyUser = async (id, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ verify: !currentStatus })
      });
      if (res.ok) {
        setSuccess(`User verification status changed.`);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('User role updated successfully.');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update role');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        fetchOverview();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
        fetchOverview();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProjectStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/projects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Project status updated.');
        fetchProjects();
      } else {
        setError(data.error || 'Failed to update project status');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update project status');
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccess(`Withdrawal successfully ${status}.`);
        fetchWithdrawals();
        fetchOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/reports/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess(`Report resolved.`);
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCMS = async (key, val) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content_key: key, content_value: val })
      });
      if (res.ok) {
        setSuccess(`CMS content updated successfully.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: broadcastMessage })
      });
      if (res.ok) {
        setSuccess('Broadcast notification sent to all users!');
        setBroadcastMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.status.toLowerCase().includes(projectSearch.toLowerCase())
  );

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
        <span>Loading admin data...</span>
      </div>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: overview.totalUsers, icon: <Users size={26} />, color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)' },
    { label: 'Total Projects', value: overview.totalProjects, icon: <Briefcase size={26} />, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Platform Transactions', value: `$${parseFloat(overview.totalPayments || 0).toLocaleString()}`, icon: <DollarSign size={26} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Freelancers / Clients', value: `${overview.totalFreelancers || 0} / ${overview.totalClients || 0}`, icon: <Activity size={26} />, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  ];

  return (
    <div className="animated-fade" style={{ paddingBottom: '40px' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            <Shield size={24} color="var(--danger)" />
            Admin Dashboard
          </h1>
          <p>Moderator workspace: Manage users, approve withdrawals, update page CMS and post broadcast alerts.</p>
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

      {/* Tab navigation */}
      <div className="tabs" style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {['overview', 'users', 'projects', 'withdrawals', 'reports', 'cms'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSuccess(''); setError(''); }}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="card-grid">
          {overviewCards.map(card => (
            <div key={card.label} className="glass-panel card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '16px',
                background: card.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: card.color, flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{card.label}</p>
                <h2 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em' }}>{card.value}</h2>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '17px' }}>User Directory <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}>({filteredUsers.length})</span></h3>
            <div style={{ position: 'relative', maxWidth: '260px', flex: '1' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No users found.
                    </td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id}</td>
                    <td style={{ fontWeight: '500' }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <span style={{ color: u.is_blocked ? 'var(--danger)' : 'var(--success)' }}>
                        {u.is_blocked ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: u.is_verified ? 'var(--success)' : 'var(--warning)' }}>
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          disabled={u.role === 'admin'}
                          style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
                        >
                          <option value="client">Client</option>
                          <option value="freelancer">Freelancer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateUserBlock(u.id, u.is_blocked)}
                            disabled={u.role === 'admin'}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', color: u.is_blocked ? 'var(--success)' : 'var(--warning)' }}
                          >
                            {u.is_blocked ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleVerifyUser(u.id, u.is_verified)}
                            disabled={u.role === 'admin'}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            {u.is_verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === 'admin'}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Projects Tab ── */}
      {activeTab === 'projects' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '17px' }}>Project Directory <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}>({filteredProjects.length})</span></h3>
            <div style={{ position: 'relative', maxWidth: '260px', flex: '1' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No projects found.
                    </td>
                  </tr>
                ) : filteredProjects.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{p.id}</td>
                    <td style={{ fontWeight: '500', maxWidth: '220px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.title}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.client_name}</td>
                    <td style={{ color: 'var(--success)', fontWeight: '600' }}>${parseFloat(p.budget).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '190px' }}>
                        <select
                          value={p.status}
                          onChange={(e) => handleUpdateProjectStatus(p.id, e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={13} /> Delete Fraud
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Withdrawals Tab ── */}
      {activeTab === 'withdrawals' && (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Freelancer Withdrawal Approvals</h3>
          {withdrawals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No withdrawals registered.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Freelancer</th>
                    <th>Email</th>
                    <th>Wire Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id}>
                      <td>{w.freelancer_name}</td>
                      <td>{w.freelancer_email}</td>
                      <td style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>{w.bank_details}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>${w.amount}</td>
                      <td>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                          background: w.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : w.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: w.status === 'pending' ? 'var(--warning)' : w.status === 'approved' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {w.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleProcessWithdrawal(w.id, 'approved')} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                              Approve
                            </button>
                            <button onClick={() => handleProcessWithdrawal(w.id, 'rejected')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Platform Spam & Fraud Reports</h3>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No reports registered.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reporter</th>
                    <th>Target Type</th>
                    <th>Target ID</th>
                    <th>Reason / Details</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td>{r.reporter_name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.target_type}</td>
                      <td>#{r.target_id}</td>
                      <td>{r.reason}</td>
                      <td>
                        <span style={{ color: r.status === 'pending' ? 'var(--warning)' : 'var(--success)' }}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {r.status === 'pending' && (
                          <button onClick={() => handleResolveReport(r.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CMS & Broadcast Tab ── */}
      {activeTab === 'cms' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* CMS Manager */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Manage Homepage CMS Content</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Homepage FAQs (JSON / Text)</label>
              <textarea rows={6} value={faqText} onChange={e => setFaqText(e.target.value)} placeholder="Frequently asked questions..." />
              <button onClick={() => handleSaveCMS('faqs', faqText)} className="btn btn-primary" style={{ marginTop: '8px', height: '36px' }}>Save FAQs</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Terms & Conditions</label>
              <textarea rows={6} value={termsText} onChange={e => setTermsText(e.target.value)} placeholder="Terms of Service..." />
              <button onClick={() => handleSaveCMS('terms', termsText)} className="btn btn-primary" style={{ marginTop: '8px', height: '36px' }}>Save Terms</button>
            </div>
          </div>

          {/* Broadcast Alerts */}
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell /> Dispatch Broadcast Notification
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Send an instant real-time notification alert to all registered users on the HunarConnect platform.
            </p>
            <form onSubmit={handleBroadcast}>
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="System Maintenance will occur at 12:00 AM EST tonight..."
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <Check size={18} />
                <span>Broadcast Alert Now</span>
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
