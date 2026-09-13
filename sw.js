const CACHE = "teishutsu-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// network-first for index.html (so updates arrive), cache-first for the rest.
// cache: "no-store" bypasses the browser's own HTTP cache, not just the SW cache —
// otherwise iOS standalone apps can keep serving a stale response even though
// this handler already tries the network "first".
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.mode === "navigate" || url.pathname.endsWith("index.html")) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
