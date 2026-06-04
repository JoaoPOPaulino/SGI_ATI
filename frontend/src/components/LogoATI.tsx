import React from 'react';
import atiLogoPng from '../assets/ati-logo.png';

interface LogoATIProps {
  className?: string;
}

const LogoATI: React.FC<LogoATIProps> = ({ className = "h-10 w-auto" }) => {
  return (
    <img 
      src={atiLogoPng} 
      alt="ATI Tocantins Logo" 
      className={`object-contain ${className}`}
    />
  );
};

export default LogoATI;
