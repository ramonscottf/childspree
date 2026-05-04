// HelpTab.jsx — floating chat widget that talks to helpline.fosterlabs.org
// Drop this anywhere in the app tree — it pins itself to the bottom-right.

import { useState, useEffect, useRef, useCallback } from 'react';

const HELPLINE_URL = 'https://helpline.fosterlabs.org';
const SOURCE_APP = 'childspree';
const STORAGE_KEY = 'cs-helpline-thread';
const POLL_MS = 5000;

function getStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function setStored(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export default function HelpTab() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(getStored());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState(thread?.name || '');
  const [contact, setContact] = useState(thread?.contact || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(0);
  const transcriptRef = useRef(null);
  const lastSeenRef = useRef(0);

  // Poll for new messages
  const poll = useCallback(async () => {
    if (!thread?.id) return;
    try {
      const since = lastSeenRef.current;
      const r = await fetch(`${HELPLINE_URL}/thread/${thread.id}/messages?since=${since}`);
      if (!r.ok) return;
      const data = await r.json();
      const fresh = data.messages || [];
      if (fresh.length) {
        lastSeenRef.current = fresh[fresh.length - 1].created_at;
        setMessages(prev => {
          const seen = new Set(prev.map(m => m.id));
          const merged = [...prev, ...fresh.filter(m => !seen.has(m.id))];
          return merged.sort((a, b) => a.created_at - b.created_at);
        });
        // Bump unread if widget is closed AND it's an outbound (reply)
        if (!open) {
          const newOutbound = fresh.filter(m => m.direction === 'outbound').length;
          if (newOutbound) setUnread(u => u + newOutbound);
        }
      }
    } catch (e) { /* network blip, retry next tick */ }
  }, [thread, open]);

  useEffect(() => {
    if (!thread?.id) return;
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [thread, poll]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (transcriptRef.current && open) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await fetch(`${HELPLINE_URL}/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_app: SOURCE_APP,
          body,
          name: name || undefined,
          user_id: thread?.user_id || undefined,
          contact: contact || undefined,
        }),
      });
      if (!r.ok) throw new Error('failed');
      const data = await r.json();
      // Optimistic local message
      const localMsg = {
        id: 'local-' + Date.now(),
        direction: 'inbound',
        body,
        source: 'in_app',
        created_at: Date.now(),
      };
      setMessages(prev => [...prev, localMsg]);
      setInput('');
      // Persist thread id so polling continues across reloads
      if (data.thread_id) {
        const t = { id: data.thread_id, name, contact };
        setThread(t);
        setStored(t);
      }
    } catch (e) {
      setError("Couldn't send. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ---------- styles ----------
  const fab = {
    position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
    width: 56, height: 56, borderRadius: '50%',
    background: '#00d4aa', color: '#08080d',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,212,170,0.35)',
    fontSize: 24, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const badge = {
    position: 'absolute', top: -4, right: -4,
    background: '#ff4466', color: '#fff',
    minWidth: 20, height: 20, borderRadius: 10,
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 6px',
    border: '2px solid #fff',
  };
  const panel = {
    position: 'fixed', bottom: 90, right: 20, zIndex: 9999,
    width: 340, maxWidth: 'calc(100vw - 32px)',
    height: 480, maxHeight: 'calc(100vh - 120px)',
    background: '#0f0f18', color: '#e4e4f0',
    borderRadius: 16, border: '1px solid #252538',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  };
  const head = {
    padding: '14px 16px', borderBottom: '1px solid #252538',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const transcript = {
    flex: 1, overflowY: 'auto', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  };
  const inputRow = {
    padding: 12, borderTop: '1px solid #252538',
    display: 'flex', gap: 8, alignItems: 'flex-end',
  };
  const inputStyle = {
    flex: 1, background: '#161622', border: '1px solid #252538',
    borderRadius: 10, color: '#e4e4f0', padding: '10px 12px',
    fontSize: 14, fontFamily: 'inherit', resize: 'none',
    minHeight: 40, maxHeight: 120, lineHeight: 1.4,
  };
  const sendBtn = {
    background: '#00d4aa', color: '#08080d', border: 'none',
    borderRadius: 10, padding: '10px 14px', fontWeight: 600,
    cursor: sending ? 'wait' : 'pointer', fontSize: 14,
    fontFamily: 'inherit',
    opacity: (input.trim() && !sending) ? 1 : 0.5,
  };
  const msgIn = {
    alignSelf: 'flex-start', background: '#161622',
    padding: '8px 12px', borderRadius: '10px 10px 10px 2px',
    maxWidth: '85%', fontSize: 14, lineHeight: 1.4,
    border: '1px solid #252538',
  };
  const msgOut = {
    alignSelf: 'flex-end', background: '#1d3a52',
    padding: '8px 12px', borderRadius: '10px 10px 2px 10px',
    maxWidth: '85%', fontSize: 14, lineHeight: 1.4,
    color: '#e4e4f0',
  };
  const intakeStyle = {
    padding: 14, borderBottom: '1px solid #252538',
    display: 'flex', flexDirection: 'column', gap: 8,
  };
  const intakeInput = {
    background: '#161622', border: '1px solid #252538',
    borderRadius: 8, color: '#e4e4f0', padding: '8px 10px',
    fontSize: 13, fontFamily: 'inherit',
  };

  if (!open) {
    return (
      <button style={fab} onClick={() => setOpen(true)} aria-label="Open help chat">
        💬
        {unread > 0 && <span style={badge}>{unread}</span>}
      </button>
    );
  }

  const hasMessages = messages.length > 0;
  const showIntake = !thread?.id && !hasMessages;

  return (
    <div style={panel}>
      <div style={head}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Help</div>
          <div style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>
            We usually reply within a few hours
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#7878a0', cursor: 'pointer', fontSize: 22, padding: 4 }}
          aria-label="Close"
        >×</button>
      </div>

      {showIntake && (
        <div style={intakeStyle}>
          <div style={{ fontSize: 13, color: '#7878a0' }}>
            Optional — helps us follow up if you close this tab.
          </div>
          <input
            style={intakeInput}
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            style={intakeInput}
            placeholder="Email or phone (optional)"
            value={contact}
            onChange={e => setContact(e.target.value)}
          />
        </div>
      )}

      <div style={transcript} ref={transcriptRef}>
        {!hasMessages && (
          <div style={{ color: '#7878a0', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            Send us a message — we'll reply here.
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={m.direction === 'inbound' ? msgIn : msgOut}>
            {m.body}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '6px 16px', fontSize: 12, color: '#ff4466' }}>
          {error}
        </div>
      )}

      <div style={inputRow}>
        <textarea
          style={inputStyle}
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button style={sendBtn} onClick={send} disabled={!input.trim() || sending}>
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
