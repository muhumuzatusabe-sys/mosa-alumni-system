/**
 * Official Crest, Watermark and Signature Graphics for Mandela Old Students Association (MOSA)
 * Mandela Secondary School Hoima (MASSH) - "Caring to Achieve"
 */

export const MOSA_COLORS = {
  creamBg: '#F4F6EA',         // Pale ivory/cream card background matching official ID card
  navyDeep: '#0B203E',        // Deep Midnight Navy (#0B203E)
  navyHeader: '#0B203E',      // Heading dark navy
  limeAccent: '#D2E038',      // Bright lime-yellow border arc curve
  greenBadge: '#3B873E',      // Green "Membership ID Card" pill badge
  greenCorner: '#48A04C',     // Green QR corner framing brackets
  grayLabel: '#475569',       // Field label gray (#475569)
  textDark: '#0B203E',        // Field text dark navy
  white: '#FFFFFF',
  blueSignature: '#1D4ED8',   // Blue ballpoint ink signature
  crestGreen: '#2E6330',      // Crest official green
  crestYellow: '#DCE842',     // Crest center lime-yellow
};

import { MOSA_OFFICIAL_LOGO_DATA_URL } from './mosaLogoDataUrl';

/**
 * Returns an SVG string of the Mandela Secondary School Hoima official crest.
 * Matches the official badge with MANDELA SECONDARY SCHOOL, open book, crested crane with pen,
 * and CARING TO ACHIEVE bottom ribbon banner.
 */
export function getMosaCrestSvg(size = 140): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230" width="${size}" height="${size * 1.15}">
    <image href="${MOSA_OFFICIAL_LOGO_DATA_URL}" x="0" y="0" width="200" height="230" preserveAspectRatio="xMidYMid meet" />
  </svg>`;
}

/**
 * Returns an SVG of the authentic blue ink signature matching the official ID card template.
 */
export function getMosaSignatureSvg(color = '#1D4ED8', width = 110, height = 45): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 45" width="${width}" height="${height}">
    <!-- Fluid cursive signature flourish with loop, underline and accent dot -->
    <path d="M 10 26 Q 20 8 28 12 Q 32 16 30 30 Q 28 38 36 30 Q 42 22 47 10 Q 51 4 54 12 Q 57 22 64 24 Q 72 26 88 22" 
          fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Underline stroke -->
    <path d="M 34 35 Q 58 34 82 35" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <!-- Flourish dot -->
    <circle cx="86" cy="34" r="1.8" fill="${color}"/>
  </svg>`;
}

/**
 * Watermark SVG for faint background printing on card front and card back.
 */
export function getMosaWatermarkSvg(width = 320, height = 320, opacity = 0.08): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230" width="${width}" height="${height}" opacity="${opacity}">
    <g fill="none" stroke="#2E6330" stroke-width="2.5">
      <circle cx="100" cy="100" r="76"/>
      <circle cx="100" cy="100" r="54"/>
      <!-- Book -->
      <path d="M 70 118 Q 85 110 100 118 Q 115 110 130 118 L 127 130 Q 115 122 100 128 Q 85 122 73 130 Z"/>
      <!-- Ribbon -->
      <path d="M 25 173 Q 100 167 175 173 L 172 198 Q 100 191 28 198 Z"/>
    </g>
    <text x="100" y="190" font-family="'Montserrat', 'Arial', sans-serif" font-size="11" font-weight="900" fill="#2E6330" text-anchor="middle" letter-spacing="1">
      CARING TO ACHIEVE
    </text>
  </svg>`;
}

/**
 * Converts an SVG string into a data URL for <img> tags and canvas drawing.
 */
export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
