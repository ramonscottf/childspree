import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';
const SHIRT_SIZES = ["YXS (4-5)","YS (6-7)","YM (8)","YL (10-12)","YXL (14-16)","AS","AM","AL","AXL","A2XL"];
const PANT_SIZES = ["4","5","6","6X/7","8","10","12","14","16","18","20","24W","26W","28W","30W","32W"];
const VOL_SHIRTS = ["YS","YM","YL","AS","AM","AL","AXL","A2XL"];
const SCHOOLS = ["Adams Elementary","Antelope Elementary","Bountiful Elementary","Burton Elementary","Clinton Elementary","Columbia Elementary","Cook Elementary","Doxey Elementary","Eagle Bay Elementary","East Layton Elementary","Ellison Park Elementary","Endeavour Elementary","Farmington Elementary","Foxboro Elementary","Heritage Elementary","Holt Elementary","Kay's Creek Elementary","Knowlton Elementary","Lake View Elementary","Lincoln Elementary","Meadowbrook Elementary","Morgan Elementary","Mountain View Elementary","Muir Elementary","Oak Hills Elementary","Orchard Elementary","Parkside Elementary","Reading Elementary","Rosecrest Elementary","Sand Springs Elementary","Snow Horse Elementary","South Clearfield Elementary","Stewart Elementary","Sunset Elementary","Syracuse Elementary","Taylor Elementary","Tolman Elementary","Vae View Elementary","Valley View Elementary","Wasatch Elementary","Washington Elementary","West Bountiful Elementary","West Clinton Elementary","West Point Elementary","Whitesides Elementary","Woods Cross Elementary","Centerville Junior High","Central Davis Junior High","Fairfield Junior High","Legacy Junior High","Lakeridge Junior High","Mueller Park Junior High","North Davis Junior High","North Layton Junior High","South Davis Junior High","Sunset Junior High","Syracuse Junior High","West Point Junior High","Bountiful High","Clearfield High","Davis High","Farmington High","Layton High","Northridge High","Syracuse High","Viewmont High","Woods Cross High"];
const GRADES = ["Pre-K","K","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
const PHOTOS = [
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/edac9afc-9cc4-4880-ad8a-6c858f765f28/child-spree-america-first-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ddb3a7a7-2722-4d47-ac13-f2ce041042ef/child-spree-citi-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/bcde49b8-2c6d-43cb-a18e-09dd4c08bd50/child-spree-america-first-volunteer-with-shopper.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/5a3d3ca7-d8e5-4dcd-9e7c-87e29d590980/child-spree-teen-volunteer-group-with-cart.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/81ef2dc4-cfcb-4687-aa20-03bf329972c8/child-spree-volunteer-helping-shopper-browse.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ca2263e5-c82c-4a94-bb70-46d64545058b/child-spree-two-volunteers-smiling.jpg?disposition=inline",
];
const C = { navy:'#1B3A4B', pink:'#E8548C', pinkLight:'#F9A8C9', bg:'#F8FAFC', card:'#fff', border:'#E2E8F0', text:'#1E293B', muted:'#64748B', light:'#94A3B8', green:'#059669', red:'#DC2626', amber:'#D97706', blue:'#2563EB' };
const inp = (ex={}) => ({ width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:'#FAFBFC', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s', color:C.text, ...ex });
const lbl = { display:'block', fontSize:12, fontWeight:600, color:C.muted, marginBottom:4, letterSpacing:0.3 };
const secHead = (m) => ({ fontSize:m?10:11, fontWeight:700, color:C.navy, textTransform:'uppercase', letterSpacing:1.2, marginBottom:12, borderBottom:`2px solid ${C.pinkLight}`, paddingBottom:6 });
function Field({ label, children, style }) { return <div style={{ marginBottom:14, ...style }}>{label && <label style={lbl}>{label}</label>}{children}</div>; }
function Row({ cols=2, gap=12, children, style }) { return <div style={{ display:'grid', gridTemplateColumns:Array(cols).fill('1fr').join(' '), gap, ...style }}>{children}</div>; }
function useIsMobile() { const [m,setM]=useState(window.innerWidth<768); useEffect(()=>{ const h=()=>setM(window.innerWidth<768); window.addEventListener('resize',h); return()=>window.removeEventListener('resize',h); },[]); return m; }
async function api(path, opts={}) { const r=await fetch(`${API}${path}`,{headers:{'Content-Type':'application/json',...opts.headers},...opts}); if(!r.ok){const e=await r.json().catch(()=>({error:'Failed'})); throw new Error(e.error||`HTTP ${r.status}`);} return r.json(); }

function StatusBadge({ status, vol }) {
  const nMap = { pending:{bg:'#FEF3C7',t:'#92400E',l:'Pending'}, approved:{bg:'#D1FAE5',t:'#065F46',l:'Approved'}, sent:{bg:'#DBEAFE',t:'#1E40AF',l:'Sent'}, complete:{bg:'#E0E7FF',t:'#3730A3',l:'Complete'}, declined:{bg:'#FEE2E2',t:'#991B1B',l:'Declined'} };
  const vMap = { registered:{bg:'#E0E7FF',t:'#3730A3',l:'Registered'}, confirmed:{bg:'#D1FAE5',t:'#065F46',l:'Confirmed'}, assigned:{bg:'#DBEAFE',t:'#1E40AF',l:'Assigned'}, attended:{bg:'#FEF3C7',t:'#92400E',l:'Attended'} };
  const map = vol ? vMap : nMap;
  const c = map[status] || map[vol?'registered':'pending'];
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.t, textTransform:'uppercase', letterSpacing:0.3 }}>{c.l}</span>;
}

function TopNav({ view, navigate }) {
  const items = [
    {key:'home',hash:'#/',label:'Home'},{key:'nominate',hash:'#/nominate',label:'Nominate'},
    {key:'volunteer',hash:'#/volunteer',label:'Volunteer'},{key:'admin',hash:'#/admin',label:'Admin'},
  ];
  return (
    <nav style={{ background:C.navy, padding:'0 32px', display:'flex', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
      <button onClick={()=>navigate('#/')} style={{ display:'flex', alignItems:'center', gap:10, flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:C.pink, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎒</div>
        <div style={{ textAlign:'left' }}>
          <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, lineHeight:1 }}>Child Spree 2026</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', marginTop:1 }}>Davis Education Foundation</div>
        </div>
      </button>
      <div style={{ display:'flex', gap:4 }}>
        {items.map(item => { const active=view===item.key; return (
          <button key={item.key} onClick={()=>navigate(item.hash)} style={{ padding:'8px 14px', background:active?'rgba(255,255,255,0.15)':'none', border:'none', borderRadius:6, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:active?1:0.65 }}>{item.label}</button>
        ); })}
      </div>
    </nav>
  );
}
function MobileHeader({ onHome }) {
  return (
    <div style={{ background:C.navy, color:'#fff', padding:'14px 16px 12px', textAlign:'center' }}>
      <button onClick={onHome} style={{ background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ fontSize:36, marginBottom:4 }}>🎒</div>
        <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800 }}>Child Spree 2026</div>
        <div style={{ fontSize:9, fontWeight:500, letterSpacing:1.5, textTransform:'uppercase', opacity:0.5, marginTop:1 }}>Davis Education Foundation</div>
      </button>
    </div>
  );
}
function MobileNav({ view, navigate }) {
  const items = [{key:'home',hash:'#/',icon:'🏠',label:'Home'},{key:'nominate',hash:'#/nominate',icon:'📋',label:'Nominate'},{key:'volunteer',hash:'#/volunteer',icon:'🛒',label:'Volunteer'},{key:'admin',hash:'#/admin',icon:'⚙️',label:'Admin'}];
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-around', padding:'8px 0 16px', boxShadow:'0 -2px 8px rgba(0,0,0,0.04)', zIndex:100 }}>
      {items.map(item => { const active=view===item.key; return (
        <button key={item.key} onClick={()=>navigate(item.hash)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, opacity:active?1:0.4 }}>
          <span style={{ fontSize:18 }}>{item.icon}</span>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, color:active?C.pink:C.light, textTransform:'uppercase' }}>{item.label}</span>
        </button>
      ); })}
    </div>
  );
}

