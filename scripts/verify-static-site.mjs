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
for (const cacheBuster of ['assets/boot-guard.js?v=20261017-startup-2','assets/navigation-v024.js?v=20261018-version-sync','assets/concept-two-v024.css?v=20261018-pc-tablet-mobile-v1']) {
  if (!index.includes(cacheBuster)) failures.push(`Falta actualizar la versión de caché de ${cacheBuster}.`);
}
if (!index.includes('src="./assets/index-BejcmiWV.js"')) failures.push('El bundle principal debe cargarse con la misma URL que usan los módulos internos.');
if (index.includes('index-BejcmiWV.js?')) failures.push('El bundle principal no debe usar un parámetro de caché distinto al de sus importaciones internas.');
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
if (!bundle.includes("basename:document.querySelector(`base`)?.getAttribute(`href`)||`/`")) {
  failures.push('El enrutador no hereda la ruta base del sitio de GitHub Pages.');
}
const guard = read('assets/boot-guard.js');
for (const fragment of ['.startup-splash', '.module-loader', '15000', 'unhandledrejection']) {
  if (!guard.includes(fragment)) failures.push(`El diagnóstico de arranque no cubre: ${fragment}`);
}
const bundleText = read('assets/index-BejcmiWV.js');
if (!bundleText.includes('[`/colisiones`,`Colisiones`')) failures.push('El módulo de colisiones no está accesible desde el menú publicado.');
if (!bundleText.includes('[`Colisiones`,`/colisiones`]')) failures.push('La búsqueda global no ofrece el módulo de colisiones.');
const navigation = read('assets/navigation-v024.js');
const conceptCss = read('assets/concept-two-v024.css');
for (const fragment of ['Restaurar el marco principal', 'limitar las cuadrículas al ancho real del móvil', '.app-shell:has(.pp-workbench){display:grid!important']) {
  if (!conceptCss.includes(fragment)) failures.push(`Falta la corrección de navegación/responsive del workbench: ${fragment}.`);
}
if (!navigation.includes('version&&version.textContent!==versionLabel')) {
  failures.push('El observador de navegación debe evitar volver a escribir el texto de versión.');
}
if (!navigation.includes("v0.24.4 · ESTABILIDAD, AJUSTES Y NAVEGACIÓN PRO")) failures.push('La etiqueta de versión publicada no coincide con la versión 0.24.4 del proyecto.');
if (!navigation.includes('function appBasePath()')) {
  failures.push('El botón Volver no conserva la subruta de GitHub Pages.');
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
