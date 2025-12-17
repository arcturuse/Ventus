import React from 'react';
import * as Lucide from 'lucide-react';

interface IconProps {
  name: keyof typeof Lucide;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className = "" }) => {
  const LucideIcon = Lucide[name] as any;
  
  // Güvenlik kontrolü: Eğer LucideIcon bir React bileşeni değilse (string veya undefined ise) render etme.
  // React 18'de bileşenler function veya object (memo/forwardRef) olabilir.
  const isValidComponent = LucideIcon && (typeof LucideIcon === 'function' || typeof LucideIcon === 'object');

  if (!isValidComponent) {
    console.warn(`Icon "${name}" not found in lucide-react or is not a valid component.`);
    return null;
  }

  return <LucideIcon size={size} className={className} />;
};