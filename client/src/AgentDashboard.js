import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const STAGE_STYLES = {
  'NEW LEADS':      { glow: '#52b788', badgeBg: 'rgba(82,183,136,0.18)', badgeBorder: 'rgba(82,183,136,0.4)', text: '#52b788' },
  'WARM LEADS':     { glow: '#4895ef', badgeBg: 'rgba(72,149,239,0.18)', badgeBorder: 'rgba(72,149,239,0.4)', text: '#4895ef' },
  'HOT LEADS':      { glow: '#ff6b2b', badgeBg: 'rgba(255,107,43,0.18)', badgeBorder: 'rgba(255,107,43,0.4)', text: '#ff8c4b' },
  'RECYCLED LEADS': { glow: '#e07070', badgeBg: 'rgba(224,112,112,0.18)', badgeBorder: 'rgba(224,112,112,0.4)', text: '#e07070' },
};

// ─── DISPOSITIONS — the industry-changing feature ────────────────────────────
// Every call ends with one click. The system auto-moves the lead, logs the call,
// awards points, and updates the live leaderboard. No manual admin after calls.
const DISPOSITIONS = [
  { id: 'sale_made',     label: '🏆 Sale Made!',         color: '#f0b429', bg: 'rgba(240,180,41,0.15)',  border: 'rgba(240,180,41,0.4)',  nextStage: 'HOT LEADS',      action: 'Send contract & onboard',    points: 20 },
  { id: 'interested',    label: '🔥 Interested',          color: '#52b788', bg: 'rgba(82,183,136,0.15)', border: 'rgba(82,183,136,0.4)', nextStage: 'HOT LEADS',      action: 'Send proposal within 24h',   points: 10 },
  { id: 'callback',      label: '📅 Callback Requested',  color: '#4895ef', bg: 'rgba(72,149,239,0.15)', border: 'rgba(72,149,239,0.4)', nextStage: 'WARM LEADS',     action: 'Schedule callback call',     points: 5  },
  { id: 'voicemail',     label: '📱 Left Voicemail',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.3)',nextStage: null,             action: 'Try again in 2 hours',        points: 2  },
  { id: 'no_answer',     label: '❌ No Answer',           color: '#6b85a8', bg: 'rgba(107,133,168,0.12)',border: 'rgba(107,133,168,0.3)',nextStage: null,             action: 'Retry tomorrow',              points: 1  },
  { id: 'not_interested',label: '🚫 Not Interested',      color: '#e07070', bg: 'rgba(224,112,112,0.15)',border: 'rgba(224,112,112,0.4)',nextStage: 'RECYCLED LEADS', action: 'Move to recycled',            points: 0  },
  { id: 'wrong_number',  label: '🔢 Wrong Number',        color: '#9bb3d1', bg: 'rgba(155,179,209,0.1)', border: 'rgba(155,179,209,0.3)',nextStage: null,             action: 'Update contact number',       points: 0  },
  { id: 'follow_up',     label: '📋 Follow-up Sent',      color: '#ff8c4b', bg: 'rgba(255,140,75,0.15)', border: 'rgba(255,140,75,0.4)', nextStage: 'WARM LEADS',     action: 'Follow up in 3 days',         points: 4  },
];

const icons = {
  dashboard: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  leads: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  notes: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
  scripts: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  settings: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  logout: (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  call: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  view: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  edit: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  trash: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  plus: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  close: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  noteSmall: (<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
  upload: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>),
  mic: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  trophy: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="8 3 4 3 4 9"/><polyline points="16 3 20 3 20 9"/><path d="M4 9c0 4.97 3.58 9 8 9s8-4.03 8-9"/><path d="M12 18v3"/><path d="M8 21h8"/></svg>),
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

// ─── ANIMATED GEOMETRIC BACKGROUND CANVAS ────────────────────────────────────
function GeoCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // Colour palette — orange, blue, green, purple to match the CRM
    const COLS = [
      'rgba(255,107,43,VAL)',  // orange
      'rgba(72,149,239,VAL)',  // blue
      'rgba(82,183,136,VAL)', // green
      'rgba(224,112,112,VAL)',// red
      'rgba(167,139,250,VAL)',// purple
      'rgba(240,180,41,VAL)', // gold
    ];
    const rc = (a) => COLS[Math.floor(Math.random() * COLS.length)].replace('VAL', a);

    // Geometric shapes
    const shapes = [];
    for (let i = 0; i < 18; i++) {
      const sides = [3, 4, 6][Math.floor(Math.random() * 3)];
      shapes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 30 + Math.random() * 80,
        sides,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.006,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        stroke: rc(0.45 + Math.random() * 0.4),
        fill: rc(0.06 + Math.random() * 0.1),
        lw: 1 + Math.random() * 1.2,
        wire: Math.random() > 0.4,
      });
    }

    // Particles
    const particles = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1.2 + Math.random() * 2.5,
        col: rc(0.5 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        pulse: Math.random() * Math.PI * 2,
        ps: 0.018 + Math.random() * 0.03,
      });
    }

    function polygon(cx, cy, r, sides, rot) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = rot + (i / sides) * Math.PI * 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function connections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,107,43,${0.1 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    let t = 0;
    function draw() {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      t++;

      // Draw shapes
      shapes.forEach(s => {
        s.rot += s.rotSpeed;
        s.x += s.vx; s.y += s.vy;
        if (s.x > W + 100) s.x = -100; if (s.x < -100) s.x = W + 100;
        if (s.y > H + 100) s.y = -100; if (s.y < -100) s.y = H + 100;
        ctx.save();
        polygon(s.x, s.y, s.r, s.sides, s.rot);
        if (!s.wire) { ctx.fillStyle = s.fill; ctx.fill(); }
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.lw;
        ctx.stroke();
        ctx.restore();
      });

      // Connection lines
      connections();

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x > W) p.x = 0; if (p.x < 0) p.x = W;
        if (p.y > H) p.y = 0; if (p.y < 0) p.y = H;
        p.pulse += p.ps;
        const alpha = 0.4 + 0.5 * Math.sin(p.pulse);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.fill();
      });

      // Scan line
      const scanY = ((t * 0.8) % (H + 60)) - 30;
      const g = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.5, 'rgba(255,107,43,0.04)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, scanY, W, 3);

      // Grid
      ctx.strokeStyle = 'rgba(255,107,43,0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
  );
}

