// Prototipo offline: cachea solo los recursos locales de esta versión.
const CACHE='plegar-pro-forming2d-v56';
const FILES=['./','./splash.css','./splash.js','./assets/splash-plegar-pro.webp','./assets/splash-hero-desktop.webp','./assets/splash-hero-mobile.webp','./assets/splash-composicion-movil.webp','./assets/splash-fondo-movil.webp','./assets/splash-composicion-pc.webp','./index.html','./styles.css','./responsive-v32.css','./app.js','./geometry2d.js','./tool-library.js','./manufacturer-references.js','./cad-profile.js','./cad-orientation.js','./cad-profile-view.js','./cad-mounting-audit.js','./cad-mounting-view.js','./cad-mounting.css','./cad-trace.js','./cad-trace-view.js','./cad-trace.css','./cad-topology.js','./cad-topology-view.js','./cad-topology.css','./cad-chain.js','./cad-chain-view.js','./cad-chain.css','./cad-crossings.js','./cad-crossings-view.js','./cad-crossings.css','./cad-tangency.js','./cad-tangency-view.js','./cad-tangency.css','./bendcalc.js','./flat-pattern-view.js','./plan-trace.js','./editor2d.js','./editor2d.css','./new-piece-core.js','./piece-library.js','./piece-shelf.js','./piece-shelf.css','./new-piece.js','./new-piece.css','./clearance2d.js','./toolprofiles2d.js','./previousbends2d.js','./interference2d.js','./assembly2d.js','./forming2d.js','./sheet-offset.js','./piece3d.js','./metal-render.js','./plan-drawing.js','./examples3d.js','./sequence-timeline.js','./home3d.js','./home-dashboard.js','./touch-view.js','./assets/maquina.webp','./sample-library.js','./engineering-checks.js','./bend-workplan.js','./development-tools.js','./fold-kinematics.js','./tooling3d.js','./scene3d-audit.js','./proximity3d.js','./sweep3d.js','./machine-references.js','./machine-clearance.js','./sequence-planner.js','./piece3d-view.js','./piece3d.css','./forming2d-view.js','./forming2d.css','./plans.css','./plans-core.js','./repo-plans.js','./plans-view.js','./manifest.webmanifest','./assets/favicon.svg'];
// v0.36: actualizar siempre la página principal desde la red.
// La versión anterior servía HTML cacheado, ocultando las actualizaciones de GitHub Pages.
const OFFLINE_HOME = new URL('./index.html', self.registration.scope).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const PRELOAD = new Set(FILES.map(file => new URL(file, self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(FILES))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('plegar-pro-forming2d-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;
  const isHome = request.mode === 'navigate' ||
    url.pathname === SCOPE_PATH || url.pathname === SCOPE_PATH + 'index.html';
  if (isHome) {
    // Red primero: una actualización de GitHub Pages es visible al volver a abrir.
    // Si no hay conexión, se usa exclusivamente el HTML precargado de la misma versión.
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(OFFLINE_HOME, copy)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const fallback = await caches.match(OFFLINE_HOME);
      return fallback || Response.error();
    }));
    return;
  }
  // Recursos de la app precargados y con nombre/versionado de caché.
  // No guardar automáticamente PDFs de clientes ni archivos descargados.
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && PRELOAD.has(url.pathname)) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  })));
});
