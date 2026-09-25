import React from 'react';

export const FiftySixClubHeaderLogo: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div
      id="wingo-56club-logo"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform"
      title="56Club Game"
    >
      {/* 56 Badge with 3D gradient and glow */}
      <div className="w-8 h-8 relative flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 via-purple-600 to-indigo-800 p-[1.5px] shadow-lg shadow-rose-950/40">
        <div className="w-full h-full bg-[#12141a] rounded-[10px] flex items-center justify-center overflow-hidden relative">
          <div className="relative flex items-center justify-center font-display font-black text-sm tracking-tight text-white">
            <span className="text-rose-500 font-extrabold italic drop-shadow-[0_2px_4px_rgba(244,63,94,0.8)]">5</span>
            <span className="text-purple-400 font-extrabold -ml-0.5 italic drop-shadow-[0_2px_4px_rgba(168,85,247,0.8)]">6</span>
          </div>
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 56CLUB Stylized 3D Gradient Text */}
      <div className="flex items-center gap-1">
        <span
          className="font-black italic text-xl sm:text-2xl tracking-tight leading-none"
          style={{
            background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 40%, #ea580c 80%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 0 #7f1d1d) drop-shadow(0 4px 6px rgba(0,0,0,0.8))',
            transform: 'skewX(-4deg)'
          }}
        >
          56CLUB
        </span>

        {/* .GAME Crimson Badge */}
        <div className="bg-[#b91c1c] text-white text-[10px] sm:text-[11px] font-black tracking-wider px-1.5 py-0.5 rounded-full border border-red-400/40 shadow-md uppercase">
          .GAME
        </div>
      </div>
    </div>
  );
};
