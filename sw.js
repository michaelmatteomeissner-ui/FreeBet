// FreeBet Service Worker – Automatische Updates
// Diese Versionsnummer bei jedem GitHub-Push erhöhen
const VERSION = '1.0.0';
const CACHE = 'freebet-' + VERSION;
const FILES = ['/'];

// Installation: Cache befüllen
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: Netzwerk zuerst, Cache als Fallback (immer aktuell)
self.addEventListener('fetch', function(e) {
  // Nur eigene Seiten cachen, nicht Firebase/OpenLigaDB
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Erfolgreiche Antwort im Cache speichern
      var clone = response.clone();
      caches.open(CACHE).then(function(cache) {
        cache.put(e.request, clone);
      });
      return response;
    }).catch(function() {
      // Offline: aus Cache laden
      return caches.match(e.request);
    })
  );
});

// skipWaiting auf Nachricht vom Tab
self.addEventListener('message', function(e) {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
