import React from 'react';

interface WinGoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  hasDragon?: boolean;
  onClick?: () => void;
}

export const WinGoBall: React.FC<WinGoBallProps> = ({
  number,
  size = 'md',
  isSelected = false,
  hasDragon = false,
  onClick
}) => {
  // Determine ball color type
  const isRed = [2, 4, 6, 8].includes(number);
  const isGreen = [1, 3, 7, 9].includes(number);
  const isZero = number === 0; // Red + Violet
  const isFive = number === 5; // Green + Violet

  // Text color inside white center disc
  const getTextColor = () => {
    if (isZero) return 'text-[#9333ea]';
    if (isFive) return 'text-[#9333ea]';
    if (isGreen) return 'text-[#10b981]';
    return 'text-[#ef4444]';
  };

  // Size styling
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-13 h-13 sm:w-14 sm:h-14 text-lg sm:text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl'
  }[size];

  const discSizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-base sm:text-lg',
    lg: 'w-10 h-10 text-xl',
    xl: 'w-13 h-13 text-2xl'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform duration-150 active:scale-95 group ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      }`}
    >
      {/* 3D Sphere Outer Body */}
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-200 ${
          isSelected ? 'ring-3 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.6)]' : ''
        }`}
        style={{
          background: isZero
            ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #ef4444 51%, #dc2626 100%)'
            : isFive
            ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #10b981 51%, #059669 100%)'
            : isGreen
            ? 'radial-gradient(circle at 35% 30%, #4ade80 0%, #10b981 45%, #047857 100%)'
            : 'radial-gradient(circle at 35% 30%, #f87171 0%, #ef4444 45%, #b91c1c 100%)',
          boxShadow: isSelected
            ? '0 6px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.4)'
            : '0 4px 10px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.35)'
        }}
      >
        {/* Sphere Top Highlight Gloss */}
        <div
          className="absolute top-1 left-2 w-3/5 h-2/5 rounded-full pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)'
          }}
        />

        {/* Center White Circular Plate */}
        <div
          className={`${discSizeClasses} rounded-full bg-white flex items-center justify-center font-black font-mono-gaming shadow-inner z-10 transition-transform ${getTextColor()}`}
          style={{
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.8)'
          }}
        >
          {number}
        </div>
      </div>

      {/* Lucky Dragon Medallion Crest (as shown on Ball 9 in the user screenshot) */}
      {hasDragon && (
        <div 
          className="absolute -bottom-1.5 -right-1.5 w-8 h-8 sm:w-9 sm:h-9 z-20 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] animate-in zoom-in duration-300"
          title="Lucky Pick"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow">
            <defs>
              <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="dragonTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
              <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Flaming Crest Outer Radiance */}
            <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="url(#goldRim)" strokeWidth="5" />
            <path
              d="M 50,2 Q 62,10 68,22 Q 80,18 84,32 Q 96,38 92,52 Q 98,66 88,78 Q 80,90 66,94 Q 50,98 34,94 Q 20,90 12,78 Q 2,66 8,52 Q 4,38 16,32 Q 20,18 32,22 Q 38,10 50,2 Z"
              fill="none"
              stroke="url(#flameGrad)"
              strokeWidth="2"
              opacity="0.85"
            />

            {/* Inner White Disc */}
            <circle cx="50" cy="50" r="38" fill="#ffffff" />
            <circle cx="50" cy="50" r="37" fill="none" stroke="url(#goldRim)" strokeWidth="2.5" />

            {/* Stylized Azure Dragon Body */}
            <path
              d="M 32,68 C 24,54 30,36 44,30 C 56,25 68,30 72,40 C 76,50 68,60 56,60 C 44,60 40,50 48,44 C 54,40 60,44 60,48 C 60,52 56,54 52,53"
              fill="none"
              stroke="url(#dragonTeal)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Dragon Head */}
            <path
              d="M 72,38 Q 82,34 78,26 Q 72,28 68,34 Z"
              fill="url(#dragonTeal)"
            />
            {/* Dragon Horns & Whiskers */}
            <path d="M 78,26 Q 86,18 88,14" fill="none" stroke="url(#goldRim)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 74,24 Q 76,14 74,10" fill="none" stroke="url(#goldRim)" strokeWidth="2" strokeLinecap="round" />
            {/* Dragon Eye */}
            <circle cx="74" cy="30" r="1.5" fill="#facc15" />
            {/* Tail Flame */}
            <path
              d="M 32,68 Q 22,76 18,84 Q 28,82 32,74 Z"
              fill="url(#flameGrad)"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
