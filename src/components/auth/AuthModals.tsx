import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { 
  X, 
  Smartphone, 
  Lock, 
  Gift, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Form states
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref') || '';
    }
    return '';
  });
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync ref param on open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCode(ref);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMobile('');
    setPassword('');
    setConfirmPassword('');
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setReferralCode(urlParams.get('ref') || '');
    } else {
      setReferralCode('');
    }
  };

  const handleModeSwitch = (newMode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const trimmedMobile = mobile.trim();
        if (!trimmedMobile) {
          setErrorMsg('Please enter your 10-digit mobile number or username.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setErrorMsg('Please enter your password.');
          setIsSubmitting(false);
          return;
        }

        const res = await login(trimmedMobile, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Login failed. Please check your credentials.');
        } else {
          setSuccessMsg('Welcome back to 56Club!');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 600);
        }
      } else if (mode === 'register') {
        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Confirm password must match the chosen password.');
          setIsSubmitting(false);
          return;
        }

        const res = await register(mobile.trim(), password, confirmPassword, referralCode.trim());
        if (!res.success) {
          // Exactly matches the requirement message if duplicate
          setErrorMsg(res.error || 'Registration failed');
        } else {
          setSuccessMsg('Account created successfully! 10,000 Demo Credits added.');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 800);
        }
      } else if (mode === 'forgot') {
        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          setIsSubmitting(false);
          return;
        }

        const res = await forgotPassword(mobile.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'Reset failed');
        } else {
          setSuccessMsg(res.message || 'Password reset instructions sent');
          setTimeout(() => {
            setMode('login');
          }, 2500);
        }
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200 relative overflow-hidden"
      >
        {/* Subtle top glow bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-400" />

        {/* Close Button */}
        <button
          id="auth-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <BrandLogo size="lg" />
          <h2 className="text-xl font-bold text-white mt-3">
            {mode === 'login' && 'Sign in to 56Club'}
            {mode === 'register' && 'Create Your 56Club Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {mode === 'login' && 'Access WinGo lotteries, Aviator flight crash game, and your verified wallet.'}
            {mode === 'register' && 'Register now and receive ₹10 Free Registration Bonus in your wallet.'}
            {mode === 'forgot' && 'Enter your registered 10-digit mobile number to reset credentials.'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div
            id="auth-error-alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            id="auth-success-alert"
            className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mobile Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-medium">
                <Smartphone className="w-4 h-4 mr-1.5 text-slate-500" />
                +91
              </div>
              <input
                id="auth-mobile-input"
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full bg-[#182030] border border-slate-700/80 rounded-xl pl-16 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono-gaming"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#182030] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Confirm Password Field (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#182030] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Optional Referral Code (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Referral Code <span className="text-slate-500 font-normal">(Optional)</span></span>
                <span className="text-[10px] text-emerald-400 font-bold">+₹10 Welcome Bonus</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Gift className="w-4 h-4" />
                </div>
                <input
                  id="auth-referral-input"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CLUB56"
                  className="w-full bg-[#182030] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono-gaming uppercase"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Log In'}
                  {mode === 'register' && 'Register Now'}
                  {mode === 'forgot' && 'Reset Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className="text-rose-400 hover:text-rose-300 font-bold underline ml-1"
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-rose-400 hover:text-rose-300 font-bold underline ml-1"
              >
                Log In
              </button>
            </p>
          )}
        </div>

        {/* Disclaimer footer */}
        <div className="mt-4 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[10px] text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>56Club Virtual Engine:</strong> Virtual credits only. No real money gambling, fiat currency, or external financial payouts.
          </span>
        </div>
      </div>
    </div>
  );
};

export const AuthModals = AuthModal;
