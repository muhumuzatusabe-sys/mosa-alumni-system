import fs from 'node:fs';
import path from 'node:path';

// Rich institutional green palette (darker than previous Kelly/lime green, but distinctly green, not black)
// #166534 = Green-800 (Rich Prestige Academic Green, RGB 22, 101, 52)
// #15803D = Green-700 (Forest Green Highlight, RGB 21, 128, 61)
// #14532D = Green-900 (Deep Bottle Green for gradient shadows, RGB 20, 83, 45)
const replacements = [
  // Darken overly bright / neon light greens
  [/#22C55E/gi, '#15803D'],
  [/#16A34A/gi, '#166534'],
  // Deepen original murky darks to rich institutional green
  [/#0A271B/gi, '#166534'],
  [/#113D2B/gi, '#166534'],
  [/#18533B/gi, '#15803D'],
  [/#05160F/gi, '#14532D'],
  [/#064E3B/gi, '#166534'],
  [/#2E5E28/gi, '#15803D'],
  // RGBA replacements
  [/rgba\(\s*22\s*,\s*163\s*,\s*74\s*,/g, 'rgba(22, 101, 52,'],
  [/rgba\(\s*10\s*,\s*39\s*,\s*27\s*,/g, 'rgba(22, 101, 52,'],
  // PDF generator fill colors
  [/doc\.setFillColor\(22,\s*163,\s*74\);/g, 'doc.setFillColor(22, 101, 52);'],
  [/doc\.setFillColor\(10,\s*39,\s*27\);/g, 'doc.setFillColor(22, 101, 52);'],
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

console.log('Tuning green palette to rich institutional medium-dark green (#166534 / #15803D)...');
processDir(path.resolve('src'));
processDir(path.resolve('public'));

const indexHtmlPath = path.resolve('index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf-8');
  html = html.replace(/#16A34A|#22C55E|#113D2B/gi, '#166534');
  fs.writeFileSync(indexHtmlPath, html, 'utf-8');
  console.log('[UPDATED] index.html');
}

console.log('Green color palette tuned to rich institutional dark green successfully!');
