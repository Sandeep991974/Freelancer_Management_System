import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function PortfolioManagement() {
  const { token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [projectLink, setProjectLink] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/portfolio/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, image_url: imageUrl, project_link: projectLink })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setProjectLink('');
        setAdding(false);
        fetchPortfolio();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/portfolio/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPortfolio();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading portfolio...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px' }}>Portfolio Projects</h3>
        <button className="btn btn-primary" onClick={() => setAdding(!adding)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAddProject} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', marginBottom: '20px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <h4 style={{ marginBottom: '15px' }}>New Portfolio Project</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Project Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Project Link URL</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input type="url" value={projectLink} onChange={e => setProjectLink(e.target.value)} style={{ paddingLeft: '35px' }} placeholder="https://" />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Image URL</label>
            <div style={{ position: 'relative' }}>
              <ImageIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ paddingLeft: '35px' }} placeholder="https://..." />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Description</label>
            <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Project</button>
          </div>
        </form>
      )}

      {projects.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          You have not added any projects to your portfolio yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {projects.map(p => (
            <div key={p.id} className="card glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {p.image_url ? (
                <div style={{ height: '140px', background: `url(${p.image_url}) center/cover no-repeat` }} />
              ) : (
                <div style={{ height: '140px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No Image
                </div>
              )}
              <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>{p.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, marginBottom: '15px' }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {p.project_link ? (
                    <a href={p.project_link} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <LinkIcon size={14} /> View Project
                    </a>
                  ) : <span />}
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
