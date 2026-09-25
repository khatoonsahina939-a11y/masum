import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Coins, 
  Smartphone, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  Check,
  HelpCircle,
  CreditCard
} from 'lucide-react';
import type { DemoWithdrawal } from '../../types';

interface WithdrawalPageProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

export const WithdrawalPage: React.FC<WithdrawalPageProps> = ({ onBack, onNavigate }) => {
  const { user, wallet, refreshWallet, updateWalletState } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState<string>(user?.display_name || '');
  
  const [withdrawals, setWithdrawals] = useState<DemoWithdrawal[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentBal = wallet?.demo_balance || 0;
  const numAmount = Number(amount);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        headers: { 'x-user-id': user.user_id }
      });
      const data = await res.json();
      if (res.ok && data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.error('Failed to load withdrawal history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numAmount) || numAmount < 100) {
      setErrorNotice('Minimum withdrawal amount is ₹100.');
      return;
    }
    if (numAmount > currentBal) {
      setErrorNotice(`Insufficient balance. Available: ₹${currentBal.toLocaleString()}`);
      return;
    }
    if (!upiId.trim() || upiId.trim().length < 3) {
      setErrorNotice('Please provide a valid UPI ID (e.g. 9876543210@paytm or name@okaxis).');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          amount: numAmount,
          upi_id: upiId.trim(),
          beneficiary_name: beneficiaryName.trim() || user?.display_name || 'Player'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorNotice(data.error || 'Withdrawal request failed.');
      } else {
        setSuccessNotice(`Withdrawal request of ₹${numAmount.toLocaleString()} submitted! Admin will transfer money to ${upiId.trim()}`);
        setAmount('');
        if (data.wallet) updateWalletState(data.wallet);
        await refreshWallet();
        await fetchHistory();
      }
    } catch (err) {
      setErrorNotice('Network error while processing withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 text-slate-100 px-3 sm:px-4 pt-3">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-[#151c2a] hover:bg-[#1b2436] border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-rose-500" />
          <span>Withdrawal Portal</span>
        </h1>
        <button
          onClick={() => {
            refreshWallet();
            fetchHistory();
          }}
          className="p-2 rounded-2xl bg-[#151c2a] hover:bg-[#1b2436] border border-slate-800 text-slate-300 hover:text-white transition-all text-xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin text-rose-400' : ''}`} />
        </button>
      </div>

      {/* Available Balance Showcase Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#182133] via-[#131926] to-[#0e131d] border border-slate-700/80 shadow-2xl relative overflow-hidden mb-4">
        <div className="absolute right-3 top-3 opacity-10">
          <Coins className="w-32 h-32 text-rose-400" />
        </div>
        <div className="relative z-10">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Available Withdrawable Balance
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              ₹{currentBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>24/7 Fast Payouts • 0% Commission Fee</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successNotice && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Request Successfully Sent!</p>
            <p>{successNotice}</p>
          </div>
        </div>
      )}

      {errorNotice && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* WITHDRAWAL FORM */}
      <div className="p-5 rounded-3xl bg-[#141b27] border border-slate-800 shadow-xl mb-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-rose-400" />
          <span>Submit Withdrawal Details</span>
        </h2>

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {/* 1. Enter Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                1. Type Withdrawal Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(currentBal)))}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300"
              >
                Max All (₹{Math.floor(currentBal).toLocaleString()})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">₹</span>
              <input
                type="number"
                min="100"
                max={currentBal}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Type amount (Min ₹100)"
                className="w-full bg-[#0d111a] border border-slate-700/80 rounded-2xl pl-9 pr-4 py-3 text-base text-white font-mono focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {[200, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    Number(amount) === preset
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-[#182030] border-slate-700/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Submit UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Your Receiving UPI Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.trim())}
                placeholder="e.g. yourname@okaxis, 9876543210@paytm"
                className="w-full bg-[#0d111a] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Admin will transfer the money to this specific UPI address.
            </span>
          </div>

          {/* 3. Beneficiary Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. Beneficiary Account Holder Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Full Name as registered on UPI"
                className="w-full bg-[#0d111a] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-[#0d111a] border border-slate-800 text-xs space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Withdrawal Amount:</span>
              <span className="text-white font-mono font-bold">₹{numAmount > 0 ? numAmount.toLocaleString() : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Handling Fee:</span>
              <span className="text-emerald-400 font-bold">₹0.00 (Free)</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-slate-200">
              <span>Receiving Amount:</span>
              <span className="text-rose-400 font-mono text-sm">₹{numAmount > 0 ? numAmount.toLocaleString() : '0.00'}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || numAmount <= 0 || numAmount > currentBal || !upiId.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              'Submitting Request...'
            ) : (
              <span>Submit Withdrawal Request</span>
            )}
          </button>
        </form>
      </div>

      {/* WITHDRAWAL HISTORY */}
      <div className="p-5 rounded-3xl bg-[#141b27] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Withdrawal Records</span>
          </h2>
          <span className="text-xs text-slate-400">{withdrawals.length} Total</span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((wd) => {
              const isApproved = wd.status === 'approved';
              const isRejected = wd.status === 'rejected';
              const isPending = wd.status === 'pending';

              return (
                <div
                  key={wd.id}
                  className="p-3.5 rounded-2xl bg-[#0d111a] border border-slate-800/90 text-xs space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 flex items-center gap-1.5">
                      {wd.id}
                      <button
                        onClick={() => copyToClipboard(wd.id, wd.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy ID"
                      >
                        {copiedId === wd.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>

                    {/* Status Badge */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> Pending Transfer
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Transferred
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3 h-3" /> Rejected & Refunded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Submitted UPI</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">{wd.upi_id || wd.account_identifier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Amount</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{wd.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {wd.transfer_utr && (
                    <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300 flex items-center justify-between">
                      <span>Payout Ref / UTR:</span>
                      <span className="font-mono font-bold select-all">{wd.transfer_utr}</span>
                    </div>
                  )}

                  {wd.note && (
                    <div className="text-[10px] text-slate-400 italic">
                      Note: {wd.note}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500">
                    {new Date(wd.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="mt-5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
        <div>
          <p className="font-bold text-white">Direct Operator Processing</p>
          <p className="text-[11px] text-blue-300/80 mt-0.5">
            All withdrawal requests are sent directly to the Admin Dashboard. Admin will transfer the funds to your submitted UPI ID.
          </p>
        </div>
      </div>
    </div>
  );
};
