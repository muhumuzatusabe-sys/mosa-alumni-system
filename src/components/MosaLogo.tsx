import React, { useState } from 'react';

interface MosaLogoProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  rounded?: boolean;
}

/**
 * Official Mandela Secondary School Hoima (MASSH) Emblem
 * "Caring to Achieve" - Hoima, Uganda
 */
export const MosaLogo: React.FC<MosaLogoProps> = ({
  size = 40,
  className = '',
  style = {},
  alt = 'Mandela Secondary School Hoima Logo',
  rounded = false,
}) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const sources = [
    '/images/mosa-logo.png',
    '/images/mosa-logo.jpg',
    '/images/mosa-logo.svg',
  ];

  if (sourceIndex >= sources.length) {
    // High-fidelity fallback SVG matching the exact official crest colors
    return (
      <svg
        viewBox="0 0 200 230"
        width={dimension}
        height={dimension}
        className={className}
        style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="76" fill="#FFFFFF" stroke="#137A38" strokeWidth="6" />
        <circle cx="100" cy="100" r="54" fill="#FFDE00" stroke="#137A38" strokeWidth="3" />
        {/* Open book */}
        <path d="M 70 120 Q 85 110 100 118 Q 115 110 130 120 L 126 130 Q 115 122 100 128 Q 85 122 74 130 Z" fill="#FFFFFF" stroke="#137A38" strokeWidth="2.5" />
        {/* Crested Crane outline */}
        <ellipse cx="106" cy="98" rx="8" ry="12" fill="#137A38" />
        <circle cx="112" cy="80" r="4.5" fill="#137A38" />
        {/* Banner */}
        <path d="M 30 195 Q 100 185 170 195 L 165 220 Q 100 210 35 220 Z" fill="#FFFFFF" stroke="#137A38" strokeWidth="3" />
        <text x="100" y="212" textAnchor="middle" fill="#137A38" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          CARING TO ACHIEVE
        </text>
      </svg>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      width={dimension}
      height={dimension}
      className={className}
      onError={() => setSourceIndex(prev => prev + 1)}
      style={{
        width: dimension,
        height: dimension,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: rounded ? '50%' : undefined,
        ...style,
      }}
    />
  );
};

export default MosaLogo;
