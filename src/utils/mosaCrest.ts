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

/**
 * Returns an SVG string of the Mandela Secondary School Hoima official crest.
 * Matches the official badge with MANDELA SECONDARY SCHOOL, open book, crested crane with pen,
 * and CARING TO ACHIEVE bottom ribbon banner.
 */
export function getMosaCrestSvg(size = 140): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230" width="${size}" height="${size * 1.15}">
    <defs>
      <!-- Top Arc for "MANDELA" -->
      <path id="topArc" d="M 40 100 A 62 62 0 0 1 160 100" fill="none"/>
      <!-- Bottom Arc for "SECONDARY SCHOOL" -->
      <path id="bottomArc" d="M 162 104 A 64 64 0 0 1 38 104" fill="none"/>
      <!-- Gradient for subtle luster on inner yellow shield/circle -->
      <linearGradient id="crestYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E8F255"/>
        <stop offset="100%" stop-color="#D0DC33"/>
      </linearGradient>
    </defs>

    <!-- Outer Circular Ring with Dark Green Border -->
    <circle cx="100" cy="100" r="76" fill="#FFFFFF" stroke="#2E6330" stroke-width="5"/>
    <circle cx="100" cy="100" r="54" fill="url(#crestYellowGrad)" stroke="#2E6330" stroke-width="3"/>

    <!-- Circular Ring Text: MANDELA (Top) -->
    <text font-family="'Montserrat', 'Arial Black', sans-serif" font-size="15.5" font-weight="900" fill="#2E6330" letter-spacing="3.5">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">
        MANDELA
      </textPath>
    </text>

    <!-- Circular Ring Text: SECONDARY SCHOOL (Bottom) -->
    <text font-family="'Montserrat', 'Arial', sans-serif" font-size="10.8" font-weight="800" fill="#2E6330" letter-spacing="1.2">
      <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">
        SECONDARY SCHOOL
      </textPath>
    </text>

    <!-- Center Graphic: Open Book & Uganda Crested Crane with Pen -->
    <g transform="translate(100, 102)">
      <!-- Open Book (White pages with green contour lines) -->
      <path d="M -30 16 Q -15 8 0 16 Q 15 8 30 16 L 27 28 Q 15 20 0 26 Q -15 20 -27 28 Z" fill="#FFFFFF" stroke="#2E6330" stroke-width="2.2" stroke-linejoin="round"/>
      <line x1="0" y1="16" x2="0" y2="26" stroke="#2E6330" stroke-width="2.2"/>
      <!-- Page text lines -->
      <line x1="-22" y1="18" x2="-6" y2="15" stroke="#2E6330" stroke-width="1.2" opacity="0.8"/>
      <line x1="-21" y1="22" x2="-6" y2="19" stroke="#2E6330" stroke-width="1.2" opacity="0.8"/>
      <line x1="6" y1="15" x2="22" y2="18" stroke="#2E6330" stroke-width="1.2" opacity="0.8"/>
      <line x1="6" y1="19" x2="21" y2="22" stroke="#2E6330" stroke-width="1.2" opacity="0.8"/>

      <!-- Stylized Crested Crane Body & Head -->
      <!-- Legs standing on book -->
      <line x1="-3" y1="8" x2="-3" y2="15" stroke="#2E6330" stroke-width="2"/>
      <line x1="3" y1="8" x2="4" y2="15" stroke="#2E6330" stroke-width="2"/>
      <!-- Body -->
      <ellipse cx="0" cy="1" rx="9" ry="12" fill="#2E6330"/>
      <!-- Wing curve -->
      <path d="M -5 -2 Q 0 6 7 2" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
      <!-- Long graceful neck -->
      <path d="M 0 -8 Q 2 -18 7 -22" fill="none" stroke="#2E6330" stroke-width="4" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="8" cy="-24" r="4.5" fill="#2E6330"/>
      <!-- Beak -->
      <path d="M 12 -23 L 20 -21 L 12 -21 Z" fill="#1B421E"/>
      <!-- Crown / Crest plume on head -->
      <path d="M 7 -28 L 5 -34 M 8 -28 L 8 -35 M 10 -28 L 12 -34 M 11 -28 L 14 -32" stroke="#2E6330" stroke-width="1.6" stroke-linecap="round"/>
      
      <!-- Fountain Pen held by bird writing onto the book -->
      <line x1="16" y1="-21" x2="19" y2="14" stroke="#1B421E" stroke-width="2" stroke-linecap="round"/>
      <!-- Pen nib -->
      <polygon points="19,14 17,18 21,18" fill="#1B421E"/>
    </g>

    <!-- Bottom Ribbon with School Motto "CARING TO ACHIEVE" -->
    <g transform="translate(100, 185)">
      <!-- Ribbon Banner Tails (Left and Right fishtail folds) -->
      <path d="M -88 0 L -70 -12 L -70 12 Z" fill="#E2E8F0" stroke="#2E6330" stroke-width="2.5"/>
      <path d="M 88 0 L 70 -12 L 70 12 Z" fill="#E2E8F0" stroke="#2E6330" stroke-width="2.5"/>
      
      <!-- Main Ribbon Body -->
      <path d="M -75 -12 Q 0 -18 75 -12 L 72 13 Q 0 6 -72 13 Z" fill="#FFFFFF" stroke="#2E6330" stroke-width="3" stroke-linejoin="round"/>
      
      <!-- Ribbon Text "CARING TO ACHIEVE" -->
      <text x="0" y="3.5" font-family="'Montserrat', 'Arial', sans-serif" font-size="12" font-weight="900" fill="#2E6330" text-anchor="middle" letter-spacing="1">
        CARING TO ACHIEVE
      </text>
    </g>
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
