// ============================================================================
// VERCEL OAUTH CALLBACK — SHOPEE OPEN PLATFORM & TIKTOK SHOP PARTNER
// Endpoint: https://mnmgrupjember.vercel.app/api/shopee-callback
// Menampilkan halaman konfirmasi bersih dengan tombol 1-klik Salin URL Callback
// tanpa menghapus parameter ?code=...&shop_id=...
// ============================================================================

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function handler(req, res) {
  const q = req.query || {};
  const code = String(q.code || '').trim();
  const shopId = String(q.shop_id || q.main_account_id || '').trim();
  const isShopee = Boolean(shopId);
  const platformName = isShopee ? 'Shopee Open Platform' : (code ? 'TikTok Shop Partner' : 'Shopee / TikTok Shop');
  const fullUrl = 'https://mnmgrupjember.vercel.app/api/shopee-callback' +
    (code ? ('?code=' + encodeURIComponent(code) + (shopId ? ('&shop_id=' + encodeURIComponent(shopId)) : '')) : '');

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Otorisasi ${escHtml(platformName)} — MNM GRUP</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f1f5f9; padding: 16px; color: #0f172a; }
    .card { width: 100%; max-width: 480px; background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15,23,42,.08); overflow: hidden; }
    .hdr { background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 20px 22px; }
    .hdr.warn { background: linear-gradient(135deg, #ea580c, #f97316); }
    .hdr h1 { margin: 0; font-size: 18px; font-weight: 800; }
    .hdr p { margin: 4px 0 0; font-size: 12px; opacity: .92; }
    .body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; }
    .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: .4px; }
    .val { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 4px; word-break: break-all; }
    .url-input { width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-family: monospace; font-size: 11px; color: #0f172a; background: #f8fafc; }
    .btn { width: 100%; padding: 12px 16px; border: 0; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: .15s; }
    .btn-primary { background: #ee4d2d; color: #fff; }
    .btn-primary:hover { background: #d94122; }
    .btn-ok { background: #059669 !important; color: #fff; }
    .steps { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: #9a3412; line-height: 1.55; }
    .steps ol { margin: 6px 0 0; padding-left: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr ${code ? '' : 'warn'}">
      <h1>${code ? '✅ Otorisasi ' + escHtml(platformName) + ' Berhasil!' : '⚠️ Menunggu Parameter Otorisasi'}</h1>
      <p>${code ? 'Kode otorisasi berhasil diterima. Segera salin dan tempel di aplikasi MNM GRUP.' : 'Halaman callback siap digunakan. Buka melalui tombol "+ Hubungkan Shopee" di aplikasi MNM GRUP.'}</p>
    </div>
    <div class="body">
      ${code ? `
        <div class="grid">
          <div class="box">
            <div class="lbl">Shop ID</div>
            <div class="val">${escHtml(shopId || '(TikTok Shop)')}</div>
          </div>
          <div class="box">
            <div class="lbl">Auth Code</div>
            <div class="val">${escHtml(code)}</div>
          </div>
        </div>
        <div>
          <div class="lbl" style="margin-bottom:6px">URL Callback Lengkap (Salin Ini)</div>
          <input id="cbUrl" class="url-input" readonly value="${escHtml(fullUrl)}" onclick="this.select()">
        </div>
        <button id="btnCopy" class="btn btn-primary" onclick="copyCb()">📋 Salin URL Callback Sekarang</button>
        <div class="steps">
          <b>Langkah Terakhir (10 Detik):</b>
          <ol>
            <li>Klik tombol <b>Salin URL Callback Sekarang</b> di atas.</li>
            <li>Kembali ke aplikasi <b>MNM GRUP</b> → Tab <b>Toko &amp; API</b> → klik <b>Tempel Callback</b>.</li>
            <li>Paste URL tersebut, pilih <b>Cabang WMS</b> &amp; <b>Buku Kas</b>, lalu klik <b>Hubungkan Toko</b>!</li>
          </ol>
        </div>
      ` : `
        <div class="box">
          <div class="lbl">Status Endpoint Callback</div>
          <div class="val" style="color:#059669">AKTIF &amp; SIAP DIGUNAKAN</div>
        </div>
        <div class="steps">
          Masukkan URL berikut pada kolom <b>Redirect URL Domain</b> di tab <b>Toko &amp; API</b> aplikasi MNM GRUP:<br>
          <code style="font-weight:800">https://mnmgrupjember.vercel.app/api/shopee-callback</code>
        </div>
      `}
    </div>
  </div>
  <script>
    function copyCb() {
      var inp = document.getElementById('cbUrl');
      var btn = document.getElementById('btnCopy');
      if (!inp) return;
      inp.select();
      inp.setSelectionRange(0, 99999);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(inp.value);
      } else {
        document.execCommand('copy');
      }
      if (btn) {
        btn.classList.add('btn-ok');
        btn.innerText = '✓ Berhasil Disalin! Silakan Paste di Aplikasi MNM GRUP';
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
