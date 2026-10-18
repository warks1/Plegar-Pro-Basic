import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 43186;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['servidor-plegar-pro.mjs', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.setEncoding('utf8').on('data', (chunk) => { logs += chunk; });
server.stderr.setEncoding('utf8').on('data', (chunk) => { logs += chunk; });

async function request(path) {
  return fetch(new URL(path, origin), { signal: AbortSignal.timeout(1500) });
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`El servidor terminó con código ${server.exitCode}.\n${logs}`);
    try {
      const response = await request('/');
      if (response.status === 200) { ready = true; break; }
    } catch {}
    await delay(250);
  }
  if (!ready) throw new Error(`El servidor no respondió en 7,5 segundos.\n${logs}`);

  const checks = [
    ['/', 200, 'text/html', 'id="root"'],
    ['/colisiones', 200, 'text/html', 'id="root"'],
    ['/assets/index-BejcmiWV.js', 200, 'javascript', ''],
    ['/assets/index-kS27Z77S.css', 200, 'text/css', ''],
    ['/assets/asset-que-no-existe.js', 404, 'text/plain', 'Not found'],
    ['/%2e%2e%2fpackage.json', 403, '', ''],
  ];
  for (const [route, expectedStatus, contentType, expectedText] of checks) {
    const response = await request(route);
    const body = await response.text();
    if (response.status !== expectedStatus) {
      throw new Error(`${route}: HTTP ${response.status}; se esperaba ${expectedStatus}.`);
    }
    if (contentType && !response.headers.get('content-type')?.includes(contentType)) {
      throw new Error(`${route}: Content-Type inesperado: ${response.headers.get('content-type')}`);
    }
    if (expectedText && !body.includes(expectedText)) {
      throw new Error(`${route}: el contenido esperado no está presente.`);
    }
  }
  console.log('Smoke test estático: OK · portada, ruta SPA, JS, CSS y bloqueo de traversal comprobados.');
} catch (error) {
  console.error(`Smoke test estático: FALLÓ · ${error.message}`);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    delay(1500),
  ]);
}