// ─── LANDING ───
function LandingPage({ navigate }) {
  const isMobile = useIsMobile();
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => { const t=setInterval(()=>setPhotoIdx(i=>(i+1)%PHOTOS.length),4000); return()=>clearInterval(t); }, []);
  const stats = [{num:'500+',label:'Students served each August'},{num:'$150',label:'Per child — head to toe'},{num:'400+',label:'Volunteers before sunrise'},{num:'1',label:'Day that changes a year'}];
  const journey = [
    {icon:'✏️',title:'A teacher sees the need',body:'It starts in the classroom. An educator notices a student wearing the same worn-out clothes. They fill out a quiet nomination. No awkward conversations. Just someone who cares taking the first step.'},
    {icon:'🎬',title:'A child shares their dream outfit',body:"Families share sizes and students record a short video. Favorite colors. The shoes they've been dreaming about. For many, it's the first time anyone has asked what they actually want to wear."},
    {icon:'🛒',title:'A stranger wakes up early to shop',body:"Before sunrise on the first Friday of August, 400+ volunteers arrive at Kohl's. Each one is matched to a single child — they've watched the video, they know the favorite color, they're ready."},
    {icon:'✨',title:"A child walks in like they own the place",body:"New shoes. New backpack. New everything. The look on a child's face when they realize someone they've never met cared enough to pick out their first new outfit. That's Child Spree."},
  ];
  return (
    <div style={{ background:'#fff' }}>
      <div style={{ position:'relative', height:isMobile?'60vh':'80vh', overflow:'hidden' }}>
        {PHOTOS.map((src,i)=>(
          <div key={i} style={{ position:'absolute', inset:0, transition:'opacity 1.2s ease', opacity:i===photoIdx?1:0 }}>
            <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.25) 0%,rgba(27,58,75,0.88) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:isMobile?'32px 20px':'60px 64px', maxWidth:800 }}>
          <div style={{ color:'rgba(249,168,201,0.9)', fontSize:isMobile?11:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Every August · Kohl's Layton, UT</div>
          <h1 style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:isMobile?'2.2rem':'3.8rem', fontWeight:700, lineHeight:1.1, margin:'0 0 16px' }}>
            500+ students.<br/>Brand new clothes.<br/><em style={{ color:C.pinkLight }}>One unforgettable morning.</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:isMobile?14:16, lineHeight:1.7, maxWidth:540, margin:'0 0 28px' }}>Every August, Davis County volunteers wake up before sunrise to shop for a child they've never met — based on that child's video, their favorite color, their dream outfit.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={()=>navigate('#/nominate')} style={{ padding:isMobile?'13px 24px':'16px 32px', background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:isMobile?14:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(232,84,140,0.4)' }}>Nominate a Child →</button>
            <button onClick={()=>navigate('#/volunteer')} style={{ padding:isMobile?'13px 24px':'16px 32px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:10, fontSize:isMobile?14:16, fontWeight:600, cursor:'pointer', backdropFilter:'blur(4px)' }}>Volunteer to Shop</button>
          </div>
        </div>
      </div>
      <div style={{ background:C.navy, padding:isMobile?'40px 20px':'48px 64px' }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:isMobile?20:32, maxWidth:1100, margin:'0 auto' }}>
          {stats.map(s=>(
            <div key={s.num} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?'2.5rem':'3.5rem', fontWeight:700, color:C.pinkLight, lineHeight:1 }}>{s.num}</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:isMobile?12:14, marginTop:6, lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:isMobile?'56px 20px':'80px 64px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.pink, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>The Journey</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?'1.8rem':'2.5rem', color:C.navy, margin:'0 0 16px' }}>From a teacher's heart<br/>to a child's first-day smile.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:24 }}>
          {journey.map((step,i)=>(
            <div key={i} style={{ background:C.bg, borderRadius:14, padding:'28px', borderLeft:`4px solid ${C.pink}`, display:'flex', gap:16 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{step.icon}</div>
              <div><h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:C.navy, marginBottom:8, fontWeight:600 }}>{step.title}</h3><p style={{ color:C.muted, fontSize:13, lineHeight:1.7, margin:0 }}>{step.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:isMobile?'0 20px 56px':'0 64px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)', gap:12 }}>
          {PHOTOS.slice(0,isMobile?4:6).map((src,i)=>(
            <div key={i} style={{ borderRadius:12, overflow:'hidden', aspectRatio:'4/3' }}>
              <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' }} onMouseEnter={e=>e.target.style.transform='scale(1.04)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.bg, padding:isMobile?'48px 20px':'64px', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:24, maxWidth:1100, margin:'0 auto' }}>
        <div style={{ background:C.navy, borderRadius:16, padding:isMobile?'32px 24px':'40px', color:'#fff' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>📋</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:24, margin:'0 0 12px' }}>Nominate a Child</h3>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:1.7, marginBottom:24 }}>Teachers, counselors, and school staff — if you know a student who needs support, nominate them. It takes 3 minutes and could change their entire school year.</p>
          <button onClick={()=>navigate('#/nominate')} style={{ padding:'13px 28px', background:C.pink, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Start a Nomination →</button>
        </div>
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding:isMobile?'32px 24px':'40px' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🛒</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:24, color:C.navy, margin:'0 0 12px' }}>Volunteer to Shop</h3>
          <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>Join 400+ volunteers on the first Friday of August at Kohl's in Layton. You'll be matched with one child and shop for them like they're family.</p>
          <button onClick={()=>navigate('#/volunteer')} style={{ padding:'13px 28px', background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Sign Up to Volunteer →</button>
        </div>
      </div>
      <div style={{ background:C.navy, padding:isMobile?'48px 20px':'64px', textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.pinkLight, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Make it possible</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?'1.8rem':'2.5rem', color:'#fff', margin:'0 0 16px' }}>Sponsor a Student</h2>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:isMobile?14:16, lineHeight:1.7, maxWidth:460, margin:'0 auto 28px' }}>$150 covers one child — head to toe. New shoes. New clothes. New backpack. One donation. One complete, unforgettable morning.</p>
        <a href="https://dsdgive.net/event/2" target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'16px 36px', background:C.pink, color:'#fff', borderRadius:10, fontSize:16, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 20px rgba(232,84,140,0.4)' }}>Sponsor a Child — $150</a>
      </div>
      <div style={{ background:'#0f2634', padding:'28px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:'0 0 6px' }}>Child Spree 2026 · Davis Education Foundation · <a href="https://daviskids.org/events-child-spree" target="_blank" rel="noreferrer" style={{ color:'rgba(255,255,255,0.4)' }}>daviskids.org</a></p>
      </div>
    </div>
  );
}

// ─── NOMINATE ───
function NominationForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({childFirst:'',childLast:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblingCount:0,siblingNames:'',additionalNotes:''});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = async() => {
    setError(null);
    if (!form.childFirst||!form.childLast||!form.school||!form.grade) { setError('Please fill in all child information.'); return; }
    if (!form.nominatorName||!form.nominatorEmail) { setError('Please fill in your name and email.'); return; }
    if (!form.parentName) { setError('Parent/guardian name required.'); return; }
    if (!form.parentPhone&&!form.parentEmail) { setError('Please provide at least one parent contact.'); return; }
    setSubmitting(true);
    try { await api('/nominations',{method:'POST',body:JSON.stringify(form)}); setSubmitted(true); } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (submitted) return (
    <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✓</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>Nomination Received</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>Thank you. The DEF team will review and reach out to the family. You'll receive an email confirmation shortly.</p>
      <button onClick={()=>{setSubmitted(false);setForm({childFirst:'',childLast:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblingCount:0,siblingNames:'',additionalNotes:''});}} style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Nominate Another Child</button>
    </div>
  );
  const maxW = isMobile?'100%':760;
  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'20px 16px':'32px 40px' }}>
      {!isMobile && (
        <div style={{ display:'flex', gap:28, alignItems:'flex-start', marginBottom:28 }}>
          <div style={{ flex:'0 0 240px', borderRadius:12, overflow:'hidden' }}><img src={PHOTOS[2]} alt="" style={{ width:'100%', height:170, objectFit:'cover', display:'block' }}/></div>
          <div style={{ flex:1, paddingTop:4 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:C.navy, marginBottom:8 }}>Nominate a Child</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:12 }}>Be the reason a child walks into school with confidence. Takes about 3 minutes.</p>
            <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#0C4A6E' }}>All information is kept strictly confidential. Families are never told who nominated their child.</div>
          </div>
        </div>
      )}
      {isMobile && <><div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}><img src={PHOTOS[2]} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}/></div><div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:4 }}>Nominate a Child</h2><p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>Be the reason a child walks into school with confidence.</p></div><div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:'#0C4A6E' }}>All info is kept confidential. Families are never told who nominated.</div></>}
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>Child Information</p>
          <Row cols={2} gap={10}><Field label="First Name *"><input style={inp()} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)} placeholder="First"/></Field><Field label="Last Name *"><input style={inp()} value={form.childLast} onChange={e=>upd('childLast',e.target.value)} placeholder="Last"/></Field></Row>
          <Row cols={isMobile?2:1} gap={10}><Field label="School *"><select style={{...inp(),appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">Select school...</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Grade *"><select style={{...inp(),appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">Grade</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></Field></Row>
          <p style={{...secHead(isMobile),marginTop:20}}>Your Information</p>
          <Field label="Your Name *"><input style={inp()} value={form.nominatorName} onChange={e=>upd('nominatorName',e.target.value)} placeholder="Full name"/></Field>
          <Row cols={2} gap={10}><Field label="Role *"><select style={{...inp(),appearance:'auto'}} value={form.nominatorRole} onChange={e=>upd('nominatorRole',e.target.value)}>{['Teacher','Counselor','Family Advocate','Administrator','Other'].map(r=><option key={r} value={r}>{r}</option>)}</select></Field><Field label="Email *"><input style={inp()} type="email" value={form.nominatorEmail} onChange={e=>upd('nominatorEmail',e.target.value)} placeholder="you@davis.k12.ut.us"/></Field></Row>
        </div>
        <div>
          <p style={secHead(isMobile)}>Parent / Guardian</p>
          <Field label="Name *"><input style={inp()} value={form.parentName} onChange={e=>upd('parentName',e.target.value)} placeholder="Full name"/></Field>
          <Row cols={2} gap={10}><Field label="Phone"><input style={inp()} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)} placeholder="(801) 555-0000"/></Field><Field label="Email"><input style={inp()} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)} placeholder="parent@email.com"/></Field></Row>
          <p style={{...secHead(isMobile),marginTop:20}}>Details</p>
          <Field label="Why are you nominating this child?"><textarea style={{...inp(),minHeight:isMobile?72:100,resize:'vertical'}} value={form.reason} onChange={e=>upd('reason',e.target.value)} placeholder="Brief explanation — stays confidential"/></Field>
          <Field label="Additional siblings to nominate?">
            <div style={{display:'flex', gap:10, alignItems:'center', marginBottom: form.siblingCount > 0 ? 10 : 0}}>
              <div style={{flex:'0 0 auto'}}>
                <label style={lbl}>How many siblings?</label>
                <select style={{...inp({width:100}), appearance:'auto'}} value={form.siblingCount} onChange={e=>upd('siblingCount',parseInt(e.target.value))}>
                  {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n===0?'None':n}</option>)}
                </select>
              </div>
              {form.siblingCount > 0 && (
                <div style={{flex:1}}>
                  <label style={lbl}>Sibling names & grades</label>
                  <input style={inp()} value={form.siblingNames} onChange={e=>upd('siblingNames',e.target.value)} placeholder={form.siblingCount===1?'e.g., Maria (3rd)':'e.g., Maria (3rd), James (K)'}/>
                </div>
              )}
            </div>
            {form.siblingCount > 0 && (
              <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#92400E',lineHeight:1.5}}>
                📋 The parent will receive a separate size form for each child. Their notification will note that {form.siblingCount+1} children from their family were nominated.
              </div>
            )}
          </Field>
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <button onClick={submit} disabled={submitting} style={{ width:'100%', padding:isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', boxShadow:`0 2px 8px rgba(232,84,140,0.3)` }}>{submitting?'Submitting...':'Submit Nomination'}</button>
        <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:8 }}>All information is strictly confidential.</p>
      </div>
    </div>
  );
}

