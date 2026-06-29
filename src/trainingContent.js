// ─────────────────────────────────────────────────────────────────────────────
// Child Spree 2026 — Admin Guide & Training content
// Single source of truth for the in-app "Guide" tab AND the printable master
// training document. Authored content only (no user input) → safe to render as HTML.
// ─────────────────────────────────────────────────────────────────────────────

export const GUIDE_VERSION = 'Updated June 2026';

// Highlighted at the top of the Guide tab and in the printed doc.
export const WHATS_NEW = [
  { icon: '🛍️', title: 'Shopper Cards', text: 'A new mode in the QR Codes tab built around shopping for one child — QR codes, video downloads, printable cards, and a master roster, all in one place.' },
  { icon: '🎥', title: 'Video downloads', text: 'Download any child\u2019s video from their card, or download every video at once for archiving or showing on a screen.' },
  { icon: '🪪', title: 'Half-sheet shopping cards', text: 'Print one card per child (2 per page, cut in half) with sizes, colors, allergies, budget, and a QR that opens the child\u2019s video + profile. Your paper backup if phones or Wi-Fi fail.' },
  { icon: '📱', title: 'Scan-to-video', text: 'A child\u2019s QR now opens a mobile page with their video and full profile — sizes, colors, allergies, notes, and a shopping checklist.' },
  { icon: '📦', title: 'Export Everything', text: 'One button in Nominations exports a single Excel workbook with nominations, volunteers, allocations, gift cards, and a summary — perfect for board reports and reconciliation.' },
  { icon: '🖨️', title: 'Master Roster PDF', text: 'A printable, school-by-school roster of every child with their sizes, colors, allergies (flagged), and video status — great as a check-in or reference sheet.' },
];

// CSS shared by the in-app guide and the printable document.
export const GUIDE_CSS = `
.cs-guide { color:#1B3A4B; font-size:14px; line-height:1.6; }
.cs-guide h3 { font-size:18px; font-weight:800; margin:0 0 6px; color:#1B3A4B; }
.cs-guide h4 { font-size:14px; font-weight:800; margin:18px 0 6px; color:#0F2A3D; }
.cs-guide p { margin:0 0 10px; }
.cs-guide ul, .cs-guide ol { margin:0 0 12px; padding-left:22px; }
.cs-guide li { margin:0 0 6px; }
.cs-guide strong { color:#0F2A3D; }
.cs-guide .lead { font-size:15px; color:#334155; }
.cs-guide .path { display:inline-block; background:#EEF2F6; border:1px solid #DCE3EA; border-radius:6px; padding:1px 7px; font-size:12.5px; font-weight:700; color:#1B3A4B; white-space:nowrap; }
.cs-guide .key { display:inline-block; background:#1B3A4B; color:#fff; border-radius:5px; padding:1px 7px; font-size:12px; font-weight:700; }
.cs-guide .callout { border-radius:10px; padding:11px 14px; margin:12px 0; font-size:13.5px; border:1px solid; }
.cs-guide .callout .lbl { font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:0.6px; display:block; margin-bottom:3px; }
.cs-guide .callout.tip  { background:#ECFDF5; border-color:#A7F3D0; color:#065F46; }
.cs-guide .callout.tip .lbl { color:#059669; }
.cs-guide .callout.warn { background:#FFF7ED; border-color:#FED7AA; color:#9A3412; }
.cs-guide .callout.warn .lbl { color:#EA580C; }
.cs-guide .callout.new  { background:#FDF2F8; border-color:#FBCFE8; color:#9D174D; }
.cs-guide .callout.new .lbl { color:#DB2777; }
.cs-guide table { width:100%; border-collapse:collapse; margin:10px 0 14px; font-size:13px; }
.cs-guide th { background:#1B3A4B; color:#fff; text-align:left; padding:7px 10px; font-size:12px; }
.cs-guide td { padding:7px 10px; border-bottom:1px solid #E2E8F0; vertical-align:top; }
.cs-guide tr:nth-child(even) td { background:#F8FAFC; }
.cs-guide .pill { display:inline-block; border-radius:20px; padding:2px 9px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.3px; }
.cs-guide .p-pending { background:#FEF3C7; color:#92400E; }
.cs-guide .p-approved { background:#D1FAE5; color:#065F46; }
.cs-guide .p-sent { background:#DBEAFE; color:#1E40AF; }
.cs-guide .p-complete { background:#E0E7FF; color:#3730A3; }
.cs-guide .p-declined { background:#FEE2E2; color:#991B1B; }
`;

