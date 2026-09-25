import React, { useEffect, useState } from 'react';
import { WinGoBall } from './WinGoBall';
import { 
  Trophy, 
  Sparkles, 
  X, 
  ArrowRight, 
  TrendingUp, 
  Frown, 
  Coins, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface WinGoResultModalData {
  roundId: string;
  isWin: boolean;
  totalStake: number;
  totalPayout: number;
  profit: number;
  winningNumber: number;
  winningColor: string;
  winningSize: string;
  bets: {
    selectionType: string;
    selectionValue: string | number;
    stake: number;
    payout: number;
    isWin: boolean;
  }[];
}

interface WinGoResultModalProps {
  data: WinGoResultModalData;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const WinGoResultModal: React.FC<WinGoResultModalProps> = ({
  data,
  onClose,
  soundEnabled = true
}) => {
  const [countdown, setCountdown] = useState<number>(6);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Play celebration audio & fire confetti on mount if Win
  useEffect(() => {
    if (data.isWin) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff']
        });
        setTimeout(() => {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 }
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 }
          });
        }, 250);
      } catch (e) {
        // Confetti optional
      }

      // Audio win fanfare
      if (soundEnabled) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
              gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.28);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + idx * 0.1);
              osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
            });
          }
        } catch (e) {
          // Audio context might be restricted
        }
      }
    } else {
      // Audio lose sound
      if (soundEnabled) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const notes = [420, 310];
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
              gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.15);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + idx * 0.15);
              osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
            });
          }
        } catch (e) {
          // Audio not permitted
        }
      }
    }
  }, [data.isWin, soundEnabled]);

  // Auto-dismiss countdown timer (6s)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, onClose]);

  const formatSelection = (type: string, val: string | number) => {
    if (type === 'number') return `Number ${val}`;
    if (type === 'color') return `Color ${String(val).toUpperCase()}`;
    if (type === 'size') return `Size ${String(val).toUpperCase()}`;
    return String(val);
  };

  const getColorBg = (colorStr: string) => {
    const c = colorStr.toLowerCase();
    if (c.includes('green') && c.includes('violet')) return 'bg-gradient-to-r from-emerald-500 to-purple-600 text-white';
    if (c.includes('red') && c.includes('violet')) return 'bg-gradient-to-r from-rose-500 to-purple-600 text-white';
    if (c.includes('green')) return 'bg-emerald-600 text-white';
    if (c.includes('red')) return 'bg-rose-600 text-white';
    if (c.includes('violet')) return 'bg-purple-600 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div 
      id="wingo-result-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        id="wingo-result-modal-card"
        className={`relative w-full max-w-sm rounded-3xl p-5 border text-center shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200 ${
          data.isWin
            ? 'bg-gradient-to-b from-[#1c271e] via-[#121b14] to-[#0c130e] border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
            : 'bg-gradient-to-b from-[#25191c] via-[#1a1114] to-[#100b0d] border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
        }`}
      >
        {/* Top Close Button */}
        <button
          id="wingo-result-modal-close-btn"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* WIN OR LOSE HEADER BANNER */}
        {data.isWin ? (
          <div className="space-y-2 pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 text-slate-950 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-black tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Congratulations</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                You Win!
              </h2>
            </div>

            {/* Glowing Big Winning Amount */}
            <div className="py-2.5 px-4 rounded-2xl bg-[#0e1911] border border-emerald-500/40 shadow-inner">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Total Payout
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                +₹{data.totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-amber-300">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Net Profit: +₹{Math.max(0, data.profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-rose-600 to-pink-700 text-white shadow-xl shadow-rose-950/50 ring-4 ring-rose-500/20">
              <Frown className="w-7 h-7" />
            </div>

            <div>
              <span className="text-rose-400 text-xs font-black tracking-widest uppercase block">
                Game Result
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Better Luck Next Time
              </h2>
            </div>

            {/* Loss Stake Box */}
            <div className="py-2 px-4 rounded-2xl bg-[#140c0f] border border-rose-500/30">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Amount Lost
              </span>
              <div className="text-2xl font-black font-mono text-rose-400">
                -₹{data.totalStake.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* LOTTERY RESULT CARD */}
        <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-slate-800 text-left space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
            <span className="text-slate-400 font-medium">Period:</span>
            <span className="font-mono font-bold text-slate-200 text-[11px]">
              {data.roundId}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <WinGoBall number={data.winningNumber} size="md" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Winning Ball</span>
                <span className="text-sm font-black text-white font-mono">
                  Number {data.winningNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              {/* Color Tag */}
              <span className={`px-2.5 py-1 rounded-xl text-[11px] capitalize font-extrabold shadow-sm ${getColorBg(data.winningColor)}`}>
                {data.winningColor}
              </span>
              {/* Size Tag */}
              <span className={`px-2.5 py-1 rounded-xl text-[11px] capitalize font-extrabold shadow-sm ${
                data.winningSize.toLowerCase() === 'big'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-blue-600 text-white'
              }`}>
                {data.winningSize}
              </span>
            </div>
          </div>

          {/* User's Placed Bets Breakdown */}
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Your Placed Bets ({data.bets.length})
            </span>
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-xs">
              {data.bets.map((b, idx) => (
                <div 
                  key={idx} 
                  className={`p-1.5 rounded-xl flex items-center justify-between text-[11px] ${
                    b.isWin ? 'bg-emerald-950/40 border border-emerald-800/40' : 'bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {b.isWin ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">
                      {formatSelection(b.selectionType, b.selectionValue)}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    {b.isWin ? (
                      <span className="font-bold text-emerald-400">+₹{b.payout.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-400">-₹{b.stake.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button & Auto Close timer */}
        <div className="mt-4 space-y-2">
          <button
            id="wingo-result-modal-action-btn"
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
              data.isWin
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-950/60 font-black'
                : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50'
            }`}
          >
            <span>{data.isWin ? 'Awesome, Continue' : 'Try Next Round'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Auto close in <strong className="text-slate-200 font-mono">{countdown}s</strong> (hover to hold)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