// ─── VOLUNTEER FORM ───
function VolunteerForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', organization:'', groupType:'Individual', shirtSize:'', earlyArrival:false, storeLocation:'', experience:'', hearAbout:'', smsOptIn:true });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = async() => {
    setError(null);
    if (!form.firstName||!form.lastName) { setError('Please enter your name.'); return; }
    if (!form.email&&!form.phone) { setError('Please provide email or phone so we can reach you.'); return; }
    setSubmitting(true);
    try { await api('/volunteers',{method:'POST',body:JSON.stringify(form)}); setSubmitted(true); } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (submitted) return (
    <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🛒</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>You're Registered!</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:420, margin:'0 auto 12px' }}>Thank you for signing up to volunteer at Child Spree 2026. Check your email for a confirmation. We'll be in touch as the event approaches!</p>
      <p style={{ color:C.muted, fontSize:13, marginBottom:28 }}>📅 First Friday of August · Kohl's, Layton UT · Before sunrise</p>
      <a href="https://daviskids.org/events-child-spree" target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'12px 28px', background:C.navy, color:'#fff', borderRadius:8, fontSize:14, fontWeight:700, textDecoration:'none' }}>Learn More About the Event →</a>
    </div>
  );
  const photo = PHOTOS[1];
  return (
    <div style={{ maxWidth:isMobile?'100%':760, margin:'0 auto', padding:isMobile?'20px 16px':'32px 40px' }}>
      {!isMobile && (
        <div style={{ display:'flex', gap:28, alignItems:'flex-start', marginBottom:28 }}>
          <div style={{ flex:'0 0 240px', borderRadius:12, overflow:'hidden' }}><img src={photo} alt="" style={{ width:'100%', height:170, objectFit:'cover', display:'block' }}/></div>
          <div style={{ flex:1, paddingTop:4 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:C.navy, marginBottom:8 }}>Volunteer to Shop</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:12 }}>Join 400+ volunteers on the first Friday of August at Kohl's in Layton. You'll be matched to one child and shop for them head to toe.</p>
            <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#166534' }}>📅 First Friday of August · Kohl's Layton · Arrive ~7:00 AM</div>
          </div>
        </div>
      )}
      {isMobile && <><div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}><img src={photo} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}/></div><div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:4 }}>Volunteer to Shop</h2><p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>Join 400+ volunteers. Be matched to one child. Shop for them like they're family.</p></div><div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:'#166534' }}>📅 First Friday of August · Kohl's Layton · Arrive ~7:00 AM</div></>}
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>Your Information</p>
          <Row cols={2} gap={10}><Field label="First Name *"><input style={inp()} value={form.firstName} onChange={e=>upd('firstName',e.target.value)} placeholder="First"/></Field><Field label="Last Name *"><input style={inp()} value={form.lastName} onChange={e=>upd('lastName',e.target.value)} placeholder="Last"/></Field></Row>
          <Field label="Email *"><input style={inp()} type="email" value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="you@example.com"/></Field>
          <Field label="Phone (for text updates)"><input style={inp()} type="tel" value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="(801) 555-0000"/></Field>
          <Field label="Organization / School / Company"><input style={inp()} value={form.organization} onChange={e=>upd('organization',e.target.value)} placeholder="Optional"/></Field>
          <Field label="Group type"><select style={{...inp(),appearance:'auto'}} value={form.groupType} onChange={e=>upd('groupType',e.target.value)}>{['Individual','Corporate Group','Church Group','School Group','Family','Other'].map(t=><option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div>
          <p style={secHead(isMobile)}>Event Details</p>
          <Field label="T-shirt size"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Select size...</option>{VOL_SHIRTS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Can you arrive by 7:00 AM?">
            <div style={{ display:'flex', gap:12 }}>
              {[['Yes, I\'ll be there!',true],['I\'ll try my best',false]].map(([label,val])=>(
                <label key={String(val)} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:C.text }}>
                  <input type="radio" name="earlyArrival" checked={form.earlyArrival===val} onChange={()=>upd('earlyArrival',val)} style={{ accentColor:C.pink }}/>{label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Any experience with shopping for or working with kids?"><textarea style={{...inp(),minHeight:72,resize:'vertical'}} value={form.experience} onChange={e=>upd('experience',e.target.value)} placeholder="Optional — helps us match you"/></Field>
          <Field label="Preferred Kohl's location *">
            <select style={{...inp(),appearance:'auto'}} value={form.storeLocation} onChange={e=>upd('storeLocation',e.target.value)}>
              <option value="">Select a store...</option>
              {["Kohl's Layton (881 W Antelope Dr)","Kohl's Centerville (510 N 400 W)","Kohl's Clinton (1526 N 2000 W)"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="How did you hear about Child Spree?"><select style={{...inp(),appearance:'auto'}} value={form.hearAbout} onChange={e=>upd('hearAbout',e.target.value)}><option value="">Select...</option>{['School or teacher','DEF newsletter','Social media','Friend or coworker','My employer','Church','Other'].map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', marginTop:8 }}>
            <input type="checkbox" checked={form.smsOptIn} onChange={e=>upd('smsOptIn',e.target.checked)} style={{ marginTop:2, accentColor:C.pink }}/>
            <span style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>I agree to receive text message updates about volunteering at Child Spree 2026. Reply STOP to opt out anytime.</span>
          </label>
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <button onClick={submit} disabled={submitting} style={{ width:'100%', padding:isMobile?14:16, background:submitting?C.light:C.navy, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer' }}>{submitting?'Registering...':'Sign Up to Volunteer'}</button>
      </div>
    </div>
  );
}

// ─── VIDEO CAPTURE (fixed) ───
function VideoCapture({ token, childFirst, onDone }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('choose'); // choose | camera | preview | upload | uploading | done
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

  const stopStream = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);
  useEffect(() => () => { stopStream(); clearInterval(timerRef.current); }, []);

  // Assign stream to video element whenever stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, mode]);

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:720} }, audio:true });
      setStream(s);
      setMode('camera');
    } catch(err) {
      setError('Camera access was denied. Please use the upload option instead.');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mt = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const rec = new MediaRecorder(stream, { mimeType:mt, videoBitsPerSecond:2000000 });
    rec.ondataavailable = e => { if (e.data.size>0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type:mt });
      setRecordedBlob(blob);
      stopStream();
      setMode('preview');
      setTimeout(() => {
        if (previewRef.current) { previewRef.current.src = URL.createObjectURL(blob); previewRef.current.play().catch(()=>{}); }
      }, 100);
    };
    setRecorder(rec); rec.start(1000);
    setRecording(true); setCountdown(60);
    timerRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(timerRef.current); rec.stop(); setRecording(false); return 0; }
      return c - 1;
    }), 1000);
  };

  const stopRecording = () => { clearInterval(timerRef.current); if(recorder&&recorder.state!=='inactive')recorder.stop(); setRecording(false); };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100*1024*1024) { setError('Video must be under 100MB'); return; }
    setUploadedFile(file);
    setMode('preview');
    setTimeout(() => { if(previewRef.current){previewRef.current.src=URL.createObjectURL(file);previewRef.current.play().catch(()=>{});} }, 100);
  };

  const upload = async () => {
    const blob = recordedBlob || uploadedFile;
    if (!blob) return;
    setMode('uploading'); setProgress(0);
    try {
      const fd = new FormData();
      const ext = uploadedFile?.name?.split('.').pop() || 'webm';
      fd.append('video', blob, `video.${ext}`);
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if(e.lengthComputable) setProgress(Math.round(e.loaded/e.total*100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed'));
        xhr.onerror = reject;
        xhr.open('POST', `${API}/upload/${token}`);
        xhr.send(fd);
      });
      setMode('done');
    } catch(err) {
      setError('Upload failed. Please try again.');
      setMode(recordedBlob ? 'preview' : 'upload');
    }
  };

  if (mode === 'done') return (
    <div style={{ textAlign:'center', padding:isMobile?'32px 20px':'48px 40px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:6 }}>Video received!</h3>
      <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, marginBottom:20 }}>A volunteer will watch this to make sure everything is perfect for {childFirst}.</p>
      <button onClick={onDone} style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Finish ✓</button>
    </div>
  );
  if (mode === 'uploading') return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ fontSize:36, marginBottom:16 }}>📤</div>
      <p style={{ color:C.navy, fontWeight:600, marginBottom:16 }}>Uploading... {progress}%</p>
      <div style={{ height:8, background:C.border, borderRadius:4, maxWidth:320, margin:'0 auto' }}>
        <div style={{ height:8, background:C.pink, borderRadius:4, width:`${progress}%`, transition:'width 0.3s' }}/>
      </div>
    </div>
  );

  const maxW = isMobile ? '100%' : 500;
  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'0 16px 24px':'0 40px 32px' }}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎬</div>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.navy, marginBottom:4 }}>Optional: Record a short video</h3>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, maxWidth:360, margin:'0 auto' }}>30–60 seconds helps volunteers shop with heart. Tell us {childFirst}'s favorite color, what they love!</p>
      </div>
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#991B1B' }}>{error}</div>}

      {mode === 'choose' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <button onClick={startCamera} style={{ padding:'24px 12px', background:C.navy, color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'center', lineHeight:1.6 }}>📷<br/>Record with camera</button>
          <label style={{ padding:'24px 12px', background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'center', lineHeight:1.6, display:'block', color:C.navy }}>
            📁<br/>Upload a video
            <input type="file" accept="video/*" onChange={handleFile} style={{ display:'none' }}/>
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div style={{ marginBottom:16 }}>
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#000', marginBottom:12 }}>
            <video ref={videoRef} muted playsInline style={{ width:'100%', maxHeight:280, objectFit:'cover', display:'block' }}/>
            {recording && <div style={{ position:'absolute', top:10, right:10, background:'rgba(232,84,140,0.9)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:700 }}>● {countdown}s left</div>}
          </div>
          {!recording
            ? <button onClick={startRecording} style={{ width:'100%', padding:14, background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>● Start Recording</button>
            : <button onClick={stopRecording} style={{ width:'100%', padding:14, background:C.navy, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>■ Stop & Preview</button>
          }
        </div>
      )}

      {mode === 'preview' && (
        <div style={{ marginBottom:16 }}>
          <video ref={previewRef} controls playsInline style={{ width:'100%', borderRadius:12, background:'#000', maxHeight:280, objectFit:'cover', display:'block', marginBottom:12 }}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setRecordedBlob(null); setUploadedFile(null); setMode('choose'); }} style={{ flex:1, padding:12, background:'#F1F5F9', color:C.muted, border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Try again</button>
            <button onClick={upload} style={{ flex:2, padding:12, background:C.pink, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Upload this video →</button>
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={onDone} style={{ background:'none', border:'none', color:C.light, fontSize:13, cursor:'pointer', padding:'8px 20px' }}>Skip — no video</button>
      </div>
    </div>
  );
}

// ─── PARENT INTAKE ───
function ParentIntake({ token }) {
  const isMobile = useIsMobile();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ gender:'', department:'', shirtSize:'', pantSize:'', shoeSize:'', favoriteColors:'', avoidColors:'', allergies:'', preferences:'' });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form');
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  useEffect(() => { (async()=>{ try{ const data=await api(`/intake/${token}`); setChild(data); if(data.alreadySubmitted)setStep('done'); }catch(err){setError(err.message);} setLoading(false); })(); }, [token]);
  const submit = async () => {
    if (!form.shirtSize||!form.pantSize||!form.shoeSize) { alert('Please fill in shirt, pant, and shoe sizes.'); return; }
    setSubmitting(true);
    try { await api(`/intake/${token}`,{method:'POST',body:JSON.stringify(form)}); setStep('video'); } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (loading) return <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>;
  if (error) return <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:48, marginBottom:16 }}>🔒</div><p style={{ color:'#991B1B', fontSize:14 }}>{error}</p></div>;
  if (step === 'done') return <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}><div style={{ fontSize:56, marginBottom:16 }}>🎒</div><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>All Done!</h2><p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto' }}>We have everything we need for {child?.childFirst}. A volunteer will shop brand new clothes just for them.</p></div>;
  if (step === 'video') return <VideoCapture token={token} childFirst={child?.childFirst} onDone={()=>setStep('done')}/>;
  const maxW = isMobile ? '100%' : 680;
  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'20px 16px':'32px 40px' }}>
      <div style={{ textAlign:'center', marginBottom:isMobile?24:32 }}>
        <div style={{ fontSize:isMobile?36:48, marginBottom:8 }}>🎒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, color:C.navy, marginBottom:4 }}>Sizes for {child?.childFirst}</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.5, maxWidth:400, margin:'0 auto' }}>A volunteer will shop brand new clothes for your child. Takes about 2 minutes.</p>
      </div>
      <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:13, color:'#9A3412' }}>Everything shared here is confidential and used only for shopping.</div>
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>About {child?.childFirst}</p>
          <Row cols={2} gap={10}>
            <Field label="Gender">
              <select style={{...inp(),appearance:'auto'}} value={form.gender} onChange={e=>upd('gender',e.target.value)}>
                <option value="">Select...</option>
                {['Girl','Boy','Non-binary / Other'].map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Preferred shopping department">
              <select style={{...inp(),appearance:'auto'}} value={form.department} onChange={e=>upd('department',e.target.value)}>
                <option value="">Select...</option>
                {["Girls' section","Boys' section","Either is fine"].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </Row>
          <p style={secHead(isMobile)}>Clothing Sizes</p>
          <Row cols={3} gap={8}><Field label="Shirt *"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Size</option>{SHIRT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Pants *"><select style={{...inp(),appearance:'auto'}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}><option value="">Size</option>{PANT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Shoe *"><input style={inp()} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)} placeholder="e.g., 4Y"/></Field></Row>
        </div>
        <div>
          <p style={secHead(isMobile)}>Preferences <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10, color:C.light }}>optional</span></p>
          <Field label="Favorite colors, styles, characters?"><input style={inp()} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)} placeholder="e.g., Blue, dinosaurs, soccer"/></Field>
          <Field label="Colors or styles to avoid?"><input style={inp()} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)} placeholder="e.g., No pink, no ruffles"/></Field>
          <Field label="Allergies or sensory needs?"><input style={inp()} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder="e.g., No wool, needs soft fabrics"/></Field>
        </div>
      </div>
      <button onClick={submit} disabled={submitting} style={{ width:'100%', padding:isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', marginTop:24 }}>
        {submitting ? 'Saving...' : 'Next — Add a Video (optional) →'}
      </button>
    </div>
  );
}

