import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { 
  Coins, 
  PlusCircle, 
  ArrowUpRight, 
  Wallet, 
  Gamepad2, 
  Plane, 
  Dice5, 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  Trophy, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Volume2,
  Gift,
  Share2
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string) => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenRefer?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenAuth,
  onOpenRefer
}) => {
  const { user, wallet } = useAuth();

  // Simulated live winners activity
  const liveWinners = [
    { user: 'User 98**10', game: 'WinGo 30s', payout: '+450.00 DC', time: 'Just now' },
    { user: 'VIP 91**45', game: 'Aviator', payout: '+1,820.00 DC (3.64x)', time: '1m ago' },
    { user: 'Club 88**02', game: 'WinGo 1m', payout: '+900.00 DC', time: '2m ago' },
    { user: 'Star 76**88', game: 'Aviator', payout: '+5,400.00 DC (10.8x)', time: '3m ago' },
    { user: 'User 99**73', game: 'WinGo 5m', payout: '+200.00 DC', time: '4m ago' }
  ];

  return (
    <div id="home-page-container" className="space-y-4 pb-20">
      {/* Hero / Balance & Quick Action Dashboard Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#161d2d] via-[#121824] to-[#0c101a] p-5 border border-slate-800/90 shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top greeting and VIP level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 p-[1.5px]">
                <div className="w-full h-full rounded-[14px] bg-[#0c101a] flex items-center justify-center font-bold text-white text-sm">
                  {user ? user.display_name.slice(0, 2).toUpperCase() : '56'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">
                    {user ? user.display_name : 'Guest Visitor'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold tracking-wider border border-amber-500/30">
                    VIP 1
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {user ? `+91 ${user.mobile_number.slice(0, 3)}****${user.mobile_number.slice(-2)}` : 'Welcome to 56Club'}
                </span>
              </div>
            </div>

            {/* Quick Provable Fairness badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 Engine</span>
            </div>
          </div>

          {/* Main Balance Display */}
          <div className="pt-1">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Wallet Balance
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono-gaming font-black text-3xl sm:text-4xl text-white tracking-tight">
                ₹{wallet ? wallet.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10.00'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Bonus: <strong className="text-emerald-400 font-mono-gaming">₹{wallet ? wallet.bonus_demo_balance.toFixed(2) : '10.00'}</strong></span>
              <span>•</span>
              <span>Total Winnings: <strong className="text-white font-mono-gaming">+₹{wallet ? wallet.total_winnings.toLocaleString() : '0.00'}</strong></span>
            </div>
          </div>

          {/* 3 Quick Action Shortcuts (Deposit, Withdrawal, Wallet) */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              id="home-deposit-shortcut"
              onClick={onOpenRecharge}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit (₹100)</span>
            </button>

            <button
              id="home-withdraw-shortcut"
              onClick={onOpenWithdraw}
              className="py-2.5 px-3 rounded-2xl bg-[#1a2336] hover:bg-[#222e44] border border-slate-700/80 text-rose-300 font-bold text-xs shadow-lg flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Withdraw</span>
            </button>

            <button
              id="home-wallet-shortcut"
              onClick={() => onNavigate('/wallet')}
              className="py-2.5 px-3 rounded-2xl bg-[#1a2336] hover:bg-[#222e44] border border-slate-700/80 text-slate-200 font-bold text-xs shadow-lg flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-purple-400" />
              <span>Wallet Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Promotional Notice Ticker Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 via-slate-900 to-rose-900/30 border border-purple-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">56Club Virtual Engine:</span>
          <span className="hidden sm:inline text-slate-400">
            Provably fair simulator with pre-generated SHA-256 round commitments.
          </span>
        </div>
        <button
          onClick={() => onNavigate('/support')}
          className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5 shrink-0"
        >
          Rules <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Refer & Earn High-Conversion Banner */}
      {onOpenRefer && (
        <div 
          id="home-refer-banner"
          onClick={onOpenRefer}
          className="p-4 rounded-3xl bg-gradient-to-r from-[#201528] via-[#1a1524] to-[#25171e] border border-amber-500/40 hover:border-amber-500/70 shadow-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px] shadow-lg shadow-amber-950/40 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#120f1a] rounded-[14px] flex items-center justify-center">
                <Gift className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Invite Friends & Earn Commission
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                  30% Rebate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Share your game link on WhatsApp or social media to claim instant bonus credits!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shrink-0 shadow-md group-hover:from-amber-400 group-hover:to-rose-400 transition-all">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </div>
        </div>
      )}

      {/* Featured Games Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-bold text-white">Hot Featured Games</h3>
          </div>
          <button
            onClick={() => onNavigate('/games')}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
          >
            All Games <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. WinGo Game Card */}
          <div
            id="wingo-game-card"
            className="group relative rounded-3xl bg-gradient-to-br from-[#2a132e] via-[#1c1228] to-[#120f20] border border-purple-500/30 p-5 shadow-xl hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/25 transition-all" />

            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">
                    Number Draw
                  </span>
                  <h4 className="text-2xl font-display font-black text-white mt-1.5 tracking-tight group-hover:text-purple-300 transition-colors">
                    WinGo Lottery
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fast color, number, and size predictions with 9x payouts
                  </p>
                </div>

                {/* Original Number-Game Illustration Badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 p-[1.5px] shadow-lg shadow-purple-950/50 shrink-0">
                  <div className="w-full h-full bg-[#181124] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                    <Dice5 className="w-7 h-7 text-rose-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Mode Tags: 30 Sec, 1 Min, 5 Min */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => onNavigate('/wingo/30s')}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all"
                >
                  30 Sec
                </button>
                <button
                  onClick={() => onNavigate('/wingo/1m')}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all"
                >
                  1 Min
                </button>
                <button
                  onClick={() => onNavigate('/wingo/5m')}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all"
                >
                  5 Min
                </button>
              </div>
            </div>

            {/* Play Now Button */}
            <div className="mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono-gaming flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Draw Every 30s
              </span>
              <button
                id="play-wingo-btn"
                onClick={() => onNavigate('/wingo')}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all cursor-pointer"
              >
                Play Now
              </button>
            </div>
          </div>

          {/* 2. Aviator Game Card */}
          <div
            id="aviator-game-card"
            className="group relative rounded-3xl bg-gradient-to-br from-[#2b1016] via-[#1b1014] to-[#120d10] border border-rose-500/30 p-5 shadow-xl hover:border-rose-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/15 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-600/25 transition-all" />

            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                    Multiplier Crash
                  </span>
                  <h4 className="text-2xl font-display font-black text-white mt-1.5 tracking-tight group-hover:text-rose-300 transition-colors">
                    Aviator Flight
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cash out before the supersonic jet crashes! Up to 100x multiplier
                  </p>
                </div>

                {/* Original Airplane Illustration Badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-[1.5px] shadow-lg shadow-rose-950/50 shrink-0">
                  <div className="w-full h-full bg-[#1e1014] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                    <Plane className="w-7 h-7 text-rose-400 transform -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Multiplier Preview Ticker */}
              <div className="flex items-center gap-2 mt-4 font-mono-gaming text-xs">
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  1.42x
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  3.88x
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  12.40x
                </span>
                <span className="text-[11px] text-slate-400">recent flights</span>
              </div>
            </div>

            {/* Play Now Button */}
            <div className="mt-5 pt-3 border-t border-rose-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 font-mono-gaming flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                Live Round Active
              </span>
              <button
                id="play-aviator-btn"
                onClick={() => onNavigate('/aviator')}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all cursor-pointer"
              >
                Play Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Live Winners Simulation Feed */}
      <div className="p-4 rounded-3xl bg-[#121722] border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Round Winners Feed
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Verified Live Payouts</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {liveWinners.map((winner, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono-gaming">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-bold">{winner.user}</span>
                <span className="text-slate-500 text-[11px] font-sans">won in {winner.game}</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">{winner.payout}</span>
                <span className="text-[10px] text-slate-500 block font-sans">{winner.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
