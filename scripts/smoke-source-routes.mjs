import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:4186';
const routes = [
  '/proyectos','/desarrollo','/calculadora-desarrollo','/programador-pieza',
  '/programacion-2d','/programacion-3d','/simulacion-2d','/simulacion-3d',
  '/utillaje','/bibliotecas','/ordenes','/ajustes','/validacion','/proveedores',
  '/produccion','/calidad','/mantenimiento','/materiales','/requisitos',
  '/comparador-v','/soldadura','/importacion','/almacen','/presupuestos',
  '/rutas','/notificaciones','/arbol-fabricacion','/documentos','/revisiones',
  '/liberacion','/puerta-calidad','/fuentes-oficiales','/integridad','/actualizaciones',
  '/ia','/comunicacion','/agenda','/clientes','/curva-perfecta','/colisiones',
  '/registro-cad','/catalogos-tecnicos','/cad-cam-3d','/acerca-de'
];

const server = spawn(process.execPath, ['servidor-plegar-pro.mjs'], { stdio: 'ignore', env: process.env });
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (server.exitCode !== null) throw new Error('El servidor estático terminó antes de estar disponible.');
    try {
      const response = await fetch(origin);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('El servidor estático no respondió en 45 segundos.');

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  const failedResponses = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  page.on('response', response => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const route of routes) {
    console.log(`COMPROBANDO ${route}`);
    await page.goto(origin + route, { waitUntil: 'commit', timeout: 15000 });
    await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.content').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const content = document.querySelector('.content');
      return Boolean(content && content.innerText.trim() && !content.innerText.includes('Cargando módulo…'));
    }, null, { timeout: 10000 });
    const diagnostic = await page.evaluate(() => ({
      title: document.querySelector('.content h1')?.textContent?.trim() || '',
      text: document.querySelector('.content')?.innerText?.trim().slice(0, 160) || '',
      errorBoundary: Boolean(document.querySelector('.module-error, .app-error, [data-error-boundary="true"]')),
    }));
    if (!diagnostic.text) throw new Error(`Ruta vacía: ${route}`);
    if (diagnostic.errorBoundary) throw new Error(`La ruta ${route} ha activado un límite de error: ${diagnostic.text}`);
    console.log(`OK ${route} · ${diagnostic.title || diagnostic.text.split('\\n')[0]}`);
  }

  const responsiveRoutes = ['/', '/programacion-2d', '/simulacion-3d', '/colisiones', '/utillaje'];
  const viewports = [
    { name: 'móvil pequeño', width: 320, height: 740 },
    { name: 'móvil', width: 390, height: 844 },
    { name: 'tableta', width: 768, height: 1024 },
    { name: 'PC', width: 1365, height: 900 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of responsiveRoutes) {
      await page.evaluate(path => {
        history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, route);
      await page.waitForFunction(() => {
        const content = document.querySelector('.content');
        return Boolean(content && content.innerText.trim() && !content.innerText.includes('Cargando módulo…'));
      }, null, { timeout: 10000 });
      await page.waitForTimeout(80);
      const layout = await page.evaluate(() => {
        const wide = [...document.querySelectorAll('body *')].map(el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return { tag: el.tagName.toLowerCase(), className: typeof el.className === 'string' ? el.className : '', id: el.id, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), position: s.position, minWidth: s.minWidth, overflowX: s.overflowX };
        }).filter(el => el.width > window.innerWidth + 2 || el.right > window.innerWidth + 2 || el.left < -2).sort((a,b) => b.right-a.right).slice(0,12);
        return { viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, path: location.pathname, wide };
      });
      if (layout.document > layout.viewport + 2 || layout.body > layout.viewport + 2) {
        throw new Error(`Desbordamiento horizontal en ${viewport.name} (${viewport.width}px), ruta ${route}: viewport=${layout.viewport}, document=${layout.document}, body=${layout.body}; elementos=${JSON.stringify(layout.wide)}`);
      }
      console.log(`RESPONSIVE OK ${viewport.name} ${viewport.width}px · ${route}`);
    }
  }

  if (pageErrors.length) throw new Error('Errores JavaScript:\\n' + pageErrors.join('\\n---\\n'));
  if (failedResponses.length) throw new Error('Recursos fallidos:\\n' + failedResponses.join('\\n'));
  console.log(`Prueba de rutas del sitio publicado: OK · ${routes.length} rutas renderizadas sin errores de página ni recursos fallidos.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
