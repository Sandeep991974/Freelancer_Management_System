import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';
import { ArrowLeft, DollarSign, Calendar, Clock, Tag, MessageSquare, Clipboard, UploadCloud, Check, Star, Play, Pause, XCircle, Trash2, Edit3, Video, Plus, CheckCircle, ShieldAlert } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [hiredFreelancer, setHiredFreelancer] = useState(null);
  const [bids, setBids] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [payment, setPayment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [shortlistedBids, setShortlistedBids] = useState(new Set());
  const [milestones, setMilestones] = useState([]);

  // Project Edit Form
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSkills, setEditSkills] = useState('');

  // Milestone Form
  const [mTitle, setMTitle] = useState('');
  const [mAmount, setMAmount] = useState('');
  const [mDesc, setMDesc] = useState('');

  // Form states for bidding
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [isEditingBid, setIsEditingBid] = useState(false);

  // Work Submission Form
  const [workDesc, setWorkDesc] = useState('');
  const [workFile, setWorkFile] = useState(null);

  // Review Form
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id, token]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const resProj = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProj = await resProj.json();
      if (!resProj.ok) throw new Error(dataProj.error || 'Failed to load project details.');

      setProject(dataProj.project);
      setHiredFreelancer(dataProj.hiredFreelancer);
      setMilestones(dataProj.milestones || []);

      // Pre-fill edit inputs
      setEditTitle(dataProj.project.title);
      setEditDescription(dataProj.project.description);
      setEditBudget(dataProj.project.budget);
      setEditCategory(dataProj.project.category || '');
      setEditSkills(dataProj.project.skills_required || '');

      // Fetch Bids if open
      if (dataProj.project.status === 'open') {
        const resBids = await fetch(`http://localhost:5000/api/bids/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataBids = await resBids.json();
        if (resBids.ok) {
          setBids(dataBids);
          // Set shortlisted bids
          const shortlist = new Set(dataBids.filter(b => b.status === 'shortlisted').map(b => b.id));
          setShortlistedBids(shortlist);
        }
      }

      // Fetch Submissions and escrow payment if not open
      if (dataProj.project.status !== 'open') {
        const resSubs = await fetch(`http://localhost:5000/api/submissions/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataSubs = await resSubs.json();
        if (resSubs.ok) setSubmissions(dataSubs);

        const resPay = await fetch(`http://localhost:5000/api/payments/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataPay = await resPay.json();
        if (resPay.ok) setPayment(dataPay);
      }

      // Fetch reviews if completed
      if (dataProj.project.status === 'completed') {
        const resRev = await fetch(`http://localhost:5000/api/reviews/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataRev = await resRev.json();
        if (resRev.ok) setReviews(dataRev);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          budget: parseFloat(editBudget),
          category: editCategory,
          skills_required: editSkills
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setIsEditingProject(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProjectStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to set the project status to ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This is irreversible.')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/projects/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId: id, title: mTitle, description: mDesc, amount: parseFloat(mAmount) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMTitle('');
      setMAmount('');
      setMDesc('');
      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/projects/milestones/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ milestoneId, status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          project_id: id,
          bid_amount: parseFloat(bidAmount),
          proposal: bidProposal,
          delivery_days: parseInt(bidDays)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBid = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const myBid = bids.find(b => b.freelancer_id === user.id);
      if (!myBid) return;

      const response = await fetch(`http://localhost:5000/api/bids/${myBid.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          bid_amount: parseFloat(bidAmount),
          proposal: bidProposal,
          delivery_days: parseInt(bidDays)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setIsEditingBid(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawBid = async () => {
    if (!window.confirm('Are you sure you want to withdraw your bid?')) return;
    setActionLoading(true);
    try {
      const myBid = bids.find(b => b.freelancer_id === user.id);
      if (!myBid) return;

      const response = await fetch(`http://localhost:5000/api/bids/${myBid.id}/withdraw`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to hire this freelancer? This will start the contract.')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/bids/${bidId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bids/${bidId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShortlistBid = async (bidId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bids/${bidId}/shortlist`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleWorkDelivery = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('project_id', id);
      formData.append('work_description', workDesc);
      if (workFile) {
        formData.append('file', workFile);
      }

      const response = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setWorkDesc('');
      setWorkFile(null);
      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWork = async (subId) => {
    if (!window.confirm('Approve this delivery? This will mark the project as Completed.')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${subId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'approved' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWork = async (subId) => {
    if (!window.confirm('Are you sure you want to request revisions on this delivery?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${subId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!window.confirm('Release escrow funds to the freelancer? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/release/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const revieweeId = user.role === 'client' ? hiredFreelancer?.freelancer_id : project?.client_id;
    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ project_id: id, reviewee_id: revieweeId, rating, comment: reviewComment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setReviewComment('');
      fetchProjectDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerVideoCall = () => {
    const mockMeetUrl = `https://meet.google.com/${Math.random().toString(36).substring(2,5)}-${Math.random().toString(36).substring(2,6)}-${Math.random().toString(36).substring(2,5)}`;
    window.open(mockMeetUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
        Loading project details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'var(--danger)', padding: '20px', textAlign: 'center' }}>
        <h3>Error: {error}</h3>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '10px' }}>Back Dashboard</button>
      </div>
    );
  }

  const oppositeUser = user.role === 'client' 
    ? { id: hiredFreelancer?.freelancer_id, name: hiredFreelancer?.freelancer_name }
    : { id: project.client_id, name: project.client_name };

  const hasBidded = bids.some(b => b.freelancer_id === user.id);
  const myBid = bids.find(b => b.freelancer_id === user.id);

  // Compute Milestones progress
  const totalMilestones = milestones.length;
  const releasedMilestones = milestones.filter(m => m.status === 'released').length;
  const milestoneProgressPercent = totalMilestones > 0 ? Math.round((releasedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="animated-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
          <ArrowLeft size={14} />
          <span>Back Workspace</span>
        </button>

        {user.role === 'client' && project.client_id === user.id && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditingProject(!isEditingProject)} className="btn btn-secondary" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <Edit3 size={14} /> Edit Project
            </button>
            {project.status === 'open' && (
              <button onClick={() => handleUpdateProjectStatus('paused')} className="btn btn-secondary" style={{ color: 'var(--warning)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Pause size={14} /> Pause Project
              </button>
            )}
            {project.status === 'paused' && (
              <button onClick={() => handleUpdateProjectStatus('open')} className="btn btn-secondary" style={{ color: 'var(--success)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Play size={14} /> Resume Project
              </button>
            )}
            {(project.status === 'open' || project.status === 'paused') && (
              <>
                <button onClick={() => handleUpdateProjectStatus('closed')} className="btn btn-secondary" style={{ color: 'var(--danger)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <XCircle size={14} /> Close Project
                </button>
                <button onClick={handleDeleteProject} className="btn btn-secondary" style={{ color: 'var(--danger)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <Trash2 size={14} /> Delete Project
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditingProject && (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Edit Project Details</h2>
          <form onSubmit={handleEditProject}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Project Title</label>
              <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Budget ($)</label>
                <input type="number" required value={editBudget} onChange={e => setEditBudget(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Category</label>
                <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Required Skills</label>
              <input type="text" value={editSkills} onChange={e => setEditSkills(e.target.value)} placeholder="React, Node.js" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Scope/Description</label>
              <textarea rows={4} required value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" onClick={() => setIsEditingProject(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Layout: Left is details & actions, Right is Chat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: project.status !== 'open' ? '1.7fr 1.3fr' : '1fr',
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Panel: Project Meta & Work management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Core Info Panel */}
          <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
              <div>
                <span className={`badge badge-${project.status}`} style={{ marginBottom: '8px', marginRight: '6px' }}>
                  {project.status === 'in_progress' ? 'Contract Active' : project.status.toUpperCase()}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{project.title}</h1>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                  <DollarSign size={20} />
                  <span>{parseFloat(project.budget).toLocaleString()}</span>
                </div>
                {user.id !== project.client_id && (
                  <button 
                    onClick={async () => {
                      const reason = window.prompt("Enter the reason for reporting this project:");
                      if (!reason) return;
                      try {
                        const res = await fetch('http://localhost:5000/api/admin/reports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ targetType: 'project', targetId: id, reason })
                        });
                        if (res.ok) alert('Report submitted successfully.');
                      } catch(e) {
                        alert('Failed to report.');
                      }
                    }} 
                    style={{ fontSize: '11px', padding: '3px 8px', background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🚩 Report Job
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Posted by: <strong style={{ color: '#fff' }}>{project.client_name}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {new Date(project.created_at).toLocaleDateString()}
              </span>
              {hiredFreelancer && (
                <>
                  <span>•</span>
                  <span>Hired Freelancer: <strong style={{ color: 'var(--accent-secondary)' }}>{hiredFreelancer.freelancer_name}</strong></span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
              {project.category && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Tag size={14} />
                  <span>Category: <strong style={{ color: '#fff' }}>{project.category}</strong></span>
                </div>
              )}
              {project.experience_level && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Star size={14} />
                  <span>Experience: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{project.experience_level}</strong></span>
                </div>
              )}
              {project.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Clock size={14} />
                  <span>Deadline: <strong style={{ color: '#fff' }}>{new Date(project.deadline).toLocaleDateString()}</strong></span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Job Scope & Description</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {project.description}
            </p>

            {project.skills_required && (
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.skills_required.split(',').map((skill, i) => (
                    <span key={i} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', cursor: 'default' }}>
                      <Tag size={12} color="var(--accent-secondary)" />
                      <span>{skill.trim()}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MILSTONES TRACKING & PROGRESS BAR (Visible during active contract) */}
          {project.status !== 'open' && (
            <div className="glass-panel" style={{ padding: '30px', borderRadius: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '18px' }}>Project Milestones Tracker</h3>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{milestoneProgressPercent}% Released</span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '25px' }}>
                <div style={{ width: `${milestoneProgressPercent}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.4s ease' }} />
              </div>

              {/* Milestones list */}
              {milestones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No milestones created yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  {milestones.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{m.title}</div>
                        {m.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.description}</div>}
                        <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '600', marginTop: '4px' }}>${m.amount}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                          background: m.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : m.status === 'funded' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: m.status === 'pending' ? 'var(--warning)' : m.status === 'funded' ? 'var(--accent-primary)' : 'var(--success)'
                        }}>
                          {m.status.toUpperCase()}
                        </span>
                        
                        {user.role === 'client' && m.status === 'pending' && (
                          <button onClick={() => handleUpdateMilestoneStatus(m.id, 'funded')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                            Fund Escrow
                          </button>
                        )}
                        {user.role === 'client' && m.status === 'funded' && (
                          <button onClick={() => handleUpdateMilestoneStatus(m.id, 'released')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--success)' }}>
                            Release Funds
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Milestone Form (Client only) */}
              {user.role === 'client' && project.status === 'in_progress' && (
                <form onSubmit={handleAddMilestone} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Create New Milestone</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '15px', marginBottom: '10px' }}>
                    <input type="text" required placeholder="Milestone Title (e.g. Design Handout)" value={mTitle} onChange={e => setMTitle(e.target.value)} />
                    <input type="number" required placeholder="Amount ($)" value={mAmount} onChange={e => setMAmount(e.target.value)} />
                  </div>
                  <input type="text" placeholder="Description (Optional)" value={mDesc} onChange={e => setMDesc(e.target.value)} style={{ marginBottom: '12px' }} />
                  <button type="submit" className="btn btn-secondary" style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '36px' }}>
                    <Plus size={14} /> Add Milestone
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Action Area for STATUS: OPEN */}
          {project.status === 'open' && (
            <div>
              {/* FREELANCER VIEW: BID PLACEMENT */}
              {user.role === 'freelancer' && (
                <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clipboard size={18} color="var(--accent-secondary)" />
                    <span>Submit Your Bid Proposal</span>
                  </h3>

                  {hasBidded ? (
                    <div style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid var(--glass-border)',
                      padding: '20px',
                      borderRadius: '10px'
                    }}>
                      {isEditingBid ? (
                        <form onSubmit={handleUpdateBid}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bid Price ($)</label>
                              <input type="number" required min={1} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Price for project" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Delivery Estimate (Days)</label>
                              <input type="number" required min={1} value={bidDays} onChange={(e) => setBidDays(e.target.value)} placeholder="e.g. 5" />
                            </div>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Proposal Pitch</label>
                            <textarea required rows={4} value={bidProposal} onChange={(e) => setBidProposal(e.target.value)} placeholder="Describe why you are the best fit for this project..." />
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ flex: 1 }}>
                              {actionLoading ? 'Updating...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setIsEditingBid(false)} disabled={actionLoading} className="btn btn-secondary" style={{ flex: 1 }}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Bid Status:</span>
                            <span className={`badge badge-${myBid.status}`}>{myBid.status}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your Bid Price:</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>${myBid.bid_amount}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Est. Delivery:</span>
                            <span style={{ fontWeight: 'bold' }}>{myBid.delivery_days} days</span>
                          </div>
                          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '15px', marginBottom: '15px' }}>
                            <span style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Your Proposal Description:</span>
                            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)' }}>"{myBid.proposal}"</p>
                          </div>
                          {myBid.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <button onClick={() => {
                                setBidAmount(myBid.bid_amount);
                                setBidDays(myBid.delivery_days);
                                setBidProposal(myBid.proposal);
                                setIsEditingBid(true);
                              }} className="btn btn-secondary" style={{ flex: 1, padding: '8px' }}>
                                Edit Bid
                              </button>
                              <button onClick={handleWithdrawBid} disabled={actionLoading} className="btn btn-secondary" style={{ flex: 1, padding: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                Withdraw Bid
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handlePlaceBid}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bid Price ($)</label>
                          <input type="number" required min={1} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Price for project" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Delivery Estimate (Days)</label>
                          <input type="number" required min={1} value={bidDays} onChange={(e) => setBidDays(e.target.value)} placeholder="e.g. 5" />
                        </div>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Proposal Pitch</label>
                        <textarea required rows={4} value={bidProposal} onChange={(e) => setBidProposal(e.target.value)} placeholder="Describe why you are the best fit for this project..." />
                      </div>
                      <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ width: '100%' }}>
                        {actionLoading ? 'Submitting Bid...' : 'Submit Bid Proposal'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* CLIENT VIEW: BID LISTS */}
              {user.role === 'client' && (
                <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Submitted Bids ({bids.length})</h3>
                  {bids.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                      No bids received yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {bids.map((bid) => (
                        <div key={bid.id} style={{
                          border: '1px solid var(--glass-border)',
                          borderRadius: '10px',
                          padding: '20px',
                          background: 'rgba(255,255,255,0.01)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '15px' }}>{bid.freelancer_name}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Skills: {bid.freelancer_skills || 'None'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '16px', display: 'block' }}>${bid.bid_amount}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>in {bid.delivery_days} days</span>
                            </div>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '10px 0 15px 0', whiteSpace: 'pre-wrap' }}>
                            {bid.proposal}
                          </p>
                          
                          {bid.status === 'pending' || bid.status === 'shortlisted' ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                onClick={() => handleShortlistBid(bid.id)}
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px', borderColor: bid.status === 'shortlisted' ? 'var(--accent-secondary)' : 'var(--glass-border)', color: bid.status === 'shortlisted' ? 'var(--accent-secondary)' : 'var(--text-primary)' }}
                              >
                                {bid.status === 'shortlisted' ? '★ Shortlisted' : '☆ Shortlist'}
                              </button>
                              <button onClick={() => handleRejectBid(bid.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                Reject
                              </button>
                              <button onClick={() => handleAcceptBid(bid.id)} disabled={actionLoading} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                                Hire & Accept Bid
                              </button>
                            </div>
                          ) : (
                            <span style={{ float: 'right' }} className={`badge badge-${bid.status}`}>Bid {bid.status}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Area for STATUS: IN PROGRESS */}
          {project.status === 'in_progress' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* FREELANCER VIEW: SUBMIT WORK DELIVERY */}
              {user.role === 'freelancer' && (
                <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={20} color="var(--accent-secondary)" />
                    <span>Deliver Work to Client</span>
                  </h3>
                  <form onSubmit={handleWorkDelivery}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Submission Notes</label>
                      <textarea required rows={3} value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} placeholder="Provide delivery details, source code links, or instructions..." />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Attach Files (Optional)</label>
                      <input type="file" onChange={(e) => setWorkFile(e.target.files[0])} />
                    </div>
                    <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ width: '100%' }}>
                      {actionLoading ? 'Uploading Work...' : 'Deliver Work'}
                    </button>
                  </form>
                </div>
              )}

              {/* SHARED VIEW: VIEW SUBMISSIONS LOG */}
              <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Work Submissions ({submissions.length})</h3>
                {submissions.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '15px' }}>
                    No work has been submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {submissions.map((sub) => (
                      <div key={sub.id} style={{
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '18px',
                        background: 'rgba(255,255,255,0.01)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Delivered {new Date(sub.created_at).toLocaleDateString()}</span>
                          <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          {sub.work_description}
                        </p>
                        
                        {sub.file_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <a href={`http://localhost:5000${sub.file_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', gap: '6px' }}>
                              <span>Download Delivery Files</span>
                            </a>
                          </div>
                        )}

                        {/* Client Actions */}
                        {user.role === 'client' && sub.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleRejectWork(sub.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }}>
                              Request Revision
                            </button>
                            <button onClick={() => handleApproveWork(sub.id)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px', display: 'flex', gap: '5px' }}>
                              <Check size={12} />
                              <span>Approve Delivery</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Area for STATUS: COMPLETED */}
          {project.status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* ESCROW PAYMENT SCREEN */}
              {payment && (
                <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={20} color="var(--accent-secondary)" />
                    <span>Project Escrow Financials</span>
                  </h3>
                  
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Escrow Funds Locked</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>${payment.amount}</div>
                    </div>
                    <div>
                      {payment.payment_status === 'pending' ? (
                        user.role === 'client' ? (
                          <button onClick={handleReleasePayment} disabled={actionLoading} className="btn btn-primary">
                            Release Funds to Freelancer
                          </button>
                        ) : (
                          <div style={{ color: 'var(--warning)', fontSize: '14px', fontWeight: '600' }}>
                            Awaiting Escrow Release by Client
                          </div>
                        )
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 'bold' }}>
                          <Check size={16} />
                          <span>Escrow Paid Out</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MUTUAL REVIEW & FEEDBACK SYSTEM */}
              {payment && payment.payment_status === 'completed' && (
                <div className="glass-panel" style={{ borderRadius: '15px', padding: '30px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} color="var(--warning)" />
                    <span>Feedback & Reviews</span>
                  </h3>

                  {/* Check if reviewer already reviewed */}
                  {reviews.some(r => r.reviewer_id === user.id) ? (
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>
                        You have submitted review feedback:
                      </div>
                      {reviews.filter(r => r.reviewer_id === user.id).map(r => (
                        <div key={r.id} style={{ padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--warning)', fontWeight: 'bold', marginBottom: '6px' }}>
                            <Star size={14} fill="var(--warning)" />
                            <span>{r.rating} stars</span>
                          </div>
                          <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            "{r.comment || 'No comment.'}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Rating
                        </label>
                        <select value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))} style={{ maxWidth: '150px' }}>
                          <option value={5}>5 Stars (Excellent)</option>
                          <option value={4}>4 Stars (Good)</option>
                          <option value={3}>3 Stars (Average)</option>
                          <option value={2}>2 Stars (Poor)</option>
                          <option value={1}>1 Star (Bad)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Review Comment
                        </label>
                        <textarea rows={3} required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience working together on this contract?" />
                      </div>
                      <button type="submit" disabled={actionLoading} className="btn btn-primary">
                        Submit Review
                      </button>
                    </form>
                  )}

                  {/* Display opposing party review if available */}
                  {reviews.length > 0 && (
                    <div style={{ marginTop: '25px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '15px' }}>All Contract Reviews</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {reviews.map((r) => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '13px' }}>{r.reviewer_name}</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({r.reviewer_role})</span>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.comment}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--warning)', height: 'fit-content' }}>
                              <Star size={12} fill="var(--warning)" />
                              <span style={{ fontSize: '12px' }}>{r.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Panel: REAL-TIME CHAT (Only for hired freelancer/client when in_progress or completed) */}
        {project.status !== 'open' && hiredFreelancer && (
          <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Need a call?</span>
              <button onClick={triggerVideoCall} className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '32px', padding: '0 12px', fontSize: '12px' }}>
                <Video size={14} /> Start Video Meeting
              </button>
            </div>
            
            <ChatWindow
              projectId={id}
              receiverId={oppositeUser.id}
              receiverName={oppositeUser.name}
            />
          </div>
        )}

      </div>
    </div>
  );
}