// Each section: { id, icon, title, summary, html }
export const TRAINING_SECTIONS = [
  {
    id: 'bigpicture',
    icon: '🌟',
    title: 'The big picture — how Child Spree works',
    summary: 'The child\u2019s journey from nomination to shopping day, and who does what.',
    html: `
      <p class="lead">Child Spree pairs a nominated child with a volunteer shopper and gives them <strong>$150 head-to-toe</strong> at a shopping event. A short personal video helps the shopper connect with the child they\u2019re serving. This admin runs the whole program — from the first nomination to the bag going home.</p>
      <h4>The journey of one child</h4>
      <ol>
        <li>A <strong>school family advocate</strong> nominates a child who could use a hand.</li>
        <li>An <strong>admin</strong> reviews the nomination and approves it.</li>
        <li>The admin <strong>sends a link to the parent</strong> to submit sizes, colors, allergies, and consent.</li>
        <li>The child records a <strong>short video at school</strong> so their shopper can meet them.</li>
        <li>Once sizes + video are in, the admin marks the child <strong>complete</strong> — ready for shopping day.</li>
        <li>On <strong>shopping day</strong>, a volunteer is paired with the child, opens their profile + video + sizes, and shops with them.</li>
        <li>Checkout with a gift card, then the bag is delivered. 🎉</li>
      </ol>
      <h4>Who does what</h4>
      <table>
        <tr><th>Role</th><th>What they do</th></tr>
        <tr><td><strong>Admin</strong> (DEF staff)</td><td>Reviews nominations, manages the pipeline, prepares shopping-day materials, runs the event, exports reports.</td></tr>
        <tr><td><strong>Family Advocate / Nominator</strong> (school staff)</td><td>Nominates children and records the short school video.</td></tr>
        <tr><td><strong>Parent / Guardian</strong></td><td>Fills out the sizing form (sizes, colors, allergies, notes) and gives consent.</td></tr>
        <tr><td><strong>Volunteer</strong></td><td><strong>Shoppers</strong> shop with a child; <strong>Operations Crew</strong> handle event logistics.</td></tr>
      </table>
    `,
  },
  {
    id: 'pipeline',
    icon: '🔀',
    title: 'The nomination pipeline & statuses',
    summary: 'What each status means and what to do next at every step.',
    html: `
      <p class="lead">Every child moves through a set of statuses. The status tells you exactly what needs to happen next. You change status from the child\u2019s detail panel in the <span class="path">Nominations</span> tab.</p>
      <table>
        <tr><th>Status</th><th>What it means</th><th>What to do</th></tr>
        <tr><td><span class="pill p-pending">Pending</span></td><td>Newly nominated, awaiting review.</td><td>Review and <strong>Approve</strong> or <strong>Decline</strong>.</td></tr>
        <tr><td><span class="pill p-approved">Approved</span></td><td>You approved it; the parent hasn\u2019t been contacted yet.</td><td>Click <strong>Send to Parent</strong> to text/email the sizing form.</td></tr>
        <tr><td><span class="pill p-sent">Sent</span></td><td>Parent has the sizing link.</td><td>Wait for sizes, then make sure a video is recorded.</td></tr>
        <tr><td><span class="pill p-complete">Complete</span></td><td>Sizes + video are in. Ready for shopping day.</td><td>Nothing — they\u2019re set. 🎉</td></tr>
        <tr><td><span class="pill p-declined">Declined</span></td><td>Not moving forward (with a reason on file).</td><td>Can be reopened any time with <strong>Undo Decline</strong>.</td></tr>
      </table>
      <div class="callout warn"><span class="lbl">Watch for "Incomplete"</span>A child can be marked Complete but still be missing a video — the dashboard flags this as <strong>Incomplete</strong>. Those children need a video before shopping day.</div>
      <h4>Siblings & family groups</h4>
      <p>When a nomination has siblings, they\u2019re kept together as a <strong>family group</strong>. Sending the sizing link to one parent sends it for the whole family in a single message, so a parent fills out all their children at once.</p>
    `,
  },
  {
    id: 'managing',
    icon: '✏️',
    title: 'Managing nominations (edit anything)',
    summary: 'Search, filter, edit every field, change status, decline & reopen, resend links.',
    html: `
      <p class="lead">The <span class="path">Nominations</span> tab is where you manage children. Stat cards across the top show totals by status. Use the filter chips (Active, Pending, Approved, Sent, Complete, Declined) and the search box to find anyone.</p>
      <h4>Open a child</h4>
      <p>Click any row to expand it. You\u2019ll see a <strong>pipeline tracker</strong> (which steps are done) and all of their details — child, parent, nominator, sizes, and preferences.</p>
      <h4>Edit any field</h4>
      <p>Click <span class="key">\u270F\uFE0F Edit All Fields</span>. You can change <strong>everything</strong>, including the information the parent submitted:</p>
      <ul>
        <li>Child: first/last name, grade, school</li>
        <li>Parent: name, phone, email, language</li>
        <li>Nominator: name, email</li>
        <li><strong>Sizes & preferences:</strong> shirt, pants, shoes, favorite colors, colors to avoid, allergies, special notes</li>
        <li>Reason for nomination & additional notes</li>
      </ul>
      <p>Click <strong>Save</strong> and it\u2019s updated immediately. This is how you fix a wrong size or typo — <strong>you never have to ask the parent to redo it</strong>.</p>
      <div class="callout tip"><span class="lbl">Other actions on the child panel</span><strong>Change status</strong> (Approve / Send to Parent / Mark Complete), <strong>Decline</strong> with a reason, <strong>Undo Decline</strong>, <strong>resend</strong> the sizing reminder, and <strong>copy</strong> the parent\u2019s intake link.</div>
    `,
  },
  {
    id: 'intake',
    icon: '📝',
    title: 'The sizing form & the video',
    summary: 'How parents submit sizes and how the school video gets recorded.',
    html: `
      <p class="lead">Two things have to come in before a child is ready: the parent\u2019s sizing form, and a short video.</p>
      <h4>The parent sizing form</h4>
      <p>When you click <strong>Send to Parent</strong>, the parent receives a private link (by text and/or email) to a simple mobile form. They provide:</p>
      <ul>
        <li>Shirt, pant, and shoe sizes</li>
        <li>Boys/Girls department and the child\u2019s age</li>
        <li>Favorite colors and colors to avoid</li>
        <li>Allergies or sensitivities (e.g., wool, latex)</li>
        <li>Special notes (what the child loves, what they really need)</li>
        <li>Consent and preferred language</li>
      </ul>
      <h4>The video</h4>
      <p>The short video is recorded <strong>at school by the family advocate</strong> (or uploaded). It\u2019s a quick hello so the volunteer can recognize and connect with the child they\u2019re shopping for. The shopper watches it before they start. Videos are capped at <strong>50&nbsp;MB</strong> to keep uploads fast.</p>
      <div class="callout warn"><span class="lbl">If a video is bad or missing</span>The school advocate re-records it from their link. From the admin you can resend the link/reminder — replacing a video directly from the dashboard isn\u2019t available yet.</div>
    `,
  },
  {
    id: 'volunteers',
    icon: '🛒',
    title: 'Volunteers',
    summary: 'Shoppers vs. operations crew, what we capture, and the Volunteers tab.',
    html: `
      <p class="lead">Volunteers sign up on the public volunteer page. There are two kinds:</p>
      <ul>
        <li><strong>Shoppers</strong> — paired with a child to shop on the day.</li>
        <li><strong>Operations Crew</strong> — handle setup, check-in, logistics, and flow.</li>
      </ul>
      <p>Signup captures their contact info, organization, group type & size, shirt size, arrival time, store location, and SMS opt-in.</p>
      <h4>The Volunteers tab</h4>
      <p>In <span class="path">Volunteers</span> you can <strong>search</strong> the list, <strong>Message</strong> volunteers (for shift reminders and updates), and <strong>Export</strong> the full list to Excel.</p>
    `,
  },
  {
    id: 'schools',
    icon: '🏫',
    title: 'Schools & allocations',
    summary: 'How many spots each school gets, and how many are used.',
    html: `
      <p class="lead">Each participating school is given a number of spots. The <span class="path">Schools</span> tab tracks how those spots are being used.</p>
      <ul>
        <li><strong>Allocated</strong> — spots the school was given.</li>
        <li><strong>Used</strong> — active (non-declined) nominations for that school.</li>
        <li><strong>Remaining</strong> — spots still open, shown with a progress bar and a status breakdown (pending / approved / sent / complete).</li>
      </ul>
      <p>This is your at-a-glance view of which schools still have room and which are full.</p>
    `,
  },
  {
    id: 'qrcodes',
    icon: '📱',
    title: 'QR Codes — the three modes',
    summary: 'Volunteer QRs, Bag Labels, and the new Shopper Cards.',
    html: `
      <p class="lead">The <span class="path">QR Codes</span> tab has three modes. Switch between them with the buttons at the top.</p>
      <table>
        <tr><th>Mode</th><th>What it\u2019s for</th><th>Its QR opens…</th></tr>
        <tr><td>👤 <strong>Volunteer QRs</strong></td><td>Check-in codes for volunteers.</td><td>The volunteer\u2019s check-in page.</td></tr>
        <tr><td>📦 <strong>Bag Labels</strong></td><td>Thermal bag tags for delivering finished bags.</td><td>The bag delivery-confirmation screen.</td></tr>
        <tr><td>🛍️ <strong>Shopper Cards</strong> <span class="pill p-complete">New</span></td><td>Everything a volunteer needs to shop for one child.</td><td>The child\u2019s <strong>video + full profile</strong> page.</td></tr>
      </table>
      <p>Shopper Cards is the big new addition — it has its own section next.</p>
    `,
  },
  {
    id: 'shoppercards',
    icon: '🛍️',
    title: '⭐ Shopper Cards (new) — full walkthrough',
    summary: 'QR codes, the shopper page, video downloads, half-sheets, and the master roster.',
    html: `
      <div class="callout new"><span class="lbl">New</span>Find it at <span class="path">Admin → QR Codes → 🛍️ Shopper Cards</span>. This is the home for everything you hand a volunteer to shop for a specific child.</div>
      <h4>1. Generate the QR codes</h4>
      <p>Pick a school (or leave it on <strong>All Schools</strong>) and click <span class="key">Generate QR Codes</span>. Each child with completed sizes gets a QR code. Every QR opens that child\u2019s <strong>video + full profile page</strong>.</p>
      <h4>2. What the QR opens (the shopper page)</h4>
      <p>When a volunteer scans a child\u2019s QR, their phone opens a clean mobile page showing:</p>
      <ul>
        <li>The <strong>$150 budget</strong> and a shopping progress checklist</li>
        <li><strong>Sizes</strong> (shirt / pants / shoes) and the Boys/Girls department</li>
        <li><strong>Loves</strong> and <strong>colors to avoid</strong></li>
        <li><strong>Allergies</strong> and any special notes</li>
        <li>The child\u2019s <strong>video</strong></li>
      </ul>
      <p>This is what a shopper keeps open on their phone while shopping.</p>
      <h4>3. On each child\u2019s card</h4>
      <ul>
        <li><span class="key">🎥 Video</span> — download just that child\u2019s video.</li>
        <li><span class="key">🖨️ Half-Sheet</span> — print a single shopping card for that child.</li>
      </ul>
      <h4>4. The toolbar — do it for everyone at once</h4>
      <ul>
        <li><span class="key">🖨️ Print All Half-Sheets</span> — prints <strong>two cards per letter page</strong>; cut in half and you have a printed shopping card for every child. Each card shows the name, sizes, loves/avoid colors, allergies, the $150 budget, and a QR to the video + profile. <strong>This is your backup if phones or Wi-Fi go down.</strong></li>
        <li><span class="key">⬇️ Download All Videos</span> — saves every child\u2019s video as a separate, named file. Great for archiving or playing on a screen at the event.</li>
        <li><span class="key">🖨️ Master Roster</span> — one landscape table of all children grouped by school (sizes, colors, allergies flagged in red, video status). A perfect check-in / reference sheet.</li>
      </ul>
      <div class="callout tip"><span class="lbl">Good to know</span>The <strong>school filter applies to everything</strong> — filter to one school to print just that school\u2019s cards or roster. <strong>Generate QR codes first</strong> before printing half-sheets so each card includes its scan code. And the Master Roster works without QRs.</div>
    `,
  },
  {
    id: 'shoppingday',
    icon: '🏪',
    title: 'Shopping day',
    summary: 'Check in volunteers, assign children, gift cards, checkout, and delivery.',
    html: `
      <p class="lead">The <span class="path">Shopping Day</span> tab is your event-day command center.</p>
      <ol>
        <li><strong>Check in volunteers</strong> as they arrive (scan their Volunteer QR or look them up).</li>
        <li><strong>Assign a child</strong> to each shopper, by store. The tab shows a live list of <strong>unassigned children</strong> so nobody is missed.</li>
        <li>The shopper opens the child\u2019s <strong>Shopper Card / profile</strong> (and video) and shops to the $150 budget.</li>
        <li>Handle the <strong>gift card</strong> and <strong>checkout</strong>.</li>
        <li>Confirm the <strong>bag is delivered</strong>.</li>
      </ol>
      <p>A <strong>store breakdown</strong> shows counts per location so you can balance shoppers across stores. You can also <strong>unassign</strong> if a pairing needs to change.</p>
    `,
  },
  {
    id: 'exports',
    icon: '📦',
    title: 'Exporting & reporting',
    summary: 'Every way to get the data out — spreadsheets and PDFs.',
    html: `
      <p class="lead">Everything can be exported. Use these for board reports, reconciliation, and printed backups.</p>
      <table>
        <tr><th>Export</th><th>Where</th><th>What you get</th></tr>
        <tr><td>📥 <strong>Export Excel</strong></td><td>Nominations tab</td><td>Every nomination with all fields (sizes, colors, allergies, notes, video status, contacts, dates).</td></tr>
        <tr><td><strong>Export</strong></td><td>Volunteers tab</td><td>The full volunteer list with contact and shift info.</td></tr>
        <tr><td>📦 <strong>Export Everything</strong> <span class="pill p-complete">New</span></td><td>Nominations tab</td><td>One workbook with five sheets: <strong>Summary, Nominations, Volunteers, Allocations by School, and Gift Cards</strong>. Pulls live data.</td></tr>
        <tr><td>🖨️ <strong>Master Roster</strong> <span class="pill p-complete">New</span></td><td>QR Codes → Shopper Cards</td><td>A printable PDF roster of all children, grouped by school.</td></tr>
      </table>
      <div class="callout tip"><span class="lbl">Tip</span>Every export is a snapshot of the moment you click it — just re-export any time you want the latest numbers. Excel files open in Excel, Google Sheets, or Numbers.</div>
    `,
  },
  {
    id: 'printing',
    icon: '🖨️',
    title: 'Printing & saving as PDF',
    summary: 'How the print buttons work and how to save a PDF.',
    html: `
      <p class="lead">The half-sheets, master roster, bag tags, and this guide all print the same way — through your browser\u2019s print dialog.</p>
      <ol>
        <li>Click the print button. A new tab opens with the formatted page.</li>
        <li>Your browser\u2019s <strong>Print</strong> dialog appears automatically.</li>
        <li>To make a PDF instead of paper, choose <strong>"Save as PDF"</strong> as the destination, then Save.</li>
      </ol>
      <div class="callout warn"><span class="lbl">If nothing happens</span>Your browser may be blocking pop-ups. Allow pop-ups for <strong>childspree.org</strong> and click the button again. Half-sheets are sized for standard letter paper; the master roster prints in landscape.</div>
    `,
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'FAQ & troubleshooting',
    summary: 'Quick answers to the things people ask most.',
    html: `
      <h4>A size or color is wrong</h4>
      <p>Open the child in <span class="path">Nominations</span> → <span class="key">\u270F\uFE0F Edit All Fields</span> → fix it → <strong>Save</strong>. No need to contact the parent.</p>
      <h4>It only downloaded one video</h4>
      <p>When you use <strong>Download All Videos</strong>, your browser asks once whether to allow multiple downloads — click <strong>Allow</strong>.</p>
      <h4>A QR code won\u2019t scan</h4>
      <p>Make sure it printed clearly and isn\u2019t too small. Any phone camera or QR app works — it opens the child\u2019s video + profile page.</p>
      <h4>A child\u2019s video is bad or missing</h4>
      <p>The school family advocate re-records it from their link. From the admin you can resend the reminder; replacing a video directly from the dashboard isn\u2019t available yet.</p>
      <h4>The parent didn\u2019t get the link</h4>
      <p>Double-check the parent\u2019s phone/email on the record (edit if it\u2019s wrong), then <strong>resend</strong> the reminder from the child\u2019s panel.</p>
      <h4>Who can log in to the admin?</h4>
      <p>Only approved DSD accounts on the admin list. If someone needs access, contact Scott.</p>
    `,
  },
  {
    id: 'cheatsheet',
    icon: '⚡',
    title: 'Quick reference — "I need to…"',
    summary: 'A one-look table of common tasks and where to do them.',
    html: `
      <table>
        <tr><th>I need to…</th><th>Go to…</th><th>Do this</th></tr>
        <tr><td>Approve a new child</td><td>Nominations</td><td>Open the child → Approve</td></tr>
        <tr><td>Send the sizing form</td><td>Nominations</td><td>Open the child → Send to Parent</td></tr>
        <tr><td>Fix a wrong size/color</td><td>Nominations</td><td>Open the child → Edit All Fields → Save</td></tr>
        <tr><td>Print shopping cards</td><td>QR Codes → Shopper Cards</td><td>Generate QRs → Print All Half-Sheets</td></tr>
        <tr><td>Print a check-in roster</td><td>QR Codes → Shopper Cards</td><td>Master Roster</td></tr>
        <tr><td>Download a child\u2019s video</td><td>QR Codes → Shopper Cards</td><td>🎥 Video on their card</td></tr>
        <tr><td>Download all videos</td><td>QR Codes → Shopper Cards</td><td>Download All Videos</td></tr>
        <tr><td>Export everything for a report</td><td>Nominations</td><td>📦 Export Everything</td></tr>
        <tr><td>See which schools have room</td><td>Schools</td><td>Check Remaining / progress bar</td></tr>
        <tr><td>Message volunteers</td><td>Volunteers</td><td>Message</td></tr>
        <tr><td>Run the event</td><td>Shopping Day</td><td>Check in → Assign → Checkout → Deliver</td></tr>
      </table>
    `,
  },
];
