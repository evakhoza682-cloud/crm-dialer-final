import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const STAGE_STYLES = {
  'NEW LEADS':      { glow: '#52b788', badgeBg: 'rgba(82,183,136,0.18)', badgeBorder: 'rgba(82,183,136,0.4)', text: '#52b788' },
  'WARM LEADS':     { glow: '#4895ef', badgeBg: 'rgba(72,149,239,0.18)', badgeBorder: 'rgba(72,149,239,0.4)', text: '#4895ef' },
  'HOT LEADS':      { glow: '#ff6b2b', badgeBg: 'rgba(255,107,43,0.18)', badgeBorder: 'rgba(255,107,43,0.4)', text: '#ff8c4b' },
  'RECYCLED LEADS': { glow: '#e07070', badgeBg: 'rgba(224,112,112,0.18)', badgeBorder: 'rgba(224,112,112,0.4)', text: '#e07070' },
};

const icons = {
  dashboard: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  agents: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  notes: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  scripts: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  plus: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  close: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  phone: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  trend: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

const glass = (extra = {}) => ({
  background: 'rgba(15, 25, 45, 0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
  ...extra,
});

function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentContacts, setAgentContacts] = useState([]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [scripts, setScripts] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [displayName, setDisplayName] = useState(user.full_name || user.username);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [newUsername, setNewUsername] = useState(user.username);
  const [usernamePassword, setUsernamePassword] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/stats`);
      setStats(res.data);
    } catch (err) { console.error('Failed to fetch stats:', err); }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/agents/status`);
      setAgents(res.data);
    } catch (err) { console.error('Failed to fetch agents:', err); }
  }, []);

  const fetchScripts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/scripts`);
      setScripts(res.data);
    } catch (err) { console.error('Failed to fetch scripts:', err); }
  }, []);

  const fetchAllNotes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/notes`);
      setAllNotes(res.data);
    } catch (err) { console.error('Failed to fetch notes:', err); }
  }, []);

  useEffect(() => { fetchStats(); fetchAgents(); fetchScripts(); }, [fetchStats, fetchAgents, fetchScripts]);
  useEffect(() => { if (activeNav === 'notes') fetchAllNotes(); }, [activeNav, fetchAllNotes]);

  const fetchAgentContacts = async (agentId) => {
    try {
      const res = await axios.get(`${API}/api/contacts?agentId=${agentId}`);
      setAgentContacts(res.data);
    } catch (err) { console.error('Failed to fetch agent contacts:', err); }
  };

  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
    fetchAgentContacts(agent.id);
  };

  const handleAddScript = async () => {
    if (!scriptTitle.trim() || !scriptContent.trim()) return;
    try {
      await axios.post(`${API}/api/scripts`, {
        title: scriptTitle, content: scriptContent, category: 'general', created_by: user.id
      });
      setScriptTitle('');
      setScriptContent('');
      setShowScriptModal(false);
      fetchScripts();
    } catch (err) { alert('Failed to add script'); }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/api/notes/${noteId}`);
      setAllNotes(allNotes.filter(n => n.id !== noteId));
    } catch (err) { alert('Failed to delete note.'); }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    setNameSaved(false);
    try {
      await axios.put(`${API}/api/users/${user.id}/display-name`, { full_name: displayName });
      user.full_name = displayName;
      localStorage.setItem('user', JSON.stringify(user));
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (err) {
      alert('Failed to update display name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ type: 'success', text: '✓ Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update password.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeUsername = async () => {
    setUsernameMessage(null);
    if (!newUsername.trim() || !usernamePassword) {
      setUsernameMessage({ type: 'error', text: 'Please fill in both fields.' });
      return;
    }
    if (newUsername.trim() === user.username) {
      setUsernameMessage({ type: 'error', text: 'That is already your current username.' });
      return;
    }
    setSavingUsername(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/username`, {
        new_username: newUsername.trim(),
        current_password: usernamePassword,
      });
      user.username = newUsername.trim();
      localStorage.setItem('user', JSON.stringify(user));
      setUsernameMessage({ type: 'success', text: '✓ Username updated. Use your new username next time you log in.' });
      setUsernamePassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update username.';
      setUsernameMessage({ type: 'error', text: msg });
    } finally {
      setSavingUsername(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', marginBottom: '14px',
    background: 'rgba(8, 16, 32, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const AnimatedBackground = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div className="bg-orb" style={{ width: '500px', height: '500px', top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(72,149,239,0.35), transparent 70%)' }} />
      <div className="bg-orb" style={{ width: '600px', height: '600px', top: '40%', left: '60%', background: 'radial-gradient(circle, rgba(255,107,43,0.3), transparent 70%)', animationDelay: '-8s' }} />
      <div className="bg-orb" style={{ width: '450px', height: '450px', top: '70%', left: '10%', background: 'radial-gradient(circle, rgba(82,183,136,0.25), transparent 70%)', animationDelay: '-15s' }} />
      <div className="bg-orb" style={{ width: '350px', height: '350px', top: '5%', left: '75%', background: 'radial-gradient(circle, rgba(255,107,43,0.22), transparent 70%)', animationDelay: '-22s' }} />

      <div className="bg-shape" style={{ width: '180px', height: '180px', top: '12%', left: '20%', borderRadius: '24px', animation: 'floatShape 28s ease-in-out infinite' }} />
      <div className="bg-shape" style={{ width: '120px', height: '120px', top: '60%', left: '78%', borderRadius: '50%', border: '1px solid rgba(72,149,239,0.2)', animation: 'floatShape 22s ease-in-out infinite reverse' }} />
      <div className="bg-shape" style={{ width: '90px', height: '90px', top: '35%', left: '50%', transform: 'rotate(45deg)', animation: 'floatShape 35s ease-in-out infinite' }} />
      <div className="bg-shape" style={{ width: '150px', height: '150px', top: '80%', left: '30%', borderRadius: '16px', border: '1px solid rgba(82,183,136,0.2)', animation: 'floatShape 26s ease-in-out infinite reverse' }} />
      <div className="bg-shape" style={{ width: '70px', height: '70px', top: '18%', left: '88%', borderRadius: '50%', animation: 'floatShape 18s ease-in-out infinite' }} />

      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="bg-star"
          style={{
            width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`,
            top: `${(i * 13) % 100}%`, left: `${(i * 29) % 100}%`,
            animationDelay: `${(i % 6) * 0.7}s`,
          }}
        />
      ))}
    </div>
  );

  const GlobalStyles = () => (
    <style>{`
      @keyframes floatOrb {
        0%   { transform: translate(0, 0) scale(1); }
        33%  { transform: translate(60px, -50px) scale(1.08); }
        66%  { transform: translate(-40px, 40px) scale(0.95); }
        100% { transform: translate(0, 0) scale(1); }
      }
      @keyframes floatShape {
        0%   { transform: translate(0, 0) rotate(0deg); }
        50%  { transform: translate(40px, -50px) rotate(180deg); }
        100% { transform: translate(0, 0) rotate(360deg); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.4); }
      }
      @keyframes pulseGlow {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.65; }
      }
      .bg-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        pointer-events: none;
        animation: floatOrb 30s ease-in-out infinite, pulseGlow 8s ease-in-out infinite;
      }
      .bg-shape {
        position: absolute;
        border: 1px solid rgba(255,107,43,0.18);
        pointer-events: none;
      }
      .bg-star {
        position: absolute;
        background: #ffffff;
        border-radius: 50%;
        pointer-events: none;
        animation: twinkle 4s ease-in-out infinite;
      }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,107,43,0.3); border-radius: 4px; }
    `}</style>
  );

  if (!stats) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#070d1a', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <GlobalStyles />
        <AnimatedBackground />
        <div style={{ color: '#9bb3d1', fontSize: '14px', position: 'relative', zIndex: 1 }}>Loading dashboard...</div>
      </div>
    );
  }

  const maxCount = Math.max(...(stats.leadsByStage?.map(s => s.count) || [1]), 1);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'agents', label: 'Agents', icon: icons.agents },
    { id: 'notes', label: 'Notes', icon: icons.notes },
    { id: 'scripts', label: 'Scripts', icon: icons.scripts },
    { id: 'settings', label: 'Settings', icon: icons.settings },
  ];

  const summaryCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: icons.trend, accent: '#4895ef' },
    { label: 'Calls Today', value: stats.callsToday, icon: icons.phone, accent: '#52b788' },
    { label: 'Active Agents', value: agents.length, icon: icons.users, accent: '#ff6b2b' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070d1a', fontFamily: "'Inter', -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <GlobalStyles />
      <AnimatedBackground />

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarCollapsed ? '76px' : '250px',
        ...glass({ borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }),
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 18px rgba(255,107,43,0.4)', border: '1px solid rgba(255,107,43,0.3)' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>Stritgrad Market</div>
              <div style={{
                background: 'linear-gradient(90deg, #ff6b2b, #4895ef)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
              }}>ADMIN PORTAL</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                marginBottom: '6px', transition: 'all 0.2s',
                background: activeNav === item.id ? 'linear-gradient(135deg, #ff6b2b, #e0531a)' : 'transparent',
                color: activeNav === item.id ? '#fff' : '#9bb3d1',
                fontWeight: activeNav === item.id ? '700' : '500', fontSize: '14px',
                boxShadow: activeNav === item.id ? '0 4px 20px rgba(255,107,43,0.4)' : 'none',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!sidebarCollapsed && (
            <div style={{ padding: '10px 14px', marginBottom: '8px', borderRadius: '12px', background: 'rgba(255,107,43,0.08)' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{user.full_name || user.username}</div>
              <div style={{ color: '#ff8c4b', fontSize: '11px', fontWeight: '600' }}>● Administrator</div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(224,112,112,0.2)', cursor: 'pointer',
              background: 'rgba(224,112,112,0.08)', color: '#e07070', fontSize: '14px', fontWeight: '600',
            }}
          >
            <span style={{ flexShrink: 0 }}>{icons.logout}</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        <header style={{
          ...glass({ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }),
          padding: '0 28px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#9bb3d1', cursor: 'pointer', padding: '8px' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 style={{
                background: 'linear-gradient(90deg, #ffffff, #9bb3d1)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontSize: '21px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px',
              }}>Admin Dashboard</h1>
              <p style={{ color: '#6b85a8', fontSize: '12px', margin: 0, fontWeight: '500' }}>Stritgrad Market Solutions · Call Center CRM</p>
            </div>
          </div>
          {activeNav === 'scripts' && (
            <button
              onClick={() => setShowScriptModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 22px', background: 'linear-gradient(135deg, #ff6b2b, #e0531a)', color: '#fff',
                border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                boxShadow: '0 6px 20px rgba(255,107,43,0.4)',
              }}
            >
              {icons.plus} Add Script
            </button>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

          {/* ── Dashboard ── */}
          {activeNav === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                {summaryCards.map(card => (
                  <div key={card.label} style={{ ...glass({ padding: '24px', position: 'relative', overflow: 'hidden' }), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: card.accent, opacity: 0.15, filter: 'blur(24px)' }} />
                    <div>
                      <div style={{ color: '#6b85a8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>{card.label}</div>
                      <div style={{ color: '#fff', fontSize: '34px', fontWeight: '800' }}>{card.value}</div>
                    </div>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${card.accent}22`, border: `1px solid ${card.accent}40`, color: card.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...glass({ padding: '26px' }), marginBottom: '28px' }}>
                <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', marginBottom: '22px', letterSpacing: '-0.3px' }}>Leads by Stage</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {stats.leadsByStage?.map(s => {
                    const percentage = (s.count / maxCount) * 100;
                    const style = STAGE_STYLES[s.lead_stage] || STAGE_STYLES['NEW LEADS'];
                    return (
                      <div key={s.lead_stage}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#9bb3d1', fontSize: '13px', fontWeight: '700' }}>{s.lead_stage}</span>
                          <span style={{ color: style.text, fontWeight: '800', fontSize: '14px' }}>{s.count}</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: `linear-gradient(90deg, ${style.glow}, ${style.glow}aa)`, borderRadius: '6px', transition: 'width 0.4s ease', boxShadow: `0 0 12px ${style.glow}66` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 1fr' : '1fr', gap: '20px' }}>
                <div style={{ ...glass({ padding: '26px' }) }}>
                  <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.3px' }}>Agent Performance</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => handleAgentClick(agent)}
                        style={{
                          padding: '16px 18px', borderRadius: '12px', cursor: 'pointer',
                          background: selectedAgent?.id === agent.id ? 'rgba(72,149,239,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedAgent?.id === agent.id ? 'rgba(72,149,239,0.35)' : 'rgba(255,255,255,0.06)'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s',
                        }}
                      >
                        <div>
                          <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{agent.full_name || agent.username}</div>
                          <div style={{ color: '#6b85a8', fontSize: '12px', marginTop: '2px' }}>Calls today: {agent.calls_today}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff8c4b', fontWeight: '800', fontSize: '13px' }}>
                          {icons.clock}
                          {Math.floor((agent.avg_duration || 0) / 60)}:{String((agent.avg_duration || 0) % 60).padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAgent && (
                  <div style={{ ...glass({ padding: '26px' }) }}>
                    <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.3px' }}>{selectedAgent.full_name}'s Leads</h2>
                    {agentContacts.length === 0 ? (
                      <div style={{ color: '#6b85a8', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>No leads assigned</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {agentContacts.map(c => {
                          const style = STAGE_STYLES[c.lead_stage] || STAGE_STYLES['NEW LEADS'];
                          return (
                            <div key={c.id} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{c.name}</span>
                              <span style={{ color: style.text, background: style.badgeBg, border: `1px solid ${style.badgeBorder}`, fontSize: '10px', fontWeight: '800', padding: '5px 11px', borderRadius: '20px', textTransform: 'uppercase' }}>{c.lead_stage}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Agents ── */}
          {activeNav === 'agents' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ ...glass({ padding: '24px', position: 'relative', overflow: 'hidden' }) }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '90px', height: '90px', borderRadius: '50%', background: '#ff6b2b', opacity: 0.12, filter: 'blur(22px)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,107,43,0.25), rgba(255,107,43,0.1))', border: '1px solid rgba(255,107,43,0.3)', color: '#ff8c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '19px' }}>
                      {(agent.full_name || agent.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{agent.full_name || agent.username}</div>
                      <div style={{ color: '#6b85a8', fontSize: '12px' }}>@{agent.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
                    <div>
                      <div style={{ color: '#6b85a8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>Calls Today</div>
                      <div style={{ color: '#52b788', fontWeight: '800', fontSize: '19px' }}>{agent.calls_today}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b85a8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>Avg Duration</div>
                      <div style={{ color: '#ff8c4b', fontWeight: '800', fontSize: '19px' }}>{Math.floor((agent.avg_duration || 0) / 60)}:{String((agent.avg_duration || 0) % 60).padStart(2, '0')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Notes (all agents) ── */}
          {activeNav === 'notes' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.3px' }}>All Lead Notes</h2>
              {allNotes.length === 0 ? (
                <div style={{ ...glass(), color: '#6b85a8', padding: '50px', textAlign: 'center' }}>
                  No notes recorded yet across any leads.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {allNotes.map(note => (
                    <div key={note.id} style={{ ...glass(), padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#ff8c4b', fontWeight: '700', fontSize: '14px' }}>{note.contact_name}</span>
                          <span style={{ color: '#6b85a8', fontSize: '12px' }}>{note.contact_phone}</span>
                          <span style={{ color: '#4895ef', fontSize: '12px', fontWeight: '600', background: 'rgba(72,149,239,0.1)', padding: '2px 10px', borderRadius: '12px' }}>
                            {note.agent_name || note.username}
                          </span>
                        </div>
                        <p style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '8px', lineHeight: 1.5 }}>{note.content}</p>
                        <span style={{ color: '#6b85a8', fontSize: '11px' }}>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: '8px', padding: '8px', color: '#e07070', cursor: 'pointer', flexShrink: 0 }}>
                        {icons.trash}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Scripts ── */}
          {activeNav === 'scripts' && (
            <div>
              {scripts.length === 0 ? (
                <div style={{ ...glass(), color: '#6b85a8', padding: '50px', textAlign: 'center' }}>
                  No scripts yet. Click "Add Script" to create one.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                  {scripts.map(s => (
                    <div key={s.id} style={{ ...glass(), padding: '22px', borderLeft: '3px solid #ff6b2b' }}>
                      <h3 style={{ color: '#fff', fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3>
                      <p style={{ color: '#9bb3d1', fontSize: '14px', lineHeight: 1.6 }}>{s.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Settings ── */}
          {activeNav === 'settings' && (
            <div style={{ maxWidth: '500px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.3px' }}>Account Settings</h2>

              <div style={{ ...glass(), padding: '26px' }}>
                <label style={{ display: 'block', color: '#6b85a8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  style={inputStyle}
                />
                <p style={{ color: '#6b85a8', fontSize: '12px', marginBottom: '20px' }}>
                  This is the name shown in your dashboard. It is separate from your login username (<strong style={{ color: '#9bb3d1' }}>{user.username}</strong>), which you can change below.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={savingName}
                    style={{
                      padding: '12px 26px', background: 'linear-gradient(135deg, #ff6b2b, #e0531a)', color: '#fff',
                      border: 'none', borderRadius: '10px', cursor: savingName ? 'default' : 'pointer',
                      fontWeight: '700', fontSize: '14px', opacity: savingName ? 0.7 : 1,
                      boxShadow: '0 4px 16px rgba(255,107,43,0.35)',
                    }}
                  >
                    {savingName ? 'Saving...' : 'Save Changes'}
                  </button>
                  {nameSaved && <span style={{ color: '#52b788', fontSize: '13px', fontWeight: '700' }}>✓ Saved</span>}
                </div>
              </div>

              <div style={{ ...glass(), padding: '26px', marginTop: '20px' }}>
                <label style={{ display: 'block', color: '#6b85a8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  Change Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="New username"
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={usernamePassword}
                  onChange={e => setUsernamePassword(e.target.value)}
                  placeholder="Current password (to confirm)"
                  style={inputStyle}
                />
                <p style={{ color: '#6b85a8', fontSize: '12px', marginBottom: '20px' }}>
                  This is the username you use to log in. 3-20 characters, letters/numbers/dots/underscores only. After changing it, use the new username next time you log in.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleChangeUsername}
                    disabled={savingUsername}
                    style={{
                      padding: '12px 26px', background: 'linear-gradient(135deg, #ff6b2b, #e0531a)', color: '#fff',
                      border: 'none', borderRadius: '10px', cursor: savingUsername ? 'default' : 'pointer',
                      fontWeight: '700', fontSize: '14px', opacity: savingUsername ? 0.7 : 1,
                      boxShadow: '0 4px 16px rgba(255,107,43,0.35)',
                    }}
                  >
                    {savingUsername ? 'Updating...' : 'Update Username'}
                  </button>
                  {usernameMessage && (
                    <span style={{ color: usernameMessage.type === 'success' ? '#52b788' : '#e07070', fontSize: '13px', fontWeight: '700' }}>
                      {usernameMessage.text}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ ...glass(), padding: '26px', marginTop: '20px' }}>
                <label style={{ display: 'block', color: '#6b85a8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                  Change Password
                </label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" style={inputStyle} />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 characters)" style={inputStyle} />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={{ ...inputStyle, marginBottom: '16px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    style={{
                      padding: '12px 26px', background: 'linear-gradient(135deg, #ff6b2b, #e0531a)', color: '#fff',
                      border: 'none', borderRadius: '10px', cursor: savingPassword ? 'default' : 'pointer',
                      fontWeight: '700', fontSize: '14px', opacity: savingPassword ? 0.7 : 1,
                      boxShadow: '0 4px 16px rgba(255,107,43,0.35)',
                    }}
                  >
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  {passwordMessage && (
                    <span style={{ color: passwordMessage.type === 'success' ? '#52b788' : '#e07070', fontSize: '13px', fontWeight: '700' }}>
                      {passwordMessage.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Add Script Modal ── */}
      {showScriptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
          <div style={{ ...glass(), padding: '32px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '19px', margin: 0 }}>Add New Script</h2>
              <button onClick={() => setShowScriptModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9bb3d1', cursor: 'pointer', padding: '6px' }}>{icons.close}</button>
            </div>
            <input
              type="text" placeholder="Script Title" value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)} style={inputStyle}
            />
            <textarea
              placeholder="Script Content" value={scriptContent} rows="5"
              onChange={(e) => setScriptContent(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowScriptModal(false)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', color: '#9bb3d1', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
              <button onClick={handleAddScript} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #ff6b2b, #e0531a)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 16px rgba(255,107,43,0.35)' }}>Save Script</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
