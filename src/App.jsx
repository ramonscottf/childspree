import { useState, useEffect, useCallback } from 'react';

// ─── Config ───
const API = '/api';

// ─── Data ───
const SCHOOLS = [
  "Adams Elementary", "Antelope Elementary", "Bountiful Elementary", "Burton Elementary",
  "Clinton Elementary", "Columbia Elementary", "Cook Elementary", "Doxey Elementary",
  "Eagle Bay Elementary", "East Layton Elementary", "Ellison Park Elementary",
  "Endeavour Elementary", "Farmington Elementary", "Foxboro Elementary",
  "Heritage Elementary", "Holt Elementary", "Kay's Creek Elementary",
  "Knowlton Elementary", "Lake View Elementary", "Lincoln Elementary",
  "Meadowbrook Elementary", "Morgan Elementary", "Mountain View Elementary",
  "Muir Elementary", "Oak Hills Elementary", "Orchard Elementary",
  "Parkside Elementary", "Reading Elementary", "Rosecrest Elementary",
  "Sand Springs Elementary", "Snow Horse Elementary", "South Clearfield Elementary",
  "Stewart Elementary", "Sunset Elementary", "Syracuse Elementary",
  "Taylor Elementary", "Tolman Elementary", "Vae View Elementary",
  "Valley View Elementary", "Wasatch Elementary", "Washington Elementary",
  "West Bountiful Elementary", "West Clinton Elementary", "West Point Elementary",
  "Whitesides Elementary", "Woods Cross Elementary",
  "Centerville Junior High", "Central Davis Junior High", "Fairfield Junior High",
  "Legacy Junior High", "Lakeridge Junior High", "Mueller Park Junior High",
  "North Davis Junior High", "North Layton Junior High", "South Davis Junior High",
  "Sunset Junior High", "Syracuse Junior High", "West Point Junior High",
  "Bountiful High", "Clearfield High", "Davis High", "Farmington High",
  "Layton High", "Northridge High", "Syracuse High", "Viewmont High", "Woods Cross High"
];
const GRADES = ["Pre-K","K","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
const SHIRT_SIZES = ["YXS (4-5)","YS (6-7)","YM (8)","YL (10-12)","YXL (14-16)","AS","AM","AL","AXL","A2XL"];
const PANT_SIZES = ["4","5","6","6X/7","8","10","12","14","16","18","20","24W","26W","28W","30W","32W"];

// ─── Styles ───
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0',
  borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  background: '#FAFBFC', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, letterSpacing: 0.3 };
const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#1B3A4B', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, borderBottom: '2px solid #F9A8C9', paddingBottom: 6 };

// ─── API helpers ───
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Components ───
function StatusBadge({ status }) {
  const colors = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
    sent: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sent' },
    complete: { bg: '#E0E7FF', text: '#3730A3', label: 'Complete' },
    declined: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined' },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, background: c.bg, color: c.text, textTransform: 'uppercase' }}>
      {c.label}
    </span>
  );
}

function Header({ subtitle }) {
  return (
    <div style={{ background: '#1B3A4B', color: '#fff', padding: '14px 16px 12px', textAlign: 'center' }}>
      <img src="/logo.png" alt="Child Spree" style={{
        width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
        border: '3px solid rgba(255,255,255,0.2)', marginBottom: 6,
      }} />
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800 }}>
        Child Spree 2026
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.5, marginTop: 2 }}>
        Davis Education Foundation
      </div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Nomination Form ───
