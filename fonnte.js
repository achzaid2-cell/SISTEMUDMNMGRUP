// ============================================================================
// VERCEL WEBHOOK BRIDGE — WHATSAPP FONNTE AI AGENT (ANTI-TIMEOUT & ANTI-DOBEL)
// Endpoint: https://mnmgrupjember.vercel.app/api/fonnte
// Environment Variable di Vercel: GAS_WEBHOOK_URL = URL Web App /exec Anda
// ============================================================================

const seenWa = new Map();
const DEDUP_MEDIA_MS = 10 * 60 * 1000; // 10 menit untuk foto/media & ID pesan
const DEDUP_TEXT_MS = 15 * 1000;       // 15 detik untuk teks singkat (agar balas "1" tetap bisa dipakai lagi)

function isDuplicateWa(key, ttlMs) {
  if (!key) return false;
  const now = Date.now();
  for (const [k, exp] of seenWa.entries()) {
    if (exp < now) seenWa.delete(k);
  }
  if (seenWa.has(key)) return true;
  seenWa.set(key, now + ttlMs);
  return false;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'MNM GRUP WhatsApp Fonnte Webhook Bridge (Vercel)',
      gasConfigured: Boolean(process.env.GAS_WEBHOOK_URL)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const gasUrl = String(process.env.GAS_WEBHOOK_URL || '').trim();
  if (!gasUrl) {
    return res.status(200).json({ status: false, error: 'GAS_WEBHOOK_URL belum diset di Vercel' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }

    const sender = String(body.sender || body.pengirim || body.from || '').trim();
    const msgId = String(body.id || body.message_id || body.inboxid || body.msg_id || '').trim();
    const mediaUrl = String(body.url || body.attachment || body.media || body.image || body.file || '').trim();
    const pesan = String(body.message || body.text || body.caption || '').trim();

    // Lapisan Anti-Duplikat #0 di Vercel (cegah retry Fonnte sebelum menyentuh Apps Script!)
    if (sender) {
      if (msgId && isDuplicateWa('wa_id_' + sender + '_' + msgId, DEDUP_MEDIA_MS)) {
        return res.status(200).json({ status: true, duplicate: true });
      }
      if (mediaUrl && isDuplicateWa('wa_url_' + sender + '_' + mediaUrl, DEDUP_MEDIA_MS)) {
        return res.status(200).json({ status: true, duplicate: true });
      }
      if (!mediaUrl && !msgId && pesan && isDuplicateWa('wa_txt_' + sender + '_' + pesan.substring(0, 100), DEDUP_TEXT_MS)) {
        return res.status(200).json({ status: true, duplicate: true });
      }
    }

    // Teruskan ke Google Apps Script /exec dengan redirect: 'follow' (mengatasi 302 GAS)
    const resp = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    const respText = await resp.text();
    return res.status(200).json({
      status: true,
      forwarded: true,
      gasStatus: resp.status,
      preview: respText.substring(0, 120)
    });
  } catch (err) {
    console.error('Fonnte Bridge Error:', err);
    return res.status(200).json({ status: true, warning: String(err && err.message ? err.message : err) });
  }
}
