import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('site');
const required = [
  'index.html',
  '404.html',
  '.nojekyll',
  'assets/index-BejcmiWV.js',
  'assets/index-kS27Z77S.css',
  'assets/concept-two-v024.css',
  'assets/boot-guard.js',
  'assets/navigation-v024.js',
];
const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Falta el archivo obligatorio: ${file}`);
}
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const index = read('index.html');
const fallback = read('404.html');
if (!index.includes('id="root"')) failures.push('index.html no contiene #root.');
if (!index.includes('location.hostname.endsWith(\'.github.io\')')) failures.push('index.html no calcula la base de GitHub Pages.');
if (fallback !== index) failures.push('404.html no coincide con index.html; las rutas directas pueden fallar.');
const htmlResources = [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((value) => !/^(?:https?:|data:|#|javascript:)/i.test(value));
for (const resource of htmlResources) {
  const relative = resource.split(/[?#]/, 1)[0].replace(/^\.\//, '').replace(/^\//, '');
  if (relative && !fs.existsSync(path.join(root, relative))) failures.push(`Recurso HTML no encontrado: ${resource}`);
}

const bundle = read('assets/index-BejcmiWV.js');
const dependencies = new Set(
  [...bundle.matchAll(/["'`](assets\/[^"'`]+?\.(?:js|css|png|svg|woff2?|json))["'`]/g)]
    .map((match) => match[1])
);
for (const dependency of dependencies) {
  if (!fs.existsSync(path.join(root, dependency))) failures.push(`Dependencia del bundle no encontrada: ${dependency}`);
}
if (!bundle.includes('new URL(e,new URL("../",import.meta.url)).pathname')) {
  failures.push('El cargador de módulos no conserva la ruta base de GitHub Pages.');
}
const guard = read('assets/boot-guard.js');
for (const fragment of ['.startup-splash', '.module-loader', '15000', 'unhandledrejection']) {
  if (!guard.includes(fragment)) failures.push(`El diagnóstico de arranque no cubre: ${fragment}`);
}
for (const cssFile of ['assets/index-kS27Z77S.css', 'assets/concept-two-v024.css']) {
  const css = read(cssFile);
  for (const match of css.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/g)) {
    const url = match[1].trim();
    if (/^(?:data:|https?:|#)/i.test(url)) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(cssFile), url.split(/[?#]/, 1)[0]));
    if (!fs.existsSync(path.join(root, target))) failures.push(`Recurso CSS no encontrado en ${cssFile}: ${url}`);
  }
}

if (failures.length) {
  console.error('Verificación de Plegar Pro: FALLÓ');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Verificación de Plegar Pro: OK · ${dependencies.size} referencias de módulos comprobadas · ${required.length} archivos esenciales presentes · rutas SPA y diagnóstico de arranque comprobados.`);
