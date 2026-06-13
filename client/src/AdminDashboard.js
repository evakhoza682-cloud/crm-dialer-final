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
  agents: (
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
};

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

  useEffect(() => { fetchStats(); fetchAgents(); fetchScripts(); }, [fetchStats, fetchAgents, fetchScripts]);

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

  const inputStyle = {
    width: '100%', padding: '10px 14px', marginBottom: '14px',
    background: '#0f1f35', border: '1px solid #1e3a5f', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  if (!stats) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#060f1e', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8baac8', fontSize: '14px' }}>Loading dashboard...</div>
      </div>
    );
  }

  const maxCount = Math.max(...(stats.leadsByStage?.map(s => s.count) || [1]), 1);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'agents', label: 'Agents', icon: icons.agents },
    { id: 'scripts', label: 'Scripts', icon: icons.scripts },
  ];

  const summaryCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: icons.trend, accent: '#4895ef' },
    { label: 'Calls Today', value: stats.callsToday, icon: icons.phone, accent: '#52b788' },
    { label: 'Active Agents', value: agents.length, icon: icons.users, accent: '#ff6b2b' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060f1e', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarCollapsed ? '72px' : '240px',
        background: '#0a1628', borderRight: '1px solid #1e3a5f',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>Stritgrad Market</div>
              <div style={{ color: '#ff6b2b', fontSize: '11px', fontWeight: '500' }}>Admin Portal</div>
            </div>
          )}
        </div>

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
                fontWeight: activeNav === item.id ? '600' : '400', fontSize: '14px',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 8px', borderTop: '1px solid #1e3a5f' }}>
          {!sidebarCollapsed && (
            <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{user.full_name || user.username}</div>
              <div style={{ color: '#ff6b2b', fontSize: '11px' }}>Administrator</div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#e07070', fontSize: '14px',
            }}
          >
            <span style={{ flexShrink: 0 }}>{icons.logout}</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
              <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>Admin Dashboard</h1>
              <p style={{ color: '#8baac8', fontSize: '12px', margin: 0 }}>Stritgrad Market Solutions · Call Center CRM</p>
            </div>
          </div>
          {activeNav === 'scripts' && (
            <button
              onClick={() => setShowScriptModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', background: '#ff6b2b', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
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
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                {summaryCards.map(card => (
                  <div key={card.label} style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#8baac8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{card.label}</div>
                      <div style={{ color: '#fff', fontSize: '32px', fontWeight: '800' }}>{card.value}</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${card.accent}22`, color: card.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leads by stage */}
              <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Leads by Stage</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stats.leadsByStage?.map(s => {
                    const percentage = (s.count / maxCount) * 100;
                    const style = STAGE_STYLES[s.lead_stage] || STAGE_STYLES['NEW LEADS'];
                    return (
                      <div key={s.lead_stage}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#8baac8', fontSize: '13px', fontWeight: '600' }}>{s.lead_stage}</span>
                          <span style={{ color: style.text, fontWeight: '700', fontSize: '14px' }}>{s.count}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#0f1f35', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: style.badge, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agent performance + leads */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 1fr' : '1fr', gap: '20px' }}>
                <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '24px' }}>
                  <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Agent Performance</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => handleAgentClick(agent)}
                        style={{
                          padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                          background: selectedAgent?.id === agent.id ? '#1a2a4a' : '#0f1f35',
                          border: `1px solid ${selectedAgent?.id === agent.id ? '#4895ef' : '#1e3a5f'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s',
                        }}
                      >
                        <div>
                          <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{agent.full_name || agent.username}</div>
                          <div style={{ color: '#8baac8', fontSize: '12px', marginTop: '2px' }}>Calls today: {agent.calls_today}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6b2b', fontWeight: '700', fontSize: '13px' }}>
                          {icons.clock}
                          {Math.floor((agent.avg_duration || 0) / 60)}:{String((agent.avg_duration || 0) % 60).padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAgent && (
                  <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '24px' }}>
                    <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>{selectedAgent.full_name}'s Leads</h2>
                    {agentContacts.length === 0 ? (
                      <div style={{ color: '#8baac8', textAlign: 'center', padding: '24px', background: '#0f1f35', borderRadius: '10px' }}>No leads assigned</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {agentContacts.map(c => {
                          const style = STAGE_STYLES[c.lead_stage] || STAGE_STYLES['NEW LEADS'];
                          return (
                            <div key={c.id} style={{ padding: '12px 16px', background: '#0f1f35', border: '1px solid #1e3a5f', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{c.name}</span>
                              <span style={{ color: style.text, background: style.badge, fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>{c.lead_stage}</span>
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

          {/* ── Agents view ── */}
          {activeNav === 'agents' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ff6b2b22', color: '#ff6b2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                      {(agent.full_name || agent.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{agent.full_name || agent.username}</div>
                      <div style={{ color: '#8baac8', fontSize: '12px' }}>@{agent.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #1e3a5f' }}>
                    <div>
                      <div style={{ color: '#8baac8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Calls Today</div>
                      <div style={{ color: '#52b788', fontWeight: '700', fontSize: '18px' }}>{agent.calls_today}</div>
                    </div>
                    <div>
                      <div style={{ color: '#8baac8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Duration</div>
                      <div style={{ color: '#ff6b2b', fontWeight: '700', fontSize: '18px' }}>{Math.floor((agent.avg_duration || 0) / 60)}:{String((agent.avg_duration || 0) % 60).padStart(2, '0')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Scripts view ── */}
          {activeNav === 'scripts' && (
            <div>
              {scripts.length === 0 ? (
                <div style={{ color: '#8baac8', padding: '40px', textAlign: 'center', background: '#0a1628', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
                  No scripts yet. Click "Add Script" to create one.
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
        </main>
      </div>

      {/* ── Add Script Modal ── */}
      {showScriptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontWeight: '700', fontSize: '18px', margin: 0 }}>Add New Script</h2>
              <button onClick={() => setShowScriptModal(false)} style={{ background: 'none', border: 'none', color: '#8baac8', cursor: 'pointer' }}>{icons.close}</button>
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
              <button onClick={() => setShowScriptModal(false)} style={{ padding: '10px 24px', background: '#0f1f35', color: '#8baac8', border: '1px solid #1e3a5f', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleAddScript} style={{ padding: '10px 24px', background: '#ff6b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Script</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
