import React, { useState, useEffect } from 'react';
import Login from './Login';
import AgentDashboard from './AgentDashboard';
import AdminDashboard from './AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);
  if (loading) return <div className="min-h-screen" style={{ background: '#0a1628' }}><div className="text-white p-8">Loading...</div></div>;
  if (!user) return <Login onLogin={setUser} />;
  if (user.role === 'admin') return <AdminDashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />;
  return <AgentDashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />;
}
export default App;