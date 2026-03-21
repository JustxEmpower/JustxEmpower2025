/**
 * JustxEmpower Service Worker
 * Cache-first strategy for static assets + AI model files
 * Ensures Kokoro TTS model, WASM files, and all JS/CSS load instantly after first visit
 */

const CACHE_VERSION = 'jxe-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const MODEL_CACHE = `${CACHE_VERSION}-models`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/account/codex',
];

// Patterns that should use cache-first (immutable after build)
const CACHE_FIRST_PATTERNS = [
  /\/assets\/.*\.(js|css|woff2?|ttf|eot)$/,          // Vite hashed assets
  /\/assets\/.*\.(png|jpg|jpeg|gif|svg|webp|ico)$/,   // Images
  /huggingface\.co.*\.(onnx|json|bin|wasm)$/,          // HuggingFace model files
  /cdn-lfs.*huggingface/,                               // HuggingFace LFS
  /onnxruntime.*\.wasm$/,                               // ONNX WASM runtime
  /\/models\/kokoro\//,                                  // Self-hosted model files
];

// Patterns that should use network-first (dynamic content)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/trpc\//,
  /googleapis\.com/,
  /open-meteo\.com/,
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => !key.startsWith(CACHE_VERSION))
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.startsWith('http')) return;

  // Network-first for API calls
  if (NETWORK_FIRST_PATTERNS.some(p => p.test(url))) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Cache-first for static assets and model files
  if (CACHE_FIRST_PATTERNS.some(p => p.test(url))) {
    event.respondWith(cacheFirst(request, url.includes('huggingface') || url.includes('/models/') ? MODEL_CACHE : STATIC_CACHE));
    return;
  }

  // Stale-while-revalidate for everything else (HTML pages, etc.)
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

/**
 * Cache-first: Return from cache immediately, only fetch if not cached.
 * Best for immutable assets (hashed JS/CSS, model files).
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn('[SW] Fetch failed for', request.url, err);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first: Try network, fall back to cache.
 * Best for API calls and dynamic data.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Stale-while-revalidate: Return cache immediately, update in background.
 * Best for HTML pages that should load fast but stay fresh.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}
