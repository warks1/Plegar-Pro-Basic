import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerPath = path.join(root, 'router.tsx');
const router = await (await import('node:fs/promises')).readFile(routerPath, 'utf8');
const specifiers = new Set([
  ...[...router.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map(match => match[1]),
  ...[...router.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match => match[1]),
]);
const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '.json'];
const missing = [];

for (const specifier of specifiers) {
  if (!specifier.startsWith('.')) continue;
  const base = path.resolve(path.dirname(routerPath), specifier);
  let found = false;
  for (const extension of extensions) {
    try {
      await access(base + extension);
      found = true;
      break;
    } catch {}
  }
  if (!found) missing.push(specifier);
}

if (missing.length) {
  console.error('Importaciones locales sin archivo de destino en router.tsx:');
  for (const specifier of missing) console.error(` - ${specifier}`);
  process.exitCode = 1;
} else {
  console.log(`Auditoría del enrutador: OK · ${specifiers.size} importaciones con destino comprobado.`);
}