// ─── ADMIN ───
function AdminDashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('nominations');
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('cs-admin'));
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const login = () => { if(pw==='childspree2026'){sessionStorage.setItem('cs-admin',pw);setAuthed(true);}else{setPwErr(true);setTimeout(()=>setPwErr(false),2000);}};
  if (!authed) return (
    <div style={{ maxWidth:360, margin:isMobile?'60px auto 0':'80px auto 0', padding:'0 16px' }}>
      <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:20 }}>Admin Access</h2>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Password" style={{...inp(), marginBottom:12, textAlign:'center', border:`1.5px solid ${pwErr?'#EF4444':C.border}`}}/>
        <button onClick={login} style={{ width:'100%', padding:12, background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Enter</button>
        {pwErr && <div style={{ color:'#EF4444', fontSize:13, marginTop:8 }}>Incorrect password</div>}
      </div>
    </div>
  );
  const tabs = [{ key:'nominations', icon:'📋', label:'Nominations' }, { key:'volunteers', icon:'🛒', label:'Volunteers' }];
  return (
    <div style={{ maxWidth:isMobile?'100%':1000, margin:'0 auto', padding:isMobile?'16px 12px':'24px 32px' }}>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{ padding:isMobile?'8px 14px':'10px 20px', borderRadius:8, border:`1.5px solid ${activeTab===t.key?C.navy:C.border}`, background:activeTab===t.key?C.navy:'#fff', color:activeTab===t.key?'#fff':C.muted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'nominations' && <NominationsTab isMobile={isMobile}/>}
      {activeTab === 'volunteers' && <VolunteersTab isMobile={isMobile}/>}
    </div>
  );
}