// ─── CSV IMPORTER ─────────────────────────────────────────────────────────────
function CSVImporter({ onClose, onImported, leadStages }) {
  const [step, setStep]       = useState('upload');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows]       = useState([]);
  const [mapping, setMapping] = useState({});
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const fileRef = useRef();

  const FIELDS = [
    { key: 'name',       label: 'Full Name *',  required: true },
    { key: 'company',    label: 'Company',       required: false },
    { key: 'email',      label: 'Email',         required: false },
    { key: 'phone',      label: 'Phone *',       required: true },
    { key: 'lead_stage', label: 'Lead Stage',    required: false },
    { key: 'notes',      label: 'Notes',         required: false },
  ];

  const ALIASES = {
    name:       ['name','full name','fullname','contact','client','first name'],
    company:    ['company','business','organisation','organization','firm'],
    email:      ['email','e-mail','mail'],
    phone:      ['phone','telephone','tel','cell','mobile','number'],
    lead_stage: ['stage','status','lead stage','pipeline','phase'],
    notes:      ['notes','note','comments','description'],
  };

  const autoDetect = (hdrs) => {
    const map = {};
    hdrs.forEach(h => {
      const hl = h.toLowerCase().trim();
      for (const [field, als] of Object.entries(ALIASES)) {
        if (!map[field] && als.some(a => hl.includes(a))) { map[field] = h; break; }
      }
    });
    return map;
  };

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const hdrs = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rws = lines.slice(1).map(line => {
      const cols = []; let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());
      const obj = {};
      hdrs.forEach((h, i) => obj[h] = (cols[i] || '').replace(/^"|"$/g, ''));
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { headers: hdrs, rows: rws };
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!['csv', 'txt'].includes(file.name.split('.').pop().toLowerCase())) {
      alert('Please upload a CSV file.'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: hdrs, rows: rws } = parseCSV(e.target.result);
      setHeaders(hdrs); setRows(rws);
      setMapping(autoDetect(hdrs));
      setStep('map');
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = [
      'Name,Company,Email,Phone,Stage,Notes',
      'Jane Smith,Acme Ltd,jane@acme.co.za,+27 82 000 0000,NEW LEADS,Warm referral from partner',
      'Thabo Dube,TechHub,thabo@tech.co.za,+27 71 111 2222,HOT LEADS,Ready to sign today',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'stritgrad-leads-template.csv'; a.click();
  };

  const doImport = async (user) => {
    setStep('progress');
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = mapping.name ? (r[mapping.name] || '').trim() : '';
      if (!name) { setProgress(Math.round((i + 1) / rows.length * 100)); continue; }
      const stageRaw = mapping.lead_stage ? r[mapping.lead_stage] : '';
      const validStage = leadStages.includes(stageRaw) ? stageRaw : 'NEW LEADS';
      try {
        await axios.post(`${API}/api/contacts`, {
          name,
          company:    mapping.company ? r[mapping.company] || '' : '',
          email:      mapping.email   ? r[mapping.email]   || '' : '',
          phone:      mapping.phone   ? r[mapping.phone]   || '' : '',
          lead_stage: validStage,
          notes:      mapping.notes   ? r[mapping.notes]   || '' : '',
          assigned_to: user.id, created_by: user.id,
        });
        count++;
      } catch { /* skip bad rows */ }
      setProgress(Math.round((i + 1) / rows.length * 100));
      await new Promise(res => setTimeout(res, 20));
    }
    setImported(count);
    setStep('done');
    onImported();
  };

  const inp = {
    width: '100%', padding: '10px 14px', marginBottom: '10px',
    background: 'rgba(8,16,32,0.8)', border: '1px solid rgba(255,107,43,0.25)',
    borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ ...glass(), padding: '32px', width: '100%', maxWidth: step === 'map' ? '680px' : '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '19px', margin: '0 0 4px' }}>📥 Import Leads from CSV</h2>
            <p style={{ color: '#6b85a8', fontSize: '12px', margin: 0 }}>
              {step === 'upload' ? 'Upload your existing leads file' :
               step === 'map'    ? `${rows.length} leads detected — confirm column mapping` :
               step === 'progress' ? 'Importing your leads…' : `Done! ${imported} leads added`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#9bb3d1', cursor: 'pointer', padding: '6px' }}>{icons.close}</button>
        </div>

        {step === 'upload' && (
          <>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: '2px dashed rgba(255,107,43,0.5)', borderRadius: '14px', padding: '44px 24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,107,43,0.04)', marginBottom: '16px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>☁️</div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>Drag & drop your CSV here</div>
              <div style={{ color: '#6b85a8', fontSize: '13px', marginBottom: '14px' }}>or click to browse your computer</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {['CSV', '.txt', 'Tab-delimited'].map(f => (
                  <span key={f} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,107,43,0.15)', color: '#ff8c4b', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,107,43,0.3)' }}>{f}</span>
                ))}
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={downloadTemplate} style={{ padding: '10px 18px', background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.3)', borderRadius: '10px', color: '#ff8c4b', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                📄 Download Template
              </button>
              <span style={{ color: '#6b85a8', fontSize: '12px' }}>Pre-filled with all required columns</span>
            </div>
          </>
        )}

        {step === 'map' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', color: '#6b85a8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{f.label}</label>
                  <select value={mapping[f.key] || ''} onChange={e => setMapping(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ ...inp, marginBottom: 0, borderColor: f.required && !mapping[f.key] ? 'rgba(224,112,112,0.6)' : 'rgba(255,107,43,0.25)' }}>
                    <option value="">— Skip —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'auto', maxHeight: '160px', marginBottom: '18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ background: 'rgba(255,107,43,0.06)' }}>
                  {headers.map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#6b85a8', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.slice(0, 3).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {headers.map(h => <td key={h} style={{ padding: '7px 10px', color: '#9bb3d1' }}>{r[h] || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b85a8', fontSize: '13px' }}>{rows.length} leads ready to import</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep('upload')} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#9bb3d1', cursor: 'pointer', fontWeight: '600' }}>Back</button>
                <button onClick={() => doImport(window.__crmUser)} disabled={!mapping.name}
                  style={{ padding: '10px 22px', background: mapping.name ? 'linear-gradient(135deg,#ff6b2b,#e0531a)' : '#333', color: '#fff', border: 'none', borderRadius: '10px', cursor: mapping.name ? 'pointer' : 'not-allowed', fontWeight: '700', boxShadow: mapping.name ? '0 4px 16px rgba(255,107,43,0.4)' : 'none' }}>
                  ⬆️ Import {rows.length} Leads
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'progress' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '20px' }}>Importing your leads…</div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', maxWidth: '360px', margin: '0 auto' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#ff6b2b,#f0b429)', borderRadius: '5px', transition: 'width 0.3s', boxShadow: '0 0 12px rgba(255,107,43,0.5)' }} />
            </div>
            <div style={{ marginTop: '10px', color: '#6b85a8', fontSize: '13px' }}>{progress}% complete</div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
            <div style={{ color: '#fff', fontWeight: '800', fontSize: '22px', marginBottom: '8px' }}>{imported} Leads Imported!</div>
            <div style={{ color: '#6b85a8', marginBottom: '24px', fontSize: '14px' }}>Your leads are now live in the pipeline. Start dialling!</div>
            <button onClick={onClose} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#52b788,#2d9a60)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 16px rgba(82,183,136,0.4)' }}>
              ✅ Go to Pipeline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CALL RECORDER + DISPOSITION BOARD ───────────────────────────────────────
