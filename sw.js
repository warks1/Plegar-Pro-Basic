// Prototipo offline: cachea solo los recursos locales de esta versión.
const CACHE='plegar-pro-forming2d-v9';
const FILES=['./','./index.html','./styles.css','./app.js','./geometry2d.js','./bendcalc.js','./editor2d.js','./editor2d.css','./clearance2d.js','./toolprofiles2d.js','./previousbends2d.js','./interference2d.js','./assembly2d.js','./forming2d.js','./piece3d.js','./tooling3d.js','./piece3d-view.js','./piece3d.css','./forming2d-view.js','./forming2d.css','./manifest.webmanifest','./assets/favicon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return res;})));});