function NominationsTab({ isMobile }) {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const load = useCallback(async () => {
    try { const p=new URLSearchParams(); if(filter!=='all')p.set('status',filter); if(search)p.set('search',search); const data=await api(`/nominations?${p}`,{headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}}); setNominations(data.nominations); } catch(e){console.error(e);}
    setLoading(false);
  }, [filter, search]);
  useEffect(() => { load(); }, [load]);
  const updateStatus = async(id, status) => { await api(`/nominations/${id}`,{method:'PATCH',body:JSON.stringify({status}),headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}}); load(); };
  const copyLink = (token) => { navigator.clipboard.writeText(`${window.location.origin}/#/intake/${token}`); };
  const counts = { all:nominations.length, pending:0, approved:0, sent:0, complete:0, declined:0 };
  nominations.forEach(n => { counts[n.status] = (counts[n.status]||0)+1; });
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)', gap:isMobile?8:12, marginBottom:20 }}>
        {[{label:'Total',v:counts.all,c:C.navy},{label:'Pending',v:counts.pending,c:C.amber},{label:'Approved',v:counts.approved,c:C.green},{label:'Sent',v:counts.sent,c:C.blue},{label:'Complete',v:counts.complete,c:'#7C3AED'},{label:'Declined',v:counts.declined,c:C.red}].slice(0,isMobile?3:6).map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:isMobile?20:28, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {['all','pending','approved','sent','complete'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:isMobile?'6px 10px':'6px 14px', borderRadius:20, border:'none', fontSize:isMobile?11:12, fontWeight:600, cursor:'pointer', background:filter===k?C.pink:'#F1F5F9', color:filter===k?'#fff':C.muted }}>
              {k.charAt(0).toUpperCase()+k.slice(1)} {k!=='all'?`(${counts[k]})`:'' }
            </button>
          ))}
        </div>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp(), width:isMobile?'100%':200, fontSize:13}}/>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>
      : nominations.length===0 ? <div style={{ textAlign:'center', padding:60, color:C.light, fontSize:14 }}>No nominations yet.</div>
      : !isMobile ? (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#F8FAFC', borderBottom:`1px solid ${C.border}` }}>
              {['Child','School / Grade','Nominator','Parent','Status','Actions'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {nominations.map(n => (<>
                <tr key={n.id} onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{ borderBottom:`1px solid ${C.border}`, cursor:'pointer', background:expandedId===n.id?'#FFFBF5':'#fff' }}>
                  <td style={{ padding:'12px 14px' }}><div style={{ fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div><div style={{ fontSize:11, color:C.light, marginTop:2 }}>{n.grade}</div></td>
                  <td style={{ padding:'12px 14px', color:C.text }}>{n.school}</td>
                  <td style={{ padding:'12px 14px' }}><div>{n.nominatorName}</div><div style={{ fontSize:11, color:C.light }}>{n.nominatorRole}</div></td>
                  <td style={{ padding:'12px 14px' }}><div>{n.parentName}</div><div style={{ fontSize:11, color:C.light }}>{n.parentPhone||n.parentEmail||''}</div></td>
                  <td style={{ padding:'12px 14px' }}><StatusBadge status={n.status}/></td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {n.status==='pending'&&<><button onClick={e=>{e.stopPropagation();updateStatus(n.id,'approved');}} style={{ padding:'5px 10px', background:C.green, color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Approve</button><button onClick={e=>{e.stopPropagation();updateStatus(n.id,'declined');}} style={{ padding:'5px 10px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Decline</button></>}
                      {n.status==='approved'&&<button onClick={e=>{e.stopPropagation();updateStatus(n.id,'sent');}} style={{ padding:'5px 10px', background:C.blue, color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>Send to Parent ✉️</button>}
                      {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={e=>{e.stopPropagation();copyLink(n.parentToken);}} style={{ padding:'5px 10px', background:'#F1F5F9', color:C.navy, border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}>📋 Copy Link</button>}
                    </div>
                  </td>
                </tr>
                {expandedId===n.id&&(
                  <tr key={n.id+'-exp'}><td colSpan={6} style={{ background:'#FFFBF5', padding:'0 14px 14px', borderBottom:`1px solid ${C.border}` }}>
                    {n.reason&&<div style={{ padding:'8px 12px', background:'#FFFBEB', borderRadius:6, fontSize:12, color:'#78350F', lineHeight:1.5, marginTop:8, marginBottom:8 }}><strong>Reason:</strong> {n.reason}</div>}
                    {n.parentIntake ? (
                      <div style={{ display:'flex', gap:20, padding:'10px 12px', background:'#F0FDF4', borderRadius:8, border:`1px solid #BBF7D0`, fontSize:13 }}>
                        <span>👕 <strong>{n.parentIntake.shirtSize}</strong></span><span>👖 <strong>{n.parentIntake.pantSize}</strong></span><span>👟 <strong>{n.parentIntake.shoeSize}</strong></span>
                        <span>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></span>
                        {n.parentIntake.favoriteColors&&<span>❤️ {n.parentIntake.favoriteColors}</span>}
                        {n.parentIntake.avoidColors&&<span>✗ {n.parentIntake.avoidColors}</span>}
                      </div>
                    ):<div style={{ fontSize:12, color:C.light, fontStyle:'italic', marginTop:8 }}>No parent intake yet.</div>}
                  </td></tr>
                )}
              </>))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {nominations.map(n=>(
            <div key={n.id} style={{ background:C.card, borderRadius:10, border:`1px solid ${C.border}`, overflow:'hidden' }}>
              <div onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{ padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div><div style={{ fontSize:12, color:C.light, marginTop:2 }}>{n.school} · {n.grade}</div></div>
                <StatusBadge status={n.status}/>
              </div>
              {expandedId===n.id&&(
                <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}` }}>
                  {n.reason&&<div style={{ marginTop:8, padding:'8px 10px', background:'#FFFBEB', borderRadius:6, fontSize:12, color:'#78350F', lineHeight:1.5 }}><strong>Reason:</strong> {n.reason}</div>}
                  {n.parentIntake&&<div style={{ marginTop:8, padding:10, background:'#F0FDF4', borderRadius:6, border:`1px solid #BBF7D0`, fontSize:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}><div>👕 <strong>{n.parentIntake.shirtSize}</strong></div><div>👖 <strong>{n.parentIntake.pantSize}</strong></div><div>👟 <strong>{n.parentIntake.shoeSize}</strong></div><div>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></div></div>}
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    {n.status==='pending'&&<><button onClick={()=>updateStatus(n.id,'approved')} style={{ flex:1, padding:8, background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Approve</button><button onClick={()=>updateStatus(n.id,'declined')} style={{ padding:'8px 12px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button></>}
                    {n.status==='approved'&&<button onClick={()=>updateStatus(n.id,'sent')} style={{ flex:1, padding:8, background:C.blue, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Send to Parent ✉️</button>}
                    {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={()=>copyLink(n.parentToken)} style={{ flex:1, padding:8, background:'#F1F5F9', color:C.navy, border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>📋 Copy Link</button>}
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

function VolunteersTab({ isMobile }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [msgModal, setMsgModal] = useState(false);
  const [msg, setMsg] = useState({ channel:'both', to:'all', subject:'', message:'' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const load = useCallback(async () => {
    try { const p=new URLSearchParams(); if(filter!=='all')p.set('status',filter); if(search)p.set('search',search); const data=await api(`/volunteers?${p}`,{headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}}); setVolunteers(data.volunteers); } catch(e){console.error(e);}
    setLoading(false);
  }, [filter, search]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async(id, status) => {
    await api(`/volunteers/${id}`,{method:'PATCH',body:JSON.stringify({status}),headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}}); load();
  };

  const sendMessage = async() => {
    if (!msg.message.trim()) return;
    setSending(true); setSendResult(null);
    try {
      const res = await api('/volunteers/message', { method:'POST', body:JSON.stringify(msg), headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}});
      setSendResult(res);
    } catch(e) { setSendResult({ error: e.message }); }
    setSending(false);
  };

  const counts = { all:volunteers.length, registered:0, confirmed:0, assigned:0, attended:0 };
  volunteers.forEach(v => { counts[v.status] = (counts[v.status]||0)+1; });
  const statColors = { registered:'#7C3AED', confirmed:C.green, assigned:C.blue, attended:C.amber };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?8:12, marginBottom:20 }}>
        {[{label:'Total',v:counts.all,c:C.navy},{label:'Registered',v:counts.registered,c:'#7C3AED'},{label:'Confirmed',v:counts.confirmed,c:C.green},{label:'Assigned',v:counts.assigned,c:C.blue}].map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:isMobile?20:28, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {['all','registered','confirmed','assigned'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:isMobile?'6px 10px':'6px 14px', borderRadius:20, border:'none', fontSize:isMobile?11:12, fontWeight:600, cursor:'pointer', background:filter===k?C.pink:'#F1F5F9', color:filter===k?'#fff':C.muted }}>
              {k.charAt(0).toUpperCase()+k.slice(1)} {k!=='all'?`(${counts[k]})`:'' }
            </button>
          ))}
        </div>
        <button onClick={()=>setMsgModal(true)} style={{ padding:isMobile?'6px 12px':'8px 16px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>📣 Send Message</button>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp(), width:isMobile?'100%':180, fontSize:13}}/>
      </div>

      {/* Send Message Modal */}
      {msgModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:480, boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.navy, marginBottom:20 }}>📣 Message Volunteers</h3>
            {sendResult ? (
              <div>
                {sendResult.error ? (
                  <div style={{ background:'#FEF2F2', borderRadius:8, padding:14, color:'#991B1B', fontSize:13 }}>Error: {sendResult.error}</div>
                ) : (
                  <div style={{ background:'#F0FDF4', borderRadius:8, padding:14 }}>
                    <p style={{ color:C.green, fontWeight:700, marginBottom:6 }}>✅ Message sent!</p>
                    <p style={{ fontSize:13, color:'#166534' }}>SMS sent: {sendResult.smsSent} · Emails sent: {sendResult.emailSent} · Total recipients: {sendResult.total}</p>
                    {sendResult.smsErrors?.length > 0 && <p style={{ fontSize:12, color:C.red, marginTop:4 }}>SMS errors: {sendResult.smsErrors.join(', ')}</p>}
                  </div>
                )}
                <button onClick={()=>{setMsgModal(false);setSendResult(null);setMsg({channel:'both',to:'all',subject:'',message:''});}} style={{ width:'100%', padding:12, background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:16 }}>Done</button>
              </div>
            ) : (
              <>
                <Row cols={2} gap={12}>
                  <Field label="Send to">
                    <select style={{...inp(),appearance:'auto'}} value={msg.to} onChange={e=>setMsg(p=>({...p,to:e.target.value}))}>
                      <option value="all">All volunteers ({counts.all})</option>
                      <option value="confirmed">Confirmed only ({counts.confirmed})</option>
                      <option value="assigned">Confirmed + Assigned</option>
                    </select>
                  </Field>
                  <Field label="Channel">
                    <select style={{...inp(),appearance:'auto'}} value={msg.channel} onChange={e=>setMsg(p=>({...p,channel:e.target.value}))}>
                      <option value="both">SMS + Email</option>
                      <option value="sms">SMS only</option>
                      <option value="email">Email only</option>
                    </select>
                  </Field>
                </Row>
                {(msg.channel==='email'||msg.channel==='both') && <Field label="Email subject"><input style={inp()} value={msg.subject} onChange={e=>setMsg(p=>({...p,subject:e.target.value}))} placeholder="Child Spree 2026 — Volunteer Update"/></Field>}
                <Field label="Message *"><textarea style={{...inp(),minHeight:100,resize:'vertical'}} value={msg.message} onChange={e=>setMsg(p=>({...p,message:e.target.value}))} placeholder="Hi [Name] — reminder: Child Spree is this Saturday..."/></Field>
                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button onClick={()=>setMsgModal(false)} style={{ flex:1, padding:12, background:'#F1F5F9', color:C.muted, border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                  <button onClick={sendMessage} disabled={sending||!msg.message.trim()} style={{ flex:2, padding:12, background:sending?C.light:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:sending?'default':'pointer' }}>{sending?'Sending...':'Send Message'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>
      : volunteers.length===0 ? <div style={{ textAlign:'center', padding:60, color:C.light, fontSize:14 }}>No volunteers registered yet.</div>
      : !isMobile ? (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#F8FAFC', borderBottom:`1px solid ${C.border}` }}>
              {['Name','Contact','Org / Group','Shirt','Early','Status','Actions'].map(h=><th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {volunteers.map(v => (<>
                <tr key={v.id} onClick={()=>setExpandedId(expandedId===v.id?null:v.id)} style={{ borderBottom:`1px solid ${C.border}`, cursor:'pointer', background:expandedId===v.id?'#F0FDF4':'#fff' }}>
                  <td style={{ padding:'12px 14px' }}><div style={{ fontWeight:700, color:C.navy }}>{v.firstName} {v.lastName}</div><div style={{ fontSize:11, color:C.light, marginTop:2 }}>Signed up {v.createdAt?.slice(0,10)}</div></td>
                  <td style={{ padding:'12px 14px' }}><div style={{ fontSize:12, color:C.text }}>{v.email||'—'}</div><div style={{ fontSize:11, color:C.muted }}>{v.phone||'—'}</div></td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:C.text }}>{v.organization||'—'}<br/><span style={{ fontSize:11, color:C.light }}>{v.groupType||'Individual'}</span></td>
                  <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600, color:C.navy }}>{v.shirtSize||'—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:20 }}>{v.earlyArrival?'✅':'—'}</td>
                  <td style={{ padding:'12px 14px' }}><StatusBadge status={v.status} vol/></td>
                  <td style={{ padding:'12px 14px' }}>
                    <select value={v.status} onChange={e=>{e.stopPropagation();updateStatus(v.id,e.target.value);}} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:12, cursor:'pointer', background:'#fff' }} onClick={e=>e.stopPropagation()}>
                      {['registered','confirmed','assigned','attended'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </td>
                </tr>
                {expandedId===v.id&&v.experience&&(
                  <tr key={v.id+'-exp'}><td colSpan={7} style={{ background:'#F0FDF4', padding:'0 14px 12px', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ padding:'8px 12px', background:'#fff', borderRadius:6, fontSize:12, color:C.muted, border:`1px solid ${C.border}`, marginTop:8 }}><strong>Experience:</strong> {v.experience}</div>
                  </td></tr>
                )}
              </>))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {volunteers.map(v=>(
            <div key={v.id} style={{ background:C.card, borderRadius:10, border:`1px solid ${C.border}`, overflow:'hidden' }}>
              <div onClick={()=>setExpandedId(expandedId===v.id?null:v.id)} style={{ padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{v.firstName} {v.lastName}</div><div style={{ fontSize:12, color:C.light, marginTop:2 }}>{v.organization||v.groupType||'Individual'}</div></div>
                <StatusBadge status={v.status} vol/>
              </div>
              {expandedId===v.id&&(
                <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, color:C.muted, marginTop:8 }}>{v.email&&<div>✉️ {v.email}</div>}{v.phone&&<div>📱 {v.phone}</div>}{v.shirtSize&&<div>👕 {v.shirtSize}</div>}<div>{v.earlyArrival?'✅ Early arrival':'Regular arrival'}</div></div>
                  <select value={v.status} onChange={e=>updateStatus(v.id,e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, marginTop:10 }}>
                    {['registered','confirmed','assigned','attended'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ROUTER ───
export default function App() {
  const isMobile = useIsMobile();
  const [route, setRoute] = useState(window.location.hash || '#/');
  useEffect(() => {
    const h = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const navigate = hash => { window.location.hash = hash; window.scrollTo(0,0); };

  let view = 'home', token = null;
  if (route.startsWith('#/nominate')) view = 'nominate';
  else if (route.startsWith('#/volunteer')) view = 'volunteer';
  else if (route.startsWith('#/admin')) view = 'admin';
  else if (route.startsWith('#/intake/')) { view = 'parent'; token = route.replace('#/intake/',''); }
  else if (route === '#/' || route === '#' || route === '') view = 'home';

  if (view === 'parent' && token) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      <ParentIntake token={token}/>
      {isMobile && <div style={{ height:72 }}/>}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:isMobile?72:0 }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      {view === 'home' && <LandingPage navigate={navigate}/>}
      {view === 'nominate' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><NominationForm/></div>}
      {view === 'volunteer' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><VolunteerForm/></div>}
      {view === 'admin' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><AdminDashboard/></div>}
      {isMobile && <MobileNav view={view} navigate={navigate}/>}
    </div>
  );
}
