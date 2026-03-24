/**
 * JustxEmpower Service Worker — Cache Nuke
 * Clears ALL caches and unregisters itself to fix stale asset issues.
 * A proper caching SW can be re-added later once deploy pipeline is stable.
 */

self.addEventListener('install', (event) => {
  console.log('[SW] Installing cache-clearing worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Clearing all caches and unregistering');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => {
        // Tell all open tabs to reload
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      })
  );
});
