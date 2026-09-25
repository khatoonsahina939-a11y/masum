import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div
      id="brand-logo-container"
      onClick={onClick}
      className={`inline-flex items-center gap-2 cursor-pointer group select-none ${className}`}
    >
      {/* Original 56 Gaming Badge */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 via-purple-700 to-indigo-900 p-[1.5px] shadow-lg shadow-rose-950/40 group-hover:shadow-rose-600/30 transition-all duration-300 transform group-hover:scale-105`}
      >
        <div className="w-full h-full bg-[#0d121d] rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle neon grid background in badge */}
          <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:6px_6px] opacity-20" />
          
          <div className="relative flex items-center justify-center font-display font-black tracking-tighter text-white">
            <span className="text-rose-500 font-extrabold italic drop-shadow-[0_2px_4px_rgba(244,63,94,0.8)]">5</span>
            <span className="text-purple-400 font-extrabold -ml-0.5 italic drop-shadow-[0_2px_4px_rgba(168,85,247,0.8)]">6</span>
          </div>

          {/* Top highlight shine */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className={`font-display font-bold tracking-tight text-white ${textSizes[size]}`}>
              56<span className="bg-gradient-to-r from-rose-500 via-purple-400 to-emerald-400 bg-clip-text text-transparent">CLUB</span>
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Virtual Simulator
          </span>
        </div>
      )}
    </div>
  );
};
