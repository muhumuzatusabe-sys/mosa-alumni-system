import React, { useState } from 'react';
import { MOSA_OFFICIAL_LOGO_DATA_URL } from '../utils/mosaLogoDataUrl';

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
    MOSA_OFFICIAL_LOGO_DATA_URL,
    '/images/mosa-logo.png',
    '/images/mosa-logo.jpg',
  ];

  if (sourceIndex >= sources.length) {
    return (
      <img
        src={MOSA_OFFICIAL_LOGO_DATA_URL}
        alt={alt}
        width={dimension}
        height={dimension}
        className={className}
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
