import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Phone, 
  Calendar, 
  Crown, 
  Coins, 
  FileText, 
  History, 
  ArrowUpRight, 
  Bell, 
  ShieldCheck, 
  HeartHandshake, 
  LogOut, 
  ChevronRight, 
  HelpCircle,
  Sparkles,
  Award,
  Gift,
  Share2
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: (mode: 'login') => void;
  onOpenRefer?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenAuth,
  onOpenRefer
}) => {
  const { user, wallet, logout } = useAuth();
  const [showResponsibleModal, setShowResponsibleModal] = useState(false);

  return (
    <div id="profile-page-container" className="space-y-4 pb-24">
      {/* Profile Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1b2234] via-[#141a28] to-[#0e121d] border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-emerald-400 p-[2px] shadow-xl shadow-rose-950/40">
            <div className="w-full h-full rounded-[14px] bg-[#0c101a] flex items-center justify-center font-display font-black text-2xl text-white">
              {user ? user.display_name.slice(0, 2).toUpperCase() : '56'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {user ? user.display_name : 'Guest User'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 text-[10px] font-extrabold tracking-wider border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                VIP {user ? user.vip_level : 1}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-gaming">
              <span>ID: {user?.user_id?.slice(0, 10) || 'USER-56CLUB'}</span>
              <span>•</span>
              <span>Mobile: +91 {user ? user.mobile_number : '9876543210'}</span>
            </div>
          </div>
        </div>

        {/* Balance Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase font-bold">Total Balance</span>
            <span className="font-mono-gaming font-extrabold text-white text-lg">
              ₹{wallet ? wallet.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10.00'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRecharge}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Deposit
            </button>
            <button
              onClick={onOpenWithdraw}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-slate-700 transition-all active:scale-95"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Refer & Earn Banner Card */}
      {onOpenRefer && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/40 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Gift className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">Refer & Earn Rewards</h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/40">
                  30% Rebate
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Invite friends with your link to earn instant bonus credits</p>
            </div>
          </div>
          <button
            id="profile-open-refer-btn"
            onClick={onOpenRefer}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Invite Now
          </button>
        </div>
      )}

      {/* Menu Options List */}
      <div className="rounded-3xl bg-[#121722] border border-slate-800 shadow-xl divide-y divide-slate-800/80 overflow-hidden text-xs">
        {/* Refer & Earn Menu Item */}
        {onOpenRefer && (
          <button
            id="profile-refer-menu-item"
            onClick={onOpenRefer}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Refer and Earn (Invite Friends)</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold uppercase">Bonus</span>
                </div>
                <span className="text-[11px] text-slate-400">Copy your game link, share to WhatsApp, and claim commission</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        )}

        {/* Betting Records */}
        <button
          onClick={() => onNavigate('/wingo')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">Betting History</span>
              <span className="text-[11px] text-slate-400">View your simulated bets and payouts in WinGo and Aviator</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Transaction Records */}
        <button
          onClick={() => onNavigate('/wallet')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">Demo Ledger Records</span>
              <span className="text-[11px] text-slate-400">View complete virtual deposit, withdrawal, and bonus history</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Game Rules & Fairness */}
        <button
          onClick={() => onNavigate('/support')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">Game Rules & Fairness</span>
              <span className="text-[11px] text-slate-400">Cryptographic SHA-256 pre-hashes and payout multipliers</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Responsible Gaming Notice */}
        <button
          onClick={() => setShowResponsibleModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">Responsible Gaming</span>
              <span className="text-[11px] text-slate-400">Simulator guidelines, self-limits, and legal compliance notice</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Admin Panel Access */}
      <div className="p-4 rounded-3xl bg-[#161c28] border border-rose-500/30 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">Operator Management Portal</span>
            <span className="text-[11px] text-slate-400">Restricted login for system operator (mrcat)</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/admin')}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer"
        >
          {user?.role === 'admin' ? 'Open Dashboard' : 'Admin Login'}
        </button>
      </div>

      {/* Logout Action */}
      <button
        id="profile-logout-btn"
        onClick={logout}
        className="w-full py-3 px-4 rounded-2xl bg-[#141a24] hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 text-rose-400 font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Demo Account</span>
      </button>

      {/* Responsible Gaming Modal */}
      {showResponsibleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <HeartHandshake className="w-5 h-5" />
                <span>Responsible Simulator Notice</span>
              </div>
              <button onClick={() => setShowResponsibleModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>56Club</strong> is strictly a virtual simulation gaming software prototype.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Demo Credits cannot be converted into real fiat money, cryptocurrency, or goods.</li>
                <li>No real financial risk is incurred during gameplay.</li>
                <li>This platform complies with transparent educational simulation standards and does not encourage real-money gambling.</li>
                <li>If real-money gaming functionality is ever deployed in future jurisdictions, it must be preceded by mandatory KYC/AML compliance, government licensing, and responsible gaming limits.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowResponsibleModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
