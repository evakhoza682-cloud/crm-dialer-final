import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

// ── COLOURS ──────────────────────────────────────────────────────────────────
const NAVY   = '#0a1628';
const BLUE   = '#1a5fb4';   // deep electric blue — borders, accents
const BLUE2  = '#1e6fc2';   // slightly lighter blue — hover states
const ORANGE = '#ff6b2b';   // PRIMARY action colour — buttons only
const ORANGE2= '#e55a1a';   // orange hover
const GREEN  = '#22c55e';  // used only for success indicators
const RED    = '#dc2626';   // danger / DNC only
const GOLD   = '#d4a017';   // points / leaderboard only — muted gold
const TEXT   = '#dce8f5';   // primary text — blue-white, not bright white
const SUB    = '#7a9ab8';   // secondary text
const MUTED  = '#3d5570';   // muted / disabled
const PANEL  = 'rgba(10,20,38,0.9)';
const BORDER = 'rgba(255,255,255,0.06)';

// ── STAGE CONFIG ─────────────────────────────────────────────────────────────
const STAGES = ['NEW LEADS','WARM LEADS','HOT LEADS','RECYCLED LEADS'];
const STAGE_CFG = {
  'NEW LEADS':      { color: '#7a9ab8', bg: 'rgba(122,154,184,0.1)',  border: 'rgba(122,154,184,0.25)', dot: '#8faac8' },
  'WARM LEADS':     { color: BLUE2,     bg: 'rgba(30,111,194,0.12)',  border: 'rgba(30,111,194,0.3)',   dot: '#4a8fd4' },
  'HOT LEADS':      { color: ORANGE,    bg: 'rgba(255,107,43,0.12)',  border: 'rgba(255,107,43,0.3)',   dot: '#ff6b2b' },
  'RECYCLED LEADS': { color: '#3d5570', bg: 'rgba(61,85,112,0.15)',   border: 'rgba(61,85,112,0.3)',    dot: '#4a6080' },
};

// ── SET C DISPOSITIONS (14 outcomes for marketing call centre) ───────────────
const DISPOSITIONS = [
  { id:'appt_booked',    emoji:'✅', label:'Appointment Booked',      color:ORANGE,  bg:'rgba(255,107,43,0.1)',  nextStage:'HOT LEADS',      points:20, whatsapp:true  },
  { id:'wa_sent',        emoji:'📱', label:'WhatsApp Info Sent',       color:ORANGE,  bg:'rgba(255,107,43,0.08)', nextStage:'WARM LEADS',     points:8,  whatsapp:true  },
  { id:'callback',       emoji:'📅', label:'Callback Scheduled',       color:BLUE2,   bg:'rgba(30,111,194,0.1)',  nextStage:'WARM LEADS',     points:6,  whatsapp:false },
  { id:'interested',     emoji:'👍', label:'Interested — Follow Up',   color:BLUE2,   bg:'rgba(30,111,194,0.1)',  nextStage:'WARM LEADS',     points:5,  whatsapp:false },
  { id:'considering',    emoji:'😐', label:'Considering — Not Ready',  color:'#7a9ab8',bg:'rgba(122,154,184,0.08)',nextStage:'WARM LEADS',    points:3,  whatsapp:false },
  { id:'no_answer_1',    emoji:'📵', label:'No Answer (1st)',          color:MUTED,   bg:'rgba(61,85,112,0.1)',   nextStage:null,             points:1,  whatsapp:false },
  { id:'no_answer_2',    emoji:'📵', label:'No Answer (2nd)',          color:MUTED,   bg:'rgba(61,85,112,0.1)',   nextStage:null,             points:1,  whatsapp:false },
  { id:'no_answer_3',    emoji:'📵', label:'No Answer (3rd — Final)', color:RED,     bg:'rgba(220,38,38,0.08)',  nextStage:'RECYCLED LEADS', points:0,  whatsapp:false },
  { id:'voicemail',      emoji:'📲', label:'Voicemail Left',           color:'#7a9ab8',bg:'rgba(122,154,184,0.08)',nextStage:null,            points:2,  whatsapp:false },
  { id:'existing',       emoji:'🔁', label:'Existing Customer',        color:MUTED,   bg:'rgba(61,85,112,0.1)',   nextStage:'RECYCLED LEADS', points:0,  whatsapp:false },
  { id:'not_interested', emoji:'🚫', label:'Not Interested',           color:RED,     bg:'rgba(220,38,38,0.08)',  nextStage:'RECYCLED LEADS', points:0,  whatsapp:false },
  { id:'dnc',            emoji:'⛔', label:'DNC — Do Not Call',        color:RED,     bg:'rgba(220,38,38,0.1)',   nextStage:'RECYCLED LEADS', points:0,  whatsapp:false },
  { id:'wrong_number',   emoji:'🔢', label:'Wrong Number',             color:MUTED,   bg:'rgba(61,85,112,0.08)',  nextStage:'RECYCLED LEADS', points:0,  whatsapp:false },
  { id:'language',       emoji:'🌐', label:'Language Barrier',         color:MUTED,   bg:'rgba(61,85,112,0.08)',  nextStage:'RECYCLED LEADS', points:1,  whatsapp:false },
];

