import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Clock,
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, wallet, refreshWallet, updateWalletState } = useAuth();
  
  const OFFICIAL_UPI_ID = 'shahidddd@naviaxis';
  const presets = [100, 300, 500, 1000, 2000, 5000, 10000];
  
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [senderUpi, setSenderUpi] = useState<string>('');
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  
  const [step, setStep] = useState<'pay' | 'submitted'>('pay');
  const [submittedDeposit, setSubmittedDeposit] = useState<any>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentAmount = customAmount ? Number(customAmount) : selectedAmount;
  const bonusAmount = Math.round(currentAmount * 0.10);

  // Generate dynamic UPI QR Code whenever amount changes
  useEffect(() => {
    if (!isOpen) return;
    const amt = currentAmount > 0 ? currentAmount : 500;
    const upiUri = `upi://pay?pa=${OFFICIAL_UPI_ID}&pn=56Club&am=${amt}&cu=INR&tn=Deposit_56Club_${user?.mobile_number || 'User'}`;
    
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code', err);
    });
  }, [isOpen, currentAmount, user]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(currentAmount));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleOpenUpiApp = () => {
    const upiUri = `upi://pay?pa=${OFFICIAL_UPI_ID}&pn=56Club&am=${currentAmount}&cu=INR&tn=Deposit_56Club`;
    window.location.href = upiUri;
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(currentAmount) || currentAmount < 100) {
      setErrorMessage('Minimum deposit amount is ₹100.');
      return;
    }

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMessage('Please enter the 12-digit UTR / UPI Reference Number from your payment.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setToastMessage(null);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          amount: currentAmount,
          utr_number: utrNumber.trim(),
          sender_upi: senderUpi.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit deposit.');
      } else {
        setSubmittedDeposit(data.deposit);
        setStep('submitted');
        await refreshWallet();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setErrorMessage('Network error while submitting deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Test Simulator Credit Option for developer / test demonstration
  const handleInstantSimulatorRecharge = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({ amount: currentAmount })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage('Simulator instant balance credited! (₹' + currentAmount + ' + ₹' + bonusAmount + ' Bonus)');
        if (data.wallet) updateWalletState(data.wallet);
        await refreshWallet();
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (e) {
      setErrorMessage('Failed instant simulation credit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="recharge-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="recharge-modal-content"
        className="w-full max-w-lg bg-[#121622] border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-200 relative max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 text-white mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Deposit to 56Club</h3>
            <p className="text-xs text-slate-400">Instant UPI QR & Direct UPI Payment</p>
          </div>
        </div>

        {step === 'submitted' ? (
          /* Step 2: Submission Success View */
          <div className="mt-4 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Deposit Request Submitted!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Your payment is queued for Admin review. Balance will be credited upon UTR verification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0d111a] border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Request ID:</span>
                <span className="text-white font-bold">{submittedDeposit?.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="text-emerald-400 font-bold text-sm">₹{submittedDeposit?.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Submitted UTR:</span>
                <span className="text-amber-300 font-bold">{submittedDeposit?.utr_number}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Destination UPI:</span>
                <span className="text-slate-200">{submittedDeposit?.destination_upi}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Pending Verification
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Admin verifies UTRs within 2-5 minutes. You can also view this request in Admin Panel.</span>
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
          /* Step 1: Deposit Configuration & QR Code Payment View */
          <div className="space-y-4 mt-3">
            {toastMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. AMOUNT SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">1. Select Deposit Amount</label>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> +10% Bonus: ₹{bonusAmount}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {presets.slice(0, 4).map((amt) => {
                  const active = selectedAmount === amt && !customAmount;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-[#172030] border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold">₹{amt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {presets.slice(4).map((amt) => {
                  const active = selectedAmount === amt && !customAmount;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-[#172030] border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold">₹{amt.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="mt-2.5 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  placeholder="Or enter custom amount (Min ₹100)"
                  className="w-full bg-[#161d2b] border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* 2. QR CODE & UPI ID CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#182030] to-[#101522] border border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-700/60 pb-2">
                <span className="flex items-center gap-1.5 text-white">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  2. Scan QR or Send to UPI
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  Amount: ₹{currentAmount.toLocaleString()}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <div className="relative p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="UPI QR Code" 
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-slate-800 text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                  {/* Center Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white">
                      56
                    </div>
                  </div>
                </div>

                {/* UPI Details & Copy buttons */}
                <div className="space-y-2.5 w-full">
                  <div className="p-2.5 rounded-xl bg-[#0c1018] border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Destination UPI ID
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 truncate select-all">
                        {OFFICIAL_UPI_ID}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30 transition-all shrink-0 active:scale-95"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0c1018] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Amount to Transfer
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        ₹{currentAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all active:scale-95"
                    >
                      {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedAmount ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Direct UPI App intent button */}
                  <button
                    type="button"
                    onClick={handleOpenUpiApp}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open in PhonePe / GPay / Paytm</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. SUBMIT UTR FORM */}
            <form onSubmit={handleSubmitDeposit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  3. Enter 12-Digit UPI Reference / UTR Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. 423156789012 (found in transaction receipt)"
                  className="w-full bg-[#161d2b] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Check your Google Pay / PhonePe / Paytm transaction details for the 12-digit UPI Ref ID / UTR.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Your Sender UPI ID / Mobile (Optional)
                </label>
                <input
                  type="text"
                  value={senderUpi}
                  onChange={(e) => setSenderUpi(e.target.value)}
                  placeholder="e.g. yourname@okaxis"
                  className="w-full bg-[#161d2b] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                id="submit-deposit-btn"
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  'Submitting Request...'
                ) : (
                  <>
                    <span>Submit Deposit (₹{currentAmount.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Instant Simulator Demo top-up option for quick testing */}
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handleInstantSimulatorRecharge}
                  disabled={isSubmitting}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors underline decoration-dotted"
                >
                  [Developer / Demo Testing: Click here to instantly credit simulator balance]
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