function NominationForm() {
  const [form, setForm] = useState({
    childFirst: '', childLast: '', school: '', grade: '',
    nominatorName: '', nominatorRole: 'Teacher', nominatorEmail: '',
    parentName: '', parentPhone: '', parentEmail: '',
    reason: '', siblings: '', additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api('/nominations', { method: 'POST', body: JSON.stringify(form) });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#1B3A4B', marginBottom: 8 }}>Nomination Received</h2>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
          Thank you for advocating for this child. The DEF team will review and reach out to the family.
        </p>
        <button onClick={() => { setSubmitted(false); setForm({ childFirst: '', childLast: '', school: '', grade: '', nominatorName: '', nominatorRole: 'Teacher', nominatorEmail: '', parentName: '', parentPhone: '', parentEmail: '', reason: '', siblings: '', additionalNotes: '' }); }}
          style={{ background: '#E8548C', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Nominate Another Child
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
      {/* Hero */}
      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <img src="/hero.webp" alt="Kids with backpacks" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1B3A4B', marginBottom: 6 }}>Nominate a Child</h2>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
          Be the reason a child walks into school with confidence.
        </p>
      </div>

      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 13, color: '#0C4A6E', lineHeight: 1.5 }}>
        Nominate students whose families may need support with back-to-school clothing. All information is confidential.
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
          {error}
        </div>
      )}

      <p style={sectionTitle}>Child Information</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>First Name *</label>
          <input style={inputStyle} value={form.childFirst} onChange={e => update('childFirst', e.target.value)} placeholder="First" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Last Name *</label>
          <input style={inputStyle} value={form.childLast} onChange={e => update('childLast', e.target.value)} placeholder="Last" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 4 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>School *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.school} onChange={e => update('school', e.target.value)}>
            <option value="">Select school...</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Grade *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.grade} onChange={e => update('grade', e.target.value)}>
            <option value="">Grade</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <p style={{ ...sectionTitle, marginTop: 8 }}>Your Information</p>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Your Name *</label>
        <input style={inputStyle} value={form.nominatorName} onChange={e => update('nominatorName', e.target.value)} placeholder="Full name" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Role *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.nominatorRole} onChange={e => update('nominatorRole', e.target.value)}>
            {['Teacher','Counselor','Family Advocate','Administrator','Other'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" value={form.nominatorEmail} onChange={e => update('nominatorEmail', e.target.value)} placeholder="you@davis.k12.ut.us" />
        </div>
      </div>

      <p style={{ ...sectionTitle, marginTop: 8 }}>Parent / Guardian</p>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.parentName} onChange={e => update('parentName', e.target.value)} placeholder="Full name" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} type="tel" value={form.parentPhone} onChange={e => update('parentPhone', e.target.value)} placeholder="(801) 555-0000" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.parentEmail} onChange={e => update('parentEmail', e.target.value)} placeholder="parent@email.com" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Why are you nominating this child?</label>
        <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.reason} onChange={e => update('reason', e.target.value)} placeholder="Brief explanation — this stays confidential" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Siblings to also nominate?</label>
        <input style={inputStyle} value={form.siblings} onChange={e => update('siblings', e.target.value)} placeholder="e.g., Maria (3rd), James (K)" />
      </div>

      <button onClick={handleSubmit} disabled={submitting} style={{
        width: '100%', padding: 14, background: submitting ? '#94A3B8' : '#E8548C', color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
        marginTop: 8, letterSpacing: 0.3, boxShadow: '0 2px 8px rgba(232,84,140,0.3)',
      }}>
        {submitting ? 'Submitting...' : 'Submit Nomination'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10 }}>All information is kept strictly confidential.</p>
    </div>
  );
}

