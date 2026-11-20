// ============================================================================
// VERCEL WEBHOOK BRIDGE — TELEGRAM AI AGENT (REAL-TIME 24/7, 0% KUOTA TRIGGER)
// Endpoint: https://mnmgrupjember.vercel.app/api/telegram
// Environment Variable di Vercel: GAS_WEBHOOK_URL = URL Web App /exec Anda
// ============================================================================

const seenUpdates = new Map();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 menit

function isDuplicate(key) {
  if (!key) return false;
  const now = Date.now();
  // Bersihkan entri kadaluarsa
  for (const [k, exp] of seenUpdates.entries()) {
    if (exp < now) seenUpdates.delete(k);
  }
  if (seenUpdates.has(key)) return true;
  seenUpdates.set(key, now + DEDUP_TTL_MS);
  return false;
}

export default async function handler(req, res) {
  // Health check GET (untuk memastikan endpoint aktif di browser)
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'MNM GRUP Telegram Webhook Bridge (Vercel)',
      gasConfigured: Boolean(process.env.GAS_WEBHOOK_URL)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const gasUrl = String(process.env.GAS_WEBHOOK_URL || '').trim();
  if (!gasUrl) {
    console.error('GAS_WEBHOOK_URL belum diset di Environment Variables Vercel');
    return res.status(200).json({ ok: false, error: 'GAS_WEBHOOK_URL belum diset di Vercel' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const updateId = body.update_id ? String(body.update_id) : '';
    const msg = body.message || body.edited_message || (body.callback_query && body.callback_query.message) || {};
    const chatId = msg && msg.chat ? String(msg.chat.id || '') : '';
    const msgId = msg && msg.message_id ? String(msg.message_id) : '';

    // Lapisan Anti-Duplikat #0 di Vercel (instan < 1ms)
    if (updateId && isDuplicate('tg_uid_' + updateId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    if (!body.callback_query && chatId && msgId && isDuplicate('tg_msg_' + chatId + '_' + msgId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Teruskan ke Google Apps Script /exec (Node fetch otomatis mengikuti HTTP 302 Redirect GAS!)
    const resp = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    const respText = await resp.text();
    return res.status(200).json({
      ok: true,
      forwarded: true,
      gasStatus: resp.status,
      preview: respText.substring(0, 120)
    });
  } catch (err) {
    console.error('Telegram Bridge Error:', err);
    // Tetap balas 200 OK ke Telegram agar tidak terjadi loop retry tanpa henti
    return res.status(200).json({ ok: true, warning: String(err && err.message ? err.message : err) });
  }
}
