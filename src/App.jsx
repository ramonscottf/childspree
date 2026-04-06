import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';

const SCHOOLS = [
  "Adams Elementary","Antelope Elementary","Bountiful Elementary","Burton Elementary",
  "Clinton Elementary","Columbia Elementary","Cook Elementary","Doxey Elementary",
  "Eagle Bay Elementary","East Layton Elementary","Ellison Park Elementary",
  "Endeavour Elementary","Farmington Elementary","Foxboro Elementary",
  "Heritage Elementary","Holt Elementary","Kay's Creek Elementary",
  "Knowlton Elementary","Lake View Elementary","Lincoln Elementary",
  "Meadowbrook Elementary","Morgan Elementary","Mountain View Elementary",
  "Muir Elementary","Oak Hills Elementary","Orchard Elementary",
  "Parkside Elementary","Reading Elementary","Rosecrest Elementary",
  "Sand Springs Elementary","Snow Horse Elementary","South Clearfield Elementary",
  "Stewart Elementary","Sunset Elementary","Syracuse Elementary",
  "Taylor Elementary","Tolman Elementary","Vae View Elementary",
  "Valley View Elementary","Wasatch Elementary","Washington Elementary",
  "West Bountiful Elementary","West Clinton Elementary","West Point Elementary",
  "Whitesides Elementary","Woods Cross Elementary",
  "Centerville Junior High","Central Davis Junior High","Fairfield Junior High",
  "Legacy Junior High","Lakeridge Junior High","Mueller Park Junior High",
  "North Davis Junior High","North Layton Junior High","South Davis Junior High",
  "Sunset Junior High","Syracuse Junior High","West Point Junior High",
  "Bountiful High","Clearfield High","Davis High","Farmington High",
  "Layton High","Northridge High","Syracuse High","Viewmont High","Woods Cross High"
];
const GRADES = ["Pre-K","K","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
const SHIRT_SIZES = ["YXS (4-5)","YS (6-7)","YM (8)","YL (10-12)","YXL (14-16)","AS","AM","AL","AXL","A2XL"];
const PANT_SIZES = ["4","5","6","6X/7","8","10","12","14","16","18","20","24W","26W","28W","30W","32W"];

// ─── Responsive hook ───
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── Styles ───
const C = {
  navy: '#1B3A4B', pink: '#E8548C', pinkLight: '#F9A8C9',
  bg: '#F8FAFC', card: '#fff', border: '#E2E8F0',
  text: '#1E293B', muted: '#64748B', light: '#94A3B8',
  green: '#059669', red: '#DC2626', amber: '#D97706', blue: '#2563EB',
};

const inp = (extra = {}) => ({
  width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`,
  borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  background: '#FAFBFC', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', color: C.text, ...extra,
});

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, letterSpacing: 0.3 };

const secHead = (isMobile) => ({
  fontSize: isMobile ? 10 : 11, fontWeight: 700, color: C.navy,
  textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
  borderBottom: `2px solid ${C.pinkLight}`, paddingBottom: 6,
});

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={lbl}>{label}</label>}
      {children}
    </div>
  );
}

function Row({ cols = 2, gap = 12, children, style }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: Array(cols).fill('1fr').join(' '), gap, ...style }}>
      {children}
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const map = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
    sent: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sent' },
    complete: { bg: '#E0E7FF', text: '#3730A3', label: 'Complete' },
    declined: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined' },
  };
  const c = map[status] || map.pending;
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.text, textTransform:'uppercase', letterSpacing:0.3 }}>{c.label}</span>;
}

// ─── Top Nav (desktop) ───
function TopNav({ view, navigate }) {
  return (
    <div style={{ background: C.navy, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, padding: '12px 0' }}>
        <img src="/logo.png" alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
        <div>
          <div style={{ color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>Child Spree 2026</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Davis Education Foundation</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[{ key: '#/', label: 'Nominate' }, { key: '#/admin', label: 'Admin' }].map(item => (
          <button key={item.key} onClick={() => navigate(item.key)} style={{
            padding: '8px 20px', background: view === item.key.replace('#/','') || (item.key === '#/' && view === 'nominate') ? 'rgba(255,255,255,0.15)' : 'none',
            border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            opacity: (view === item.key.replace('#/','') || (item.key === '#/' && view === 'nominate')) ? 1 : 0.6,
          }}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Header ───
function MobileHeader({ subtitle }) {
  return (
    <div style={{ background: C.navy, color: '#fff', padding: '14px 16px 12px', textAlign: 'center' }}>
      <img src="/logo.png" alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', marginBottom: 6 }} />
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800 }}>Child Spree 2026</div>
      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.5, marginTop: 2 }}>Davis Education Foundation</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Mobile Bottom Nav ───
function MobileNav({ view, navigate }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 16px', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)', zIndex: 100 }}>
      {[{ key: '#/', icon: '📋', label: 'Nominate', id: 'nominate' }, { key: '#/admin', icon: '⚙️', label: 'Admin', id: 'admin' }].map(item => {
        const active = view === item.id;
        return (
          <button key={item.key} onClick={() => navigate(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: active ? 1 : 0.45 }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: active ? C.pink : C.light, textTransform: 'uppercase' }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Request failed' })); throw new Error(err.error || `HTTP ${res.status}`); }
  return res.json();
}

// ─── Nomination Form ───
function NominationForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ childFirst:'',childLast:'',school:'',grade:'', nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'', parentName:'',parentPhone:'',parentEmail:'', reason:'',siblings:'',additionalNotes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async () => {
    setError(null);
    if (!form.childFirst||!form.childLast||!form.school||!form.grade) { setError('Please fill in all child information fields.'); return; }
    if (!form.nominatorName||!form.nominatorEmail) { setError('Please fill in your name and email.'); return; }
    if (!form.parentName) { setError('Parent or guardian name is required.'); return; }
    if (!form.parentPhone&&!form.parentEmail) { setError('Please provide at least one way to reach the parent.'); return; }
    setSubmitting(true);
    try { await api('/nominations',{method:'POST',body:JSON.stringify(form)}); setSubmitted(true); }
    catch(err) { setError(err.message); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div style={{ textAlign:'center', padding: isMobile ? '60px 20px' : '80px 40px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 24 : 28, color:C.navy, marginBottom:8 }}>Nomination Received</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>Thank you for advocating for this child. The DEF team will review and reach out to the family.</p>
      <button onClick={()=>{ setSubmitted(false); setForm({childFirst:'',childLast:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblings:'',additionalNotes:''}); }}
        style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
        Nominate Another Child
      </button>
    </div>
  );

  const maxW = isMobile ? '100%' : 760;
  const pad = isMobile ? '20px 16px' : '32px 40px';

  return (
    <div style={{ maxWidth: maxW, margin: '0 auto', padding: pad }}>
      {/* Hero — desktop shows side by side */}
      {isMobile ? (
        <div style={{ borderRadius:12, overflow:'hidden', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
          <img src="/hero.webp" alt="" style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
        </div>
      ) : (
        <div style={{ display:'flex', gap:32, alignItems:'flex-start', marginBottom:32 }}>
          <div style={{ flex:'0 0 280px', borderRadius:14, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
            <img src="/hero.webp" alt="" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
          </div>
          <div style={{ flex:1, paddingTop:8 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.navy, marginBottom:8 }}>Nominate a Child</h2>
            <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, marginBottom:12 }}>Be the reason a child walks into school with confidence.</p>
            <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'12px 16px', fontSize:13, color:'#0C4A6E', lineHeight:1.5 }}>
              Nominate students whose families may need support with back-to-school clothing. All information is confidential.
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:6 }}>Nominate a Child</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.5, maxWidth:340, margin:'0 auto' }}>Be the reason a child walks into school with confidence.</p>
          </div>
          <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'12px 14px', marginBottom:24, fontSize:13, color:'#0C4A6E', lineHeight:1.5 }}>
            Nominate students whose families may need support with back-to-school clothing. All information is confidential.
          </div>
        </>
      )}

      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}

      {/* Two-column layout on desktop */}
      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
        {/* Left column */}
        <div>
          <p style={secHead(isMobile)}>Child Information</p>
          <Row cols={2} gap={12}><Field label="First Name *"><input style={inp()} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)} placeholder="First" /></Field>
          <Field label="Last Name *"><input style={inp()} value={form.childLast} onChange={e=>upd('childLast',e.target.value)} placeholder="Last" /></Field></Row>
          <Row cols={isMobile?2:1} gap={12}>
            <Field label="School *"><select style={{...inp(),appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">Select school...</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Grade *"><select style={{...inp(),appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">Grade</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></Field>
          </Row>

          <p style={{...secHead(isMobile), marginTop:20}}>Your Information</p>
          <Field label="Your Name *"><input style={inp()} value={form.nominatorName} onChange={e=>upd('nominatorName',e.target.value)} placeholder="Full name" /></Field>
          <Row cols={2} gap={12}>
            <Field label="Role *"><select style={{...inp(),appearance:'auto'}} value={form.nominatorRole} onChange={e=>upd('nominatorRole',e.target.value)}>{['Teacher','Counselor','Family Advocate','Administrator','Other'].map(r=><option key={r} value={r}>{r}</option>)}</select></Field>
            <Field label="Email *"><input style={inp()} type="email" value={form.nominatorEmail} onChange={e=>upd('nominatorEmail',e.target.value)} placeholder="you@davis.k12.ut.us" /></Field>
          </Row>
        </div>

        {/* Right column */}
        <div>
          <p style={secHead(isMobile)}>Parent / Guardian</p>
          <Field label="Name *"><input style={inp()} value={form.parentName} onChange={e=>upd('parentName',e.target.value)} placeholder="Full name" /></Field>
          <Row cols={2} gap={12}>
            <Field label="Phone"><input style={inp()} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)} placeholder="(801) 555-0000" /></Field>
            <Field label="Email"><input style={inp()} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)} placeholder="parent@email.com" /></Field>
          </Row>

          <p style={{...secHead(isMobile), marginTop:20}}>Additional Details</p>
          <Field label="Why are you nominating this child?">
            <textarea style={{...inp(), minHeight:isMobile?72:96, resize:'vertical'}} value={form.reason} onChange={e=>upd('reason',e.target.value)} placeholder="Brief explanation — this stays confidential" />
          </Field>
          <Field label="Siblings to also nominate?">
            <input style={inp()} value={form.siblings} onChange={e=>upd('siblings',e.target.value)} placeholder="e.g., Maria (3rd), James (K)" />
          </Field>
        </div>
      </div>

      <div style={{ marginTop:24 }}>
        <button onClick={submit} disabled={submitting} style={{ width:'100%', padding: isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', boxShadow:`0 2px 8px rgba(232,84,140,0.3)`, letterSpacing:0.3 }}>
          {submitting ? 'Submitting...' : 'Submit Nomination'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:10 }}>All information is kept strictly confidential.</p>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ───
function AdminDashboard() {
  const isMobile = useIsMobile();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('cs-admin'));
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (filter!=='all') p.set('status',filter);
      if (search) p.set('search',search);
      const data = await api(`/nominations?${p}`,{headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}});
      setNominations(data.nominations);
    } catch(e) { console.error(e); }
    setLoading(false);
  },[filter,search]);

  useEffect(()=>{ if(authed) load(); },[load,authed]);

  const login = () => {
    if (pw==='childspree2026') { sessionStorage.setItem('cs-admin',pw); setAuthed(true); }
    else { setPwErr(true); setTimeout(()=>setPwErr(false),2000); }
  };

  const updateStatus = async(id,status) => {
    await api(`/nominations/${id}`,{method:'PATCH',body:JSON.stringify({status}),headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}});
    load();
  };

  const copyLink = (token) => navigator.clipboard.writeText(`${window.location.origin}/#/intake/${token}`);

  const counts = { all:nominations.length, pending:0, approved:0, sent:0, complete:0, declined:0 };
  nominations.forEach(n=>{ counts[n.status]=(counts[n.status]||0)+1; });

  if (!authed) return (
    <div style={{ maxWidth:380, margin: isMobile?'60px auto 0':'80px auto 0', padding:'0 16px' }}>
      <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:20 }}>Admin Access</h2>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
          placeholder="Password" style={{...inp(), marginBottom:12, textAlign:'center', border:`1.5px solid ${pwErr?'#EF4444':C.border}`}} />
        <button onClick={login} style={{ width:'100%', padding:12, background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Enter</button>
        {pwErr && <div style={{ color:'#EF4444', fontSize:13, marginTop:8 }}>Incorrect password</div>}
      </div>
    </div>
  );

  const pad = isMobile ? '16px 12px' : '24px 32px';
  const maxW = isMobile ? '100%' : 1000;

  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:pad }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(4,1fr)' : 'repeat(6,1fr)', gap:isMobile?8:12, marginBottom:20 }}>
        {[
          {label:'Total',value:counts.all,color:C.navy},
          {label:'Pending',value:counts.pending,color:C.amber},
          {label:'Approved',value:counts.approved,color:C.green},
          {label:'Sent',value:counts.sent,color:C.blue},
          {label:'Complete',value:counts.complete,color:'#7C3AED'},
          {label:'Declined',value:counts.declined,color:C.red},
        ].slice(0, isMobile?4:6).map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding: isMobile?'10px 8px':'14px 12px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize: isMobile?20:28, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize: isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {['all','pending','approved','sent','complete'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding: isMobile?'6px 10px':'6px 14px', borderRadius:20, border:'none', fontSize: isMobile?11:12, fontWeight:600, cursor:'pointer', background:filter===k?C.pink:'#F1F5F9', color:filter===k?'#fff':C.muted }}>
              {k.charAt(0).toUpperCase()+k.slice(1)} {k!=='all'?`(${counts[k]})` :''}
            </button>
          ))}
        </div>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inp(), width: isMobile?'100%':240, fontSize:13, marginBottom:0}} />
      </div>

      {/* Desktop table view / Mobile card view */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>
      ) : nominations.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:C.light, fontSize:14 }}>No nominations yet.</div>
      ) : !isMobile ? (
        // DESKTOP TABLE
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFC', borderBottom:`1px solid ${C.border}` }}>
                {['Child','School / Grade','Nominator','Parent Contact','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nominations.map((n,i)=>(
                <>
                  <tr key={n.id} onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{ borderBottom:`1px solid ${C.border}`, cursor:'pointer', background: expandedId===n.id?'#FFFBF5':'#fff', transition:'background 0.1s' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div>
                      <div style={{ fontSize:11, color:C.light, marginTop:2 }}>{n.grade}</div>
                    </td>
                    <td style={{ padding:'12px 14px', color:C.text }}>{n.school}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ color:C.text }}>{n.nominatorName}</div>
                      <div style={{ fontSize:11, color:C.light }}>{n.nominatorRole}</div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ color:C.text }}>{n.parentName}</div>
                      <div style={{ fontSize:11, color:C.light }}>{n.parentPhone||n.parentEmail}</div>
                    </td>
                    <td style={{ padding:'12px 14px' }}><StatusBadge status={n.status}/></td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {n.status==='pending' && <>
                          <button onClick={e=>{e.stopPropagation();updateStatus(n.id,'approved');}} style={{ padding:'5px 10px', background:C.green, color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Approve</button>
                          <button onClick={e=>{e.stopPropagation();updateStatus(n.id,'declined');}} style={{ padding:'5px 10px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Decline</button>
                        </>}
                        {n.status==='approved' && <button onClick={e=>{e.stopPropagation();updateStatus(n.id,'sent');}} style={{ padding:'5px 10px', background:C.blue, color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Mark Sent</button>}
                        {(n.status==='sent'||n.status==='complete') && n.parentToken && <button onClick={e=>{e.stopPropagation();copyLink(n.parentToken);}} style={{ padding:'5px 10px', background:'#F1F5F9', color:C.navy, border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>📋 Copy Link</button>}
                      </div>
                    </td>
                  </tr>
                  {expandedId===n.id && (
                    <tr key={n.id+'-exp'}>
                      <td colSpan={6} style={{ background:'#FFFBF5', padding:'0 14px 16px', borderBottom:`1px solid ${C.border}` }}>
                        {n.reason && <div style={{ padding:'8px 12px', background:'#FFFBEB', borderRadius:6, fontSize:12, color:'#78350F', lineHeight:1.5, marginBottom:8, marginTop:8 }}><strong>Reason:</strong> {n.reason}</div>}
                        {n.siblings && <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}><strong>Siblings:</strong> {n.siblings}</div>}
                        {n.parentIntake ? (
                          <div style={{ display:'flex', gap:24, padding:'10px 12px', background:'#F0FDF4', borderRadius:8, border:`1px solid #BBF7D0`, fontSize:13 }}>
                            <span>👕 <strong>{n.parentIntake.shirtSize}</strong></span>
                            <span>👖 <strong>{n.parentIntake.pantSize}</strong></span>
                            <span>👟 <strong>{n.parentIntake.shoeSize}</strong></span>
                            <span>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></span>
                            {n.parentIntake.favoriteColors&&<span>❤️ {n.parentIntake.favoriteColors}</span>}
                            {n.parentIntake.avoidColors&&<span>✗ {n.parentIntake.avoidColors}</span>}
                          </div>
                        ) : <div style={{ fontSize:12, color:C.light, fontStyle:'italic' }}>No parent intake yet.</div>}
                        {n.additionalNotes&&<div style={{ fontSize:12, color:C.muted, marginTop:8 }}><strong>Notes:</strong> {n.additionalNotes}</div>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // MOBILE CARDS
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {nominations.map(n=>(
            <div key={n.id} style={{ background:C.card, borderRadius:10, border:`1px solid ${C.border}`, overflow:'hidden' }}>
              <div onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{ padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div>
                  <div style={{ fontSize:12, color:C.light, marginTop:2 }}>{n.school} · {n.grade} · {n.nominatorName}</div>
                </div>
                <StatusBadge status={n.status}/>
              </div>
              {expandedId===n.id&&(
                <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10, fontSize:12 }}>
                    <div><span style={{ color:C.light }}>Parent:</span> {n.parentName}</div>
                    <div><span style={{ color:C.light }}>Phone:</span> {n.parentPhone||'—'}</div>
                  </div>
                  {n.reason&&<div style={{ marginTop:8, padding:'8px 10px', background:'#FFFBEB', borderRadius:6, fontSize:12, color:'#78350F', lineHeight:1.5 }}><strong>Reason:</strong> {n.reason}</div>}
                  {n.parentIntake&&(
                    <div style={{ marginTop:8, padding:10, background:'#F0FDF4', borderRadius:6, border:`1px solid #BBF7D0`, fontSize:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                      <div>👕 Shirt: <strong>{n.parentIntake.shirtSize}</strong></div>
                      <div>👖 Pants: <strong>{n.parentIntake.pantSize}</strong></div>
                      <div>👟 Shoe: <strong>{n.parentIntake.shoeSize}</strong></div>
                      <div>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></div>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    {n.status==='pending'&&<><button onClick={()=>updateStatus(n.id,'approved')} style={{ flex:1, padding:8, background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Approve</button><button onClick={()=>updateStatus(n.id,'declined')} style={{ padding:'8px 14px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button></>}
                    {n.status==='approved'&&<button onClick={()=>updateStatus(n.id,'sent')} style={{ flex:1, padding:8, background:C.blue, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Mark Sent to Parent</button>}
                    {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={()=>copyLink(n.parentToken)} style={{ flex:1, padding:8, background:'#F1F5F9', color:C.navy, border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>📋 Copy Parent Link</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Video Capture ───
function VideoCapture({ token, childFirst, onDone }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('choose');
  const [stream, setStream] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopStream = useCallback(()=>{ if(stream) stream.getTracks().forEach(t=>t.stop()); setStream(null); },[stream]);
  useEffect(()=>()=>{ stopStream(); clearInterval(timerRef.current); },[stopStream]);

  const startCamera = async() => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}, audio:true });
      setStream(s); setMode('record');
      setTimeout(()=>{ if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();} },100);
    } catch { setError('Could not access camera. Try uploading instead.'); setMode('upload'); }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current=[];
    const mt = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':MediaRecorder.isTypeSupported('video/webm')?'video/webm':'video/mp4';
    const rec = new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:2500000});
    rec.ondataavailable=e=>{ if(e.data.size>0) chunksRef.current.push(e.data); };
    rec.onstop=()=>{ const blob=new Blob(chunksRef.current,{type:mt}); setRecordedBlob(blob); const url=URL.createObjectURL(blob); if(previewRef.current){previewRef.current.src=url;previewRef.current.play();} stopStream(); };
    setRecorder(rec); rec.start(1000); setRecording(true); setCountdown(60);
    timerRef.current=setInterval(()=>setCountdown(c=>{ if(c<=1){clearInterval(timerRef.current);rec.stop();setRecording(false);return 0;} return c-1; }),1000);
  };

  const stopRecording = () => { clearInterval(timerRef.current); if(recorder&&recorder.state!=='inactive') recorder.stop(); setRecording(false); };

  const retake = () => { setRecordedBlob(null); setMode('record'); startCamera(); };

  const handleFile = e => {
    const file=e.target.files[0]; if(!file) return;
    if(file.size>50*1024*1024){setError('Video must be under 50MB');return;}
    setUploadedFile(file); const url=URL.createObjectURL(file); if(previewRef.current) previewRef.current.src=url; setMode('upload');
  };

  const upload = async() => {
    const blob=recordedBlob||uploadedFile; if(!blob) return;
    setMode('uploading'); setProgress(0);
    try {
      const fd=new FormData(); const ext=uploadedFile?.name?.split('.').pop()||'webm'; fd.append('video',blob,`video.${ext}`);
      await new Promise((resolve,reject)=>{ const xhr=new XMLHttpRequest(); xhr.upload.onprogress=e=>{ if(e.lengthComputable) setProgress(Math.round(e.loaded/e.total*100)); }; xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(); xhr.onerror=reject; xhr.open('POST',`${API}/upload/${token}`); xhr.send(fd); });
      setMode('done');
    } catch { setError('Upload failed. Try again.'); setMode(recordedBlob?'record':'upload'); }
  };

  const maxW = isMobile ? '100%' : 560;
  const pad = isMobile ? '0 16px 24px' : '0 40px 32px';

  if (mode==='done') return (
    <div style={{ textAlign:'center', padding: isMobile?'32px 20px':'48px 40px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:6 }}>Video received!</h3>
      <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, marginBottom:20 }}>The DEF team will use this to make shopping for {childFirst} extra special.</p>
      <button onClick={onDone} style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>All done ✓</button>
    </div>
  );

  if (mode==='uploading') return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ fontSize:36, marginBottom:16 }}>📤</div>
      <p style={{ color:C.navy, fontWeight:600, marginBottom:16 }}>Uploading... {progress}%</p>
      <div style={{ height:8, background:C.border, borderRadius:4, maxWidth:320, margin:'0 auto' }}><div style={{ height:8, background:C.pink, borderRadius:4, width:`${progress}%`, transition:'width 0.3s' }}/></div>
    </div>
  );

  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:pad }}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎬</div>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.navy, marginBottom:4 }}>Optional: Record a short video</h3>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, maxWidth:360, margin:'0 auto' }}>Show {childFirst}'s personality! 30–60 seconds helps volunteers shop with heart.</p>
      </div>
      {error&&<div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      {mode==='record'&&<div style={{ position:'relative', marginBottom:16 }}><video ref={videoRef} muted playsInline style={{ width:'100%', borderRadius:12, background:'#000', maxHeight:280, objectFit:'cover' }}/>{recording&&<div style={{ position:'absolute', top:12, right:12, background:C.pink, color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:700 }}>● {countdown}s</div>}</div>}
      {(recordedBlob||uploadedFile)&&<div style={{ marginBottom:16 }}><video ref={previewRef} controls playsInline style={{ width:'100%', borderRadius:12, background:'#000', maxHeight:280, objectFit:'cover' }}/></div>}
      {mode==='choose'&&<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <button onClick={startCamera} style={{ padding:'20px 12px', background:C.navy, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', textAlign:'center' }}>📷<br/><span style={{ fontSize:12, fontWeight:400, opacity:0.8 }}>Record now</span></button>
        <label style={{ padding:'20px 12px', background:'#F8FAFC', border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', textAlign:'center', display:'block' }}>📁<br/><span style={{ fontSize:12, fontWeight:400, color:C.muted }}>Upload file</span><input type="file" accept="video/*" onChange={handleFile} style={{ display:'none' }}/></label>
      </div>}
      {mode==='record'&&!recordedBlob&&<div style={{ display:'flex', gap:12, marginBottom:16 }}>{!recording?<button onClick={startRecording} style={{ flex:1, padding:14, background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>● Start Recording</button>:<button onClick={stopRecording} style={{ flex:1, padding:14, background:C.navy, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>■ Stop Recording</button>}</div>}
      {(recordedBlob||uploadedFile)&&<div style={{ display:'flex', gap:12 }}><button onClick={retake} style={{ flex:1, padding:12, background:'#F1F5F9', color:C.muted, border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>{recordedBlob?'Retake':'Choose different'}</button><button onClick={upload} style={{ flex:2, padding:12, background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>Upload Video →</button></div>}
      {mode==='upload'&&!uploadedFile&&<label style={{ display:'block', padding:20, background:'#F8FAFC', border:`2px dashed ${C.border}`, borderRadius:10, textAlign:'center', cursor:'pointer', marginBottom:16 }}><div style={{ fontSize:28, marginBottom:6 }}>📁</div><div style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:2 }}>Tap to choose a video</div><div style={{ fontSize:12, color:C.light }}>MP4, MOV, or any format · Max 50MB</div><input type="file" accept="video/*" onChange={handleFile} style={{ display:'none' }}/></label>}
      <button onClick={onDone} style={{ width:'100%', padding:10, background:'none', border:'none', color:C.light, fontSize:13, cursor:'pointer', marginTop:8 }}>Skip — no video</button>
    </div>
  );
}

// ─── Parent Intake ───
function ParentIntake({ token }) {
  const isMobile = useIsMobile();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ shirtSize:'', pantSize:'', shoeSize:'', favoriteColors:'', avoidColors:'', allergies:'', preferences:'' });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form');
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  useEffect(()=>{
    (async()=>{
      try { const data=await api(`/intake/${token}`); setChild(data); if(data.alreadySubmitted) setStep('done'); }
      catch(err) { setError(err.message); }
      setLoading(false);
    })();
  },[token]);

  const submit = async() => {
    if (!form.shirtSize||!form.pantSize||!form.shoeSize) { alert('Please fill in shirt, pant, and shoe sizes.'); return; }
    setSubmitting(true);
    try { await api(`/intake/${token}`,{method:'POST',body:JSON.stringify(form)}); setStep('video'); }
    catch(err) { setError(err.message); }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>;
  if (error) return <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:48, marginBottom:16 }}>🔒</div><p style={{ color:'#991B1B', fontSize:14 }}>{error}</p></div>;
  if (step==='done') return <div style={{ textAlign:'center', padding: isMobile?'60px 20px':'80px 40px' }}><div style={{ fontSize:56, marginBottom:16 }}>🎒</div><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?24:28, color:C.navy, marginBottom:8 }}>All Done!</h2><p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto' }}>We have everything we need for {child?.childFirst}. A volunteer will shop brand new clothes just for them.</p></div>;
  if (step==='video') return <VideoCapture token={token} childFirst={child?.childFirst} onDone={()=>setStep('done')}/>;

  const maxW = isMobile ? '100%' : 680;
  const pad = isMobile ? '20px 16px' : '32px 40px';

  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:pad }}>
      <div style={{ textAlign:'center', marginBottom:isMobile?24:32 }}>
        <div style={{ fontSize: isMobile?36:48, marginBottom:8 }}>🎒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?22:28, color:C.navy, marginBottom:4 }}>Sizes for {child?.childFirst}</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.5, maxWidth:400, margin:'0 auto' }}>A volunteer will shop brand new clothes for your child. Takes about 2 minutes.</p>
      </div>
      <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:10, padding:'12px 16px', marginBottom:28, fontSize:13, color:'#9A3412', lineHeight:1.5 }}>
        Everything shared here is confidential and used only for shopping.
      </div>

      <div style={{ display: isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
        <div>
          <p style={secHead(isMobile)}>Clothing Sizes</p>
          <Row cols={3} gap={10} style={{ marginBottom:0 }}>
            <Field label="Shirt *"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Size</option>{SHIRT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Pants *"><select style={{...inp(),appearance:'auto'}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}><option value="">Size</option>{PANT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Shoe *"><input style={inp()} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)} placeholder="e.g., 4Y"/></Field>
          </Row>
        </div>
        <div>
          <p style={secHead(isMobile)}>Preferences <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10, color:C.light }}>optional</span></p>
          <Field label="Favorite colors, styles, or characters?"><input style={inp()} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)} placeholder="e.g., Blue, dinosaurs, soccer"/></Field>
          <Field label="Colors or styles to avoid?"><input style={inp()} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)} placeholder="e.g., No pink, no ruffles"/></Field>
          <Field label="Allergies or sensory needs?"><input style={inp()} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder="e.g., No wool, needs soft fabrics"/></Field>
          <Field label="Anything else?"><textarea style={{...inp(),minHeight:60,resize:'vertical'}} value={form.preferences} onChange={e=>upd('preferences',e.target.value)}/></Field>
        </div>
      </div>

      <button onClick={submit} disabled={submitting} style={{ width:'100%', padding: isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', boxShadow:`0 2px 8px rgba(232,84,140,0.3)`, marginTop:24 }}>
        {submitting?'Saving...':'Next — Add a Video →'}
      </button>
      <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:8 }}>After this, you can record a short optional video.</p>
    </div>
  );
}

// ─── App ───
export default function App() {
  const isMobile = useIsMobile();
  const [route, setRoute] = useState(window.location.hash||'#/');
  useEffect(()=>{ const h=()=>setRoute(window.location.hash||'#/'); window.addEventListener('hashchange',h); return()=>window.removeEventListener('hashchange',h); },[]);
  const navigate = hash => { window.location.hash=hash; };

  let view='nominate', token=null;
  if (route.startsWith('#/admin')) view='admin';
  else if (route.startsWith('#/intake/')) { view='parent'; token=route.replace('#/intake/',''); }

  if (view==='parent'&&token) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)` }}>
      {isMobile ? <MobileHeader subtitle="Parent Information"/> : <TopNav view={view} navigate={navigate}/>}
      <ParentIntake token={token}/>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom: isMobile?72:0 }}>
      {isMobile ? <MobileHeader/> : <TopNav view={view} navigate={navigate}/>}
      <div style={{ maxWidth: isMobile?'100%':1100, margin:'0 auto' }}>
        {view==='nominate'&&<NominationForm/>}
        {view==='admin'&&<AdminDashboard/>}
      </div>
      {isMobile&&<MobileNav view={view} navigate={navigate}/>}
    </div>
  );
}
