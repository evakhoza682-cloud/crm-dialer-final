const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

async function createUsers() {
  const db = new sqlite3.Database('./crm.db');
  const adminPw = await bcrypt.hash('admin123', 10);
  const agentPw = await bcrypt.hash('agent123', 10);

  db.run(`INSERT OR REPLACE INTO users (username, password, role, full_name) VALUES (?,?,?,?)`,
    ['admin', adminPw, 'admin', 'System Admin']);

  const agents = [
    ['agent1', agentPw, 'agent', 'Alice Khumalo'],
    ['agent2', agentPw, 'agent', 'Bob Ndlovu'],
    ['agent3', agentPw, 'agent', 'Carol Dlamini'],
    ['agent4', agentPw, 'agent', 'David Mbeki'],
    ['agent5', agentPw, 'agent', 'Elena van der Merwe'],
    ['agent6', agentPw, 'agent', 'Franklin Jacobs']
  ];
  for (let a of agents) {
    db.run(`INSERT OR REPLACE INTO users (username, password, role, full_name) VALUES (?,?,?,?)`, a);
  }
  console.log('✅ Users created: admin/admin123, agent1..agent6/agent123');
  db.close();
}
createUsers();