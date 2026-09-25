import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Coins, 
  PlusCircle, 
  ArrowUpRight, 
  History, 
  Gift, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Filter,
  CreditCard
} from 'lucide-react';
import type { DemoWalletLedger, DemoWithdrawal } from '../../types';

interface WalletPageProps {
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onNavigate?: (route: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  onOpenRecharge,
  onOpenWithdraw,
  onNavigate
}) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [ledgers, setLedgers] = useState<DemoWalletLedger[]>([]);
  const [withdrawals, setWithdrawals] = useState<DemoWithdrawal[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recharge' | 'withdrawal' | 'bet' | 'bonus'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        headers: { 'x-user-id': user.user_id }
      });
      if (res.ok) {
        const data = await res.json();
        setLedgers(data.ledgers);
        setWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    refreshWallet();
  }, [user]);

  // Wagering calculation
  const totalWagered = (wallet?.total_winnings || 0) + (wallet?.total_losses || 0);
  const wageringTarget = ((wallet?.bonus_demo_balance || 0) * 2) + 500;
  const wageringCompleted = Math.min(wageringTarget, totalWagered);
  const wageringProgressPct = Math.min(100, Math.round((wageringCompleted / (wageringTarget || 1)) * 100));

  const filteredLedgers = ledgers.filter((l) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'recharge') return l.transaction_type === 'recharge';
    if (activeFilter === 'withdrawal') return l.transaction_type === 'withdrawal';
    if (activeFilter === 'bet') return l.transaction_type === 'bet_stake' || l.transaction_type === 'bet_payout';
    if (activeFilter === 'bonus') return l.transaction_type === 'bonus';
    return true;
  });

  return (
    <div id="wallet-page-container" className="space-y-4 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Main Wallet</h2>
          <p className="text-xs text-slate-400">Balance management and transaction ledger</p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>INR (₹) Account</span>
        </div>
      </div>

      {/* Main Balance Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Main Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#18233a] to-[#121826] border border-slate-700/80 shadow-xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" /> Main Balance
          </span>
          <div className="font-mono-gaming font-black text-xl sm:text-2xl text-white mt-1">
            ₹{wallet ? wallet.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10.00'}
          </div>
          <span className="text-[10px] text-slate-400">Available to stake</span>
        </div>

        {/* Card 2: Bonus Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#241738] to-[#171228] border border-purple-500/40 shadow-xl">
          <span className="text-[11px] uppercase font-bold text-purple-300 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-purple-400" /> Bonus Credits
          </span>
          <div className="font-mono-gaming font-black text-xl sm:text-2xl text-purple-200 mt-1">
            ₹{wallet ? wallet.bonus_demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10.00'}
          </div>
          <span className="text-[10px] text-purple-400/80">Registration & deposit bonus</span>
        </div>

        {/* Card 3: Total Winnings */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#122822] to-[#0f1d19] border border-emerald-500/30 shadow-xl">
          <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Winnings
          </span>
          <div className="font-mono-gaming font-black text-xl sm:text-2xl text-emerald-300 mt-1">
            +₹{wallet ? wallet.total_winnings.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[10px] text-emerald-500/80">Rounds won</span>
        </div>

        {/* Card 4: Total Losses */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2b1219] to-[#1c0f13] border border-rose-500/30 shadow-xl">
          <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Total Losses
          </span>
          <div className="font-mono-gaming font-black text-xl sm:text-2xl text-rose-300 mt-1">
            -₹{wallet ? wallet.total_losses.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[10px] text-rose-500/80">Stakes settled</span>
        </div>
      </div>

      {/* Action Buttons: Add Demo Credits (Deposit) & Demo Withdrawal */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenRecharge}
          className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Deposit (QR / UPI)</span>
        </button>

        <button
          onClick={() => {
            if (onNavigate) onNavigate('/withdraw');
            else onOpenWithdraw();
          }}
          className="py-3 px-4 rounded-2xl bg-[#192338] hover:bg-[#23304a] border border-slate-700 text-rose-300 hover:text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span>Withdraw (UPI)</span>
        </button>
      </div>

      {/* Bonus & Wagering Demo Display Requirement */}
      <div className="p-5 rounded-3xl bg-[#121724] border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Gift className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold">Bonus & Wagering Tracker</h3>
          </div>
          <span className="text-[10px] text-purple-300 font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
            Rules
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Registration bonus (₹10) and deposit bonuses are subject to game wagering requirements.
          (e.g., Minimum First Deposit: <strong>₹100</strong> + Bonus: <strong>₹10</strong> = <strong>₹110 Total</strong>).
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-mono-gaming">
            <span className="text-slate-400">
              Completed Wagering: <strong className="text-white">₹{wageringCompleted.toLocaleString()}</strong>
            </span>
            <span className="text-purple-400 font-bold">
              Target: ₹{wageringTarget.toLocaleString()} ({wageringProgressPct}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div
              style={{ width: `${wageringProgressPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-400 transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Remaining: ₹{Math.max(0, wageringTarget - wageringCompleted).toLocaleString()}</span>
            <span>Progress: {wageringProgressPct}%</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Wagering Notice:</strong> Wagering progress reflects playthrough across WinGo and Aviator games. Minimum first deposit is ₹100.
          </span>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="p-4 rounded-3xl bg-[#121722] border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Transaction History
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'recharge', 'withdrawal', 'bet', 'bonus'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeFilter === filter
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0d121c]">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading ledger records...</div>
          ) : filteredLedgers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No transactions recorded for this filter. Place bets or add demo credits to generate ledger items.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono-gaming">
              <thead className="bg-[#141c2c] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLedgers.map((l) => {
                  const isPlus = l.transaction_type === 'recharge' || l.transaction_type === 'bet_payout' || l.transaction_type === 'bonus';
                  return (
                    <tr key={l.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <span className="capitalize font-semibold text-white">
                          {l.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isPlus ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPlus ? `+${l.amount.toLocaleString()} DC` : `-${l.amount.toLocaleString()} DC`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 uppercase text-[10px]">
                        {l.balance_type}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
