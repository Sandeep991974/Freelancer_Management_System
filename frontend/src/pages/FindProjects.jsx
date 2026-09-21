import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, DollarSign, Calendar, Tag, ArrowRight, Briefcase, Filter } from 'lucide-react';

export default function FindProjects() {
  const { token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [expLevel, setExpLevel] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOpenProjects();
  }, [token]);

  const fetchOpenProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch jobs.');
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    // 1. Text Search Query (Title / Description)
    const textQuery = searchQuery.toLowerCase();
    const matchesText = !textQuery ||
      project.title.toLowerCase().includes(textQuery) ||
      project.description.toLowerCase().includes(textQuery);

    // 2. Category Filter
    const catQuery = category.toLowerCase();
    const matchesCategory = !category || (project.category && project.category.toLowerCase().includes(catQuery));

    // 3. Budget Range Filter
    const budgetVal = parseFloat(project.budget);
    const matchesMinBudget = !minBudget || budgetVal >= parseFloat(minBudget);
    const matchesMaxBudget = !maxBudget || budgetVal <= parseFloat(maxBudget);

    // 4. Experience Level Filter
    const matchesExp = !expLevel || project.experience_level === expLevel;

    // 5. Skill Search Filter
    const skillQuery = skillSearch.toLowerCase();
    const matchesSkills = !skillSearch || (project.skills_required && project.skills_required.toLowerCase().includes(skillQuery));

    return matchesText && matchesCategory && matchesMinBudget && matchesMaxBudget && matchesExp && matchesSkills;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
        Loading active projects...
      </div>
    );
  }

  return (
    <div className="animated-fade">
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '5px' }}>Find Work</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Browse and apply to projects that match your expertise.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Search & Filter Panel */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '15px',
        marginBottom: '35px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Core Search inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description..."
              style={{ paddingLeft: '45px', border: 'none', background: 'var(--bg-primary)' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Tag size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Filter by skill tag (e.g. React)..."
              style={{ paddingLeft: '45px', border: 'none', background: 'var(--bg-primary)' }}
            />
          </div>
        </div>

        {/* Detailed Filters row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Development"
              style={{ border: 'none', background: 'var(--bg-primary)', height: '38px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Experience Level</label>
            <select
              value={expLevel}
              onChange={e => setExpLevel(e.target.value)}
              style={{ background: 'var(--bg-primary)', height: '38px', fontSize: '13px' }}
            >
              <option value="">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Min Budget ($)</label>
            <input
              type="number"
              value={minBudget}
              onChange={e => setMinBudget(e.target.value)}
              placeholder="Min budget"
              style={{ border: 'none', background: 'var(--bg-primary)', height: '38px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Max Budget ($)</label>
            <input
              type="number"
              value={maxBudget}
              onChange={e => setMaxBudget(e.target.value)}
              placeholder="Max budget"
              style={{ border: 'none', background: 'var(--bg-primary)', height: '38px' }}
            />
          </div>
        </div>
      </div>

      {/* Job Postings Grid */}
      <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Available Contracts ({filteredProjects.length})</h2>
      {filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: '15px' }} />
          <div>No matching jobs found. Try adjusting your search filters.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredProjects.map((project) => (
            <div key={project.id} className="glass-panel" style={{
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--glass-border)',
              transition: 'var(--transition)',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: '600', marginBottom: '6px' }}>{project.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Posted by <strong style={{ color: 'var(--accent-secondary)' }}>{project.client_name}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px' }}>
                  <DollarSign size={16} />
                  <span>{parseFloat(project.budget).toLocaleString()}</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                {project.description}
              </p>

              {project.skills_required && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.skills_required.split(',').map((skill, index) => (
                    <span key={index} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <Tag size={10} color="var(--accent-primary)" />
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                <Link to={`/projects/${project.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  <span>View Details & Bid</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
