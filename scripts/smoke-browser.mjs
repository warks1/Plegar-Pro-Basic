import { chromium } from 'playwright';

const baseUrl = process.argv[2] || process.env.PAGE_URL;
if (!baseUrl) {
  console.error('Uso: node scripts/smoke-browser.mjs https://sitio/');
  process.exit(2);
}

const errors = [];
const consoleErrors = [];
const failedRequests = [];
const failedResources = [];
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.stack || error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} — ${request.failure()?.errorText || 'request failed'}`));
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(baseUrl) && response.status() >= 400 && !new URL(url).pathname.endsWith('/favicon.ico')) {
      failedResources.push(`${response.status()} ${url}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 30000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 5000),
      rootHtml: document.querySelector('#root')?.innerHTML.slice(0, 7000) || 'NO #root',
      resources: performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => /\\.js(?:$|\\?)|\\.css(?:$|\\?)/.test(url)).slice(-50),
    })).catch((evaluationError) => ({ evaluationError: String(evaluationError) }));
    console.error('DIAGNÓSTICO DE ARRANQUE: ' + JSON.stringify({
      diagnostic,
      pageErrors: errors,
      consoleErrors,
      failedRequests,
      failedResources,
      timeout: String(error),
    }, null, 2));
    await page.screenshot({ path: '/tmp/plegar-startup-failure.png', fullPage: true }).catch(() => {});
    throw error;
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
  await mobile.locator('.app-shell').waitFor({ state: 'visible', timeout: 30000 });
  await mobile.waitForTimeout(300);
  const dimensions = await mobile.evaluate(() => ({
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (dimensions.documentWidth > dimensions.width + 3) {
    throw new Error(`Desbordamiento horizontal en móvil: ${JSON.stringify(dimensions)}`);
  }

  if (errors.length) throw new Error('Errores JavaScript del navegador:\n' + errors.join('\n---\n'));
  if (failedResources.length) throw new Error('Recursos con error HTTP:\n' + failedResources.join('\n'));

  console.log('Prueba de navegador: OK · Inicio montado · Programación 2D/3D y Colisiones navegables · prefijo Pages conservado · móvil sin desplazamiento horizontal.');
} finally {
  await browser.close();
}
