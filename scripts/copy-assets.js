import fs from 'node:fs';
import path from 'node:path';

// Source logo uploaded by user
const srcLogo = 'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793538050535.jpg';

const publicImagesDir = path.resolve('public/images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

const destJpg = path.resolve('public/images/mosa-logo.jpg');
const destPng = path.resolve('public/images/mosa-logo.png');
const destFavicon = path.resolve('public/favicon.png');
const destFaviconIco = path.resolve('public/favicon.ico');

if (fs.existsSync(srcLogo)) {
  fs.copyFileSync(srcLogo, destJpg);
  fs.copyFileSync(srcLogo, destPng);
  fs.copyFileSync(srcLogo, destFavicon);
  fs.copyFileSync(srcLogo, destFaviconIco);
  console.log('[OK] Copied official Mandela Secondary School Hoima logo to:');
  console.log('     -> public/images/mosa-logo.jpg');
  console.log('     -> public/images/mosa-logo.png');
  console.log('     -> public/favicon.png');

  // Point to public logo asset to ensure lightning fast, crash-free compilation
  try {
    const tsCode = `// Official Mandela Secondary School Hoima logo URL\nexport const MOSA_OFFICIAL_LOGO_DATA_URL = '/images/mosa-logo.png';\nexport default MOSA_OFFICIAL_LOGO_DATA_URL;\n`;
    fs.writeFileSync(path.resolve('src/utils/mosaLogoDataUrl.ts'), tsCode, 'utf-8');
    console.log('[OK] Generated src/utils/mosaLogoDataUrl.ts with image reference');

    // Also write clean mosa-logo.svg referencing the official logo
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230" width="200" height="230"><image href="/images/mosa-logo.png" x="0" y="0" width="200" height="230" preserveAspectRatio="xMidYMid meet" /></svg>`;
    fs.writeFileSync(path.resolve('public/images/mosa-logo.svg'), svgCode, 'utf-8');
    console.log('[OK] Overwrote public/images/mosa-logo.svg with official logo reference');
  } catch (err) {
    console.warn('Could not configure logo modules:', err);
  }
} else {
  console.warn('[WARNING] Source logo file not found at:', srcLogo);
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
