// Inject global animations
const animStyle = document.createElement('style');
animStyle.textContent = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
@keyframes slideR { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Hero animations */
[data-hero-title] { animation: fadeUp 0.8s ease 0.1s both; }
[data-hero-sub] { animation: fadeUp 0.7s ease 0.25s both; }
[data-hero-btns] { animation: fadeUp 0.7s ease 0.4s both; }
[data-hero-tag] { animation: fadeUp 0.5s ease 0.15s both; }

/* Scroll reveal */
.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.vis { opacity: 1; transform: translateY(0); }
.reveal.d1 { transition-delay: 0.1s; }
.reveal.d2 { transition-delay: 0.2s; }
.reveal.d3 { transition-delay: 0.3s; }
.reveal.d4 { transition-delay: 0.4s; }

/* Hover effects */
button, a { transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s !important; }
button:hover, a:hover { opacity: 0.92; }
button:active { transform: scale(0.97) !important; }

/* Stat counters */
[data-stat] { animation: countUp 0.5s ease both; }
[data-stat]:nth-child(1) { animation-delay: 0.1s; }
[data-stat]:nth-child(2) { animation-delay: 0.2s; }
[data-stat]:nth-child(3) { animation-delay: 0.3s; }
[data-stat]:nth-child(4) { animation-delay: 0.4s; }

/* Step cards */
[data-step] { transition: transform 0.2s, box-shadow 0.2s; }
[data-step]:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Pink CTA pulse */
@keyframes gentlePulse { 0%, 100% { box-shadow: 0 4px 12px rgba(232,84,140,0.2); } 50% { box-shadow: 0 4px 24px rgba(232,84,140,0.35); } }
[data-cta-pink] { animation: gentlePulse 2.5s ease-in-out infinite; }
`;
document.head.appendChild(animStyle);

// Intersection Observer for scroll reveals
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12 });

// Watch for new .reveal elements (React renders dynamically)
const mo = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.vis)').forEach(el => revealObserver.observe(el));
});
mo.observe(document.body, { childList: true, subtree: true });
// Initial scan
setTimeout(() => document.querySelectorAll('.reveal:not(.vis)').forEach(el => revealObserver.observe(el)), 100);
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import App from './App';

// ─── MSAL REDIRECT HANDLER ─────────────────────────────────────────────────
// Microsoft SSO uses redirect flow: user clicks "Sign in with Microsoft" →
// browser navigates to Microsoft → authenticates → redirects back here with
// auth code in the URL. MSAL's handleRedirectPromise() exchanges the code
// for tokens before React mounts.

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f',
    authority: 'https://login.microsoftonline.com/3d9cf274-547e-4af5-8dde-01a636e0b607',
    redirectUri: window.location.origin + '/',
    navigateToLoginRequestUrl: false,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
});

window.__msalInstance = msalInstance;

(async () => {
  await msalInstance.initialize();

  try {
    const resp = await msalInstance.handleRedirectPromise();
    if (resp && resp.account) {
      // SSO redirect completed — store the user and navigate to portal
      const claims = resp.idTokenClaims || {};
      const user = {
        displayName: claims.name || resp.account?.name || resp.account?.username,
        email: (claims.preferred_username || resp.account?.username || '').toLowerCase(),
      };
      sessionStorage.setItem('cs-ms-user', JSON.stringify(user));
      sessionStorage.setItem('ms_sso_pending', JSON.stringify({ email: user.email, name: user.displayName }));
      sessionStorage.setItem('sso_debug', JSON.stringify({ status: 'success', email: user.email, name: user.displayName, ts: Date.now() }));
      // Clean up any auth fragments from URL and go to portal
      window.history.replaceState(null, '', window.location.pathname + '#/portal');
    } else {
      // handleRedirectPromise returned null — no auth response in URL
      // Check if there are auth params in the URL that MSAL didn't pick up
      const fullUrl = window.location.href;
      const hasAuthParams = fullUrl.includes('code=') || fullUrl.includes('id_token=') || fullUrl.includes('error=');
      if (hasAuthParams) {
        sessionStorage.setItem('sso_debug', JSON.stringify({ status: 'msal_returned_null_but_auth_params_present', url: fullUrl.substring(0, 200), ts: Date.now() }));
      }
    }
  } catch(e) {
    sessionStorage.setItem('sso_debug', JSON.stringify({ status: 'error', message: e.message, stack: (e.stack||'').substring(0, 300), ts: Date.now() }));
    // Auth failed — clean URL and let user try again
    const h = window.location.hash || '';
    if (h.includes('code=') || h.includes('error=') || h.includes('id_token=')) {
      window.history.replaceState(null, '', window.location.pathname + '#/portal');
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
