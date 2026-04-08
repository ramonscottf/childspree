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
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
