/**
 * Official Crest and Signature Graphics for Mandela Old Students Association (MOSA)
 * Mandela Secondary School Hoima (MASSH) - Founded 1997
 */

export const MOSA_COLORS = {
  creamBg: '#F8F6F0',         // Pale ivory/cream background
  navyDeep: '#113D2B',        // Deep MASSH Forest Green
  navyHeader: '#0A271B',      // Heading dark green
  limeAccent: '#D2E038',      // Bright lime-yellow border arc
  greenBadge: '#2E7D32',      // Green "Membership ID Card" pill badge
  greenCorner: '#1B5E20',     // Green QR corner brackets
  grayLabel: '#4B6354',       // Field label sage gray
  textDark: '#0B271C',        // Field text dark evergreen
  white: '#FFFFFF',
  goldBorder: '#C68A24',
};

/**
 * Returns an SVG string of the Mandela Secondary School Hoima official crest.
 */
export function getMosaCrestSvg(size = 120): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" width="${size}" height="${size}">
    <defs>
      <!-- Circular text path -->
      <path id="crestCircle" d="M 28 80 A 52 52 0 1 1 132 80" fill="none"/>
      <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE047"/>
        <stop offset="100%" stop-color="#EAB308"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Shield / Circle with Green Ring -->
    <circle cx="80" cy="76" r="54" fill="#FFFFFF" stroke="#4E8746" stroke-width="4.5"/>
    <circle cx="80" cy="76" r="46.5" fill="none" stroke="#4E8746" stroke-width="1.5"/>

    <!-- School Motto / Name along arc -->
    <text font-family="'Montserrat', 'Arial', sans-serif" font-size="9" font-weight="800" fill="#2E5E28" letter-spacing="0.8">
      <textPath href="#crestCircle" startOffset="50%" text-anchor="middle">
        MANDELA SECONDARY SCHOOL
      </textPath>
    </text>

    <!-- Inner Shield Background -->
    <path d="M 52 64 Q 80 60 108 64 Q 108 92 80 110 Q 52 92 52 64 Z" fill="url(#crestGold)" stroke="#3E6F37" stroke-width="2"/>

    <!-- Open Book in Shield -->
    <path d="M 60 84 Q 72 78 80 84 Q 88 78 100 84 L 98 94 Q 88 88 80 94 Q 72 88 62 94 Z" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="1.2"/>
    <line x1="80" y1="84" x2="80" y2="94" stroke="#1E3A8A" stroke-width="1.2"/>

    <!-- Bunyoro Crane / Torch Silhouette -->
    <path d="M 80 63 L 83 72 L 77 72 Z" fill="#DC2626"/>
    <path d="M 78 72 L 82 72 L 80 81 Z" fill="#4B5563"/>
    <ellipse cx="80" cy="62" rx="2.5" ry="4" fill="#F59E0B"/>

    <!-- Bottom Ribbon with Motto "CARING TO ACHIEVE" -->
    <g transform="translate(0, 10)">
      <path d="M 32 124 Q 80 116 128 124 L 122 136 Q 80 128 38 136 Z" fill="#FFFFFF" stroke="#4E8746" stroke-width="2.5"/>
      <path d="M 32 124 L 24 130 L 38 136 Z" fill="#E2E8F0" stroke="#4E8746" stroke-width="1.5"/>
      <path d="M 128 124 L 136 130 L 122 136 Z" fill="#E2E8F0" stroke="#4E8746" stroke-width="1.5"/>
      <text x="80" y="131" font-family="'Montserrat', 'Arial', sans-serif" font-size="8.5" font-weight="900" fill="#2E5E28" text-anchor="middle" letter-spacing="0.5">
        CARING TO ACHIEVE
      </text>
    </g>
  </svg>`;
}

/**
 * Returns an SVG of the approved signature stroke matching the template.
 */
export function getMosaSignatureSvg(color = '#133256', width = 110, height = 45): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 45" width="${width}" height="${height}">
    <!-- Fluid cursive signature flourish with loop, underline and accent dot -->
    <path d="M 8 28 Q 18 10 26 14 Q 30 18 28 32 Q 26 40 34 32 Q 40 24 45 12 Q 49 6 52 14 Q 55 24 62 26 Q 70 28 85 24" 
          fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Underline stroke -->
    <path d="M 32 36 Q 55 35 78 36" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Flourish dot -->
    <circle cx="82" cy="35" r="1.6" fill="${color}"/>
  </svg>`;
}

/**
 * Watermark SVG for faint background printing.
 */
export function getMosaWatermarkSvg(width = 300, height = 300, opacity = 0.07): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" width="${width}" height="${height}" opacity="${opacity}">
    <g fill="none" stroke="#2E5E28" stroke-width="2">
      <circle cx="80" cy="76" r="54"/>
      <circle cx="80" cy="76" r="46.5"/>
      <path d="M 52 64 Q 80 60 108 64 Q 108 92 80 110 Q 52 92 52 64 Z"/>
      <path d="M 60 84 Q 72 78 80 84 Q 88 78 100 84 L 98 94 Q 88 88 80 94 Q 72 88 62 94 Z"/>
    </g>
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
