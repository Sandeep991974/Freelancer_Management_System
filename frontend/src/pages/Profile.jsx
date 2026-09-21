import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, DollarSign, List, FileText, Star, ShieldCheck, MapPin, Phone, Link as LinkIcon, Briefcase, Building, Globe, CheckCircle } from 'lucide-react';
import PortfolioManagement from '../components/PortfolioManagement';

export default function Profile() {
  const { user, token, updateUser } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('basic');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    skills: user?.skills || '',
    bio: user?.bio || '',
    hourly_rate: user?.hourly_rate || '0.00',
    location: user?.location || '',
    contact_info: user?.contact_info || '',
    social_links: user?.social_links || '',
    title: user?.title || '',
    experience: user?.experience || '',
    education: user?.education || '',
    certifications: user?.certifications || '',
    company_name: user?.company_name || '',
    website: user?.website || '',
    industry: user?.industry || '',
    availability_status: user?.availability_status || 'available',
    languages: user?.languages || '',
  });

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 2FA Toggle State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        skills: user.skills || '',
        bio: user.bio || '',
        hourly_rate: user.hourly_rate || '0.00',
        location: user.location || '',
        contact_info: user.contact_info || '',
        social_links: user.social_links || '',
        title: user.title || '',
        experience: user.experience || '',
        education: user.education || '',
        certifications: user.certifications || '',
        company_name: user.company_name || '',
        website: user.website || '',
        industry: user.industry || '',
        availability_status: user.availability_status || 'available',
        languages: user.languages || '',
      });
      setTwoFactorEnabled(!!user.two_factor_enabled);
      
      if (user.role === 'freelancer') {
        fetchReviews();
      }
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/freelancers/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
        if (data.reviews && data.reviews.length > 0) {
          const sum = data.reviews.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating((sum / data.reviews.length).toFixed(1));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user reviews:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [profileFile, setProfileFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (profileFile) {
        formDataToSend.append('profile_photo', profileFile);
      }
      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      updateUser(data.user);
      setSuccess('Profile updated successfully!');
      setProfileFile(null);
      setResumeFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (e) => {
    const val = e.target.checked;
    setSuccess('');
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/toggle-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enable: val })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTwoFactorEnabled(val);
      updateUser({ two_factor_enabled: val });
      setSuccess(`2FA successfully ${val ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="animated-fade">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '5px' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your account, professional details, and portfolio.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px', alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div className="glass-panel" style={{ padding: '15px 10px', borderRadius: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button onClick={() => setActiveTab('basic')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'basic' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <User size={16} /> Basic Info
            </button>
            {user?.role === 'freelancer' && (
              <>
                <button onClick={() => setActiveTab('professional')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'professional' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Briefcase size={16} /> Professional
                </button>
                <button onClick={() => setActiveTab('portfolio')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'portfolio' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <FileText size={16} /> Portfolio
                </button>
                <button onClick={() => setActiveTab('reviews')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'reviews' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Star size={16} /> Reviews
                </button>
              </>
            )}
            {user?.role === 'client' && (
              <>
                <button onClick={() => setActiveTab('company')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'company' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Building size={16} /> Company Details
                </button>
              </>
            )}
            <button onClick={() => setActiveTab('security')} style={{ textAlign: 'left', padding: '10px 15px', background: activeTab === 'security' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <ShieldCheck size={16} /> Security & 2FA
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '15px' }}>
          {success && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              {success}
            </div>
          )}
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Basic Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="email" disabled value={user?.email || ''} style={{ paddingLeft: '45px', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ paddingLeft: '45px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Profile Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files[0])} style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Resume (PDF/DOC)</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', width: '100%' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Location / City</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="location" value={formData.location} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="New York, USA" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Contact Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="contact_info" value={formData.contact_info} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="+1 234 567 890" />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Social Links</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                  <textarea rows={2} name="social_links" value={formData.social_links} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="LinkedIn: https://..., Twitter: https://..."></textarea>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {activeTab === 'professional' && user?.role === 'freelancer' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Professional Details</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Professional Title</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="title" value={formData.title} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="e.g. Senior Frontend Developer" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Hourly Rate ($)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" name="hourly_rate" required min={0} step="0.01" value={formData.hourly_rate} onChange={handleChange} style={{ paddingLeft: '45px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Availability Status</label>
                  <select name="availability_status" value={formData.availability_status} onChange={handleChange}>
                    <option value="available">Available (Open to work)</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="busy">Busy (Full-time committed)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Languages</label>
                  <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Spanish, Hindi..." />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Skills (comma separated)</label>
                <div style={{ position: 'relative' }}>
                  <List size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" name="skills" value={formData.skills} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="React, Node.js, UI/UX" />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Professional Bio</label>
                <textarea rows={4} name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell clients about yourself..."></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Experience</label>
                  <textarea rows={3} name="experience" value={formData.experience} onChange={handleChange} placeholder="5 years at Google..."></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Education</label>
                  <textarea rows={3} name="education" value={formData.education} onChange={handleChange} placeholder="BS Computer Science..."></textarea>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Certifications</label>
                <textarea rows={3} name="certifications" value={formData.certifications} onChange={handleChange} placeholder="AWS Certified Solutions Architect, PMP..."></textarea>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {activeTab === 'company' && user?.role === 'client' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Company Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Company Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="Acme Corp" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Industry</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" name="industry" value={formData.industry} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="Technology" />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Company Website</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="url" name="website" value={formData.website} onChange={handleChange} style={{ paddingLeft: '45px' }} placeholder="https://..." />
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Company Description / Bio</label>
                <textarea rows={4} name="bio" value={formData.bio} onChange={handleChange} placeholder="Describe your company..."></textarea>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}

          {activeTab === 'portfolio' && user?.role === 'freelancer' && (
            <PortfolioManagement />
          )}

          {activeTab === 'reviews' && user?.role === 'freelancer' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '15px', textAlign: 'center', minWidth: '150px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Star fill="var(--warning)" /> {avgRating > 0 ? avgRating : 'N/A'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>{reviews.length} total reviews</div>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>Client Feedback</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Reviews are earned from completed projects.</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No feedback received yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {reviews.map((review) => (
                    <div key={review.id} style={{ border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{review.client_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--warning)', fontSize: '13px' }}>
                          <Star size={14} fill="var(--warning)" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>Project: {review.project_title}</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                        "{review.comment || 'No comment provided.'}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* 2FA Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Two-Factor Authentication (2FA)
                      {twoFactorEnabled && <CheckCircle size={16} color="var(--success)" />}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                      Enhance account safety. If enabled, each login requires a security verification OTP code.
                    </p>
                  </div>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={handleToggle2FA}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider" style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: twoFactorEnabled ? 'var(--success)' : '#ccc',
                      transition: '.4s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: twoFactorEnabled ? '28px' : '4px', bottom: '4px',
                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                  <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Change Password</h2>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setSuccess('');
                    setError('');
                    const oldPassword = e.target.oldPassword.value;
                    const newPassword = e.target.newPassword.value;
                    try {
                      const res = await fetch('http://localhost:5000/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ oldPassword, newPassword })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setSuccess('Password updated successfully');
                        e.target.reset();
                      } else throw new Error(data.error);
                    } catch(err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Password</label>
                      <input type="password" name="oldPassword" required />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>New Password</label>
                      <input type="password" name="newPassword" required />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Updating...' : 'Update Password'}</button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
