
import React from 'react';
import { useLogo } from '@/contexts/LogoContext';

interface LogoProps {
  size?: string;
  alt?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = "h-16", 
  alt = "OctoPi Ink Logo",
  className = ""
}) => {
  const { logoUrl } = useLogo();

  return (
    <img 
      src={logoUrl}
      alt={alt}
      className={`${size} w-auto ${className}`}
      onError={(e) => {
        console.error('Logo failed to load');
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

export default Logo;
