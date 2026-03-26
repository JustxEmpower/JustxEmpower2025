// No-op service worker — just unregisters itself quietly
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(self.registration.unregister());
});
