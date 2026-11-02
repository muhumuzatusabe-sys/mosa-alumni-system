import fs from 'node:fs';
import path from 'node:path';

// Rich deep dark prestigious institutional green palette
// #0A271B = Deep Academic Forest Green (RGB 10, 39, 27)
// #14532D = Deep Emerald Accent (RGB 20, 83, 45)
// #05160F = Deep Midnight Green for shadow gradients (RGB 5, 22, 15)
// #0F3D24 = Deep Forest Accent (RGB 15, 61, 36)
const replacements = [
  // Deepen medium and light greens to rich deep dark academic green
  [/#22C55E/gi, '#14532D'],
  [/#16A34A/gi, '#0A271B'],
  [/#15803D/gi, '#14532D'],
  [/#166534/gi, '#0A271B'],
  [/#18533B/gi, '#0F3D24'],
  [/#064E3B/gi, '#0A271B'],
  [/#2E5E28/gi, '#14532D'],
  // RGBA replacements
  [/rgba\(\s*22\s*,\s*101\s*,\s*52\s*,/g, 'rgba(10, 39, 27,'],
  [/rgba\(\s*21\s*,\s*128\s*,\s*61\s*,/g, 'rgba(20, 83, 45,'],
  [/rgba\(\s*22\s*,\s*163\s*,\s*74\s*,/g, 'rgba(10, 39, 27,'],
  // PDF generator fill colors
  [/doc\.setFillColor\(22,\s*101,\s*52\);/g, 'doc.setFillColor(10, 39, 27);'],
  [/doc\.setFillColor\(22,\s*163,\s*74\);/g, 'doc.setFillColor(10, 39, 27);'],
];

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        processDir(fullPath);
      }
    } else if (/\.(tsx|ts|css|html|svg|json)$/i.test(entry.name)) {
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

console.log('Deepening green palette to rich deep dark prestigious green (#0A271B / #14532D)...');
processDir(path.resolve('src'));
processDir(path.resolve('public'));

const indexHtmlPath = path.resolve('index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf-8');
  html = html.replace(/#16A34A|#22C55E|#166534|#15803D/gi, '#0A271B');
  fs.writeFileSync(indexHtmlPath, html, 'utf-8');
  console.log('[UPDATED] index.html theme-color');
}

console.log('Green color palette darkened to rich deep dark institutional green successfully!');
