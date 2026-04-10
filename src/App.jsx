import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

// ─── MICROSOFT SSO ──────────────────────────────────────────────────────────
const MSAL_CONFIG = {
  auth: {
    clientId: 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f',
    authority: 'https://login.microsoftonline.com/3d9cf274-547e-4af5-8dde-01a636e0b607',
    redirectUri: window.location.origin + '/',
    navigateToLoginRequestUrl: false,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
};
const MSAL_SCOPES = ['openid', 'profile', 'email', 'User.Read'];
let _msal = null;
async function getMsal() {
  if (!_msal) {
    if (window.__msalInstance) {
      _msal = window.__msalInstance;
    } else {
      _msal = new PublicClientApplication(MSAL_CONFIG);
    }
    await _msal.initialize();
  }
  return _msal;
}
async function msalSignIn() {
  const msal = await getMsal();
  // Use redirect flow instead of popup — popup has cross-window sessionStorage issues
  // that prevent MSAL from completing the auth code exchange.
  // This will navigate the current page to Microsoft, then redirect back.
  await msal.loginRedirect({ scopes: MSAL_SCOPES, prompt: 'select_account' });
  // loginRedirect navigates away — this line is never reached
  return null;
}
async function msalSignOut() {
  const msal = await getMsal();
  const accounts = msal.getAllAccounts();
  sessionStorage.removeItem('cs-ms-user');
  if (accounts[0]) await msal.logoutRedirect({ account: accounts[0], postLogoutRedirectUri: window.location.origin });
}
function getMsSession() {
  try { return JSON.parse(sessionStorage.getItem('cs-ms-user') || 'null'); } catch { return null; }
}
// ────────────────────────────────────────────────────────────────────────────

const API = '/api';
const SHIRT_SIZES_BOYS = ["Youth XS (4-5)","Youth S (6-7)","Youth M (8)","Youth L (10-12)","Youth XL (14-16)","Youth XXL (18-20)","Adult S","Adult M","Adult L","Adult XL","Adult 2XL"];
const SHIRT_SIZES_GIRLS = ["Youth XS (4-5)","Youth S (6-7)","Youth M (8)","Youth L (10-12)","Youth XL (14-16)","Juniors XXS","Juniors XS","Juniors S","Juniors M","Juniors L","Juniors XL","Adult S","Adult M","Adult L","Adult XL","Adult 2XL"];
const PANT_SIZES_BOYS = ["Youth 4","Youth 5","Youth 6","Youth 7","Youth 8","Youth 10","Youth 12","Youth 14","Youth 16","Youth 18","Youth 20","Husky 8","Husky 10","Husky 12","Husky 14","Husky 16","Husky 18","Adult S","Adult M","Adult L","Adult XL","Adult 2XL","Adult 28W","Adult 30W","Adult 32W","Adult 34W","Adult 36W"];
const PANT_SIZES_GIRLS = ["Youth 4","Youth 5","Youth 6","Youth 6X/7","Youth 8","Youth 10","Youth 12","Youth 14","Youth 16","Juniors 0","Juniors 1","Juniors 3","Juniors 5","Juniors 7","Juniors 9","Juniors 11","Juniors 13","Juniors 15","Juniors 17","Adult S","Adult M","Adult L","Adult XL","Adult 2XL","Adult 24W","Adult 26W","Adult 28W","Adult 30W","Adult 32W"];
const VOL_SHIRTS = ["YS","YM","YL","AS","AM","AL","AXL","A2XL"];
const SCHOOLS = ["Adams Elementary","Adelaide Elementary","Antelope Elementary","Bluff Ridge Elementary","Boulton Elementary","Bountiful Elementary","Buffalo Point Elementary","Burton Elementary","Canyon Creek Elementary","Centerville Elementary","Clinton Elementary","Columbia Elementary","Cook Elementary","Creekside Elementary","Crestview Elementary","Davis Connect","Doxey Elementary","Eagle Bay Elementary","East Layton Elementary","Ellison Park Elementary","Endeavor Elementary","Farmington Elementary","Foxboro Elementary","Heritage Elementary","Hill Field Elementary","Holbrook Elementary","Holt Elementary","Island View Elementary","Kay's Creek Elementary","Kaysville Elementary","King Elementary","Knowlton Elementary","Lakeside Elementary","Layton Elementary","Lincoln Elementary","Meadowbrook Elementary","Morgan Elementary","Mountain View Elementary","Muir Elementary","Oak Hills Elementary","Odyssey Elementary","Orchard Elementary","Parkside Elementary","Reading Elementary","Sand Springs Elementary","Snow Horse Elementary","So. Clearfield Elementary","So. Weber Elementary","Stewart Elementary","Sunburst Elementary","Sunset Elementary","Syracuse Elementary","Taylor Elementary","Tolman Elementary","Vae View Elementary","Valley View Elementary","Wasatch Elementary","West Bountiful Elementary","West Clinton Elementary","West Point Elementary","Whitesides Elementary","Windridge Elementary","Woods Cross Elementary"];
const GRADES = ["K","1st","2nd","3rd","4th","5th","6th"];
const PHOTOS = [
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/edac9afc-9cc4-4880-ad8a-6c858f765f28/child-spree-america-first-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ddb3a7a7-2722-4d47-ac13-f2ce041042ef/child-spree-citi-volunteers-group.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/bcde49b8-2c6d-43cb-a18e-09dd4c08bd50/child-spree-america-first-volunteer-with-shopper.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/5a3d3ca7-d8e5-4dcd-9e7c-87e29d590980/child-spree-teen-volunteer-group-with-cart.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/81ef2dc4-cfcb-4687-aa20-03bf329972c8/child-spree-volunteer-helping-shopper-browse.jpg?disposition=inline",
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/4672/Def/ca2263e5-c82c-4a94-bb70-46d64545058b/child-spree-two-volunteers-smiling.jpg?disposition=inline",
];

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const LANG = {
  en: {
    // Nav
    home:'Home', nominate:'Nominate', volunteer:'Volunteer', admin:'Admin', portal:'My Portal',
    // Landing
    sponsorBtn:'Sponsor a Child — $150',
    nominateBtn:'Nominate a Child →',
    volunteerBtn:'Sign Up to Volunteer →',
    // Nomination form
    nomFormTitle:'Nominate a Child',
    nomFormSubtitle:'about 3 minutes.',
    nomFormConfidential:'All information is kept strictly confidential. Families are never told who nominated their child.',
    childInfoTitle:'Child Information',
    firstName:'First Name *', lastName:'Last Name *',
    studentId:'Student ID *', studentIdPlaceholder:'e.g. 123456',
    school:'School *', selectSchool:'Select school...',
    grade:'Grade *', gradeLabel:'Grade',
    gradeNote:'Elementary students only (K – 6th grade)',
    yourInfoTitle:'Your Information',
    yourName:'Your Name *', fullName:'Full name',
    role:'Role *', email:'Email *',
    parentGuardianTitle:'Parent / Guardian',
    parentName:'Name *', parentPhone:'Phone', parentEmail:'Email',
    preferredLang:'Preferred language',
    langNote:'Notifications and forms will be sent in this language.',
    detailsTitle:'Details',
    whyNominate:'Why are you nominating this child?',
    reasonPlaceholder:'Brief explanation — stays confidential',
    siblingsQuestion:'Additional siblings to nominate?',
    howManySiblings:'How many siblings?', none:'None',
    siblingLabel:'Sibling', siblingName:'First & Last Name', siblingStudentId:'Student ID',
    siblingNote:'The parent will receive a separate size form for each child. Their notification will note that',
    siblingNote2:'children from their family were nominated.',
    submitNomination:'Submit Nomination', submitting:'Submitting...',
    nomSuccess:'Nomination Submitted!',
    nomSuccessMsg:'Thank you for nominating this child. We\'ll take it from here.',
    nominateAnother:'Nominate Another Child',
    // Intake
    intakeTitle:'Sizes for', intakeSubtitle:'A volunteer will shop brand new clothes for your child. Takes about 2 minutes.',
    intakeConfidential:'Everything shared here is confidential and used only for shopping.',
    aboutTitle:'About', clothingSizes:'Clothing Sizes',
    genderLabel:'Gender', genderGirl:'Girl', genderBoy:'Boy', genderOther:'Non-binary / Other',
    deptLabel:'Preferred shopping department',
    deptGirls:"Girls' section", deptBoys:"Boys' section", deptJuniors:"Juniors' section (older girls)", deptEither:'Either is fine',
    shirtLabel:'Shirt *', pantLabel:'Pants *', shoeLabel:'Shoe *',
    prefsTitle:'Preferences', prefsOptional:'optional',
    colorsLabel:'Favorite colors, styles, or characters?',
    colorsPlaceholder:'e.g., Blue, dinosaurs, soccer',
    avoidLabel:'Colors or styles to avoid?',
    avoidPlaceholder:'e.g., No pink, no ruffles',
    sensoryLabel:'Allergies or sensory needs?',
    sensoryPlaceholder:'e.g., No wool, needs soft fabrics',
    notesLabel:'Anything else?',
    consentLabel:'I give permission for my child to participate in Child Spree 2026, and agree that the information I provide will be used by volunteers to shop for my child.',
    consentRequired:'Please check the consent box to continue.',
    submitIntake:'Submit →',
    submitIntakeSaving:'Saving...',
    // Video
    videoTitle:'Optional: Record a short video',
    videoSubtitle1:'30–60 seconds. Tell us', videoSubtitle2:"'s favorite color, what they love, the shoes they've been dreaming about!",
    recordNow:'Record now', uploadVideo:'Upload a video',
    usesCamera:'Uses your camera', fromPhone:'From your phone',
    skipVideo:'Skip — no video',
    startRecording:'Start Recording', stopReview:'Stop & Review',
    goBack:'← Back',
    previewLabel:'Preview',
    retake:'↩ Redo', looksGood:'✓ Looks good — Upload',
    skipDontInclude:"Skip — don't include video",
    uploadingVideo:'Uploading your video...',
    videoReceived:'Video received!',
    videoReceivedMsg:'A volunteer will watch this before they shop for', videoReceivedMsg2:'. It makes a huge difference.',
    allDone:'All done ✓',
    // Done
    intakeDoneTitle:'All Done!', intakeDoneMsg:'We have everything we need for',
    intakeDoneMsg2:'. A volunteer will shop brand new clothes just for them.',
    // Portal
    portalTitle:'Family Advocate Portal', portalSubtitle:'Track your nominated children',
    portalEmailLabel:'Your school email address', portalEmailPlaceholder:'you@davis.k12.ut.us',
    portalLogin:'View My Dashboard', portalLoggingIn:'Looking up your nominations...',
    portalNotFound:"No nominations found for this email. Please use the exact email you used when submitting nominations.",
    portalWelcome:'Welcome back,',
    portalTotal:'Total Nominated', portalIntake:'Intake Complete',
    portalConsent:'Consented', portalNeedsVideo:'Needs Video',
    portalAwaiting:'Awaiting Parent', portalPending:'Pending Review',
    portalNeedsVideoTitle:'🎬 Children Who Still Need a Video',
    portalNeedsVideoEmpty:'All children who completed intake have recorded a video.',
    portalAllTitle:'All Nominated Children',
    portalChildCol:'Child', portalStatusCol:'Status', portalIntakeCol:'Parent Intake',
    portalConsentCol:'Consent', portalVideoCol:'Video',
    portalIntakeDone:'✅ Complete', portalIntakePending:'⏳ Not yet',
    portalConsentYes:'✅ Yes', portalConsentNo:'—',
    portalVideoYes:'🎬 Recorded', portalVideoNeeded:'⚠️ Needed',
    portalLogout:'Log out',
  },
  es: {
    // Nav
    home:'Inicio', nominate:'Nominar', volunteer:'Voluntario', admin:'Admin', portal:'Mi Portal',
    // Landing
    sponsorBtn:'Patrocinar un Niño — $150',
    nominateBtn:'Nominar a un Niño →',
    volunteerBtn:'Inscribirse como Voluntario →',
    // Nomination form
    nomFormTitle:'Nominar a un Niño',
    nomFormSubtitle:'aproximadamente 3 minutos.',
    nomFormConfidential:'Toda la información se mantiene estrictamente confidencial. Las familias nunca saben quién nominó a su hijo/a.',
    childInfoTitle:'Información del Niño/a',
    firstName:'Nombre *', lastName:'Apellido *',
    studentId:'ID de Estudiante *', studentIdPlaceholder:'ej. 123456',
    school:'Escuela *', selectSchool:'Seleccionar escuela...',
    grade:'Grado *', gradeLabel:'Grado',
    gradeNote:'Solo estudiantes de primaria (K – 6to grado)',
    yourInfoTitle:'Su Información',
    yourName:'Su Nombre *', fullName:'Nombre completo',
    role:'Cargo *', email:'Correo electrónico *',
    parentGuardianTitle:'Padre / Tutor',
    parentName:'Nombre *', parentPhone:'Teléfono', parentEmail:'Correo electrónico',
    preferredLang:'Idioma preferido',
    langNote:'Las notificaciones y formularios se enviarán en este idioma.',
    detailsTitle:'Detalles',
    whyNominate:'¿Por qué está nominando a este niño/a?',
    reasonPlaceholder:'Breve explicación — se mantiene confidencial',
    siblingsQuestion:'¿Hermanos adicionales para nominar?',
    howManySiblings:'¿Cuántos hermanos?', none:'Ninguno',
    siblingLabel:'Hermano/a', siblingName:'Nombre y Apellido', siblingStudentId:'ID de Estudiante',
    siblingNote:'El padre recibirá un formulario de tallas separado para cada niño/a. Su notificación indicará que',
    siblingNote2:'niños de su familia fueron nominados.',
    submitNomination:'Enviar Nominación', submitting:'Enviando...',
    nomSuccess:'¡Nominación Enviada!',
    nomSuccessMsg:'Gracias por nominar a este niño/a. Nosotros nos encargamos del resto.',
    nominateAnother:'Nominar Otro Niño/a',
    // Intake
    intakeTitle:'Tallas para', intakeSubtitle:'Un voluntario comprará ropa nueva para su hijo/a. Toma unos 2 minutos.',
    intakeConfidential:'Todo lo que comparte aquí es confidencial y se usará únicamente para las compras.',
    aboutTitle:'Sobre', clothingSizes:'Tallas de Ropa',
    genderLabel:'Género', genderGirl:'Niña', genderBoy:'Niño', genderOther:'No binario / Otro',
    deptLabel:'Departamento preferido para compras',
    deptGirls:'Sección de niñas', deptBoys:'Sección de niños', deptJuniors:'Sección juvenil (niñas mayores)', deptEither:'Cualquiera está bien',
    shirtLabel:'Camiseta *', pantLabel:'Pantalón *', shoeLabel:'Zapato *',
    prefsTitle:'Preferencias', prefsOptional:'opcional',
    colorsLabel:'¿Colores favoritos, estilos o personajes?',
    colorsPlaceholder:'Ej: Azul, dinosaurios, fútbol',
    avoidLabel:'¿Colores o estilos que evitar?',
    avoidPlaceholder:'Ej: Sin rosado, sin volantes',
    sensoryLabel:'¿Alergias o necesidades sensoriales?',
    sensoryPlaceholder:'Ej: Sin lana, necesita telas suaves',
    notesLabel:'¿Algo más?',
    consentLabel:'Doy permiso para que mi hijo/a participe en Child Spree 2026, y acepto que la información que proporcione sea utilizada por los voluntarios para hacer las compras para mi hijo/a.',
    consentRequired:'Por favor marque la casilla de consentimiento para continuar.',
    submitIntake:'Enviar →',
    submitIntakeSaving:'Guardando...',
    // Video
    videoTitle:'Opcional: Grabe un video corto',
    videoSubtitle1:'30–60 segundos. ¡Cuéntenos el color favorito de', videoSubtitle2:', lo que le gusta, los zapatos con los que ha soñado!',
    recordNow:'Grabar ahora', uploadVideo:'Subir un video',
    usesCamera:'Usa su cámara', fromPhone:'Desde su teléfono',
    skipVideo:'Omitir — sin video',
    startRecording:'Iniciar Grabación', stopReview:'Detener y Revisar',
    goBack:'← Atrás',
    previewLabel:'Vista previa',
    retake:'↩ Repetir', looksGood:'✓ Se ve bien — Subir',
    skipDontInclude:'Omitir — no incluir video',
    uploadingVideo:'Subiendo su video...',
    videoReceived:'¡Video recibido!',
    videoReceivedMsg:'Un voluntario verá esto antes de comprar para', videoReceivedMsg2:'. Hace una gran diferencia.',
    allDone:'¡Listo! ✓',
    // Done
    intakeDoneTitle:'¡Todo Listo!', intakeDoneMsg:'Tenemos todo lo que necesitamos para',
    intakeDoneMsg2:'. Un voluntario comprará ropa nueva específicamente para su hijo/a.',
    // Portal (Spanish — same labels, FA are school staff)
    portalTitle:'Portal del Coordinador Familiar', portalSubtitle:'Seguimiento de niños nominados',
    portalEmailLabel:'Su correo electrónico escolar', portalEmailPlaceholder:'usted@davis.k12.ut.us',
    portalLogin:'Ver Mi Panel', portalLoggingIn:'Buscando sus nominaciones...',
    portalNotFound:'No se encontraron nominaciones para este correo. Use el correo exacto con el que envió las nominaciones.',
    portalWelcome:'Bienvenido/a,',
    portalTotal:'Total Nominados', portalIntake:'Formulario Completo',
    portalConsent:'Con Consentimiento', portalNeedsVideo:'Necesita Video',
    portalAwaiting:'Esperando al Padre', portalPending:'Pendiente de Revisión',
    portalNeedsVideoTitle:'🎬 Niños que Aún Necesitan Video',
    portalNeedsVideoEmpty:'Todos los niños que completaron el formulario han grabado un video.',
    portalAllTitle:'Todos los Niños Nominados',
    portalChildCol:'Niño/a', portalStatusCol:'Estado', portalIntakeCol:'Formulario del Padre',
    portalConsentCol:'Consentimiento', portalVideoCol:'Video',
    portalIntakeDone:'✅ Completo', portalIntakePending:'⏳ Pendiente',
    portalConsentYes:'✅ Sí', portalConsentNo:'—',
    portalVideoYes:'🎬 Grabado', portalVideoNeeded:'⚠️ Necesario',
    portalLogout:'Cerrar sesión',
  },
};

function useLang() {
  const [lang, setLangState] = useState(() => localStorage.getItem('cs-lang') || 'en');
  const setLang = (l) => { setLangState(l); localStorage.setItem('cs-lang', l); };
  const t = (key) => LANG[lang]?.[key] || LANG.en[key] || key;
  return { lang, setLang, t };
}

function LangToggle({ lang, setLang, style }) {
  return (
    <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.06)', borderRadius:20, padding:3, ...style }}>
      <button onClick={() => setLang('en')}
        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:lang==='en'?'#fff':'transparent', border:'none', borderRadius:16, cursor:'pointer', fontSize:12, fontWeight:lang==='en'?700:400, color:lang==='en'?C.navy:C.muted, boxShadow:lang==='en'?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
        <span style={{ fontSize:13 }}>🇺🇸</span> English
      </button>
      <button onClick={() => setLang('es')}
        style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:lang==='es'?'#fff':'transparent', border:'none', borderRadius:16, cursor:'pointer', fontSize:12, fontWeight:lang==='es'?700:400, color:lang==='es'?C.navy:C.muted, boxShadow:lang==='es'?'0 1px 3px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
        <span style={{ fontSize:13 }}>🇲🇽</span> Español
      </button>
    </div>
  );
}

