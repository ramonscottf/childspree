// functions/api/_notify.js
// Twilio SMS + Resend email notifications for Child Spree 2026

export async function sendSMS(env, to, body) {
  if (!to || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return null;
  const phone = to.replace(/\D/g, '');
  if (phone.length < 10) return null;
  const e164 = phone.startsWith('1') ? `+${phone}` : `+1${phone}`;

  // Use MessagingServiceSid if available (handles A2P compliance), else fall back to From number
  const params = { To: e164, Body: body };
  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    params.MessagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  } else {
    params.From = env.TWILIO_FROM_NUMBER || '+18019236121';
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams(params),
    }
  );
  const data = await res.json();
  return data.sid ? { ok: true, sid: data.sid } : { ok: false, error: data.message };
}

export async function sendEmail(env, { to, replyTo, subject, html }) {
  if (!env.RESEND_API_KEY) return null;

  // Parse admin emails — supports comma-separated list
  const toArray = Array.isArray(to) ? to
    : to.includes(',') ? to.split(',').map(e => e.trim())
    : [to];

  // Parse reply-to — supports comma-separated
  let replyToArray = null;
  if (replyTo) {
    replyToArray = Array.isArray(replyTo) ? replyTo
      : replyTo.includes(',') ? replyTo.split(',').map(e => e.trim())
      : [replyTo];
  }

  const payload = {
    from: 'Child Spree 2026 <childspree@daviskids.org>',
    to: toArray,
    subject,
    html,
  };
  if (replyToArray) payload.reply_to = replyToArray;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.id ? { ok: true, id: data.id } : { ok: false, error: data.message };
}

// ─── Scenarios ───

