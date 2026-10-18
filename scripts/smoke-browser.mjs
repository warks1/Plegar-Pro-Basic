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
    // La navegación se comprueba desde la SPA: el menú lateral tiene su propio
    // contenedor desplazable y los enlaces pueden estar fuera de la zona visible.
    const routeLink = page.locator('.approved-nav a').filter({ hasText: route.label }).first();
    await routeLink.waitFor({ state: 'attached', timeout: 10000 });
    const navigationDebug = await routeLink.evaluate((el) => {
      const inspect = (node) => {
        if (!node) return null;
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return {
          tag: node.tagName, className: node.className,
          display: style.display, visibility: style.visibility, opacity: style.opacity,
          position: style.position, overflowY: style.overflowY,
          width: Math.round(rect.width), height: Math.round(rect.height),
          x: Math.round(rect.x), y: Math.round(rect.y),
          clientRects: node.getClientRects().length,
          scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
        };
      };
      return {
        link: inspect(el), nav: inspect(el.closest('.approved-nav')),
        sidebar: inspect(el.closest('.approved-sidebar')),
        shell: inspect(el.closest('.app-shell')),
        viewport: { width: innerWidth, height: innerHeight },
        href: el.getAttribute('href'), text: el.innerText,
      };
    });
    console.log('DIAGNÓSTICO MENÚ ' + route.suffix + ': ' + JSON.stringify(navigationDebug));
    await routeLink.scrollIntoViewIfNeeded({ timeout: 10000 });
    await routeLink.click({ timeout: 10000 });
    await page.waitForURL((url) => url.pathname.endsWith(route.suffix), { timeout: 15000 });
    await page.locator('.content').waitFor({ state: 'visible', timeout: 15000 });
    const path = new URL(page.url()).pathname;
    if (expectedBase && !path.startsWith(expectedBase + '/')) {
      throw new Error(`La navegación ha escapado del prefijo de GitHub Pages: ${path}`);
    }
    await page.waitForTimeout(900);
    const routeDiagnostic = await page.evaluate(() => ({
      url: location.href,
      rootText: document.getElementById('root')?.innerText?.slice(0, 1800) || '',
      rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 2400) || '',
      contentCount: document.querySelectorAll('.content').length,
      appError: document.querySelector('.app-error')?.innerText?.slice(0, 1200) || '',
      loader: document.querySelector('.module-loader')?.innerText || '',
    }));
    if (routeDiagnostic.appError) {
      throw new Error(`El módulo ${route.suffix} muestra un error de React:\\n${JSON.stringify(routeDiagnostic, null, 2)}`);
    }
    if (!routeDiagnostic.contentCount) {
      throw new Error(`El módulo ${route.suffix} ha perdido el contenedor .content:\\n${JSON.stringify(routeDiagnostic, null, 2)}`);
    }
    const content = (await page.locator('.content').innerText({ timeout: 3000 })).trim();
    if (!content) throw new Error(`El módulo ${route.suffix} no muestra contenido.\\n${JSON.stringify(routeDiagnostic, null, 2)}`);
    if (routeDiagnostic.loader) {
      throw new Error(`El módulo ${route.suffix} se ha quedado atascado en ${routeDiagnostic.loader}`);
    }
  }

  // Usa una ventana real de 390 CSS px. La emulación isMobile puede cambiar el
  // ancho de diseño de Chromium en CI y dar una falsa alarma de desbordamiento.
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.setViewportSize({ width: 390, height: 844 });
  mobile.on('pageerror', (error) => errors.push(error.stack || error.message));
  await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mobile.waitForTimeout(6000);
  await mobile.setViewportSize({ width: 390, height: 844 });
  const mobileShell = await mobile.locator('.app-shell').count();
  if (!mobileShell) throw new Error('La interfaz no ha montado en móvil. Texto: ' + (await mobile.locator('#root').innerText().catch(()=>'#root no encontrado')));
  const dimensions = await mobile.evaluate(() => {
    const overflowing = [...document.querySelectorAll('body *')].map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName, className: typeof element.className === 'string' ? element.className : '',
        right: Math.round(rect.right), left: Math.round(rect.left),
        width: Math.round(rect.width), display: style.display, minWidth: style.minWidth,
      };
    }).filter((element) => element.right > document.documentElement.clientWidth + 3 && element.width > 0)
      .sort((a, b) => b.right - a.right).slice(0, 12);
    return {
      width: window.innerWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      screenWidth: screen.width,
      visualViewportWidth: window.visualViewport?.width ?? null,
      devicePixelRatio: window.devicePixelRatio,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null,
      matchesMobile: window.matchMedia('(max-width: 700px)').matches,
      overflowing,
    };
  });
  console.log('DIAGNÓSTICO MÓVIL: ' + JSON.stringify(dimensions));
  if (dimensions.documentWidth > (dimensions.documentClientWidth || dimensions.width) + 3) {
    throw new Error(`Desbordamiento horizontal en móvil: ${JSON.stringify(dimensions)}`);
  }

  // Comprueba la interacción real del menú superpuesto en una pantalla móvil.
  const mobileMenuButton = mobile.locator('.menu-button').first();
  const mobileSidebar = mobile.locator('.approved-sidebar, .sidebar').first();
  await mobileMenuButton.waitFor({ state: 'visible', timeout: 10000 });
  await mobileMenuButton.click();
  await mobile.waitForTimeout(200);
  const menuOpened = await mobileSidebar.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
  });
  if (!menuOpened) throw new Error('El menú lateral no se abre en móvil al pulsar el botón.');
  const mobileRouteLink = mobile.locator('.approved-nav a').filter({ hasText: /Programación 2D/ }).first();
  await mobileRouteLink.waitFor({ state: 'attached', timeout: 10000 });
  await mobileRouteLink.click();
  await mobile.waitForURL((url) => url.pathname.endsWith('/programacion-2d'), { timeout: 15000 });
  await mobile.waitForTimeout(250);
  const menuClosed = await mobileSidebar.evaluate((el) => getComputedStyle(el).display === 'none');
  if (!menuClosed) throw new Error('El menú lateral no se cierra después de seleccionar una sección en móvil.');

  // Reutiliza la misma aplicación para revisar un ancho típico de tableta.
  await mobile.setViewportSize({ width: 768, height: 1024 });
  await mobile.waitForTimeout(250);
  const tabletDimensions = await mobile.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  console.log('DIAGNÓSTICO TABLETA: ' + JSON.stringify(tabletDimensions));
  if (tabletDimensions.document > tabletDimensions.viewport + 3 || tabletDimensions.body > tabletDimensions.viewport + 3) {
    throw new Error(`Desbordamiento horizontal en tableta: ${JSON.stringify(tabletDimensions)}`);
  }

  if (errors.length) throw new Error('Errores JavaScript del navegador:\\n' + errors.join('\\n---\\n'));
  if (consoleMessages.length) throw new Error('Errores de consola del navegador:\\n' + consoleMessages.join('\\n---\\n'));
  if (failedResources.length) throw new Error('Recursos con error HTTP o de red:\\n' + failedResources.join('\\n'));

  console.log('Prueba de navegador: OK · Inicio montado · Programación 2D/3D y Colisiones navegables · prefijo Pages conservado · móvil sin desbordamiento horizontal.');
} finally {
  await browser.close();
}