// ─── MICROSOFT SSO CONFIG ───────────────────────────────────────────────────
const AZURE_CLIENT_ID = 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f';
const AZURE_TENANT_ID = '3d9cf274-547e-4af5-8dde-01a636e0b607';
const AZURE_REDIRECT_URI = window.location.origin + '/';
const AZURE_SCOPES = 'openid profile email User.Read';

function getMsalLoginUrl() {
  const state = Math.random().toString(36).substr(2);
  const nonce = Math.random().toString(36).substr(2);
  sessionStorage.setItem('ms_state', state);
  sessionStorage.setItem('ms_nonce', nonce);
  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    response_type: 'id_token',
    redirect_uri: AZURE_REDIRECT_URI,
    scope: AZURE_SCOPES,
    response_mode: 'fragment',
    state,
    nonce,
    prompt: 'select_account',
  });
  return `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

function parseMsalFragment(hash) {
  // Parse id_token from URL fragment after redirect
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const idToken = params.get('id_token');
  const state = params.get('state');
  if (!idToken) return null;
  // Decode JWT payload (no signature verification needed — server validates email)
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    const email = payload.preferred_username || payload.upn || payload.email || payload.unique_name;
    const name = payload.name || email;
    const savedState = sessionStorage.getItem('ms_state');
    if (state !== savedState) return null;
    sessionStorage.removeItem('ms_state');
    sessionStorage.removeItem('ms_nonce');
    return { email, name, idToken };
  } catch(e) { return null; }
}

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
  const { t: navT } = useLang();
  const [msUser, setMsUser] = useState(getMsSession);
  const items = [
    {key:'home',hash:'#/',label:navT('home')},{key:'nominate',hash:'#/nominate',label:navT('nominate')},
    {key:'volunteer',hash:'#/volunteer',label:navT('volunteer')},
    {key:'portal',hash:'#/portal',label:navT('portal')},
    {key:'admin',hash:'#/admin',label:navT('admin')},
  ];
  const handleSignIn = async () => {
    try {
      await msalSignIn();
      // loginRedirect navigates away — if we're still here, something went wrong
    } catch(e) { alert('Sign-in failed. Please try again.'); }
  };
  const handleSignOut = async () => {
    await msalSignOut();
    setMsUser(null);
    window.dispatchEvent(new CustomEvent('cs-ms-logout'));
  };
  return (
    <nav style={{ background:C.navy, padding:'0 32px', display:'flex', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
      <button onClick={()=>navigate('#/')} style={{ display:'flex', alignItems:'center', gap:10, flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:C.pink, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style={{width:24,height:24,borderRadius:'50%'}} /></div>
        <div style={{ textAlign:'left' }}>
          <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, lineHeight:1 }}>Child Spree 2026</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', marginTop:1 }}>Davis Education Foundation</div>
        </div>
      </button>
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {items.map(item => { const active=view===item.key; return (
          <button key={item.key} onClick={()=>navigate(item.hash)} style={{ padding:'8px 14px', background:active?'rgba(255,255,255,0.15)':'none', border:'none', borderRadius:6, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:active?1:0.65 }}>{item.label}</button>
        ); })}
        {msUser ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8, paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:C.pink, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(msUser.displayName||'?').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msUser.displayName||msUser.email}</span>
            <button onClick={handleSignOut} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer', borderRadius:4, padding:'3px 8px' }}>Sign out</button>
          </div>
        ) : (
          <button onClick={handleSignIn} style={{ marginLeft:8, background:C.pink, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:6, padding:'6px 14px', whiteSpace:'nowrap' }}>
            Sign In (DSD)
          </button>
        )}
      </div>
    </nav>
  );
}
function MobileHeader({ onHome }) {
  return (
    <div style={{ background:C.navy, color:'#fff', padding:'14px 16px 12px', textAlign:'center' }}>
      <button onClick={onHome} style={{ background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ marginBottom:4 }}><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style={{width:64,height:64}} /></div>
        <div style={{ color:'#fff', fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800 }}>Child Spree 2026</div>
        <div style={{ fontSize:9, fontWeight:500, letterSpacing:1.5, textTransform:'uppercase', opacity:0.5, marginTop:1 }}>Davis Education Foundation</div>
      </button>
    </div>
  );
}
function MobileNav({ view, navigate }) {
  const { t: mnavT } = useLang();
  const items = [{key:'home',hash:'#/',icon:'🏠',label:mnavT('home')},{key:'nominate',hash:'#/nominate',icon:'📋',label:mnavT('nominate')},{key:'volunteer',hash:'#/volunteer',icon:'🛒',label:mnavT('volunteer')},{key:'portal',hash:'#/portal',icon:'📋',label:mnavT('portal')},{key:'admin',hash:'#/admin',icon:'⚙️',label:mnavT('admin')}];
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
          <div style={{ color:'rgba(249,168,201,0.9)', fontSize:isMobile?11:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Every August · Three Davis County Kohl's</div>
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
          <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>Join 400+ volunteers on the first Friday of August at three Davis County Kohl's locations (Layton, Centerville & Clinton). You'll be matched with one child and shop for them head to toe.</p>
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
  const { lang, setLang, t } = useLang();
  const [form, setForm] = useState({childFirst:'',childLast:'',studentId:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',nominatorPhone:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblingCount:0,siblings:[],additionalNotes:'',parentLanguage:'en'});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  useEffect(() => {
    const ms = getMsSession();
    if (ms) {
      if (!form.nominatorName && ms.displayName) upd('nominatorName', ms.displayName);
      if (!form.nominatorEmail && ms.email) upd('nominatorEmail', ms.email);
    }
    const handler = (e) => {
      if (e.detail?.displayName) upd('nominatorName', e.detail.displayName);
      if (e.detail?.email) upd('nominatorEmail', e.detail.email);
    };
    window.addEventListener('cs-ms-login', handler);
    return () => window.removeEventListener('cs-ms-login', handler);
  }, []);
  const submit = async() => {
    setError(null);
    if (!form.childFirst||!form.childLast||!form.studentId||!form.school||!form.grade) { setError(lang==='es'?'Por favor complete toda la información del niño/a, incluyendo el ID de estudiante.':'Please fill in all child information, including Student ID.'); return; }
    if (!form.nominatorName||!form.nominatorEmail) { setError(lang==='es'?'Por favor complete su nombre y correo electrónico.':'Please fill in your name and email.'); return; }
    if (!form.parentName) { setError(lang==='es'?'Se requiere el nombre del padre/tutor.':'Parent/guardian name required.'); return; }
    if (!form.parentPhone&&!form.parentEmail) { setError(lang==='es'?'Proporcione al menos un contacto del padre.':'Please provide at least one parent contact.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        siblingNames: form.siblings && form.siblings.length > 0
          ? form.siblings.map(s => s.name || '').filter(Boolean).join(', ')
          : '',
        siblingsData: JSON.stringify(form.siblings || []),
      };
      await api('/nominations',{method:'POST',body:JSON.stringify(payload)});
      setSubmitted(true);
    } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (submitted) return (
    <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✓</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>{t('nomSuccess')}</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>{t('nomSuccessMsg')}</p>
      <button onClick={()=>{setSubmitted(false);setForm({childFirst:'',childLast:'',studentId:'',school:'',grade:'',nominatorName:'',nominatorRole:'Teacher',nominatorEmail:'',nominatorPhone:'',parentName:'',parentPhone:'',parentEmail:'',reason:'',siblingCount:0,siblings:[],additionalNotes:'',parentLanguage:'en'});}} style={{ background:C.pink, color:'#fff', border:'none', padding:'12px 32px', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>{t('nominateAnother')}</button>
    </div>
  );
  const maxW = isMobile?'100%':760;
  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'20px 16px':'32px 40px' }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}><LangToggle lang={lang} setLang={setLang}/></div>
      {!isMobile && (
        <div style={{ display:'flex', gap:28, alignItems:'flex-start', marginBottom:28 }}>
          <div style={{ flex:'0 0 240px', borderRadius:12, overflow:'hidden' }}><img src={PHOTOS[2]} alt="" style={{ width:'100%', height:170, objectFit:'cover', display:'block' }}/></div>
          <div style={{ flex:1, paddingTop:4 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:C.navy, marginBottom:8 }}>{t('nomFormTitle')}</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:12 }}>{t('nomFormSubtitle')}</p>
            <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#0C4A6E' }}>{t('nomFormConfidential')}</div>
          </div>
        </div>
      )}
      {isMobile && <><div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}><img src={PHOTOS[2]} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}/></div><div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:4 }}>{t('nomFormTitle')}</h2><p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>{t('nomFormSubtitle')}</p></div><div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:'#0C4A6E' }}>{t('nomFormConfidential')}</div></>}
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>{t('childInfoTitle')}</p>
          <Row cols={2} gap={10}><Field label={t('firstName')}><input style={inp()} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)} placeholder={lang==='es'?'Nombre':'First'}/></Field><Field label={t('lastName')}><input style={inp()} value={form.childLast} onChange={e=>upd('childLast',e.target.value)} placeholder={lang==='es'?'Apellido':'Last'}/></Field></Row>
          <Field label={t('studentId')}><input style={inp()} value={form.studentId} onChange={e=>upd('studentId',e.target.value)} placeholder={t('studentIdPlaceholder')}/></Field>
          <Row cols={isMobile?2:1} gap={10}><Field label={t('school')}><select style={{...inp(),appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">{t('selectSchool')}</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label={t('grade')}><select style={{...inp(),appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">{t('gradeLabel')}</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select><p style={{fontSize:11,color:C.light,margin:'4px 0 0'}}>{t('gradeNote')}</p></Field></Row>
          <p style={{...secHead(isMobile),marginTop:20}}>{t('yourInfoTitle')}</p>
          <Field label={t('yourName')}><input style={inp()} value={form.nominatorName} onChange={e=>upd('nominatorName',e.target.value)} placeholder={t('fullName')}/></Field>
          <Row cols={2} gap={10}><Field label={t('role')}><select style={{...inp(),appearance:'auto'}} value={form.nominatorRole} onChange={e=>upd('nominatorRole',e.target.value)}>{['Teacher','Counselor','Family Advocate','Administrator','Other'].map(r=><option key={r} value={r}>{r}</option>)}</select></Field><Field label={t('email')}><input style={inp()} type="email" value={form.nominatorEmail} onChange={e=>upd('nominatorEmail',e.target.value)} placeholder="you@dsdmail.net"/></Field></Row>
          <Field label="Your cell phone"><input style={inp()} type="tel" value={form.nominatorPhone||''} onChange={e=>upd('nominatorPhone',e.target.value)} placeholder="(801) 555-0000"/><p style={{fontSize:11,color:C.light,margin:'4px 0 0'}}>Optional — we'll text you updates when parents submit sizes or it's time to record a video.</p></Field>
        </div>
        <div>
          <p style={secHead(isMobile)}>{t('parentGuardianTitle')}</p>
          <Field label={t('parentName')}><input style={inp()} value={form.parentName} onChange={e=>upd('parentName',e.target.value)} placeholder={t('fullName')}/></Field>
          <Row cols={2} gap={10}><Field label={t('parentPhone')}><input style={inp()} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)} placeholder="(801) 555-0000"/></Field><Field label={t('parentEmail')}><input style={inp()} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)} placeholder="parent@email.com"/></Field></Row>
          <Field label={t('preferredLang')}>
            <div style={{display:'flex',gap:10}}>
              {[['en','🇺🇸 English'],['es','🇲🇽 Español']].map(([val,label])=>(
                <label key={val} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flex:1,padding:'10px 14px',background:form.parentLanguage===val?C.navy:C.bg,border:`1.5px solid ${form.parentLanguage===val?C.navy:C.border}`,borderRadius:8,transition:'all 0.15s'}}>
                  <input type="radio" name="parentLanguage" value={val} checked={form.parentLanguage===val} onChange={()=>upd('parentLanguage',val)} style={{accentColor:'#fff',display:'none'}}/>
                  <span style={{fontSize:15}}>{label.split(' ')[0]}</span>
                  <span style={{fontSize:13,fontWeight:form.parentLanguage===val?700:400,color:form.parentLanguage===val?'#fff':C.muted}}>{label.split(' ')[1]}</span>
                  {form.parentLanguage===val&&<span style={{marginLeft:'auto',color:'#fff',fontSize:12}}>✓</span>}
                </label>
              ))}
            </div>
            <p style={{fontSize:11,color:C.light,margin:'6px 0 0'}}>{t('langNote')}</p>
          </Field>
          <p style={{...secHead(isMobile),marginTop:20}}>{t('detailsTitle')}</p>
          <Field label={t('whyNominate')}><textarea style={{...inp(),minHeight:isMobile?72:100,resize:'vertical'}} value={form.reason} onChange={e=>upd('reason',e.target.value)} placeholder={t('reasonPlaceholder')}/></Field>
          <Field label={t('siblingsQuestion')}>
            <div>
              <label style={lbl}>{t('howManySiblings')}</label>
              <select style={{...inp({width:100}), appearance:'auto', marginBottom: form.siblingCount > 0 ? 12 : 0}} value={form.siblingCount} onChange={e=>upd('siblingCount',parseInt(e.target.value))}>
                {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n===0?t('none'):n}</option>)}
              </select>
              {form.siblingCount > 0 && (
                <div>
                  {Array.from({length:form.siblingCount}).map((_,i)=>{
                    const sib = form.siblings[i]||{name:'',studentId:''};
                    const updateSib = (field,val) => {
                      const next = [...(form.siblings||[])];
                      while(next.length<=i) next.push({name:'',studentId:''});
                      next[i]={...next[i],[field]:val};
                      upd('siblings',next);
                    };
                    return (
                      <div key={i} style={{marginBottom:14}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                          <div style={{width:20,height:20,borderRadius:'50%',background:'#E8548C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{i+1}</div>
                          <span style={{fontSize:12,fontWeight:600,color:'#1b2e5a'}}>{t('siblingLabel')} {i+1}</span>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <div style={{flex:2}}>
                            <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>{t('siblingName')}</label>
                            <input style={{...inp(),marginBottom:0}} value={sib.name} onChange={e=>updateSib('name',e.target.value)} placeholder={lang==='es'?'ej. María Torres':'e.g. Maria Torres'}/>
                          </div>
                          <div style={{flex:1}}>
                            <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>{t('siblingStudentId')}</label>
                            <input style={{...inp(),marginBottom:0}} value={sib.studentId} onChange={e=>updateSib('studentId',e.target.value)} placeholder={t('studentIdPlaceholder')}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {form.siblingCount > 0 && (
              <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#92400E',lineHeight:1.5}}>
                📋 {t('siblingNote')} {form.siblingCount+1} {t('siblingNote2')}
              </div>
            )}
          </Field>
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <button onClick={submit} disabled={submitting} style={{ width:'100%', padding:isMobile?14:16, background:submitting?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting?'default':'pointer', boxShadow:`0 2px 8px rgba(232,84,140,0.3)` }}>{submitting?t('submitting'):t('submitNomination')}</button>
        <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:8 }}>{t('nomFormConfidential')}</p>
      </div>
    </div>
  );
}

// ─── VOLUNTEER FORM ───
function VolunteerForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', organization:'', groupType:'Individual', shirtSize:'', arrivalTime:'', storeLocation:'', experience:'', hearAbout:'', smsOptIn:true });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  useEffect(() => {
    const ms = getMsSession();
    if (ms) {
      if (!form.nominatorName && ms.displayName) upd('nominatorName', ms.displayName);
      if (!form.nominatorEmail && ms.email) upd('nominatorEmail', ms.email);
    }
    const handler = (e) => {
      if (e.detail?.displayName) upd('nominatorName', e.detail.displayName);
      if (e.detail?.email) upd('nominatorEmail', e.detail.email);
    };
    window.addEventListener('cs-ms-login', handler);
    return () => window.removeEventListener('cs-ms-login', handler);
  }, []);
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
      <p style={{ color:C.muted, fontSize:13, marginBottom:28 }}>📅 First Friday of August · Three Kohl's locations · Davis County · Before sunrise</p>
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
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:12 }}>Join 400+ volunteers on the first Friday of August at three Davis County Kohl's locations (Layton, Centerville & Clinton). You'll be matched to one child and shop for them head to toe.</p>
            <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#166534' }}>📅 First Friday of August · Three Kohl's · Layton, Centerville, Clinton · ~7:00 AM</div>
          </div>
        </div>
      )}
      {isMobile && <><div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}><img src={photo} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}/></div><div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:4 }}>Volunteer to Shop</h2><p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>Join 400+ volunteers. Be matched to one child. Shop for them like they're family.</p></div><div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:'#166534' }}>📅 First Friday of August · Three Kohl's · Layton, Centerville, Clinton · ~7:00 AM</div></>}
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
          <Field label="Arrival time slot *">
            <select style={{...inp(),appearance:'auto'}} value={form.arrivalTime} onChange={e=>upd('arrivalTime',e.target.value)}>
              <option value="">Select a time...</option>
              <option value="6:30 AM">6:30 AM — Early setup crew</option>
              <option value="7:00 AM">7:00 AM — Main shopping shift</option>
              <option value="7:30 AM">7:30 AM — Second wave</option>
            </select>
          </Field>
          <Field label="Any experience with shopping for or working with kids?"><textarea style={{...inp(),minHeight:72,resize:'vertical'}} value={form.experience} onChange={e=>upd('experience',e.target.value)} placeholder="Optional — helps us match you"/></Field>
          <Field label="Preferred Kohl's location *">
            <select style={{...inp(),appearance:'auto'}} value={form.storeLocation} onChange={e=>upd('storeLocation',e.target.value)}>
              <option value="">Select a store...</option>
              {["Kohl's · Layton, Centerville, Clinton (881 W Antelope Dr)","Kohl's Centerville (510 N 400 W)","Kohl's Clinton (1526 N 2000 W)"].map(s=><option key={s} value={s}>{s}</option>)}
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

// ─── VIDEO CAPTURE ───
function VideoCapture({ token, childFirst, onDone, lang: vcLang }) {
  const tV = vcLang === 'es'
    ? { title:'Video de', instructions:'Graba un video corto en la escuela. El voluntario lo verá antes de comprar.', startBtn:'Comenzar grabación', stopBtn:'Detener y revisar', upload:'✓ Subir video', redo:'↩ Repetir', skip:'Omitir', recording:'GRABANDO', uploading:'Subiendo...', done:'¡Video subido!', doneMsg:'El voluntario verá este video antes de comprar ropa para', cameraErr:'Cámara denegada. Pide al estudiante que permita el acceso.', uploadErr:'Error al subir. Intenta de nuevo.' }
    : { title:'Video for', instructions:'Record a short video at school. The volunteer will watch this before shopping.', startBtn:'Start recording', stopBtn:'Stop & preview', upload:'✓ Upload video', redo:'↩ Record again', skip:'Skip', recording:'RECORDING', uploading:'Uploading...', done:'Video uploaded!', doneMsg:'The volunteer will watch this before shopping for', cameraErr:'Camera access denied.', uploadErr:'Upload failed. Try again.' };

  const [step, setStep] = React.useState('ready'); // ready | recording | preview | uploading | done
  const [stream, setStream] = React.useState(null);
  const [recorder, setRecorder] = React.useState(null);
  const [chunks, setChunks] = React.useState([]);
  const [blob, setBlob] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [progress, setProgress] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [facingMode, setFacingMode] = React.useState('user');
  const [error, setError] = React.useState(null);
  const videoRef = React.useRef(null);
  const previewRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  React.useEffect(() => () => { stream?.getTracks().forEach(t=>t.stop()); clearInterval(timerRef.current); }, [stream]);
  React.useEffect(() => { if (stream && videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(()=>{}); } }, [stream, step]);
  React.useEffect(() => { if (previewUrl && previewRef.current) { previewRef.current.src = previewUrl; previewRef.current.load(); } }, [previewUrl, step]);

  const startCamera = async (facing = facingMode) => {
    stream?.getTracks().forEach(t=>t.stop());
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width:{ideal:720}, height:{ideal:1280}, aspectRatio:{ideal:9/16} },
        audio: true
      });
      setStream(s);
      setStep('camera');
    } catch(e) { setError(tV.cameraErr); }
  };

  const flipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    await startCamera(next);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_000_000 });
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const b = new Blob(chunksRef.current, { type: mime });
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
      stream.getTracks().forEach(t=>t.stop());
      setStream(null);
      setStep('preview');
    };
    rec.start(1000);
    setRecorder(rec);
    setElapsed(0);
    setStep('recording');
    timerRef.current = setInterval(() => {
      setElapsed(e => { if (e >= 89) { rec.stop(); clearInterval(timerRef.current); return 90; } return e+1; });
    }, 1000);
  };

  const stopRecording = () => { clearInterval(timerRef.current); recorder?.state !== 'inactive' && recorder.stop(); };

  const redo = () => { setBlob(null); setPreviewUrl(null); setElapsed(0); startCamera(); };

  const upload = async () => {
    if (!blob) return;
    setStep('uploading'); setProgress(0);
    try {
      const form = new FormData();
      form.append('video', blob, 'video.webm');
      await new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded/e.total*100));
        xhr.onload = () => xhr.status < 300 ? res() : rej(new Error('Upload failed'));
        xhr.onerror = rej;
        xhr.open('POST', `${API}/upload/${token}`);
        xhr.send(form);
      });
      setStep('done');
    } catch(e) { setError(tV.uploadErr); setStep('preview'); }
  };

  // ── DONE ──
  if (step === 'done') return (
    <div style={{textAlign:'center', padding:'60px 20px', maxWidth:400, margin:'0 auto'}}>
      <div style={{fontSize:56, marginBottom:12}}>🎬</div>
      <h3 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:8}}>{tV.done}</h3>
      <p style={{color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:28}}>{tV.doneMsg} {childFirst}.</p>
      <button onClick={onDone} style={{background:C.pink, color:'#fff', border:'none', padding:'13px 36px', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer'}}>Done ✓</button>
    </div>
  );

  // ── UPLOADING ──
  if (step === 'uploading') return (
    <div style={{textAlign:'center', padding:'60px 20px'}}>
      <div style={{fontSize:40, marginBottom:16}}>📤</div>
      <p style={{color:C.navy, fontWeight:700, fontSize:16, marginBottom:20}}>{tV.uploading}</p>
      <div style={{height:10, background:C.border, borderRadius:5, maxWidth:300, margin:'0 auto 10px'}}>
        <div style={{height:10, background:C.pink, borderRadius:5, width:`${progress}%`, transition:'width 0.3s'}}/>
      </div>
      <div style={{fontSize:13, color:C.muted}}>{progress}%</div>
    </div>
  );

  // ── PREVIEW ──
  if (step === 'preview') return (
    <div style={{maxWidth:400, margin:'0 auto', padding:'0 0 32px'}}>
      <div style={{position:'relative', background:'#000', borderRadius:16, overflow:'hidden', marginBottom:14, aspectRatio:'9/16', maxHeight:'65vh'}}>
        <video ref={previewRef} controls playsInline style={{width:'100%', height:'100%', objectFit:'contain', display:'block', background:'#000'}}/>
        <div style={{position:'absolute', top:10, left:10, background:'rgba(5,150,105,0.9)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700}}>✓ Preview</div>
      </div>
      {error && <div style={{background:'#FEF2F2', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#991B1B'}}>{error}</div>}
      <div style={{display:'flex', gap:10, padding:'0 16px'}}>
        <button onClick={redo} style={{flex:1, padding:13, background:'#F1F5F9', color:C.navy, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer'}}>{tV.redo}</button>
        <button onClick={upload} style={{flex:2, padding:13, background:C.green, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer'}}>{tV.upload}</button>
      </div>
      <div style={{textAlign:'center', marginTop:12}}>
        <button onClick={onDone} style={{background:'none', border:'none', color:C.light, fontSize:12, cursor:'pointer'}}>{tV.skip}</button>
      </div>
    </div>
  );

  // ── READY (before camera opens) ──
  if (step === 'ready') return (
    <div style={{maxWidth:400, margin:'0 auto', padding:'32px 20px', textAlign:'center'}}>
      <div style={{fontSize:48, marginBottom:12}}>🎬</div>
      <h3 style={{fontFamily:"'Playfair Display',serif", fontSize:20, color:C.navy, marginBottom:8}}>{tV.title} {childFirst}</h3>
      <p style={{color:C.muted, fontSize:14, lineHeight:1.6, marginBottom:28}}>{tV.instructions}</p>
      <div style={{background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:13, color:'#166534', textAlign:'left'}}>
        <strong>Tips:</strong> Find good light. Hold phone vertically. Ask the student to say their name, grade, favorite color, and what they love most.
      </div>
      {error && <div style={{background:'#FEF2F2', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B'}}>{error}</div>}
      <button onClick={()=>startCamera()} style={{width:'100%', padding:16, background:C.pink, color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:12}}>Open Camera</button>
      <button onClick={onDone} style={{background:'none', border:'none', color:C.light, fontSize:13, cursor:'pointer'}}>{tV.skip}</button>
    </div>
  );

  // ── CAMERA / RECORDING ──
  return (
    <div style={{position:'relative', background:'#000', width:'100%', maxWidth:400, margin:'0 auto', borderRadius:16, overflow:'hidden', aspectRatio:'9/16', maxHeight:'80vh'}}>
      <video ref={videoRef} muted playsInline style={{width:'100%', height:'100%', objectFit:'cover', display:'block', transform: facingMode==='user'?'scaleX(-1)':'none'}}/>

      {/* Top bar */}
      <div style={{position:'absolute', top:0, left:0, right:0, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'}}>
        <button onClick={onDone} style={{background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', borderRadius:'50%', width:36, height:36, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
        {step === 'recording' && (
          <div style={{background:'rgba(220,38,38,0.9)', color:'#fff', borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <span style={{width:8, height:8, background:'#fff', borderRadius:'50%', display:'inline-block'}}/>
            {tV.recording} {elapsed}s
          </div>
        )}
        <button onClick={flipCamera} style={{background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', borderRadius:'50%', width:36, height:36, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>🔄</button>
      </div>

      {/* Progress bar */}
      {step === 'recording' && (
        <div style={{position:'absolute', top:0, left:0, right:0, height:4, background:'rgba(255,255,255,0.2)'}}>
          <div style={{height:4, background:C.pink, width:`${(elapsed/90)*100}%`, transition:'width 1s linear'}}/>
        </div>
      )}

      {/* Time remaining */}
      {step === 'recording' && (
        <div style={{position:'absolute', bottom:90, right:16, background:'rgba(0,0,0,0.6)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:600}}>
          {90-elapsed}s left
        </div>
      )}

      {/* Record button */}
      <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'20px 16px', background:'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
        {step === 'recording' ? (
          <button onClick={stopRecording} style={{width:72, height:72, borderRadius:'50%', border:'3px solid #fff', background:'rgba(220,38,38,0.9)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{width:24, height:24, background:'#fff', borderRadius:4, display:'inline-block'}}/>
          </button>
        ) : (
          <button onClick={startRecording} style={{width:72, height:72, borderRadius:'50%', border:'3px solid #fff', background:'rgba(232,84,140,0.9)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{width:24, height:24, background:'#fff', borderRadius:'50%', display:'inline-block'}}/>
          </button>
        )}
        <span style={{color:'rgba(255,255,255,0.7)', fontSize:12}}>{step === 'recording' ? tV.stopBtn : tV.startBtn}</span>
      </div>
    </div>
  );
}


function ParentIntake({ token }) {
  const { lang, setLang, t } = useLang();
  const isMobile = useIsMobile();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ gender:'', childAge:'', department:'', shirtSize:'', pantSize:'', shoeSize:'', favoriteColors:'', avoidColors:'', allergies:'', preferences:'', parentConsent:false });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form');
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  useEffect(() => {
    const ms = getMsSession();
    if (ms) {
      if (!form.nominatorName && ms.displayName) upd('nominatorName', ms.displayName);
      if (!form.nominatorEmail && ms.email) upd('nominatorEmail', ms.email);
    }
    const handler = (e) => {
      if (e.detail?.displayName) upd('nominatorName', e.detail.displayName);
      if (e.detail?.email) upd('nominatorEmail', e.detail.email);
    };
    window.addEventListener('cs-ms-login', handler);
    return () => window.removeEventListener('cs-ms-login', handler);
  }, []);
  useEffect(() => { (async()=>{ try{ const data=await api(`/intake/${token}`); setChild(data); if(data.parentLanguage && data.parentLanguage !== 'en') setLang(data.parentLanguage); if(data.alreadySubmitted)setStep('done'); }catch(err){setError(err.message);} setLoading(false); })(); }, [token]);
  const submit = async () => {
    if (!form.shirtSize||!form.pantSize||!form.shoeSize) { alert(lang==='es'?'Por favor complete las tallas de camiseta, pantalón y zapato.':'Please fill in shirt, pant, and shoe sizes.'); return; }
    if (!form.parentConsent) { alert(t('consentRequired')); return; }
    setSubmitting(true);
    try { await api(`/intake/${token}`,{method:'POST',body:JSON.stringify({...form,language:lang})}); setStep('done'); } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (loading) return <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>;
  if (error) return <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:48, marginBottom:16 }}>🔒</div><p style={{ color:'#991B1B', fontSize:14 }}>{error}</p></div>;
  if (step === 'done') return <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}><div style={{ marginBottom:16 }}><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style={{width:72,height:72}} /></div><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>All Done!</h2><p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:400, margin:'0 auto' }}>We have everything we need for {child?.childFirst}. Their family advocate will record a short video with them at school soon — then a volunteer will shop a complete new outfit just for them.</p></div>;
  // video removed from parent flow — FA records at school
  const maxW = isMobile ? '100%' : 680;
  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'20px 16px':'32px 40px' }}>
      <div style={{ textAlign:'center', marginBottom:isMobile?24:32 }}>
        <div style={{ marginBottom:8 }}><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style={{width:isMobile?48:64,height:isMobile?48:64}} /></div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?22:28, color:C.navy, marginBottom:4 }}>Sizes for {child?.childFirst}</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.5, maxWidth:400, margin:'0 auto' }}>A volunteer will shop brand new clothes for your child. Takes about 2 minutes.</p>
      </div>
      <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:13, color:'#9A3412' }}>Everything shared here is confidential and used only for shopping.</div>
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}
      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>{t('aboutTitle')} {child?.childFirst}</p>
          <Row cols={2} gap={10}>
            <Field label="Gender">
              <select style={{...inp(),appearance:'auto'}} value={form.gender} onChange={e=>upd('gender',e.target.value)}>
                <option value="">Select...</option>
                {['Girl','Boy','Non-binary / Other'].map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Child's age">
              <select style={{...inp(),appearance:'auto'}} value={form.childAge||''} onChange={e=>upd('childAge',e.target.value)}>
                <option value="">Select age...</option>
                {[4,5,6,7,8,9,10,11,12,13].map(a=><option key={a} value={a}>{a} years old</option>)}
              </select>
            </Field>
          </Row>
          <Field label="Shopping section">
            <div style={{display:'flex',gap:10}}>
              {["Boys","Girls"].map(d=>(
                <label key={d} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flex:1,padding:'12px 14px',background:form.department===d?C.navy:C.bg,border:`1.5px solid ${form.department===d?C.navy:C.border}`,borderRadius:8,transition:'all 0.15s',justifyContent:'center'}}>
                  <input type="radio" name="department" value={d} checked={form.department===d} onChange={()=>{upd('department',d);upd('shirtSize','');upd('pantSize','');}} style={{display:'none'}}/>
                  <span style={{fontSize:14,fontWeight:form.department===d?700:400,color:form.department===d?'#fff':C.muted}}>{d}</span>
                  {form.department===d&&<span style={{color:'#fff',fontSize:12}}>✓</span>}
                </label>
              ))}
            </div>
          </Field>
          <p style={secHead(isMobile)}>{t('clothingSizes')}</p>
          {(() => { const isG = form.department === "Girls"; const sh = isG ? SHIRT_SIZES_GIRLS : SHIRT_SIZES_BOYS; const pa = isG ? PANT_SIZES_GIRLS : PANT_SIZES_BOYS; return (
          <Row cols={3} gap={8}><Field label="Shirt *"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Size</option>{sh.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Pants *"><select style={{...inp(),appearance:'auto'}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}><option value="">Size</option>{pa.map(s=><option key={s} value={s}>{s}</option>)}</select></Field><Field label="Shoe *"><input style={inp()} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)} placeholder="e.g., 4Y"/></Field></Row>
          ); })()}
        </div>
        <div>
          <p style={secHead(isMobile)}>Preferences <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10, color:C.light }}>optional</span></p>
          <Field label="Favorite colors, styles, characters?"><input style={inp()} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)} placeholder="e.g., Blue, dinosaurs, soccer"/></Field>
          <Field label="Colors or styles to avoid?"><input style={inp()} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)} placeholder="e.g., No pink, no ruffles"/></Field>
          <Field label="Allergies or sensory needs?"><input style={inp()} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder="e.g., No wool, needs soft fabrics"/></Field>
        </div>
      </div>
      {/* Consent checkbox */}
      <div style={{ background:'#F0F9FF', border:`1px solid #BAE6FD`, borderRadius:10, padding:'14px 16px', marginTop:20 }}>
        <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
          <input type="checkbox" checked={form.parentConsent} onChange={e=>upd('parentConsent',e.target.checked)}
            style={{ marginTop:2, width:18, height:18, accentColor:C.pink, flexShrink:0, cursor:'pointer' }}/>
          <span style={{ fontSize:13, color:'#0C4A6E', lineHeight:1.6 }}>{t('consentLabel')}</span>
        </label>
      </div>
      <button onClick={submit} disabled={submitting||!form.parentConsent} style={{ width:'100%', padding:isMobile?14:16, background:submitting||!form.parentConsent?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:submitting||!form.parentConsent?'default':'pointer', marginTop:12 }}>
        {submitting ? t('submitIntakeSaving') : t('submitIntake')}
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
  const tabs = [{ key:'nominations', icon:'📋', label:'Nominations' }, { key:'volunteers', icon:'🛒', label:'Volunteers' }, { key:'advocates', icon:'🏫', label:'Advocates' }];
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
      {activeTab === 'advocates' && <AdvocatesTab isMobile={isMobile}/>}
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
                  <td style={{ padding:'12px 14px' }}><div style={{ fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div><div style={{ fontSize:11, color:C.light, marginTop:2 }}>{n.grade}{n.studentId ? ` · ID: ${n.studentId}` : ''}</div>{n.familyGroup&&<div style={{ marginTop:3 }}><span style={{ fontSize:10, fontWeight:600, background:'#EDE9FE', color:'#6D28D9', padding:'2px 6px', borderRadius:4 }}>👨‍👩‍👧 Family</span></div>}</td>
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
                <div><div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}{n.familyGroup&&<span style={{ fontSize:10, fontWeight:600, background:'#EDE9FE', color:'#6D28D9', padding:'2px 6px', borderRadius:4, marginLeft:8, verticalAlign:'middle' }}>👨‍👩‍👧 Family</span>}</div><div style={{ fontSize:12, color:C.light, marginTop:2 }}>{n.school} · {n.grade}</div></div>
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


// ─── FA VIDEO PAGE — recorded by advocate at school ──────────────────────────
function FAVideoPage({ faToken, nominationId, navigate }) {
  const isMobile = useIsMobile();
  const [nom, setNom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('intro'); // intro | camera | preview | uploading | done
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [recorder, setRecorder] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const liveRef = useRef(null);
  const playbackRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const elapsedRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // Use session token to load nomination
        const sessionData = sessionStorage.getItem('fa-session');
        const session = sessionData ? JSON.parse(sessionData) : null;
        if (!session?.token) { setError('Please log in first.'); setLoading(false); return; }
        const data = await api(`/portal/nomination/${nominationId}`, { headers: { 'X-FA-Token': session.token } });
        setNom(data);
      } catch(e) { setError(e.message); }
      setLoading(false);
    })();
  }, [nominationId]);

  const stopStream = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => () => { stopStream(); clearInterval(timerRef.current); clearInterval(elapsedRef.current); }, []);

  useEffect(() => {
    if (stream && liveRef.current) {
      liveRef.current.srcObject = stream;
      liveRef.current.play().catch(() => {});
    }
  }, [stream, mode]);

  useEffect(() => {
    if (previewUrl && playbackRef.current) {
      playbackRef.current.src = previewUrl;
      playbackRef.current.load();
    }
  }, [previewUrl, mode]);

  const startCamera = async (facing = facingMode) => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      setStream(s);
      setMode('camera');
    } catch { setError('Camera access denied.'); }
  };

  const flipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    await startCamera(next);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mt = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 2000000 });
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mt });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob); setPreviewUrl(url);
      stopStream(); setMode('preview');
    };
    setRecorder(rec); rec.start(1000);
    setRecording(true); setCountdown(90); setElapsed(0);
    timerRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(timerRef.current); clearInterval(elapsedRef.current); rec.stop(); setRecording(false); return 0; }
      return c - 1;
    }), 1000);
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current); clearInterval(elapsedRef.current);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null); setPreviewUrl(null); setElapsed(0); setCountdown(0);
    setMode('intro');
  };

  const upload = async () => {
    if (!recordedBlob) return;
    setMode('uploading'); setProgress(0);
    try {
      const fd = new FormData();
      fd.append('video', recordedBlob, 'video.webm');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded/e.total*100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject();
        xhr.onerror = reject;
        xhr.open('POST', `${API}/upload/${nom.parentToken}`);
        xhr.send(fd);
      });
      // Mark video uploaded
      await fetch(`${API}/fa/video/${nominationId}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      setMode('done');
    } catch { setError('Upload failed. Try again.'); setMode('preview'); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:80, color:C.light }}>Loading...</div>;
  if (error) return <div style={{ textAlign:'center', padding:80 }}><p style={{ color:C.red }}>{error}</p></div>;

  const maxW = isMobile ? '100%' : 480;
  const isPortrait = window.innerHeight > window.innerWidth;

  if (mode === 'done') return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🎬</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:C.navy, marginBottom:8 }}>Video uploaded!</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:360, margin:'0 auto 28px' }}>
        The volunteer who shops for {nom.childFirst} will watch this video before they go. It makes all the difference.
      </p>
      <button onClick={() => navigate('#/portal')} style={{ background:C.navy, color:'#fff', border:'none', padding:'13px 32px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
        ← Back to my kids
      </button>
    </div>
  );

  if (mode === 'uploading') return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:40, marginBottom:16 }}>📤</div>
      <p style={{ color:C.navy, fontWeight:700, fontSize:16, marginBottom:20 }}>Uploading...</p>
      <div style={{ height:10, background:C.border, borderRadius:5, maxWidth:280, margin:'0 auto 10px' }}>
        <div style={{ height:10, background:C.pink, borderRadius:5, width:`${progress}%`, transition:'width 0.3s' }}/>
      </div>
      <p style={{ color:C.muted, fontSize:13 }}>{progress}%</p>
    </div>
  );

  return (
    <div style={{ maxWidth:maxW, margin:'0 auto', padding:isMobile?'0 0 32px':'20px 24px 40px' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'16px 20px', textAlign:'center', marginBottom:0 }}>
        <button onClick={() => navigate('#/portal')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', float:'left', padding:'4px 0' }}>← Back</button>
        <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>🎬 {nom.childFirst}'s Video</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:2 }}>{nom.grade} · {nom.school}</div>
      </div>

      {error && <div style={{ background:'#FEF2F2', padding:'10px 16px', fontSize:13, color:C.red }}>{error}</div>}

      {/* INTRO / INSTRUCTIONS */}
      {mode === 'intro' && (
        <div style={{ padding:'24px 20px' }}>
          <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:12, padding:'16px 18px', marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#166534', margin:'0 0 10px' }}>📋 Before you record:</p>
            <ul style={{ margin:0, padding:'0 0 0 18px', fontSize:13, color:'#166534', lineHeight:2 }}>
              <li>Find a quiet spot at school with good light</li>
              <li>Ask {nom.childFirst} to face the camera and smile</li>
              <li>Aim for <strong>30–60 seconds</strong> (90 sec max)</li>
              <li>Hold phone <strong>vertically</strong> — portrait mode</li>
              <li>Use the 🔄 button to flip between front and back camera</li>
            </ul>
          </div>
          <div style={{ background:'#EFF6FF', border:`1px solid #BAE6FD`, borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#1E40AF', margin:'0 0 8px' }}>🎤 What to ask {nom.childFirst}:</p>
            <ol style={{ margin:0, padding:'0 0 0 18px', fontSize:13, color:'#1E40AF', lineHeight:2 }}>
              <li>"What's your name and what grade are you in?"</li>
              <li>"What's your favorite color?"</li>
              <li>"What do you love — sports, characters, hobbies?"</li>
              <li>"Is there anything specific you've been wanting?"</li>
              <li>"What makes you excited about a new outfit?"</li>
            </ol>
          </div>
          {nom.parentIntake && (
            <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:12, padding:'14px 18px', marginBottom:20, fontSize:13, color:'#92400E' }}>
              <p style={{ fontWeight:700, margin:'0 0 6px' }}>👕 Parent already filled out sizes:</p>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {nom.parentIntake.shirtSize && <span>Shirt: <strong>{nom.parentIntake.shirtSize}</strong></span>}
                {nom.parentIntake.pantSize && <span>Pants: <strong>{nom.parentIntake.pantSize}</strong></span>}
                {nom.parentIntake.shoeSize && <span>Shoe: <strong>{nom.parentIntake.shoeSize}</strong></span>}
                {nom.parentIntake.favoriteColors && <span>Loves: <strong>{nom.parentIntake.favoriteColors}</strong></span>}
              </div>
            </div>
          )}
          <button onClick={() => startCamera()} style={{ width:'100%', padding:16, background:C.pink, color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 2px 12px rgba(232,84,140,0.35)' }}>
            <span style={{ fontSize:20 }}>📷</span> Start Recording {nom.childFirst}
          </button>
        </div>
      )}

      {/* CAMERA */}
      {mode === 'camera' && (
        <div>
          <div style={{ position: isMobile ? 'fixed' : 'relative', top:0, left:0, right:0, bottom:0, background:'#000', overflow:'hidden', zIndex: isMobile ? 999 : 'auto' }}>
            <video ref={liveRef} muted playsInline
              style={{ width:'100%', height: isMobile ? '100svh' : 500, maxHeight: isMobile ? '100svh' : 500, objectFit:'cover', display:'block', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}/>
            {/* Top controls overlay */}
            <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {recording ? (
                <div style={{ background:'rgba(220,38,38,0.9)', color:'#fff', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, background:'#fff', borderRadius:'50%', display:'inline-block' }}/>
                  REC {elapsed}s
                </div>
              ) : <div/>}
              {/* Flip button */}
              <button onClick={flipCamera} style={{ background:'rgba(0,0,0,0.6)', border:'2px solid rgba(255,255,255,0.7)', color:'#fff', borderRadius:'50%', width:52, height:52, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                🔄
              </button>
            </div>
            {/* Countdown + progress */}
            {recording && (
              <>
                <div style={{ position:'absolute', bottom:60, right:14, background:'rgba(0,0,0,0.6)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:600 }}>
                  {countdown}s left
                </div>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:5, background:'rgba(255,255,255,0.2)' }}>
                  <div style={{ height:5, background:C.pink, width:`${((90-countdown)/90)*100}%`, transition:'width 1s linear' }}/>
                </div>
              </>
            )}
            {/* Portrait guide */}
            {!recording && (
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', border:'2px dashed rgba(255,255,255,0.3)', borderRadius:16, width:'55%', height:'70%', pointerEvents:'none' }}/>
            )}
          </div>
          <div style={{ position: isMobile ? 'fixed' : 'relative', bottom: isMobile ? 40 : 'auto', left:0, right:0, padding:'14px 24px', zIndex:1000, background: isMobile ? 'transparent' : 'none' }}>
            {!recording ? (
              <button onClick={startRecording} style={{ width:'100%', padding:16, background:C.pink, color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ width:14, height:14, background:'#fff', borderRadius:'50%', display:'inline-block' }}/> Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} style={{ width:'100%', padding:16, background:'#DC2626', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ width:14, height:14, background:'#fff', borderRadius:2, display:'inline-block' }}/> Stop & Preview
              </button>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {mode === 'preview' && previewUrl && (
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ borderRadius:16, overflow:'hidden', background:'#000', marginBottom:14, position:'relative' }}>
            <video ref={playbackRef} controls playsInline style={{ width:'100%', maxHeight:isMobile?'65vh':480, objectFit:'contain', display:'block', background:'#000' }}/>
            <div style={{ position:'absolute', top:10, left:10, background:'rgba(5,150,105,0.9)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700 }}>✓ Preview</div>
          </div>
          <div style={{ fontSize:12, color:C.muted, textAlign:'center', marginBottom:12 }}>
            {elapsed}s recorded · {recordedBlob ? (recordedBlob.size/1024/1024).toFixed(1) : '?'} MB
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={retake} style={{ flex:1, padding:13, background:'#F1F5F9', color:C.navy, border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>↩ Redo</button>
            <button onClick={upload} style={{ flex:2, padding:13, background:C.green, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>✓ Upload Video</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PHONE BANNER (FA portal — add cell for text updates) ───────────────────
function PhoneBanner({ session, isMobile }) {
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    api('/portal/phone', { headers: { 'X-FA-Token': session.token } })
      .then(d => { if (d.phone) { setPhone(d.phone); setHasPhone(true); } setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [session]);

  const savePhone = async () => {
    setSaving(true);
    try {
      await api('/portal/phone', { method:'POST', headers:{'X-FA-Token':session.token,'Content-Type':'application/json'}, body:JSON.stringify({ phone }) });
      setSaved(true); setHasPhone(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { alert('Failed to save: ' + e.message); }
    setSaving(false);
  };

  if (!loaded) return null;

  if (hasPhone && !saved) return (
    <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 16px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
      <span style={{ fontSize:13, color:'#166534' }}>📱 Text updates going to <strong>{phone}</strong></span>
      <button onClick={()=>setHasPhone(false)} style={{ fontSize:11, color:'#166534', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Change</button>
    </div>
  );

  return (
    <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
      {saved ? (
        <span style={{ fontSize:13, color:'#166534', fontWeight:600 }}>✅ Phone saved! We'll text you updates.</span>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, color:'#92400E', flex:'0 0 auto' }}>📱 Add your cell to get text updates:</span>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(801) 555-0000"
            style={{ ...inp({width:isMobile?'100%':180}), marginBottom:0, padding:'6px 10px', fontSize:13 }}/>
          <button onClick={savePhone} disabled={saving||!phone.trim()} style={{ padding:'6px 14px', background:phone.trim()?C.navy:'#ccc', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>{saving?'Saving...':'Save'}</button>
        </div>
      )}
    </div>
  );
}

// ─── PORTAL NOMINATION CARD (expandable + editable) ─────────────────────────
function PortalNomCard({ n, session, navigate, statusColor, statusLabel, isMobile, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const intake = n.intake || { submitted: false, consent: false, videoRecorded: false };
  const [form, setForm] = useState({
    shirtSize: intake.shirtSize||'', pantSize: intake.pantSize||'', shoeSize: intake.shoeSize||'',
    favoriteColors: intake.favoriteColors||'', avoidColors: intake.avoidColors||'',
    allergies: intake.allergies||'', preferences: intake.preferences||'',
    grade: n.grade||'',
  });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api(`/portal/nomination/${n.id}`, {
        method:'PATCH',
        headers: { 'X-FA-Token': session.token, 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      setSaved(true); setEditing(false);
      if (onUpdate) onUpdate();
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const pill = (label, done) => (
    <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:12, fontSize:10, fontWeight:600, marginRight:6,
      background: done ? '#D1FAE5' : '#FEF3C7', color: done ? '#065F46' : '#92400E' }}>
      {done ? '✅' : '⏳'} {label}
    </span>
  );

  return (
    <div style={{ background:C.card, borderRadius:12, border:`1px solid ${open?C.navy+'33':C.border}`, overflow:'hidden', transition:'border 0.2s' }}>
      {/* Header — always visible, clickable */}
      <div onClick={()=>setOpen(!open)} style={{ padding:'14px 18px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, color:C.navy, fontSize:15 }}>{n.childFirst} {n.childLast}</span>
            <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:statusColor[n.status]+'22', color:statusColor[n.status] }}>
              {statusLabel[n.status]||n.status}
            </span>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{n.grade} · {n.school} · Parent: {n.parentName}</div>
          {!open && intake.submitted && (
            <div style={{ marginTop:6 }}>
              {pill('Intake', true)}
              {pill('Consent', intake.consent)}
              {pill('Video', intake.videoRecorded)}
            </div>
          )}
          {!open && !intake.submitted && <div style={{ marginTop:6 }}>{pill('Awaiting parent', false)}</div>}
        </div>
        <span style={{ fontSize:18, color:C.light, transition:'transform 0.2s', transform:open?'rotate(180deg)':'rotate(0)' }}>▼</span>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'16px 18px' }}>
          {/* Status row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {pill('Intake', intake.submitted)}
            {pill('Consent', intake.consent)}
            {pill('Video', intake.videoRecorded)}
            {intake.submitted && !intake.videoRecorded && (
              <button onClick={()=>navigate(`#/fa/_/video/${n.id}`)} style={{ padding:'4px 12px', background:C.pink, color:'#fff', border:'none', borderRadius:12, fontSize:11, fontWeight:700, cursor:'pointer' }}>🎬 Record Video</button>
            )}
          </div>

          {intake.submitted ? (
            <>
              {/* Sizes section */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>Clothing sizes</span>
                  {!editing ? (
                    <button onClick={()=>setEditing(true)} style={{ padding:'4px 12px', background:'#F1F5F9', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:C.navy }}>✏️ Edit</button>
                  ) : (
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={save} disabled={saving} style={{ padding:'4px 12px', background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>{saving?'Saving...':'Save'}</button>
                      <button onClick={()=>{setEditing(false);setForm({shirtSize:intake.shirtSize||'',pantSize:intake.pantSize||'',shoeSize:intake.shoeSize||'',favoriteColors:intake.favoriteColors||'',avoidColors:intake.avoidColors||'',allergies:intake.allergies||'',preferences:intake.preferences||'',grade:n.grade||''});}} style={{ padding:'4px 12px', background:'#F1F5F9', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:C.muted }}>Cancel</button>
                    </div>
                  )}
                </div>
                {saved && <div style={{ background:'#D1FAE5', color:'#065F46', padding:'6px 12px', borderRadius:6, fontSize:12, marginBottom:10, fontWeight:600 }}>✅ Saved!</div>}

                {editing ? (
                  <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:10 }}>
                    <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Grade</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">—</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                    <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shirt size</label><input style={{...inp(),marginBottom:0}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}/></div>
                    <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Pant size</label><input style={{...inp(),marginBottom:0}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}/></div>
                    <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shoe size</label><input style={{...inp(),marginBottom:0}} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)}/></div>
                    <div style={{gridColumn:isMobile?'1/-1':'span 1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Favorite colors</label><input style={{...inp(),marginBottom:0}} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)}/></div>
                    <div style={{gridColumn:isMobile?'1/-1':'span 1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Colors to avoid</label><input style={{...inp(),marginBottom:0}} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)}/></div>
                    <div style={{gridColumn:'1/-1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Allergies / notes</label><input style={{...inp(),marginBottom:0}} value={form.allergies} onChange={e=>upd('allergies',e.target.value)}/></div>
                    <div style={{gridColumn:'1/-1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Preferences / special requests</label><input style={{...inp(),marginBottom:0}} value={form.preferences} onChange={e=>upd('preferences',e.target.value)}/></div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr 1fr':'repeat(5,1fr)', gap:8 }}>
                    {[
                      { label:'Shirt', val:intake.shirtSize, icon:'👕' },
                      { label:'Pants', val:intake.pantSize, icon:'👖' },
                      { label:'Shoes', val:intake.shoeSize, icon:'👟' },
                      { label:'Loves', val:intake.favoriteColors, icon:'❤️' },
                      { label:'Avoid', val:intake.avoidColors, icon:'✗' },
                    ].filter(s=>s.val).map(s=>(
                      <div key={s.label} style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:16 }}>{s.icon}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginTop:2 }}>{s.val}</div>
                        <div style={{ fontSize:10, color:C.light }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!editing && (intake.allergies || intake.preferences) && (
                  <div style={{ marginTop:10, fontSize:12, color:C.text, lineHeight:1.6 }}>
                    {intake.allergies && <div><strong>Allergies:</strong> {intake.allergies}</div>}
                    {intake.preferences && <div><strong>Preferences:</strong> {intake.preferences}</div>}
                  </div>
                )}
              </div>

              {/* Video section */}
              {intake.videoRecorded && (
                <div style={{ background:'#F0FDF4', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#166534' }}>
                  🎬 Video recorded and ready for volunteers
                </div>
              )}
            </>
          ) : (
            <div style={{ background:'#FFFBEB', borderRadius:8, padding:'12px 16px', fontSize:13, color:'#92400E', lineHeight:1.6 }}>
              ⏳ Waiting for parent to complete the sizing form. Once they submit, you'll be notified to record a video with {n.childFirst} at school.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FA PORTAL ─────────────────────────────────────────────────────────────
function FAPortal() {
  const isMobile = useIsMobile();
  const navigate = hash => { window.location.hash = hash; window.scrollTo(0,0); };
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(() => {
    const s = sessionStorage.getItem('fa-session');
    return s ? JSON.parse(s) : null;
  });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError(null); setLoggingIn(true);
    try {
      const res = await api('/portal/login', { method:'POST', body:JSON.stringify({ email, phone: phone.trim() || undefined }) });
      const s = { token: res.token, email: res.email };
      sessionStorage.setItem('fa-session', JSON.stringify(s));
      setSession(s);
    } catch(err) {
      setError(err.message);
    }
    setLoggingIn(false);
  };

  const logout = () => { sessionStorage.removeItem('fa-session'); setSession(null); setDashboard(null); };
  const msLogin = async () => {
    try {
      setLoggingIn(true); setError(null);
      await msalSignIn();
      // loginRedirect navigates away — if we're still here, something went wrong
    } catch(e) {
      setError(e.message === 'user_cancelled' ? null : (e.message || 'Sign-in failed. Please use the email option below.'));
    } finally { setLoggingIn(false); }
  };

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    api('/portal/dashboard', { headers:{ 'X-FA-Token': session.token } })
      .then(d => setDashboard(d))
      .catch(err => { if (err.message.includes('expired')) { logout(); } else { setError(err.message); } })
      .finally(() => setLoading(false));
  }, [session]);

  const pad = isMobile ? '20px 16px' : '32px 40px';

  // ── CHECK FOR SSO REDIRECT ──
  useEffect(() => {
    const pending = sessionStorage.getItem('ms_sso_pending');
    if (pending && !session) {
      sessionStorage.removeItem('ms_sso_pending');
      try {
        const msUser = JSON.parse(pending);
        if (msUser.email) {
          setLoggingIn(true);
          setError(null);
          api('/portal/login', { method:'POST', body:JSON.stringify({ email: msUser.email, name: msUser.name, sso: true }) })
            .then(res => {
              const s = { token: res.token, email: res.email, name: res.name || msUser.name };
              sessionStorage.setItem('fa-session', JSON.stringify(s));
              setSession(s);
            })
            .catch(err => setError('Microsoft sign-in completed but portal login failed. Try the email option below.'))
            .finally(() => setLoggingIn(false));
        }
      } catch(e) { /* malformed pending data — ignore */ }
    } else if (pending) {
      // Already have a session, clear stale pending
      sessionStorage.removeItem('ms_sso_pending');
    }
  }, []);

  // ── LOGIN ──
  if (!session) return (
    <div style={{ maxWidth:420, margin: isMobile?'48px auto 0':'80px auto 0', padding:'0 16px' }}>
      <div style={{ background:C.card, borderRadius:16, padding:36, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style={{ width:56, height:56, marginBottom:12 }}/>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:6 }}>Family Advocate Portal</h2>
          <p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>Sign in with your Davis School District account</p>
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <LangToggle lang={lang} setLang={setLang} style={{ background:'rgba(27,58,75,0.08)', border:'1px solid rgba(27,58,75,0.2)', color:C.navy }}/>
        </div>
        {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}

        {loggingIn ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:C.muted }}>Signing you in...</div>
        ) : (
          <>
            {/* Primary: Microsoft SSO */}
            <a href={getMsalLoginUrl()} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', padding:14, background:C.navy, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', textDecoration:'none', boxSizing:'border-box', marginBottom:16 }}>
              <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </a>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:C.border }}/>
              <span style={{ fontSize:12, color:C.light }}>or use email</span>
              <div style={{ flex:1, height:1, background:C.border }}/>
            </div>

            {/* Fallback: email login */}
            <label style={lbl}>School email address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
              placeholder="you@dsdmail.net" style={{...inp(), marginBottom:16, fontSize:15 }}/>
            <button onClick={login} disabled={loggingIn||!email.trim()} style={{ width:'100%', padding:12, background:loggingIn||!email.trim()?C.light:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {loggingIn ? 'Looking you up...' : 'Continue with email'}
            </button>
            <p style={{ textAlign:'center', fontSize:11, color:C.light, marginTop:10, lineHeight:1.5 }}>
              Use your @dsdmail.net email, or sign in with Microsoft above.
            </p>
          </>
        )}
      </div>
    </div>
  );

  // ── LOADING ──
  if (loading) return <div style={{ textAlign:'center', padding:80, color:C.light }}>Loading your dashboard...</div>;

  // ── DASHBOARD ──
  if (!dashboard) return null;

  const { stats, nominations, nominatorName } = dashboard;
  const needsVideo = nominations.filter(n => n.intake.submitted && !n.intake.videoRecorded);
  const statusColor = { pending:'#F59E0B', approved:'#10B981', sent:'#3B82F6', complete:'#8B5CF6', declined:'#EF4444' };
  const statusLabel = { pending:'Pending Review', approved:'Approved', sent:'Sent to Parent', complete:'Complete', declined:'Declined' };

  return (
    <div style={{ maxWidth:isMobile?'100%':960, margin:'0 auto', padding:pad }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ color:C.muted, fontSize:13, margin:'0 0 2px' }}>{t('portalWelcome')}</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?20:26, color:C.navy, margin:0 }}>{nominatorName || session.email}</h2>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <LangToggle lang={lang} setLang={setLang} style={{ background:'rgba(27,58,75,0.08)', border:'1px solid rgba(27,58,75,0.2)', color:C.navy }}/>
          <button onClick={logout} style={{ padding:'8px 16px', background:'#F1F5F9', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', color:C.muted }}>{t('portalLogout')}</button>
        </div>
      </div>

      {/* Phone number for text updates */}
      <PhoneBanner session={session} isMobile={isMobile}/>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)', gap:isMobile?8:12, marginBottom:28 }}>
        {[
          { label:t('portalTotal'), v:stats.total, c:C.navy },
          { label:t('portalIntake'), v:stats.intakeComplete, c:C.green },
          { label:t('portalConsent'), v:stats.consented, c:'#8B5CF6' },
          { label:t('portalNeedsVideo'), v:stats.needsVideo, c:C.amber },
          { label:t('portalAwaiting'), v:stats.awaitingParent, c:C.blue },
          { label:t('portalPending'), v:stats.pending, c:C.muted },
        ].slice(0, isMobile?3:6).map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding:isMobile?'10px 8px':'14px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:isMobile?22:30, fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4, marginTop:4, lineHeight:1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Needs Video Alert */}
      {needsVideo.length > 0 && (
        <div style={{ background:'#FFF7ED', border:`1.5px solid #FED7AA`, borderRadius:12, padding:'16px 20px', marginBottom:24 }}>
          <h3 style={{ color:'#92400E', fontFamily:"'Playfair Display',serif", fontSize:16, margin:'0 0 12px' }}>{t('portalNeedsVideoTitle')}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {needsVideo.map(n => (
              <div key={n.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', borderRadius:8, padding:'10px 14px', border:`1px solid #FED7AA` }}>
                <div>
                  <span style={{ fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</span>
                  <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{n.grade} · {n.school}</span>
                </div>
                <button onClick={()=>navigate(`#/fa/_/video/${n.id}`)} style={{ padding:'6px 14px', background:C.pink, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>🎬 Record Now</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {needsVideo.length === 0 && stats.intakeComplete > 0 && (
        <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#166534' }}>
          ✅ {t('portalNeedsVideoEmpty')}
        </div>
      )}

      {/* All nominations — expandable cards */}
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?16:18, color:C.navy, marginBottom:14 }}>{t('portalAllTitle')}</h3>
      {nominations.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:C.light, fontSize:14 }}>No nominations yet.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {nominations.map(n => (
            <PortalNomCard key={n.id} n={n} session={session} navigate={navigate} statusColor={statusColor} statusLabel={statusLabel} isMobile={isMobile} onUpdate={()=>{
              // Refresh dashboard
              api('/portal/dashboard', { headers:{ 'X-FA-Token': session.token } }).then(d => setDashboard(d)).catch(()=>{});
            }}/>
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

  // Handle Microsoft SSO redirect back to app
  useEffect(() => {
    const hash = window.location.hash;
    sessionStorage.removeItem('ms_sso_error');

    // If the URL has an id_token from Microsoft implicit flow redirect
    if (hash.includes('id_token=')) {
      const msUser = parseMsalFragment(hash);
      if (msUser) {
        // Successfully parsed the token — store user and go to portal
        sessionStorage.setItem('cs-ms-user', JSON.stringify(msUser));
        sessionStorage.setItem('ms_sso_pending', JSON.stringify({ email: msUser.email, name: msUser.name }));
        window.history.replaceState(null, '', window.location.pathname + '#/portal');
        setRoute('#/portal');
      } else {
        // Token parse failed — clean up and go to portal
        window.history.replaceState(null, '', window.location.pathname + '#/portal');
        setRoute('#/portal');
      }
    } else if (hash.includes('error=') || hash.includes('code=')) {
      // Microsoft returned an error or code — clean up
      window.history.replaceState(null, '', window.location.pathname + '#/portal');
      setRoute('#/portal');
    }
  }, []);
  useEffect(() => {
    const h = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const navigate = hash => { window.location.hash = hash; window.scrollTo(0,0); };

  let view = 'home', token = null, faToken = null, faVideoNomId = null;
  if (route.startsWith('#/nominate')) view = 'nominate';
  else if (route.startsWith('#/volunteer')) view = 'volunteer';
  else if (route.startsWith('#/admin')) view = 'admin';
  else if (route.startsWith('#/intake/')) { view = 'parent'; token = route.replace('#/intake/',''); }
  else if (route.match(/#\/fa\/([^/]+)\/video\/([^/]+)/)) {
    const m = route.match(/#\/fa\/([^/]+)\/video\/([^/]+)/);
    view = 'fa-video'; faToken = m[1]; faVideoNomId = m[2];
  }
  else if (route.startsWith('#/fa/')) { view = 'fa'; faToken = route.replace('#/fa/',''); }
  else if (route.startsWith('#/portal')) view = 'portal';
  else if (route === '#/' || route === '#' || route === '') view = 'home';

  if (view === 'parent' && token) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      <ParentIntake token={token}/>
      {isMobile && <div style={{ height:72 }}/>}
    </div>
  );

  if (view === 'fa' && faToken) return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <FAPortal faToken={faToken} navigate={navigate}/>
    </div>
  );

  if (view === 'fa-video' && faToken && faVideoNomId) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <FAVideoPage faToken={faToken} nominationId={faVideoNomId} navigate={navigate}/>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, paddingBottom:isMobile?72:0 }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      {view === 'home' && <LandingPage navigate={navigate}/>}
      {view === 'nominate' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><NominationForm/></div>}
      {view === 'volunteer' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><VolunteerForm/></div>}
      {view === 'portal' && <div style={{ maxWidth:isMobile?'100%':960, margin:'0 auto' }}><FAPortal/></div>}
      {view === 'admin' && <div style={{ maxWidth:isMobile?'100%':1100, margin:'0 auto' }}><AdminDashboard/></div>}
      {isMobile && <MobileNav view={view} navigate={navigate}/>}
    </div>
  );
}