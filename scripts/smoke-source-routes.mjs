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
    if (server.exitCode !== null) throw new Error('Vite terminó antes de estar disponible.');
    try {
      const response = await fetch(origin);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Vite no respondió en 45 segundos.');

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
    await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('.content').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const content = document.querySelector('.content');
      return Boolean(content && content.innerText.trim() && !content.innerText.includes('Cargando módulo…'));
    }, null, { timeout: 20000 });
    const diagnostic = await page.evaluate(() => ({
      title: document.querySelector('.content h1')?.textContent?.trim() || '',
      text: document.querySelector('.content')?.innerText?.trim().slice(0, 160) || '',
      errorBoundary: Boolean(document.querySelector('.module-error, .app-error, [data-error-boundary="true"]')),
    }));
    if (!diagnostic.text) throw new Error(`Ruta vacía: ${route}`);
    if (diagnostic.errorBoundary) throw new Error(`La ruta ${route} ha activado un límite de error: ${diagnostic.text}`);
    console.log(`OK ${route} · ${diagnostic.title || diagnostic.text.split('\\n')[0]}`);
  }

  if (pageErrors.length) throw new Error('Errores JavaScript:\\n' + pageErrors.join('\\n---\\n'));
  if (failedResponses.length) throw new Error('Recursos fallidos:\\n' + failedResponses.join('\\n'));
  console.log(`Prueba de rutas del sitio publicado: OK · ${routes.length} rutas renderizadas sin errores de página ni recursos fallidos.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
