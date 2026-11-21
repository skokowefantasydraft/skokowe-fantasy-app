// Service worker: strona działa offline, wyniki zawsze najpierw z sieci.
const SHELL = "sfd-shell-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "logo.png", "favicon.png", "icon-192.png", "icon-512.png",
               "apple-touch-icon.png", "fonts/Poppins-Regular.ttf", "fonts/Poppins-Medium.ttf", "fonts/Poppins-Bold.ttf"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.pathname.endsWith("wyniki.json")) return;          // wyniki: zawsze sieć (zapas w localStorage)
  // strona i zasoby: najpierw sieć (świeża wersja), bez sieci – kopia
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && url.origin === location.origin) {
        const copy = r.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match("index.html")))
  );
});
