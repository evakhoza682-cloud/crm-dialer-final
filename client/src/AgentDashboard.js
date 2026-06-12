import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AgentDashboard({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [showScripts, setShowScripts] = useState(false);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const leadStages = ['NEW LEADS', 'WARM LEADS', 'HOT LEADS', 'RECYCLED LEADS'];
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', lead_stage: 'NEW LEADS', deal_value: '', notes: ''
  });

  const fetchContacts = async () => {
    const requestUrl = selectedStage === 'ALL'
      ? `${process.env.REACT_APP_API_URL}/api/contacts?agentId=${user.id}`
      : `${process.env.REACT_APP_API_URL}/api/contacts?agentId=${user.id}&stage=${selectedStage}`;
    const res = await axios.get(requestUrl);
    setContacts(res.data);
  };

  const fetchScripts = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/scripts`);
    setScripts(res.data);
  };

  useEffect(() => {
    fetchContacts();
    fetchScripts();
  }, [selectedStage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, assigned_to: user.id, created_by: user.id };
    if (editingContact) {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/contacts/${editingContact.id}`, payload);
    } else {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/contacts`, payload);
    }
    fetchContacts();
    setShowForm(false);
    setEditingContact(null);
    setFormData({ name: '', company: '', email: '', phone: '', lead_stage: 'NEW LEADS', deal_value: '', notes: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contact?')) {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/contacts/${id}`);
      fetchContacts();
    }
  };

  const handleEdit = (c) => {
    setEditingContact(c);
    setFormData(c);
    setShowForm(true);
  };

  const handleViewDetails = async (c) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/contacts/${c.id}/activities`);
    setViewingContact({ ...c, activities: res.data });
  };

  const makeCall = async (phone, contactId) => {
    if (!phone) return alert('No phone number');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/outbound-call`, {
        toNumber: phone,
        contactId,
        agentId: user.id
      });
      if (res.data.success) {
        alert(`📞 Calling ${phone}...`);
      } else {
        alert(`Call failed: ${res.data.error}`);
      }
      if (viewingContact && viewingContact.id === contactId) {
        handleViewDetails(viewingContact);
      }
    } catch (err) {
      alert('Call error. Check server.');
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'NEW LEADS': return '#1b4d3e';
      case 'WARM LEADS': return '#2a3a7a';
      case 'HOT LEADS': return '#ff6b2b';
      default: return '#7a1f1f';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      <header style={{ background: '#0d1b2a', borderBottom: '2px solid #ff6b2b', padding: '16px' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold" style={{ color: '#ff6b2b' }}>Agent Portal</h1>
          </div>
          <div>
            <button onClick={() => setShowScripts(!showScripts)} className="px-3 py-1 mr-4" style={{ background: '#1b2a4a', color: '#ff6b2b' }}>
              📋 Scripts
            </button>
            <span className="text-white mr-4">Welcome, {user.full_name || user.username}</span>
            <button onClick={onLogout} className="px-4 py-2" style={{ background: '#ff6b2b', color: '#fff' }}>Logout</button>
          </div>
        </div>
      </header>

      {showScripts && (
        <div className="fixed right-0 top-20 w-96 h-96 overflow-y-auto z-50 p-4" style={{ background: '#0d1b2a', border: '2px solid #ff6b2b' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ color: '#ff6b2b' }}>Call Scripts</h2>
            <button onClick={() => setShowScripts(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          {scripts.length === 0 ? (
            <p className="text-gray-400">No scripts yet.</p>
          ) : (
            scripts.map(s => (
              <div key={s.id} className="mb-3 p-3" style={{ background: '#0a1628', borderLeft: `3px solid #ff6b2b` }}>
                <h3 className="font-bold text-white">{s.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{s.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedStage('ALL')}
            className="px-4 py-2 font-bold"
            style={{ background: selectedStage === 'ALL' ? '#ff6b2b' : '#1b2a4a', color: '#fff' }}
          >
            ALL LEADS
          </button>
          {leadStages.map(s => (
            <button
              key={s}
              onClick={() => setSelectedStage(s)}
              className="px-4 py-2 font-bold"
              style={{ background: selectedStage === s ? '#ff6b2b' : '#1b2a4a', color: '#fff' }}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 font-bold ml-auto"
            style={{ background: '#ff6b2b', color: '#fff' }}
          >
            + Add Lead
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contacts.map(c => (
            <div
              key={c.id}
              className="p-4 transition-all hover:scale-[1.01] hover:shadow-glow"
              style={{ background: '#0d1b2a', border: `1px solid ${getStageColor(c.lead_stage)}` }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white">{c.name}</h3>
                <span className="px-2 py-1 text-xs font-bold" style={{ background: getStageColor(c.lead_stage), color: '#fff' }}>
                  {c.lead_stage}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{c.company}</p>
              <p className="text-gray-400 text-sm">Phone: {c.phone}</p>
              <p className="text-gray-400 text-sm">Email: {c.email}</p>
              <p className="font-bold mt-2" style={{ color: '#ff6b2b' }}>
                R {Number(c.deal_value).toLocaleString('en-ZA')}
              </p>
              <div className="flex justify-between mt-4">
                <button onClick={() => makeCall(c.phone, c.id)} className="px-3 py-1 text-sm" style={{ background: '#ff6b2b', color: '#fff' }}>
                  📞 Call
                </button>
                <button onClick={() => handleViewDetails(c)} className="text-sm" style={{ color: '#ff6b2b' }}>View</button>
                <div className="space-x-2">
                  <button onClick={() => handleEdit(c)} className="text-sm text-gray-400">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-sm" style={{ color: '#e55a1a' }}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
          <div className="p-6 w-full max-w-md" style={{ background: '#0d1b2a', border: '2px solid #ff6b2b' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#ff6b2b' }}>{editingContact ? 'Edit Lead' : 'New Lead'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name*" required className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Company" className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="tel" placeholder="Phone*" required className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <select className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.lead_stage} onChange={e => setFormData({...formData, lead_stage: e.target.value})}>
                {leadStages.map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="number" placeholder="Deal Value (R)" className="w-full mb-3 p-2" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.deal_value} onChange={e => setFormData({...formData, deal_value: e.target.value})} />
              <textarea placeholder="Notes" className="w-full mb-3 p-2" rows="3" style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingContact(null); }} className="px-4 py-2" style={{ background: '#1b2a4a', color: '#fff' }}>Cancel</button>
                <button type="submit" className="px-4 py-2" style={{ background: '#ff6b2b', color: '#fff' }}>{editingContact ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal with Call History */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50">
          <div className="p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: '#0d1b2a', border: '2px solid #ff6b2b' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#ff6b2b' }}>{viewingContact.name}</h2>
              <button onClick={() => setViewingContact(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><strong className="text-gray-400">Company:</strong> <span className="text-white">{viewingContact.company}</span></div>
              <div><strong className="text-gray-400">Email:</strong> <span className="text-white">{viewingContact.email}</span></div>
              <div><strong className="text-gray-400">Phone:</strong> <span className="text-white">{viewingContact.phone}</span></div>
              <div><strong className="text-gray-400">Stage:</strong> <span style={{ color: '#ff6b2b' }}>{viewingContact.lead_stage}</span></div>
              <div><strong className="text-gray-400">Deal Value:</strong> <span style={{ color: '#ff6b2b' }}>R {Number(viewingContact.deal_value).toLocaleString('en-ZA')}</span></div>
              <div><strong className="text-gray-400">Notes:</strong> <span className="text-white">{viewingContact.notes}</span></div>
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: '#ff6b2b' }}>Call History</h3>
            <div className="space-y-2">
              {viewingContact.activities && viewingContact.activities.length > 0 ? (
                viewingContact.activities.map(activity => (
                  <div key={activity.id} className="p-3" style={{ background: '#0a1628', border: '1px solid #1b2a4a' }}>
                    <div className="flex justify-between">
                      <span className="font-medium" style={{ color: activity.direction === 'inbound' ? '#ff6b2b' : '#40916c' }}>
                        {activity.direction === 'inbound' ? '📞 Inbound' : '📞 Outbound'}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-1 text-white">Duration: {Math.floor(activity.duration / 60)}:{activity.duration % 60}</p>
                    <p className="text-sm text-gray-300">{activity.notes}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No call history yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentDashboard;
