// ============================================================================
// VERCEL WEBHOOK RECEIVER — SHOPEE OPEN PLATFORM LIVE PUSH (REAL-TIME < 1 DTK)
// Endpoint: https://mnmgrupjember.vercel.app/api/shopee-push
// Menerima: order_status_push (3), order_trackingno_push (4), webchat_push (10),
//           return_updates_push (29), package_fulfillment_status_push (30), dll.
// ============================================================================

const seenPush = new Map();
const PUSH_TTL_MS = 60 * 1000;

function isDupPush(key) {
  if (!key) return false;
  const now = Date.now();
  for (const [k, exp] of seenPush.entries()) {
    if (exp < now) seenPush.delete(k);
  }
  if (seenPush.has(key)) return true;
  seenPush.set(key, now + PUSH_TTL_MS);
  return false;
}

export default async function handler(req, res) {
  // Health check / Verify GET dari Shopee Console
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'MNM GRUP Shopee Live Push Receiver (Vercel)',
      gasConfigured: Boolean(process.env.GAS_WEBHOOK_URL)
    });
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const gasUrl = String(process.env.GAS_WEBHOOK_URL || '').trim();
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const code = Number(body.code);

    // Push Code 0 atau body kosong = test Verify dari Shopee Console -> langsung balas 200 OK!
    if (!body || body.code === undefined || code === 0) {
      return res.status(200).json({ ok: true, verified: true });
    }

    // Filter hanya event yang berguna untuk operasional (Order, Tracking, Return, Webchat, Product)
    const allowedCodes = [3, 4, 8, 10, 15, 22, 29, 30];
    if (allowedCodes.indexOf(code) === -1) {
      return res.status(200).json({ ok: true, ignoredCode: code });
    }

    const dedupKey = [
      code,
      body.shop_id || '',
      body.timestamp || '',
      (body.data && (body.data.ordersn || body.data.return_sn || body.data.conversation_id)) || ''
    ].join('|');
    if (isDupPush(dedupKey)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    if (gasUrl) {
      const payload = Object.assign({}, body, { _shopeePush: true });
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
    }

    return res.status(200).json({ ok: true, code: code, forwarded: Boolean(gasUrl) });
  } catch (err) {
    console.error('Shopee Live Push Error:', err);
    // Wajib selalu balas 200 OK agar Live Push Success Rate Shopee tetap 100%
    return res.status(200).json({ ok: true, warning: String(err && err.message ? err.message : err) });
  }
}
