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

const PHOTOS = [
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/edac9afc-9cc4-4880-ad8a-6c858f765f28/child-spree-america-first-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ddb3a7a7-2722-4d47-ac13-f2ce041042ef/child-spree-citi-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/bcde49b8-2c6d-43cb-a18e-09dd4c08bd50/child-spree-america-first-volunteer-with-shopper.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/5a3d3ca7-d8e5-4dcd-9e7c-87e29d590980/child-spree-teen-volunteer-group-with-cart.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/81ef2dc4-cfcb-4687-aa20-03bf329972c8/child-spree-volunteer-helping-shopper-browse.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ca2263e5-c82c-4a94-bb70-46d64545058b/child-spree-two-volunteers-smiling.jpg?disposition=inline",
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

const C = {
  navy: '#1B3A4B', pink: '#E8548C', pinkLight: '#F9A8C9',
  bg: '#F8FAFC', card: '#fff', border: '#E2E8F0',
  text: '#1E293B', muted: '#64748B', light: '#94A3B8',
  green: '#059669', red: '#DC2626', amber: '#D97706', blue: '#2563EB',
};

const inp = (extra={}) => ({
  width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`,
  borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif",
  background:'#FAFBFC', outline:'none', boxSizing:'border-box',
  transition:'border-color 0.15s', color:C.text, ...extra,
});
const lbl = { display:'block', fontSize:12, fontWeight:600, color:C.muted, marginBottom:4, letterSpacing:0.3 };
const secHead = (m) => ({
  fontSize:m?10:11, fontWeight:700, color:C.navy, textTransform:'uppercase',
  letterSpacing:1.2, marginBottom:12, borderBottom:`2px solid ${C.pinkLight}`, paddingBottom:6,
});

function Field({ label, children, style }) {
  return <div style={{ marginBottom:14, ...style }}>{label && <label style={lbl}>{label}</label>}{children}</div>;
}
function Row({ cols=2, gap=12, children, style }) {
  return <div style={{ display:'grid', gridTemplateColumns:Array(cols).fill('1fr').join(' '), gap, ...style }}>{children}</div>;
}

function StatusBadge({ status }) {
  const map = { pending:{bg:'#FEF3C7',text:'#92400E',label:'Pending'}, approved:{bg:'#D1FAE5',text:'#065F46',label:'Approved'}, sent:{bg:'#DBEAFE',text:'#1E40AF',label:'Sent'}, complete:{bg:'#E0E7FF',text:'#3730A3',label:'Complete'}, declined:{bg:'#FEE2E2',text:'#991B1B',label:'Declined'} };
  const c = map[status]||map.pending;
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.text, textTransform:'uppercase', letterSpacing:0.3 }}>{c.label}</span>;
}

// ─── Nav ───
function TopNav({ view, navigate }) {
  return (
    <nav style={{ background:C.navy, padding:'0 32px', display:'flex', alignItems:'center', gap:0, position:'sticky', top:0, zIndex:50 }}>
      <button onClick={()=>navigate('#/')} style={{ display:'flex', alignItems:'center', gap:10, flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer' }}>
        <img src="/logo.png" alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.2)' }}/>
        <div style={{ textAlign:'left' }}>
          <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, lineHeight:1 }}>Child Spree 2026</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', marginTop:1 }}>Davis Education Foundation</div>
        </div>
      </button>
      <div style={{ display:'flex', gap:4 }}>
        {[{key:'#/',label:'Home'},{key:'#/nominate',label:'Nominate'},{key:'#/admin',label:'Admin'}].map(item=>{
          const active = view===item.key.replace('#/','') || (item.key==='#/'&&view==='home');
          return (
            <button key={item.key} onClick={()=>navigate(item.key)} style={{ padding:'8px 16px', background:active?'rgba(255,255,255,0.15)':'none', border:'none', borderRadius:6, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:active?1:0.6 }}>{item.label}</button>
          );
        })}
      </div>
    </nav>
  );
}

function MobileHeader({ onHome }) {
  return (
    <div style={{ background:C.navy, color:'#fff', padding:'14px 16px 12px', textAlign:'center' }}>
      <button onClick={onHome} style={{ background:'none', border:'none', cursor:'pointer' }}>
        <img src="/logo.png" alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.2)', marginBottom:4 }}/>
        <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800 }}>Child Spree 2026</div>
        <div style={{ fontSize:9, fontWeight:500, letterSpacing:1.5, textTransform:'uppercase', opacity:0.5, marginTop:1 }}>Davis Education Foundation</div>
      </button>
    </div>
  );
}

function MobileNav({ view, navigate }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-around', padding:'8px 0 16px', boxShadow:'0 -2px 8px rgba(0,0,0,0.04)', zIndex:100 }}>
      {[{key:'#/',icon:'🏠',label:'Home',id:'home'},{key:'#/nominate',icon:'📋',label:'Nominate',id:'nominate'},{key:'#/admin',icon:'⚙️',label:'Admin',id:'admin'}].map(item=>{
        const active = view===item.id;
        return (
          <button key={item.key} onClick={()=>navigate(item.key)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, opacity:active?1:0.45 }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, color:active?C.pink:C.light, textTransform:'uppercase' }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

async function api(path, options={}) {
  const res = await fetch(`${API}${path}`, { headers:{'Content-Type':'application/json',...options.headers}, ...options });
  if (!res.ok) { const err = await res.json().catch(()=>({error:'Request failed'})); throw new Error(err.error||`HTTP ${res.status}`); }
  return res.json();
}

// ─── LANDING PAGE ───
function LandingPage({ navigate }) {
  const isMobile = useIsMobile();
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhotoIdx(i => (i+1) % PHOTOS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { num:'500+', label:'Students served each August' },
    { num:'$150', label:'Per child — head to toe' },
    { num:'400+', label:'Volunteers show up before sunrise' },
    { num:'1', label:'Day that changes a year' },
  ];

  const journey = [
    { icon:'✏️', title:'A teacher sees the need', body:'It starts in the classroom. An educator notices a student wearing the same worn-out clothes — shoes too small, a coat too thin. They fill out a quiet nomination. No awkward conversations. Just someone who cares taking the first step.' },
    { icon:'🎬', title:'A child shares their dream outfit', body:'Families share their child\'s sizes and students record a short video. Favorite colors. Characters they love. The shoes they\'ve been dreaming about. For many, it\'s the first time anyone has asked what they actually want to wear.' },
    { icon:'🛒', title:'A stranger wakes up early to shop for them', body:'Before sunrise on the first Friday of August, 400+ volunteers arrive at Kohl\'s. Each one is matched to a single child — they\'ve seen the video, they know the favorite color, they\'re ready to fill a cart with love.' },
    { icon:'✨', title:'A child walks in like they own the place', body:'New shoes. New backpack. New everything. The look on a child\'s face when they realize someone they\'ve never met cared enough to pick out their first new outfit — that\'s Child Spree.' },
  ];

  return (
    <div style={{ background:'#fff' }}>
      {/* HERO */}
      <div style={{ position:'relative', height: isMobile?'60vh':'80vh', overflow:'hidden' }}>
        {PHOTOS.map((src,i) => (
          <div key={i} style={{ position:'absolute', inset:0, transition:'opacity 1.2s ease', opacity:i===photoIdx?1:0 }}>
            <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(27,58,75,0.85) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding: isMobile?'32px 20px':'60px 64px', maxWidth:800 }}>
          <div style={{ color:'rgba(249,168,201,0.9)', fontSize: isMobile?11:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Every August · Kohl's Layton</div>
          <h1 style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize: isMobile?'2.2rem':'4rem', fontWeight:700, lineHeight:1.1, margin:'0 0 16px' }}>
            500+ students.<br/>Brand new clothes.<br/><em style={{ color:C.pinkLight }}>One unforgettable morning.</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize: isMobile?14:16, lineHeight:1.7, maxWidth:560, margin:'0 0 28px' }}>
            Every August, Davis County volunteers wake up before sunrise to shop for a child they've never met — picking out every item based on that child's video, their favorite color, their dream outfit.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={()=>navigate('#/nominate')} style={{ padding: isMobile?'13px 24px':'16px 32px', background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize: isMobile?14:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(232,84,140,0.4)' }}>
              Nominate a Child →
            </button>
            <a href="https://daviskids.org/events-child-spree" target="_blank" rel="noreferrer" style={{ padding: isMobile?'13px 24px':'16px 32px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:10, fontSize: isMobile?14:16, fontWeight:600, cursor:'pointer', textDecoration:'none', backdropFilter:'blur(4px)' }}>
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background:C.navy, padding: isMobile?'40px 20px':'48px 64px' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap: isMobile?20:32, maxWidth:1100, margin:'0 auto' }}>
          {stats.map(s => (
            <div key={s.num} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?'2.5rem':'3.5rem', fontWeight:700, color:C.pinkLight, lineHeight:1 }}>{s.num}</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize: isMobile?12:14, marginTop:6, lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* JOURNEY */}
      <div style={{ padding: isMobile?'56px 20px':'80px 64px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.pink, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>The Journey</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?'1.8rem':'2.5rem', color:C.navy, margin:'0 0 16px' }}>From a teacher's heart<br/>to a child's first-day smile.</h2>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, maxWidth:540, margin:'0 auto' }}>Every Child Spree story begins with an educator who sees a student struggling — and decides to do something about it.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:24 }}>
          {journey.map((step,i) => (
            <div key={i} style={{ background:C.bg, borderRadius:14, padding:'28px 28px 28px 24px', borderLeft:`4px solid ${C.pink}`, display:'flex', gap:16 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{step.icon}</div>
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:C.navy, marginBottom:8, fontWeight:600 }}>{step.title}</h3>
                <p style={{ color:C.muted, fontSize:13, lineHeight:1.7, margin:0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHOTO GRID */}
      <div style={{ padding: isMobile?'0 20px 56px':'0 64px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(3,1fr)', gap:12 }}>
          {PHOTOS.slice(0,isMobile?4:6).map((src,i) => (
            <div key={i} style={{ borderRadius:12, overflow:'hidden', aspectRatio:'4/3' }}>
              <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
                onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
                onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
            </div>
          ))}
        </div>
      </div>

      {/* CTA SPLIT */}
      <div style={{ background:C.bg, padding: isMobile?'48px 20px':'64px', display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:24, maxWidth:1100, margin:'0 auto' }}>
        <div style={{ background:C.navy, borderRadius:16, padding: isMobile?'32px 24px':'40px', color:'#fff' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>📋</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?20:24, margin:'0 0 12px' }}>Nominate a Child</h3>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:1.7, marginBottom:24 }}>Teachers, counselors, and school staff — if you know a student who needs support, nominate them. It takes 3 minutes and could change their entire school year.</p>
          <button onClick={()=>navigate('#/nominate')} style={{ padding:'13px 28px', background:C.pink, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>Start a Nomination →</button>
        </div>
        <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:16, padding: isMobile?'32px 24px':'40px' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🛒</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?20:24, color:C.navy, margin:'0 0 12px' }}>Volunteer to Shop</h3>
          <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>Join 400+ volunteers on the first Friday of August at Kohl's in Layton. You'll be matched with one child — and you'll shop for them like they're family.</p>
          <a href="https://daviskids.org/events-child-spree" target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'13px 28px', background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', textDecoration:'none' }}>Get Involved →</a>
        </div>
      </div>

      {/* SPONSOR */}
      <div style={{ background:C.navy, padding: isMobile?'48px 20px':'64px', textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.pinkLight, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Make it possible</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile?'1.8rem':'2.5rem', color:'#fff', margin:'0 0 16px' }}>Sponsor a Student</h2>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize: isMobile?14:16, lineHeight:1.7, maxWidth:480, margin:'0 auto 28px' }}>$150 covers one child — head to toe. New shoes. New clothes. New backpack. One donation. One complete, unforgettable morning.</p>
        <a href="https://daviskids.org/events-child-spree" target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'16px 36px', background:C.pink, color:'#fff', borderRadius:10, fontSize:16, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 20px rgba(232,84,140,0.4)' }}>Sponsor a Child — $150</a>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0f2634', padding:'28px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:'0 0 6px' }}>Child Spree 2026 · Davis Education Foundation · daviskids.org</p>
        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, margin:0 }}>For nominations and family intake, use the links above. Questions? <a href="mailto:sfoster@dsdmail.net" style={{ color:'rgba(255,255,255,0.4)' }}>Contact us</a></p>
      </div>
    </div>
  );
}

// ─── Nomination Form ───
function NominationForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ childFirst:'',childLast:'',school:'',grade:'', nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'', parentName:'',parentPhone:'',parentEmail:'', reason:'',siblings:'',additionalNotes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async() => {
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
    <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✓</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>Nomination Received</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>Thank you for advocating for this child. The DEF team will review and reach out to the family. You'll receive an email confirmation shortly.</p>
      <button onClick={()=>{setSubmitted(false);setForm({childFirst:'',childLast:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblings:'',additionalNotes:''});}}
        style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
        Nominate Another Child
      </button>
    </div>
  );

  const maxW = isMobile?'100%':760;
  const pad = isMobile?'20px 16px':'32px 40px';

  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:pad }}>
      {!isMobile && (
        <div style={{ display:'flex', gap:32, alignItems:'flex-start', marginBottom:32 }}>
          <div style={{ flex:'0 0 260px', borderRadius:14, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
            <img src={PHOTOS[2]} alt="" style={{ width:'100%', height:180, objectFit:'cover', display:'block' }}/>
          </div>
          <div style={{ flex:1, paddingTop:8 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.navy, marginBottom:8 }}>Nominate a Child</h2>
            <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, marginBottom:12 }}>Be the reason a child walks into school with confidence. Takes about 3 minutes.</p>
            <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'12px 16px', fontSize:13, color:'#0C4A6E', lineHeight:1.5 }}>
              All information is kept strictly confidential. Families are never told who nominated their child.
            </div>
          </div>
        </div>
      )}
      {isMobile && (
        <>
          <div style={{ borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            <img src={PHOTOS[2]} alt="" style={{ width:'100%', height:150, objectFit:'cover', display:'block' }}/>
          </div>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:6 }}>Nominate a Child</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.5 }}>Be the reason a child walks into school with confidence.</p>
          </div>
          <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:13, color:'#0C4A6E', lineHeight:1.5 }}>
            All information is kept confidential. Families are never told who nominated their child.
          </div>
        </>
      )}
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
        <div>
          <p style={secHead(isMobile)}>Child Information</p>
          <Row cols={2} gap={12}><Field label="First Name *"><input style={inp()} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)} placeholder="First"/></Field><Field label="Last Name *"><input style={inp()} value={form.childLast} onChange={e=>upd('childLast',e.target.value)} placeholder="Last"/></Field></Row>
          <Row cols={isMobile?2:1} gap={12}><Field label="School *"><select style={{...inp(),appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">Select school...</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Grade *"><select style={{...inp(),appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">Grade</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></Field></Row>
          <p style={{...secHead(isMobile),marginTop:20}}>Your Information</p>
          <Field label="Your Name *"><input style={inp()} value={form.nominatorName} onChange={e=>upd('nominatorName',e.target.value)} placeholder="Full name"/></Field>
          <Row cols={2} gap={12}><Field label="Role *"><select style={{...inp(),appearance:'auto'}} value={form.nominatorRole} onChange={e=>upd('nominatorRole',e.target.value)}>{['Teacher','Counselor','Family Advocate','Administrator','Other'].map(r=><option key={r} value={r}>{r}</option>)}</select></Field><Field label="Email *"><input style={inp()} type="email" value={form.nominatorEmail} onChange={e=>upd('nominatorEmail',e.target.value)} placeholder="you@davis.k12.ut.us"/></Field></Row>
        </div>
        <div>
          <p style={secHead(isMobile)}>Parent / Guardian</p>
          <Field label="Name *"><input style={inp()} value={form.parentName} onChange={e=>upd('parentName',e.target.value)} placeholder="Full name"/></Field>
          <Row cols={2} gap={12}><Field label="Phone"><input style={inp()} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)} placeholder="(801) 555-0000"/></Field><Field label="Email"><input style={inp()} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)} placeholder="parent@email.com"/></Field></Row>
          <p style={{...secHead(isMobile),marginTop:20}}>Additional Details</p>
          <Field label="Why are you nominating this child?"><textarea style={{...inp(),minHeight:isMobile?72:100,resize:'vertical'}} value={form.reason} onChange={e=>upd('reason',e.target.value)} placeholder="Brief explanation — stays confidential"/></Field>
          <Field label="Siblings to also nominate?"><input style={inp()} value={form.siblings} onChange={e=>upd('siblings',e.target.value)} placeholder="e.g., Maria (3rd), James (K)"/></Field>
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <button onClick={submit} disabled={submitting} style={{ width:'100%', padding:isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', boxShadow:`0 2px 8px rgba(232,84,140,0.3)` }}>
          {submitting?'Submitting...':'Submit Nomination'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:10 }}>All information is kept strictly confidential.</p>
      </div>
    </div>
  );
}

// ─── Admin Dashboard (same as before, abridged) ───
function AdminDashboard() {
  const isMobile = useIsMobile();
  const [nominations,setNominations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [expandedId,setExpandedId]=useState(null);
  const [authed,setAuthed]=useState(!!sessionStorage.getItem('cs-admin'));
  const [pw,setPw]=useState('');
  const [pwErr,setPwErr]=useState(false);

  const load=useCallback(async()=>{
    try {
      const p=new URLSearchParams();
      if(filter!=='all')p.set('status',filter);
      if(search)p.set('search',search);
      const data=await api(`/nominations?${p}`,{headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}});
      setNominations(data.nominations);
    }catch(e){console.error(e);}
    setLoading(false);
  },[filter,search]);

  useEffect(()=>{if(authed)load();},[load,authed]);
  const login=()=>{if(pw==='childspree2026'){sessionStorage.setItem('cs-admin',pw);setAuthed(true);}else{setPwErr(true);setTimeout(()=>setPwErr(false),2000);}};
  const updateStatus=async(id,status)=>{await api(`/nominations/${id}`,{method:'PATCH',body:JSON.stringify({status}),headers:{'Authorization':`Bearer ${sessionStorage.getItem('cs-admin')}`}});load();};
  const copyLink=(token)=>navigator.clipboard.writeText(`${window.location.origin}/#/intake/${token}`);
  const counts={all:nominations.length,pending:0,approved:0,sent:0,complete:0,declined:0};
  nominations.forEach(n=>{counts[n.status]=(counts[n.status]||0)+1;});

  if(!authed)return(
    <div style={{maxWidth:380,margin:isMobile?'60px auto 0':'80px auto 0',padding:'0 16px'}}>
      <div style={{background:C.card,borderRadius:16,padding:32,boxShadow:'0 2px 20px rgba(0,0,0,0.08)',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.navy,marginBottom:20}}>Admin Access</h2>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Password" style={{...inp(),marginBottom:12,textAlign:'center',border:`1.5px solid ${pwErr?'#EF4444':C.border}`}}/>
        <button onClick={login} style={{width:'100%',padding:12,background:C.navy,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>Enter</button>
        {pwErr&&<div style={{color:'#EF4444',fontSize:13,marginTop:8}}>Incorrect password</div>}
      </div>
    </div>
  );

  const pad=isMobile?'16px 12px':'24px 32px';
  return(
    <div style={{maxWidth:isMobile?'100%':1000,margin:'0 auto',padding:pad}}>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(4,1fr)':'repeat(6,1fr)',gap:isMobile?8:12,marginBottom:20}}>
        {[{label:'Total',value:counts.all,color:C.navy},{label:'Pending',value:counts.pending,color:C.amber},{label:'Approved',value:counts.approved,color:C.green},{label:'Sent',value:counts.sent,color:C.blue},{label:'Complete',value:counts.complete,color:'#7C3AED'},{label:'Declined',value:counts.declined,color:C.red}].slice(0,isMobile?4:6).map(s=>(
          <div key={s.label} style={{background:C.card,borderRadius:10,padding:isMobile?'10px 8px':'14px 12px',textAlign:'center',border:`1px solid ${C.border}`}}>
            <div style={{fontSize:isMobile?20:28,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:isMobile?9:11,color:C.light,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',flex:1}}>
          {['all','pending','approved','sent','complete'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{padding:isMobile?'6px 10px':'6px 14px',borderRadius:20,border:'none',fontSize:isMobile?11:12,fontWeight:600,cursor:'pointer',background:filter===k?C.pink:'#F1F5F9',color:filter===k?'#fff':C.muted}}>
              {k.charAt(0).toUpperCase()+k.slice(1)} {k!=='all'?`(${counts[k]})`:''}
            </button>
          ))}
        </div>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp(),width:isMobile?'100%':240,fontSize:13,marginBottom:0}}/>
      </div>
      {loading?<div style={{textAlign:'center',padding:60,color:C.light}}>Loading...</div>
      :nominations.length===0?<div style={{textAlign:'center',padding:60,color:C.light,fontSize:14}}>No nominations yet.</div>
      :!isMobile?(
        <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F8FAFC',borderBottom:`1px solid ${C.border}`}}>
              {['Child','School / Grade','Nominator','Parent Contact','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:0.5}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{nominations.map((n,i)=>(
              <>
                <tr key={n.id} onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{borderBottom:`1px solid ${C.border}`,cursor:'pointer',background:expandedId===n.id?'#FFFBF5':'#fff'}}>
                  <td style={{padding:'12px 14px'}}><div style={{fontWeight:700,color:C.navy}}>{n.childFirst} {n.childLast}</div><div style={{fontSize:11,color:C.light,marginTop:2}}>{n.grade}</div></td>
                  <td style={{padding:'12px 14px',color:C.text}}>{n.school}</td>
                  <td style={{padding:'12px 14px'}}><div style={{color:C.text}}>{n.nominatorName}</div><div style={{fontSize:11,color:C.light}}>{n.nominatorRole}</div></td>
                  <td style={{padding:'12px 14px'}}><div style={{color:C.text}}>{n.parentName}</div><div style={{fontSize:11,color:C.light}}>{n.parentPhone||n.parentEmail}</div></td>
                  <td style={{padding:'12px 14px'}}><StatusBadge status={n.status}/></td>
                  <td style={{padding:'12px 14px'}}>
                    <div style={{display:'flex',gap:6}}>
                      {n.status==='pending'&&<><button onClick={e=>{e.stopPropagation();updateStatus(n.id,'approved');}} style={{padding:'5px 10px',background:C.green,color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>Approve</button><button onClick={e=>{e.stopPropagation();updateStatus(n.id,'declined');}} style={{padding:'5px 10px',background:'#FEE2E2',color:'#991B1B',border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>Decline</button></>}
                      {n.status==='approved'&&<button onClick={e=>{e.stopPropagation();updateStatus(n.id,'sent');}} style={{padding:'5px 10px',background:C.blue,color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>Mark Sent</button>}
                      {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={e=>{e.stopPropagation();copyLink(n.parentToken);}} style={{padding:'5px 10px',background:'#F1F5F9',color:C.navy,border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>📋 Copy Link</button>}
                    </div>
                  </td>
                </tr>
                {expandedId===n.id&&(
                  <tr key={n.id+'-exp'}><td colSpan={6} style={{background:'#FFFBF5',padding:'0 14px 16px',borderBottom:`1px solid ${C.border}`}}>
                    {n.reason&&<div style={{padding:'8px 12px',background:'#FFFBEB',borderRadius:6,fontSize:12,color:'#78350F',lineHeight:1.5,marginBottom:8,marginTop:8}}><strong>Reason:</strong> {n.reason}</div>}
                    {n.parentIntake?(
                      <div style={{display:'flex',gap:24,padding:'10px 12px',background:'#F0FDF4',borderRadius:8,border:`1px solid #BBF7D0`,fontSize:13}}>
                        <span>👕 <strong>{n.parentIntake.shirtSize}</strong></span><span>👖 <strong>{n.parentIntake.pantSize}</strong></span><span>👟 <strong>{n.parentIntake.shoeSize}</strong></span>
                        <span>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></span>
                        {n.parentIntake.favoriteColors&&<span>❤️ {n.parentIntake.favoriteColors}</span>}
                        {n.parentIntake.avoidColors&&<span>✗ {n.parentIntake.avoidColors}</span>}
                      </div>
                    ):<div style={{fontSize:12,color:C.light,fontStyle:'italic'}}>No parent intake yet.</div>}
                  </td></tr>
                )}
              </>
            ))}</tbody>
          </table>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {nominations.map(n=>(
            <div key={n.id} style={{background:C.card,borderRadius:10,border:`1px solid ${C.border}`,overflow:'hidden'}}>
              <div onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontSize:15,fontWeight:700,color:C.navy}}>{n.childFirst} {n.childLast}</div><div style={{fontSize:12,color:C.light,marginTop:2}}>{n.school} · {n.grade} · {n.nominatorName}</div></div>
                <StatusBadge status={n.status}/>
              </div>
              {expandedId===n.id&&(
                <div style={{padding:'0 14px 14px',borderTop:`1px solid ${C.border}`}}>
                  {n.reason&&<div style={{marginTop:8,padding:'8px 10px',background:'#FFFBEB',borderRadius:6,fontSize:12,color:'#78350F',lineHeight:1.5}}><strong>Reason:</strong> {n.reason}</div>}
                  {n.parentIntake&&<div style={{marginTop:8,padding:10,background:'#F0FDF4',borderRadius:6,border:`1px solid #BBF7D0`,fontSize:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}><div>👕 <strong>{n.parentIntake.shirtSize}</strong></div><div>👖 <strong>{n.parentIntake.pantSize}</strong></div><div>👟 <strong>{n.parentIntake.shoeSize}</strong></div><div>🎬 <strong>{n.parentIntake.hasVideo?'Video ✓':'No video'}</strong></div></div>}
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    {n.status==='pending'&&<><button onClick={()=>updateStatus(n.id,'approved')} style={{flex:1,padding:8,background:C.green,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Approve</button><button onClick={()=>updateStatus(n.id,'declined')} style={{padding:'8px 14px',background:'#FEE2E2',color:'#991B1B',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Decline</button></>}
                    {n.status==='approved'&&<button onClick={()=>updateStatus(n.id,'sent')} style={{flex:1,padding:8,background:C.blue,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Mark Sent to Parent</button>}
                    {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={()=>copyLink(n.parentToken)} style={{flex:1,padding:8,background:'#F1F5F9',color:C.navy,border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>📋 Copy Parent Link</button>}
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
  const [mode,setMode]=useState('choose');
  const [stream,setStream]=useState(null);
  const [recorder,setRecorder]=useState(null);
  const [recording,setRecording]=useState(false);
  const [recordedBlob,setRecordedBlob]=useState(null);
  const [uploadedFile,setUploadedFile]=useState(null);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState(null);
  const [countdown,setCountdown]=useState(0);
  const videoRef=useRef(null);
  const previewRef=useRef(null);
  const chunksRef=useRef([]);
  const timerRef=useRef(null);

  const stopStream=useCallback(()=>{if(stream)stream.getTracks().forEach(t=>t.stop());setStream(null);},[stream]);
  useEffect(()=>()=>{stopStream();clearInterval(timerRef.current);},[stopStream]);

  const startCamera=async()=>{
    try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:true});setStream(s);setMode('record');setTimeout(()=>{if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();}},100);}
    catch{setError('Could not access camera. Try uploading instead.');setMode('upload');}
  };

  const startRecording=()=>{
    if(!stream)return;chunksRef.current=[];
    const mt=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':MediaRecorder.isTypeSupported('video/webm')?'video/webm':'video/mp4';
    const rec=new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:2500000});
    rec.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
    rec.onstop=()=>{const blob=new Blob(chunksRef.current,{type:mt});setRecordedBlob(blob);const url=URL.createObjectURL(blob);if(previewRef.current){previewRef.current.src=url;previewRef.current.play();}stopStream();};
    setRecorder(rec);rec.start(1000);setRecording(true);setCountdown(60);
    timerRef.current=setInterval(()=>setCountdown(c=>{if(c<=1){clearInterval(timerRef.current);rec.stop();setRecording(false);return 0;}return c-1;}),1000);
  };

  const stopRecording=()=>{clearInterval(timerRef.current);if(recorder&&recorder.state!=='inactive')recorder.stop();setRecording(false);};
  const retake=()=>{setRecordedBlob(null);setMode('record');startCamera();};
  const handleFile=e=>{const file=e.target.files[0];if(!file)return;if(file.size>50*1024*1024){setError('Video must be under 50MB');return;}setUploadedFile(file);const url=URL.createObjectURL(file);if(previewRef.current)previewRef.current.src=url;setMode('upload');};

  const upload=async()=>{
    const blob=recordedBlob||uploadedFile;if(!blob)return;
    setMode('uploading');setProgress(0);
    try{
      const fd=new FormData();const ext=uploadedFile?.name?.split('.').pop()||'webm';fd.append('video',blob,`video.${ext}`);
      await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.upload.onprogress=e=>{if(e.lengthComputable)setProgress(Math.round(e.loaded/e.total*100));};xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject();xhr.onerror=reject;xhr.open('POST',`${API}/upload/${token}`);xhr.send(fd);});
      setMode('done');
    }catch{setError('Upload failed. Try again.');setMode(recordedBlob?'record':'upload');}
  };

  if(mode==='done')return(<div style={{textAlign:'center',padding:isMobile?'32px 20px':'48px 40px'}}><div style={{fontSize:48,marginBottom:12}}>🎬</div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.navy,marginBottom:6}}>Video received!</h3><p style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:20}}>The DEF team will use this to make shopping for {childFirst} extra special.</p><button onClick={onDone} style={{background:C.pink,color:'#fff',border:'none',padding:'12px 32px',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>All done ✓</button></div>);
  if(mode==='uploading')return(<div style={{textAlign:'center',padding:'48px 20px'}}><div style={{fontSize:36,marginBottom:16}}>📤</div><p style={{color:C.navy,fontWeight:600,marginBottom:16}}>Uploading... {progress}%</p><div style={{height:8,background:C.border,borderRadius:4,maxWidth:320,margin:'0 auto'}}><div style={{height:8,background:C.pink,borderRadius:4,width:`${progress}%`,transition:'width 0.3s'}}/></div></div>);

  const maxW=isMobile?'100%':520;const pad=isMobile?'0 16px 24px':'0 40px 32px';
  return(
    <div style={{maxWidth:maxW,margin:'0 auto',padding:pad}}>
      <div style={{textAlign:'center',marginBottom:20}}><div style={{fontSize:32,marginBottom:8}}>🎬</div><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.navy,marginBottom:4}}>Optional: Record a short video</h3><p style={{color:C.muted,fontSize:13,lineHeight:1.5,maxWidth:360,margin:'0 auto'}}>Show {childFirst}'s personality! 30–60 seconds helps volunteers shop with heart.</p></div>
      {error&&<div style={{background:'#FEF2F2',border:`1px solid #FECACA`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#991B1B'}}>{error}</div>}
      {mode==='record'&&<div style={{position:'relative',marginBottom:16}}><video ref={videoRef} muted playsInline style={{width:'100%',borderRadius:12,background:'#000',maxHeight:280,objectFit:'cover'}}/>{recording&&<div style={{position:'absolute',top:12,right:12,background:C.pink,color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:13,fontWeight:700}}>● {countdown}s</div>}</div>}
      {(recordedBlob||uploadedFile)&&<div style={{marginBottom:16}}><video ref={previewRef} controls playsInline style={{width:'100%',borderRadius:12,background:'#000',maxHeight:280,objectFit:'cover'}}/></div>}
      {mode==='choose'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><button onClick={startCamera} style={{padding:'20px 12px',background:C.navy,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',textAlign:'center'}}>📷<br/><span style={{fontSize:12,fontWeight:400,opacity:0.8}}>Record now</span></button><label style={{padding:'20px 12px',background:'#F8FAFC',border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',textAlign:'center',display:'block'}}>📁<br/><span style={{fontSize:12,fontWeight:400,color:C.muted}}>Upload file</span><input type="file" accept="video/*" onChange={handleFile} style={{display:'none'}}/></label></div>}
      {mode==='record'&&!recordedBlob&&<div style={{display:'flex',gap:12,marginBottom:16}}>{!recording?<button onClick={startRecording} style={{flex:1,padding:14,background:C.pink,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>● Start Recording</button>:<button onClick={stopRecording} style={{flex:1,padding:14,background:C.navy,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>■ Stop Recording</button>}</div>}
      {(recordedBlob||uploadedFile)&&<div style={{display:'flex',gap:12}}><button onClick={retake} style={{flex:1,padding:12,background:'#F1F5F9',color:C.muted,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>{recordedBlob?'Retake':'Choose different'}</button><button onClick={upload} style={{flex:2,padding:12,background:C.pink,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer'}}>Upload Video →</button></div>}
      {mode==='upload'&&!uploadedFile&&<label style={{display:'block',padding:20,background:'#F8FAFC',border:`2px dashed ${C.border}`,borderRadius:10,textAlign:'center',cursor:'pointer',marginBottom:16}}><div style={{fontSize:28,marginBottom:6}}>📁</div><div style={{fontSize:14,fontWeight:600,color:C.navy,marginBottom:2}}>Tap to choose a video</div><div style={{fontSize:12,color:C.light}}>MP4, MOV, or any format · Max 50MB</div><input type="file" accept="video/*" onChange={handleFile} style={{display:'none'}}/></label>}
      <button onClick={onDone} style={{width:'100%',padding:10,background:'none',border:'none',color:C.light,fontSize:13,cursor:'pointer',marginTop:8}}>Skip — no video</button>
    </div>
  );
}

// ─── Parent Intake ───
function ParentIntake({ token }) {
  const isMobile=useIsMobile();
  const [child,setChild]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [form,setForm]=useState({shirtSize:'',pantSize:'',shoeSize:'',favoriteColors:'',avoidColors:'',allergies:'',preferences:''});
  const [submitting,setSubmitting]=useState(false);
  const [step,setStep]=useState('form');
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{(async()=>{try{const data=await api(`/intake/${token}`);setChild(data);if(data.alreadySubmitted)setStep('done');}catch(err){setError(err.message);}setLoading(false);})();},[token]);

  const submit=async()=>{if(!form.shirtSize||!form.pantSize||!form.shoeSize){alert('Please fill in shirt, pant, and shoe sizes.');return;}setSubmitting(true);try{await api(`/intake/${token}`,{method:'POST',body:JSON.stringify(form)});setStep('video');}catch(err){setError(err.message);}setSubmitting(false);};

  if(loading)return<div style={{textAlign:'center',padding:60,color:C.light}}>Loading...</div>;
  if(error)return<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><p style={{color:'#991B1B',fontSize:14}}>{error}</p></div>;
  if(step==='done')return<div style={{textAlign:'center',padding:isMobile?'60px 20px':'80px 40px'}}><div style={{fontSize:56,marginBottom:16}}>🎒</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?24:28,color:C.navy,marginBottom:8}}>All Done!</h2><p style={{color:C.muted,fontSize:14,lineHeight:1.6,maxWidth:400,margin:'0 auto'}}>We have everything we need for {child?.childFirst}. A volunteer will shop brand new clothes just for them.</p></div>;
  if(step==='video')return<VideoCapture token={token} childFirst={child?.childFirst} onDone={()=>setStep('done')}/>;

  const maxW=isMobile?'100%':680;const pad=isMobile?'20px 16px':'32px 40px';
  return(
    <div style={{maxWidth:maxW,margin:'0 auto',padding:pad}}>
      <div style={{textAlign:'center',marginBottom:isMobile?24:32}}><div style={{fontSize:isMobile?36:48,marginBottom:8}}>🎒</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,color:C.navy,marginBottom:4}}>Sizes for {child?.childFirst}</h2><p style={{color:C.muted,fontSize:14,lineHeight:1.5,maxWidth:400,margin:'0 auto'}}>A volunteer will shop brand new clothes for your child. Takes about 2 minutes.</p></div>
      <div style={{background:'#FFF7ED',border:`1px solid #FED7AA`,borderRadius:10,padding:'12px 16px',marginBottom:28,fontSize:13,color:'#9A3412',lineHeight:1.5}}>Everything shared here is confidential and used only for shopping.</div>
      {error&&<div style={{background:'#FEF2F2',border:`1px solid #FECACA`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#991B1B'}}>{error}</div>}
      <div style={{display:isMobile?'block':'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
        <div>
          <p style={secHead(isMobile)}>Clothing Sizes</p>
          <Row cols={3} gap={10}><Field label="Shirt *"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Size</option>{SHIRT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Pants *"><select style={{...inp(),appearance:'auto'}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}><option value="">Size</option>{PANT_SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Shoe *"><input style={inp()} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)} placeholder="e.g., 4Y"/></Field></Row>
        </div>
        <div>
          <p style={secHead(isMobile)}>Preferences <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:10,color:C.light}}>optional</span></p>
          <Field label="Favorite colors, styles, or characters?"><input style={inp()} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)} placeholder="e.g., Blue, dinosaurs, soccer"/></Field>
          <Field label="Colors or styles to avoid?"><input style={inp()} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)} placeholder="e.g., No pink, no ruffles"/></Field>
          <Field label="Allergies or sensory needs?"><input style={inp()} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder="e.g., No wool, needs soft fabrics"/></Field>
          <Field label="Anything else?"><textarea style={{...inp(),minHeight:60,resize:'vertical'}} value={form.preferences} onChange={e=>upd('preferences',e.target.value)}/></Field>
        </div>
      </div>
      <button onClick={submit} disabled={submitting} style={{width:'100%',padding:isMobile?14:16,background:submitting?C.light:C.pink,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:submitting?'default':'pointer',boxShadow:`0 2px 8px rgba(232,84,140,0.3)`,marginTop:24}}>
        {submitting?'Saving...':'Next — Add a Video →'}
      </button>
      <p style={{textAlign:'center',fontSize:11,color:C.light,marginTop:8}}>After this, you can record a short optional video.</p>
    </div>
  );
}

// ─── App Router ───
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
  else if (route.startsWith('#/admin')) view = 'admin';
  else if (route.startsWith('#/intake/')) { view = 'parent'; token = route.replace('#/intake/', ''); }
  else if (route === '#/' || route === '#') view = 'home';

  // Parent intake — standalone, no chrome
  if (view === 'parent' && token) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)` }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      <ParentIntake token={token}/>
      {isMobile && <div style={{ height:72 }}/>}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:isMobile?72:0 }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      {view === 'home' && <LandingPage navigate={navigate}/>}
      {view === 'nominate' && (
        <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}>
          <NominationForm/>
        </div>
      )}
      {view === 'admin' && (
        <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}>
          <AdminDashboard/>
        </div>
      )}
      {isMobile && <MobileNav view={view} navigate={navigate}/>}
    </div>
  );
}
