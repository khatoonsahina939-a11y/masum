import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  X, 
  Coins, 
  Lock, 
  CheckCircle2, 
  Smartphone,
  Zap
} from 'lucide-react';

interface RechargeRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  gameName?: string;
}

export const RechargeRequirementModal: React.FC<RechargeRequirementModalProps> = ({
  isOpen,
  onClose,
  onOpenRecharge,
  onOpenAuth,
  gameName = 'Games'
}) => {
  const { user, wallet } = useAuth();

  if (!isOpen) return null;

  const currentBalance = wallet ? wallet.demo_balance : 0;
  const bonusBalance = wallet ? wallet.bonus_demo_balance : 10;
  const isRegistered = !!user;

  return (
    <div
      id="recharge-requirement-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1e1728] via-[#14121d] to-[#0d0b13] border border-amber-500/40 shadow-2xl p-6 relative text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-300 p-[2px] shadow-lg shadow-amber-900/40">
            <div className="w-full h-full bg-[#120f1a] rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            First-Time Game Activation
          </div>

          <h3 className="text-xl font-extrabold text-white mt-2 font-display">
            Recharge Requirement: Minimum ₹100
          </h3>

          <p className="text-xs text-slate-300 mt-1.5 max-w-sm leading-relaxed">
            {isRegistered ? (
              <>
                You have received your <strong className="text-emerald-400 font-bold">₹10 Free Registration Bonus</strong>! To activate your account and start betting in <strong className="text-white font-semibold">{gameName}</strong>, a minimum first recharge of <strong className="text-amber-400 font-bold">₹100</strong> is required.
              </>
            ) : (
              <>
                Please register an account to claim your <strong className="text-emerald-400 font-bold">₹10 Free Registration Bonus</strong>. A minimum first recharge of <strong className="text-amber-400 font-bold">₹100</strong> is required to activate live betting.
              </>
            )}
          </p>
        </div>

        {/* Balance Breakdown Card */}
        <div className="mt-5 p-4 rounded-2xl bg-[#1b1726]/80 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
            <span className="text-slate-400">Registration Welcome Bonus:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              + ₹{bonusBalance > 0 ? bonusBalance.toFixed(2) : '10.00'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
            <span className="text-slate-400">Minimum First Recharge:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              ₹100.00
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-bold text-white">Starting Play Balance:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-base">
              ₹{(100 + (bonusBalance > 0 ? bonusBalance : 10)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Benefits List */}
        <div className="mt-4 space-y-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant official UPI Deposit (0% deduction via PhonePe, Paytm, GPay)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Full unlocked access to all WinGo (30s, 1m, 3m, 5m) & Aviator games</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Fast 24/7 bank & UPI withdrawals on all game winnings</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          {isRegistered ? (
            <button
              id="activate-recharge-btn"
              onClick={() => {
                onClose();
                onOpenRecharge();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-98 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Recharge ₹100 to Unlock Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="register-for-bonus-btn"
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth('register');
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Register & Claim ₹10 Bonus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            I'll recharge later, explore lobby
          </button>
        </div>
      </div>
    </div>
  );
};
