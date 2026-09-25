import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Smartphone, 
  User, 
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, wallet, refreshWallet, updateWalletState } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState<string>(user?.display_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBal = wallet?.demo_balance || 0;
  const numAmount = Number(amount);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numAmount) || numAmount < 100) {
      setErrorNotice('Minimum withdrawal amount is ₹100.');
      return;
    }
    if (numAmount > currentBal) {
      setErrorNotice(`Insufficient balance. You have ₹${currentBal.toLocaleString()} available.`);
      return;
    }
    if (!upiId.trim() || upiId.trim().length < 3) {
      setErrorNotice('Please enter your UPI address (e.g. yourname@okaxis or 9876543210@paytm).');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);

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
        setErrorNotice(data.error || 'Withdrawal request failed');
      } else {
        setSubmittedData(data.withdrawal);
        if (data.wallet) updateWalletState(data.wallet);
        await refreshWallet();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setErrorNotice('Network error while processing withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="withdraw-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="withdraw-modal-content"
        className="w-full max-w-md bg-[#121622] border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-200 relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-white mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Withdraw Funds</h3>
            <p className="text-xs text-slate-400">Direct transfer to your personal UPI ID</p>
          </div>
        </div>

        {submittedData ? (
          <div className="mt-4 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Withdrawal Submitted!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Admin will process and transfer the funds to your UPI account shortly.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Request ID:</span>
                <span className="text-white font-bold">{submittedData.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Withdraw Amount:</span>
                <span className="text-rose-400 font-bold text-sm">₹{submittedData.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Receiving UPI:</span>
                <span className="text-amber-300 font-bold">{submittedData.upi_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Name:</span>
                <span className="text-slate-200">{submittedData.beneficiary_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Pending Admin Transfer
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>The requested amount has been held from your available balance while the transfer is processed.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {errorNotice && (
              <div className="my-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Available Balance Card */}
            <div className="p-3.5 rounded-2xl bg-[#0d111a] border border-slate-800 flex items-center justify-between my-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Available Balance:</span>
              </div>
              <span className="font-mono font-bold text-white text-base">
                ₹{currentBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3.5">
              {/* Withdrawal Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Withdrawal Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.floor(currentBal)))}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                  >
                    All Balance (₹{Math.floor(currentBal)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">₹</span>
                  <input
                    id="withdraw-amount-input"
                    type="number"
                    min="100"
                    max={currentBal}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (Min ₹100)"
                    className="w-full bg-[#161d2b] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Quick preset chips */}
              <div className="grid grid-cols-4 gap-2">
                {[200, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      Number(amount) === preset
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-[#172030] border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* User UPI ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Receiving UPI ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <input
                    id="withdraw-upi-input"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim())}
                    placeholder="e.g. 9876543210@paytm or username@okaxis"
                    className="w-full bg-[#161d2b] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Double check your UPI ID. Admin will transfer funds directly to this address.
                </p>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Beneficiary Account Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="withdraw-beneficiary-input"
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="Full name as per UPI / Bank account"
                    className="w-full bg-[#161d2b] border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Handling Fee:</span>
                  <span className="text-emerald-400 font-bold">₹0.00 (Free)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Payout Time:</span>
                  <span className="text-white font-mono">Within 10-30 Mins</span>
                </div>
              </div>

              <button
                id="confirm-withdraw-btn"
                type="submit"
                disabled={isSubmitting || numAmount <= 0 || numAmount > currentBal || !upiId.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  'Submitting Request...'
                ) : (
                  <>
                    <span>Submit Withdrawal Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
