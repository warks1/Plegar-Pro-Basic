import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', 'site', 'assets']);
const sourceExtensions = new Set(['.ts', '.tsx', '.jsx']);
const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '.json'];
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await walk(path.join(directory, entry.name));
    } else if (sourceExtensions.has(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      files.push(path.join(directory, entry.name));
    }
  }
}

await walk(root);
const unresolved = [];
let importCount = 0;

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const specifiers = new Set([
    ...[...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map(match => match[1]),
    ...[...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match => match[1]),
    ...[...source.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)].map(match => match[1]),
  ]);
  for (const specifier of specifiers) {
    if (!specifier.startsWith('.')) continue;
    importCount++;
    const base = path.resolve(path.dirname(file), specifier);
    let found = false;
    for (const extension of extensions) {
      try { await access(base + extension); found = true; break; } catch {}
    }
    if (!found) {
      for (const indexFile of ['index.tsx', 'index.ts', 'index.jsx', 'index.js']) {
        try { await access(path.join(base, indexFile)); found = true; break; } catch {}
      }
    }
    if (!found) unresolved.push({ file: path.relative(root, file), specifier });
  }
}

if (unresolved.length) {
  console.error('Auditoría de imports: ' + unresolved.length + ' importaciones locales sin destino entre ' + files.length + ' archivos fuente:');
  for (const item of unresolved) console.error(' - ' + item.file + ': ' + item.specifier);
  process.exitCode = 1;
} else {
  console.log('Auditoría de imports: OK · ' + importCount + ' importaciones locales comprobadas en ' + files.length + ' archivos fuente.');
}
