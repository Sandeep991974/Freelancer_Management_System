import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FindProjects from './pages/FindProjects';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';

// Helper component to guard authenticated routes
function ProtectedLayout() {
  const { user, loading } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring"></div>
        <span>Loading session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />

      {/* Mobile overlay — closes sidebar when clicking outside */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Routes>
          {/* Dashboard route resolves dynamically based on user role */}
          <Route path="/dashboard" element={
            user.role === 'admin' ? <AdminDashboard /> :
            user.role === 'client' ? <ClientDashboard /> :
            <FreelancerDashboard />
          } />

          <Route path="/find-projects" element={<FindProjects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/profile" element={<Profile />} />

          {/* Client Only routes */}
          {user.role === 'client' && (
            <>
              <Route path="/post-job" element={<CreateProject />} />
              <Route path="/freelancers" element={<FreelancerListPage />} />
            </>
          )}

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Freelancer directory page for clients
function FreelancerListPage() {
  const { token } = useContext(AuthContext);
  const [freelancers, setFreelancers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQ, setSearchQ] = React.useState('');

  React.useEffect(() => {
    fetch('http://localhost:5000/api/auth/freelancers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFreelancers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = freelancers.filter(f =>
    f.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    (f.skills || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring"></div>
        <span>Loading talent directory...</span>
      </div>
    );
  }

  return (
    <div className="animated-fade">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Hire Freelancers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Search and contact available freelancers on the platform.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name or skill..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel empty-state">
          <p>No freelancers match your search.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(free => (
            <div key={free.id} className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '700', fontSize: '20px', flexShrink: 0
                }}>
                  {free.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>{free.name}</div>
                  <div style={{ color: 'var(--success)', fontWeight: '600', fontSize: '13px' }}>
                    ${free.hourly_rate}/hr
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, lineHeight: '1.5' }}>
                {free.bio || 'Professional freelancer ready for new projects.'}
              </p>

              {free.skills && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {free.skills.split(',').slice(0, 4).map((s, i) => (
                    <span key={i} style={{
                      fontSize: '11px', padding: '3px 8px',
                      background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)',
                      borderRadius: '99px', border: '1px solid rgba(99,102,241,0.2)'
                    }}>{s.trim()}</span>
                  ))}
                </div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px',
                color: 'var(--warning)', paddingTop: '10px', borderTop: '1px solid var(--glass-border)'
              }}>
                <span>★</span>
                <strong>{parseFloat(free.avg_rating).toFixed(1)}</strong>
                <span style={{ color: 'var(--text-muted)' }}>({free.review_count} reviews)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Guarded routes nested under ProtectedLayout */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