// ─── Admin Dashboard ───
function AdminDashboard() {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);
      const data = await api(`/nominations?${params}`);
      setNominations(data.nominations);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await api(`/nominations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const counts = { all: nominations.length, pending: 0, approved: 0, sent: 0, complete: 0, declined: 0 };
  nominations.forEach(n => counts[n.status] = (counts[n.status] || 0) + 1);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 12px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1B3A4B', marginBottom: 4 }}>Nominations</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total', value: counts.all, color: '#1B3A4B' },
          { label: 'Pending', value: counts.pending, color: '#D97706' },
          { label: 'Approved', value: counts.approved, color: '#059669' },
          { label: 'Complete', value: counts.complete, color: '#2563EB' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {['all','pending','approved','sent','complete'].map(k => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === k ? '#E8548C' : '#F1F5F9', color: filter === k ? '#fff' : '#64748B',
          }}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      <input placeholder="Search child, school, nominator..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12, fontSize: 13 }} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</div>
      ) : nominations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>
          No nominations yet. Share the link with counselors and teachers.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nominations.map(n => (
            <div key={n.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
              <div onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A4B' }}>{n.childFirst} {n.childLast}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{n.school} · {n.grade} · by {n.nominatorName}</div>
                </div>
                <StatusBadge status={n.status} />
              </div>

              {expandedId === n.id && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 12 }}>
                    <div><span style={{ color: '#94A3B8' }}>Nominator:</span> {n.nominatorName} ({n.nominatorRole})</div>
                    <div><span style={{ color: '#94A3B8' }}>Email:</span> {n.nominatorEmail}</div>
                    <div><span style={{ color: '#94A3B8' }}>Parent:</span> {n.parentName}</div>
                    <div><span style={{ color: '#94A3B8' }}>Phone:</span> {n.parentPhone || '—'}</div>
                  </div>
                  {n.reason && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFBEB', borderRadius: 6, fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
                      <strong>Reason:</strong> {n.reason}
                    </div>
                  )}
                  {n.parentIntake && (
                    <div style={{ marginTop: 10, padding: 10, background: '#F0FDF4', borderRadius: 6, border: '1px solid #BBF7D0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>Parent Response</div>
                      <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <div>Shirt: {n.parentIntake.shirtSize}</div>
                        <div>Pants: {n.parentIntake.pantSize}</div>
                        <div>Shoe: {n.parentIntake.shoeSize}</div>
                        <div>Video: {n.parentIntake.hasVideo ? '✓' : '—'}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {n.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(n.id, 'approved')} style={{ flex: 1, padding: 8, background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => updateStatus(n.id, 'declined')} style={{ padding: '8px 16px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Decline</button>
                      </>
                    )}
                    {n.status === 'approved' && (
                      <button onClick={() => updateStatus(n.id, 'sent')} style={{ flex: 1, padding: 8, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Mark Sent to Parent →
                      </button>
                    )}
                    {n.status === 'sent' && n.parentToken && (
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Parent link: <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>childspree.org/#/intake/{n.parentToken}</code>
                      </div>
                    )}
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

// ─── Parent Intake ───
function ParentIntake({ token }) {
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    shirtSize: '', pantSize: '', shoeSize: '', favoriteColors: '',
    avoidColors: '', allergies: '', preferences: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/intake/${token}`);
        setChild(data);
        if (data.alreadySubmitted) setSubmitted(true);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    })();
  }, [token]);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api(`/intake/${token}`, { method: 'POST', body: JSON.stringify(form) });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading...</div>;
  if (error) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <p style={{ color: '#991B1B', fontSize: 14 }}>{error}</p>
    </div>
  );

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎒</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#1B3A4B', marginBottom: 8 }}>Thank You!</h2>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
          We have {child?.childFirst}'s information. A volunteer will shop for brand new clothes just for them.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎒</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1B3A4B', marginBottom: 4 }}>
          Sizes for {child?.childFirst}
        </h2>
        <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
          A volunteer will shop for brand new clothes for your child.
        </p>
      </div>

      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 13, color: '#9A3412', lineHeight: 1.5 }}>
        Everything shared here is confidential.
      </div>

      <p style={sectionTitle}>Sizes</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Shirt *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.shirtSize} onChange={e => update('shirtSize', e.target.value)}>
            <option value="">Size</option>
            {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Pants *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.pantSize} onChange={e => update('pantSize', e.target.value)}>
            <option value="">Size</option>
            {PANT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Shoe *</label>
          <input style={inputStyle} value={form.shoeSize} onChange={e => update('shoeSize', e.target.value)} placeholder="e.g., 4Y" />
        </div>
      </div>

      <p style={sectionTitle}>Preferences</p>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Favorite colors or styles?</label>
        <input style={inputStyle} value={form.favoriteColors} onChange={e => update('favoriteColors', e.target.value)} placeholder="e.g., Blue, dinosaurs" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Colors or styles to avoid?</label>
        <input style={inputStyle} value={form.avoidColors} onChange={e => update('avoidColors', e.target.value)} placeholder="e.g., No pink" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Allergies or sensory needs?</label>
        <input style={inputStyle} value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="e.g., No wool" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Anything else?</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.preferences} onChange={e => update('preferences', e.target.value)} />
      </div>

      <button onClick={handleSubmit} disabled={submitting} style={{
        width: '100%', padding: 14, background: submitting ? '#94A3B8' : '#E8548C', color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
        boxShadow: '0 2px 8px rgba(232,84,140,0.3)',
      }}>
        {submitting ? 'Submitting...' : 'Submit Sizes & Preferences'}
      </button>
    </div>
  );
}

// ─── App Router ───
export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (hash) => { window.location.hash = hash; };

  // Parse route
  let view = 'nominate';
  let token = null;
  if (route.startsWith('#/admin')) view = 'admin';
  else if (route.startsWith('#/intake/')) {
    view = 'parent';
    token = route.replace('#/intake/', '');
  }

  // Parent intake has no nav — it's a standalone link
  if (view === 'parent' && token) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)' }}>
        <Header subtitle="Parent Information" />
        <ParentIntake token={token} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)', paddingBottom: 72 }}>
      <Header />
      {view === 'nominate' && <NominationForm />}
      {view === 'admin' && <AdminDashboard />}

      {/* Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
        borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 12px', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
      }}>
        {[
          { key: '#/', icon: '📋', label: 'Nominate' },
          { key: '#/admin', icon: '⚙️', label: 'Admin' },
        ].map(item => (
          <button key={item.key} onClick={() => navigate(item.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            opacity: route === item.key || (item.key === '#/' && route === '#/') ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: route === item.key || (item.key === '#/' && route === '#/') ? '#E8548C' : '#94A3B8', textTransform: 'uppercase' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
