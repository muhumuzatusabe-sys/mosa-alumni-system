import fs from 'node:fs';
import path from 'node:path';

// 1. Official Mandela Secondary School Hoima Crest ("Caring to Achieve")
const crestSources = [
  'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793658780119.jpg',
  'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793538050535.jpg',
];
const srcCrest = crestSources.find(p => fs.existsSync(p));

// 2. Official 3D MOSA App Icon for Mobile & Desktop Home Screens / Favicons
const appIconSources = [
  'C:/Users/HP/.gemini/antigravity-ide/brain/c011802d-8223-4ce3-aa39-8732f114ecbb/.user_uploaded/media_1793653542746.jpg',
];
const srcAppIcon = appIconSources.find(p => fs.existsSync(p));

const publicImagesDir = path.resolve('public/images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// -------------------------------------------------------------
// [A] Restore Mandela Secondary School Crest in Header & System
// -------------------------------------------------------------
if (srcCrest && fs.existsSync(srcCrest)) {
  fs.copyFileSync(srcCrest, path.resolve('public/images/school-crest.png'));
  fs.copyFileSync(srcCrest, path.resolve('public/images/school-crest.jpg'));
  fs.copyFileSync(srcCrest, path.resolve('public/images/mosa-logo.png'));
  fs.copyFileSync(srcCrest, path.resolve('public/images/mosa-logo.jpg'));

  const tsCode = `// Official Mandela Secondary School Hoima Crest ("Caring to Achieve")\nexport const MOSA_OFFICIAL_LOGO_DATA_URL = '/images/school-crest.png';\nexport default MOSA_OFFICIAL_LOGO_DATA_URL;\n`;
  fs.writeFileSync(path.resolve('src/utils/mosaLogoDataUrl.ts'), tsCode, 'utf-8');

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="/images/school-crest.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" /></svg>`;
  fs.writeFileSync(path.resolve('public/images/mosa-logo.svg'), svgCode, 'utf-8');

  console.log('[OK] Restored Mandela Secondary School Crest (Caring to Achieve) to:');
  console.log('     -> public/images/school-crest.png & .jpg');
  console.log('     -> public/images/mosa-logo.png & .jpg (Navbar & Reports)');
} else {
  console.warn('[WARNING] School crest source not found');
}

// -------------------------------------------------------------
// [B] Configure 3D MOSA App Icon for Mobile & Desktop (PWA/Favicon)
// -------------------------------------------------------------
if (srcAppIcon && fs.existsSync(srcAppIcon)) {
  fs.copyFileSync(srcAppIcon, path.resolve('public/images/app-icon.png'));
  fs.copyFileSync(srcAppIcon, path.resolve('public/images/app-icon.jpg'));
  fs.copyFileSync(srcAppIcon, path.resolve('public/favicon.png'));
  fs.copyFileSync(srcAppIcon, path.resolve('public/favicon.ico'));
  fs.copyFileSync(srcAppIcon, path.resolve('public/apple-touch-icon.png'));

  const favSvgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="/images/app-icon.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" /></svg>`;
  fs.writeFileSync(path.resolve('public/favicon.svg'), favSvgCode, 'utf-8');

  console.log('[OK] Configured 3D MOSA App Icon for Mobile & Desktop:');
  console.log('     -> public/images/app-icon.png & .jpg');
  console.log('     -> public/favicon.png & favicon.ico');
  console.log('     -> public/apple-touch-icon.png');
} else {
  console.warn('[WARNING] 3D MOSA App Icon source not found');
}

console.log('[OK] All branding assets synchronized successfully.');
