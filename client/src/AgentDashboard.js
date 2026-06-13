import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const STAGE_STYLES = {
  'NEW LEADS':      { bg: '#1a3a2a', badge: '#2d6a4f', text: '#52b788' },
  'WARM LEADS':     { bg: '#1a2a4a', badge: '#1d3557', text: '#4895ef' },
  'HOT LEADS':      { bg: '#3a1a0a', badge: '#c1440e', text: '#ff6b2b' },
  'RECYCLED LEADS': { bg: '#2a1a1a', badge: '#6b1f1f', text: '#e07070' },
};

const icons = {
  dashboard: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  leads: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  scripts: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  call: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  view: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  edit: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
};

function AgentDashboard({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const leadStages = ['NEW LEADS', 'WARM LEADS', 'HOT LEADS', 'RECYCLED LEADS'];

  const emptyForm = { name: '', company: '', email: '', phone: '', lead_stage: 'NEW LEADS', deal_value: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  const fetchContacts = useCallback(async () => {
    try {
      const endpoint = selectedStage === 'ALL'
        ? `${API}/api/contacts?agentId=${user.id}`
        : `${API}/api/contacts?agentId=${user.id}&stage=${selectedStage}`;
      const res = await axios.get(endpoint);
      setContacts(res.data);
    } catch (err) { console.error('Failed to fetch contacts:', err); }
  }, [selectedStage, user.id]);

  const fetchScripts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/scripts`);
      setScripts(res.data);
    } catch (err) { console.error('Failed to fetch scripts:', err); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, assigned_to: user.id, created_by: user.id };
    try {
      if (editingContact) {
        await axios.put(`${API}/api/contacts/${editingContact.id}`, payload);
      } else {
        await axios.post(`${API}/api/contacts`, payload);
      }
      fetchContacts();
      setShowForm(false);
      setEditingContact(null);
      setFormData(emptyForm);
    } catch (err) { alert('Failed to save contact. Please try again.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await axios.delete(`${API}/api/contacts/${id}`);
      fetchContacts();
    } catch (err) { alert('Failed to delete contact.'); }
  };

  const handleEdit = (c) => { setEditingContact(c); setFormData(c); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingContact(null); setFormData(emptyForm); };

  const handleViewDetails = useCallback(async (c) => {
    try {
      const res = await axios.get(`${API}/api/contacts/${c.id}/activities`);
      setViewingContact({ ...c, activities: res.data });
    } catch (err) { setViewingContact({ ...c, activities: [] }); }
  }, []);

  const makeCall = async (phone, contactId) => {
    if (!phone) return alert('No phone number');
    try {
      const res = await axios.post(`${API}/api/outbound-call`, { toNumber: phone, contactId, agentId: user.id });
      if (res.data.success) {
        alert(`📞 Calling ${phone}...`);
      } else {
        alert(`Call failed: ${res.data.error}`);
      }
      if (viewingContact && viewingContact.id === contactId) handleViewDetails(viewingContact);
    } catch (err) { alert('Call error. Check server.'); }
  };

  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const inputStyle = {
    width: '100%', padding: '10px 14px', marginBottom: '14px',
    background: '#0f1f35', border: '1px solid #1e3a5f', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const filteredContacts = selectedStage === 'ALL' ? contacts : contacts.filter(c => c.lead_stage === selectedStage);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'leads', label: 'My Leads', icon: icons.leads },
    { id: 'scripts', label: 'Scripts', icon: icons.scripts },
    { id: 'settings', label: 'Settings', icon: icons.settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060f1e', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarCollapsed ? '72px' : '240px',
        background: '#0a1628',
        borderRight: '1px solid #1e3a5f',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>Stritgrad Market</div>
              <div style={{ color: '#4895ef', fontSize: '11px', fontWeight: '500' }}>Agent Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                marginBottom: '4px', transition: 'all 0.15s',
                background: activeNav === item.id ? '#ff6b2b' : 'transparent',
                color: activeNav === item.id ? '#fff' : '#8baac8',
                fontWeight: activeNav === item.id ? '600' : '400',
                fontSize: '14px',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid #1e3a5f' }}>
          {!sidebarCollapsed && (
            <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{user.full_name || user.username}</div>
              <div style={{ color: '#4895ef', fontSize: '11px' }}>Agent</div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#e07070', fontSize: '14px', transition: 'all 0.15s',
            }}
          >
            <span style={{ flexShrink: 0 }}>{icons.logout}</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          background: '#0a1628', borderBottom: '1px solid #1e3a5f',
          padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', color: '#8baac8', cursor: 'pointer', padding: '4px' }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>Agent Dashboard</h1>
              <p style={{ color: '#8baac8', fontSize: '12px', margin: 0 }}>Stritgrad Market Solutions · Call Center CRM</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#ff6b2b', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
            }}
          >
            {icons.plus} Add Lead
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

          {/* Scripts panel */}
          {activeNav === 'scripts' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Call Scripts</h2>
              {scripts.length === 0 ? (
                <div style={{ color: '#8baac8', padding: '40px', textAlign: 'center', background: '#0a1628', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
                  No scripts available yet. Ask your admin to add some.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                  {scripts.map(s => (
                    <div key={s.id} style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #ff6b2b' }}>
                      <h3 style={{ color: '#fff', fontWeight: '700', marginBottom: '10px' }}>{s.title}</h3>
                      <p style={{ color: '#8baac8', fontSize: '14px', lineHeight: 1.6 }}>{s.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard / Leads view */}
          {(activeNav === 'dashboard' || activeNav === 'leads') && (
            <>
              {/* Stage filter tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {['ALL', ...leadStages].map(stage => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontWeight: '600', fontSize: '13px', transition: 'all 0.15s',
                      background: selectedStage === stage ? '#ff6b2b' : '#0a1628',
                      color: selectedStage === stage ? '#fff' : '#8baac8',
                      border: selectedStage === stage ? '1px solid #ff6b2b' : '1px solid #1e3a5f',
                    }}
                  >
                    {stage === 'ALL' ? 'ALL LEADS' : stage}
                  </button>
                ))}
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {leadStages.map(stage => {
                  const count = contacts.filter(c => c.lead_stage === stage).length;
                  const style = STAGE_STYLES[stage];
                  return (
                    <div key={stage} style={{ background: style.bg, border: `1px solid ${style.badge}`, borderRadius: '12px', padding: '18px 20px' }}>
                      <div style={{ color: style.text, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{stage}</div>
                      <div style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Contacts grid */}
              {filteredContacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#8baac8', background: '#0a1628', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
                  No leads in this category yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredContacts.map(c => {
                    const stageStyle = STAGE_STYLES[c.lead_stage] || STAGE_STYLES['NEW LEADS'];
                    return (
                      <div key={c.id} style={{
                        background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px',
                        padding: '20px', transition: 'all 0.2s', position: 'relative',
                        borderTop: `3px solid ${stageStyle.badge}`,
                      }}>
                        {/* Stage badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div>
                            <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '16px', margin: '0 0 4px' }}>{c.name}</h3>
                            <p style={{ color: '#8baac8', fontSize: '13px', margin: 0 }}>{c.company}</p>
                          </div>
                          <span style={{
                            background: stageStyle.badge, color: stageStyle.text,
                            fontSize: '10px', fontWeight: '700', padding: '4px 10px',
                            borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                          }}>
                            {c.lead_stage}
                          </span>
                        </div>

                        {/* Contact info */}
                        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ color: '#8baac8', fontSize: '13px' }}>📞 {c.phone}</div>
                          <div style={{ color: '#8baac8', fontSize: '13px' }}>✉️ {c.email}</div>
                          <div style={{ color: '#ff6b2b', fontWeight: '700', fontSize: '15px', marginTop: '4px' }}>
                            R {Number(c.deal_value || 0).toLocaleString('en-ZA')}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            onClick={() => makeCall(c.phone, c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '9px', background: '#ff6b2b', color: '#fff',
                              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                            }}
                          >
                            {icons.call} Call
                          </button>
                          <button
                            onClick={() => handleViewDetails(c)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '9px', background: '#0f1f35', color: '#4895ef',
                              border: '1px solid #1e3a5f', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                            }}
                          >
                            {icons.view} View
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '9px', background: '#0f1f35', color: '#8baac8',
                              border: '1px solid #1e3a5f', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                            }}
                          >
                            {icons.edit} Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '9px', background: '#1a0a0a', color: '#e07070',
                              border: '1px solid #3a1a1a', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                            }}
                          >
                            {icons.trash} Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeNav === 'settings' && (
            <div style={{ color: '#8baac8', padding: '40px', textAlign: 'center', background: '#0a1628', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
              Settings panel — contact your admin to change account details.
            </div>
          )}
        </main>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '18px', margin: 0 }}>{editingContact ? 'Edit Lead' : 'New Lead'}</h2>
              <button onClick={handleCloseForm} style={{ background: 'none', border: 'none', color: '#8baac8', cursor: 'pointer' }}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { key: 'name', placeholder: 'Full Name *', type: 'text', required: true },
                { key: 'company', placeholder: 'Company', type: 'text' },
                { key: 'email', placeholder: 'Email', type: 'email' },
                { key: 'phone', placeholder: 'Phone *', type: 'tel', required: true },
              ].map(f => (
                <input key={f.key} type={f.type} placeholder={f.placeholder} required={f.required}
                  style={inputStyle} value={formData[f.key]}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                />
              ))}
              <select style={inputStyle} value={formData.lead_stage} onChange={e => setFormData({ ...formData, lead_stage: e.target.value })}>
                {leadStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" placeholder="Deal Value (R)" style={inputStyle}
                value={formData.deal_value} onChange={e => setFormData({ ...formData, deal_value: e.target.value })}
              />
              <textarea placeholder="Notes" rows="3" style={{ ...inputStyle, resize: 'vertical' }}
                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={handleCloseForm} style={{ padding: '10px 24px', background: '#0f1f35', color: '#8baac8', border: '1px solid #1e3a5f', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#ff6b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{editingContact ? 'Update' : 'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {viewingContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '20px', margin: '0 0 4px' }}>{viewingContact.name}</h2>
                <p style={{ color: '#8baac8', fontSize: '13px', margin: 0 }}>{viewingContact.company}</p>
              </div>
              <button onClick={() => setViewingContact(null)} style={{ background: 'none', border: 'none', color: '#8baac8', cursor: 'pointer' }}>{icons.close}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Phone', value: viewingContact.phone },
                { label: 'Email', value: viewingContact.email },
                { label: 'Stage', value: viewingContact.lead_stage, highlight: true },
                { label: 'Deal Value', value: `R ${Number(viewingContact.deal_value || 0).toLocaleString('en-ZA')}`, highlight: true },
              ].map(item => (
                <div key={item.label} style={{ background: '#0f1f35', borderRadius: '10px', padding: '14px 16px', border: '1px solid #1e3a5f' }}>
                  <div style={{ color: '#8baac8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ color: item.highlight ? '#ff6b2b' : '#fff', fontWeight: '600', fontSize: '14px' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {viewingContact.notes && (
              <div style={{ background: '#0f1f35', borderRadius: '10px', padding: '14px 16px', border: '1px solid #1e3a5f', marginBottom: '24px' }}>
                <div style={{ color: '#8baac8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</div>
                <div style={{ color: '#fff', fontSize: '14px' }}>{viewingContact.notes}</div>
              </div>
            )}

            <button
              onClick={() => makeCall(viewingContact.phone, viewingContact.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#ff6b2b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', marginBottom: '24px' }}
            >
              {icons.call} Call {viewingContact.name}
            </button>

            <h3 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>Call History</h3>
            {viewingContact.activities && viewingContact.activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {viewingContact.activities.map(activity => (
                  <div key={activity.id} style={{ background: '#0f1f35', borderRadius: '10px', padding: '14px 16px', border: '1px solid #1e3a5f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: activity.direction === 'inbound' ? '#ff6b2b' : '#52b788', fontWeight: '600', fontSize: '13px' }}>
                        {activity.direction === 'inbound' ? '📞 Inbound' : '📞 Outbound'}
                      </span>
                      <span style={{ color: '#8baac8', fontSize: '12px' }}>{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px' }}>Duration: {formatDuration(activity.duration || 0)}</div>
                    {activity.notes && <div style={{ color: '#8baac8', fontSize: '13px', marginTop: '4px' }}>{activity.notes}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#8baac8', textAlign: 'center', padding: '24px', background: '#0f1f35', borderRadius: '10px' }}>No call history yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentDashboard;
