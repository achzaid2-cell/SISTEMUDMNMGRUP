const CACHE_NAME = "ud-mnm-grup-pwa-v2";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_ASSETS).catch(function () {});
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match("/index.html");
      });
    })
  );
});

// Terima sinyal notifikasi dari index.html (postMessage otomatis dari ud_mnm_grup.html)
self.addEventListener("message", function (event) {
  const data = event && event.data;
  if (!data || data.type !== "SHOW_MNM_NOTIFICATION") return;

  const p = data.payload || {};
  const title = p.title || "🔔 Notifikasi UD. MNM GRUP";
  const options = {
    body: p.body || "Ada aktivitas baru pada sistem UD. MNM GRUP.",
    icon: "https://iili.io/ClnHTdP.md.png",
    badge: "https://iili.io/ClnHTdP.md.png",
    tag: p.tag || ("mnm-notif-" + Date.now()),
    renotify: true,
    vibrate: [180, 80, 220],
    data: { url: "/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Dukungan Web Push API standar
self.addEventListener("push", function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { body: event.data ? event.data.text() : "Ada aktivitas baru di UD. MNM GRUP." };
  }
  const title = payload.title || "🔔 Notifikasi UD. MNM GRUP";
  const options = {
    body: payload.body || "Ada aktivitas baru di aplikasi.",
    icon: "https://iili.io/ClnHTdP.md.png",
    badge: "https://iili.io/ClnHTdP.md.png",
    tag: payload.tag || ("mnm-push-" + Date.now()),
    renotify: true,
    vibrate: [180, 80, 220],
    data: { url: payload.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Ketika banner notifikasi di layar atas HP diketuk, fokuskan aplikasi & buka modal lonceng notifikasi
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        try {
          client.postMessage({ type: "MNM_SW_NOTIFICATION_CLICKED" });
        } catch (e) {}
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});