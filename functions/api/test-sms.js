// functions/api/test-sms.js — TEMPORARY DEBUG endpoint
export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  const phone = (body.phone || '').replace(/\D/g,'');
  const e164 = phone.startsWith('1') ? `+${phone}` : `+1${phone}`;

  const params = {
    To: e164,
    Body: body.message || 'Child Spree SMS test — if you got this, it works!',
    MessagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
  };

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
  return Response.json({
    httpStatus: res.status,
    twilioSid: data.sid,
    twilioStatus: data.status,
    twilioError: data.message,
    twilioCode: data.code,
    to: data.to,
    from: data.from,
    messagingServiceSid: data.messaging_service_sid,
    raw: data,
  });
}
