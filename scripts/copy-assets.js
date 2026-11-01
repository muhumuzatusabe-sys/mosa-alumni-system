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

  // Generate base64 TypeScript module so PDFs & offline cards have zero latency
  try {
    const buffer = fs.readFileSync(srcLogo);
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    const tsCode = `// Auto-generated official Mandela Secondary School Hoima logo data URI\nexport const MOSA_OFFICIAL_LOGO_DATA_URL = ${JSON.stringify(base64)};\nexport default MOSA_OFFICIAL_LOGO_DATA_URL;\n`;
    fs.writeFileSync(path.resolve('src/utils/mosaLogoDataUrl.ts'), tsCode, 'utf-8');
    console.log('[OK] Generated src/utils/mosaLogoDataUrl.ts with base64 data URI');
  } catch (err) {
    console.warn('Could not generate base64 module:', err);
  }
} else {
  console.warn('[WARNING] Source logo file not found at:', srcLogo);
}