function CallRecorderModal({ contact, user, onClose, onCallLogged }) {
  const [status, setStatus]       = useState('idle'); // idle | recording | stopped | saving
  const [seconds, setSeconds]     = useState(0);
  const [audioURL, setAudioURL]   = useState(null);
  const [disposition, setDisp]    = useState(null);
  const [notes, setNotes]         = useState('');
  const [supported, setSupported] = useState(true);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const timerRef   = useRef(null);
  const streamRef  = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) setSupported(false);
    return () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setStatus('recording'); setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch { alert('Microphone access denied. Please allow microphone access.'); }
  };

  const stopRec = () => { mediaRef.current?.stop(); clearInterval(timerRef.current); setStatus('stopped'); };

  const handleSave = async () => {
    if (!disposition) { alert('Please select a call outcome.'); return; }
    setStatus('saving');
    const disp = DISPOSITIONS.find(d => d.id === disposition);
    try {
      await axios.post(`${API}/api/contacts/${contact.id}/activities`, {
        type: 'call', direction: 'outbound',
        notes: `[${disp.label}] ${notes}`.trim(),
        duration: seconds,
      });
      if (disp.nextStage) {
        await axios.put(`${API}/api/contacts/${contact.id}`, { ...contact, lead_stage: disp.nextStage, assigned_to: user.id, created_by: user.id });
      }
      onCallLogged(disp, contact);
      onClose();
    } catch { alert('Failed to save call log. Please try again.'); setStatus('stopped'); }
  };

  const selDisp = DISPOSITIONS.find(d => d.id === disposition);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ ...glass(), width: '100%', maxWidth: '520px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(255,107,43,0.2),rgba(255,107,43,0.05))', padding: '22px 24px', borderBottom: '1px solid rgba(255,107,43,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '800', fontSize: '17px' }}>🎙️ Call & Record — {contact.name}</div>
            <div style={{ color: '#6b85a8', fontSize: '12px', marginTop: '2px' }}>{contact.phone} · {contact.company || '—'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9bb3d1', cursor: 'pointer', padding: '6px' }}>{icons.close}</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Timer */}
          <div style={{ textAlign: 'center', marginBottom: '22px', padding: '18px', background: status === 'recording' ? 'rgba(255,107,43,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '14px', border: `1px solid ${status === 'recording' ? 'rgba(255,107,43,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
            <div style={{ fontSize: '38px', fontWeight: '800', fontFamily: 'monospace', color: status === 'recording' ? '#ff8c4b' : '#fff', letterSpacing: '3px', marginBottom: '10px' }}>
              {fmtTime(seconds)}
            </div>
            {status === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b2b', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#ff8c4b', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em' }}>RECORDING LIVE</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {status === 'idle' && (
                <button onClick={supported ? startRec : () => alert('Recording not supported in this browser')}
                  style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#ff6b2b,#e0531a)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 16px rgba(255,107,43,0.4)' }}>
                  {icons.mic} &nbsp;{supported ? 'Start Recording' : 'Record Unavailable'}
                </button>
              )}
              {status === 'recording' && (
                <button onClick={stopRec} style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  ⏹ Stop
                </button>
              )}
              {(status === 'stopped') && (
                <button onClick={startRec} style={{ padding: '10px 18px', background: 'rgba(72,149,239,0.15)', color: '#4895ef', border: '1px solid rgba(72,149,239,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                  🔄 Re-record
                </button>
              )}
            </div>
            {audioURL && (
              <div style={{ marginTop: '14px' }}>
                <audio controls src={audioURL} style={{ width: '100%', borderRadius: '8px', height: '36px' }} />
                <a href={audioURL} download={`call-${contact.name}-${new Date().toISOString().slice(0,10)}.webm`}
                  style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: '#4895ef', fontWeight: '600' }}>
                  ⬇️ Download Recording
                </a>
              </div>
            )}
          </div>

          {/* ══ SMART DISPOSITION BOARD ══ */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ color: '#6b85a8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Call Outcome * — Select One
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {DISPOSITIONS.map(d => (
                <button key={d.id} onClick={() => setDisp(d.id)}
                  style={{
                    padding: '10px 6px', borderRadius: '10px', cursor: 'pointer',
                    fontSize: '10px', fontWeight: '700', textAlign: 'center', lineHeight: 1.4,
                    border: `2px solid ${disposition === d.id ? d.color : 'rgba(255,255,255,0.08)'}`,
                    background: disposition === d.id ? d.bg : 'rgba(255,255,255,0.03)',
                    color: disposition === d.id ? d.color : '#6b85a8',
                    boxShadow: disposition === d.id ? `0 0 0 3px ${d.border}, 0 0 16px ${d.bg}` : 'none',
                    transition: 'all 0.15s',
                  }}>
                  {d.label}
                  {disposition === d.id && d.nextStage && (
                    <div style={{ fontSize: '9px', marginTop: '3px', opacity: 0.75 }}>→ {d.nextStage}</div>
                  )}
                </button>
              ))}
            </div>
            {selDisp && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(82,183,136,0.08)', border: '1px solid rgba(82,183,136,0.2)', borderRadius: '10px', color: '#52b788', fontSize: '12px', fontWeight: '600' }}>
                📌 Next action: {selDisp.action}
                {selDisp.points > 0 && <span style={{ marginLeft: '12px', color: '#f0b429' }}>+{selDisp.points} pts</span>}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: '#6b85a8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Call Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Key points discussed, objections, next steps…"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(8,16,32,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#9bb3d1', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel</button>
            <button onClick={handleSave} disabled={status === 'saving' || !disposition}
              style={{ padding: '10px 24px', background: disposition ? 'linear-gradient(135deg,#52b788,#2d9a60)' : 'rgba(255,255,255,0.08)', color: disposition ? '#fff' : '#6b85a8', border: 'none', borderRadius: '10px', cursor: disposition ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', boxShadow: disposition ? '0 4px 16px rgba(82,183,136,0.4)' : 'none' }}>
              {status === 'saving' ? '⏳ Saving…' : '✅ Save Call Log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AGENT LEADERBOARD ────────────────────────────────────────────────────────
function Leaderboard({ log, onClose }) {
  const tally = log.reduce((acc, e) => {
    const k = e.agent || 'You';
    if (!acc[k]) acc[k] = { name: k, points: 0, calls: 0, sales: 0, interested: 0 };
    acc[k].points += e.points;
    acc[k].calls  += 1;
    if (e.id === 'sale_made')   acc[k].sales    += 1;
    if (e.id === 'interested')  acc[k].interested += 1;
    return acc;
  }, {});
  const board = Object.values(tally).sort((a, b) => b.points - a.points);

  const outcomeCounts = log.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] || 0) + 1; return acc;
  }, {});

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ ...glass(), width: '100%', maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(240,180,41,0.15),rgba(255,107,43,0.08))', padding: '22px 28px', borderBottom: '1px solid rgba(240,180,41,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#f0b429', fontWeight: '800', fontSize: '18px', marginBottom: '2px' }}>🏆 Live Agent Leaderboard</div>
            <div style={{ color: '#6b85a8', fontSize: '12px' }}>Real-time session performance · {log.length} calls logged this session</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9bb3d1', cursor: 'pointer', padding: '6px' }}>{icons.close}</button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Rankings</div>
            {board.length === 0 ? (
              <div style={{ color: '#6b85a8', textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
                Log your first call to see the leaderboard!
              </div>
            ) : board.map((a, i) => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', marginBottom: '8px', background: i === 0 ? 'rgba(240,180,41,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${i === 0 ? 'rgba(240,180,41,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                <div style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b2b,#e0531a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#fff', flexShrink: 0 }}>
                  {a.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{a.name}</div>
                  <div style={{ color: '#6b85a8', fontSize: '11px' }}>{a.calls} calls · {a.sales} sales · {a.interested} hot</div>
                </div>
                <div style={{ color: '#f0b429', fontWeight: '800', fontSize: '17px' }}>{a.points}pts</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Outcome Breakdown</div>
            {Object.keys(outcomeCounts).length === 0 ? (
              <div style={{ color: '#6b85a8', textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>No dispositions yet.</div>
            ) : Object.entries(outcomeCounts).map(([label, count]) => {
              const disp = DISPOSITIONS.find(d => d.label === label);
              const pct = Math.round(count / log.length * 100);
              return (
                <div key={label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: disp?.color || '#fff' }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#6b85a8' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: disp?.color || '#ff6b2b', borderRadius: '4px', boxShadow: `0 0 8px ${disp?.color || '#ff6b2b'}44`, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
            {log.length > 0 && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(82,183,136,0.06)', border: '1px solid rgba(82,183,136,0.18)', borderRadius: '12px' }}>
                <div style={{ color: '#52b788', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>📈 Session Summary</div>
                <div style={{ color: '#9bb3d1', fontSize: '12px' }}>
                  Calls: <strong style={{ color: '#fff' }}>{log.length}</strong> &nbsp;·&nbsp;
                  Sales: <strong style={{ color: '#f0b429' }}>{log.filter(d => d.id === 'sale_made').length}</strong> &nbsp;·&nbsp;
                  Conversion: <strong style={{ color: '#52b788' }}>{Math.round(log.filter(d => d.id === 'sale_made').length / log.length * 100)}%</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN AGENT DASHBOARD ─────────────────────────────────────────────────────
function AgentDashboard({ user, onLogout }) {
  useEffect(() => { window.__crmUser = user; }, [user]);

  const [contacts, setContacts]               = useState([]);
  const [showForm, setShowForm]               = useState(false);
  const [editingContact, setEditingContact]   = useState(null);
  const [viewingContact, setViewingContact]   = useState(null);
  const [scripts, setScripts]                 = useState([]);
  const [activeNav, setActiveNav]             = useState('dashboard');
  const [selectedStage, setSelectedStage]     = useState('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allNotes, setAllNotes]               = useState([]);
  const [notesContact, setNotesContact]       = useState(null);
  const [contactNotes, setContactNotes]       = useState([]);
  const [newNote, setNewNote]                 = useState('');
  const [savingNote, setSavingNote]           = useState(false);
  const [showImporter, setShowImporter]       = useState(false);
  const [callingContact, setCallingContact]   = useState(null);
  const [dispLog, setDispLog]                 = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const leadStages = ['NEW LEADS', 'WARM LEADS', 'HOT LEADS', 'RECYCLED LEADS'];
  const emptyForm  = { name: '', company: '', email: '', phone: '', lead_stage: 'NEW LEADS', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  const [displayName, setDisplayName]         = useState(user.full_name || user.username);
  const [savingName, setSavingName]           = useState(false);
  const [nameSaved, setNameSaved]             = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword]   = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [newUsername, setNewUsername]         = useState(user.username);
  const [usernamePassword, setUsernamePassword] = useState('');
  const [savingUsername, setSavingUsername]   = useState(false);
  const [usernameMessage, setUsernameMessage] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      const endpoint = selectedStage === 'ALL'
        ? `${API}/api/contacts?agentId=${user.id}`
        : `${API}/api/contacts?agentId=${user.id}&stage=${selectedStage}`;
      const res = await axios.get(endpoint);
      setContacts(res.data);
    } catch (err) { console.error('Failed to fetch contacts:', err); }
  }, [selectedStage, user.id]);

  const fetchScripts  = useCallback(async () => { try { const r = await axios.get(`${API}/api/scripts`); setScripts(r.data); } catch {} }, []);
  const fetchAllNotes = useCallback(async () => { try { const r = await axios.get(`${API}/api/notes?agentId=${user.id}`); setAllNotes(r.data); } catch {} }, [user.id]);

  useEffect(() => { fetchContacts(); },  [fetchContacts]);
  useEffect(() => { fetchScripts(); },   [fetchScripts]);
  useEffect(() => { if (activeNav === 'notes') fetchAllNotes(); }, [activeNav, fetchAllNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, assigned_to: user.id, created_by: user.id };
    try {
      if (editingContact) await axios.put(`${API}/api/contacts/${editingContact.id}`, payload);
      else await axios.post(`${API}/api/contacts`, payload);
      fetchContacts();
      setShowForm(false); setEditingContact(null); setFormData(emptyForm);
    } catch { alert('Failed to save contact.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try { await axios.delete(`${API}/api/contacts/${id}`); fetchContacts(); } catch { alert('Failed to delete.'); }
  };

  const handleEdit = (c) => { setEditingContact(c); setFormData(c); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingContact(null); setFormData(emptyForm); };

  const handleViewDetails = useCallback(async (c) => {
    try { const r = await axios.get(`${API}/api/contacts/${c.id}/activities`); setViewingContact({ ...c, activities: r.data }); }
    catch { setViewingContact({ ...c, activities: [] }); }
  }, []);

  const makeCall = async (phone, contactId) => {
    if (!phone) return alert('No phone number');
    try {
      const r = await axios.post(`${API}/api/outbound-call`, { toNumber: phone, contactId, agentId: user.id });
      if (r.data.success) alert(`📞 Calling ${phone}...`);
      else alert(`Call failed: ${r.data.error}`);
      if (viewingContact?.id === contactId) handleViewDetails(viewingContact);
    } catch { alert('Call error.'); }
  };

  const handleCallLogged = (disp, contact) => {
    setDispLog(prev => [...prev, { ...disp, agent: user.full_name || user.username, contact: contact.name, ts: Date.now() }]);
    fetchContacts();
    if (viewingContact?.id === contact.id) handleViewDetails(contact);
  };

  const openNotes = async (c) => {
    setNotesContact(c); setNewNote('');
    try { const r = await axios.get(`${API}/api/contacts/${c.id}/notes`); setContactNotes(r.data); }
    catch { setContactNotes([]); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !notesContact) return;
    setSavingNote(true);
    try {
      const r = await axios.post(`${API}/api/contacts/${notesContact.id}/notes`, { user_id: user.id, content: newNote.trim() });
      setContactNotes([r.data, ...contactNotes]); setNewNote('');
    } catch { alert('Failed to save note.'); } finally { setSavingNote(false); }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/api/notes/${noteId}`);
      setContactNotes(contactNotes.filter(n => n.id !== noteId));
      setAllNotes(allNotes.filter(n => n.id !== noteId));
    } catch { alert('Failed to delete note.'); }
  };

  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return; setSavingName(true); setNameSaved(false);
    try {
      await axios.put(`${API}/api/users/${user.id}/display-name`, { full_name: displayName });
      user.full_name = displayName; localStorage.setItem('user', JSON.stringify(user));
      setNameSaved(true); setTimeout(() => setNameSaved(false), 2500);
    } catch { alert('Failed to update display name.'); } finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordMessage({ type: 'error', text: 'Fill in all password fields.' }); return; }
    if (newPassword.length < 6) { setPasswordMessage({ type: 'error', text: 'Min 6 characters.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage({ type: 'error', text: 'Passwords do not match.' }); return; }
    setSavingPassword(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/password`, { current_password: currentPassword, new_password: newPassword });
      setPasswordMessage({ type: 'success', text: '✓ Password updated.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { setPasswordMessage({ type: 'error', text: err.response?.data?.error || 'Failed.' }); }
    finally { setSavingPassword(false); }
  };

  const handleChangeUsername = async () => {
    setUsernameMessage(null);
    if (!newUsername.trim() || !usernamePassword) { setUsernameMessage({ type: 'error', text: 'Fill in both fields.' }); return; }
    if (newUsername.trim() === user.username) { setUsernameMessage({ type: 'error', text: 'That is already your username.' }); return; }
    setSavingUsername(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/username`, { new_username: newUsername.trim(), current_password: usernamePassword });
      user.username = newUsername.trim(); localStorage.setItem('user', JSON.stringify(user));
      setUsernameMessage({ type: 'success', text: '✓ Username updated.' }); setUsernamePassword('');
    } catch (err) { setUsernameMessage({ type: 'error', text: err.response?.data?.error || 'Failed.' }); }
    finally { setSavingUsername(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', marginBottom: '14px',
    background: 'rgba(8,16,32,0.6)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const filteredContacts = selectedStage === 'ALL' ? contacts : contacts.filter(c => c.lead_stage === selectedStage);
  const sessionCalls = dispLog.length;
  const sessionSales = dispLog.filter(d => d.id === 'sale_made').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'leads',     label: 'My Leads',  icon: icons.leads },
    { id: 'notes',     label: 'Notes',     icon: icons.notes },
    { id: 'scripts',   label: 'Scripts',   icon: icons.scripts },
    { id: 'settings',  label: 'Settings',  icon: icons.settings },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#070d1a', fontFamily:"'Inter',-apple-system,sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes floatOrb { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-50px) scale(1.08)} 66%{transform:translate(-40px,40px) scale(0.95)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes twinkle { 0%,100%{opacity:0.12;transform:scale(1)} 50%{opacity:0.75;transform:scale(1.5)} }
        .bg-orb{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;animation:floatOrb 30s ease-in-out infinite}
        .bg-star{position:absolute;background:#fff;border-radius:50%;pointer-events:none;animation:twinkle 4s ease-in-out infinite}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,107,43,0.4);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,107,43,0.7)}
      `}</style>

      {/* ── GEOMETRIC CANVAS ── */}
      <GeoCanvas />

      {/* Orb glows */}
      <div style={{ position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none' }}>
        <div className="bg-orb" style={{ width:'500px',height:'500px',top:'-10%',left:'-5%',background:'radial-gradient(circle,rgba(72,149,239,0.3),transparent 70%)' }}/>
        <div className="bg-orb" style={{ width:'580px',height:'580px',top:'40%',left:'58%',background:'radial-gradient(circle,rgba(255,107,43,0.25),transparent 70%)',animationDelay:'-8s' }}/>
        <div className="bg-orb" style={{ width:'420px',height:'420px',top:'68%',left:'8%',background:'radial-gradient(circle,rgba(82,183,136,0.2),transparent 70%)',animationDelay:'-15s' }}/>
        <div className="bg-orb" style={{ width:'320px',height:'320px',top:'5%',left:'72%',background:'radial-gradient(circle,rgba(167,139,250,0.18),transparent 70%)',animationDelay:'-22s' }}/>
        {[...Array(35)].map((_,i) => (
          <div key={i} className="bg-star" style={{ width:`${1.2+(i%3)}px`,height:`${1.2+(i%3)}px`,top:`${(i*17)%100}%`,left:`${(i*31)%100}%`,animationDelay:`${(i%6)*0.7}s` }}/>
        ))}
      </div>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:sidebarCollapsed?'76px':'250px', ...glass({borderRadius:0,borderRight:'1px solid rgba(255,255,255,0.08)',borderTop:'none',borderBottom:'none',borderLeft:'none'}), display:'flex',flexDirection:'column',transition:'width 0.25s',flexShrink:0,position:'relative',zIndex:10 }}>

        <div style={{ padding:'24px 16px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:'12px' }}>
          <div style={{ width:'44px',height:'44px',borderRadius:'12px',overflow:'hidden',flexShrink:0,boxShadow:'0 0 20px rgba(255,107,43,0.5)',border:'1px solid rgba(255,107,43,0.35)' }}>
            <img src="/logo.png" alt="Logo" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ color:'#fff',fontWeight:'700',fontSize:'13px',lineHeight:1.2 }}>Stritgrad Contact</div>
              <div style={{ background:'linear-gradient(90deg,#4895ef,#ff6b2b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontSize:'11px',fontWeight:'700',letterSpacing:'0.5px' }}>
                AGENT PORTAL
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex:1,padding:'16px 10px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              style={{ width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',border:'none',cursor:'pointer',marginBottom:'6px',transition:'all 0.2s',background:activeNav===item.id?'linear-gradient(135deg,#ff6b2b,#e0531a)':'transparent',color:activeNav===item.id?'#fff':'#9bb3d1',fontWeight:activeNav===item.id?'700':'500',fontSize:'14px',boxShadow:activeNav===item.id?'0 4px 20px rgba(255,107,43,0.45)':'none' }}>
              <span style={{ flexShrink:0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding:'16px 10px',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {!sidebarCollapsed && (
            <div style={{ padding:'10px 14px',marginBottom:'8px',borderRadius:'12px',background:'rgba(72,149,239,0.08)',border:'1px solid rgba(72,149,239,0.15)' }}>
              <div style={{ color:'#fff',fontWeight:'700',fontSize:'13px' }}>{user.full_name||user.username}</div>
              <div style={{ color:'#4895ef',fontSize:'11px',fontWeight:'600' }}>● Agent Online</div>
            </div>
          )}
          <button onClick={onLogout}
            style={{ width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',border:'1px solid rgba(224,112,112,0.2)',cursor:'pointer',background:'rgba(224,112,112,0.08)',color:'#e07070',fontSize:'14px',fontWeight:'600' }}>
            <span style={{ flexShrink:0 }}>{icons.logout}</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',zIndex:1 }}>

        {/* Header */}
        <header style={{ ...glass({borderRadius:0,borderTop:'none',borderLeft:'none',borderRight:'none'}),padding:'0 28px',height:'68px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'16px' }}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:'#9bb3d1',cursor:'pointer',padding:'8px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 style={{ background:'linear-gradient(90deg,#ffffff,#9bb3d1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontSize:'21px',fontWeight:'800',margin:0,letterSpacing:'-0.3px' }}>
                Agent Dashboard
              </h1>
              <p style={{ color:'#6b85a8',fontSize:'12px',margin:0,fontWeight:'500' }}>Stritgrad Contact Centre · Call Center CRM</p>
            </div>
          </div>

          <div style={{ display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap' }}>
            {sessionCalls > 0 && (
              <button onClick={() => setShowLeaderboard(true)}
                style={{ display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:'rgba(240,180,41,0.12)',color:'#f0b429',border:'1px solid rgba(240,180,41,0.3)',borderRadius:'12px',cursor:'pointer',fontWeight:'700',fontSize:'13px',boxShadow:'0 0 16px rgba(240,180,41,0.2)' }}>
                {icons.trophy} {sessionSales} sales · {sessionCalls} calls
              </button>
            )}
            <button onClick={() => setShowImporter(true)}
              style={{ display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px',background:'rgba(72,149,239,0.12)',color:'#4895ef',border:'1px solid rgba(72,149,239,0.25)',borderRadius:'12px',cursor:'pointer',fontWeight:'700',fontSize:'13px' }}>
              {icons.upload} Import CSV
            </button>
            <button onClick={() => setShowForm(true)}
              style={{ display:'flex',alignItems:'center',gap:'8px',padding:'12px 22px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontWeight:'700',fontSize:'14px',boxShadow:'0 6px 20px rgba(255,107,43,0.4)' }}>
              {icons.plus} Add Lead
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex:1,overflowY:'auto',padding:'28px' }}>

          {/* SCRIPTS PAGE */}
          {activeNav === 'scripts' && (
            <div>
              <h2 style={{ color:'#fff',fontSize:'20px',fontWeight:'800',marginBottom:'20px' }}>Call Scripts</h2>
              {scripts.length === 0
                ? <div style={{ ...glass(),color:'#6b85a8',padding:'50px',textAlign:'center' }}>No scripts yet. Ask your admin to add some.</div>
                : <div style={{ display:'grid',gap:'16px',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))' }}>
                    {scripts.map(s => (
                      <div key={s.id} style={{ ...glass(),padding:'22px',borderLeft:'3px solid #ff6b2b' }}>
                        <h3 style={{ color:'#fff',fontWeight:'700',marginBottom:'10px' }}>{s.title}</h3>
                        <p style={{ color:'#9bb3d1',fontSize:'14px',lineHeight:1.6 }}>{s.content}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* NOTES PAGE */}
          {activeNav === 'notes' && (
            <div>
              <h2 style={{ color:'#fff',fontSize:'20px',fontWeight:'800',marginBottom:'20px' }}>All Notes</h2>
              {allNotes.length === 0
                ? <div style={{ ...glass(),color:'#6b85a8',padding:'50px',textAlign:'center' }}>No notes yet. Add notes from any lead card.</div>
                : <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
                    {allNotes.map(note => (
                      <div key={note.id} style={{ ...glass(),padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px' }}>
                            <span style={{ color:'#ff8c4b',fontWeight:'700',fontSize:'14px' }}>{note.contact_name}</span>
                            <span style={{ color:'#6b85a8',fontSize:'12px' }}>{note.contact_phone}</span>
                          </div>
                          <p style={{ color:'#e2e8f0',fontSize:'14px',marginBottom:'8px',lineHeight:1.5 }}>{note.content}</p>
                          <span style={{ color:'#6b85a8',fontSize:'11px' }}>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleDeleteNote(note.id)}
                          style={{ background:'rgba(224,112,112,0.1)',border:'1px solid rgba(224,112,112,0.2)',borderRadius:'8px',padding:'8px',color:'#e07070',cursor:'pointer',flexShrink:0 }}>
                          {icons.trash}
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* DASHBOARD / LEADS PAGE */}
          {(activeNav === 'dashboard' || activeNav === 'leads') && (
            <>
              {/* Stage filter tabs */}
              <div style={{ display:'flex',gap:'10px',marginBottom:'24px',flexWrap:'wrap' }}>
                {['ALL', ...leadStages].map(stage => (
                  <button key={stage} onClick={() => setSelectedStage(stage)}
                    style={{ padding:'10px 20px',borderRadius:'12px',cursor:'pointer',fontWeight:'700',fontSize:'13px',transition:'all 0.2s',letterSpacing:'0.3px',background:selectedStage===stage?'linear-gradient(135deg,#ff6b2b,#e0531a)':'rgba(255,255,255,0.04)',color:selectedStage===stage?'#fff':'#9bb3d1',border:selectedStage===stage?'none':'1px solid rgba(255,255,255,0.08)',boxShadow:selectedStage===stage?'0 4px 16px rgba(255,107,43,0.35)':'none' }}>
                    {stage === 'ALL' ? 'ALL LEADS' : stage}
                  </button>
                ))}
              </div>

              {/* Stat cards */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'28px' }}>
                {leadStages.map(stage => {
                  const count = contacts.filter(c => c.lead_stage === stage).length;
                  const s = STAGE_STYLES[stage];
                  return (
                    <div key={stage} style={{ ...glass(),padding:'20px 22px',position:'relative',overflow:'hidden',cursor:'pointer' }}
                      onClick={() => setSelectedStage(stage)}>
                      <div style={{ position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${s.glow},transparent)`,borderRadius:'16px 16px 0 0' }}/>
                      <div style={{ position:'absolute',top:'-30px',right:'-30px',width:'100px',height:'100px',borderRadius:'50%',background:s.glow,opacity:0.18,filter:'blur(24px)' }}/>
                      <div style={{ color:s.text,fontSize:'11px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px' }}>{stage}</div>
                      <div style={{ color:'#fff',fontSize:'34px',fontWeight:'800',lineHeight:1,textShadow:`0 0 20px ${s.glow}66` }}>{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Leads grid */}
              {filteredContacts.length === 0 ? (
                <div style={{ ...glass(),textAlign:'center',padding:'70px 40px',color:'#6b85a8' }}>
                  <div style={{ fontSize:'40px',marginBottom:'14px' }}>📋</div>
                  <div style={{ color:'#9bb3d1',fontWeight:'600',fontSize:'16px',marginBottom:'8px' }}>No leads in this category yet.</div>
                  <div style={{ marginTop:'20px' }}>
                    <button onClick={() => setShowImporter(true)}
                      style={{ padding:'12px 24px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontWeight:'700',fontSize:'14px',boxShadow:'0 4px 16px rgba(255,107,43,0.4)',display:'inline-flex',alignItems:'center',gap:'8px' }}>
                      {icons.upload} Import Leads from CSV
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:'20px' }}>
                  {filteredContacts.map(c => {
                    const ss = STAGE_STYLES[c.lead_stage] || STAGE_STYLES['NEW LEADS'];
                    return (
                      <div key={c.id} style={{ ...glass(),padding:'22px',position:'relative',overflow:'hidden',transition:'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${ss.glow}33`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.35)'; }}>

                        {/* Top colour stripe */}
                        <div style={{ position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${ss.glow},transparent)` }}/>
                        {/* Corner glow */}
                        <div style={{ position:'absolute',top:'-20px',right:'-20px',width:'80px',height:'80px',borderRadius:'50%',background:ss.glow,opacity:0.14,filter:'blur(18px)',pointerEvents:'none' }}/>

                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px' }}>
                          <div style={{ flex:1,minWidth:0,paddingRight:'10px' }}>
                            <h3 style={{ color:'#fff',fontWeight:'700',fontSize:'16px',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</h3>
                            <p style={{ color:'#6b85a8',fontSize:'13px',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.company}</p>
                          </div>
                          <span style={{ background:ss.badgeBg,color:ss.text,border:`1px solid ${ss.badgeBorder}`,fontSize:'10px',fontWeight:'800',padding:'5px 11px',borderRadius:'20px',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap',flexShrink:0 }}>
                            {c.lead_stage}
                          </span>
                        </div>

                        <div style={{ marginBottom:'18px',display:'flex',flexDirection:'column',gap:'6px' }}>
                          <div style={{ color:'#9bb3d1',fontSize:'13px',display:'flex',alignItems:'center',gap:'8px' }}>📞 {c.phone}</div>
                          <div style={{ color:'#9bb3d1',fontSize:'13px',display:'flex',alignItems:'center',gap:'8px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>✉️ {c.email}</div>
                        </div>

                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
                          {/* 🎙️ Record Call — opens recorder + disposition board */}
                          <button onClick={() => setCallingContact(c)}
                            style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'11px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'700',fontSize:'13px',boxShadow:'0 4px 14px rgba(255,107,43,0.4)' }}>
                            🎙️ Record Call
                          </button>
                          <button onClick={() => handleViewDetails(c)}
                            style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'11px',background:'rgba(72,149,239,0.1)',color:'#4895ef',border:'1px solid rgba(72,149,239,0.25)',borderRadius:'10px',cursor:'pointer',fontWeight:'700',fontSize:'13px' }}>
                            {icons.view} View
                          </button>
                          <button onClick={() => openNotes(c)}
                            style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'11px',background:'rgba(255,255,255,0.04)',color:'#e2e8f0',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'13px' }}>
                            {icons.noteSmall} Notes
                          </button>
                          <button onClick={() => handleEdit(c)}
                            style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'11px',background:'rgba(255,255,255,0.04)',color:'#9bb3d1',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',cursor:'pointer',fontSize:'13px' }}>
                            {icons.edit} Edit
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            style={{ gridColumn:'span 2',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px',background:'rgba(224,112,112,0.08)',color:'#e07070',border:'1px solid rgba(224,112,112,0.2)',borderRadius:'10px',cursor:'pointer',fontSize:'13px',fontWeight:'600' }}>
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

          {/* SETTINGS PAGE */}
          {activeNav === 'settings' && (
            <div style={{ maxWidth:'500px' }}>
              <h2 style={{ color:'#fff',fontSize:'20px',fontWeight:'800',marginBottom:'20px' }}>Account Settings</h2>
              <div style={{ ...glass(),padding:'26px' }}>
                <label style={{ display:'block',color:'#6b85a8',fontSize:'12px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'12px' }}>Display Name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter display name" style={inputStyle}/>
                <p style={{ color:'#6b85a8',fontSize:'12px',marginBottom:'20px' }}>Separate from your login username (<strong style={{ color:'#9bb3d1' }}>{user.username}</strong>).</p>
                <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                  <button onClick={handleSaveDisplayName} disabled={savingName}
                    style={{ padding:'12px 26px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:savingName?'default':'pointer',fontWeight:'700',fontSize:'14px',opacity:savingName?0.7:1,boxShadow:'0 4px 16px rgba(255,107,43,0.35)' }}>
                    {savingName?'Saving...':'Save Changes'}
                  </button>
                  {nameSaved && <span style={{ color:'#52b788',fontSize:'13px',fontWeight:'700' }}>✓ Saved</span>}
                </div>
              </div>
              <div style={{ ...glass(),padding:'26px',marginTop:'20px' }}>
                <label style={{ display:'block',color:'#6b85a8',fontSize:'12px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'12px' }}>Change Username</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="New username" style={inputStyle}/>
                <input type="password" value={usernamePassword} onChange={e => setUsernamePassword(e.target.value)} placeholder="Current password to confirm" style={inputStyle}/>
                <div style={{ display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
                  <button onClick={handleChangeUsername} disabled={savingUsername}
                    style={{ padding:'12px 26px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:savingUsername?'default':'pointer',fontWeight:'700',fontSize:'14px',opacity:savingUsername?0.7:1,boxShadow:'0 4px 16px rgba(255,107,43,0.35)' }}>
                    {savingUsername?'Updating...':'Update Username'}
                  </button>
                  {usernameMessage && <span style={{ color:usernameMessage.type==='success'?'#52b788':'#e07070',fontSize:'13px',fontWeight:'700' }}>{usernameMessage.text}</span>}
                </div>
              </div>
              <div style={{ ...glass(),padding:'26px',marginTop:'20px' }}>
                <label style={{ display:'block',color:'#6b85a8',fontSize:'12px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'16px' }}>Change Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" style={inputStyle}/>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={inputStyle}/>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={{ ...inputStyle,marginBottom:'16px' }}/>
                <div style={{ display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
                  <button onClick={handleChangePassword} disabled={savingPassword}
                    style={{ padding:'12px 26px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:savingPassword?'default':'pointer',fontWeight:'700',fontSize:'14px',opacity:savingPassword?0.7:1,boxShadow:'0 4px 16px rgba(255,107,43,0.35)' }}>
                    {savingPassword?'Updating...':'Update Password'}
                  </button>
                  {passwordMessage && <span style={{ color:passwordMessage.type==='success'?'#52b788':'#e07070',fontSize:'13px',fontWeight:'700' }}>{passwordMessage.text}</span>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(5,10,20,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(6px)' }}>
          <div style={{ ...glass(),padding:'32px',width:'100%',maxWidth:'460px',maxHeight:'90vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px' }}>
              <h2 style={{ color:'#fff',fontWeight:'800',fontSize:'19px',margin:0 }}>{editingContact?'Edit Lead':'New Lead'}</h2>
              <button onClick={handleCloseForm} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',color:'#9bb3d1',cursor:'pointer',padding:'6px' }}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[{key:'name',placeholder:'Full Name *',type:'text',required:true},{key:'company',placeholder:'Company',type:'text'},{key:'email',placeholder:'Email',type:'email'},{key:'phone',placeholder:'Phone *',type:'tel',required:true}].map(f => (
                <input key={f.key} type={f.type} placeholder={f.placeholder} required={f.required||false} style={inputStyle} value={formData[f.key]} onChange={e => setFormData({...formData,[f.key]:e.target.value})}/>
              ))}
              <select style={inputStyle} value={formData.lead_stage} onChange={e => setFormData({...formData,lead_stage:e.target.value})}>
                {leadStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Notes" rows="3" style={{...inputStyle,resize:'vertical'}} value={formData.notes} onChange={e => setFormData({...formData,notes:e.target.value})}/>
              <div style={{ display:'flex',gap:'12px',justifyContent:'flex-end',marginTop:'8px' }}>
                <button type="button" onClick={handleCloseForm} style={{ padding:'12px 24px',background:'rgba(255,255,255,0.05)',color:'#9bb3d1',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',cursor:'pointer',fontWeight:'700' }}>Cancel</button>
                <button type="submit" style={{ padding:'12px 24px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'700',boxShadow:'0 4px 16px rgba(255,107,43,0.4)' }}>{editingContact?'Update':'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ── */}
      {viewingContact && (
        <div style={{ position:'fixed',inset:0,background:'rgba(5,10,20,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(6px)' }}>
          <div style={{ ...glass(),padding:'32px',width:'100%',maxWidth:'580px',maxHeight:'85vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px' }}>
              <div>
                <h2 style={{ color:'#fff',fontWeight:'800',fontSize:'21px',margin:'0 0 4px' }}>{viewingContact.name}</h2>
                <p style={{ color:'#6b85a8',fontSize:'13px',margin:0 }}>{viewingContact.company}</p>
              </div>
              <button onClick={() => setViewingContact(null)} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',color:'#9bb3d1',cursor:'pointer',padding:'6px' }}>{icons.close}</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'20px' }}>
              {[{label:'Phone',value:viewingContact.phone},{label:'Email',value:viewingContact.email},{label:'Stage',value:viewingContact.lead_stage,highlight:true}].map(item => (
                <div key={item.label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'14px 16px' }}>
                  <div style={{ color:'#6b85a8',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'6px' }}>{item.label}</div>
                  <div style={{ color:item.highlight?'#ff8c4b':'#fff',fontWeight:'700',fontSize:'13px',wordBreak:'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {viewingContact.notes && (
              <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'14px 16px',marginBottom:'20px' }}>
                <div style={{ color:'#6b85a8',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'6px' }}>Notes</div>
                <div style={{ color:'#fff',fontSize:'14px',lineHeight:1.6 }}>{viewingContact.notes}</div>
              </div>
            )}
            <button onClick={() => { setCallingContact(viewingContact); setViewingContact(null); }}
              style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'14px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'12px',cursor:'pointer',fontWeight:'800',fontSize:'15px',marginBottom:'24px',boxShadow:'0 6px 20px rgba(255,107,43,0.45)' }}>
              🎙️ Record Call — {viewingContact.name}
            </button>
            <h3 style={{ color:'#fff',fontWeight:'800',fontSize:'15px',marginBottom:'14px' }}>Call History</h3>
            {viewingContact.activities?.length > 0
              ? <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                  {viewingContact.activities.map(a => (
                    <div key={a.id} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'14px 16px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'6px' }}>
                        <span style={{ color:a.direction==='inbound'?'#ff8c4b':'#52b788',fontWeight:'700',fontSize:'13px' }}>{a.direction==='inbound'?'📞 Inbound':'📞 Outbound'}</span>
                        <span style={{ color:'#6b85a8',fontSize:'12px' }}>{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color:'#fff',fontSize:'13px' }}>Duration: {formatDuration(a.duration||0)}</div>
                      {a.notes && <div style={{ color:'#9bb3d1',fontSize:'13px',marginTop:'4px' }}>{a.notes}</div>}
                    </div>
                  ))}
                </div>
              : <div style={{ color:'#6b85a8',textAlign:'center',padding:'24px',background:'rgba(255,255,255,0.03)',borderRadius:'12px' }}>No call history yet.</div>
            }
          </div>
        </div>
      )}

      {/* ── NOTES MODAL ── */}
      {notesContact && (
        <div style={{ position:'fixed',inset:0,background:'rgba(5,10,20,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(6px)' }}>
          <div style={{ ...glass(),padding:'32px',width:'100%',maxWidth:'520px',maxHeight:'85vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px' }}>
              <div>
                <h2 style={{ color:'#fff',fontWeight:'800',fontSize:'19px',margin:'0 0 4px' }}>Notes — {notesContact.name}</h2>
                <p style={{ color:'#6b85a8',fontSize:'12px',margin:0 }}>{notesContact.phone}</p>
              </div>
              <button onClick={() => setNotesContact(null)} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',color:'#9bb3d1',cursor:'pointer',padding:'6px' }}>{icons.close}</button>
            </div>
            <div style={{ display:'flex',gap:'10px',marginBottom:'20px' }}>
              <textarea placeholder="Write a note about this lead..." rows="2" style={{...inputStyle,marginBottom:0,resize:'vertical',flex:1}} value={newNote} onChange={e => setNewNote(e.target.value)}/>
              <button onClick={handleAddNote} disabled={savingNote||!newNote.trim()}
                style={{ padding:'0 22px',background:'linear-gradient(135deg,#ff6b2b,#e0531a)',color:'#fff',border:'none',borderRadius:'10px',cursor:savingNote?'default':'pointer',fontWeight:'700',fontSize:'14px',opacity:(savingNote||!newNote.trim())?0.6:1,boxShadow:'0 4px 16px rgba(255,107,43,0.35)' }}>
                Add
              </button>
            </div>
            {contactNotes.length === 0
              ? <div style={{ color:'#6b85a8',textAlign:'center',padding:'24px',background:'rgba(255,255,255,0.03)',borderRadius:'12px' }}>No notes for this lead yet.</div>
              : <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                  {contactNotes.map(note => (
                    <div key={note.id} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'14px 16px',display:'flex',justifyContent:'space-between',gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <p style={{ color:'#e2e8f0',fontSize:'14px',marginBottom:'6px',lineHeight:1.5 }}>{note.content}</p>
                        <span style={{ color:'#6b85a8',fontSize:'11px' }}>{note.agent_name||note.username} · {new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteNote(note.id)} style={{ background:'rgba(224,112,112,0.1)',border:'1px solid rgba(224,112,112,0.2)',borderRadius:'8px',padding:'6px',color:'#e07070',cursor:'pointer',flexShrink:0,height:'fit-content' }}>{icons.trash}</button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── NEW FEATURE MODALS ── */}
      {showImporter && (
        <CSVImporter onClose={() => setShowImporter(false)} onImported={fetchContacts} leadStages={leadStages} />
      )}
      {callingContact && (
        <CallRecorderModal contact={callingContact} user={user} onClose={() => setCallingContact(null)} onCallLogged={handleCallLogged} />
      )}
      {showLeaderboard && (
        <Leaderboard log={dispLog} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}

export default AgentDashboard;
