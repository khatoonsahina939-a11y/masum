import React from 'react';
import { Dice5, Plane, Sparkles, Flame, ChevronRight, ShieldCheck } from 'lucide-react';

interface GamesLobbyProps {
  onNavigate: (route: string) => void;
}

export const GamesLobby: React.FC<GamesLobbyProps> = ({ onNavigate }) => {
  return (
    <div id="games-lobby-container" className="space-y-4 pb-24 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">56Club Game Lobby</h2>
          <p className="text-xs text-slate-400">Select a provably fair virtual simulator</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>All Games 100% Virtual</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WinGo 30s */}
        <div
          onClick={() => onNavigate('/wingo/30s')}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#29132e] to-[#140e1d] border border-purple-500/40 hover:border-purple-500/80 cursor-pointer shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                FAST BLITZ
              </span>
              <Dice5 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-display font-black text-white mt-3 group-hover:text-purple-300">
              WinGo 30 Seconds
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Rapid round resolution every 30 seconds. Pick colors (Green/Red/Violet) or numbers 0-9.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-900/40 flex justify-between items-center text-xs font-bold text-rose-400">
            <span>9x Payout Potential</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Play Blitz <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* WinGo 1m */}
        <div
          onClick={() => onNavigate('/wingo/1m')}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#241328] to-[#120d18] border border-purple-500/30 hover:border-purple-500/70 cursor-pointer shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                CLASSIC
              </span>
              <Dice5 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-display font-black text-white mt-3 group-hover:text-purple-300">
              WinGo 1 Minute
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Standard 60-second lottery rounds with balanced time for statistical pattern review.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-900/40 flex justify-between items-center text-xs font-bold text-purple-300">
            <span>Classic Pacing</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Play Classic <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* WinGo 5m */}
        <div
          onClick={() => onNavigate('/wingo/5m')}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#1d1226] to-[#0f0c16] border border-purple-500/20 hover:border-purple-500/60 cursor-pointer shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                STRATEGY
              </span>
              <Dice5 className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-display font-black text-white mt-3 group-hover:text-purple-300">
              WinGo 5 Minutes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Deep strategy 300-second rounds for in-depth analysis of frequency and big/small distribution.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-900/40 flex justify-between items-center text-xs font-bold text-blue-400">
            <span>Deep Analysis</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Play 5m <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Aviator Flight */}
        <div
          onClick={() => onNavigate('/aviator')}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#2a1117] to-[#120c10] border border-rose-500/40 hover:border-rose-500/80 cursor-pointer shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" /> MULTIPLIER CRASH
              </span>
              <Plane className="w-6 h-6 text-rose-400 transform -rotate-45 group-hover:scale-110 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-display font-black text-white mt-3 group-hover:text-rose-300">
              Aviator Supersonic
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Watch the supersonic jet climb. Cash out manually or set auto cash-out before the flight terminates!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-900/40 flex justify-between items-center text-xs font-bold text-rose-400">
            <span>Up to 100x Multiplier</span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Take Flight <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
