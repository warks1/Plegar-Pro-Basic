'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const scope = 'https://warks1.github.io/Plegar-Pro-Basic/';
const home = scope + 'index.html';
const response = (content, ok = true) => ({ content, ok, clone() { return response(content, ok); } });

function harness() {
  const events = {};
  const stores = new Map();
  const seen = [];
  const state = { offline: false };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const items = stores.get(name);
      return {
        async addAll(files) {
          for (const f of files) {
            const uri = new URL(f, scope).href;
            items.set(uri, response('precache:' + f));
          }
        },
        async match(uri) { return items.get(typeof uri === 'string' ? uri : uri.url); },
        async put(uri, res) { items.set(typeof uri === 'string' ? uri : uri.url, res); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(uri) {
      const key = typeof uri === 'string' ? uri : uri.url;
      for (const cache of stores.values()) if (cache.has(key)) return cache.get(key);
    }
  };
  const self = {
    location: { origin: 'https://warks1.github.io' },
    registration: { scope },
    addEventListener(type, fn) { events[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} }
  };
  vm.runInNewContext(src, { self, caches, URL, Response: { error: () => response('error', false) },
    fetch: async request => {
      const url = typeof request === 'string' ? request : request.url;
      seen.push(url);
      if (state.offline) throw new Error('Offline');
      return response('network:' + url);
    }
  }, { filename: 'sw.js' });
  async function trigger(type, req) {
    let promise;
    const event = { request: req, waitUntil(p) { promise = p; }, respondWith(p) { promise = p; } };
    events[type](event);
    if (promise) return await promise;
  }
  return { trigger, state, caches, stores, seen };
}

test('installs an offline page and cache version v122', async () => {
  const h = harness();
  await h.trigger('install');
  assert.ok(h.stores.has('plegar-pro-forming2d-v122-live-mecos-3d'));
  assert.ok(await h.caches.match(home));
  assert.ok(await h.caches.match(scope+'machine-references.js'),'Ficha de máquina disponible sin conexión');
  assert.ok(await h.caches.match(scope+'production-view.js'),'Producción local disponible sin conexión');
  assert.ok(await h.caches.match(scope+'settings.js'),'Preferencias disponibles offline');
  assert.ok(await h.caches.match(scope+'settings.css'),'Estilos accesibles offline');
  assert.ok(await h.caches.match(scope+'manufacturer-catalog.js'),'Catálogo documental sin conexión');
  assert.ok(await h.caches.match(scope+'tool-dxf-import.js'),'Importador DXF disponible sin conexión');
  assert.ok(await h.caches.match(scope+'tool-dxf-3d.js'),'Visor geométrico tridimensional disponible sin conexión');
  assert.ok(await h.caches.match(scope+'tool-fit-audit.js'),'Inspector de compatibilidad nominal disponible offline');
  assert.ok(await h.caches.match(scope+'tool-fit-audit.css'),'Estilos del inspector de montaje disponibles offline');
  assert.ok(await h.caches.match(scope+'machine-section2d.js'),'Sección de máquina disponible sin conexión');
  assert.ok(await h.caches.match(scope+'tool-dxf-import.css'),'Importación métrica accesible offline');
  assert.ok(await h.caches.match(scope+'manufacturer-drawings.js'),'Planos didácticos de utillaje disponibles sin conexión');
  assert.ok(await h.caches.match(scope+'manufacturer-catalog.css'),'Vista de utillaje sin conexión');
  assert.ok(await h.caches.match(scope+'assets/bystronic-frontal-referencia.svg'),'Referencia visual de Bystronic disponible offline');
});

test('navigation retrieves the latest online HTML, not a stale cached version', async () => {
  const h = harness();
  await h.trigger('install');
  const result = await h.trigger('fetch', { url: scope, method: 'GET', mode: 'navigate' });
  assert.equal(result.content, 'network:' + scope);
  assert.deepEqual(h.seen, [scope]);
});

test('offline navigation falls back to the installed page', async () => {
  const h = harness();
  await h.trigger('install');
  h.state.offline = true;
  const result = await h.trigger('fetch', { url: home, method: 'GET', mode: 'navigate' });
  assert.equal(result.content, 'precache:./index.html');
});

test('JS y CSS obtienen versión online y mantienen respaldo offline', async () => {
  const h = harness();
  await h.trigger('install');
  for (const file of ['forming2d-view.js', 'editor2d.js', 'splash.css']) {
    const url = scope + file;
    const result = await h.trigger('fetch', { url, method: 'GET', mode: 'same-origin' });
    assert.equal(result.content, 'network:' + url, file + ' debe cargar siempre desde red si es posible');
    assert.equal((await h.caches.match(url)).content, 'network:' + url,
      file + ' debe sustituir su copia offline anticuada');
  }
  h.state.offline = true;
  for (const file of ['forming2d-view.js', 'editor2d.js', 'splash.css']) {
    const url = scope + file;
    const result = await h.trigger('fetch', { url, method: 'GET', mode: 'same-origin' });
    assert.equal(result.content, 'network:' + url, 'Debe permitir uso offline');
  }
});
test('Las imágenes siguen precargadas y los PDF de clientes no se almacenan', async () => {
  const h = harness();
  await h.trigger('install');
  const imageUrl = scope + 'assets/splash-composicion-movil.webp';
  const image = await h.trigger('fetch', { url: imageUrl, method: 'GET', mode: 'same-origin' });
  assert.equal(image.content, 'precache:./assets/splash-composicion-movil.webp');
  assert.equal(h.seen.length, 0);
  const doc = scope + 'planos/trenirtrade/IV6-HZ051_Soporte_lateral.pdf';
  const live = await h.trigger('fetch', { url: doc, method: 'GET', mode: 'same-origin' });
  assert.equal(live.content, 'network:' + doc);
  assert.equal(await h.caches.match(doc), undefined);
  assert.equal(h.seen.length, 1);
});
