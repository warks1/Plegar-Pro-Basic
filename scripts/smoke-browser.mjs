import { chromium } from 'playwright';

const baseUrl = process.argv[2] || process.env.PAGE_URL;
if (!baseUrl) {
  console.error('Uso: node scripts/smoke-browser.mjs https://sitio/');
  process.exit(2);
}

const errors = [];
const consoleMessages = [];
const failedResources = [];
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.stack || error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      consoleMessages.push(`[${message.type()}] ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    failedResources.push(`REQUEST FAILED ${request.url()} · ${request.failure()?.errorText || 'unknown'}`);
  });
  const appOrigin = new URL(baseUrl).origin;
  page.on('response', (response) => {
    const url = response.url();
    const parsed = new URL(url);
    if (parsed.origin === appOrigin && response.status() >= 400 && !parsed.pathname.endsWith('/favicon.ico')) {
      failedResources.push(`${response.status()} ${url}`);
    }
  });

  const navigation = await page.goto(baseUrl, { waitUntil: 'commit', timeout: 60000 });
  console.log('RESPUESTA INICIAL:', JSON.stringify({
    status: navigation?.status() ?? null,
    url: navigation?.url() ?? baseUrl,
    contentType: navigation?.headers()['content-type'] ?? null,
  }));
  await page.waitForTimeout(18000);

  const diagnostic = await page.evaluate(() => {
    const root = document.getElementById('root');
    const base = document.querySelector('base');
    return {
      url: location.href,
      base: base?.href || null,
      readyState: document.readyState,
      rootText: root?.innerText?.slice(0, 3000) || '',
      rootHtml: root?.innerHTML?.slice(0, 5000) || '',
      shell: Boolean(root?.querySelector('.app-shell')),
      splash: Boolean(root?.querySelector('.startup-splash')),
      failurePanel: Boolean(root?.querySelector('[role="alert"]')),
      scripts: [...document.scripts].map(s => ({src:s.src,type:s.type,loaded:!!s.dataset.loaded})),
      stylesheetCount: document.styleSheets.length,
    };
  });

  const diagnosticText = JSON.stringify({
    ...diagnostic,
    pageErrors: errors,
    consoleMessages: consoleMessages.slice(-30),
    failedResources: failedResources.slice(-30),
  }, null, 2);
  console.log('DIAGNÓSTICO DE ARRANQUE:\\n' + diagnosticText);

  if (!diagnostic.shell) {
    throw new Error('La interfaz no ha montado .app-shell. Se adjunta el diagnóstico de DOM, consola y recursos arriba.');
  }
  if (diagnostic.failurePanel) {
    throw new Error('La aplicación ha mostrado el panel interno de error de React; revisa el diagnóstico de arranque anterior.');
  }

  const initialTitle = (await page.locator('.content').innerText()).trim();
  if (!initialTitle) throw new Error('La aplicación montó el marco, pero el contenido de Inicio está vacío.');

  const basePath = new URL(baseUrl).pathname;
  const expectedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const routes = [
    { label: /Programación 2D/, suffix: '/programacion-2d' },
    { label: /Programación 3D/, suffix: '/programacion-3d' },
    { label: /Colisiones/, suffix: '/colisiones' },
  ];

  for (const route of routes) {
    await page.locator('.approved-nav a').filter({ hasText: route.label }).first().click();
    await page.waitForURL((url) => url.pathname.endsWith(route.suffix), { timeout: 15000 });
    const path = new URL(page.url()).pathname;
    if (expectedBase && !path.startsWith(expectedBase + '/')) {
      throw new Error(`La navegación ha escapado del prefijo de GitHub Pages: ${path}`);
    }
    await page.locator('.content').waitFor({ state: 'visible' });
    await page.waitForTimeout(700);
    const content = (await page.locator('.content').innerText()).trim();
    if (!content) throw new Error(`El módulo ${route.suffix} no muestra contenido.`);
    if (await page.locator('.module-loader').count()) {
      throw new Error(`El módulo ${route.suffix} se ha quedado atascado en Cargando módulo…`);
    }
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', (error) => errors.push(error.stack || error.message));
  await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mobile.waitForTimeout(6000);
  const mobileShell = await mobile.locator('.app-shell').count();
  if (!mobileShell) throw new Error('La interfaz no ha montado en móvil. Texto: ' + (await mobile.locator('#root').innerText().catch(()=>'#root no encontrado')));
  const dimensions = await mobile.evaluate(() => ({
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (dimensions.documentWidth > dimensions.width + 3) {
    throw new Error(`Desbordamiento horizontal en móvil: ${JSON.stringify(dimensions)}`);
  }

  if (errors.length) throw new Error('Errores JavaScript del navegador:\\n' + errors.join('\\n---\\n'));
  if (consoleMessages.length) throw new Error('Errores de consola del navegador:\\n' + consoleMessages.join('\\n---\\n'));
  if (failedResources.length) throw new Error('Recursos con error HTTP o de red:\\n' + failedResources.join('\\n'));

  console.log('Prueba de navegador: OK · Inicio montado · Programación 2D/3D y Colisiones navegables · prefijo Pages conservado · móvil sin desbordamiento horizontal.');
} finally {
  await browser.close();
}
