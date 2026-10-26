// Lune site Worker (Cloudflare Workers, same setup as mesa-juridica): serves dist/ and one form route.
// POST /api/waitlist {email, sign, source, page, site}: always stores the email in KV (WAITLIST, key = email),
// then, when RESEND_API_KEY is set, adds it to a Resend audience (RESEND_AUDIENCE_ID) and sends a note to WAITLIST_TO.
// Resend is best effort: once the email is in KV the visitor sees success.
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MAX_BODY = 2048;
const SIGNS = new Set(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function resend(env, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  // 409 = already in the audience, which is fine.
  if (!res.ok && res.status !== 409) throw new Error(`resend ${res.status}`);
}

async function waitlist(request, env) {
  const origin = request.headers.get('origin');
  if (origin && URL.parse(origin)?.host !== new URL(request.url).host) return json(403, { ok: false });
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json(415, { ok: false });
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return json(413, { ok: false });
  if (env.WAITLIST_RATE_LIMIT) {
    const { success } = await env.WAITLIST_RATE_LIMIT.limit({ key: request.headers.get('cf-connecting-ip') || 'local' });
    if (!success) return json(429, { ok: false });
  }
  // content-length can be missing (chunked), so the body is measured too before parsing.
  let d;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json(413, { ok: false });
    d = JSON.parse(raw);
  } catch { return json(400, { ok: false }); }
  if (!d || typeof d !== 'object') return json(400, { ok: false });
  if (d.site) return json(200, { ok: true }); // honeypot: bots fill the hidden field
  const email = String(d.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return json(400, { ok: false, error: 'email' });
  const sign = SIGNS.has(d.sign) ? d.sign : '';
  const source = String(d.source || '').slice(0, 60);
  const page = String(d.page || '').slice(0, 120);
  let saved = false;
  if (env.WAITLIST) {
    try {
      const prev = await env.WAITLIST.get(email);
      if (!prev) await env.WAITLIST.put(email, JSON.stringify({ sign, source, page, at: new Date().toISOString() }));
      saved = true;
    } catch {}
  }
  if (env.RESEND_API_KEY) {
    try {
      if (env.RESEND_AUDIENCE_ID) await resend(env, `/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, { email, unsubscribed: false });
      if (env.WAITLIST_TO) await resend(env, '/emails', {
        from: env.EMAIL_FROM || 'Lune <onboarding@resend.dev>', to: env.WAITLIST_TO, subject: 'New Lune waitlist sign-up',
        text: `Email: ${email}\nSign: ${sign || '-'}\nFrom: ${source || '-'} ${page}`,
      });
      saved = true;
    } catch {}
  }
  if (!saved) return json(503, { ok: false });
  return json(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/waitlist') return request.method === 'POST' ? waitlist(request, env) : json(405, { ok: false });
    return env.ASSETS.fetch(request);
  },
};
