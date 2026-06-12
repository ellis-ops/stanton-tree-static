// Vercel serverless function: receives the estimate form and emails it via Resend.
// The API key lives in the RESEND_API_KEY environment variable (set in Vercel dashboard).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { firstName = '', lastName = '', email = '', phone = '', services = [], message = '', website = '' } = req.body || {};

  // Honeypot: real users never fill the hidden "website" field — bots do.
  if (website) return res.status(200).json({ ok: true });

  if (!firstName && !email && !phone) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const svcList = Array.isArray(services) ? services.join(', ') : String(services || '');
  const html = `
    <h2>New Estimate Request — stantontreeservice.com</h2>
    <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Services:</strong> ${escapeHtml(svcList) || '(none selected)'}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Stanton Tree Service <stanton@partylabatlanta.com>',
        to: ['stantontreeservice1@gmail.com'],
        reply_to: email || undefined,
        subject: `New Estimate Request from ${firstName} ${lastName}`.trim(),
        html
      })
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('Resend error:', r.status, t.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'Email service error' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact fn error:', e.message);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