export async function notifyNewNomination(env, nom) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';

  await sendEmail(env, {
    to: adminEmails,
    replyTo: nom.nominatorEmail,
    subject: `New nomination — ${nom.childFirst} ${nom.childLast} (${nom.school})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1B3A4B;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">New Child Spree Nomination</h2>
        </div>
        <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;width:140px;">Child</td><td style="padding:8px 0;font-weight:600;">${nom.childFirst} ${nom.childLast} — ${nom.grade} at ${nom.school}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Nominated by</td><td style="padding:8px 0;">${nom.nominatorName} (${nom.nominatorRole})<br><a href="mailto:${nom.nominatorEmail}">${nom.nominatorEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Parent</td><td style="padding:8px 0;">${nom.parentName}${nom.parentPhone ? ' · ' + nom.parentPhone : ''}${nom.parentEmail ? ' · ' + nom.parentEmail : ''}</td></tr>
            ${nom.reason ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;">Reason</td><td style="padding:8px 0;">${nom.reason}</td></tr>` : ''}
            ${(nom.siblingCount||0) > 0 ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;">Siblings</td><td style="padding:8px 0;"><strong style="color:#D97706;">${nom.siblingCount} sibling${nom.siblingCount>1?'s':''} also nominated</strong>${nom.siblingNames ? '<br><span style=\"font-size:12px;color:#666;\">' + nom.siblingNames + '</span>' : ''}</td></tr>` : ''}
            ${nom.siblings ? `<tr><td style="padding:8px 0;color:#666;">Siblings</td><td style="padding:8px 0;">${nom.siblings}</td></tr>` : ''}
          </table>
          <div style="margin-top:20px;">
            <a href="https://childspree.org/#/admin" style="background:#E8548C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Review in Admin →</a>
          </div>
        </div>
      </div>
    `,
  });

  // Confirmation to nominator
  if (nom.nominatorEmail) {
    await sendEmail(env, {
      to: nom.nominatorEmail,
      replyTo: adminEmails,
      subject: `Nomination received — ${nom.childFirst} ${nom.childLast}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1B3A4B;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">Nomination Received ✓</h2>
          </div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
            <p style="font-size:15px;color:#333;">Thank you for nominating <strong>${nom.childFirst} ${nom.childLast}</strong>.</p>
            <p style="font-size:14px;color:#555;line-height:1.6;">The Davis Education Foundation team will review your nomination and reach out to the family directly. We'll keep you updated on the status.</p>
            <p style="font-size:14px;color:#555;line-height:1.6;">Questions? Reply to this email and we'll get back to you.</p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
            <p style="font-size:11px;color:#999;">Davis Education Foundation · Child Spree 2026 · daviskids.org</p>
          </div>
        </div>
      `,
    });
  }
}

export async function notifyParentIntakeReady(env, nom) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';
  const intakeUrl = `https://childspree.org/#/intake/${nom.parentToken}`;
  const lang = nom.lang || 'en';
  const isEs = lang === 'es';

  const siblingCount = nom.siblingCount || 0;
  const familyNote = siblingCount > 0
    ? ` We've also received nominations for ${siblingCount} other child${siblingCount > 1 ? 'ren' : ''} in your family${nom.siblingNames ? ' (' + nom.siblingNames + ')' : ''}. Each will receive their own link.`
    : '';

  const smsBody = isEs
    ? `¡Hola ${nom.parentName}! ${nom.childFirst} ha sido seleccionado/a para Child Spree 2026 — ropa nueva de regreso a clases de la Fundación de Educación Davis.${familyNote ? familyNote.replace('We\'ve also received','También recibimos').replace('other child','otro niño/a').replace('children','niños/as').replace('in your family','de su familia').replace('Each will receive their own link.','Cada uno recibirá su propio enlace.') : ''} Complete las tallas aquí (2 min): ${intakeUrl} ¿Preguntas? Responda a este mensaje. Responda STOP para cancelar.`
    : `Hi ${nom.parentName}! ${nom.childFirst} has been selected for Child Spree 2026 — brand new back-to-school clothes from Davis Education Foundation.${familyNote} Fill out sizes here (2 min): ${intakeUrl} Questions? Reply to this text. Reply STOP to opt out.`;

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1B3A4B;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🎒</div>
        <h2 style="color:#fff;margin:0;font-size:20px;">${nom.childFirst} has been selected!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">Child Spree 2026 · Davis Education Foundation</p>
      </div>
      <div style="background:#f9f9f9;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
        <p style="font-size:15px;color:#333;">Dear ${nom.parentName},</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">We're excited to let you know that <strong>${nom.childFirst}</strong> has been selected to receive brand new back-to-school clothing through the Davis Education Foundation's Child Spree program.</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">A volunteer will shop specifically for ${nom.childFirst}. To make sure everything fits perfectly, please fill out this quick form — it takes about 2 minutes:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${intakeUrl}" style="background:#E8548C;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">${isEs ? `Completar las tallas de ${nom.childFirst} →` : `Fill Out ${nom.childFirst}'s Sizes →`}</a>
        </div>
        <p style="font-size:13px;color:#888;text-align:center;">This link is unique to your family. All information is kept strictly confidential.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
        <p style="font-size:13px;color:#555;">${isEs ? '¿Preguntas? Responda a este correo o contáctenos en' : 'Questions? Reply to this email or contact us at'} <a href="mailto:kbuchi@dsdmail.net">kbuchi@dsdmail.net</a></p>
        <p style="font-size:11px;color:#999;margin-top:16px;">Davis Education Foundation · Child Spree 2026 · daviskids.org</p>
      </div>
    </div>
  `;

  if (nom.parentPhone) await sendSMS(env, nom.parentPhone, smsBody);

  if (nom.parentEmail) {
    await sendEmail(env, {
      to: nom.parentEmail,
      replyTo: adminEmails,
      subject: isEs ? `¡${nom.childFirst} ha sido seleccionado/a para Child Spree 2026! 🎒` : `${nom.childFirst} has been selected for Child Spree 2026 🎒`,
      html: emailHtml,
    });
  }
}

export async function notifyIntakeComplete(env, nom, intake) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';

  await sendEmail(env, {
    to: adminEmails,
    subject: `✅ Intake complete — ${nom.childFirst} ${nom.childLast}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#059669;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">✅ Parent Intake Complete</h2>
        </div>
        <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:15px;font-weight:600;color:#333;">${nom.childFirst} ${nom.childLast} · ${nom.grade} · ${nom.school}</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:12px;">
            <tr style="background:#fff;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">👕 Shirt</td><td style="padding:10px 12px;font-weight:700;border-bottom:1px solid #eee;">${intake.shirtSize}</td></tr>
            <tr style="background:#fafafa;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">👖 Pants</td><td style="padding:10px 12px;font-weight:700;border-bottom:1px solid #eee;">${intake.pantSize}</td></tr>
            <tr style="background:#fff;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">👟 Shoe</td><td style="padding:10px 12px;font-weight:700;border-bottom:1px solid #eee;">${intake.shoeSize}</td></tr>
            ${intake.favoriteColors ? `<tr style="background:#fafafa;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">❤️ Loves</td><td style="padding:10px 12px;border-bottom:1px solid #eee;">${intake.favoriteColors}</td></tr>` : ''}
            ${intake.avoidColors ? `<tr style="background:#fff;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">✗ Avoid</td><td style="padding:10px 12px;border-bottom:1px solid #eee;">${intake.avoidColors}</td></tr>` : ''}
            ${intake.allergies ? `<tr style="background:#fafafa;"><td style="padding:10px 12px;color:#666;border-bottom:1px solid #eee;">⚠️ Needs</td><td style="padding:10px 12px;border-bottom:1px solid #eee;">${intake.allergies}</td></tr>` : ''}
            <tr style="background:#fff;"><td style="padding:10px 12px;color:#666;">🎬 Video</td><td style="padding:10px 12px;">${intake.videoUploaded ? '✅ Uploaded' : '—'}</td></tr>
          </table>
          ${intake.preferences ? `<div style="margin-top:14px;padding:12px;background:#FFFBEB;border-radius:6px;font-size:13px;color:#78350F;"><strong>Notes:</strong> ${intake.preferences}</div>` : ''}
          <div style="margin-top:20px;">
            <a href="https://childspree.org/#/admin" style="background:#1B3A4B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View All Nominations →</a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function notifyVolunteerRegistered(env, vol) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';

  // Role + store description for confirmation email
  const isOpsCrew = vol.volunteerType === 'ops_crew';
  // Extract city from store name like "Kohl's Layton (881 W Antelope Dr)" -> "Layton"
  const storeCity = vol.storeLocation
    ? (vol.storeLocation.match(/Kohl's\s+(\w+)/) || [])[1] || null
    : null;
  const storeText = storeCity ? `Kohl's in ${storeCity}` : `your assigned Kohl's store`;
  const roleSentence = isOpsCrew
    ? `Thank you for signing up to be on the ops crew at Child Spree 2026! You'll be helping the event run smoothly at ${storeText} on the first Friday of August.`
    : `Thank you for signing up to volunteer at Child Spree 2026! You'll be shopping for one child — someone who needs it and deserves it — at ${storeText} on the first Friday of August.`;

  await sendEmail(env, {
    to: adminEmails,
    subject: `🙋 New volunteer — ${vol.firstName} ${vol.lastName}${vol.organization ? ' (' + vol.organization + ')' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1B3A4B;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">🙋 New Volunteer Registration</h2>
        </div>
        <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
          <table style="font-size:14px;border-collapse:collapse;width:100%;">
            <tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:700;">${vol.firstName} ${vol.lastName}</td></tr>
            ${vol.email ? `<tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${vol.email}">${vol.email}</a></td></tr>` : ''}
            ${vol.phone ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${vol.phone}</td></tr>` : ''}
            ${vol.organization ? `<tr><td style="padding:8px 0;color:#666;">Org</td><td style="padding:8px 0;">${vol.organization} (${vol.groupType||'Individual'})</td></tr>` : ''}
            ${vol.shirtSize ? `<tr><td style="padding:8px 0;color:#666;">Shirt</td><td style="padding:8px 0;">${vol.shirtSize}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#666;">Early arrival</td><td style="padding:8px 0;">${vol.earlyArrival ? '✅ Yes — before 7am' : 'No'}</td></tr>
          </table>
          <div style="margin-top:20px;">
            <a href="https://childspree.org/#/admin?tab=volunteers" style="background:#1B3A4B;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin →</a>
          </div>
        </div>
      </div>
    `,
  });

  // Confirmation to volunteer
  if (vol.email) {
    await sendEmail(env, {
      to: vol.email,
      replyTo: adminEmails,
      subject: `You\'re registered for Child Spree 2026! 🛒`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1B3A4B;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🛒</div>
            <h2 style="color:#fff;margin:0;font-size:20px;">You\'re registered!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px;">Child Spree 2026 · Davis Education Foundation</p>
          </div>
          <div style="background:#f9f9f9;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
            <p style="font-size:15px;color:#333;">Hi ${vol.firstName},</p>
            <p style="font-size:14px;color:#555;line-height:1.7;">${roleSentence}</p>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:13px;color:#166534;">
              <strong>What happens next:</strong> The DEF team will send you more details as the event approaches. Make sure to keep an eye on your email and texts.
            </div>
            <p style="font-size:13px;color:#555;">Questions? Reply to this email.</p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
            <p style="font-size:11px;color:#999;">Davis Education Foundation · Child Spree 2026 · daviskids.org</p>
          </div>
        </div>
      `,
    });
  }
}


// ─── Family intake — one email/SMS with ALL children's links ───────────────
export async function notifyParentFamilyIntakeReady(env, { parentName, parentPhone, parentEmail, children, lang }) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';
  const isEs = (lang || 'en') === 'es';
  const count = children.length;
  const firstName = children[0].childFirst;

  // Build intake links for each child
  const childLinks = children.map(c => ({
    name: `${c.childFirst} ${c.childLast}`,
    grade: c.grade,
    url: `https://childspree.org/#/intake/${c.parentToken}`,
  }));

  // SMS — short with all links
  const linkList = childLinks.map(c => `${c.name}: ${c.url}`).join(' | ');
  const smsBody = isEs
    ? `¡Hola ${parentName}! ${count} niños/as de su familia han sido seleccionados para Child Spree 2026 🎒 Cada uno necesita su propio formulario de tallas (2 min c/u): ${linkList} Responda STOP para cancelar.`
    : `Hi ${parentName}! ${count} children in your family have been selected for Child Spree 2026 🎒 Each needs their own size form (2 min each): ${linkList} Reply STOP to opt out.`;

  // Email — one per family, all links in one message
  const linksHtml = childLinks.map(c => `
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-weight:700;color:#1B3A4B;font-size:15px;">${c.name}</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:2px;">${c.grade}</div>
      </div>
      <a href="${c.url}" style="background:#E8548C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap;">Fill Out Sizes →</a>
    </div>
  `).join('');

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1B3A4B;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🎒</div>
        <h2 style="color:#fff;margin:0;font-size:20px;">${isEs ? `¡${count} niños/as seleccionados para Child Spree 2026!` : `${count} children selected for Child Spree 2026!`}</h2>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px;">Davis Education Foundation</p>
      </div>
      <div style="background:#f9f9f9;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
        <p style="font-size:15px;color:#333;">${isEs ? `Estimado/a ${parentName},` : `Dear ${parentName},`}</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">${isEs
          ? `Nos complace informarle que <strong>${count} niños/as</strong> de su familia han sido seleccionados para recibir ropa nueva de regreso a clases a través de Child Spree 2026.`
          : `We're excited to let you know that <strong>${count} children</strong> in your family have been selected to receive brand new back-to-school clothing through Child Spree 2026!`}</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">${isEs
          ? `Cada niño/a tiene su propio formulario de tallas. Complete un formulario por niño/a — toma unos 2 minutos cada uno. Un voluntario comprará ropa específicamente para cada uno de ellos.`
          : `Each child has their own size form. Please fill out one form per child — it takes about 2 minutes each. A volunteer will shop specifically for each of them.`}</p>
        <div style="margin:24px 0;">
          ${linksHtml}
        </div>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;font-size:13px;color:#166534;margin-bottom:20px;">
          ✅ Each link is unique to that child. All information is kept strictly confidential.
        </div>
        <p style="font-size:13px;color:#555;">${isEs ? '¿Preguntas? Responda a este correo o contáctenos en' : 'Questions? Reply to this email or contact us at'} <a href="mailto:kbuchi@dsdmail.net">kbuchi@dsdmail.net</a></p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
        <p style="font-size:11px;color:#999;">Davis Education Foundation · Child Spree 2026 · daviskids.org</p>
      </div>
    </div>
  `;

  if (parentPhone) await sendSMS(env, parentPhone, smsBody);
  if (parentEmail) {
    await sendEmail(env, {
      to: parentEmail,
      replyTo: adminEmails,
      subject: isEs ? `¡${count} niños/as seleccionados para Child Spree 2026! 🎒` : `${count} children selected for Child Spree 2026 🎒`,
      html: emailHtml,
    });
  }

  // Also alert admin
  const adminList = childLinks.map(c => `<li>${c.name} (${c.grade}) — <a href="${c.url}">${c.url}</a></li>`).join('');
  await sendEmail(env, {
    to: adminEmails,
    subject: `🎒 Family packet sent — ${count} children (${parentName})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;">
        <div style="background:#1B3A4B;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h3 style="color:#fff;margin:0;">Family packet sent — ${count} children</h3>
        </div>
        <div style="background:#f9f9f9;padding:20px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 10px;"><strong>Parent:</strong> ${parentName} · ${parentPhone||''} · ${parentEmail||''}</p>
          <p style="margin:0 0 8px;"><strong>Children:</strong></p>
          <ul style="margin:0;padding-left:20px;font-size:13px;color:#555;">${adminList}</ul>
          <p style="margin:16px 0 0;font-size:12px;color:#999;">Sibling nominations were auto-created and are now visible in the admin dashboard.</p>
        </div>
      </div>
    `,
  });
}

// ─── FA Welcome — sent when admin creates FA account ─────────────────────
export async function notifyFAWelcome(env, fa) {
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';
  const portalUrl = `https://childspree.org/#/fa/${fa.portalToken}`;

  if (fa.phone) {
    await sendSMS(env, fa.phone,
      `Hi ${fa.firstName}! You've been added as a Child Spree 2026 Family Advocate. Your portal: ${portalUrl} — bookmark it! Questions? Reply here.`
    );
  }
  if (fa.email) {
    await sendEmail(env, {
      to: fa.email,
      replyTo: adminEmails,
      subject: `Welcome to Child Spree 2026 — Your Family Advocate Portal`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1B3A4B;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🏫</div>
            <h2 style="color:#fff;margin:0;font-size:20px;">Welcome, ${fa.firstName}!</h2>
            <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px;">Child Spree 2026 Family Advocate</p>
          </div>
          <div style="background:#f9f9f9;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
            <p style="font-size:15px;color:#333;">Hi ${fa.firstName},</p>
            <p style="font-size:14px;color:#555;line-height:1.7;">You've been set up as a Family Advocate for Child Spree 2026. Your portal is where you'll track your nominated students, nudge parents to fill out their size forms, and record videos of the kids at school.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${portalUrl}" style="background:#E8548C;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Open My Portal →</a>
            </div>
            <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:14px 18px;font-size:13px;color:#0C4A6E;line-height:1.6;">
              <strong>Bookmark this link</strong> — it's your personal portal. Share it with no one.
            </div>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
            <p style="font-size:11px;color:#999;">Davis Education Foundation · Child Spree 2026</p>
          </div>
        </div>
      `,
    });
  }
}

// ─── FA Video Needed — sent when parent completes intake ─────────────────
export async function notifyFAVideoNeeded(env, { fa, nom, intake }) {
  const videoUrl = `https://childspree.org/#/fa/${fa.portal_token}/video/${nom.id}`;
  const adminEmails = env.ADMIN_EMAIL || 'kbuchi@dsdmail.net';

  const smsBody = `Hi ${fa.first_name}! Great news — ${nom.parent_name} just filled out sizes for ${nom.child_first} ${nom.child_last}. Next step: record a short video of ${nom.child_first} at school. Here's your link: ${videoUrl} Reply STOP to opt out.`;

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1B3A4B;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">🎬 Time to record ${nom.child_first}'s video!</h2>
      </div>
      <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
        <p style="font-size:14px;color:#333;margin:0 0 16px;">Hi ${fa.first_name} — the parent has filled out sizes. Here's what you need to know before recording:</p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 12px;color:#666;width:120px;">Child</td><td style="padding:8px 12px;font-weight:700;color:#1B3A4B;">${nom.child_first} ${nom.child_last} · ${nom.grade}</td></tr>
          ${intake.gender ? `<tr style="background:#fafafa;"><td style="padding:8px 12px;color:#666;">Gender</td><td style="padding:8px 12px;">${intake.gender}</td></tr>` : ''}
          ${intake.shirt_size ? `<tr><td style="padding:8px 12px;color:#666;">Shirt</td><td style="padding:8px 12px;">${intake.shirt_size}</td></tr>` : ''}
          ${intake.favorite_colors ? `<tr style="background:#fafafa;"><td style="padding:8px 12px;color:#666;">Loves</td><td style="padding:8px 12px;">${intake.favorite_colors}</td></tr>` : ''}
        </table>
        <div style="text-align:center;margin:24px 0;">
          <a href="${videoUrl}" style="background:#E8548C;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Record ${nom.child_first}'s Video →</a>
        </div>
        <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;line-height:1.6;">
          <strong>Video tips:</strong> 30–60 seconds. Have them say their name, grade, favorite color, and anything they love — sports, characters, hobbies. A smile goes a long way for the volunteer who's about to shop for them!
        </div>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
        <p style="font-size:11px;color:#999;">Davis Education Foundation · Child Spree 2026</p>
      </div>
    </div>
  `;

  if (fa.phone) await sendSMS(env, fa.phone, smsBody);
  if (fa.email) await sendEmail(env, {
    to: fa.email,
    replyTo: adminEmails,
    subject: `🎬 Record ${nom.child_first}'s video — sizes are in!`,
    html: emailHtml,
  });
}
