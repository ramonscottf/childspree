import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

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
    parentName:'Name *', parentPhone:'Phone *', parentEmail:'Email *',
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
    consentLabel:'I give permission for my child to participate in Child Spree 2026, including being recorded on video at school by their family advocate. I agree that the information I provide will be used by volunteers to shop for my child.',
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
    parentName:'Nombre *', parentPhone:'Teléfono *', parentEmail:'Correo electrónico *',
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
    consentLabel:'Doy permiso para que mi hijo/a participe en Child Spree 2026, incluyendo ser grabado/a en video en la escuela por su consejero/a. Acepto que la información que proporcione sea utilizada por los voluntarios para hacer las compras para mi hijo/a.',
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
async function api(path, opts={}) { const r=await fetch(`${API}${path}`,{credentials:'include',headers:{'Content-Type':'application/json',...opts.headers},...opts}); if(!r.ok){const e=await r.json().catch(()=>({error:'Failed'})); throw new Error(e.error||`HTTP ${r.status}`);} return r.json(); }

function StatusBadge({ status, vol }) {
  const nMap = { pending:{bg:'#FEF3C7',t:'#92400E',l:'Pending'}, approved:{bg:'#D1FAE5',t:'#065F46',l:'Approved'}, sent:{bg:'#DBEAFE',t:'#1E40AF',l:'Sent'}, complete:{bg:'#E0E7FF',t:'#3730A3',l:'Complete'}, incomplete:{bg:'#FEE2E2',t:'#DC2626',l:'Incomplete'}, declined:{bg:'#FEE2E2',t:'#991B1B',l:'Declined'} };
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
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch(e) {}
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
    if (!form.parentPhone) { setError(lang==='es'?'Se requiere el teléfono del padre/tutor.':'Parent phone number is required. We need it to send them the sizing form.'); return; }
    if (!form.parentEmail) { setError(lang==='es'?'Se requiere el correo electrónico del padre/tutor.':'Parent email is required. We need it to send them the sizing form.'); return; }
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

// ─── TYPE SELECTOR CARD (interactive) ───
function TypeCard({ active, onClick, icon, label, color, activeBg, desc, extra, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const scale = pressed ? 'scale(0.97)' : hovered && !active ? 'scale(1.02)' : 'scale(1)';
  const shadow = active
    ? `0 4px 20px ${color}25, 0 0 0 1px ${color}40`
    : hovered
      ? '0 4px 16px rgba(0,0,0,0.08)'
      : '0 1px 4px rgba(0,0,0,0.04)';
  const bg = active ? activeBg : hovered ? '#FAFBFC' : '#fff';
  const borderColor = active ? color : hovered ? color + '66' : '#E2E8F0';

  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setPressed(false);}}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}
      style={{
        flex:1, cursor:'pointer', borderRadius:14,
        border:`2px solid ${borderColor}`,
        padding:isMobile?'14px 16px':'20px 22px',
        background:bg,
        boxShadow:shadow,
        transform:scale,
        transition:'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position:'relative', overflow:'hidden',
      }}
    >
      {/* Subtle gradient overlay on active */}
      {active && <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right, ${color}12, transparent 70%)`, pointerEvents:'none' }}/>}

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <span style={{
          fontSize:28, display:'inline-block',
          transform: hovered || active ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:16, color }}>{label}</span>
        {active && (
          <span style={{
            marginLeft:'auto', fontSize:11, fontWeight:700,
            background:color, color:'#fff',
            padding:'3px 10px', borderRadius:10,
            animation:'fadeIn 0.2s ease',
          }}>Selected</span>
        )}
        {!active && hovered && (
          <span style={{
            marginLeft:'auto', fontSize:11, fontWeight:600,
            color, opacity:0.6,
          }}>Click to select</span>
        )}
      </div>
      <p style={{ fontSize:13, color:C.muted, lineHeight:1.5, margin:0 }}>{desc}</p>
      {extra}
    </div>
  );
}

// ─── VOLUNTEER FORM ───
function VolunteerForm() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', organization:'', groupType:'Individual', groupSize:'', shirtSize:'', arrivalTime:'', storeLocation:'', experience:'', hearAbout:'', smsOptIn:false, volunteerType:'shopper', shoppingPreference:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [storeCounts, setStoreCounts] = useState(null);
  const [waitlisted, setWaitlisted] = useState(false);
  const STORE_CAPS = { "Kohl's Layton (881 W Antelope Dr)":200, "Kohl's Centerville (510 N 400 W)":175, "Kohl's Clinton (1526 N 2000 W)":200 };
  const OPS_CAPS = { "Kohl's Layton (881 W Antelope Dr)":8, "Kohl's Centerville (510 N 400 W)":8, "Kohl's Clinton (1526 N 2000 W)":10 };
  const activeCaps = form.volunteerType === 'ops_crew' ? OPS_CAPS : STORE_CAPS;
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
  useEffect(() => { (async()=>{ try { const d=await api('/volunteers/store-counts'); setStoreCounts(d); } catch(e){} })(); }, []);
  const getCountForStore = (loc) => {
    if (!storeCounts) return 0;
    if (form.volunteerType === 'ops_crew') return storeCounts.ops?.[loc] || 0;
    return storeCounts.shoppers?.[loc] || 0;
  };
  const storeIsFull = (loc) => storeCounts && activeCaps[loc] && getCountForStore(loc) >= activeCaps[loc];
  const allStoresFull = storeCounts && Object.keys(activeCaps).every(k => getCountForStore(k) >= activeCaps[k]);
  const submit = async() => {
    setError(null);
    if (!form.firstName||!form.lastName) { setError('Please enter your name.'); return; }
    if (!form.email&&!form.phone) { setError('Please provide email or phone so we can reach you.'); return; }
    if (form.volunteerType === 'shopper' && !form.arrivalTime) { setError('Please select an arrival time.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, volunteerType: form.volunteerType };
      // Ops crew always gets the full event time
      if (form.volunteerType === 'ops_crew') { payload.arrivalTime = '6:00 AM — 9:00 AM (Full Event)'; }
      // Store shopping preference in experience/notes field for now
      if (form.volunteerType === 'shopper' && form.shoppingPreference) {
        payload.experience = (form.experience ? form.experience + ' | ' : '') + 'Shopping pref: ' + form.shoppingPreference;
      }
      const res = await api('/volunteers',{method:'POST',body:JSON.stringify(payload)});
      if (res.waitlisted) { setWaitlisted(true); }
      setSubmitted(true);
    } catch(err){setError(err.message);}
    setSubmitting(false);
  };
  if (submitted) return (
    <div style={{ textAlign:'center', padding:isMobile?'60px 20px':'80px 40px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>{waitlisted?'📋':'🛒'}</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:isMobile?24:28, color:C.navy, marginBottom:8 }}>{waitlisted?'You\'re on the Backup List!':'You\'re Registered!'}</h2>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:420, margin:'0 auto 12px' }}>{waitlisted?'All store locations are currently full, but we\'ve added you to our backup shopper list. We\'ll contact you if a spot opens up — thank you for your willingness to help!':'Thank you for signing up to volunteer at Child Spree 2026. Check your email for a confirmation. We\'ll be in touch as the event approaches!'}</p>
      {!waitlisted && <p style={{ color:C.muted, fontSize:13, marginBottom:28 }}>📅 First Friday of August · Three Kohl's locations · Davis County</p>}
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
            <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#166534' }}>📅 First Friday of August · Three Kohl's · Layton, Centerville, Clinton · 6:30–9:00 AM</div>
          </div>
        </div>
      )}
      {isMobile && <><div style={{ borderRadius:12, overflow:'hidden', marginBottom:16 }}><img src={photo} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}/></div><div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:4 }}>Volunteer to Shop</h2><p style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>Join 400+ volunteers. Be matched to one child. Shop for them like they're family.</p></div><div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:10, padding:'10px 12px', marginBottom:16, fontSize:12, color:'#166534' }}>📅 First Friday of August · Three Kohl's · Layton, Centerville, Clinton · 6:30–9:00 AM</div></>}
      {error && <div style={{ background:'#FEF2F2', border:`1px solid #FECACA`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}

      {/* ── Volunteer Type Selector ── */}
      <div style={{ marginBottom:24 }}>
        <p style={{ ...secHead(isMobile), marginBottom:12 }}>How would you like to help?</p>
        <div style={{ display:'flex', gap:12, flexDirection:isMobile?'column':'row' }}>
          <TypeCard
            active={form.volunteerType==='shopper'}
            onClick={()=>upd('volunteerType','shopper')}
            icon="🛒" label="Shopper" color={C.navy} activeBg="#F0F4FF"
            isMobile={isMobile}
            desc="Get matched with one child and shop for them head to toe. You'll watch their video, know their favorite colors, and pick out a complete outfit. The fun part!"
          />
          <TypeCard
            active={form.volunteerType==='ops_crew'}
            onClick={()=>upd('volunteerType','ops_crew')}
            icon="🎯" label="Operations Crew" color="#7C3AED" activeBg="#F5F3FF"
            isMobile={isMobile}
            desc="Run the show from start to finish — check families in, manage gift cards, scan QR codes, help load vans, set up tables. You'll stay the full event and keep everything running smoothly."
            extra={<p style={{ fontSize:11, color:'#7C3AED', marginTop:6, fontWeight:600, opacity:0.8 }}>Limited spots · Full commitment · High impact</p>}
          />
        </div>
      </div>

      <div style={{ display:isMobile?'block':'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        <div>
          <p style={secHead(isMobile)}>Your Information</p>
          <Row cols={2} gap={10}><Field label="First Name *"><input style={inp()} value={form.firstName} onChange={e=>upd('firstName',e.target.value)} placeholder="First"/></Field><Field label="Last Name *"><input style={inp()} value={form.lastName} onChange={e=>upd('lastName',e.target.value)} placeholder="Last"/></Field></Row>
          <Field label="Email *"><input style={inp()} type="email" value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="you@example.com"/></Field>
          <Field label="Phone (for text updates)"><input style={inp()} type="tel" value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="(801) 555-0000"/></Field>
          <Field label="Organization / School / Company"><input style={inp()} value={form.organization} onChange={e=>upd('organization',e.target.value)} placeholder="Optional"/></Field>
          <Field label="Group type"><select style={{...inp(),appearance:'auto'}} value={form.groupType} onChange={e=>{upd('groupType',e.target.value);if(e.target.value==='Individual')upd('groupSize','');}}>{['Individual','Corporate Group','Church Group','School Group','Family','Other'].map(t=><option key={t} value={t}>{t}</option>)}</select></Field>
          {form.groupType!=='Individual'&&<Field label="Group size *"><select style={{...inp(),appearance:'auto'}} value={form.groupSize} onChange={e=>upd('groupSize',e.target.value)}><option value="">How many people?</option>{['2','3','4','5','6','7','8','9','10','11-15','16-20','20+'].map(n=><option key={n} value={n}>{n}</option>)}</select></Field>}
        </div>
        <div>
          <p style={secHead(isMobile)}>Event Details</p>
          <Field label="T-shirt size"><select style={{...inp(),appearance:'auto'}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}><option value="">Select size...</option>{VOL_SHIRTS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          {form.volunteerType === 'ops_crew' ? (
            <>
              <Field label="Shift *">
                <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#5B21B6' }}>
                  <strong>6:00 AM — 9:00 AM</strong> · Full event commitment
                  <p style={{ fontSize:12, color:'#7C3AED', margin:'6px 0 0', lineHeight:1.4 }}>Arrive at 6:00 AM for setup. You'll stay through the entire event — checking shoppers in, assisting at checkout, scanning QR codes, loading vans, and breaking down. Typically wraps by 9:00 AM.</p>
                </div>
                <input type="hidden" value="6:00 AM — 9:00 AM (Full Event)" />
              </Field>
              <Field label="Any relevant experience?"><textarea style={{...inp(),minHeight:72,resize:'vertical'}} value={form.experience} onChange={e=>upd('experience',e.target.value)} placeholder="Optional — event management, retail, logistics, etc."/></Field>
            </>
          ) : (
            <>
              <Field label="Arrival time slot *">
                <select style={{...inp(),appearance:'auto'}} value={form.arrivalTime} onChange={e=>upd('arrivalTime',e.target.value)}>
                  <option value="">Select a time...</option>
                  <option value="6:30 AM — Early Shopping">6:30 AM — Early Shopping</option>
                  <option value="7:00 AM — Main Shopping">7:00 AM — Main Shopping</option>
                  <option value="7:30 AM — Late Shopping">7:30 AM — Late Shopping</option>
                </select>
              </Field>
              <Field label="Shopping preference">
                <select style={{...inp(),appearance:'auto'}} value={form.shoppingPreference||''} onChange={e=>upd('shoppingPreference',e.target.value)}>
                  <option value="">No preference — happy to shop for anyone</option>
                  <option value="boys">Boys department</option>
                  <option value="girls">Girls department</option>
                </select>
                <p style={{ fontSize:11, color:C.muted, marginTop:4, lineHeight:1.4 }}>We'll do our best to match you based on your preference, but we can't guarantee it. Every child needs a shopper!</p>
              </Field>
            </>
          )}
          <Field label="Preferred Kohl's location *">
            <select style={{...inp(),appearance:'auto'}} value={form.storeLocation} onChange={e=>upd('storeLocation',e.target.value)}>
              <option value="">Select a store...</option>
              {["Kohl's Layton (881 W Antelope Dr)","Kohl's Centerville (510 N 400 W)","Kohl's Clinton (1526 N 2000 W)"].map(s=>{
                const cnt = getCountForStore(s);
                const cap = activeCaps[s];
                const full = cnt >= cap;
                return <option key={s} value={s} disabled={full}>{s}{storeCounts?` — ${cnt}/${cap}${full?' FULL':''}`:''}</option>;
              })}
            </select>
            {form.storeLocation && storeIsFull(form.storeLocation) && <div style={{ fontSize:12, color:'#DC2626', marginTop:4 }}>This store is full. Please select a different location.</div>}
            {allStoresFull && <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 12px', marginTop:6, fontSize:12, color:'#92400E' }}>All stores are at capacity. You can still sign up — we'll add you to our backup list and contact you if a spot opens.</div>}
          </Field>
          <Field label="How did you hear about Child Spree?"><select style={{...inp(),appearance:'auto'}} value={form.hearAbout} onChange={e=>upd('hearAbout',e.target.value)}><option value="">Select...</option>{['School or teacher','DEF newsletter','Social media','Friend or coworker','My employer','Church','Other'].map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', marginTop:8 }}>
            <input type="checkbox" checked={form.smsOptIn} onChange={e=>upd('smsOptIn',e.target.checked)} style={{ marginTop:2, accentColor:C.pink }}/>
            <span style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
              I agree to receive text messages from <strong>Davis Education Foundation</strong> about Child Spree 2026 volunteer shifts, reminders, and event updates. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. See our{' '}
              <a href="https://daviskids.org/privacy" target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{ color:C.pink, textDecoration:'underline', fontWeight:600 }}>Privacy Policy</a>
              {' '}and{' '}
              <a href="https://daviskids.org/terms" target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{ color:C.pink, textDecoration:'underline', fontWeight:600 }}>Terms</a>.
            </span>
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
        video: { facingMode: facing, width:{ideal:1280}, height:{ideal:720} },
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
        <strong>Tips:</strong> Find good light. Hold phone sideways (landscape). Ask the student to say their name, grade, favorite color, and what they love most.
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
    if (!form.favoriteColors.trim()) { alert(lang==='es'?'Por favor ingrese los colores o estilos favoritos de su hijo/a.':'Please fill in your child\'s favorite colors, styles, or characters. This helps the volunteer shop for them!'); return; }
    if (!form.avoidColors.trim()) { alert(lang==='es'?'Por favor ingrese los colores o estilos que se deben evitar.':'Please fill in colors or styles to avoid. If none, type "None".'); return; }
    if (!form.allergies.trim()) { alert(lang==='es'?'Por favor ingrese alergias o necesidades sensoriales. Si no hay, escriba "Ninguna".':'Please fill in allergies or sensory needs. If none, type "None".'); return; }
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
          <p style={secHead(isMobile)}>Preferences</p>
          <Field label="Favorite colors, styles, characters? *"><input style={inp()} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)} placeholder="e.g., Blue, dinosaurs, soccer"/></Field>
          <Field label="Colors or styles to avoid? *"><input style={inp()} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)} placeholder='e.g., No pink, no ruffles — or "None"'/></Field>
          <Field label="Allergies or sensory needs? *"><input style={inp()} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder='e.g., No wool, needs soft fabrics — or "None"'/></Field>
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
const ADMIN_EMAILS = ['sfoster@dsdmail.net','kbuchi@dsdmail.net','ktoone@dsdmail.net'];
function AdminDashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('nominations');
  const [msUser, setMsUser] = useState(getMsSession);
  const [signingIn, setSigningIn] = useState(false);
  const [serverSession, setServerSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Create server-side session from MSAL ID token
  const createServerSession = useCallback(async (account) => {
    try {
      setSessionLoading(true);
      const msal = await getMsal();
      // Silently acquire a fresh ID token
      const tokenResp = await msal.acquireTokenSilent({
        scopes: MSAL_SCOPES,
        account,
      });
      if (tokenResp?.idToken) {
        const res = await fetch(`${API}/auth/session`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: tokenResp.idToken }),
        });
        if (res.ok) {
          const data = await res.json();
          setServerSession(data);
          return data;
        }
      }
    } catch (e) {
      console.error('Server session creation failed:', e);
    } finally {
      setSessionLoading(false);
    }
    return null;
  }, []);

  // Handle MSAL redirect on mount
  useEffect(() => {
    (async () => {
      try {
        const msal = await getMsal();
        const resp = await msal.handleRedirectPromise();
        let account = null;
        if (resp?.account) {
          account = resp.account;
        } else {
          const accounts = msal.getAllAccounts();
          if (accounts[0]) account = accounts[0];
        }
        if (account) {
          const u = { displayName: account.name, email: account.username?.toLowerCase() };
          sessionStorage.setItem('cs-ms-user', JSON.stringify(u));
          setMsUser(u);
          // Create server-side session
          await createServerSession(account);
        } else {
          // Check if we have an existing session cookie
          try {
            const meRes = await fetch(`${API}/auth/session`, { credentials: 'include' });
            if (meRes.ok) {
              const me = await meRes.json();
              if (me.authenticated) setServerSession(me);
            }
          } catch(e) {}
        }
      } catch(e) { console.error('MSAL redirect:', e); }
    })();
  }, [createServerSession]);

  const isAdmin = msUser && ADMIN_EMAILS.includes(msUser.email?.toLowerCase());

  if (!msUser) return (
    <div style={{ maxWidth:360, margin:isMobile?'60px auto 0':'80px auto 0', padding:'0 16px' }}>
      <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:20 }}>Admin Access</h2>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, marginBottom:20 }}>Sign in with your DSD account to access the admin dashboard.</p>
        <button onClick={async()=>{setSigningIn(true);try{await msalSignIn();}catch(e){console.error(e);setSigningIn(false);}}} disabled={signingIn} style={{ width:'100%', padding:14, background:signingIn?C.light:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:signingIn?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {signingIn?'Signing in...':'Sign In (DSD)'}
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ maxWidth:400, margin:isMobile?'60px auto 0':'80px auto 0', padding:'0 16px' }}>
      <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:12 }}>Access Denied</h2>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, marginBottom:8 }}>Signed in as <strong>{msUser.displayName}</strong></p>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, marginBottom:20 }}>{msUser.email} does not have admin access. Contact Scott if you need access.</p>
        <button onClick={async()=>{await msalSignOut();setMsUser(null);}} style={{ width:'100%', padding:12, background:'#F1F5F9', color:C.muted, border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Sign Out</button>
      </div>
    </div>
  );

  // Server session required — cookie-based auth replaces Bearer token
  if (sessionLoading) return (
    <div style={{ maxWidth:360, margin:isMobile?'60px auto 0':'80px auto 0', padding:'0 16px', textAlign:'center' }}>
      <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <p style={{ color:C.muted, fontSize:14 }}>Creating secure session...</p>
      </div>
    </div>
  );

  if (!serverSession) {
    // Try to create session if we have an MSAL account but no server session
    const retrySession = async () => {
      const msal = await getMsal();
      const accounts = msal.getAllAccounts();
      if (accounts[0]) await createServerSession(accounts[0]);
    };
    return (
      <div style={{ maxWidth:400, margin:isMobile?'60px auto 0':'80px auto 0', padding:'0 16px' }}>
        <div style={{ background:C.card, borderRadius:16, padding:32, boxShadow:'0 2px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.navy, marginBottom:12 }}>Session Required</h2>
          <p style={{ color:C.muted, fontSize:13, lineHeight:1.5, marginBottom:20 }}>Signed in as <strong>{msUser.displayName}</strong>, but the server session couldn't be created. Click below to retry.</p>
          <button onClick={retrySession} style={{ width:'100%', padding:14, background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:8 }}>Retry Session</button>
          <button onClick={async()=>{await fetch(`${API}/auth/logout`,{method:'POST',credentials:'include'});await msalSignOut();setMsUser(null);setServerSession(null);}} style={{ width:'100%', padding:12, background:'#F1F5F9', color:C.muted, border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Sign Out</button>
        </div>
      </div>
    );
  }

  const tabs = [{ key:'nominations', icon:'📋', label:'Nominations' }, { key:'allocations', icon:'🏫', label:'Schools' }, { key:'volunteers', icon:'🛒', label:'Volunteers' }, { key:'qrcodes', icon:'📱', label:'QR Codes' }, { key:'shopday', icon:'🏪', label:'Shopping Day' }];
  return (
    <div style={{ maxWidth:isMobile?'100%':1000, margin:'0 auto', padding:isMobile?'16px 12px':'24px 32px' }}>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{ padding:isMobile?'8px 14px':'10px 20px', borderRadius:8, border:`1.5px solid ${activeTab===t.key?C.navy:C.border}`, background:activeTab===t.key?C.navy:'#fff', color:activeTab===t.key?'#fff':C.muted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'nominations' && <NominationsTab isMobile={isMobile}/>}
      {activeTab === 'allocations' && <AllocationsTab isMobile={isMobile}/>}
      {activeTab === 'volunteers' && <VolunteersTab isMobile={isMobile}/>}
      {activeTab === 'qrcodes' && <QRCodesTab isMobile={isMobile}/>}
      {activeTab === 'shopday' && <ShoppingDayTab isMobile={isMobile}/>}
    </div>
  );
}

// ─── SCHOOL ALLOCATIONS TAB (Admin — spots allocated vs used) ───
function AllocationsTab({ isMobile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | over | available | empty

  useEffect(() => {
    (async () => {
      try {
        const d = await api('/admin/allocations');
        setData(d);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const cs = { background:'#fff', borderRadius:12, padding:16, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  if (loading) return <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading allocations…</div>;
  if (!data) return <div style={{ textAlign:'center', padding:40, color:C.red }}>Failed to load</div>;

  const t = data.totals;
  const overAllocated = data.schools.filter(s => s.used > s.allocated);
  const available = data.schools.filter(s => s.remaining > 0 && s.allocated > 0);
  const atCap = data.schools.filter(s => s.remaining === 0 && s.allocated > 0);
  const empty = data.schools.filter(s => s.used === 0 && s.allocated > 0);

  let filtered = data.schools;
  if (filter === 'over') filtered = overAllocated;
  else if (filter === 'available') filtered = available;
  else if (filter === 'full') filtered = atCap;
  else if (filter === 'empty') filtered = empty;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Allocated', value:t.allocated, color:C.navy },
          { label:'Nominations Used', value:t.used, color:C.pink },
          { label:'Spots Remaining', value:t.remaining, color:t.remaining>0?C.green:C.red },
          { label:'Schools', value:t.schoolCount, color:C.blue },
        ].map(s => (
          <div key={s.label} style={{ ...cs, textAlign:'center', padding:14 }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ ...cs, padding:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>Overall Capacity</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.pink }}>{t.used} / {t.allocated} ({t.allocated>0?Math.round(t.used/t.allocated*100):0}%)</span>
        </div>
        <div style={{ height:10, background:'#E2E8F0', borderRadius:5, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:5, width:`${Math.min(100,t.allocated>0?t.used/t.allocated*100:0)}%`,
            background: t.used > t.allocated ? '#DC2626' : t.used/t.allocated > 0.8 ? '#D97706' : '#059669',
            transition:'width 0.4s' }}/>
        </div>
      </div>

      {/* Alerts */}
      {overAllocated.length > 0 && (
        <div style={{ ...cs, background:'#FEF2F2', border:'2px solid #FECACA', padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#991B1B', marginBottom:4 }}>
            ⚠️ {overAllocated.length} school{overAllocated.length>1?'s':''} over allocation
          </div>
          <div style={{ fontSize:12, color:'#991B1B' }}>
            {overAllocated.map(s => `${s.school} (${s.used}/${s.allocated})`).join(' · ')}
          </div>
        </div>
      )}

      {data.orphans.length > 0 && (
        <div style={{ ...cs, background:'#FFF7ED', border:'2px solid #FED7AA', padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:4 }}>
            📌 {data.orphans.length} school{data.orphans.length>1?'s':''} with nominations but no allocation
          </div>
          <div style={{ fontSize:12, color:'#92400E' }}>
            {data.orphans.map(o => `${o.school} (${o.used} nominations)`).join(' · ')}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {[
          { key:'all', label:`All (${data.schools.length})` },
          { key:'available', label:`🟢 Available (${available.length})` },
          { key:'full', label:`🟡 Full (${atCap.length})` },
          { key:'over', label:`🔴 Over (${overAllocated.length})` },
          { key:'empty', label:`⬜ No Noms (${empty.length})` },
        ].map(f => (
          <button key={f.key} onClick={()=>setFilter(f.key)}
            style={{ padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
              border:`1.5px solid ${filter===f.key?C.navy:C.border}`,
              background:filter===f.key?C.navy:'#fff', color:filter===f.key?'#fff':C.muted }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* School table */}
      <div style={cs}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr', gap:8, padding:'8px 0',
          borderBottom:'2px solid #E2E8F0', fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:1 }}>
          <div>School</div>
          <div style={{ textAlign:'center' }}>Allocated</div>
          <div style={{ textAlign:'center' }}>Used</div>
          <div style={{ textAlign:'center' }}>Remaining</div>
          <div>Capacity</div>
        </div>

        {filtered.map(s => {
          const pct = s.allocated > 0 ? Math.round(s.used / s.allocated * 100) : 0;
          const isOver = s.used > s.allocated;
          const isFull = s.remaining === 0 && s.allocated > 0;
          const barColor = isOver ? '#DC2626' : pct > 80 ? '#D97706' : '#059669';

          return (
            <div key={s.school} style={{
              display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr', gap:8, padding:'10px 0',
              borderBottom:'1px solid #F1F5F9', alignItems:'center',
              background: isOver ? '#FEF2F2' : 'transparent',
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{s.school}</div>
              <div style={{ textAlign:'center', fontSize:14, fontWeight:700, color:C.muted }}>{s.allocated}</div>
              <div style={{ textAlign:'center', fontSize:14, fontWeight:800, color: isOver ? '#DC2626' : C.navy }}>{s.used}</div>
              <div style={{ textAlign:'center', fontSize:14, fontWeight:700, color: isOver ? '#DC2626' : s.remaining > 0 ? C.green : C.amber }}>
                {s.remaining}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1, height:6, background:'#E2E8F0', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, width:`${Math.min(100, pct)}%`, background:barColor }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:600, color: isOver ? '#DC2626' : C.muted, minWidth:32 }}>
                  {s.allocated > 0 ? `${pct}%` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QR CODES TAB (Admin) ───
function QRCodesTab({ isMobile }) {
  const [mode, setMode] = useState('volunteers'); // 'volunteers' | 'bags'
  const [volunteers, setVolunteers] = useState([]);
  const [children, setChildren] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [qrDataUrls, setQrDataUrls] = useState({});
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (mode === 'volunteers') {
        const data = await api('/volunteers');
        setVolunteers((data.volunteers || []).filter(v => v.status !== 'rejected'));
      } else {
        const params = schoolFilter ? `?school=${encodeURIComponent(schoolFilter)}` : '';
        const data = await api(`/admin/qr-sheet${params}`);
        setChildren(data.children || []);
        if (!schoolFilter) setSchools(data.schools || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [mode, schoolFilter]);

  useEffect(() => { load(); setQrDataUrls({}); }, [load]);

  const generateQRs = async () => {
    setGenerating(true);
    const urls = {};
    if (mode === 'volunteers') {
      for (const vol of volunteers) {
        if (!vol.token) continue;
        const url = `${window.location.origin}/#/v/${vol.token}`;
        try {
          urls[vol.id] = await QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1B3A4B', light: '#ffffff' } });
        } catch (e) { console.error('QR gen failed for', vol.id, e); }
      }
    } else {
      for (const child of children) {
        const bagUrl = `${window.location.origin}/#/bag/${child.id}`;
        try {
          urls[child.id] = await QRCode.toDataURL(bagUrl, { width: 200, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1B3A4B', light: '#ffffff' } });
        } catch (e) { console.error('QR gen failed for', child.id, e); }
      }
    }
    setQrDataUrls(urls);
    setGenerating(false);
  };

  const handlePrint = () => {
    const items = mode === 'volunteers' ? volunteers.filter(v => qrDataUrls[v.id]) : children.filter(c => qrDataUrls[c.id]);
    if (!items.length) return;
    const win = window.open('', '_blank');
    const title = mode === 'volunteers' ? 'Volunteer QR Codes' : `Bag Labels${schoolFilter ? ' — ' + schoolFilter : ''}`;
    win.document.write(`<!DOCTYPE html><html><head><title>Child Spree — ${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Libre Franklin',sans-serif; }
      .page { page-break-after:always; padding:0.3in; }
      .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; }
      .card { border:2px solid #E2E8F0; border-radius:12px; padding:14px; text-align:center; break-inside:avoid; }
      .card img { width:160px; height:160px; }
      .name { font-size:16px; font-weight:700; color:#1B3A4B; margin-top:8px; }
      .meta { font-size:11px; color:#64748B; margin-top:2px; }
      .sizes { font-size:10px; color:#1B3A4B; margin-top:6px; font-weight:600; }
      .header { text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #E2E8F0; }
      .header h1 { font-size:18px; color:#1B3A4B; }
      .header p { font-size:11px; color:#64748B; margin-top:4px; }
      @media print { .page { padding:0.25in; } .card { border:1.5px solid #ccc; } }
    </style></head><body>`);

    const perPage = 9;
    for (let i = 0; i < items.length; i += perPage) {
      const batch = items.slice(i, i + perPage);
      win.document.write(`<div class="page"><div class="header"><h1>🛒 Child Spree 2026 — ${title}</h1>
        <p>Page ${Math.floor(i / perPage) + 1} of ${Math.ceil(items.length / perPage)} · ${items.length} ${mode}</p></div><div class="grid">`);
      for (const item of batch) {
        const qr = qrDataUrls[item.id];
        if (!qr) continue;
        if (mode === 'volunteers') {
          win.document.write(`<div class="card">
            <img src="${qr}" alt="QR"/>
            <div class="name">${item.firstName} ${item.lastName}</div>
            <div class="meta">${item.volunteerType === 'ops_crew' ? 'Ops Crew' : 'Shopper'} · ${item.storeLocation || 'TBD'}</div>
            <div class="sizes">${item.agreedToTerms ? '✅ Terms' : '⏳ Terms'}</div>
          </div>`);
        } else {
          win.document.write(`<div class="card">
            <img src="${qr}" alt="QR"/>
            <div class="name">${item.child_first}</div>
            <div class="meta">${item.school || ''} · Grade ${item.grade || '?'}</div>
            <div class="sizes">👕 ${item.shirt_size || '?'} · 👖 ${item.pant_size || '?'} · 👟 ${item.shoe_size || '?'}</div>
          </div>`);
        }
      }
      win.document.write('</div></div>');
    }
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const cardStyle = { background:'#fff', borderRadius:12, padding:16, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };
  const itemCount = mode === 'volunteers' ? volunteers.filter(v => v.token).length : children.length;

  if (loading) return <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading…</div>;

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        <button onClick={()=>setMode('volunteers')} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
          border:`1.5px solid ${mode==='volunteers'?C.navy:C.border}`, background:mode==='volunteers'?C.navy:'#fff', color:mode==='volunteers'?'#fff':C.muted }}>
          👤 Volunteer QRs
        </button>
        <button onClick={()=>setMode('bags')} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
          border:`1.5px solid ${mode==='bags'?C.navy:C.border}`, background:mode==='bags'?C.navy:'#fff', color:mode==='bags'?'#fff':C.muted }}>
          📦 Bag Labels
        </button>
      </div>

      {/* Controls */}
      <div style={{ ...cardStyle, display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        {mode === 'bags' && (
          <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, minWidth:200 }}>
            <option value="">All Schools ({children.length})</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button onClick={generateQRs} disabled={generating || !itemCount}
          style={{ padding:'10px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
            background: generating ? C.light : C.navy, color:'#fff', cursor: generating ? 'default' : 'pointer' }}>
          {generating ? '⏳ Generating…' : `📱 Generate ${itemCount} QR Codes`}
        </button>
        {Object.keys(qrDataUrls).length > 0 && (
          <button onClick={handlePrint} style={{ padding:'10px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, background:C.pink, color:'#fff', cursor:'pointer' }}>
            🖨️ Print Sheets
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap:12, marginBottom:16 }}>
        {mode === 'volunteers' ? [
          { label:'Total Volunteers', value:volunteers.length, color:C.navy },
          { label:'With Token', value:volunteers.filter(v=>v.token).length, color:C.blue },
          { label:'Terms Agreed', value:volunteers.filter(v=>v.agreedToTerms).length, color:C.green },
          { label:'QRs Generated', value:Object.keys(qrDataUrls).length, color:C.pink },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, textAlign:'center', padding:14 }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        )) : [
          { label:'Complete Intakes', value:children.length, color:C.green },
          { label:'QRs Generated', value:Object.keys(qrDataUrls).length, color:C.blue },
          { label:'Schools', value:schools.length, color:C.navy },
          { label:'With Video', value:children.filter(c => c.video_uploaded).length, color:C.pink },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, textAlign:'center', padding:14 }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Preview grid */}
      {Object.keys(qrDataUrls).length > 0 && (
        <div ref={printRef}>
          <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:12 }}>
            Preview — {Object.keys(qrDataUrls).length} QR codes ready to print
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:12 }}>
            {mode === 'volunteers' ? volunteers.map(vol => {
              const qr = qrDataUrls[vol.id];
              if (!qr) return null;
              return (
                <div key={vol.id} style={{ ...cardStyle, textAlign:'center', padding:12 }}>
                  <img src={qr} alt="QR" style={{ width:120, height:120 }}/>
                  <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginTop:6 }}>{vol.firstName} {vol.lastName}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{vol.volunteerType === 'ops_crew' ? 'Ops Crew' : 'Shopper'}</div>
                  <div style={{ fontSize:10, marginTop:4 }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600,
                      background: vol.agreedToTerms ? '#D1FAE5' : '#FEF3C7', color: vol.agreedToTerms ? '#065F46' : '#92400E' }}>
                      {vol.agreedToTerms ? '✅ Terms' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              );
            }) : children.map(child => {
              const qr = qrDataUrls[child.id];
              if (!qr) return null;
              return (
                <div key={child.id} style={{ ...cardStyle, textAlign:'center', padding:12 }}>
                  <img src={qr} alt="QR" style={{ width:120, height:120 }}/>
                  <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginTop:6 }}>{child.child_first}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{child.school}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>Grade {child.grade || '?'}</div>
                  <div style={{ fontSize:10, color:C.text, marginTop:4, fontWeight:600 }}>👕{child.shirt_size} 👖{child.pant_size} 👟{child.shoe_size}</div>
                  <button onClick={()=>printBagTag(child, qr)}
                    style={{ marginTop:8, padding:'5px 12px', borderRadius:6, border:`1px solid ${C.border}`, background:'#fff', fontSize:11, fontWeight:600, color:C.navy, cursor:'pointer', width:'100%' }}>
                    🏷️ Print Tag
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!itemCount && (
        <div style={{ textAlign:'center', padding:40, color:C.muted }}>
          {mode === 'volunteers' ? 'No volunteers registered yet.' : `No children with completed intakes${schoolFilter ? ` at ${schoolFilter}` : ''}.`}
        </div>
      )}
    </div>
  );
}

// ─── BAG TAG LABEL PRINTER (Brother QL-800, 62mm continuous) ───
function printBagTag(child, qrDataUrl) {
  // Layout: 62mm wide × ~100mm long airline-style bag tag
  // QR on left, child info on right, sizes prominent
  // Designed for Brother QL-800 62mm continuous DK tape
  const win = window.open('', '_blank', 'width=400,height=600');
  const colors = child.favorite_colors || child.favoriteColors || '';
  const avoid = child.avoid_colors || child.avoidColors || '';
  const allergies = child.allergies || '';

  // Generate QR inline if not provided
  const qrHtml = qrDataUrl
    ? `<img src="${qrDataUrl}" class="qr"/>`
    : `<div class="qr" style="background:#eee;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;">No QR</div>`;

  win.document.write(`<!DOCTYPE html><html><head><title>Bag Tag — ${child.child_first || child.childFirst}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  @page {
    size: 62mm auto;
    margin: 0;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    width: 62mm;
    padding: 3mm;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tag {
    width: 100%;
  }
  .header {
    text-align: center;
    border-bottom: 1.5px solid #000;
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }
  .header-title {
    font-size: 8pt;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .main {
    display: flex;
    gap: 2.5mm;
    align-items: flex-start;
  }
  .qr {
    width: 22mm;
    height: 22mm;
    flex-shrink: 0;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: 14pt;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 1mm;
  }
  .meta {
    font-size: 7pt;
    color: #444;
    margin-bottom: 2mm;
  }
  .sizes {
    display: flex;
    flex-direction: column;
    gap: 1mm;
    margin-top: 1.5mm;
  }
  .size-row {
    display: flex;
    align-items: center;
    gap: 1.5mm;
    font-size: 9pt;
  }
  .size-icon {
    font-size: 8pt;
    width: 5mm;
    text-align: center;
  }
  .size-label {
    font-weight: 400;
    color: #666;
    width: 10mm;
    font-size: 7pt;
  }
  .size-value {
    font-weight: 800;
    font-size: 9pt;
  }
  .section {
    margin-top: 2mm;
    padding-top: 1.5mm;
    border-top: 0.5px solid #ccc;
  }
  .section-label {
    font-size: 6pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 0.5mm;
  }
  .section-value {
    font-size: 8pt;
    font-weight: 600;
    line-height: 1.3;
  }
  .colors-love { color: #000; }
  .colors-avoid { color: #000; }
  .allergy-box {
    border: 1.5px solid #000;
    padding: 1mm 2mm;
    margin-top: 2mm;
    font-size: 8pt;
    font-weight: 700;
  }
  .allergy-label {
    font-size: 6pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .footer {
    margin-top: 2.5mm;
    padding-top: 1.5mm;
    border-top: 1.5px solid #000;
    text-align: center;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .budget {
    font-size: 10pt;
    font-weight: 900;
    text-align: center;
    margin-top: 1.5mm;
  }
  @media print {
    body { padding: 2mm; }
  }
</style></head><body>
<div class="tag">
  <div class="header">
    <div class="header-title">Child Spree 2026</div>
  </div>

  <div class="main">
    ${qrHtml}
    <div class="info">
      <div class="name">${child.child_first || child.childFirst}</div>
      <div class="meta">${child.school || ''} · Gr ${child.grade || '?'}${child.child_age || child.age ? ' · Age '+(child.child_age||child.age) : ''}</div>
      <div class="sizes">
        <div class="size-row"><span class="size-icon">👕</span><span class="size-label">Shirt</span><span class="size-value">${child.shirt_size || child.shirtSize || '?'}</span></div>
        <div class="size-row"><span class="size-icon">👖</span><span class="size-label">Pants</span><span class="size-value">${child.pant_size || child.pantSize || '?'}</span></div>
        <div class="size-row"><span class="size-icon">👟</span><span class="size-label">Shoes</span><span class="size-value">${child.shoe_size || child.shoeSize || '?'}</span></div>
      </div>
    </div>
  </div>

  ${colors ? `<div class="section"><div class="section-label">♥ Loves</div><div class="section-value colors-love">${colors}</div></div>` : ''}
  ${avoid ? `<div class="section"><div class="section-label">✕ Avoid</div><div class="section-value colors-avoid">${avoid}</div></div>` : ''}
  ${allergies ? `<div class="allergy-box"><div class="allergy-label">⚠ Allergy</div>${allergies}</div>` : ''}

  <div class="footer">
    <div class="budget">$150 — HEAD TO TOE</div>
    Scan QR for video + full profile
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

// ─── SHOPPING DAY TAB (Admin — Full Dashboard + Ops) ───
const STORES = [
  { id:'layton', label:"Kohl's Layton", cap:200 },
  { id:'centerville', label:"Kohl's Centerville", cap:175 },
  { id:'clinton', label:"Kohl's Clinton", cap:200 },
];

function ElapsedTime({ since }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
      if (mins < 1) setElapsed('just now');
      else if (mins < 60) setElapsed(`${mins}m`);
      else setElapsed(`${Math.floor(mins/60)}h ${mins%60}m`);
    };
    calc();
    const i = setInterval(calc, 30000);
    return () => clearInterval(i);
  }, [since]);
  return elapsed;
}

// ─── QR SCANNER PANEL (ops crew check-in + checkout) ───
function QRScannerPanel({ onVolunteerScanned, isMobile }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [volData, setVolData] = useState(null);
  const [loadingVol, setLoadingVol] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScanner = async () => {
    setScanResult(null); setScanError(null); setVolData(null);
    setScanning(true);
    try {
      const html5Qr = new Html5Qrcode('qr-reader-container');
      html5QrRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          // Got a scan — stop scanning
          await html5Qr.stop().catch(() => {});
          setScanning(false);
          setScanResult(decodedText);

          // Extract volunteer token from URL
          const match = decodedText.match(/#\/v\/([A-Za-z0-9_-]+)/);
          if (!match) {
            setScanError('Not a volunteer QR code. Expected childspree.org/#/v/{token}');
            return;
          }
          const token = match[1];
          setLoadingVol(true);
          try {
            const res = await fetch(`${API}/v/${token}`);
            if (!res.ok) throw new Error('Volunteer not found');
            const data = await res.json();
            setVolData(data);
          } catch (e) {
            setScanError(e.message);
          } finally {
            setLoadingVol(false);
          }
        },
        () => {} // ignore scan failures (noisy)
      );
    } catch (e) {
      setScanError('Camera error: ' + e.message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
    };
  }, []);

  const cs = { background:'#fff', borderRadius:12, padding:16, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  return (
    <div>
      <div style={{ ...cs, textAlign:'center' }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:12 }}>
          📷 Scan Volunteer QR Code
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
          Point camera at a volunteer's QR code to check them in, assign a child, or check out.
        </div>

        {!scanning && !scanResult && (
          <button onClick={startScanner}
            style={{ padding:'14px 28px', borderRadius:10, border:'none', fontSize:15, fontWeight:700,
              background:'linear-gradient(135deg, #1B3A4B 0%, #2D5A6B 100%)', color:'#fff', cursor:'pointer',
              boxShadow:'0 4px 14px rgba(27,58,75,0.3)' }}>
            📷 Start Camera
          </button>
        )}

        {scanning && (
          <div>
            <div id="qr-reader-container" ref={scannerRef}
              style={{ width:'100%', maxWidth:350, margin:'0 auto', borderRadius:12, overflow:'hidden' }}/>
            <button onClick={stopScanner}
              style={{ marginTop:12, padding:'10px 20px', borderRadius:8, border:`1px solid ${C.border}`,
                background:'#fff', fontSize:13, fontWeight:600, color:C.red, cursor:'pointer' }}>
              ✕ Stop Camera
            </button>
          </div>
        )}

        {scanError && (
          <div style={{ marginTop:16, padding:12, borderRadius:8, background:'#FEF2F2', border:'1px solid #FECACA' }}>
            <div style={{ fontSize:13, color:C.red, fontWeight:600 }}>❌ {scanError}</div>
            <button onClick={() => { setScanError(null); setScanResult(null); setVolData(null); }}
              style={{ marginTop:8, padding:'6px 16px', borderRadius:6, border:'none', background:C.navy, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loadingVol && (
        <div style={{ ...cs, textAlign:'center' }}>
          <div style={{ fontSize:13, color:C.muted }}>⏳ Looking up volunteer…</div>
        </div>
      )}

      {/* Volunteer found — show info + actions */}
      {volData && (
        <div style={{ ...cs, border:'2px solid #059669' }}>
          <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#EFF6FF', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:24, flexShrink:0 }}>
              {volData.volunteerType === 'ops_crew' ? '🔧' : '🛒'}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:C.navy }}>{volData.firstName} {volData.lastName}</div>
              <div style={{ fontSize:12, color:C.muted }}>
                {volData.volunteerType === 'ops_crew' ? 'Ops Crew' : 'Shopper'}
                {volData.storeLocation && ` · ${volData.storeLocation}`}
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
              background: volData.agreedToTerms ? '#D1FAE5' : '#FEF3C7',
              color: volData.agreedToTerms ? '#065F46' : '#92400E' }}>
              {volData.agreedToTerms ? '✅ Terms' : '⚠️ No Terms'}
            </span>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
              background: volData.checkedIn ? '#D1FAE5' : '#DBEAFE',
              color: volData.checkedIn ? '#065F46' : '#1E40AF' }}>
              {volData.checkedIn ? '✅ Checked In' : '🔵 Not Checked In'}
            </span>
            {volData.assignment && (
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                background: volData.assignment.checkedOut ? '#D1FAE5' : '#FEF3C7',
                color: volData.assignment.checkedOut ? '#065F46' : '#92400E' }}>
                {volData.assignment.checkedOut ? '✅ Complete' : `🛒 Shopping for ${volData.assignment.childFirst}`}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!volData.agreedToTerms && (
              <div style={{ fontSize:12, color:C.red, fontWeight:600, padding:8 }}>
                ⚠️ Volunteer has not agreed to terms. Send them to their QR link first.
              </div>
            )}

            {volData.agreedToTerms && (
              <button onClick={() => onVolunteerScanned(volData)}
                style={{ flex:1, padding:'14px 20px', borderRadius:10, border:'none', fontSize:14, fontWeight:700,
                  background:'linear-gradient(135deg, #059669 0%, #10B981 100%)', color:'#fff', cursor:'pointer' }}>
                {volData.assignment && !volData.assignment.checkedOut
                  ? '✅ Checkout + Print Bag Tag'
                  : volData.assignment?.checkedOut
                    ? '🎉 Already Complete'
                    : '➡️ Check In + Assign Child'}
              </button>
            )}

            <button onClick={() => { setVolData(null); setScanResult(null); setScanError(null); }}
              style={{ padding:'14px 20px', borderRadius:10, border:`1px solid ${C.border}`,
                background:'#fff', fontSize:14, fontWeight:600, color:C.navy, cursor:'pointer' }}>
              📷 Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingDayTab({ isMobile }) {
  const [dashboard, setDashboard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState('overview'); // overview | assign | unassigned | active | completed
  const [lastRefresh, setLastRefresh] = useState(null);

  // Assignment form state
  const [volunteers, setVolunteers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedVol, setSelectedVol] = useState('');
  const [selectedKid, setSelectedKid] = useState('');
  const [assignStore, setAssignStore] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [volSearch, setVolSearch] = useState('');
  const [kidSearch, setKidSearch] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const [dashData, assignData] = await Promise.all([
        api('/admin/shopday'),
        api('/assignments?status=all'),
      ]);
      setDashboard(dashData);
      setAssignments(assignData.assignments || []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const loadVolunteers = useCallback(async () => {
    try {
      const data = await api('/volunteers');
      setVolunteers((data.volunteers || []).filter(v => v.status !== 'rejected'));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (showAssign) loadVolunteers(); }, [showAssign, loadVolunteers]);

  const handleAssign = async () => {
    if (!selectedVol || !selectedKid) return;
    setAssigning(true);
    try {
      await api('/assignments', {
        method: 'POST',
        body: JSON.stringify({ nominationId: selectedKid, volunteerId: selectedVol, storeLocation: assignStore || null }),
      });
      setSelectedVol(''); setSelectedKid(''); setAssignStore('');
      setShowAssign(false);
      await loadDashboard();
    } catch (e) { alert(e.message); }
    finally { setAssigning(false); }
  };

  const handleCheckout = async (id) => {
    try {
      await api(`/assignments/${id}`, { method:'PATCH', body: JSON.stringify({ action:'checkout' }) });
      await loadDashboard();
    } catch (e) { alert(e.message); }
  };

  const handleUnassign = async (id) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await api(`/assignments/${id}`, { method:'DELETE' });
      await loadDashboard();
    } catch (e) { alert(e.message); }
  };

  const handlePrintTag = async (assignment) => {
    // QR #3 — bag label encodes delivery confirmation URL, not shop URL
    const nomId = assignment.nomination_id || assignment.nominationId || assignment.id;
    const bagUrl = `${window.location.origin}/#/bag/${nomId}`;
    try {
      const qr = await QRCode.toDataURL(bagUrl, {
        width: 200, margin: 1, errorCorrectionLevel: 'M',
        color: { dark: '#1B3A4B', light: '#ffffff' },
      });
      printBagTag(assignment, qr);
    } catch (e) {
      printBagTag(assignment, null);
    }
  };

  const cs = { background:'#fff', borderRadius:12, padding:16, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  if (loading) return <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading shopping day…</div>;
  if (!dashboard) return <div style={{ textAlign:'center', padding:40, color:C.red }}>Failed to load dashboard</div>;

  const o = dashboard.overview;
  const pct = o.totalKids > 0 ? Math.round((o.completed / o.totalKids) * 100) : 0;

  const filteredVols = volunteers.filter(v => {
    if (!volSearch) return true;
    const s = volSearch.toLowerCase();
    return (v.first_name||'').toLowerCase().includes(s) || (v.last_name||'').toLowerCase().includes(s) || (v.email||'').toLowerCase().includes(s);
  });
  const filteredKids = (dashboard.unassignedKids || []).filter(k => {
    if (!kidSearch) return true;
    const s = kidSearch.toLowerCase();
    return (k.child_first||'').toLowerCase().includes(s) || (k.school||'').toLowerCase().includes(s);
  });

  return (
    <div>
      {/* Auto-refresh indicator */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:11, color:C.muted }}>
          🟢 Live — refreshes every 15s {lastRefresh && `· ${lastRefresh.toLocaleTimeString()}`}
        </div>
        <button onClick={loadDashboard} style={{ padding:'4px 12px', borderRadius:6, border:`1px solid ${C.border}`, background:'#fff', fontSize:11, fontWeight:600, color:C.navy, cursor:'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Big progress bar */}
      <div style={{ ...cs, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <span style={{ fontSize:18, fontWeight:800, color:C.navy }}>Shopping Day Progress</span>
          <span style={{ fontSize:24, fontWeight:800, color: pct === 100 ? C.green : C.pink }}>{pct}%</span>
        </div>
        <div style={{ height:12, background:'#E2E8F0', borderRadius:6, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:6, transition:'width 0.6s ease',
            width:`${pct}%`,
            background: pct === 100 ? 'linear-gradient(90deg, #059669, #10B981)' : 'linear-gradient(90deg, #E8548C, #F9A8C9)',
          }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:C.muted }}>
          <span>{o.completed} completed</span>
          <span>{o.active} shopping</span>
          <span>{o.unassigned} waiting</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)', gap:8, marginBottom:16 }}>
        {[
          { label:'Total Kids', value:o.totalKids, color:C.navy, icon:'👶' },
          { label:'Volunteers', value:o.totalVolunteers, color:C.blue, icon:'👥' },
          { label:'Assigned', value:o.assigned, color:'#7C3AED', icon:'🔗' },
          { label:'Shopping', value:o.active, color:C.amber, icon:'🛒' },
          { label:'Done', value:o.completed, color:C.green, icon:'✅' },
          { label:'Avg Time', value:o.avgShoppingMinutes ? `${o.avgShoppingMinutes}m` : '—', color:C.muted, icon:'⏱️' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:10, textAlign:'center', border:'1px solid #E2E8F0' }}>
            <div style={{ fontSize:14 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, fontWeight:600, color:C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Store breakdown */}
      {dashboard.stores.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {STORES.map(store => {
            const data = dashboard.stores.find(s => s.id === store.id) || { total:0, active:0, completed:0 };
            const storePct = store.cap > 0 ? Math.round((data.total / store.cap) * 100) : 0;
            return (
              <div key={store.id} style={{ ...cs, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{store.label}</div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:8 }}>Capacity: {store.cap}</div>
                <div style={{ display:'flex', gap:12 }}>
                  <div><span style={{ fontSize:18, fontWeight:800, color:C.amber }}>{data.active}</span><div style={{ fontSize:9, color:C.muted }}>shopping</div></div>
                  <div><span style={{ fontSize:18, fontWeight:800, color:C.green }}>{data.completed}</span><div style={{ fontSize:9, color:C.muted }}>done</div></div>
                  <div><span style={{ fontSize:18, fontWeight:800, color:C.navy }}>{data.total}</span><div style={{ fontSize:9, color:C.muted }}>total</div></div>
                </div>
                <div style={{ height:4, background:'#E2E8F0', borderRadius:2, marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(storePct,100)}%`, background:C.blue, borderRadius:2 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-navigation */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {[
          { key:'overview', label:`📋 All (${assignments.length})` },
          { key:'active', label:`🛒 Shopping (${o.active})` },
          { key:'unassigned', label:`⏳ Unassigned (${o.unassigned})` },
          { key:'completed', label:`✅ Done (${o.completed})` },
          { key:'scan', label:'📷 Scan QR' },
        ].map(t => (
          <button key={t.key} onClick={()=>setSubView(t.key)}
            style={{ padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
              border:`1.5px solid ${subView===t.key?C.navy:C.border}`,
              background:subView===t.key?C.navy:'#fff', color:subView===t.key?'#fff':C.muted }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <button onClick={()=>setShowAssign(!showAssign)}
          style={{ padding:'8px 16px', borderRadius:8, border:'none', fontSize:12, fontWeight:700,
            background:showAssign?C.light:C.pink, color:'#fff', cursor:'pointer' }}>
          {showAssign ? '✕ Cancel' : '➕ Assign'}
        </button>
      </div>

      {/* QR Scanner for check-in and checkout */}
      {subView === 'scan' && (
        <QRScannerPanel
          onVolunteerScanned={async (volData) => {
            // Check them in if not already
            if (!volData.checkedIn) {
              try {
                await fetch(`${API}/v/${volData.token}`, {
                  method: 'POST', credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'checkin' }),
                });
              } catch (e) { console.error('Checkin failed:', e); }
            }
            // If they have an active assignment, offer checkout
            if (volData.assignment && !volData.assignment.checkedOut) {
              if (confirm(`${volData.firstName} is shopping for ${volData.assignment.childFirst}. Check out and print bag tag?`)) {
                await handleCheckout(volData.assignment.id);
                await handlePrintTag({
                  child_first: volData.assignment.childFirst,
                  school: volData.assignment.school,
                  grade: volData.assignment.grade,
                  shirt_size: volData.assignment.shirtSize,
                  pant_size: volData.assignment.pantSize,
                  shoe_size: volData.assignment.shoeSize,
                  parent_token: volData.assignment.videoUrl?.replace('/api/video/','') || '',
                  ...volData.assignment,
                });
              }
            } else if (!volData.assignment) {
              // No assignment — switch to manual assign with volunteer pre-selected
              setSelectedVol(volData.id);
              setShowAssign(true);
              setSubView('overview');
            }
            await loadDashboard();
          }}
          isMobile={isMobile}
        />
      )}

      {/* Assign form */}
      {showAssign && (
        <div style={{ ...cs, background:'#FFFBEB', border:'2px solid #FCD34D' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:12 }}>New Assignment</div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:4 }}>VOLUNTEER</div>
              <input placeholder="Search…" value={volSearch} onChange={e=>setVolSearch(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, marginBottom:6 }}/>
              <select value={selectedVol} onChange={e=>setSelectedVol(e.target.value)} size={5}
                style={{ width:'100%', padding:4, borderRadius:6, border:`1px solid ${C.border}`, fontSize:12 }}>
                <option value="">— Select —</option>
                {filteredVols.map(v => <option key={v.id} value={v.id}>{v.first_name} {v.last_name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:4 }}>CHILD ({(dashboard.unassignedKids||[]).length} unassigned)</div>
              <input placeholder="Search…" value={kidSearch} onChange={e=>setKidSearch(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, marginBottom:6 }}/>
              <select value={selectedKid} onChange={e=>setSelectedKid(e.target.value)} size={5}
                style={{ width:'100%', padding:4, borderRadius:6, border:`1px solid ${C.border}`, fontSize:12 }}>
                <option value="">— Select —</option>
                {filteredKids.map(k => <option key={k.id} value={k.id}>{k.child_first} — {k.school} (Gr {k.grade})</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:4 }}>STORE</div>
              <select value={assignStore} onChange={e=>setAssignStore(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, marginBottom:12 }}>
                <option value="">— Select store —</option>
                {STORES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={handleAssign} disabled={assigning || !selectedVol || !selectedKid}
                style={{ width:'100%', padding:'12px 16px', borderRadius:8, border:'none', fontSize:14, fontWeight:700,
                  background:(!selectedVol || !selectedKid) ? C.light : C.green, color:'#fff', cursor:assigning?'default':'pointer' }}>
                {assigning ? '⏳…' : '✅ Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned children list */}
      {subView === 'unassigned' && (
        <div>
          {(dashboard.unassignedKids || []).length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:C.green, fontWeight:700 }}>🎉 All children are assigned!</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:8 }}>
              {(dashboard.unassignedKids || []).map(k => (
                <div key={k.id} style={{ ...cs, padding:12, borderLeft:'4px solid #FCD34D' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.navy }}>{k.child_first}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{k.school} · Grade {k.grade}</div>
                  <div style={{ fontSize:10, color:C.text, marginTop:4 }}>👕{k.shirt_size} 👖{k.pant_size} 👟{k.shoe_size}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active shoppers */}
      {subView === 'active' && (
        <div>
          {(dashboard.activeShoppers || []).length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:C.muted }}>No one shopping right now.</div>
          ) : (
            dashboard.activeShoppers.map(a => (
              <div key={a.id} style={{ ...cs, display:'flex', gap:12, alignItems:'center', borderLeft:'4px solid #D97706' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:700, color:C.navy }}>{a.child_first}</span>
                    <span style={{ fontSize:11, color:C.muted }}>←</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.vol_first} {a.vol_last}</span>
                    {a.store_location && (
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'#E0F2FE', color:'#0369A1', fontWeight:600 }}>
                        {STORES.find(s=>s.id===a.store_location)?.label || a.store_location}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                    {a.school} · 👕{a.shirt_size} 👖{a.pant_size} 👟{a.shoe_size}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.amber, marginTop:4 }}>
                    🛒 Shopping for <ElapsedTime since={a.assigned_at}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0, flexDirection:'column' }}>
                  <button onClick={()=>handlePrintTag(a)}
                    style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontWeight:700,
                      background:'#fff', color:C.navy, cursor:'pointer' }}>
                    🏷️ Tag
                  </button>
                  <button onClick={()=>handleCheckout(a.id)}
                    style={{ padding:'10px 16px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
                      background:C.green, color:'#fff', cursor:'pointer' }}>
                    ✅ Checkout
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All assignments / completed */}
      {(subView === 'overview' || subView === 'completed') && (
        <div>
          {assignments
            .filter(a => subView === 'completed' ? a.checked_out : true)
            .map(a => (
            <div key={a.id} style={{
              ...cs, display:'flex', gap:12, alignItems:'center',
              background: a.checked_out ? '#F0FDF4' : '#fff',
              borderLeft: `4px solid ${a.checked_out ? C.green : C.amber}`,
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>{a.child_first}</span>
                  <span style={{ fontSize:11, color:C.muted }}>←</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.vol_first} {a.vol_last}</span>
                  {a.store_location && (
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'#E0F2FE', color:'#0369A1', fontWeight:600 }}>
                      {STORES.find(s=>s.id===a.store_location)?.label || a.store_location}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                  {a.school} · Gr {a.grade} · 👕{a.shirt_size} 👖{a.pant_size} 👟{a.shoe_size}
                </div>
                {a.checked_out ? (
                  <div style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:2 }}>
                    ✅ Done {a.checkout_at ? new Date(a.checkout_at).toLocaleTimeString() : ''}
                  </div>
                ) : (
                  <div style={{ fontSize:11, color:C.amber, fontWeight:600, marginTop:2 }}>
                    🛒 <ElapsedTime since={a.assigned_at}/>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={()=>handlePrintTag(a)}
                  style={{ padding:'7px 10px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:11,
                    background:'#fff', color:C.navy, cursor:'pointer' }}>
                  🏷️
                </button>
                {!a.checked_out && (
                  <button onClick={()=>handleCheckout(a.id)}
                    style={{ padding:'7px 12px', borderRadius:6, border:'none', fontSize:11, fontWeight:700,
                      background:C.green, color:'#fff', cursor:'pointer' }}>
                    ✅
                  </button>
                )}
                <button onClick={()=>handleUnassign(a.id)}
                  style={{ padding:'7px 8px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:11,
                    background:'#fff', color:C.red, cursor:'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          {assignments.filter(a => subView === 'completed' ? a.checked_out : true).length === 0 && (
            <div style={{ textAlign:'center', padding:32, color:C.muted }}>
              {subView === 'completed' ? 'No completed assignments yet.' : 'No assignments yet. Use ➕ Assign above.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── REMOVE WITH REASON (collapsible, inside expanded nomination) ───
function RemoveWithReason({ nominationId, childName, updateStatus }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [removing, setRemoving] = useState(false);

  const reasons = ['Duplicate entry', 'Moved', 'Parent declined', 'Other'];

  const handleRemove = async () => {
    if (!reason) return;
    setRemoving(true);
    try {
      await updateStatus(nominationId, 'declined', reason);
    } catch (e) { alert(e.message); }
    finally { setRemoving(false); }
  };

  if (!open) {
    return (
      <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
        <button onClick={()=>setOpen(true)}
          style={{ padding:'6px 14px', background:'none', border:`1px solid #FECACA`, borderRadius:8,
            fontSize:12, color:'#991B1B', cursor:'pointer', fontWeight:600 }}>
          🗑️ Remove Nomination
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
      <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#991B1B', marginBottom:10 }}>
          Remove {childName}
        </div>
        <div style={{ fontSize:12, color:'#991B1B', marginBottom:10 }}>
          Select a reason — this helps with tracking. The nomination will be hidden from the active list but can be restored anytime.
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {reasons.map(r => (
            <button key={r} onClick={()=>setReason(r)}
              style={{
                padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                border: reason===r ? '2px solid #991B1B' : '1px solid #FECACA',
                background: reason===r ? '#FEE2E2' : '#fff',
                color: reason===r ? '#991B1B' : '#64748B',
              }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleRemove} disabled={!reason || removing}
            style={{ padding:'10px 20px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
              background: !reason ? '#E2E8F0' : '#DC2626', color:'#fff',
              cursor: !reason || removing ? 'default' : 'pointer' }}>
            {removing ? '⏳ Removing…' : '🗑️ Confirm Remove'}
          </button>
          <button onClick={()=>{setOpen(false);setReason('');}}
            style={{ padding:'10px 16px', borderRadius:8, border:`1px solid ${C.border}`,
              background:'#fff', fontSize:13, fontWeight:600, color:C.muted, cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminNomDetails({ n, isMobile, updateStatus, copyLink, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const pi = n.parentIntake || {};
  const [form, setForm] = useState({
    childFirst: n.childFirst||'', childLast: n.childLast||'', grade: n.grade||'', school: n.school||'',
    parentName: n.parentName||'', parentPhone: n.parentPhone||'', parentEmail: n.parentEmail||'', parentLanguage: n.parentLanguage||'en',
    nominatorName: n.nominatorName||'', nominatorEmail: n.nominatorEmail||'', reason: n.reason||'', additionalNotes: n.additionalNotes||'',
    shirtSize: pi.shirtSize||'', pantSize: pi.pantSize||'', shoeSize: pi.shoeSize||'',
    favoriteColors: pi.favoriteColors||'', avoidColors: pi.avoidColors||'', allergies: pi.allergies||'', preferences: pi.preferences||'',
  });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api(`/nominations/${n.id}`, { method:'PATCH', body:JSON.stringify(form) });
      setSaved(true); setEditing(false);
      if (onSaved) onSaved();
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 16px' }}>
      {/* Pipeline tracker */}
      {n.status!=='declined'&&(
        <div style={{ display:'flex', gap:0, marginBottom:16, background:'#F8FAFC', borderRadius:8, overflow:'hidden', border:`1px solid ${C.border}` }}>
          {[
            { label:'Nominated', done:true, detail:n.createdAt?.split('T')[0]||n.createdAt?.split(' ')[0] },
            { label:'Approved', done:['approved','sent','complete'].includes(n.status) },
            { label:'Sent to parent', done:['sent','complete'].includes(n.status) },
            { label:'Parent submitted sizes', done:!!n.parentIntake },
            { label:'Parent consent', done:!!n.parentIntake?.consent },
            { label:'Video recorded', done:n.parentIntake?.hasVideo },
          ].map((step,i,arr)=>(
            <div key={step.label} style={{ flex:1, padding:'10px 8px', textAlign:'center', background:step.done?'#D1FAE5':'transparent', borderRight:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
              <div style={{ fontSize:14, marginBottom:2 }}>{step.done?'✅':'⬜'}</div>
              <div style={{ fontSize:10, fontWeight:600, color:step.done?'#065F46':C.light, lineHeight:1.3 }}>{step.label}</div>
              {step.detail&&<div style={{ fontSize:9, color:'#065F46', marginTop:2 }}>{step.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Edit toggle */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>Nomination Details</span>
        {!editing ? (
          <button onClick={()=>setEditing(true)} style={{ padding:'5px 14px', background:'#F1F5F9', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', color:C.navy }}>✏️ Edit All Fields</button>
        ) : (
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={save} disabled={saving} style={{ padding:'5px 14px', background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>{saving?'Saving...':'💾 Save'}</button>
            <button onClick={()=>setEditing(false)} style={{ padding:'5px 14px', background:'#F1F5F9', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', color:C.muted }}>Cancel</button>
          </div>
        )}
      </div>
      {saved && <div style={{ background:'#D1FAE5', color:'#065F46', padding:'6px 12px', borderRadius:6, fontSize:12, marginBottom:10, fontWeight:600 }}>✅ Changes saved!</div>}

      {editing ? (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Child</div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>First name</label><input style={{...inp(),marginBottom:0}} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Last name</label><input style={{...inp(),marginBottom:0}} value={form.childLast} onChange={e=>upd('childLast',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Grade</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">—</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>School</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">—</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Parent / Guardian</div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Name</label><input style={{...inp(),marginBottom:0}} value={form.parentName} onChange={e=>upd('parentName',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Phone</label><input style={{...inp(),marginBottom:0}} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Email</label><input style={{...inp(),marginBottom:0}} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Language</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.parentLanguage} onChange={e=>upd('parentLanguage',e.target.value)}><option value="en">English</option><option value="es">Spanish</option><option value="other">Other</option></select></div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Nominator</div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:10, marginBottom:14 }}>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Name</label><input style={{...inp(),marginBottom:0}} value={form.nominatorName} onChange={e=>upd('nominatorName',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Email</label><input style={{...inp(),marginBottom:0}} type="email" value={form.nominatorEmail} onChange={e=>upd('nominatorEmail',e.target.value)}/></div>
          </div>
          {n.parentIntake && <>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Clothing & Preferences</div>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
              <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shirt</label><input style={{...inp(),marginBottom:0}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}/></div>
              <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Pants</label><input style={{...inp(),marginBottom:0}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}/></div>
              <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shoes</label><input style={{...inp(),marginBottom:0}} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)}/></div>
              <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Fav colors</label><input style={{...inp(),marginBottom:0}} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)}/></div>
              <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Avoid colors</label><input style={{...inp(),marginBottom:0}} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)}/></div>
              <div style={{gridColumn:'span 2'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Allergies</label><input style={{...inp(),marginBottom:0}} value={form.allergies} onChange={e=>upd('allergies',e.target.value)}/></div>
              <div style={{gridColumn:'1/-1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Preferences</label><input style={{...inp(),marginBottom:0}} value={form.preferences} onChange={e=>upd('preferences',e.target.value)}/></div>
            </div>
          </>}
          <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Notes</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10 }}>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Reason for nomination</label><textarea style={{...inp(),marginBottom:0,minHeight:48,resize:'vertical'}} value={form.reason} onChange={e=>upd('reason',e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Additional notes</label><textarea style={{...inp(),marginBottom:0,minHeight:48,resize:'vertical'}} value={form.additionalNotes} onChange={e=>upd('additionalNotes',e.target.value)}/></div>
          </div>
        </div>
      ) : (
        <>
          {/* Read-only info grid */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Child</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.navy }}>{n.childFirst} {n.childLast}</div>
              <div style={{ fontSize:12, color:C.text, marginTop:2 }}>{n.school} · {n.grade}</div>
              {n.studentId&&<div style={{ fontSize:12, color:C.muted, marginTop:1 }}>Student ID: {n.studentId}</div>}
              {n.parentIntake?.childAge&&<div style={{ fontSize:12, color:C.muted, marginTop:1 }}>Age: {n.parentIntake.childAge}</div>}
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Parent / Guardian</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.navy }}>{n.parentName}</div>
              {n.parentPhone&&<div style={{ fontSize:12, color:C.text, marginTop:2 }}>📱 {n.parentPhone}</div>}
              {n.parentEmail&&<div style={{ fontSize:12, color:C.text, marginTop:1 }}>✉️ {n.parentEmail}</div>}
              {n.parentLanguage&&n.parentLanguage!=='en'&&<div style={{ fontSize:12, color:C.muted, marginTop:1 }}>🌐 {n.parentLanguage==='es'?'Spanish':'Other'}</div>}
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Nominated by</div>
              <div style={{ fontSize:13, color:C.navy }}>{n.nominatorName} · {n.nominatorRole}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{n.nominatorEmail}</div>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>What to do next</div>
              <div style={{ fontSize:13, color:C.navy, fontWeight:600 }}>
                {n.status==='pending'&&'Review and approve or decline this nomination.'}
                {n.status==='approved'&&'Click "Send to Parent" to email/text the sizing form.'}
                {n.status==='sent'&&!n.parentIntake&&'Waiting for parent to fill out sizes.'}
                {n.status==='sent'&&n.parentIntake&&!n.parentIntake.hasVideo&&<span style={{color:'#92400E'}}>⚠️ Sizes received! Video needed.</span>}
                {n.status==='sent'&&n.parentIntake?.hasVideo&&'Sizes + video done. Mark complete when ready.'}
                {n.status==='complete'&&n.parentIntake?.hasVideo&&'Ready for shopping day! 🎉'}
                {n.status==='complete'&&(!n.parentIntake||!n.parentIntake.hasVideo)&&<span style={{color:'#DC2626'}}>⚠️ Incomplete — video needed.</span>}
                {n.status==='declined'&&'Declined. Click "Undo Decline" to reopen.'}
              </div>
            </div>
          </div>

          {n.reason&&<div style={{ padding:'8px 12px', background:'#FFFBEB', borderRadius:6, fontSize:12, color:'#78350F', lineHeight:1.5, marginBottom:12 }}><strong>Reason:</strong> {n.reason}</div>}

          {n.parentIntake ? (
            <div style={{ background:'#F0FDF4', border:`1px solid #BBF7D0`, borderRadius:8, padding:'12px 16px', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#065F46', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Parent submitted sizes</div>
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr 1fr':'repeat(5,1fr)', gap:8 }}>
                {[{icon:'👕',label:'Shirt',val:n.parentIntake.shirtSize},{icon:'👖',label:'Pants',val:n.parentIntake.pantSize},{icon:'👟',label:'Shoes',val:n.parentIntake.shoeSize},{icon:'❤️',label:'Loves',val:n.parentIntake.favoriteColors},{icon:'✗',label:'Avoid',val:n.parentIntake.avoidColors}].filter(s=>s.val).map(s=>(
                  <div key={s.label} style={{ textAlign:'center', background:'#fff', borderRadius:6, padding:'6px 8px' }}>
                    <div style={{ fontSize:16 }}>{s.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{s.val}</div>
                    <div style={{ fontSize:10, color:C.light }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {(n.parentIntake.allergies||n.parentIntake.preferences)&&(<div style={{ marginTop:8, fontSize:12, color:'#166534', lineHeight:1.5 }}>{n.parentIntake.allergies&&<div><strong>Allergies:</strong> {n.parentIntake.allergies}</div>}{n.parentIntake.preferences&&<div><strong>Preferences:</strong> {n.parentIntake.preferences}</div>}</div>)}
              <div style={{ marginTop:8, fontSize:12, fontWeight:600, color:n.parentIntake.hasVideo?'#065F46':'#DC2626' }}>
                {n.parentIntake.hasVideo ? (
                  <div>
                    <div style={{ marginBottom:6 }}>🎬 Video: Recorded ✓</div>
                    <div style={{ borderRadius:10, overflow:'hidden', background:'#000', maxWidth:360 }}>
                      <video
                        controls playsInline preload="metadata"
                        style={{ width:'100%', display:'block', maxHeight:240 }}
                        src={`/api/video/${n.parentToken}?admin=1`}
                      >Video not supported</video>
                    </div>
                  </div>
                ) : <span>🎬 VIDEO NEEDED — {n.nominatorName} must record at school</span>}
              </div>
            </div>
          ) : n.status!=='pending' && n.status!=='declined' && (
            <div style={{ background:'#FFF7ED', border:`1px solid #FED7AA`, borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <span>⏳ Waiting for parent to submit sizes. {n.parentToken && <button onClick={()=>copyLink(n.parentToken)} style={{ fontSize:11, color:'#92400E', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>Copy intake link</button>}</span>
              <button onClick={async(e)=>{const btn=e.target;btn.disabled=true;btn.textContent='Sending...';try{await api(`/nominations/${n.id}/remind`,{method:'POST'});btn.textContent='✓ Sent!';btn.style.background='#D1FAE5';btn.style.color='#065F46';setTimeout(()=>{btn.textContent='Send Reminder';btn.disabled=false;btn.style.background=C.amber;btn.style.color='#fff';},3000);}catch(err){btn.textContent='Failed';btn.disabled=false;}}} style={{ padding:'6px 14px', background:C.amber, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>📩 Send Reminder</button>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {n.status==='pending'&&<><button onClick={()=>updateStatus(n.id,'approved')} style={{ padding:'8px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>✓ Approve</button><button onClick={()=>updateStatus(n.id,'declined')} style={{ padding:'8px 16px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>✗ Decline</button></>}
        {n.status==='approved'&&<button onClick={()=>updateStatus(n.id,'sent')} style={{ padding:'8px 20px', background:C.blue, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>Send to Parent ✉️</button>}
        {n.status==='declined'&&<>
          <button onClick={()=>updateStatus(n.id,'pending')} style={{ padding:'8px 20px', background:C.amber, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>↩ Restore</button>
          {n.declineReason && <span style={{ fontSize:12, color:C.muted, padding:'8px 0', alignSelf:'center' }}>Reason: {n.declineReason}</span>}
        </>}
        {n.status==='sent'&&n.parentIntake&&n.parentIntake.hasVideo&&<button onClick={()=>updateStatus(n.id,'complete')} style={{ padding:'8px 20px', background:'#7C3AED', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>✓ Mark Complete</button>}
        {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={()=>copyLink(n.parentToken)} style={{ padding:'8px 16px', background:'#F1F5F9', color:C.navy, border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>📋 Copy Parent Link</button>}
      </div>

      {/* Remove with reason — only for non-declined */}
      {n.status !== 'declined' && <RemoveWithReason nominationId={n.id} childName={`${n.childFirst} ${n.childLast}`} updateStatus={updateStatus} />}
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
    try { const p=new URLSearchParams(); if(filter!=='all')p.set('status',filter); if(search)p.set('search',search); const data=await api(`/nominations?${p}`); setNominations(data.nominations); } catch(e){console.error(e);}
    setLoading(false);
  }, [filter, search]);
  useEffect(() => { load(); }, [load]);
  const updateStatus = async(id, status, declineReason) => { await api(`/nominations/${id}`,{method:'PATCH',body:JSON.stringify({status, declineReason})}); load(); };
  const copyLink = (token) => { navigator.clipboard.writeText(`${window.location.origin}/#/intake/${token}`); };
  const counts = { all:0, pending:0, approved:0, sent:0, complete:0, declined:0 };
  nominations.forEach(n => { counts[n.status] = (counts[n.status]||0)+1; if(n.status!=='declined') counts.all++; });
  const trueComplete = nominations.filter(n => n.status==='complete' && n.parentIntake?.hasVideo).length;
  const incomplete = nominations.filter(n => n.status==='complete' && (!n.parentIntake||!n.parentIntake.hasVideo)).length;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)', gap:isMobile?8:12, marginBottom:20 }}>
        {[{label:'Total',v:counts.all,c:C.navy},{label:'Pending',v:counts.pending,c:C.amber},{label:'Approved',v:counts.approved,c:C.green},{label:'Sent',v:counts.sent,c:C.blue},{label:'Complete',v:trueComplete,c:'#7C3AED'},{label:'Incomplete',v:incomplete,c:C.red}].slice(0,isMobile?3:6).map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:isMobile?20:28, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {['all','pending','approved','sent','complete','declined'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:isMobile?'6px 10px':'6px 14px', borderRadius:20, border:'none', fontSize:isMobile?11:12, fontWeight:600, cursor:'pointer', background:filter===k?C.pink:'#F1F5F9', color:filter===k?'#fff':C.muted }}>
              {k==='all'?'Active':k.charAt(0).toUpperCase()+k.slice(1)} ({counts[k]})
            </button>
          ))}
        </div>
        <button onClick={()=>{
          const rows = nominations.map(n => ({
            'Child First': n.childFirst, 'Child Last': n.childLast,
            'School': n.school, 'Student ID': n.studentId||'',
            'Age': n.parentIntake?.childAge||'',
            'Status': n.status==='complete'&&(!n.parentIntake||!n.parentIntake.hasVideo)?'incomplete':n.status,
            'Parent Name': n.parentName, 'Parent Phone': n.parentPhone||'', 'Parent Email': n.parentEmail||'',
            'FA Name': n.nominatorName, 'FA Role': n.nominatorRole, 'FA Email': n.nominatorEmail,
            'Reason': n.reason||'',
            'Shirt Size': n.parentIntake?.shirtSize||'', 'Pant Size': n.parentIntake?.pantSize||'', 'Shoe Size': n.parentIntake?.shoeSize||'',
            'Favorite Colors': n.parentIntake?.favoriteColors||'', 'Colors to Avoid': n.parentIntake?.avoidColors||'',
            'Allergies': n.parentIntake?.allergies||'', 'Preferences': n.parentIntake?.preferences||'',
            'Video Recorded': n.parentIntake?.hasVideo?'Yes':'No',
            'Parent Consent': n.parentIntake?.consent?'Yes':'No',
            'Family Group': n.familyGroup||'',
            'Nominated Date': n.createdAt?.split('T')[0]||n.createdAt?.split(' ')[0]||'',
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const colWidths = Object.keys(rows[0]||{}).map(k => ({ wch: Math.max(k.length, ...rows.map(r => String(r[k]||'').length)) }));
          ws['!cols'] = colWidths;
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Nominations');
          XLSX.writeFile(wb, `ChildSpree_Nominations_${new Date().toISOString().split('T')[0]}.xlsx`);
        }} style={{ padding:'6px 14px', background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>📥 Export Excel</button>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp(), width:isMobile?'100%':200, fontSize:13}}/>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:60, color:C.light }}>Loading...</div>
      : nominations.length===0 ? <div style={{ textAlign:'center', padding:60, color:C.light, fontSize:14 }}>No nominations yet.</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {nominations.filter(n => filter === 'all' ? n.status !== 'declined' : true).map(n=>(
            <div key={n.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${expandedId===n.id?C.navy+'33':C.border}`, overflow:'hidden', transition:'border 0.2s' }}>
              {/* Row header — always visible */}
              <div onClick={()=>setExpandedId(expandedId===n.id?null:n.id)} style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>{n.childFirst} {n.childLast}</span>
                    <StatusBadge status={n.status==='complete'&&(!n.parentIntake||!n.parentIntake.hasVideo)?'incomplete':n.status}/>
                    {n.familyGroup&&<span style={{ fontSize:10, fontWeight:600, background:'#EDE9FE', color:'#6D28D9', padding:'2px 6px', borderRadius:4 }}>👨‍👩‍👧 Family</span>}
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{n.school}{n.studentId?` · ID: ${n.studentId}`:''} · FA: {n.nominatorName} · Parent: {n.parentName}</div>
                  {/* Pipeline pills when collapsed */}
                  {expandedId!==n.id && n.status!=='declined' && n.status!=='pending' && (
                    <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
                      {[
                        { label:'Approved', done: ['approved','sent','complete'].includes(n.status) },
                        { label:'Sent to parent', done: ['sent','complete'].includes(n.status) },
                        { label:'Sizes received', done: !!n.parentIntake },
                        { label:'Parent consent', done: !!n.parentIntake?.consent },
                        { label:'Video', done: n.parentIntake?.hasVideo, urgent: !!n.parentIntake && !n.parentIntake?.hasVideo },
                      ].map(p=>(
                        <span key={p.label} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background:p.done?'#D1FAE5':p.urgent?'#FEE2E2':'#F1F5F9', color:p.done?'#065F46':p.urgent?'#DC2626':'#94A3B8' }}>{p.done?'✓':p.urgent?'⚠️':''} {p.label}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Quick action buttons (no expand needed) */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  {n.status==='pending'&&<><button onClick={()=>updateStatus(n.id,'approved')} style={{ padding:'5px 12px', background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>Approve</button><button onClick={()=>updateStatus(n.id,'declined')} style={{ padding:'5px 10px', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>Decline</button></>}
                  {n.status==='approved'&&<button onClick={()=>updateStatus(n.id,'sent')} style={{ padding:'5px 12px', background:C.blue, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>Send to Parent ✉️</button>}
                  {n.status==='declined'&&<button onClick={()=>updateStatus(n.id,'pending')} style={{ padding:'5px 12px', background:C.amber, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>↩ Restore</button>}
                  {(n.status==='sent'||n.status==='complete')&&n.parentToken&&<button onClick={()=>copyLink(n.parentToken)} style={{ padding:'5px 10px', background:'#F1F5F9', color:C.navy, border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>📋 Copy Link</button>}
                </div>
                <span style={{ fontSize:16, color:C.light, transition:'transform 0.2s', transform:expandedId===n.id?'rotate(180deg)':'rotate(0)' }}>▼</span>
              </div>

              {/* Expanded details */}
              {expandedId===n.id&&(
                <AdminNomDetails n={n} isMobile={isMobile} updateStatus={updateStatus} copyLink={copyLink} onSaved={load}/>
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

  const STORE_CAPS = { "Kohl's Layton (881 W Antelope Dr)":{cap:200,label:'Layton',color:'#3B82F6'}, "Kohl's Centerville (510 N 400 W)":{cap:175,label:'Centerville',color:'#8B5CF6'}, "Kohl's Clinton (1526 N 2000 W)":{cap:200,label:'Clinton',color:'#10B981'} };
  const OPS_STORE_CAPS = { "Kohl's Layton (881 W Antelope Dr)":{cap:8,label:'Layton',color:'#3B82F6'}, "Kohl's Centerville (510 N 400 W)":{cap:8,label:'Centerville',color:'#8B5CF6'}, "Kohl's Clinton (1526 N 2000 W)":{cap:10,label:'Clinton',color:'#10B981'} };

  const load = useCallback(async () => {
    try { const p=new URLSearchParams(); if(filter!=='all')p.set('status',filter); if(search)p.set('search',search); const data=await api(`/volunteers?${p}`); setVolunteers(data.volunteers); } catch(e){console.error(e);}
    setLoading(false);
  }, [filter, search]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async(id, status) => {
    await api(`/volunteers/${id}`,{method:'PATCH',body:JSON.stringify({status})}); load();
  };

  const sendMessage = async() => {
    if (!msg.message.trim()) return;
    setSending(true); setSendResult(null);
    try {
      const res = await api('/volunteers/message', { method:'POST', body:JSON.stringify(msg)});
      setSendResult(res);
    } catch(e) { setSendResult({ error: e.message }); }
    setSending(false);
  };

  const counts = { all:volunteers.length, registered:0, confirmed:0, assigned:0, waitlisted:0, attended:0 };
  volunteers.forEach(v => { counts[v.status] = (counts[v.status]||0)+1; });
  const typeCounts = { shoppers: volunteers.filter(v => v.volunteerType !== 'ops_crew').length, ops: volunteers.filter(v => v.volunteerType === 'ops_crew').length };
  const statColors = { registered:'#7C3AED', confirmed:C.green, assigned:C.blue, waitlisted:'#F59E0B', attended:C.amber };

  // Store counts from volunteer data — split by type
  const shopperCnts = {};
  const opsCnts = {};
  const storeByTime = {};
  volunteers.filter(v=>v.status!=='waitlisted').forEach(v => {
    if (v.storeLocation) {
      if (v.volunteerType === 'ops_crew') { opsCnts[v.storeLocation] = (opsCnts[v.storeLocation]||0)+1; }
      else { shopperCnts[v.storeLocation] = (shopperCnts[v.storeLocation]||0)+1; }
    }
    if (v.arrivalTime) { storeByTime[v.arrivalTime] = (storeByTime[v.arrivalTime]||0)+1; }
  });

  const StoreBar = ({ storeKey, capsMap, cntsMap, icon }) => {
    const info = capsMap[storeKey];
    const cnt = cntsMap[storeKey]||0;
    const pct = Math.min(100, Math.round(cnt/info.cap*100));
    const full = cnt >= info.cap;
    return (
      <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:isMobile?'12px 14px':'16px 20px', flex:1, minWidth:isMobile?'100%':0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <div style={{ fontWeight:700, color:C.navy, fontSize:14 }}>{icon} {info.label}</div>
          <div style={{ fontSize:20, fontWeight:800, color:full?'#DC2626':info.color }}>{cnt}<span style={{ fontSize:13, fontWeight:400, color:C.muted }}>/{info.cap}</span></div>
        </div>
        <div style={{ background:'#F1F5F9', borderRadius:20, height:14, overflow:'hidden', marginBottom:6 }}>
          <div style={{ width:`${pct}%`, height:'100%', borderRadius:20, background:full?'#DC2626':pct>80?'#F59E0B':info.color, transition:'width 0.5s ease' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted }}>
          <span>{pct}% full</span>
          <span>{full?'🔴 FULL':`${info.cap-cnt} spots left`}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── Shopper Capacity Dashboard ── */}
      <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        <span>🛒</span> Shoppers <span style={{ fontSize:11, fontWeight:400, color:C.light }}>({typeCounts.shoppers} total)</span>
      </div>
      <div style={{ display:'flex', gap:isMobile?8:12, marginBottom:16, flexDirection:isMobile?'column':'row' }}>
        {Object.keys(STORE_CAPS).map(k => <StoreBar key={'s-'+k} storeKey={k} capsMap={STORE_CAPS} cntsMap={shopperCnts} icon="📍"/>)}
      </div>

      {/* ── Ops Crew Capacity Dashboard ── */}
      <div style={{ fontSize:12, fontWeight:700, color:'#7C3AED', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
        <span>🎯</span> Operations Crew <span style={{ fontSize:11, fontWeight:400, color:C.light }}>({typeCounts.ops} total)</span>
      </div>
      <div style={{ display:'flex', gap:isMobile?8:12, marginBottom:20, flexDirection:isMobile?'column':'row' }}>
        {Object.keys(OPS_STORE_CAPS).map(k => <StoreBar key={'o-'+k} storeKey={k} capsMap={OPS_STORE_CAPS} cntsMap={opsCnts} icon="🎯"/>)}
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(5,1fr)', gap:isMobile?8:12, marginBottom:20 }}>
        {[{label:'Total',v:counts.all,c:C.navy},{label:'Registered',v:counts.registered,c:'#7C3AED'},{label:'Confirmed',v:counts.confirmed,c:C.green},{label:'Assigned',v:counts.assigned,c:C.blue},{label:'Waitlisted',v:counts.waitlisted,c:'#F59E0B'}].map(s=>(
          <div key={s.label} style={{ background:C.card, borderRadius:10, padding:isMobile?'10px 8px':'14px 12px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:isMobile?20:28, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:isMobile?9:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Arrival Time Breakdown ── */}
      {Object.keys(storeByTime).length > 0 && (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:'14px 20px', marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>By Arrival Time</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {['6:00 AM — Setup','6:30 AM — Early Shopping','7:00 AM — Main Shopping','7:30 AM — Late Shopping'].map(t => {
              const cnt = storeByTime[t]||0;
              if(!cnt) return null;
              return <div key={t} style={{ background:'#F1F5F9', borderRadius:8, padding:'6px 12px', fontSize:12 }}><span style={{ fontWeight:700, color:C.navy }}>{cnt}</span> <span style={{ color:C.muted }}>{t}</span></div>;
            })}
          </div>
        </div>
      )}

      {/* ── Filters + Actions ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {['all','registered','confirmed','assigned','waitlisted'].map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:isMobile?'6px 10px':'6px 14px', borderRadius:20, border:'none', fontSize:isMobile?11:12, fontWeight:600, cursor:'pointer', background:filter===k?C.pink:'#F1F5F9', color:filter===k?'#fff':C.muted }}>
              {k.charAt(0).toUpperCase()+k.slice(1)} {k!=='all'?`(${counts[k]})`:'' }
            </button>
          ))}
        </div>
        <button onClick={()=>setMsgModal(true)} style={{ padding:isMobile?'6px 12px':'8px 16px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>📣 Send Message</button>
        <button onClick={()=>{
          const rows = volunteers.map(v => ({
            'First Name': v.firstName, 'Last Name': v.lastName,
            'Type': v.volunteerType === 'ops_crew' ? 'Operations Crew' : 'Shopper',
            'Email': v.email||'', 'Phone': v.phone||'',
            'Organization': v.organization||'', 'Group Type': v.groupType||'Individual',
            'Group Size': v.groupSize||'',
            'Shirt Size': v.shirtSize||'', 'Arrival Time': v.arrivalTime||'',
            'Store Location': v.storeLocation||'',
            'SMS Opted In': v.smsOptIn?'Yes':'No',
            'Experience': v.experience||'', 'Heard About Us': v.hearAbout||'',
            'Status': v.status, 'Signed Up': v.createdAt?.split('T')[0]||v.createdAt?.split(' ')[0]||'',
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const colWidths = Object.keys(rows[0]||{}).map(k => ({ wch: Math.max(k.length, ...rows.map(r => String(r[k]||'').length)) }));
          ws['!cols'] = colWidths;
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
          XLSX.writeFile(wb, `ChildSpree_Volunteers_${new Date().toISOString().split('T')[0]}.xlsx`);
        }} style={{ padding:isMobile?'6px 12px':'8px 16px', background:C.navy, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>📥 Export Excel</button>
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
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {volunteers.map(v=>(
            <div key={v.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${expandedId===v.id?C.navy+'33':C.border}`, overflow:'hidden', transition:'border 0.2s' }}>
              {/* Header — always visible */}
              <div onClick={()=>setExpandedId(expandedId===v.id?null:v.id)} style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, color:C.navy, fontSize:14 }}>{v.firstName} {v.lastName}</span>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:(statColors[v.status]||C.muted)+'22', color:statColors[v.status]||C.muted }}>{v.status?.charAt(0).toUpperCase()+v.status?.slice(1)}</span>
                    <span style={{ fontSize:10, fontWeight:600, background:v.volunteerType==='ops_crew'?'#F5F3FF':'#EFF6FF', color:v.volunteerType==='ops_crew'?'#7C3AED':'#1D4ED8', padding:'2px 6px', borderRadius:4 }}>{v.volunteerType==='ops_crew'?'🎯 Ops Crew':'🛒 Shopper'}</span>
                    {v.groupType && v.groupType !== 'Individual' && <span style={{ fontSize:10, fontWeight:600, background:'#EDE9FE', color:'#6D28D9', padding:'2px 6px', borderRadius:4 }}>👥 {v.groupType}{v.groupSize?` (${v.groupSize})`:''}</span>}
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                    {v.organization||'Individual'}{v.shirtSize?` · 👕 ${v.shirtSize}`:''}{v.arrivalTime?` · ${v.arrivalTime}`:''}{v.earlyArrival?' · ☀️ Early bird':''}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  <select value={v.status} onChange={e=>updateStatus(v.id,e.target.value)} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:11, cursor:'pointer', background:'#fff' }}>
                    {['registered','confirmed','assigned','waitlisted','attended'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <span style={{ fontSize:16, color:C.light, transition:'transform 0.2s', transform:expandedId===v.id?'rotate(180deg)':'rotate(0)' }}>▼</span>
              </div>

              {/* Expanded details */}
              {expandedId===v.id&&(
                <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                    <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Contact</div>
                      {v.email&&<div style={{ fontSize:13, color:C.text }}>✉️ {v.email}</div>}
                      {v.phone&&<div style={{ fontSize:13, color:C.text, marginTop:2 }}>📱 {v.phone}</div>}
                      <div style={{ fontSize:11, color:C.light, marginTop:4 }}>SMS: {v.smsOptIn?'✅ Opted in':'❌ No'}</div>
                    </div>
                    <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Group / Organization</div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{v.organization||'None'}</div>
                      <div style={{ fontSize:12, color:C.text, marginTop:2 }}>Type: {v.groupType||'Individual'}</div>
                    </div>
                    <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Shopping day</div>
                      <div style={{ fontSize:13, color:C.text }}>👕 Shirt: <strong>{v.shirtSize||'—'}</strong></div>
                      <div style={{ fontSize:13, color:C.text, marginTop:2 }}>🕐 Arrival: <strong>{v.arrivalTime||'—'}</strong></div>
                      {v.storeLocation&&<div style={{ fontSize:13, color:C.text, marginTop:2 }}>📍 Store: <strong>{v.storeLocation}</strong></div>}
                      {v.earlyArrival&&<div style={{ fontSize:12, color:C.green, fontWeight:600, marginTop:4 }}>☀️ Early bird volunteer</div>}
                    </div>
                  </div>
                  {v.experience&&(
                    <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#78350F', marginBottom:12 }}>
                      <strong>Experience / notes:</strong> {v.experience}
                    </div>
                  )}
                  {v.hearAbout&&(
                    <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>📣 Heard about us: {v.hearAbout}</div>
                  )}
                  <div style={{ fontSize:11, color:C.light }}>Signed up: {v.createdAt?.split('T')[0]||v.createdAt?.split(' ')[0]}</div>
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
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm'
      : MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '';
    if (!mt) { setError('Your browser does not support video recording. Please use Chrome or Safari.'); return; }
    const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 2000000 });
    rec.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      // Small delay to ensure all data chunks are flushed (iOS needs this)
      setTimeout(() => {
        if (chunksRef.current.length === 0) { setError('Recording failed — no data captured. Please try again.'); setMode('intro'); return; }
        const blob = new Blob(chunksRef.current, { type: mt });
        if (blob.size < 1000) { setError('Recording too short. Please try again.'); setMode('intro'); return; }
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setMode('preview');
        // Stop stream AFTER setting preview mode
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }, 300);
    };
    setRecorder(rec); rec.start(500); // 500ms timeslice for more frequent data chunks
    setRecording(true); setCountdown(90); setElapsed(0);
    timerRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(timerRef.current); clearInterval(elapsedRef.current); rec.stop(); setRecording(false); return 0; }
      return c - 1;
    }), 1000);
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current); clearInterval(elapsedRef.current);
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setRecording(false);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null); setPreviewUrl(null); setElapsed(0); setCountdown(0);
    startCamera(facingMode);
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
    <div style={{ maxWidth: (mode==='camera'||mode==='preview') ? '100%' : maxW, margin:'0 auto', padding: (mode==='camera'||mode==='preview') ? 0 : (isMobile?'0 0 32px':'20px 24px 40px') }}>
      {/* Header — hidden during camera/preview */}
      {mode !== 'camera' && (
        <div style={{ background:C.navy, padding:'16px 20px', textAlign:'center', marginBottom:0 }}>
          <button onClick={() => navigate('#/portal')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', float:'left', padding:'4px 0' }}>← Back</button>
          <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>🎬 {nom.childFirst}'s Video</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:2 }}>{nom.school}</div>
        </div>
      )}

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
              <li>Hold phone <strong>sideways</strong> — landscape mode</li>
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
        <div style={{ background:'#000', minHeight:'100svh', display:'flex', flexDirection:'column' }}>
          <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <video ref={liveRef} muted playsInline
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}/>
            {/* Top controls */}
            <div style={{ position:'absolute', top:Math.max(12, parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)'))||0 + 8), left:12, right:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {recording ? (
                <div style={{ background:'rgba(220,38,38,0.9)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, background:'#fff', borderRadius:'50%', display:'inline-block' }}/>
                  REC {elapsed}s / {countdown}s left
                </div>
              ) : (
                <button onClick={() => navigate('#/portal')} style={{ background:'rgba(0,0,0,0.5)', border:'none', color:'#fff', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>✕ Cancel</button>
              )}
              <button onClick={flipCamera} style={{ background:'rgba(0,0,0,0.5)', border:'2px solid rgba(255,255,255,0.6)', color:'#fff', borderRadius:'50%', width:44, height:44, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🔄</button>
            </div>
            {/* Progress bar */}
            {recording && (
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(255,255,255,0.2)' }}>
                <div style={{ height:4, background:C.pink, width:`${((90-countdown)/90)*100}%`, transition:'width 1s linear' }}/>
              </div>
            )}
          </div>
          <div style={{ padding:'12px 16px', paddingBottom:'max(12px, env(safe-area-inset-bottom))' }}>
            {!recording ? (
              <button onClick={startRecording} style={{ width:'100%', padding:14, background:C.pink, color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:12, height:12, background:'#fff', borderRadius:'50%', display:'inline-block' }}/> Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} style={{ width:'100%', padding:14, background:'#DC2626', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:12, height:12, background:'#fff', borderRadius:2, display:'inline-block' }}/> Stop & Preview
              </button>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {mode === 'preview' && previewUrl && (
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ borderRadius:16, overflow:'hidden', background:'#000', marginBottom:14, position:'relative' }}>
            <video ref={playbackRef} controls playsInline style={{ width:'100%', maxHeight:isMobile?'60vh':480, objectFit:'contain', display:'block', background:'#000' }}/>
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
// ─── PORTAL VIDEO SECTION (watch, delete, re-record) ───
function PortalVideoSection({ nominationId, childFirst, session, navigate, onDelete, videoKey, isMobile }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const videoUrl = `/api/portal/video/${nominationId}`;
  const headers = { 'X-FA-Token': session.token };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(videoUrl, { method: 'DELETE', headers });
      setConfirmDelete(false);
      setShowPlayer(false);
      if (onDelete) onDelete();
    } catch (e) {
      alert('Failed to delete video: ' + e.message);
    }
    setDeleting(false);
  };

  return (
    <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showPlayer ? 12 : 0 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#065F46' }}>🎬 Video recorded for {childFirst}</div>
          {!showPlayer && <div style={{ fontSize:12, color:'#166534', marginTop:2 }}>Ready for volunteers on shopping day</div>}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setShowPlayer(!showPlayer)} style={{ padding:'5px 12px', background:showPlayer?'#F1F5F9':'#fff', border:'1px solid #BBF7D0', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:showPlayer?C.muted:'#065F46' }}>
            {showPlayer ? '▲ Hide' : '▶ Watch'}
          </button>
          <button onClick={()=>navigate(`#/fa/_/video/${nominationId}`)} style={{ padding:'5px 12px', background:'#fff', border:'1px solid #FDE68A', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:'#92400E' }}>
            🔄 Re-record
          </button>
          <button onClick={()=>setConfirmDelete(true)} style={{ padding:'5px 12px', background:'#fff', border:'1px solid #FECACA', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:'#DC2626' }}>
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Video player */}
      {showPlayer && (
        <div style={{ borderRadius:8, overflow:'hidden', background:'#000', marginBottom:8 }}>
          <video
            controls
            playsInline
            preload="metadata"
            style={{ width:'100%', maxHeight: isMobile ? 240 : 360, display:'block' }}
            src={`${videoUrl}?t=${session.token}`}
            onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<div style="padding:20px;color:#fff;text-align:center;font-size:13px">Video could not be loaded. It may have been recorded on a device and not uploaded to the system.</div>'; }}
          >
            Your browser does not support video playback.
          </video>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 16px', marginTop:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#991B1B', marginBottom:8 }}>Delete this video?</div>
          <div style={{ fontSize:12, color:'#991B1B', marginBottom:12 }}>This will permanently remove {childFirst}'s video. You can re-record a new one afterward.</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleDelete} disabled={deleting} style={{ padding:'6px 16px', background:'#DC2626', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>{deleting ? 'Deleting...' : 'Yes, Delete Video'}</button>
            <button onClick={()=>setConfirmDelete(false)} style={{ padding:'6px 16px', background:'#F1F5F9', color:C.muted, border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PortalNomCard({ n, session, navigate, statusColor, statusLabel, isMobile, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const intake = n.intake || { submitted: false, consent: false, videoRecorded: false };
  const [form, setForm] = useState({
    // Intake fields
    shirtSize: intake.shirtSize||'', pantSize: intake.pantSize||'', shoeSize: intake.shoeSize||'',
    favoriteColors: intake.favoriteColors||'', avoidColors: intake.avoidColors||'',
    allergies: intake.allergies||'', preferences: intake.preferences||'',
    // Nomination fields
    grade: n.grade||'', childFirst: n.childFirst||'', childLast: n.childLast||'',
    parentName: n.parentName||'', parentPhone: n.parentPhone||'', parentEmail: n.parentEmail||'',
    parentLanguage: n.parentLanguage||'en', school: n.school||'',
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
                      <button onClick={()=>{setEditing(false);setForm({shirtSize:intake.shirtSize||'',pantSize:intake.pantSize||'',shoeSize:intake.shoeSize||'',favoriteColors:intake.favoriteColors||'',avoidColors:intake.avoidColors||'',allergies:intake.allergies||'',preferences:intake.preferences||'',grade:n.grade||'',childFirst:n.childFirst||'',childLast:n.childLast||'',parentName:n.parentName||'',parentPhone:n.parentPhone||'',parentEmail:n.parentEmail||'',parentLanguage:n.parentLanguage||'en',school:n.school||''});}} style={{ padding:'4px 12px', background:'#F1F5F9', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', color:C.muted }}>Cancel</button>
                    </div>
                  )}
                </div>
                {saved && <div style={{ background:'#D1FAE5', color:'#065F46', padding:'6px 12px', borderRadius:6, fontSize:12, marginBottom:10, fontWeight:600 }}>✅ Saved!</div>}

                {editing ? (
                  <div>
                    {/* Child & School info */}
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Child & School</div>
                    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>First name</label><input style={{...inp(),marginBottom:0}} value={form.childFirst} onChange={e=>upd('childFirst',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Last name</label><input style={{...inp(),marginBottom:0}} value={form.childLast} onChange={e=>upd('childLast',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Grade</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.grade} onChange={e=>upd('grade',e.target.value)}><option value="">—</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>School</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.school} onChange={e=>upd('school',e.target.value)}><option value="">—</option>{SCHOOLS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                    </div>

                    {/* Parent info */}
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Parent / Guardian</div>
                    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Parent name</label><input style={{...inp(),marginBottom:0}} value={form.parentName} onChange={e=>upd('parentName',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Phone</label><input style={{...inp(),marginBottom:0}} type="tel" value={form.parentPhone} onChange={e=>upd('parentPhone',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Email</label><input style={{...inp(),marginBottom:0}} type="email" value={form.parentEmail} onChange={e=>upd('parentEmail',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Language</label><select style={{...inp(),marginBottom:0,appearance:'auto'}} value={form.parentLanguage} onChange={e=>upd('parentLanguage',e.target.value)}><option value="en">English</option><option value="es">Spanish</option><option value="other">Other</option></select></div>
                    </div>

                    {/* Sizes & preferences */}
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8 }}>Clothing & Preferences</div>
                    <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr', gap:10 }}>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shirt size</label><input style={{...inp(),marginBottom:0}} value={form.shirtSize} onChange={e=>upd('shirtSize',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Pant size</label><input style={{...inp(),marginBottom:0}} value={form.pantSize} onChange={e=>upd('pantSize',e.target.value)}/></div>
                      <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Shoe size</label><input style={{...inp(),marginBottom:0}} value={form.shoeSize} onChange={e=>upd('shoeSize',e.target.value)}/></div>
                      <div style={{gridColumn:isMobile?'1/-1':'span 1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Favorite colors</label><input style={{...inp(),marginBottom:0}} value={form.favoriteColors} onChange={e=>upd('favoriteColors',e.target.value)}/></div>
                      <div style={{gridColumn:isMobile?'1/-1':'span 1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Colors to avoid</label><input style={{...inp(),marginBottom:0}} value={form.avoidColors} onChange={e=>upd('avoidColors',e.target.value)}/></div>
                      <div style={{gridColumn:'1/-1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Allergies / notes</label><input style={{...inp(),marginBottom:0}} value={form.allergies} onChange={e=>upd('allergies',e.target.value)}/></div>
                      <div style={{gridColumn:'1/-1'}}><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:3 }}>Preferences / special requests</label><input style={{...inp(),marginBottom:0}} value={form.preferences} onChange={e=>upd('preferences',e.target.value)}/></div>
                    </div>
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
              {intake.videoRecorded ? (
                <PortalVideoSection nominationId={n.id} childFirst={n.childFirst} session={session} navigate={navigate} onDelete={onUpdate} videoKey={intake.videoKey} isMobile={isMobile}/>
              ) : intake.submitted && (
                <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#92400E' }}>🎬 Video needed</div>
                    <div style={{ fontSize:12, color:'#92400E', marginTop:2 }}>Record a short video with {n.childFirst} at school so the volunteer can put a face to the name.</div>
                  </div>
                  <button onClick={()=>navigate(`#/fa/_/video/${n.id}`)} style={{ padding:'8px 16px', background:C.pink, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>🎬 Record Video</button>
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


// ─── SHOPPER PROFILE (Shopping Day) ───
function ShopperProfile({ token, volunteerView, assignment, volunteer }) {
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(assignment ? {
    childFirst: assignment.childFirst,
    school: assignment.school,
    grade: assignment.grade,
    age: assignment.age,
    gender: assignment.gender,
    department: assignment.department,
    shirtSize: assignment.shirtSize,
    pantSize: assignment.pantSize,
    shoeSize: assignment.shoeSize,
    favoriteColors: assignment.favoriteColors,
    avoidColors: assignment.avoidColors,
    allergies: assignment.allergies,
    preferences: assignment.preferences,
    hasVideo: assignment.hasVideo,
    videoUrl: assignment.videoUrl,
  } : null);
  const [loading, setLoading] = useState(!assignment);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState({
    top: false, bottom: false, shoes: false,
    jacket: false, underwear: false, extras: false,
  });
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptDone, setReceiptDone] = useState(false);
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/shop/${token}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Could not load profile');
        }
        setProfile(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const toggleCheck = key => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));

  const checkLabels = {
    top: '👕 Top / Shirt',
    bottom: '👖 Pants / Bottoms',
    shoes: '👟 Shoes',
    jacket: '🧥 Jacket / Outerwear',
    underwear: '🧦 Underwear & Socks',
    extras: '🎁 Extras / Accessories',
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🛒</div>
        <div style={{ color:C.muted, fontSize:15, fontWeight:600 }}>Loading shopper profile…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center', maxWidth:400, padding:24 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😞</div>
        <h2 style={{ color:C.navy, margin:'0 0 8px', fontFamily:"'Playfair Display',serif" }}>Oops</h2>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  );

  const p = profile;
  const pad = isMobile ? 16 : 24;
  const cardStyle = {
    background:'#fff', borderRadius:16, padding:pad, marginBottom:16,
    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border:'1px solid #E2E8F0',
  };
  const labelStyle = { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, color:C.muted, marginBottom:6 };
  const valueStyle = { fontSize:18, fontWeight:700, color:C.navy };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      {/* Header banner */}
      <div style={{
        background:'linear-gradient(135deg, #1B3A4B 0%, #2D5A6B 100%)',
        padding:isMobile ? '28px 20px 24px' : '36px 32px 28px',
        textAlign:'center',
      }}>
        <div style={{ fontSize:13, color:'rgba(249,168,201,0.9)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>
          Child Spree 2026 — Shopping Day
        </div>
        <h1 style={{
          color:'#fff', margin:0, fontFamily:"'Playfair Display',serif",
          fontSize:isMobile ? '1.8rem' : '2.4rem', fontWeight:700,
        }}>
          Shopping for {p.childFirst}
        </h1>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:8 }}>
          {[p.school, p.grade ? `Grade ${p.grade}` : null, p.age ? `Age ${p.age}` : null].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Budget banner */}
      <div style={{
        background:'linear-gradient(135deg, #E8548C 0%, #D63B73 100%)',
        padding:'14px 20px', textAlign:'center',
      }}>
        <div style={{ color:'#fff', fontSize:16, fontWeight:800, letterSpacing:0.5 }}>
          💳 Budget: $150 per child — head to toe
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:isMobile ? '16px 16px 100px' : '24px 24px 60px' }}>

        {/* Progress bar */}
        <div style={{ ...cardStyle, padding:'16px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>Shopping Progress</span>
            <span style={{ fontSize:13, fontWeight:700, color: completedCount === totalItems ? C.green : C.pink }}>
              {completedCount}/{totalItems}
            </span>
          </div>
          <div style={{ height:8, background:'#E2E8F0', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:4, transition:'width 0.4s ease',
              width:`${(completedCount / totalItems) * 100}%`,
              background: completedCount === totalItems
                ? 'linear-gradient(90deg, #059669, #10B981)'
                : 'linear-gradient(90deg, #E8548C, #F9A8C9)',
            }}/>
          </div>
          {completedCount === totalItems && (
            <div style={{ textAlign:'center', marginTop:12, fontSize:15, fontWeight:700, color:C.green }}>
              ✅ All items found! Head to checkout.
            </div>
          )}
        </div>

        {/* Sizes — the main event */}
        <div style={cardStyle}>
          <div style={labelStyle}>Sizes</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:8 }}>
            {[
              { label:'Shirt', value:p.shirtSize, icon:'👕' },
              { label:'Pants', value:p.pantSize, icon:'👖' },
              { label:'Shoes', value:p.shoeSize, icon:'👟' },
            ].map(s => (
              <div key={s.label} style={{
                background:'#F0F9FF', borderRadius:12, padding:'14px 10px', textAlign:'center',
                border:'2px solid #BAE6FD',
              }}>
                <div style={{ fontSize:24 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginTop:4 }}>{s.label}</div>
                <div style={{ fontSize:15, fontWeight:800, color:C.navy, marginTop:2 }}>{s.value || '—'}</div>
              </div>
            ))}
          </div>
          {p.department && (
            <div style={{ marginTop:12, textAlign:'center' }}>
              <span style={{
                display:'inline-block', padding:'4px 14px', borderRadius:20,
                background: p.department === 'boys' ? '#DBEAFE' : p.department === 'girls' ? '#FCE7F3' : '#F3E8FF',
                color: p.department === 'boys' ? '#1E40AF' : p.department === 'girls' ? '#9D174D' : '#6B21A8',
                fontSize:12, fontWeight:700, textTransform:'capitalize',
              }}>
                {p.gender || p.department} — {p.department} department
              </span>
            </div>
          )}
        </div>

        {/* Colors */}
        {(p.favoriteColors || p.avoidColors) && (
          <div style={cardStyle}>
            <div style={labelStyle}>Colors</div>
            {p.favoriteColors && (
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>💚</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.green }}>LOVES</span>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, lineHeight:1.5 }}>{p.favoriteColors}</div>
              </div>
            )}
            {p.avoidColors && (
              <div style={{ marginTop:p.favoriteColors ? 14 : 8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>🚫</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.red }}>AVOID</span>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, lineHeight:1.5 }}>{p.avoidColors}</div>
              </div>
            )}
          </div>
        )}

        {/* Allergies */}
        {p.allergies && (
          <div style={{ ...cardStyle, border:'2px solid #FCA5A5', background:'#FFF5F5' }}>
            <div style={{ ...labelStyle, color:C.red }}>⚠️ Allergies / Sensitivities</div>
            <div style={{ fontSize:15, fontWeight:600, color:C.text, marginTop:4, lineHeight:1.5 }}>{p.allergies}</div>
          </div>
        )}

        {/* Preferences / Notes */}
        {p.preferences && (
          <div style={cardStyle}>
            <div style={labelStyle}>Special Notes</div>
            <div style={{ fontSize:15, color:C.text, marginTop:4, lineHeight:1.6 }}>{p.preferences}</div>
          </div>
        )}

        {/* Video */}
        {p.hasVideo && (
          <div style={cardStyle}>
            <div style={labelStyle}>🎥 Meet {p.childFirst}</div>
            <div style={{ marginTop:8, borderRadius:12, overflow:'hidden', background:'#000' }}>
              <video
                controls
                playsInline
                preload="metadata"
                style={{ width:'100%', display:'block', maxHeight:400 }}
                src={p.videoUrl}
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div style={{ textAlign:'center', marginTop:8, fontSize:12, color:C.muted }}>
              Recorded by their school family advocate
            </div>
          </div>
        )}

        {/* Shopping checklist */}
        <div style={cardStyle}>
          <div style={labelStyle}>Shopping Checklist</div>
          <div style={{ marginTop:8 }}>
            {Object.entries(checkLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleCheck(key)}
                style={{
                  display:'flex', alignItems:'center', gap:12, width:'100%',
                  padding:'14px 12px', marginBottom:6, borderRadius:10, border:'none',
                  background: checklist[key] ? '#ECFDF5' : '#F8FAFC',
                  cursor:'pointer', transition:'all 0.2s',
                  outline: checklist[key] ? '2px solid #059669' : '1px solid #E2E8F0',
                }}
              >
                <div style={{
                  width:26, height:26, borderRadius:6, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: checklist[key] ? '#059669' : '#fff',
                  border: checklist[key] ? 'none' : '2px solid #CBD5E1',
                  transition:'all 0.2s',
                }}>
                  {checklist[key] && <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>✓</span>}
                </div>
                <span style={{
                  fontSize:15, fontWeight:600,
                  color: checklist[key] ? C.green : C.text,
                  textDecoration: checklist[key] ? 'line-through' : 'none',
                  opacity: checklist[key] ? 0.7 : 1,
                }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Done shopping CTA */}
        {completedCount === totalItems && (
          <div style={{
            textAlign:'center', padding:24, background:'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            borderRadius:16, border:'2px solid #059669',
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#065F46' }}>All Done!</div>
            <div style={{ fontSize:14, color:'#047857', marginTop:4, lineHeight:1.5 }}>
              Head to the checkout station with your items.
              <br/>Show this screen to the ops crew.
            </div>
            {/* Receipt upload */}
            {volunteerView && token && (
              <div style={{ marginTop:16 }}>
                {receiptDone ? (
                  <div style={{ fontSize:13, fontWeight:700, color:'#065F46' }}>📸 Receipt uploaded!</div>
                ) : (
                  <label style={{
                    display:'inline-block', padding:'10px 20px', borderRadius:8,
                    background:'#fff', border:'1px solid #059669', fontSize:13, fontWeight:700,
                    color:'#059669', cursor:'pointer',
                  }}>
                    {receiptUploading ? '⏳ Uploading…' : '📸 Upload Receipt Photo'}
                    <input type="file" accept="image/*" capture="environment" style={{ display:'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setReceiptUploading(true);
                        try {
                          const form = new FormData();
                          form.append('receipt', file);
                          const res = await fetch(`${API}/receipts/${token}`, { method:'POST', body: form });
                          if (res.ok) setReceiptDone(true);
                          else alert('Upload failed');
                        } catch (err) { alert(err.message); }
                        finally { setReceiptUploading(false); }
                      }}/>
                  </label>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


// ─── VOLUNTEER HOME PAGE (QR scan resolves here) ───
function VolunteerHome({ token }) {
  const isMobile = useIsMobile();
  const [vol, setVol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/v/${token}`);
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Not found'); }
        const data = await res.json();
        setVol(data);
        // Generate QR code
        const url = `${window.location.origin}/#/v/${token}`;
        const qr = await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1B3A4B', light: '#ffffff' } });
        setQrUrl(qr);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [token]);

  // Auto-refresh every 10s to pick up assignment pushes
  useEffect(() => {
    if (!vol) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/v/${token}`);
        if (res.ok) setVol(await res.json());
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [vol, token]);

  const pad = isMobile ? 16 : 24;
  const cardStyle = { background:'#fff', borderRadius:16, padding:pad, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };
  const labelStyle = { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, color:C.muted, marginBottom:6 };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48, marginBottom:16 }}>🛒</div><div style={{ color:C.muted, fontSize:15, fontWeight:600 }}>Loading your profile…</div></div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center', maxWidth:400, padding:24 }}><div style={{ fontSize:48, marginBottom:16 }}>😞</div><h2 style={{ color:C.navy, margin:'0 0 8px', fontFamily:"'Playfair Display',serif" }}>Oops</h2><p style={{ color:C.muted, fontSize:14 }}>{error}</p></div>
    </div>
  );

  const v = vol;
  const hasAssignment = !!v.assignment;

  // If they haven't agreed to terms, redirect them
  if (!v.agreedToTerms) {
    return <VolunteerTerms token={token} volunteer={v} onAgreed={() => window.location.reload()} />;
  }

  // If assigned → show the shopping profile (repurposed ShopperProfile view)
  if (hasAssignment && !v.assignment.checkedOut) {
    const a = v.assignment;
    return <ShopperProfile token={token} volunteerView={true} assignment={a} volunteer={v} />;
  }

  // Default: show QR code + event details + status
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ background:'linear-gradient(135deg, #1B3A4B 0%, #2D5A6B 100%)', padding:isMobile?'28px 20px 24px':'36px 32px 28px', textAlign:'center' }}>
        <div style={{ fontSize:13, color:'rgba(249,168,201,0.9)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Child Spree 2026</div>
        <h1 style={{ color:'#fff', margin:0, fontFamily:"'Playfair Display',serif", fontSize:isMobile?'1.6rem':'2rem', fontWeight:700 }}>
          Welcome, {v.firstName}!
        </h1>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:8 }}>
          {v.volunteerType === 'ops_crew' ? 'Ops Crew' : 'Shopper'} · {v.storeLocation ? STORES.find(s=>s.id===v.storeLocation)?.label || v.storeLocation : 'Store TBD'}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:isMobile?'16px 16px 100px':'24px 24px 60px' }}>

        {/* Status badges */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700,
            background: v.agreedToTerms ? '#D1FAE5' : '#FEF3C7', color: v.agreedToTerms ? '#065F46' : '#92400E' }}>
            {v.agreedToTerms ? '✅ Terms Agreed' : '⏳ Terms Pending'}
          </span>
          <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700,
            background: v.checkedIn ? '#D1FAE5' : '#F1F5F9', color: v.checkedIn ? '#065F46' : C.muted }}>
            {v.checkedIn ? '✅ Checked In' : '⬜ Not Checked In'}
          </span>
          {hasAssignment && v.assignment.checkedOut && (
            <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:'#D1FAE5', color:'#065F46' }}>
              ✅ Shopping Complete
            </span>
          )}
        </div>

        {/* QR Code — the main event */}
        <div style={{ ...cardStyle, textAlign:'center' }}>
          <div style={labelStyle}>Your Shopping Day QR Code</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:16, lineHeight:1.5 }}>
            Show this to the ops crew when you arrive at your Kohl's store.
          </div>
          {qrUrl && <img src={qrUrl} alt="Your QR Code" style={{ width:240, height:240, borderRadius:12, border:'3px solid #E2E8F0' }}/>}
          <div style={{ fontSize:12, color:C.light, marginTop:12 }}>
            {v.firstName} {v.lastName}
          </div>
        </div>

        {/* Event Details */}
        <div style={cardStyle}>
          <div style={labelStyle}>Event Details</div>
          <div style={{ display:'grid', gap:12, marginTop:8 }}>
            {[
              { icon:'📅', label:'Date', value:'August 1, 2026' },
              { icon:'🏪', label:'Store', value:v.storeLocation ? (STORES.find(s=>s.id===v.storeLocation)?.label || v.storeLocation) : 'TBD' },
              { icon:'⏰', label:'Arrival', value:v.arrivalTime || '8:00 AM' },
              { icon:'💳', label:'Budget', value:'$150 per child — head to toe' },
            ].map(d => (
              <div key={d.label} style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>{d.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:C.muted }}>{d.label}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{d.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What to expect */}
        <div style={cardStyle}>
          <div style={labelStyle}>What to Expect</div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.7, marginTop:8 }}>
            <strong>1.</strong> Show your QR code at check-in<br/>
            <strong>2.</strong> Get matched with a child<br/>
            <strong>3.</strong> Watch their video to meet them<br/>
            <strong>4.</strong> Shop using the sizes and preferences on your phone<br/>
            <strong>5.</strong> Check out at Kohl's register with the gift card<br/>
            <strong>6.</strong> Bring everything to the foundation checkout station
          </div>
        </div>

        {/* Completed state */}
        {hasAssignment && v.assignment.checkedOut && (
          <div style={{ textAlign:'center', padding:24, background:'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', borderRadius:16, border:'2px solid #059669' }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#065F46' }}>Thank You!</div>
            <div style={{ fontSize:14, color:'#047857', marginTop:8, lineHeight:1.6 }}>
              You made a child's day. The clothes you picked will be delivered to their school. Thank you for being part of Child Spree 2026.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VOLUNTEER TERMS AGREEMENT ───
function VolunteerTerms({ token, volunteer, onAgreed }) {
  const isMobile = useIsMobile();
  const [agreeing, setAgreeing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const v = volunteer || {};

  const handleAgree = async () => {
    setAgreeing(true);
    try {
      const res = await fetch(`${API}/v/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agree' }),
      });
      if (res.ok) { setAgreed(true); setTimeout(() => onAgreed && onAgreed(), 1000); }
      else { const d = await res.json().catch(()=>({})); alert(d.error || 'Failed'); }
    } catch (e) { alert(e.message); }
    finally { setAgreeing(false); }
  };

  const cardStyle = { background:'#fff', borderRadius:16, padding:isMobile?16:24, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ background:'linear-gradient(135deg, #1B3A4B 0%, #2D5A6B 100%)', padding:isMobile?'28px 20px 24px':'36px 32px 28px', textAlign:'center' }}>
        <div style={{ fontSize:13, color:'rgba(249,168,201,0.9)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Child Spree 2026</div>
        <h1 style={{ color:'#fff', margin:0, fontFamily:"'Playfair Display',serif", fontSize:isMobile?'1.5rem':'1.8rem' }}>Volunteer Agreement</h1>
        {v.firstName && <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:8 }}>Welcome, {v.firstName} {v.lastName}</div>}
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:isMobile?'16px 16px 60px':'24px 24px 60px' }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>Volunteer Guidelines</h2>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.8 }}>
            <p style={{ marginBottom:12 }}>Thank you for volunteering with Child Spree! Please review and agree to the following:</p>
            <p style={{ marginBottom:8 }}><strong>Privacy:</strong> You will receive personal information about a child (first name, sizes, preferences). This information is confidential and must not be shared on social media or with anyone outside the event.</p>
            <p style={{ marginBottom:8 }}><strong>Budget:</strong> Each child has a $150 budget. Please shop head-to-toe: shirt, pants, shoes, jacket/outerwear, underwear, and socks. Stay within budget.</p>
            <p style={{ marginBottom:8 }}><strong>Conduct:</strong> You represent the Davis Education Foundation. Please be respectful to store staff, fellow volunteers, and families.</p>
            <p style={{ marginBottom:8 }}><strong>Photos:</strong> You may take a photo of the shopping haul for the checkout station. Do not photograph children's personal information or share identifying details.</p>
            <p style={{ marginBottom:8 }}><strong>Returns:</strong> All items must be new with tags. The foundation handles any necessary returns.</p>
          </div>
        </div>

        {agreed ? (
          <div style={{ textAlign:'center', padding:24, background:'#D1FAE5', borderRadius:16, border:'2px solid #059669' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#065F46' }}>You're all set!</div>
            <div style={{ fontSize:13, color:'#047857', marginTop:4 }}>Redirecting to your volunteer page…</div>
          </div>
        ) : (
          <button onClick={handleAgree} disabled={agreeing}
            style={{
              width:'100%', padding:'18px 24px', borderRadius:12, border:'none',
              fontSize:16, fontWeight:800, color:'#fff', cursor: agreeing ? 'default' : 'pointer',
              background: agreeing ? C.light : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              boxShadow:'0 4px 14px rgba(5,150,105,0.3)',
            }}>
            {agreeing ? '⏳ Saving…' : '✅ I Agree — Show Me My QR Code'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BAG DELIVERY CONFIRMATION (FA scans bag QR) ───
function BagDelivery({ nominationId }) {
  const isMobile = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [faName, setFaName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/delivery/confirm?nomination_id=${nominationId}`);
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Not found'); }
        setData(await res.json());
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [nominationId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const form = new FormData();
      form.append('nomination_id', nominationId);
      form.append('confirmed_by', faName || 'FA');
      form.append('notes', notes);
      if (photoFile) form.append('photo', photoFile);

      const res = await fetch(`${API}/delivery/confirm`, { method: 'POST', body: form });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed'); }
      setConfirmed(true);
      setData(prev => ({ ...prev, delivered: true }));
    } catch (e) { alert(e.message); }
    finally { setConfirming(false); }
  };

  const cardStyle = { background:'#fff', borderRadius:16, padding:isMobile?16:24, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48, marginBottom:16 }}>📦</div><div style={{ color:C.muted, fontSize:15, fontWeight:600 }}>Loading delivery info…</div></div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ textAlign:'center', maxWidth:400, padding:24 }}><div style={{ fontSize:48, marginBottom:16 }}>😞</div><h2 style={{ color:C.navy, margin:'0 0 8px' }}>Not Found</h2><p style={{ color:C.muted, fontSize:14 }}>{error}</p></div>
    </div>
  );

  const d = data;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      <div style={{ background:'linear-gradient(135deg, #1B3A4B 0%, #2D5A6B 100%)', padding:isMobile?'28px 20px 24px':'36px 32px 28px', textAlign:'center' }}>
        <div style={{ fontSize:13, color:'rgba(249,168,201,0.9)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Child Spree 2026</div>
        <h1 style={{ color:'#fff', margin:0, fontFamily:"'Playfair Display',serif", fontSize:isMobile?'1.5rem':'1.8rem' }}>Delivery Confirmation</h1>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:isMobile?'16px 16px 60px':'24px 24px 60px' }}>
        <div style={cardStyle}>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>📦</div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:C.navy }}>{d.childFirst}</div>
              <div style={{ fontSize:13, color:C.muted }}>{d.school} · Grade {d.grade}</div>
            </div>
          </div>

          {d.delivered || confirmed ? (
            <div style={{ textAlign:'center', padding:20, background:'#D1FAE5', borderRadius:12, border:'2px solid #059669' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#065F46' }}>Delivery Confirmed</div>
              {d.confirmedAt && <div style={{ fontSize:12, color:'#047857', marginTop:4 }}>Confirmed {new Date(d.confirmedAt).toLocaleString()}</div>}
              {d.confirmedBy && <div style={{ fontSize:12, color:'#047857' }}>by {d.confirmedBy}</div>}
            </div>
          ) : (
            <div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:16 }}>
                Confirm you've received this bag at your school. Optionally take a photo as proof of delivery.
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>YOUR NAME</label>
                <input value={faName} onChange={e=>setFaName(e.target.value)} placeholder="Family Advocate name"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:14 }}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>NOTES (optional)</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any issues or notes…" rows={2}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, fontSize:14, resize:'vertical' }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>PHOTO (optional)</label>
                <input type="file" accept="image/*" capture="environment" onChange={e=>setPhotoFile(e.target.files?.[0]||null)}
                  style={{ fontSize:13 }}/>
              </div>
              <button onClick={handleConfirm} disabled={confirming}
                style={{
                  width:'100%', padding:'16px 24px', borderRadius:12, border:'none',
                  fontSize:16, fontWeight:800, color:'#fff', cursor: confirming ? 'default' : 'pointer',
                  background: confirming ? C.light : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                }}>
                {confirming ? '⏳ Confirming…' : '✅ Confirm Delivery'}
              </button>
            </div>
          )}
        </div>
      </div>
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

  let view = 'home', token = null, faToken = null, faVideoNomId = null, shopToken = null, volToken = null, bagNomId = null;
  if (route.startsWith('#/nominate')) view = 'nominate';
  else if (route.startsWith('#/volunteer')) view = 'volunteer';
  else if (route.startsWith('#/admin')) view = 'admin';
  else if (route.startsWith('#/intake/')) { view = 'parent'; token = route.replace('#/intake/',''); }
  else if (route.match(/#\/fa\/([^/]+)\/video\/([^/]+)/)) {
    const m = route.match(/#\/fa\/([^/]+)\/video\/([^/]+)/);
    view = 'fa-video'; faToken = m[1]; faVideoNomId = m[2];
  }
  else if (route.startsWith('#/fa/')) { view = 'fa'; faToken = route.replace('#/fa/',''); }
  else if (route.startsWith('#/v/')) { view = 'vol-home'; volToken = route.replace('#/v/','').replace(/\/.*$/,''); }
  else if (route.startsWith('#/bag/')) { view = 'bag'; bagNomId = route.replace('#/bag/',''); }
  else if (route.startsWith('#/shop/')) { view = 'shop'; shopToken = route.replace('#/shop/',''); }
  else if (route.startsWith('#/portal')) view = 'portal';
  else if (route === '#/' || route === '#' || route === '') view = 'home';

  if (view === 'parent' && token) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#F8FAFC 0%,#EFF6FF 100%)' }}>
      {isMobile ? <MobileHeader onHome={()=>navigate('#/')}/> : <TopNav view={view} navigate={navigate}/>}
      <ParentIntake token={token}/>
      {isMobile && <div style={{ height:72 }}/>}
    </div>
  );

  if (view === 'vol-home' && volToken) return (
    <VolunteerHome token={volToken}/>
  );

  if (view === 'bag' && bagNomId) return (
    <BagDelivery nominationId={bagNomId}/>
  );

  if (view === 'shop' && shopToken) return (
    <ShopperProfile token={shopToken}/>
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