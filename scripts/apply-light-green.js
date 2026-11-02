import fs from 'node:fs';
import path from 'node:path';

const replacements = [
  [/#0A271B/gi, '#15803D'],
  [/#113D2B/gi, '#16A34A'],
  [/#18533B/gi, '#22C55E'],
  [/#05160F/gi, '#166534'],
  [/#064E3B/gi, '#15803D'],
  [/#2E5E28/gi, '#22C55E'],
  [/rgba\(\s*10\s*,\s*39\s*,\s*27\s*,/g, 'rgba(22, 163, 74,'],
  [/doc\.setFillColor\(10,\s*39,\s*27\);/g, 'doc.setFillColor(22, 163, 74);'],
];

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        processDir(fullPath);
      }
    } else if (/\.(tsx|ts|css|html|svg)$/i.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      for (const [pattern, replacement] of replacements) {
        const next = content.replace(pattern, replacement);
        if (next !== content) {
          content = next;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`[UPDATED] ${path.relative('.', fullPath)}`);
      }
    }
  }
}

console.log('Starting light green color theme replacement...');
processDir(path.resolve('src'));
processDir(path.resolve('public'));

const indexHtmlPath = path.resolve('index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf-8');
  html = html.replace(/#113D2B/gi, '#16A34A');
  fs.writeFileSync(indexHtmlPath, html, 'utf-8');
  console.log('[UPDATED] index.html');
}

console.log('All dark green colors successfully transformed to light green!');
