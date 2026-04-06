// functions/api/_notify.js
// Shared notification helpers — Twilio SMS + Resend email

export async function sendSMS(env, to, body) {
  if (!to || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return null;
  // Clean phone number
  const phone = to.replace(/\D/g, '');
  if (phone.length < 10) return null;
  const e164 = phone.startsWith('1') ? `+${phone}` : `+1${phone}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams({
        To: e164,
        From: env.TWILIO_FROM_NUMBER || '+18019236121',
        Body: body,
      }),
    }
  );
  const data = await res.json();
  return data.sid ? { ok: true, sid: data.sid } : { ok: false, error: data.message };
}

export async function sendEmail(env, { to, subject, text, html }) {
  if (!to || !env.RESEND_API_KEY) return null;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Child Spree <childspree@daviskids.org>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html: html || text,
    }),
  });
  const data = await res.json();
  return data.id ? { ok: true, id: data.id } : { ok: false, error: data.message };
}

// Notification scenarios
export async function notifyNewNomination(env, nom) {
  const adminEmail = env.ADMIN_EMAIL || 'sfoster@dsdmail.net';

  // Email to DEF admin
  await sendEmail(env, {
    to: adminEmail,
    subject: `New nomination — ${nom.childFirst} ${nom.childLast} (${nom.school})`,
    html: `
      <h2>New Child Spree Nomination</h2>
      <p><strong>Child:</strong> ${nom.childFirst} ${nom.childLast} — ${nom.grade} at ${nom.school}</p>
      <p><strong>Nominated by:</strong> ${nom.nominatorName} (${nom.nominatorRole}) — ${nom.nominatorEmail}</p>
      <p><strong>Parent:</strong> ${nom.parentName} ${nom.parentPhone ? '· ' + nom.parentPhone : ''} ${nom.parentEmail ? '· ' + nom.parentEmail : ''}</p>
      ${nom.reason ? `<p><strong>Reason:</strong> ${nom.reason}</p>` : ''}
      <p><a href="https://childspree.org/#/admin">Review in admin →</a></p>
    `,
  });

  // Email confirmation to nominator
  if (nom.nominatorEmail) {
    await sendEmail(env, {
      to: nom.nominatorEmail,
      subject: `Nomination received — ${nom.childFirst} ${nom.childLast}`,
      html: `
        <h2>Thank you for your nomination.</h2>
        <p>We've received your nomination for <strong>${nom.childFirst} ${nom.childLast}</strong> at ${nom.school}.</p>
        <p>The Davis Education Foundation team will review it and reach out to the family. We'll keep you updated.</p>
        <p style="color:#888;font-size:12px;">This message was sent from the Child Spree 2026 system. Please do not reply.</p>
      `,
    });
  }
}

export async function notifyParentIntakeReady(env, nom) {
  const intakeUrl = `https://childspree.org/#/intake/${nom.parentToken}`;
  const childName = nom.childFirst;

  const smsBody = `Hi ${nom.parentName}! ${childName} has been selected for Child Spree 2026 — a free back-to-school shopping experience from the Davis Education Foundation. Please fill out this short form (takes 2 min): ${intakeUrl} Reply STOP to opt out.`;

  const emailHtml = `
    <h2>${childName} has been selected for Child Spree 2026! 🎒</h2>
    <p>Dear ${nom.parentName},</p>
    <p>We're excited to let you know that <strong>${childName}</strong> has been selected to receive brand new back-to-school clothing through the Davis Education Foundation's Child Spree program.</p>
    <p>A volunteer will shop specifically for ${childName}. To make sure the clothes are a perfect fit, please fill out this quick form (about 2 minutes):</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${intakeUrl}" style="background:#E8548C;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Fill Out ${childName}'s Sizes →</a>
    </p>
    <p>This link is unique to your family. All information is kept confidential.</p>
    <p>Questions? Contact us at <a href="mailto:sfoster@dsdmail.net">sfoster@dsdmail.net</a></p>
    <hr/>
    <p style="color:#888;font-size:12px;">Davis Education Foundation · Child Spree 2026 · daviskids.org</p>
  `;

  // SMS to parent
  if (nom.parentPhone) {
    await sendSMS(env, nom.parentPhone, smsBody);
  }

  // Email to parent
  if (nom.parentEmail) {
    await sendEmail(env, {
      to: nom.parentEmail,
      subject: `${childName} has been selected for Child Spree 2026 🎒`,
      html: emailHtml,
    });
  }
}

export async function notifyIntakeComplete(env, nom, intake) {
  const adminEmail = env.ADMIN_EMAIL || 'sfoster@dsdmail.net';

  await sendEmail(env, {
    to: adminEmail,
    subject: `✅ Intake complete — ${nom.childFirst} ${nom.childLast}`,
    html: `
      <h2>Parent intake complete</h2>
      <p><strong>${nom.childFirst} ${nom.childLast}</strong> · ${nom.grade} · ${nom.school}</p>
      <table style="border-collapse:collapse;font-size:14px;margin:16px 0;">
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Shirt</td><td style="padding:6px 0;font-weight:bold;">${intake.shirtSize}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Pants</td><td style="padding:6px 0;font-weight:bold;">${intake.pantSize}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Shoe</td><td style="padding:6px 0;font-weight:bold;">${intake.shoeSize}</td></tr>
        ${intake.favoriteColors ? `<tr><td style="padding:6px 16px 6px 0;color:#666;">Loves</td><td style="padding:6px 0;">${intake.favoriteColors}</td></tr>` : ''}
        ${intake.avoidColors ? `<tr><td style="padding:6px 16px 6px 0;color:#666;">Avoid</td><td style="padding:6px 0;">${intake.avoidColors}</td></tr>` : ''}
        ${intake.allergies ? `<tr><td style="padding:6px 16px 6px 0;color:#666;">Needs</td><td style="padding:6px 0;">${intake.allergies}</td></tr>` : ''}
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Video</td><td style="padding:6px 0;">${intake.videoUploaded ? '✅ Uploaded' : '—'}</td></tr>
      </table>
      ${intake.preferences ? `<p><strong>Notes:</strong> ${intake.preferences}</p>` : ''}
      <p><a href="https://childspree.org/#/admin">View in admin →</a></p>
    `,
  });
}
