import fs from 'node:fs';
import path from 'node:path';

// Source 3D MOSA app icon uploaded by user
const candidateSources = [
  'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793653542746.jpg',
  'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793538050535.jpg',
];

const srcLogo = candidateSources.find(p => fs.existsSync(p));

const publicImagesDir = path.resolve('public/images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

const destJpg = path.resolve('public/images/mosa-logo.jpg');
const destPng = path.resolve('public/images/mosa-logo.png');
const destAppIconPng = path.resolve('public/images/app-icon.png');
const destAppIconJpg = path.resolve('public/images/app-icon.jpg');
const destFavicon = path.resolve('public/favicon.png');
const destFaviconIco = path.resolve('public/favicon.ico');

if (srcLogo && fs.existsSync(srcLogo)) {
  fs.copyFileSync(srcLogo, destJpg);
  fs.copyFileSync(srcLogo, destPng);
  fs.copyFileSync(srcLogo, destAppIconPng);
  fs.copyFileSync(srcLogo, destAppIconJpg);
  fs.copyFileSync(srcLogo, destFavicon);
  fs.copyFileSync(srcLogo, destFaviconIco);
  console.log('[OK] Copied new official 3D MOSA app icon to:');
  console.log('     -> public/images/mosa-logo.jpg');
  console.log('     -> public/images/mosa-logo.png');
  console.log('     -> public/images/app-icon.png');
  console.log('     -> public/favicon.png');
  console.log('     -> public/favicon.ico');

  // Point to public logo asset to ensure lightning fast, crash-free compilation
  try {
    const tsCode = `// Official 3D MOSA app icon\nexport const MOSA_OFFICIAL_LOGO_DATA_URL = '/images/mosa-logo.png';\nexport default MOSA_OFFICIAL_LOGO_DATA_URL;\n`;
    fs.writeFileSync(path.resolve('src/utils/mosaLogoDataUrl.ts'), tsCode, 'utf-8');
    console.log('[OK] Generated src/utils/mosaLogoDataUrl.ts with image reference');

    // Also write clean mosa-logo.svg and favicon.svg referencing the official app icon
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="/images/mosa-logo.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" /></svg>`;
    fs.writeFileSync(path.resolve('public/images/mosa-logo.svg'), svgCode, 'utf-8');
    fs.writeFileSync(path.resolve('public/favicon.svg'), svgCode, 'utf-8');
    console.log('[OK] Overwrote public/images/mosa-logo.svg & public/favicon.svg with official 3D MOSA app icon');
  } catch (err) {
    console.warn('Could not configure logo modules:', err);
  }
} else {
  console.warn('[WARNING] Source app icon file not found at:', srcLogo);
}

// Synchronize public directory directly into dist
try {
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true, force: true });
    console.log('[OK] Pre-synced public assets into ./dist');
  }
} catch (err) {
  console.warn('Note: dist sync skipped:', err?.message || err);
}
