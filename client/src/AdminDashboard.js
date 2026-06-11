import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentContacts, setAgentContacts] = useState([]);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptContent, setScriptContent] = useState('');

  useEffect(() => { fetchStats(); fetchAgents(); }, []);

  const fetchStats = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/stats`);
    setStats(res.data);
  };
  const fetchAgents = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/agents/status`);
    setAgents(res.data);
  };
  const fetchAgentContacts = async (agentId) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/contacts?agentId=${agentId}`);
    setAgentContacts(res.data);
  };
  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
    fetchAgentContacts(agent.id);
  };
  const handleAddScript = async () => {
    if (!scriptTitle.trim() || !scriptContent.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/scripts`, {
        title: scriptTitle,
        content: scriptContent,
        category: 'general',
        created_by: user.id
      });
      setScriptTitle('');
      setScriptContent('');
      setShowScriptModal(false);
      alert('Script added successfully');
    } catch (err) {
      alert('Failed to add script');
    }
  };

  if (!stats) return <div className="p-8 text-white">Loading...</div>;

  const maxCount = Math.max(...(stats.leadsByStage?.map(s => s.count) || [1]), 1);

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      <header style={{ background: '#0d1b2a', borderBottom: '2px solid #ff6b2b', padding: '16px' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-10" />
            <h1 className="text-xl font-bold" style={{ color: '#ff6b2b' }}>Admin Portal</h1>
          </div>
          <div>
            <button
              onClick={() => setShowScriptModal(true)}
              className="px-3 py-1 mr-4"
              style={{ background: '#1b2a4a', color: '#ff6b2b' }}
            >
              + Manage Scripts
            </button>
            <button onClick={onLogout} className="px-4 py-2" style={{ background: '#ff6b2b', color: '#fff' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
            <p className="text-gray-400">Total Leads</p>
            <p className="text-3xl font-bold" style={{ color: '#ff6b2b' }}>{stats.totalLeads}</p>
          </div>
          <div className="p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
            <p className="text-gray-400">Calls Today</p>
            <p className="text-3xl font-bold" style={{ color: '#ff6b2b' }}>{stats.callsToday}</p>
          </div>
          <div className="p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
            <p className="text-gray-400">Active Agents</p>
            <p className="text-3xl font-bold" style={{ color: '#ff6b2b' }}>{agents.length}</p>
          </div>
        </div>

        {/* Leads by Stage (bar chart) */}
        <div className="mb-8 p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#ff6b2b' }}>Leads by Stage</h2>
          <div className="space-y-3">
            {stats.leadsByStage?.map(s => {
              const percentage = (s.count / maxCount) * 100;
              return (
                <div key={s.lead_stage}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{s.lead_stage}</span>
                    <span style={{ color: '#ff6b2b' }}>{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 mt-1 rounded-none">
                    <div
                      className="h-2 rounded-none"
                      style={{ width: `${percentage}%`, background: '#ff6b2b' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent performance + leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#ff6b2b' }}>Agent Performance</h2>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className="p-3 mb-2 cursor-pointer transition-all hover:shadow-glow"
                style={{ background: selectedAgent?.id === agent.id ? '#1a2a4a' : '#0a1628', border: '1px solid #1b2a4a' }}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-white">{agent.full_name || agent.username}</p>
                    <p className="text-sm text-gray-400">Calls today: {agent.calls_today}</p>
                  </div>
                  <p className="text-sm" style={{ color: '#ff6b2b' }}>
                    Avg: {Math.floor(agent.avg_duration / 60)}:{agent.avg_duration % 60}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {selectedAgent && (
            <div className="p-6" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#ff6b2b' }}>{selectedAgent.full_name}'s Leads</h2>
              {agentContacts.length === 0 ? (
                <p className="text-gray-400">No leads assigned</p>
              ) : (
                agentContacts.map(c => (
                  <div key={c.id} className="p-2 mb-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a' }}>
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-sm text-gray-400">{c.lead_stage}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
          <div className="p-6 w-full max-w-md" style={{ background: '#0d1b2a', border: '2px solid #ff6b2b' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ff6b2b' }}>Add New Script</h2>
            <input
              type="text"
              placeholder="Script Title"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="w-full mb-3 p-2"
              style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }}
            />
            <textarea
              placeholder="Script Content"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              rows="5"
              className="w-full mb-3 p-2"
              style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2"
                style={{ background: '#1b2a4a', color: '#fff' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddScript}
                className="px-4 py-2"
                style={{ background: '#ff6b2b', color: '#fff' }}
              >
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;