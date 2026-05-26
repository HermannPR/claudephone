// Basic service worker — enables PWA install
self.addEventListener("install", e => e.waitUntil(caches.open("v1").then(c => c.addAll(["/", "/manifest.json"]))));
self.addEventListener("fetch", e => {
  // Network-first — always get fresh terminal content
  if (e.request.url.includes("socket.io")) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
