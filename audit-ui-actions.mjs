import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const filePath = join(dir, name);
    if (statSync(filePath).isDirectory()) walk(filePath);
    else if (/\.tsx$/i.test(name)) files.push(filePath);
  }
}

walk(root);

const findings = [];
let buttons = 0;
let forms = 0;
let inputs = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(root, file);

  for (const match of text.matchAll(/<button\b([^>]*)>/g)) {
    buttons += 1;
    const attrs = match[1];
    if (!/onClick=|type=["']submit["']|form=|disabled/.test(attrs)) {
      findings.push({ severity: 'warning', file: rel, kind: 'button', detail: match[0].slice(0, 160) });
    }
  }

  for (const match of text.matchAll(/<form\b([^>]*)>/g)) {
    forms += 1;
    if (!/onSubmit=/.test(match[1])) {
      findings.push({ severity: 'warning', file: rel, kind: 'form', detail: 'Formulario sin onSubmit explícito' });
    }
  }

  inputs += (text.match(/<(input|select|textarea)\b/g) || []).length;
}

const report = {
  generatedAt: new Date().toISOString(),
  root,
  files: files.length,
  buttons,
  forms,
  inputs,
  findings,
};

writeFileSync('UI_ACTION_AUDIT.json', JSON.stringify(report, null, 2));
console.log(`UI audit: ${files.length} TSX · ${buttons} botones · ${forms} formularios · ${inputs} controles · ${findings.length} avisos`);
for (const finding of findings.slice(0, 30)) {
  console.log(`${finding.severity.toUpperCase()} ${finding.file}: ${finding.kind} ${finding.detail}`);
}
process.exitCode = findings.some((finding) => finding.severity === 'error') ? 1 : 0;
