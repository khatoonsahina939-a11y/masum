import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { 
  PlusCircle, 
  ArrowUpRight, 
  Bell, 
  ShieldCheck, 
  User, 
  RefreshCw,
  Coins,
  Sparkles,
  Gift
} from 'lucide-react';

interface HeaderProps {
  onNavigate: (route: string) => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenRefer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenAuth,
  onOpenRefer
}) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWallet();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full bg-[#0b0e14]/90 backdrop-blur-md border-b border-slate-800/80 px-3 py-2.5 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" onClick={() => onNavigate('/home')} />

          {/* Quick role indicator for admins or operator portal shortcut */}
          {user?.role === 'admin' ? (
            <button
              id="header-admin-badge"
              onClick={() => onNavigate('/admin')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          ) : (
            <button
              id="header-admin-portal-link"
              onClick={() => onNavigate('/admin')}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Operator Portal"
            >
              <ShieldCheck className="w-3 h-3 text-rose-400" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Right: Demo Balance & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <>
              {/* Balance Pill */}
              <div
                id="header-balance-pill"
                className="flex items-center gap-1.5 bg-[#141b29] border border-slate-700/80 rounded-full pl-2.5 pr-1.5 py-1 text-xs shadow-inner"
              >
                <Coins className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Balance</span>
                  <span className="font-mono-gaming font-bold text-white text-xs sm:text-sm tracking-wide">
                    ₹{wallet ? wallet.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '10.00'}
                  </span>
                </div>
                <button
                  id="header-refresh-balance"
                  onClick={handleRefresh}
                  title="Refresh Balance"
                  className="p-1 hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Refer & Earn Shortcut */}
              {onOpenRefer && (
                <button
                  id="header-refer-btn"
                  onClick={onOpenRefer}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Refer & Earn Commission"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Refer & Earn</span>
                </button>
              )}

              {/* Deposit Shortcut */}
              <button
                id="header-deposit-btn"
                onClick={onOpenRecharge}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                title="Deposit Funds"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deposit</span>
              </button>

              {/* Withdrawal Shortcut */}
              <button
                id="header-withdraw-btn"
                onClick={onOpenWithdraw}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#192233] hover:bg-[#222e44] border border-slate-700 text-slate-200 hover:text-white font-medium text-xs active:scale-95 transition-all"
                title="Withdrawal"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Withdraw</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  id="header-notifications-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg bg-[#141b29] hover:bg-slate-800 text-slate-300 hover:text-white relative border border-slate-800 transition-colors"
                  title="System Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b0e14]" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#121722] border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs z-50 text-slate-300 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-bold text-white">
                      <span>Notifications</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal">
                        <Sparkles className="w-3 h-3" /> 56Club
                      </span>
                    </div>
                    <div className="py-2 space-y-2 max-h-56 overflow-y-auto">
                      <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40">
                        <p className="font-semibold text-white">Welcome to 56Club!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Claim your ₹10 First Time Registration Bonus. Minimum ₹100 deposit activates full game access.
                        </p>
                      </div>
                      <div className="p-2 rounded bg-slate-800/40 border border-slate-700/40">
                        <p className="font-semibold text-emerald-400">Official Fast UPI</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Direct transfers supported via PhonePe, Paytm, and Google Pay with 0% fee.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <button
                id="header-profile-btn"
                onClick={() => onNavigate('/profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 p-[1.5px] shrink-0"
                title="My Profile"
              >
                <div className="w-full h-full rounded-full bg-[#0d121d] flex items-center justify-center text-slate-200 hover:text-white">
                  <User className="w-4 h-4" />
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#161f30] hover:bg-slate-800 border border-slate-700 transition-all"
              >
                Log In
              </button>
              <button
                id="header-register-btn"
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 shadow-md shadow-rose-950/40 transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
