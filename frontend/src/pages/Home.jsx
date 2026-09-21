import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Search, UserPlus, Clipboard, ShieldCheck, Mail, Globe, HelpCircle, Shield, 
  Briefcase, Users, DollarSign, Star, Tag, Calendar, ArrowRight, X, 
  KeyRound, Loader, Sparkles, User, Eye, EyeOff, Menu, ChevronDown
} from 'lucide-react';

export default function Home() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Public data
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [stats, setStats] = useState({ totalFreelancers: 0, totalClients: 0, totalProjects: 0, completedProjects: 0 });

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active section (for scrolling)
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      const [projRes, freeRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/public/projects'),
        fetch('http://localhost:5000/api/public/freelancers'),
        fetch('http://localhost:5000/api/public/stats')
      ]);
      const projData = await projRes.json();
      const freeData = await freeRes.json();
      const statsData = await statsRes.json();
      if (projRes.ok) setProjects(projData);
      if (freeRes.ok) setFreelancers(freeData);
      if (statsRes.ok) setStats(statsData);
    } catch (err) {
      console.error('Failed to load public data:', err);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (user) {
      navigate('/find-projects', { state: { query: searchQuery } });
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-body)", backgroundColor: "#f6f9fc", color: "#2e384d", minHeight: "100vh" }}>
      
      {/* ═══════════════════ HEADER NAVBAR ═══════════════════ */}
      <header className="home-header">
        <div className="home-header-inner">
          {/* Logo */}
          <div className="home-logo" onClick={() => scrollToSection('home')}>
            <img 
              src="/logo.png" 
              alt="HunarConnect" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            />
            <span className="home-logo-text">Hunar<span style={{ color: '#1d8cf8' }}>Connect</span></span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="home-nav-links">
            <a onClick={() => scrollToSection('home')} className={activeSection === 'home' ? 'active' : ''}>Home</a>
            <a onClick={() => scrollToSection('find-work')} className={activeSection === 'find-work' ? 'active' : ''}>Find Work</a>
            <a onClick={() => scrollToSection('find-freelancers')} className={activeSection === 'find-freelancers' ? 'active' : ''}>Find Freelancers</a>
          </nav>

          {/* Right Actions */}
          <div className="home-nav-actions">
            {user ? (
              <>
                <span className="home-nav-user">Hi, {user.name}</span>
                <button className="home-btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="home-btn-outline" onClick={() => { logout(); }}>Logout</button>
              </>
            ) : (
              <>
                <button className="home-btn-login" onClick={() => navigate('/login')}>Log In</button>
                <button className="home-btn-signup" onClick={() => navigate('/register')}>Sign Up</button>
                <button className="home-btn-primary" onClick={() => navigate('/login')}>Post a project</button>
              </>
            )}
          </div>

          {/* Hamburger Menu (Mobile) */}
          <button className="home-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="home-mobile-menu">
            <a onClick={() => scrollToSection('home')}>Home</a>
            <a onClick={() => scrollToSection('find-work')}>Find Work</a>
            <a onClick={() => scrollToSection('find-freelancers')}>Find Freelancers</a>
            <hr style={{ borderColor: '#e2e8f0', margin: '10px 0' }} />
            {user ? (
              <>
                <a onClick={() => navigate('/dashboard')}>Dashboard</a>
                <a onClick={() => { logout(); setMobileMenuOpen(false); }}>Logout</a>
              </>
            ) : (
              <>
                <button className="home-btn-login" style={{ width: '100%' }} onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Log In</button>
                <button className="home-btn-signup" style={{ width: '100%' }} onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Sign Up</button>
              </>
            )}
          </div>
        )}
      </header>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section id="home" className="home-hero">
        <div className="home-hero-left">
          <h1 className="home-hero-title">Are you looking for<br />Freelancers?</h1>
          <p className="home-hero-subtitle">
            Hire Great Freelancers, Fast. HunarConnect helps you hire elite freelancers at a moment's notice.
          </p>

          <form onSubmit={handleSearchSubmit} className="home-hero-searchbar">
            <button type="button" className="home-hero-hire-btn" onClick={() => user ? navigate('/dashboard') : navigate('/login')}>
              Hire a freelancer
            </button>
          </form>
        </div>

        <div className="home-hero-right">
          <img src="/hero_illustration.png" alt="HunarConnect Hero" className="home-hero-img" />
        </div>
      </section>

      {/* ═══════════════════ 3-STEP CARDS ═══════════════════ */}
      <section className="home-steps">
        <div className="home-steps-grid">
          <div className="home-step-card">
            <div className="home-step-icon"><UserPlus size={28} /></div>
            <h3>Create Account</h3>
            <p>First you have to create a secure account here</p>
          </div>
          <div className="home-step-card">
            <div className="home-step-icon"><Clipboard size={28} /></div>
            <h3>Search work</h3>
            <p>Search the best freelance work here</p>
          </div>
          <div className="home-step-card">
            <div className="home-step-icon"><ShieldCheck size={28} /></div>
            <h3>Save and apply</h3>
            <p>Apply or save and start your work</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PLATFORM STATS ═══════════════════ */}
      <section className="home-stats-bar">
        <div className="home-stats-grid">
          <div className="home-stat-item">
            <div className="home-stat-number">{stats.totalFreelancers}</div>
            <div className="home-stat-label">Freelancers</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-number">{stats.totalClients}</div>
            <div className="home-stat-label">Clients</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-number">{stats.totalProjects}</div>
            <div className="home-stat-label">Projects Posted</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-number">{stats.completedProjects}</div>
            <div className="home-stat-label">Jobs Completed</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FIND WORK SECTION ═══════════════════ */}
      <section id="find-work" className="home-section">
        <div className="home-section-header">
          <h2><Briefcase size={24} style={{ marginRight: '10px', color: '#1d8cf8' }} /> Find Work</h2>
          <p>Browse available projects and start earning today.</p>
        </div>

        {projects.length === 0 ? (
          <div className="home-empty-state">
            <Briefcase size={40} color="#94a3b8" />
            <p>No open projects available right now. Be the first to post a project!</p>
            <button className="home-btn-primary" onClick={() => user ? navigate('/post-job') : navigate('/login')}>Post a Project</button>
          </div>
        ) : (
          <div className="home-projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="home-project-card">
                <div className="home-project-card-top">
                  <h3>{project.title}</h3>
                  <div className="home-project-budget">
                    <DollarSign size={16} />
                    <span>{parseFloat(project.budget).toLocaleString()}</span>
                  </div>
                </div>
                <p className="home-project-desc">{project.description}</p>
                
                {project.skills_required && (
                  <div className="home-project-skills">
                    {project.skills_required.split(',').slice(0, 4).map((skill, i) => (
                      <span key={i} className="home-skill-tag">
                        <Tag size={10} /> {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="home-project-card-bottom">
                  <span className="home-project-meta">
                    <Calendar size={13} /> {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="home-project-meta">by {project.client_name}</span>
                  <button className="home-btn-small" onClick={() => user ? navigate(`/projects/${project.id}`) : navigate('/login')}>
                    View & Bid <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ FIND FREELANCERS SECTION ═══════════════════ */}
      <section id="find-freelancers" className="home-section home-section-alt">
        <div className="home-section-header">
          <h2><Users size={24} style={{ marginRight: '10px', color: '#1d8cf8' }} /> Find Freelancers</h2>
          <p>Discover top-rated professionals available for hire right now.</p>
        </div>

        {freelancers.length === 0 ? (
          <div className="home-empty-state">
            <Users size={40} color="#94a3b8" />
            <p>No freelancers have joined yet. Be the first!</p>
            <button className="home-btn-primary" onClick={() => navigate('/register')}>Join as Freelancer</button>
          </div>
        ) : (
          <div className="home-freelancers-grid">
            {freelancers.map((free) => (
              <div key={free.id} className="home-freelancer-card">
                <div className="home-freelancer-avatar">
                  {free.name.charAt(0).toUpperCase()}
                </div>
                <h3>{free.name}</h3>
                <div className="home-freelancer-rate">
                  <DollarSign size={14} /> {free.hourly_rate}/hr
                </div>
                <p className="home-freelancer-bio">{free.bio || 'Professional freelancer ready for new projects.'}</p>
                
                {free.skills && (
                  <div className="home-project-skills" style={{ justifyContent: 'center' }}>
                    {free.skills.split(',').slice(0, 3).map((skill, i) => (
                      <span key={i} className="home-skill-tag">{skill.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="home-freelancer-rating">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span>{parseFloat(free.avg_rating).toFixed(1)}</span>
                  <span className="home-freelancer-reviews">({free.review_count} reviews)</span>
                </div>

                <button className="home-btn-small" onClick={() => user ? navigate(`/freelancers`) : navigate('/login')}>
                  View Profile <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="home-footer">
        <div className="home-footer-grid">
          <div className="home-footer-col">
            <div className="home-logo" style={{ marginBottom: '15px' }}>
              <div className="home-logo-icon" style={{ width: '30px', height: '30px', fontSize: '15px' }}>H</div>
              <span style={{ fontWeight: '800', fontSize: '18px', color: '#fff' }}>HunarConnect</span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#94a3b8' }}>
              Premium marketplace connecting global businesses with top-tier freelance professionals.
            </p>
          </div>

          <div className="home-footer-col">
            <h4>For Clients</h4>
            <a onClick={() => user ? navigate('/post-job') : navigate('/login')}>Post a Project</a>
            <a onClick={() => scrollToSection('find-freelancers')}>Find Talent</a>
            <a>Enterprise Solutions</a>
          </div>

          <div className="home-footer-col">
            <h4>For Freelancers</h4>
            <a onClick={() => scrollToSection('find-work')}>Find Work</a>
            <a onClick={() => user ? navigate('/profile') : navigate('/register')}>Create Portfolio</a>
            <a>HunarConnect Academy</a>
          </div>

          <div className="home-footer-col">
            <h4>Safety & Support</h4>
            <a><Shield size={12} style={{ color: '#10b981' }} /> Escrow Protection</a>
            <a><Globe size={12} /> 24/7 Helpline</a>
            <a><HelpCircle size={12} /> FAQs</a>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>© 2026 HunarConnect. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ INLINE RESPONSIVE CSS ═══════════════════ */}
      <style>{homeStyles}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ALL CSS STYLES (FULLY RESPONSIVE)
   ═══════════════════════════════════════════ */
const homeStyles = `
/* ── HEADER ── */
.home-header {
  position: sticky; top: 0; background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03); z-index: 100;
}
.home-header-inner {
  max-width: 1280px; margin: 0 auto; height: 75px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 5%;
}
.home-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.home-logo-icon {
  background: linear-gradient(135deg, #1d8cf8, #1155cc);
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 20px;
}
.home-logo-text {
  font-family: var(--font-heading); font-weight: 800; font-size: 22px;
  color: #1e293b; letter-spacing: -0.03em;
}

.home-nav-links { display: flex; gap: 30px; }
.home-nav-links a {
  color: #475569; font-weight: 500; font-size: 15px;
  text-decoration: none; cursor: pointer; transition: color 0.2s;
  position: relative; padding-bottom: 4px;
}
.home-nav-links a.active { color: #1d8cf8; font-weight: 600; }
.home-nav-links a.active::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
  height: 2px; background: #1d8cf8; border-radius: 2px;
}
.home-nav-links a:hover { color: #1d8cf8; }

.home-nav-actions { display: flex; align-items: center; gap: 12px; }
.home-btn-login {
  background: transparent; color: #1d8cf8; border: 2px solid #1d8cf8;
  padding: 9px 22px; border-radius: 25px; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.3s ease; font-family: var(--font-heading);
  letter-spacing: 0.01em;
}
.home-btn-login:hover {
  background: #1d8cf8; color: #fff;
  box-shadow: 0 4px 14px rgba(29, 140, 248, 0.3);
  transform: translateY(-1px);
}
.home-btn-signup {
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none;
  padding: 10px 24px; border-radius: 25px; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.3s ease; font-family: var(--font-heading);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); letter-spacing: 0.01em;
}
.home-btn-signup:hover {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}
.home-nav-user { color: #475569; font-weight: 500; font-size: 14px; }

.home-btn-primary {
  background: linear-gradient(135deg, #1d8cf8, #1155cc); color: #fff; border: none;
  padding: 10px 22px; border-radius: 25px; font-weight: 600; font-size: 14px;
  cursor: pointer; box-shadow: 0 4px 10px rgba(29,140,248,0.2); transition: transform 0.2s, box-shadow 0.2s;
}
.home-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(29,140,248,0.3); }
.home-btn-outline {
  background: transparent; color: #475569; border: 1px solid #e2e8f0;
  padding: 8px 18px; border-radius: 25px; font-weight: 500; font-size: 14px;
  cursor: pointer; transition: all 0.2s;
}
.home-btn-outline:hover { border-color: #1d8cf8; color: #1d8cf8; }
.home-btn-small {
  display: inline-flex; align-items: center; gap: 5px;
  background: linear-gradient(135deg, #1d8cf8, #1155cc); color: #fff; border: none;
  padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: transform 0.2s;
}
.home-btn-small:hover { transform: translateY(-1px); }

.home-hamburger { display: none; background: none; border: none; cursor: pointer; color: #1e293b; }
.home-mobile-menu {
  display: none; flex-direction: column; gap: 12px; padding: 20px 5%;
  border-top: 1px solid #f1f5f9; background: #fff;
}
.home-mobile-menu a { color: #475569; font-size: 15px; cursor: pointer; text-decoration: none; }
.home-mobile-menu a:hover { color: #1d8cf8; }

/* ── HERO ── */
.home-hero {
  max-width: 1280px; margin: 0 auto; padding: 80px 5%;
  display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center;
}
.home-hero-title {
  font-family: var(--font-heading); font-size: 48px; font-weight: 800;
  color: #1e293b; line-height: 1.15; letter-spacing: -0.02em;
}
.home-hero-subtitle { font-size: 18px; color: #64748b; line-height: 1.6; max-width: 520px; margin-top: 15px; }
.home-hero-searchbar {
  display: flex; align-items: center; gap: 0;
  margin-top: 25px; max-width: 550px;
}
.home-hero-hire-btn {
  background: #1d8cf8; color: #fff; border: none;
  padding: 14px 32px; border-radius: 8px; font-weight: 600;
  font-size: 16px; cursor: pointer; white-space: nowrap; transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(29, 140, 248, 0.3);
}
.home-hero-hire-btn:hover { 
  background: #1673d4; 
  box-shadow: 0 6px 16px rgba(29, 140, 248, 0.4);
  transform: translateY(-2px);
}
.home-hero-search-input {
  border: none !important; background: transparent !important; padding: 10px 15px !important;
  width: 100%; color: #1e293b; font-size: 14px; outline: none;
  box-shadow: none !important;
}
.home-hero-search-icon-btn {
  background: #1d8cf8; color: #fff; border: none;
  width: 40px; height: 40px; border-radius: 50%; min-width: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.home-hero-img { width: 100%; max-width: 480px; height: auto; border-radius: 20px; }
.home-hero-right { display: flex; justify-content: center; }

/* ── STEPS ── */
.home-steps { padding: 50px 5%; background: #fff; border-top: 1px solid #f1f5f9; }
.home-steps-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px; max-width: 1100px; margin: 0 auto;
}
.home-step-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
.home-step-icon {
  width: 65px; height: 65px; border-radius: 50%;
  background: #e6f3ff; display: flex; align-items: center;
  justify-content: center; color: #1d8cf8;
}
.home-step-card h3 { font-size: 18px; font-weight: 700; color: #1e293b; }
.home-step-card p { font-size: 14px; color: #64748b; max-width: 250px; line-height: 1.5; }

/* ── STATS ── */
.home-stats-bar { background: linear-gradient(135deg, #1d8cf8, #1155cc); padding: 40px 5%; }
.home-stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 20px; max-width: 1100px; margin: 0 auto; text-align: center;
}
.home-stat-number { font-size: 36px; font-weight: 800; color: #fff; font-family: var(--font-heading); }
.home-stat-label { font-size: 14px; color: rgba(255,255,255,0.75); margin-top: 4px; }

/* ── SECTIONS ── */
.home-section { padding: 60px 5%; max-width: 1280px; margin: 0 auto; }
.home-section-alt { background: #fff; max-width: 100%; }
.home-section-alt > * { max-width: 1280px; margin-left: auto; margin-right: auto; }
.home-section-header { text-align: center; margin-bottom: 40px; }
.home-section-header h2 {
  font-size: 28px; font-weight: 700; color: #1e293b;
  display: flex; align-items: center; justify-content: center;
}
.home-section-header p { font-size: 16px; color: #64748b; margin-top: 8px; }

.home-empty-state {
  text-align: center; padding: 40px 20px; background: #fff;
  border-radius: 12px; border: 1px dashed #e2e8f0;
  display: flex; flex-direction: column; align-items: center; gap: 15px;
}
.home-empty-state p { color: #64748b; font-size: 15px; }

/* ── PROJECT CARDS ── */
.home-projects-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;
}
.home-project-card {
  background: #fff; border-radius: 14px; padding: 24px;
  border: 1px solid #e2e8f0; transition: all 0.3s;
  display: flex; flex-direction: column; gap: 12px;
}
.home-project-card:hover { border-color: #1d8cf8; box-shadow: 0 8px 24px rgba(29,140,248,0.08); transform: translateY(-2px); }
.home-project-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.home-project-card-top h3 { font-size: 17px; font-weight: 600; color: #1e293b; }
.home-project-budget {
  display: flex; align-items: center; gap: 3px; background: #ecfdf5;
  color: #059669; padding: 5px 10px; border-radius: 8px; font-weight: 700;
  font-size: 14px; white-space: nowrap;
}
.home-project-desc {
  font-size: 14px; color: #64748b; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.home-project-skills { display: flex; flex-wrap: wrap; gap: 6px; }
.home-skill-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px;
  border-radius: 6px; font-size: 11px; color: #475569;
}
.home-project-card-bottom {
  display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
  padding-top: 12px; border-top: 1px solid #f1f5f9; margin-top: auto;
}
.home-project-meta { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
.home-project-card-bottom .home-btn-small { margin-left: auto; }

/* ── FREELANCER CARDS ── */
.home-freelancers-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; padding: 0 5%;
}
.home-freelancer-card {
  background: #f8fafc; border-radius: 14px; padding: 28px 24px;
  border: 1px solid #e2e8f0; text-align: center; transition: all 0.3s;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.home-freelancer-card:hover { border-color: #1d8cf8; box-shadow: 0 8px 24px rgba(29,140,248,0.08); transform: translateY(-2px); }
.home-freelancer-avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #1d8cf8, #1155cc);
  color: #fff; font-size: 24px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.home-freelancer-card h3 { font-size: 17px; font-weight: 600; color: #1e293b; }
.home-freelancer-rate {
  display: flex; align-items: center; gap: 3px; color: #059669;
  font-weight: 600; font-size: 14px;
}
.home-freelancer-bio {
  font-size: 13px; color: #64748b; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.home-freelancer-rating { display: flex; align-items: center; gap: 4px; font-size: 14px; color: #1e293b; font-weight: 600; }
.home-freelancer-reviews { font-weight: 400; color: #94a3b8; font-size: 12px; }

/* ── FOOTER ── */
.home-footer { background: #0f172a; color: #94a3b8; padding: 60px 5% 20px; }
.home-footer-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 40px; max-width: 1200px; margin: 0 auto 50px;
}
.home-footer-col { display: flex; flex-direction: column; gap: 10px; }
.home-footer-col h4 { color: #fff; font-size: 15px; font-weight: 600; margin-bottom: 5px; }
.home-footer-col a {
  font-size: 13px; cursor: pointer; text-decoration: none; color: #94a3b8;
  display: flex; align-items: center; gap: 6px; transition: color 0.2s;
}
.home-footer-col a:hover { color: #e2e8f0; }
.home-footer-bottom {
  border-top: 1px solid #1e293b; padding-top: 20px;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 10px; max-width: 1200px; margin: 0 auto; font-size: 12px;
}
.home-footer-bottom a { color: #94a3b8; cursor: pointer; text-decoration: none; }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: fadeInOverlay 0.25s ease;
}
@keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
.modal-content {
  background: #fff; border-radius: 18px; padding: 35px;
  width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto;
  position: relative; box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.modal-close {
  position: absolute; top: 16px; right: 16px; background: #f1f5f9;
  border: none; border-radius: 50%; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #475569; transition: all 0.2s;
}
.modal-close:hover { background: #e2e8f0; }

.social-login-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 12px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: #fff;
  font-size: 14px; font-weight: 500; color: #1e293b;
  cursor: pointer; transition: all 0.2s;
}
.social-login-btn:hover { background: #f8fafc; border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.modal-field { margin-bottom: 16px; }
.modal-field label { display: block; font-size: 13px; color: #475569; margin-bottom: 6px; font-weight: 500; }
.modal-input-wrap {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 14px;
  transition: border-color 0.2s;
}
.modal-input-wrap:focus-within { border-color: #1d8cf8; box-shadow: 0 0 0 3px rgba(29,140,248,0.1); }
.modal-input-wrap input {
  border: none !important; background: transparent !important; padding: 12px 0 !important;
  width: 100%; font-size: 14px; color: #1e293b; outline: none; box-shadow: none !important;
}
.modal-role-picker { display: flex; gap: 12px; }
.modal-role-option {
  flex: 1; padding: 14px; border-radius: 10px;
  border: 2px solid #e2e8f0; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 500; color: #64748b; transition: all 0.2s;
}
.modal-role-option:hover { border-color: #cbd5e1; }
.selected-freelancer { border-color: #06b6d4 !important; background: #ecfeff; color: #0891b2 !important; }
.selected-client { border-color: #1d8cf8 !important; background: #eff6ff; color: #1d8cf8 !important; }

.modal-submit-btn {
  width: 100%; padding: 13px; border-radius: 12px;
  background: linear-gradient(135deg, #1d8cf8, #1155cc);
  color: #fff; border: none; font-size: 15px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s; margin-top: 5px;
}
.modal-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(29,140,248,0.3); }
.modal-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* ════════ RESPONSIVE ════════ */
@media (max-width: 1024px) {
  .home-hero { grid-template-columns: 1fr; text-align: center; padding: 60px 5%; }
  .home-hero-left { display: flex; flex-direction: column; align-items: center; }
  .home-hero-subtitle { max-width: 100%; }
  .home-hero-searchbar { max-width: 100%; }
  .home-hero-img { max-width: 380px; }
  .home-stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .home-nav-links { display: none; }
  .home-nav-actions { display: none; }
  .home-hamburger { display: block; }
  .home-mobile-menu { display: flex; }

  .home-hero-title { font-size: 32px; }
  .home-hero-subtitle { font-size: 15px; }
  .home-hero-searchbar { flex-direction: row; gap: 0; max-width: 100%; }
  .home-hero-hire-btn { width: 100%; border-radius: 8px; padding: 12px 20px; }
  .home-hero-img { max-width: 280px; }

  .home-section-header h2 { font-size: 22px; }
  .home-projects-grid { grid-template-columns: 1fr; }
  .home-freelancers-grid { grid-template-columns: 1fr; padding: 0; }
  .home-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
  .home-stat-number { font-size: 28px; }
  .home-footer-grid { grid-template-columns: 1fr 1fr; }
  .home-footer-bottom { flex-direction: column; text-align: center; }

  .modal-content { padding: 25px; border-radius: 14px; }
}

@media (max-width: 480px) {
  .home-header-inner { padding: 0 4%; }
  .home-hero { padding: 40px 4%; }
  .home-hero-title { font-size: 26px; }
  .home-stats-grid { grid-template-columns: 1fr 1fr; }
  .home-stat-number { font-size: 24px; }
  .home-steps-grid { grid-template-columns: 1fr; gap: 30px; }
  .home-footer-grid { grid-template-columns: 1fr; }
  .modal-role-picker { flex-direction: column; }
}
`;