// ── GLASS HELPER ─────────────────────────────────────────────────────────────
const glass = (ex = {}) => ({
  background: PANEL,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${BORDER}`,
  borderRadius: '14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
  ...ex,
});

const lbl = { display:'block', color: MUTED, fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'6px' };
const inp = (ex={}) => ({ width:'100%', padding:'10px 13px', background:'rgba(8,14,28,0.8)', border:`1px solid rgba(26,95,180,0.28)`, borderRadius:'9px', color: TEXT, fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.2s', ...ex });

// ── ICONS ─────────────────────────────────────────────────────────────────────
const IC = {
  dash:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  leads:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  notes:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  scripts: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  settings:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  upload:  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  mic:     <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  trophy:  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="8 3 4 3 4 9"/><polyline points="16 3 20 3 20 9"/><path d="M4 9c0 4.97 3.58 9 8 9s8-4.03 8-9"/><path d="M12 18v3"/><path d="M8 21h8"/></svg>,
  plus:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  eye:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit:    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>,
  trash:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  note:    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  menu:    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  wa:      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  close:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Btn({ label, onClick, disabled, ghost, color, sm, full, icon }) {
  const bg = disabled
    ? 'rgba(255,255,255,0.05)'
    : ghost
      ? 'rgba(255,255,255,0.05)'
      : `linear-gradient(135deg,${color||ORANGE},${color ? color+'cc' : ORANGE2})`;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : undefined,
      padding: sm ? '7px 14px' : '10px 20px',
      background: bg, color: disabled ? MUTED : '#fff',
      border: ghost ? `1px solid rgba(255,255,255,0.1)` : 'none',
      borderRadius: '9px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '700', fontSize: sm ? '12px' : '13px',
      fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center',
      gap: '6px', justifyContent: 'center',
      boxShadow: disabled||ghost ? 'none' : `0 4px 16px ${color||ORANGE}44`,
      transition: 'all 0.2s', opacity: disabled ? 0.6 : 1,
    }}>
      {icon && <span style={{display:'flex'}}>{icon}</span>}
      {label}
    </button>
  );
}

function Overlay({ children, onClose, wide }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(5,10,22,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:200, backdropFilter:'blur(8px)', padding:'16px',
      animation:'fadeIn 0.2s ease',
    }}>
      <div style={{...glass({borderRadius:'16px'}), width:'100%', maxWidth: wide?'740px':'500px', maxHeight:'92vh', overflowY:'auto', animation:'slideUp 0.2s ease'}}>
        {children}
      </div>
    </div>
  );
}

function MHead({ title, sub, onClose }) {
  return (
    <div style={{padding:'20px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div>
        <div style={{color:TEXT, fontWeight:'800', fontSize:'16px'}}>{title}</div>
        {sub && <div style={{color:MUTED, fontSize:'12px', marginTop:'2px'}}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:MUTED, cursor:'pointer', padding:'6px', display:'flex'}}>
        {IC.close}
      </button>
    </div>
  );
}

function StageBadge({ stage }) {
  const cfg = STAGE_CFG[stage] || STAGE_CFG['NEW LEADS'];
  return (
    <span style={{background:cfg.bg, color:cfg.dot, border:`1px solid ${cfg.border}`, fontSize:'9px', fontWeight:'800', padding:'3px 9px', borderRadius:'20px', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap'}}>
      {stage}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: ANIMATED GEOMETRIC LINE BACKGROUND
// Neural-network style — nodes connected by glowing lines, clearly visible
// ══════════════════════════════════════════════════════════════════════════════
function GeoBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, nodes = [], animId;

    // Single-colour palette: blue-white only — no rainbow
    const PALETTE = [
      [140,180,220],  // cool blue-white
      [100,150,200],  // medium blue
      [180,210,240],  // bright blue-white
      [80,130,185],   // deep blue
      [200,220,240],  // near-white blue
    ];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const count = Math.max(50, Math.floor(W * H / 12000));
      nodes = Array.from({length: count}, (_, i) => {
        const col = PALETTE[i % PALETTE.length];
        return {
          x:  Math.random() * W,
          y:  Math.random() * H,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r:  1.0 + Math.random() * 1.5,
          col,
          pulse: Math.random() * Math.PI * 2,
          ps: 0.01 + Math.random() * 0.02,
        };
      });
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, W, H);
      t++;

      // ── Diagonal grid lines (subtle, always visible)
      ctx.save();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(100,160,220,0.055)';
      for (let x = -H; x < W + H; x += 180) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + H, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(100,160,220,0.03)';
      for (let x = 0; x < W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      ctx.restore();

      // ── Move nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += n.ps;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // ── Connection lines (the main neural network effect)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.30;
            // Blend node colours for the line
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(140,190,235,${alpha})`;
            ctx.lineWidth   = alpha * 1.6;
            ctx.stroke();
          }
        }
      }

      // ── Node dots
      nodes.forEach(n => {
        const a = 0.30 + 0.40 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155,198,238,${a})`;
        ctx.fill();
      });

      // ── Scan line
      const scanY = ((t * 0.4) % (H + 80)) - 40;
      const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(120,175,230,0.04)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY, W, 4);
    };

    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} id="geo-bg" style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}} />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: CSV LEAD IMPORTER
// ══════════════════════════════════════════════════════════════════════════════
function CSVImporter({ onClose, onDone, user }) {
  const [step, setStep]   = useState('drop');
  const [hdrs, setHdrs]   = useState([]);
  const [rows, setRows]   = useState([]);
  const [map,  setMap]    = useState({});
  const [prog, setProg]   = useState(0);
  const [done, setDone]   = useState(0);
  const [skipped, setSkipped] = useState(0);
  const fileRef = useRef();

  const FIELDS = [
    {k:'name',       l:'Full Name *',  req:true  },
    {k:'company',    l:'Company',      req:false },
    {k:'email',      l:'Email',        req:false },
    {k:'phone',      l:'Phone *',      req:true  },
    {k:'lead_stage', l:'Stage',        req:false },
    {k:'notes',      l:'Notes',        req:false },
  ];

  const ALIASES = {
    name:       ['name','full name','fullname','client','contact','lead name'],
    company:    ['company','business','organisation','organization','firm','employer'],
    email:      ['email','e-mail','mail','email address'],
    phone:      ['phone','tel','cell','mobile','number','contact number','phone number'],
    lead_stage: ['stage','status','pipeline','lead stage','category'],
    notes:      ['notes','note','comment','description','remarks'],
  };

  const autoDetect = hdrs => {
    const m = {};
    hdrs.forEach(col => {
      const cl = col.toLowerCase().trim();
      for (const [f, als] of Object.entries(ALIASES)) {
        if (!m[f] && als.some(a => cl.includes(a))) { m[f] = col; break; }
      }
    });
    return m;
  };

  const parseCSV = txt => {
    const lines = txt.trim().split(/\r?\n/);
    const h = lines[0].split(',').map(x => x.replace(/^"|"$/g, '').trim());
    const r = lines.slice(1).map(line => {
      const cols = []; let cur = '', inQ = false;
      for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());
      const obj = {};
      h.forEach((hh, i) => obj[hh] = (cols[i] || '').replace(/^"|"$/g, ''));
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { h, r };
  };

  const loadFile = file => {
    if (!file) return;
    if (!['csv','txt'].includes(file.name.split('.').pop().toLowerCase())) {
      alert('Please upload a CSV or TXT file.'); return;
    }
    const rd = new FileReader();
    rd.onload = e => {
      try {
        const { h, r } = parseCSV(e.target.result);
        setHdrs(h); setRows(r); setMap(autoDetect(h)); setStep('map');
      } catch { alert('Could not parse file. Make sure it is a valid CSV.'); }
    };
    rd.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = [
      'Name,Company,Email,Phone,Stage,Notes',
      'Jane Smith,Acme Ltd,jane@acme.co.za,+27820000000,NEW LEADS,Interested in solar packages',
      'Thabo Dube,TechCo,thabo@tech.co.za,+27711112222,HOT LEADS,Ready to book appointment',
      'Sara Nkosi,,sara@gmail.com,+27831234567,WARM LEADS,Called back twice',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'stritgrad-leads-template.csv';
    a.click();
  };

  const runImport = async () => {
    setStep('importing');
    let count = 0, skip = 0;
    for (let i = 0; i < rows.length; i++) {
      const r    = rows[i];
      const name = map.name ? (r[map.name]||'').trim() : '';
      if (!name) { skip++; setProg(Math.round((i+1)/rows.length*100)); continue; }
      const stg  = map.lead_stage ? r[map.lead_stage] : '';
      try {
        await axios.post(`${API}/api/contacts`, {
          name,
          company:    map.company ? r[map.company]||''  : '',
          email:      map.email   ? r[map.email]||''    : '',
          phone:      map.phone   ? r[map.phone]||''    : '',
          lead_stage: STAGES.includes(stg) ? stg : 'NEW LEADS',
          notes:      map.notes   ? r[map.notes]||''    : '',
          assigned_to: user.id, created_by: user.id,
        });
        count++;
      } catch { skip++; }
      setProg(Math.round((i+1)/rows.length*100));
      await new Promise(res => setTimeout(res, 15));
    }
    setDone(count); setSkipped(skip); setStep('done'); onDone();
  };

  return (
    <Overlay onClose={onClose} wide>
      <MHead
        title="📥 Import Leads from CSV"
        sub={step==='drop' ? 'Upload your existing leads file' : step==='map' ? `${rows.length} leads detected — confirm column mapping` : step==='importing' ? 'Importing leads into your pipeline…' : `Import complete`}
        onClose={onClose}
      />
      <div style={{padding:'24px', maxHeight:'68vh', overflowY:'auto'}}>

        {/* STEP 1 — DROP ZONE */}
        {step === 'drop' && <>
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}
            style={{border:`2px dashed rgba(255,107,43,0.55)`, borderRadius:'14px', padding:'52px 24px', textAlign:'center', cursor:'pointer', background:'rgba(255,107,43,0.03)', marginBottom:'16px', transition:'all 0.2s'}}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,107,43,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,107,43,0.03)'}
          >
            <div style={{fontSize:'46px', marginBottom:'14px'}}>☁️</div>
            <div style={{color:TEXT, fontWeight:'700', fontSize:'16px', marginBottom:'6px'}}>Drag & drop your leads file here</div>
            <div style={{color:MUTED, fontSize:'13px', marginBottom:'16px'}}>or click anywhere in this box to browse your computer</div>
            <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
              {['CSV','TXT','Tab-delimited'].map(f => (
                <span key={f} style={{padding:'4px 12px', borderRadius:'20px', background:'rgba(255,107,43,0.14)', color:'#ff8c4b', fontSize:'12px', fontWeight:'600', border:'1px solid rgba(255,107,43,0.3)'}}>{f}</span>
              ))}
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={e => loadFile(e.target.files[0])} />
          </div>
          <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
            <Btn label="📄 Download Template" onClick={downloadTemplate} ghost sm icon={IC.upload} />
            <span style={{color:MUTED, fontSize:'12px'}}>CSV template with all required columns pre-filled</span>
          </div>
        </>}

        {/* STEP 2 — COLUMN MAPPING */}
        {step === 'map' && <>
          <div style={{background:'rgba(26,95,180,0.08)', border:`1px solid rgba(26,95,180,0.2)`, borderRadius:'10px', padding:'12px 16px', marginBottom:'18px'}}>
            <div style={{color:'#60a5fa', fontSize:'12px', fontWeight:'600'}}>
              ✅ We auto-detected your columns below. Adjust any that are wrong, then click Import.
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'18px'}}>
            {FIELDS.map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.l}</label>
                <select
                  value={map[f.k]||''}
                  onChange={e => setMap(p => ({...p, [f.k]: e.target.value}))}
                  style={{...inp(), borderColor: f.req && !map[f.k] ? 'rgba(239,68,68,0.6)' : 'rgba(26,95,180,0.28)', marginBottom:0}}
                >
                  <option value="">— Skip this field —</option>
                  {hdrs.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {f.req && !map[f.k] && <div style={{color:'#f87171', fontSize:'10px', marginTop:'3px'}}>Required</div>}
              </div>
            ))}
          </div>
          {/* Preview table */}
          <div style={{border:`1px solid ${BORDER}`, borderRadius:'10px', overflow:'auto', maxHeight:'150px', marginBottom:'18px'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
              <thead>
                <tr style={{background:'rgba(255,107,43,0.06)'}}>
                  {hdrs.map(h => <th key={h} style={{padding:'8px 10px', textAlign:'left', color:MUTED, fontWeight:'700', borderBottom:`1px solid ${BORDER}`, whiteSpace:'nowrap'}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,4).map((r,i) => (
                  <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                    {hdrs.map(h => <td key={h} style={{padding:'7px 10px', color:SUB}}>{r[h]||'—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{color:MUTED, fontSize:'13px'}}>{rows.length} leads ready to import</span>
            <div style={{display:'flex', gap:'10px'}}>
              <Btn label="← Back" onClick={() => setStep('drop')} ghost sm />
              <Btn label={`⬆️ Import ${rows.length} Leads`} onClick={runImport} disabled={!map.name} />
            </div>
          </div>
        </>}

        {/* STEP 3 — PROGRESS */}
        {step === 'importing' && (
          <div style={{textAlign:'center', padding:'44px 0'}}>
            <div style={{fontSize:'44px', marginBottom:'16px'}}>⏳</div>
            <div style={{color:TEXT, fontWeight:'700', fontSize:'16px', marginBottom:'24px'}}>Importing your leads into the pipeline…</div>
            <div style={{height:'12px', background:'rgba(255,255,255,0.06)', borderRadius:'6px', overflow:'hidden', maxWidth:'380px', margin:'0 auto'}}>
              <div style={{height:'100%', width:`${prog}%`, background:`linear-gradient(90deg,${ORANGE},${GOLD})`, borderRadius:'6px', transition:'width 0.3s ease', boxShadow:`0 0 14px rgba(255,107,43,0.6)`}} />
            </div>
            <div style={{marginTop:'12px', color:MUTED, fontSize:'13px'}}>{prog}% — please wait</div>
          </div>
        )}

        {/* STEP 4 — DONE */}
        {step === 'done' && (
          <div style={{textAlign:'center', padding:'44px 0'}}>
            <div style={{fontSize:'52px', marginBottom:'16px'}}>🎉</div>
            <div style={{color:TEXT, fontWeight:'800', fontSize:'24px', marginBottom:'8px'}}>{done} Leads Imported!</div>
            {skipped > 0 && <div style={{color:MUTED, fontSize:'13px', marginBottom:'8px'}}>{skipped} rows skipped (missing name or phone)</div>}
            <div style={{color:SUB, marginBottom:'28px', fontSize:'14px'}}>Your leads are live in the pipeline. Start dialling!</div>
            <Btn label="✅ Go to My Leads" onClick={onClose} color={GREEN} />
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: CALL RECORDER
// ══════════════════════════════════════════════════════════════════════════════
function CallRecorder({ contact, user, onClose, onLogged }) {
  const [status,   setStatus]   = useState('idle');
  const [secs,     setSecs]     = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [disp,     setDisp]     = useState(null);
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [showWA,   setShowWA]   = useState(false);
  const mrRef    = useRef(); const chunksRef = useRef([]);
  const timerRef = useRef(); const streamRef = useRef();
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mrRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setAudioURL(URL.createObjectURL(new Blob(chunksRef.current, {type:'audio/webm'})));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); setStatus('rec'); setSecs(0);
      timerRef.current = setInterval(() => setSecs(s => s+1), 1000);
    } catch { alert('Microphone access denied. Please allow microphone access in your browser settings.'); }
  };

  const stopRec = () => { mrRef.current?.stop(); clearInterval(timerRef.current); setStatus('stopped'); };

  const handleDispSelect = d => {
    setDisp(d.id);
    if (d.whatsapp) setTimeout(() => setShowWA(true), 300);
  };

  const saveCall = async () => {
    if (!disp) { alert('Please select a call outcome before saving.'); return; }
    setSaving(true);
    const d = DISPOSITIONS.find(x => x.id === disp);
    try {
      await axios.post(`${API}/api/contacts/${contact.id}/activities`, {
        user_id: user.id,
        type:'call', direction:'outbound',
        notes: `[${d.emoji} ${d.label}] ${notes}`.trim(),
        duration: secs,
      });
      if (d.nextStage) {
        await axios.put(`${API}/api/contacts/${contact.id}`, {
          ...contact, lead_stage: d.nextStage,
          assigned_to: user.id, created_by: user.id,
        });
      }
      onLogged(d, contact);
      onClose();
    } catch { alert('Failed to save call log. Please try again.'); setSaving(false); }
  };

  const selDisp = DISPOSITIONS.find(x => x.id === disp);

  if (showWA) {
    return <WhatsAppForm contact={contact} disposition={selDisp} notes={notes} onBack={() => setShowWA(false)} onDone={() => { saveCall(); }} />;
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{background:`linear-gradient(135deg,rgba(255,107,43,0.18),rgba(255,107,43,0.04))`, padding:'20px 24px', borderBottom:`1px solid rgba(255,107,43,0.2)`, display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'16px 16px 0 0'}}>
        <div>
          <div style={{color:TEXT, fontWeight:'800', fontSize:'16px'}}>🎙️ Record Call — {contact.name}</div>
          <div style={{color:MUTED, fontSize:'12px', marginTop:'3px'}}>{contact.phone}{contact.company ? ` · ${contact.company}` : ''}</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:MUTED, cursor:'pointer', padding:'6px', display:'flex'}}>{IC.close}</button>
      </div>

      <div style={{padding:'22px'}}>
        {/* Timer */}
        <div style={{textAlign:'center', marginBottom:'22px', padding:'20px', background: status==='rec' ? 'rgba(255,107,43,0.08)' : 'rgba(255,255,255,0.025)', borderRadius:'14px', border:`1px solid ${status==='rec' ? 'rgba(255,107,43,0.35)' : BORDER}`}}>
          <div style={{fontSize:'42px', fontWeight:'800', fontFamily:'monospace', color: status==='rec' ? ORANGE : TEXT, letterSpacing:'4px', marginBottom:'12px'}}>
            {fmt(secs)}
          </div>
          {status === 'rec' && (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'12px'}}>
              <span style={{width:'10px', height:'10px', borderRadius:'50%', background:ORANGE, animation:'pulse 1s infinite', boxShadow:`0 0 10px ${ORANGE}`}}/>
              <span style={{color:ORANGE, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em'}}>RECORDING LIVE</span>
            </div>
          )}
          <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
            {status === 'idle'    && <Btn label="🎙️ Start Recording" onClick={startRec} />}
            {status === 'rec'     && <Btn label="⏹ Stop Recording"  onClick={stopRec}  ghost />}
            {status === 'stopped' && <Btn label="🔄 Re-record" onClick={startRec} ghost sm />}
          </div>
          {audioURL && (
            <div style={{marginTop:'16px'}}>
              <audio controls src={audioURL} style={{width:'100%', borderRadius:'8px', height:'38px'}} />
              <a href={audioURL} download={`call-${contact.name.replace(/\s/g,'-')}-${new Date().toISOString().slice(0,10)}.webm`}
                style={{display:'inline-block', marginTop:'8px', fontSize:'12px', color:'#60a5fa', fontWeight:'600', textDecoration:'none'}}>
                ⬇️ Download Recording
              </a>
            </div>
          )}
        </div>

        {/* SMART DISPOSITION BOARD */}
        <div style={{marginBottom:'18px'}}>
          <div style={{...lbl, marginBottom:'12px'}}>Call Outcome * — Select one</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px'}}>
            {DISPOSITIONS.map(d => (
              <button key={d.id} onClick={() => handleDispSelect(d)} style={{
                padding:'11px 6px', borderRadius:'11px', cursor:'pointer',
                fontSize:'10px', fontWeight:'700', textAlign:'center', lineHeight:1.4,
                border:`2px solid ${disp===d.id ? d.color : 'rgba(255,255,255,0.07)'}`,
                background: disp===d.id ? d.bg : 'rgba(255,255,255,0.025)',
                color: disp===d.id ? d.color : MUTED,
                boxShadow: disp===d.id ? `0 0 0 3px ${d.color}22, 0 0 18px ${d.color}18` : 'none',
                transition:'all 0.15s',
              }}>
                <div style={{fontSize:'16px', marginBottom:'4px'}}>{d.emoji}</div>
                {d.label}
                {disp===d.id && d.nextStage && <div style={{fontSize:'9px', marginTop:'3px', opacity:0.75}}>→ {d.nextStage}</div>}
                {d.whatsapp && disp===d.id && <div style={{fontSize:'9px', marginTop:'2px', color:ORANGE}}>📱 WhatsApp</div>}
              </button>
            ))}
          </div>
          {selDisp && (
            <div style={{marginTop:'12px', padding:'10px 14px', background: selDisp.whatsapp ? 'rgba(37,211,102,0.08)' : 'rgba(26,95,180,0.08)', border:`1px solid ${selDisp.whatsapp ? 'rgba(37,211,102,0.25)' : 'rgba(26,95,180,0.25)'}`, borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{color: selDisp.whatsapp ? ORANGE : '#60a5fa', fontSize:'12px', fontWeight:'600'}}>
                {selDisp.whatsapp ? '📱 WhatsApp form will open next' : `📌 Lead moves to ${selDisp.nextStage || 'current stage'}`}
              </span>
              <span style={{color:ORANGE, fontWeight:'700', fontSize:'12px'}}>+{selDisp.points} pts</span>
            </div>
          )}
        </div>

        <div style={{marginBottom:'18px'}}>
          <label style={lbl}>Call Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Key points discussed, objections, next steps…" style={{...inp(), resize:'vertical'}} />
        </div>

        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
          <Btn label="Cancel" onClick={onClose} ghost />
          <Btn label={saving ? 'Saving…' : selDisp?.whatsapp ? '📱 Next: WhatsApp →' : '✅ Save Call Log'} onClick={selDisp?.whatsapp ? () => setShowWA(true) : saveCall} disabled={saving || !disp} color={selDisp?.whatsapp ? ORANGE : GREEN} />
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 4: WHATSAPP FORM (for Appointment Booked & Info Sent)
// ══════════════════════════════════════════════════════════════════════════════
function WhatsAppForm({ contact, disposition, notes, onBack, onDone }) {
  const isAppt = disposition?.id === 'appt_booked';
  const [form, setForm] = useState({
    phone:   contact.phone || '',
    name:    contact.name  || '',
    product: '',
    date:    '',
    time:    '',
    agentNotes: notes || '',
  });
  const set = (k,v) => setForm(p => ({...p, [k]:v}));

  const buildMessage = () => {
    const product = form.product || "our client's product/services";
    if (isAppt) {
      return `Hi ${form.name},%0A%0AThank you for speaking with us today! 🌟%0A%0AWe are pleased to confirm your appointment:%0A📅 Date: ${form.date || 'TBC'}%0A⏰ Time: ${form.time || 'TBC'}%0A📦 Regarding: ${product}%0A%0A${form.agentNotes ? `Notes: ${form.agentNotes}%0A%0A` : ''}Should you have any questions, please don't hesitate to contact us.%0A%0AKind regards,%0AStritgrad Contact Centre`;
    }
    return `Hi ${form.name},%0A%0AThank you for your interest! 😊%0A%0AAs discussed, please find below information about ${product}.%0A%0AWe'd love to tell you more — feel free to reply to this message or call us back at your convenience.%0A%0A${form.agentNotes ? `Notes from our agent: ${form.agentNotes}%0A%0A` : ''}Kind regards,%0AStritgrad Contact Centre`;
  };

  const openWhatsApp = () => {
    const number = form.phone.replace(/[^0-9]/g,'').replace(/^0/,'27');
    const msg    = buildMessage();
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };

  const handleSendAndSave = () => {
    openWhatsApp();
    onDone();
  };

  return (
    <Overlay onClose={onBack}>
      <div style={{background:'linear-gradient(135deg,rgba(255,107,43,0.14),rgba(255,107,43,0.03))', padding:'20px 24px', borderBottom:'1px solid rgba(255,107,43,0.18)', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'16px 16px 0 0'}}>
        <div>
          <div style={{color:TEXT, fontWeight:'800', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
            <span style={{color:ORANGE, display:'flex'}}>{IC.wa}</span>
            {isAppt ? 'Send Appointment Confirmation' : 'Send Info via WhatsApp'}
          </div>
          <div style={{color:MUTED, fontSize:'12px', marginTop:'3px'}}>{contact.name} · {contact.phone}</div>
        </div>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:MUTED, cursor:'pointer', padding:'6px', display:'flex'}}>{IC.close}</button>
      </div>

      <div style={{padding:'22px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px'}}>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Lead's WhatsApp Number</label>
            <input style={inp()} value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="+27 82 000 0000" />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Lead's Name (for message)</label>
            <input style={inp()} value={form.name} onChange={e => set('name',e.target.value)} placeholder="Jane Smith" />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Product / Service</label>
            <input style={inp()} value={form.product} onChange={e => set('product',e.target.value)} placeholder="e.g. Solar Package, Insurance Plan, Fibre Deal" />
          </div>
          {isAppt && <>
            <div>
              <label style={lbl}>Appointment Date</label>
              <input type="date" style={inp()} value={form.date} onChange={e => set('date',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Appointment Time</label>
              <input type="time" style={inp()} value={form.time} onChange={e => set('time',e.target.value)} />
            </div>
          </>}
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Additional Notes (optional)</label>
            <textarea rows={2} style={{...inp(), resize:'vertical'}} value={form.agentNotes} onChange={e => set('agentNotes',e.target.value)} placeholder="Any extra details to include in the message…" />
          </div>
        </div>

        {/* Message preview */}
        <div style={{background:'rgba(26,95,180,0.06)', border:'1px solid rgba(26,95,180,0.18)', borderRadius:'12px', padding:'14px 16px', marginBottom:'18px'}}>
          <div style={{color:BLUE2, fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'8px'}}>📱 Message Preview</div>
          <div style={{color:SUB, fontSize:'12px', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace'}}>
            {decodeURIComponent(buildMessage().replace(/%0A/g,'\n'))}
          </div>
        </div>

        <div style={{display:'flex', gap:'10px', justifyContent:'space-between'}}>
          <Btn label="← Back to Call" onClick={onBack} ghost />
          <div style={{display:'flex', gap:'10px'}}>
            <Btn label="Preview in WhatsApp" onClick={openWhatsApp} ghost icon={IC.wa} />
            <Btn label="📱 Send & Save Log" onClick={handleSendAndSave} color="#ff6b2b" icon={IC.wa} />
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 5: MONTHLY AGENT LEADERBOARD
// Resets last day of each month. Keeps monthly history.
// ══════════════════════════════════════════════════════════════════════════════
function Leaderboard({ log, onClose }) {
  const now     = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthName = now.toLocaleString('en-ZA', {month:'long', year:'numeric'});

  // Check if it's month end (last 3 days) — show reset warning
  const daysLeft = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() - now.getDate();
  const nearReset = daysLeft <= 3;

  const tally = log.reduce((acc, e) => {
    const k = e.agent || 'You';
    if (!acc[k]) acc[k] = {name:k, pts:0, calls:0, appts:0, wa:0, callbacks:0};
    acc[k].pts     += e.points;
    acc[k].calls   += 1;
    if (e.id === 'appt_booked') acc[k].appts++;
    if (e.id === 'wa_sent')     acc[k].wa++;
    if (e.id === 'callback')    acc[k].callbacks++;
    return acc;
  }, {});
  const board = Object.values(tally).sort((a,b) => b.pts - a.pts);

  const counts = log.reduce((acc, e) => {
    acc[e.label] = (acc[e.label]||0) + 1; return acc;
  }, {});

  const medals = ['🥇','🥈','🥉'];

  return (
    <Overlay onClose={onClose} wide>
      <div style={{background:'linear-gradient(135deg,rgba(255,107,43,0.08),rgba(255,107,43,0.08))', padding:'22px 28px', borderBottom:'1px solid rgba(255,107,43,0.08)', borderRadius:'16px 16px 0 0'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <div style={{color:ORANGE, fontWeight:'800', fontSize:'20px', marginBottom:'4px'}}>🏆 Agent Leaderboard</div>
            <div style={{color:MUTED, fontSize:'12px'}}>{monthName} · {log.length} calls logged this session</div>
            {nearReset && <div style={{marginTop:'6px', color:ORANGE, fontSize:'12px', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px'}}>⚠️ Board resets in {daysLeft} day{daysLeft!==1?'s':''} — month end!</div>}
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:MUTED, cursor:'pointer', padding:'6px', display:'flex'}}>{IC.close}</button>
        </div>
      </div>

      <div style={{padding:'24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxHeight:'68vh', overflowY:'auto'}}>
        {/* Rankings */}
        <div>
          <div style={{color:TEXT, fontWeight:'700', fontSize:'14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
            <span>{IC.trophy}</span> Rankings — {monthName}
          </div>
          {board.length === 0
            ? <div style={{color:MUTED, textAlign:'center', padding:'36px', background:'rgba(255,255,255,0.025)', borderRadius:'12px'}}>
                <div style={{fontSize:'28px', marginBottom:'8px'}}>📊</div>
                Log your first call to see rankings!
              </div>
            : board.map((a, i) => (
              <div key={a.name} style={{display:'flex', alignItems:'center', gap:'12px', padding:'13px 14px', marginBottom:'8px', background: i===0 ? 'rgba(255,107,43,0.07)' : 'rgba(255,255,255,0.025)', borderRadius:'12px', border:`1px solid ${i===0 ? 'rgba(255,107,43,0.08)' : BORDER}`, transition:'all 0.2s'}}>
                <div style={{fontSize:'22px', width:'30px', textAlign:'center'}}>{medals[i] || `#${i+1}`}</div>
                <div style={{width:'34px', height:'34px', borderRadius:'50%', background:`linear-gradient(135deg,${BLUE},${BLUE2})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'14px', color:'#fff', flexShrink:0}}>
                  {a.name[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{color:TEXT, fontWeight:'700', fontSize:'13px'}}>{a.name}</div>
                  <div style={{color:MUTED, fontSize:'11px', marginTop:'1px'}}>
                    {a.calls} calls · {a.appts} appts · {a.wa} WhatsApps
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:ORANGE, fontWeight:'800', fontSize:'18px'}}>{a.pts}</div>
                  <div style={{color:MUTED, fontSize:'10px'}}>points</div>
                </div>
              </div>
            ))
          }
          {/* Points guide */}
          <div style={{marginTop:'16px', padding:'14px', background:'rgba(26,95,180,0.07)', border:'1px solid rgba(26,95,180,0.18)', borderRadius:'12px'}}>
            <div style={{color:'#60a5fa', fontWeight:'700', fontSize:'12px', marginBottom:'10px'}}>📋 Points Guide</div>
            {DISPOSITIONS.filter(d => d.points > 0).map(d => (
              <div key={d.id} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:MUTED, fontSize:'11px'}}>{d.emoji} {d.label}</span>
                <span style={{color:ORANGE, fontWeight:'700', fontSize:'11px'}}>+{d.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome breakdown */}
        <div>
          <div style={{color:TEXT, fontWeight:'700', fontSize:'14px', marginBottom:'14px'}}>📊 Outcome Breakdown</div>
          {Object.keys(counts).length === 0
            ? <div style={{color:MUTED, textAlign:'center', padding:'36px', background:'rgba(255,255,255,0.025)', borderRadius:'12px'}}>No dispositions logged yet.</div>
            : Object.entries(counts).map(([lbl, cnt]) => {
                const d   = DISPOSITIONS.find(x => x.label === lbl);
                const pct = Math.round(cnt / log.length * 100);
                return (
                  <div key={lbl} style={{marginBottom:'12px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                      <span style={{fontSize:'12px', fontWeight:'600', color: d?.color || TEXT}}>{d?.emoji} {lbl}</span>
                      <span style={{fontSize:'12px', color:MUTED}}>{cnt} ({pct}%)</span>
                    </div>
                    <div style={{height:'8px', background:'rgba(255,255,255,0.05)', borderRadius:'4px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${pct}%`, background: d?.color || ORANGE, borderRadius:'4px', boxShadow:`0 0 8px ${d?.color||ORANGE}55`, transition:'width 0.6s ease'}} />
                    </div>
                  </div>
                );
              })
          }
          {log.length > 0 && (
            <div style={{marginTop:'18px', padding:'16px', background:'rgba(26,95,180,0.06)', border:'1px solid rgba(26,95,180,0.18)', borderRadius:'12px'}}>
              <div style={{color:GREEN, fontWeight:'700', fontSize:'13px', marginBottom:'10px'}}>📈 Session Summary</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {[
                  {l:'Total Calls',    v: log.length,                                        c:TEXT},
                  {l:'Appointments',  v: log.filter(d=>d.id==='appt_booked').length,         c:GREEN},
                  {l:'WhatsApps Sent',v: log.filter(d=>d.id==='wa_sent').length,             c:ORANGE},
                  {l:'Callbacks Set', v: log.filter(d=>d.id==='callback').length,            c:BLUE2},
                  {l:'Total Points',  v: log.reduce((s,d)=>s+d.points,0)+' pts',             c:GOLD},
                  {l:'Month Resets',  v: `${daysLeft} day${daysLeft!==1?'s':''} left`,      c: nearReset?ORANGE:MUTED},
                ].map(x => (
                  <div key={x.l} style={{background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'10px 12px'}}>
                    <div style={{color:MUTED, fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px'}}>{x.l}</div>
                    <div style={{color:x.c, fontWeight:'800', fontSize:'16px'}}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 6: LIVE DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════
function LiveDashboard({ contacts, dispLog }) {
  const stageCounts = STAGES.reduce((a,s) => ({...a, [s]: contacts.filter(c=>c.lead_stage===s).length}), {});
  const totalCalls  = dispLog.length;
  const appts       = dispLog.filter(d=>d.id==='appt_booked').length;
  const waSent      = dispLog.filter(d=>d.id==='wa_sent').length;
  const totalPts    = dispLog.reduce((s,d)=>s+d.points,0);
  const maxStage    = Math.max(1, ...STAGES.map(s=>stageCounts[s]||0));

  const kpis = [
    {label:'TOTAL LEADS',     val: contacts.length,        color:BLUE2,  icon:'👥'},
    {label:'NEW LEADS',       val: stageCounts['NEW LEADS']||0,     color:GREEN,  icon:'🌱'},
    {label:'WARM LEADS',      val: stageCounts['WARM LEADS']||0,    color:BLUE2,  icon:'🔵'},
    {label:'HOT LEADS',       val: stageCounts['HOT LEADS']||0,     color:ORANGE, icon:'🔥'},
    {label:'SESSION CALLS',   val: totalCalls,              color:BLUE2,  icon:'📞'},
    {label:'APPOINTMENTS',    val: appts,                   color:ORANGE, icon:'✅'},
    {label:'WHATSAPPS SENT',  val: waSent,                  color:BLUE2,  icon:'📱'},
    {label:'SESSION POINTS',  val: totalPts,                color:ORANGE, icon:'🏆'},
  ];

  return (
    <div style={{marginBottom:'24px'}}>
      {/* KPI cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px'}}>
        {kpis.slice(0,4).map(k => (
          <div key={k.label} style={{...glass(), padding:'16px 18px', position:'relative', overflow:'hidden', cursor:'default'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${k.color},transparent)`}}/>
            <div style={{position:'absolute', top:'-20px', right:'-20px', width:'70px', height:'70px', borderRadius:'50%', background:k.color, opacity:0.1, filter:'blur(16px)'}}/>
            <div style={{fontSize:'20px', marginBottom:'8px'}}>{k.icon}</div>
            <div style={{color:'#fff', fontSize:'30px', fontWeight:'800', lineHeight:1, textShadow:`0 0 20px ${k.color}55`, animation:'countUp 0.4s ease'}}>{k.val}</div>
            <div style={{color:k.color, fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.7px', marginTop:'6px'}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'18px'}}>
        {kpis.slice(4).map(k => (
          <div key={k.label} style={{...glass(), padding:'14px 16px', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,${k.color},transparent)`}}/>
            <div style={{fontSize:'16px', marginBottom:'6px'}}>{k.icon}</div>
            <div style={{color:'#fff', fontSize:'22px', fontWeight:'800', lineHeight:1}}>{k.val}</div>
            <div style={{color:k.color, fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.6px', marginTop:'5px'}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div style={{...glass(), padding:'18px 20px'}}>
        <div style={{color:SUB, fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'14px'}}>📊 Pipeline Funnel</div>
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {STAGES.map(s => {
            const cfg   = STAGE_CFG[s];
            const count = stageCounts[s]||0;
            const pct   = Math.round(count/Math.max(1,contacts.length)*100);
            const w     = Math.round(count/maxStage*100);
            return (
              <div key={s} style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span style={{width:'115px', fontSize:'11px', fontWeight:'700', color:cfg.color, flexShrink:0}}>{s}</span>
                <div style={{flex:1, height:'18px', background:'rgba(255,255,255,0.04)', borderRadius:'4px', overflow:'hidden', position:'relative'}}>
                  <div style={{height:'100%', width:`${w}%`, background:`linear-gradient(90deg,${cfg.color}cc,${cfg.color}44)`, borderRadius:'4px', transition:'width 0.8s ease', boxShadow:`0 0 12px ${cfg.color}44`}}/>
                </div>
                <span style={{width:'26px', fontSize:'13px', fontWeight:'800', color:cfg.dot, textAlign:'right'}}>{count}</span>
                <span style={{width:'34px', fontSize:'11px', color:MUTED, textAlign:'right'}}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN AGENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function AgentDashboard({ user, onLogout }) {
  useEffect(() => { window.__crmUser = user; }, [user]);

  const [contacts,   setContacts]   = useState([]);
  const [stage,      setStage]      = useState('ALL');
  const [nav,        setNav]        = useState('dashboard');
  const [collapsed,  setCollapsed]  = useState(false);
  const [scripts,    setScripts]    = useState([]);
  const [allNotes,   setAllNotes]   = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editC,      setEditC]      = useState(null);
  const [viewC,      setViewC]      = useState(null);
  const [callC,      setCallC]      = useState(null);
  const [noteC,      setNoteC]      = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showBoard,  setShowBoard]  = useState(false);
  const [cNotes,     setCNotes]     = useState([]);
  const [newNote,    setNewNote]    = useState('');
  const [dispLog,    setDispLog]    = useState([]);
  const emptyForm = {name:'',company:'',email:'',phone:'',lead_stage:'NEW LEADS',deal_value:'',notes:''};
  const [form,    setForm]    = useState(emptyForm);
  const [settings,setSettings]= useState({displayName:user.full_name||user.username, username:user.username, curPwd:'', newPwd:'', confPwd:'', uPwd:''});
  const [msgs,    setMsgs]    = useState({name:null,pwd:null,user:null});

  const fetchContacts = useCallback(async () => {
    try {
      const ep = stage==='ALL' ? `${API}/api/contacts?agentId=${user.id}` : `${API}/api/contacts?agentId=${user.id}&stage=${stage}`;
      const r  = await axios.get(ep);
      setContacts(r.data);
    } catch {}
  }, [stage, user.id]);

  const fetchScripts  = useCallback(async () => { try { const r=await axios.get(`${API}/api/scripts`); setScripts(r.data); } catch {} }, []);
  const fetchAllNotes = useCallback(async () => { try { const r=await axios.get(`${API}/api/notes?agentId=${user.id}`); setAllNotes(r.data); } catch {} }, [user.id]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { fetchScripts();  }, [fetchScripts]);
  useEffect(() => { if (nav==='notes') fetchAllNotes(); }, [nav, fetchAllNotes]);

  // Monthly leaderboard reset check
  useEffect(() => {
    const now = new Date();
    const isLastDay = now.getDate() === new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const isNewMonth = localStorage.getItem('lb_month') !== `${now.getFullYear()}-${now.getMonth()}`;
    if (isNewMonth) {
      // Archive previous month
      const prev = JSON.parse(localStorage.getItem('lb_log')||'[]');
      if (prev.length > 0) {
        const hist = JSON.parse(localStorage.getItem('lb_history')||'[]');
        hist.push({ month: localStorage.getItem('lb_month'), log: prev });
        localStorage.setItem('lb_history', JSON.stringify(hist.slice(-12)));
      }
      localStorage.setItem('lb_month', `${now.getFullYear()}-${now.getMonth()}`);
      localStorage.setItem('lb_log', '[]');
    }
    const saved = JSON.parse(localStorage.getItem('lb_log')||'[]');
    if (saved.length > 0) setDispLog(saved);
  }, []);

  const saveContact = async e => {
    e.preventDefault();
    try {
      const p = {...form, assigned_to:user.id, created_by:user.id};
      editC ? await axios.put(`${API}/api/contacts/${editC.id}`,p) : await axios.post(`${API}/api/contacts`,p);
      fetchContacts(); setShowForm(false); setEditC(null); setForm(emptyForm);
    } catch { alert('Failed to save contact.'); }
  };

  const delContact = async id => {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    try { await axios.delete(`${API}/api/contacts/${id}`); fetchContacts(); } catch { alert('Failed.'); }
  };

  const openEdit = c => { setEditC(c); setForm({...c}); setShowForm(true); };
  const openView = async c => {
    try { const r=await axios.get(`${API}/api/contacts/${c.id}/activities`); setViewC({...c,activities:r.data}); }
    catch { setViewC({...c,activities:[]}); }
  };
  const openNotes = async c => {
    setNoteC(c); setNewNote('');
    try { const r=await axios.get(`${API}/api/contacts/${c.id}/notes`); setCNotes(r.data); }
    catch { setCNotes([]); }
  };
  const addNote = async () => {
    if (!newNote.trim()||!noteC) return;
    try { const r=await axios.post(`${API}/api/contacts/${noteC.id}/notes`,{user_id:user.id,content:newNote.trim()}); setCNotes([r.data,...cNotes]); setNewNote(''); }
    catch { alert('Failed to save note.'); }
  };
  const delNote = async id => {
    try { await axios.delete(`${API}/api/notes/${id}`); setCNotes(cNotes.filter(n=>n.id!==id)); setAllNotes(allNotes.filter(n=>n.id!==id)); }
    catch { alert('Failed.'); }
  };

  const onLogged = (d, contact) => {
    const entry = {...d, agent:user.full_name||user.username, contact:contact.name, ts:Date.now()};
    const newLog = [...dispLog, entry];
    setDispLog(newLog);
    localStorage.setItem('lb_log', JSON.stringify(newLog));
    fetchContacts();
    if (viewC?.id===contact.id) openView(contact);
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const saveName = async () => {
    try {
      await axios.put(`${API}/api/users/${user.id}/display-name`,{full_name:settings.displayName});
      user.full_name=settings.displayName; localStorage.setItem('user',JSON.stringify(user));
      setMsgs(m=>({...m,name:{ok:true,t:'✓ Saved'}}));
      setTimeout(()=>setMsgs(m=>({...m,name:null})),2500);
    } catch { setMsgs(m=>({...m,name:{ok:false,t:'Failed'}})); }
  };
  const savePwd = async () => {
    if (!settings.curPwd||!settings.newPwd||settings.newPwd.length<6){setMsgs(m=>({...m,pwd:{ok:false,t:'Check fields (min 6 chars)'}}));return;}
    if (settings.newPwd!==settings.confPwd){setMsgs(m=>({...m,pwd:{ok:false,t:"Passwords don't match"}}));return;}
    try {
      await axios.put(`${API}/api/users/${user.id}/password`,{current_password:settings.curPwd,new_password:settings.newPwd});
      setMsgs(m=>({...m,pwd:{ok:true,t:'✓ Updated'}})); setSettings(s=>({...s,curPwd:'',newPwd:'',confPwd:''}));
    } catch(e){setMsgs(m=>({...m,pwd:{ok:false,t:e.response?.data?.error||'Failed'}}));}
  };
  const saveUser = async () => {
    if (!settings.username.trim()||!settings.uPwd){setMsgs(m=>({...m,user:{ok:false,t:'Fill both fields'}}));return;}
    try {
      await axios.put(`${API}/api/users/${user.id}/username`,{new_username:settings.username.trim(),current_password:settings.uPwd});
      user.username=settings.username.trim(); localStorage.setItem('user',JSON.stringify(user));
      setMsgs(m=>({...m,user:{ok:true,t:'✓ Updated'}})); setSettings(s=>({...s,uPwd:''}));
    } catch(e){setMsgs(m=>({...m,user:{ok:false,t:e.response?.data?.error||'Failed'}}));}
  };

  const filtered     = stage==='ALL' ? contacts : contacts.filter(c=>c.lead_stage===stage);
  const sessionSales = dispLog.filter(d=>d.id==='appt_booked').length;
  const navItems = [
    {id:'dashboard',l:'Dashboard',  ic:IC.dash},
    {id:'leads',    l:'My Leads',   ic:IC.leads},
    {id:'notes',    l:'Notes',      ic:IC.notes},
    {id:'scripts',  l:'Scripts',    ic:IC.scripts},
    {id:'settings', l:'Settings',   ic:IC.settings},
  ];

  return (
    <div style={{display:'flex', minHeight:'100vh', background:NAVY, fontFamily:"'Inter',-apple-system,sans-serif", position:'relative', overflow:'hidden'}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(26,95,180,0.6);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#1a5fb4}
        input::placeholder,textarea::placeholder{color:rgba(143,170,200,0.3)}
        select option{background:#0a1628;color:#e2eaf8}
      `}</style>

      <GeoBackground />

      {/* Floating orbs */}
      <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
        {[
          {w:'480px',h:'480px',t:'-6%',l:'-3%',c:'rgba(26,95,180,0.18)',d:'0s'},
          {w:'480px',h:'480px',t:'45%',l:'62%',c:'rgba(16,72,148,0.14)',d:'-12s'},
          {w:'320px',h:'320px',t:'72%',l:'6%', c:'rgba(26,95,180,0.1)', d:'-22s'},
          {w:'260px',h:'260px',t:'4%', l:'78%',c:'rgba(255,107,43,0.08)',d:'-8s'},
        ].map((o,i)=>(
          <div key={i} style={{position:'absolute',width:o.w,height:o.h,top:o.t,left:o.l,borderRadius:'50%',filter:'blur(60px)',background:`radial-gradient(circle,${o.c},transparent 70%)`,animation:`floatOrb 30s ease-in-out infinite`,animationDelay:o.d}}/>
        ))}
        {[...Array(28)].map((_,i)=>(
          <div key={i} style={{position:'absolute',background:'#fff',borderRadius:'50%',width:`${1+(i%3)}px`,height:`${1+(i%3)}px`,top:`${(i*19)%100}%`,left:`${(i*29)%100}%`,animation:`pulse ${3+i%3}s ease-in-out infinite`,animationDelay:`${(i%5)*0.8}s`,opacity:0.25,pointerEvents:'none'}}/>
        ))}
      </div>

      {/* ── SIDEBAR ── */}
      <aside style={{width:collapsed?'70px':'250px', ...glass({borderRadius:0,borderRight:`1px solid ${BORDER}`,borderTop:'none',borderBottom:'none',borderLeft:'none',background:'rgba(8,14,26,0.97)'}), display:'flex', flexDirection:'column', transition:'width 0.25s', flexShrink:0, position:'relative', zIndex:10}}>

        <div style={{padding:'22px 14px 18px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'42px', height:'42px', borderRadius:'11px', overflow:'hidden', flexShrink:0, boxShadow:`0 0 22px ${ORANGE}66`, border:`1px solid ${ORANGE}44`}}>
            <img src="/logo.png" alt="Stritgrad" style={{width:'100%', height:'100%', objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
          </div>
          {!collapsed && (
            <div>
              <div style={{color:TEXT, fontWeight:'700', fontSize:'13px', lineHeight:1.2}}>Stritgrad Contact</div>
              <div style={{background:`linear-gradient(90deg,${BLUE2},${ORANGE})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'11px', fontWeight:'700', letterSpacing:'0.5px'}}>AGENT PORTAL</div>
            </div>
          )}
        </div>

        <nav style={{flex:1, padding:'14px 8px'}}>
          {navItems.map(item => (
            <button key={item.id} onClick={()=>setNav(item.id)} style={{width:'100%', display:'flex', alignItems:'center', gap:'11px', padding:'11px 13px', borderRadius:'11px', border:'none', cursor:'pointer', marginBottom:'5px', transition:'all 0.2s', background:nav===item.id?`linear-gradient(135deg,${ORANGE},${ORANGE2})`:'transparent', color:nav===item.id?'#fff':MUTED, fontWeight:nav===item.id?'700':'500', fontSize:'14px', boxShadow:nav===item.id?`0 4px 18px ${ORANGE}44`:'none', textAlign:'left', fontFamily:'inherit'}}>
              <span style={{flexShrink:0, display:'flex'}}>{item.ic}</span>
              {!collapsed && <span>{item.l}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:'14px 8px', borderTop:`1px solid ${BORDER}`}}>
          {!collapsed && (
            <div style={{padding:'10px 13px', marginBottom:'8px', borderRadius:'11px', background:`rgba(26,95,180,0.1)`, border:`1px solid rgba(26,95,180,0.2)`}}>
              <div style={{color:TEXT, fontWeight:'700', fontSize:'13px'}}>{user.full_name||user.username}</div>
              <div style={{color:BLUE2, fontSize:'11px', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:GREEN,display:'inline-block',boxShadow:`0 0 6px ${GREEN}`}}/>
                Agent Online
              </div>
            </div>
          )}
          <button onClick={onLogout} style={{width:'100%', display:'flex', alignItems:'center', gap:'11px', padding:'11px 13px', borderRadius:'11px', border:`1px solid rgba(239,68,68,0.2)`, cursor:'pointer', background:'rgba(239,68,68,0.07)', color:RED, fontSize:'14px', fontWeight:'600', fontFamily:'inherit'}}>
            <span style={{flexShrink:0, display:'flex'}}>{IC.logout}</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:1}}>

        {/* Header */}
        <header style={{...glass({borderRadius:0,borderTop:'none',borderLeft:'none',borderRight:'none',background:'rgba(8,14,26,0.95)'}), padding:'0 26px', height:'66px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
            <button onClick={()=>setCollapsed(!collapsed)} style={{background:'rgba(255,255,255,0.04)', border:`1px solid ${BORDER}`, borderRadius:'9px', color:MUTED, cursor:'pointer', padding:'7px', display:'flex'}}>
              {IC.menu}
            </button>
            <div>
              <h1 style={{background:`linear-gradient(90deg,${TEXT},${SUB})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'20px', fontWeight:'800', margin:0, letterSpacing:'-0.3px'}}>Agent Dashboard</h1>
              <p style={{color:MUTED, fontSize:'11px', margin:0}}>Stritgrad Contact Centre · Call Center CRM</p>
            </div>
          </div>

          <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
            {dispLog.length>0 && (
              <button onClick={()=>setShowBoard(true)} style={{display:'flex', alignItems:'center', gap:'7px', padding:'9px 14px', background:`rgba(255,107,43,0.08)`, color:ORANGE, border:`1px solid rgba(255,107,43,0.08)`, borderRadius:'11px', cursor:'pointer', fontWeight:'700', fontSize:'12px', boxShadow:`0 0 16px rgba(255,107,43,0.08)`, fontFamily:'inherit'}}>
                {IC.trophy} {sessionSales} appts · {dispLog.length} calls
              </button>
            )}
            <button onClick={()=>setShowImport(true)} style={{display:'flex', alignItems:'center', gap:'7px', padding:'9px 14px', background:`rgba(26,95,180,0.12)`, color:BLUE2, border:`1px solid rgba(26,95,180,0.28)`, borderRadius:'11px', cursor:'pointer', fontWeight:'700', fontSize:'12px', fontFamily:'inherit'}}>
              {IC.upload} Import CSV
            </button>
            <button onClick={()=>{setEditC(null);setForm(emptyForm);setShowForm(true);}} style={{display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, color:'#fff', border:'none', borderRadius:'11px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:`0 5px 18px ${ORANGE}44`, fontFamily:'inherit'}}>
              {IC.plus} Add Lead
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{flex:1, overflowY:'auto', padding:'24px'}}>

          {/* SCRIPTS */}
          {nav==='scripts' && (
            <div>
              <h2 style={{color:TEXT, fontSize:'19px', fontWeight:'800', marginBottom:'18px'}}>Call Scripts</h2>
              {scripts.length===0
                ? <div style={{...glass(), color:MUTED, padding:'50px', textAlign:'center'}}>No scripts yet. Ask your admin to add scripts.</div>
                : <div style={{display:'grid', gap:'14px', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))'}}>
                    {scripts.map(s=>(
                      <div key={s.id} style={{...glass(), padding:'20px', borderLeft:`3px solid ${ORANGE}`}}>
                        <h3 style={{color:TEXT, fontWeight:'700', marginBottom:'10px'}}>{s.title}</h3>
                        <p style={{color:SUB, fontSize:'14px', lineHeight:1.7}}>{s.content}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* NOTES */}
          {nav==='notes' && (
            <div>
              <h2 style={{color:TEXT, fontSize:'19px', fontWeight:'800', marginBottom:'18px'}}>All Notes</h2>
              {allNotes.length===0
                ? <div style={{...glass(), color:MUTED, padding:'50px', textAlign:'center'}}>No notes yet. Add notes from any lead card.</div>
                : <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {allNotes.map(n=>(
                      <div key={n.id} style={{...glass(), padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'14px'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'7px'}}>
                            <span style={{color:'#ff8c4b', fontWeight:'700', fontSize:'14px'}}>{n.contact_name}</span>
                            <span style={{color:MUTED, fontSize:'12px'}}>{n.contact_phone}</span>
                          </div>
                          <p style={{color:TEXT, fontSize:'14px', marginBottom:'7px', lineHeight:1.5}}>{n.content}</p>
                          <span style={{color:MUTED, fontSize:'11px'}}>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <button onClick={()=>delNote(n.id)} style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'8px', padding:'7px', color:RED, cursor:'pointer', display:'flex'}}>{IC.trash}</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* SETTINGS */}
          {nav==='settings' && (
            <div style={{maxWidth:'480px'}}>
              <h2 style={{color:TEXT, fontSize:'19px', fontWeight:'800', marginBottom:'18px'}}>Account Settings</h2>
              {[
                {title:'Display Name',    fields:[{l:'Display Name',t:'text',k:'displayName',ph:'Your display name'}], btn:'Save Changes',     action:saveName, msg:'name'},
                {title:'Change Username', fields:[{l:'New Username',t:'text',k:'username',ph:'New username'},{l:'Current Password to Confirm',t:'password',k:'uPwd',ph:'Current password'}], btn:'Update Username', action:saveUser, msg:'user'},
                {title:'Change Password', fields:[{l:'Current Password',t:'password',k:'curPwd',ph:'Current password'},{l:'New Password (min 6 chars)',t:'password',k:'newPwd',ph:'New password'},{l:'Confirm New Password',t:'password',k:'confPwd',ph:'Repeat new password'}], btn:'Update Password', action:savePwd, msg:'pwd'},
              ].map(sec=>(
                <div key={sec.title} style={{...glass(), padding:'22px', marginBottom:'14px'}}>
                  <div style={{color:MUTED, fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'16px'}}>{sec.title}</div>
                  {sec.fields.map(f=>(
                    <div key={f.k} style={{marginBottom:'12px'}}>
                      <label style={lbl}>{f.l}</label>
                      <input type={f.t} style={inp()} placeholder={f.ph} value={settings[f.k]} onChange={e=>setSettings(p=>({...p,[f.k]:e.target.value}))}/>
                    </div>
                  ))}
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <Btn label={sec.btn} onClick={sec.action}/>
                    {msgs[sec.msg] && <span style={{color:msgs[sec.msg].ok?GREEN:RED, fontSize:'13px', fontWeight:'700'}}>{msgs[sec.msg].t}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DASHBOARD / LEADS */}
          {(nav==='dashboard'||nav==='leads') && (
            <>
              {/* Stage tabs */}
              <div style={{display:'flex', gap:'9px', marginBottom:'20px', flexWrap:'wrap'}}>
                {['ALL',...STAGES].map(s=>(
                  <button key={s} onClick={()=>setStage(s)} style={{padding:'9px 18px', borderRadius:'11px', cursor:'pointer', fontWeight:'700', fontSize:'12px', transition:'all 0.2s', letterSpacing:'0.3px', background:stage===s?`linear-gradient(135deg,${ORANGE},${ORANGE2})`:'rgba(255,255,255,0.04)', color:stage===s?'#fff':MUTED, border:stage===s?'none':`1px solid ${BORDER}`, boxShadow:stage===s?`0 4px 14px ${ORANGE}44`:'none', fontFamily:'inherit'}}>
                    {s==='ALL'?'ALL LEADS':s}
                  </button>
                ))}
              </div>

              {/* Live Dashboard Stats */}
              <LiveDashboard contacts={contacts} dispLog={dispLog}/>

              {/* Lead cards */}
              {filtered.length===0
                ? <div style={{...glass(), textAlign:'center', padding:'70px 40px', color:MUTED}}>
                    <div style={{fontSize:'40px', marginBottom:'14px'}}>📋</div>
                    <div style={{color:SUB, fontWeight:'600', fontSize:'16px', marginBottom:'18px'}}>No leads in this category yet.</div>
                    <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
                      <Btn label="📥 Import from CSV" onClick={()=>setShowImport(true)} icon={IC.upload}/>
                      <Btn label="➕ Add Manually" onClick={()=>setShowForm(true)} ghost/>
                    </div>
                  </div>
                : <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'18px'}}>
                    {filtered.map(c => {
                      const cfg = STAGE_CFG[c.lead_stage]||STAGE_CFG['NEW LEADS'];
                      return (
                        <div key={c.id} style={{...glass(), padding:'20px', position:'relative', overflow:'hidden', transition:'transform 0.2s,box-shadow 0.2s'}}
                          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.45),0 0 0 1px ${cfg.color}44`;}}
                          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.35)';}}>

                          {/* Top colour stripe */}
                          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${cfg.color},transparent)`}}/>
                          {/* Corner glow */}
                          <div style={{position:'absolute',top:'-20px',right:'-20px',width:'70px',height:'70px',borderRadius:'50%',background:cfg.color,opacity:0.12,filter:'blur(16px)',pointerEvents:'none'}}/>

                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                            <div style={{flex:1, minWidth:0, paddingRight:'8px'}}>
                              <h3 style={{color:TEXT, fontWeight:'700', fontSize:'15px', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.name}</h3>
                              <p style={{color:MUTED, fontSize:'12px', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.company||'—'}</p>
                            </div>
                            <StageBadge stage={c.lead_stage}/>
                          </div>

                          <div style={{marginBottom:'14px', display:'flex', flexDirection:'column', gap:'5px'}}>
                            <div style={{color:SUB, fontSize:'12px'}}>📞 {c.phone||'—'}</div>
                            {c.email && <div style={{color:SUB, fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>✉️ {c.email}</div>}
                          </div>

                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px'}}>
                            <button onClick={()=>setCallC(c)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'9px',background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`,color:'#fff',border:'none',borderRadius:'9px',cursor:'pointer',fontWeight:'700',fontSize:'12px',boxShadow:`0 3px 12px ${ORANGE}44`,fontFamily:'inherit'}}>
                              {IC.mic} Record Call
                            </button>
                            <button onClick={()=>openView(c)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'9px',background:`rgba(26,95,180,0.12)`,color:BLUE2,border:`1px solid rgba(26,95,180,0.28)`,borderRadius:'9px',cursor:'pointer',fontWeight:'700',fontSize:'12px',fontFamily:'inherit'}}>
                              {IC.eye} View
                            </button>
                            <button onClick={()=>openNotes(c)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'9px',background:'rgba(255,255,255,0.04)',color:TEXT,border:`1px solid ${BORDER}`,borderRadius:'9px',cursor:'pointer',fontWeight:'600',fontSize:'12px',fontFamily:'inherit'}}>
                              {IC.note} Notes
                            </button>
                            <button onClick={()=>openEdit(c)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'9px',background:'rgba(255,255,255,0.04)',color:SUB,border:`1px solid ${BORDER}`,borderRadius:'9px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit'}}>
                              {IC.edit} Edit
                            </button>
                            <button onClick={()=>delContact(c.id)} style={{gridColumn:'span 2',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'9px',background:'rgba(239,68,68,0.07)',color:RED,border:'1px solid rgba(239,68,68,0.18)',borderRadius:'9px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit'}}>
                              {IC.trash} Delete Lead
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </>
          )}
        </main>
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      {showForm && (
        <Overlay onClose={()=>{setShowForm(false);setEditC(null);}}>
          <MHead title={editC?'Edit Lead':'New Lead'} onClose={()=>{setShowForm(false);setEditC(null);}}/>
          <form onSubmit={saveContact} style={{padding:'22px'}}>
            {[{k:'name',l:'Full Name *',t:'text',req:true,ph:'Jane Smith'},{k:'company',l:'Company',t:'text',ph:'Acme Ltd'},{k:'email',l:'Email',t:'email',ph:'jane@co.za'},{k:'phone',l:'Phone *',t:'tel',req:true,ph:'+27 82 000 0000'}].map(f=>(
              <div key={f.k} style={{marginBottom:'12px'}}>
                <label style={lbl}>{f.l}</label>
                <input type={f.t} required={f.req||false} placeholder={f.ph} style={inp()} value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>
              </div>
            ))}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
              <div>
                <label style={lbl}>Stage</label>
                <select style={inp()} value={form.lead_stage} onChange={e=>setForm(p=>({...p,lead_stage:e.target.value}))}>
                  {STAGES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Deal Value (R)</label>
                <input type="number" min="0" style={inp()} value={form.deal_value||''} onChange={e=>setForm(p=>({...p,deal_value:e.target.value}))} placeholder="0"/>
              </div>
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={lbl}>Notes</label>
              <textarea style={{...inp(), resize:'vertical'}} rows={2} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Key details about this lead…"/>
            </div>
            <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
              <Btn label="Cancel" onClick={()=>{setShowForm(false);setEditC(null);}} ghost/>
              <button type="submit" style={{padding:'10px 22px', background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, color:'#fff', border:'none', borderRadius:'9px', cursor:'pointer', fontWeight:'700', fontSize:'13px', fontFamily:'inherit', boxShadow:`0 4px 14px ${ORANGE}44`}}>
                {editC?'Update Lead':'Save Lead'}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* VIEW DETAILS */}
      {viewC && (
        <Overlay onClose={()=>setViewC(null)}>
          <MHead title={viewC.name} sub={viewC.company} onClose={()=>setViewC(null)}/>
          <div style={{padding:'20px'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px'}}>
              {[{l:'Phone',v:viewC.phone||'—'},{l:'Email',v:viewC.email||'—'},{l:'Stage',v:viewC.lead_stage,c:ORANGE},{l:'Deal Value',v:viewC.deal_value?`R${Number(viewC.deal_value).toLocaleString('en-ZA')}`:'—',c:GOLD}].map(x=>(
                <div key={x.l} style={{background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'12px 14px'}}>
                  <div style={{color:MUTED, fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'5px'}}>{x.l}</div>
                  <div style={{color:x.c||TEXT, fontWeight:'700', fontSize:'13px'}}>{x.v}</div>
                </div>
              ))}
            </div>
            {viewC.notes && (
              <div style={{background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'12px 14px', marginBottom:'14px'}}>
                <div style={{color:MUTED, fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'5px'}}>Notes</div>
                <div style={{color:TEXT, fontSize:'13px', lineHeight:1.6}}>{viewC.notes}</div>
              </div>
            )}
            <button onClick={()=>{setCallC(viewC);setViewC(null);}} style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', background:`linear-gradient(135deg,${ORANGE},${ORANGE2})`, color:'#fff', border:'none', borderRadius:'11px', cursor:'pointer', fontWeight:'800', fontSize:'14px', marginBottom:'18px', boxShadow:`0 5px 18px ${ORANGE}44`, fontFamily:'inherit'}}>
              {IC.mic} Record Call — {viewC.name}
            </button>
            <h3 style={{color:TEXT, fontWeight:'700', fontSize:'14px', marginBottom:'12px'}}>Call History</h3>
            {viewC.activities?.length>0
              ? <div style={{display:'flex', flexDirection:'column', gap:'8px', maxHeight:'220px', overflowY:'auto'}}>
                  {viewC.activities.map(a=>(
                    <div key={a.id} style={{background:'rgba(255,255,255,0.025)', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'12px 14px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span style={{color:a.direction==='inbound'?'#ff8c4b':GREEN, fontWeight:'700', fontSize:'12px'}}>{a.direction==='inbound'?'📞 Inbound':'📞 Outbound'}</span>
                        <span style={{color:MUTED, fontSize:'11px'}}>{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{color:SUB, fontSize:'12px'}}>Duration: {fmt(a.duration||0)}</div>
                      {a.notes && <div style={{color:TEXT, fontSize:'12px', marginTop:'3px'}}>{a.notes}</div>}
                    </div>
                  ))}
                </div>
              : <div style={{color:MUTED, textAlign:'center', padding:'20px', background:'rgba(255,255,255,0.025)', borderRadius:'10px'}}>No call history yet.</div>
            }
          </div>
        </Overlay>
      )}

      {/* NOTES MODAL */}
      {noteC && (
        <Overlay onClose={()=>setNoteC(null)}>
          <MHead title={`Notes — ${noteC.name}`} sub={noteC.phone} onClose={()=>setNoteC(null)}/>
          <div style={{padding:'20px'}}>
            <div style={{display:'flex', gap:'9px', marginBottom:'16px'}}>
              <textarea placeholder="Write a note about this lead…" rows={2} style={{...inp(), resize:'vertical', flex:1}} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
              <Btn label="Add" onClick={addNote} disabled={!newNote.trim()}/>
            </div>
            {cNotes.length===0
              ? <div style={{color:MUTED, textAlign:'center', padding:'20px', background:'rgba(255,255,255,0.025)', borderRadius:'10px'}}>No notes for this lead yet.</div>
              : <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {cNotes.map(n=>(
                    <div key={n.id} style={{background:'rgba(255,255,255,0.025)', border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'12px 14px', display:'flex', justifyContent:'space-between', gap:'10px'}}>
                      <div style={{flex:1}}>
                        <p style={{color:TEXT, fontSize:'13px', marginBottom:'5px', lineHeight:1.5}}>{n.content}</p>
                        <span style={{color:MUTED, fontSize:'11px'}}>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <button onClick={()=>delNote(n.id)} style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'7px', padding:'5px', color:RED, cursor:'pointer', display:'flex'}}>{IC.trash}</button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </Overlay>
      )}

      {/* FEATURE MODALS */}
      {showImport && <CSVImporter onClose={()=>setShowImport(false)} onDone={fetchContacts} user={user}/>}
      {callC      && <CallRecorder contact={callC} user={user} onClose={()=>setCallC(null)} onLogged={onLogged}/>}
      {showBoard  && <Leaderboard  log={dispLog} onClose={()=>setShowBoard(false)}/>}
    </div>
  );
}

export default AgentDashboard;
