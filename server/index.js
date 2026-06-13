const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const twilio = require('twilio');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// SQLite database (better-sqlite3)
const db = new Database('./crm.db');

// Create tables
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'agent',
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  lead_stage TEXT DEFAULT 'NEW LEADS',
  deal_value REAL,
  notes TEXT,
  assigned_to INTEGER,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(assigned_to) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  user_id INTEGER,
  type TEXT,
  direction TEXT,
  duration INTEGER,
  notes TEXT,
  call_sid TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(contact_id) REFERENCES contacts(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ============ AUTH ============
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secret', { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONTACTS ============
app.get('/api/contacts', (req, res) => {
  const { agentId, stage } = req.query;
  try {
    let query = 'SELECT * FROM contacts';
    let params = [];
    if (agentId) {
      query += ' WHERE assigned_to = ?';
      params.push(agentId);
    }
    if (stage && !agentId) {
      query += agentId ? ' AND lead_stage = ?' : ' WHERE lead_stage = ?';
      params.push(stage);
    }
    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', (req, res) => {
  const { name, company, email, phone, lead_stage, deal_value, notes, assigned_to, created_by } = req.body;
  try {
    const stmt = db.prepare(`INSERT INTO contacts (name, company, email, phone, lead_stage, deal_value, notes, assigned_to, created_by)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    const info = stmt.run(name, company, email, phone, lead_stage, deal_value, notes, assigned_to, created_by);
    const newContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid);
    res.json(newContact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const { name, company, email, phone, lead_stage, deal_value, notes, assigned_to } = req.body;
  try {
    db.prepare(`UPDATE contacts SET name=?, company=?, email=?, phone=?, lead_stage=?, deal_value=?, notes=?, assigned_to=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(name, company, email, phone, lead_stage, deal_value, notes, assigned_to, id);
    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ACTIVITIES ============
app.get('/api/contacts/:id/activities', (req, res) => {
  const { id } = req.params;
  try {
    const rows = db.prepare(`SELECT a.*, u.full_name as agent_name FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.contact_id = ? ORDER BY a.created_at DESC`).all(id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activities', (req, res) => {
  const { contact_id, user_id, type, direction, duration, notes, call_sid } = req.body;
  try {
    const stmt = db.prepare(`INSERT INTO activities (contact_id, user_id, type, direction, duration, notes, call_sid) VALUES (?,?,?,?,?,?,?)`);
    const info = stmt.run(contact_id, user_id, type, direction, duration, notes, call_sid);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SCRIPTS ============
app.get('/api/scripts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM scripts ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scripts', (req, res) => {
  const { title, content, category, created_by } = req.body;
  try {
    db.prepare(`INSERT INTO scripts (title, content, category, created_by) VALUES (?,?,?,?)`).run(title, content, category, created_by);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ADMIN STATS ============
app.get('/api/admin/stats', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    const leadsByStage = db.prepare('SELECT lead_stage, COUNT(*) as count FROM contacts GROUP BY lead_stage').all();
    const callsToday = db.prepare(`SELECT COUNT(*) as count FROM activities WHERE type='call' AND DATE(created_at) = ?`).get(today).count;
    const agents = db.prepare(`SELECT id, full_name, username FROM users WHERE role = 'agent'`).all();
    res.json({ totalLeads, leadsByStage, callsToday, agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENT STATUS ============
app.get('/api/agents/status', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const agents = db.prepare(`SELECT id, username, full_name, role FROM users WHERE role = 'agent'`).all();
    for (let agent of agents) {
      const stats = db.prepare(`SELECT COUNT(*) as calls_today, COALESCE(AVG(duration),0) as avg_duration FROM activities WHERE user_id = ? AND DATE(created_at) = ?`).get(agent.id, today);
      agent.calls_today = stats?.calls_today || 0;
      agent.avg_duration = Math.round(stats?.avg_duration || 0);
    }
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ OUTBOUND CALL ============
app.post('/api/outbound-call', async (req, res) => {
  console.log('Outbound call request received:', req.body);
  const { toNumber, contactId, agentId } = req.body;
  if (!toNumber) return res.status(400).json({ error: 'Phone number required' });
  let formatted = toNumber;
  if (toNumber.match(/^0[0-9]{9}$/)) formatted = `+27${toNumber.slice(1)}`;
  else if (!toNumber.startsWith('+')) formatted = `+${toNumber}`;
  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to: formatted,
      from: twilioPhoneNumber,
      statusCallback: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed']
    });
    db.prepare(`INSERT INTO activities (contact_id, user_id, type, direction, call_sid, notes) VALUES (?, ?, 'call', 'outbound', ?, ?)`).run(contactId, agentId, call.sid, `Outbound call to ${formatted}`);
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ INBOUND CALL WEBHOOK ============
app.post('/api/inbound-call', express.urlencoded({ extended: false }), (req, res) => {
  const { Caller, CallSid } = req.body;
  const contact = db.prepare(`SELECT * FROM contacts WHERE phone LIKE ?`).get(`%${Caller.slice(-9)}%`);
  io.emit('incoming_call', {
    callSid: CallSid,
    callerId: Caller,
    contactId: contact?.id,
    screenPopUrl: contact ? `https://crm.yourclient.com/contact/${contact.id}` : `https://crm.yourclient.com/leads/new?phone=${encodeURIComponent(Caller)}`
  });
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Please hold, you are being connected to the next available agent.');
  twiml.enqueue('sales_queue');
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// ============ CALL STATUS WEBHOOK ============
app.post('/api/call-status', express.urlencoded({ extended: false }), (req, res) => {
  const { CallSid, CallDuration, CallStatus } = req.body;
  if (CallStatus === 'completed' && CallDuration) {
    db.prepare(`UPDATE activities SET duration = ? WHERE call_sid = ?`).run(CallDuration, CallSid);
    console.log(`Call ${CallSid} ended, duration ${CallDuration}s`);
  }
  res.sendStatus(200);
});

io.on('connection', (socket) => {
  console.log('Agent connected via WebSocket:', socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
