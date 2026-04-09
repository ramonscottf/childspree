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

// ─── MSAL POPUP INTERCEPT ───────────────────────────────────────────────────
// When MSAL loginPopup() opens a popup, Microsoft redirects back to our origin.
// The popup loads this same app. We must detect we're in the popup and let MSAL
// handle the auth response — then the popup auto-closes and the parent gets the token.
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f',
    authority: 'https://login.microsoftonline.com/3d9cf274-547e-4af5-8dde-01a636e0b607',
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
});

(async () => {
  await msalInstance.initialize();
  try {
    const resp = await msalInstance.handleRedirectPromise();
    // If we're inside the popup, handleRedirectPromise resolves and MSAL closes the popup.
    // If resp is non-null in the main window, it means redirect flow completed (not popup).
  } catch (e) {
    // Popup auth errors are handled by the parent window's loginPopup() promise
  }

  // Only render the app if we're NOT in a popup (popup windows have an opener)
  // MSAL sets window.opener and a special hash — if handleRedirectPromise handled it, the popup closes.
  // But as a safety net: if we detect we're a popup with auth response params, don't render.
  const hash = window.location.hash;
  const isAuthResponse = hash.includes('code=') || hash.includes('id_token=') || hash.includes('error=');
  const isPopup = window.opener && window.opener !== window;

  if (isPopup && isAuthResponse) {
    // We're the popup that Microsoft redirected back to. MSAL should close us.
    // If it didn't (edge case), just show nothing — don't render the full app.
    document.getElementById('root').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666">Signing in...</div>';
    return;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
