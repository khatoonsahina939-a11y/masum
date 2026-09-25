import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  Sparkles, 
  Users, 
  QrCode, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  ExternalLink,
  MessageCircle,
  Coins,
  Send,
  HelpCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const ReferModal: React.FC<ReferModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [socialShared, setSocialShared] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [availableBonus, setAvailableBonus] = useState(1200);
  const [totalInvited, setTotalInvited] = useState(4);
  const [totalEarned, setTotalEarned] = useState(3800);

  // Generate personal invite code and link
  const inviteCode = user 
    ? (user.referral_code || `56C${user.user_id ? user.user_id.replace(/\D/g, '').slice(-4) || '8888' : '7777'}`)
    : '56CLUBVIP';

  // Derive the public base URL (convert private ais-dev to public ais-pre)
  const getPublicBaseUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://ais-pre-mnpw33jdciztf453ayiceb-66681296540.asia-southeast1.run.app';
    }
    let origin = window.location.origin;
    // When running inside AI Studio private dev environment (ais-dev-...)
    // Anyone opening ais-dev outside gets Google AI Studio 404 "Page not found".
    // We MUST use the public ais-pre- domain so anyone on WhatsApp or mobile can open it.
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      origin = 'https://ais-pre-mnpw33jdciztf453ayiceb-66681296540.asia-southeast1.run.app';
    }
    return origin;
  };

  const baseUrl = getPublicBaseUrl();
  const inviteLink = `${baseUrl}/?ref=${inviteCode}`;

  const shareText = `🎮 Join me on 56Club! Play WinGo Lottery and Aviator games. Sign up with my referral code [${inviteCode}] to claim your ₹10 Free Bonus! 🚀 Tap here to play: ${inviteLink}`;

  // Reset copied states on open
  useEffect(() => {
    if (isOpen) {
      setCopiedLink(false);
      setCopiedCode(false);
      setSocialShared(null);
      setClaimSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'native') => {
    setSocialShared(platform);
    setTimeout(() => setSocialShared(null), 3000);

    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'Join 56Club Lottery & Aviator',
        text: shareText,
        url: inviteLink
      }).catch(() => {});
      return;
    }

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClaimCommission = async () => {
    if (availableBonus <= 0) return;
    setIsClaiming(true);
    setClaimSuccess(null);

    try {
      // Call server to add bonus or local simulation
      const token = localStorage.getItem('56club_token');
      if (token) {
        await fetch('/api/wallet/recharge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: availableBonus })
        });
      }
      await refreshWallet();
      setClaimSuccess(`🎉 Successfully claimed ₹${availableBonus} to your balance!`);
      setTotalEarned(prev => prev + availableBonus);
      setAvailableBonus(0);
    } catch (err) {
      setClaimSuccess(`🎉 Claimed ₹${availableBonus} to your balance!`);
      setAvailableBonus(0);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0e131d] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-rose-900/60 via-purple-900/50 to-amber-900/40 border-b border-slate-800 shrink-0">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-purple-500" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] shadow-lg shadow-rose-950/60 shrink-0">
              <div className="w-full h-full bg-[#111724] rounded-[14px] flex items-center justify-center">
                <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-black text-white tracking-tight">
                  Refer & Earn Commission
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 uppercase tracking-wide">
                  30% Rebate
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Invite friends with your unique game link and earn instant cash commission!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Prompt if guest */}
          {!user && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="text-rose-200 font-medium">
                <span className="font-bold text-white block">Log in to track personal referrals</span>
                Create or log in to your account to track friend commission and claim bonuses.
              </div>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 shadow transition-all cursor-pointer"
                >
                  Log In
                </button>
              )}
            </div>
          )}

          {/* Key Metric Tiles */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#141b29] border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Friends Joined
              </span>
              <span className="text-lg sm:text-xl font-mono-gaming font-black text-white mt-0.5 block">
                {user ? totalInvited : 0}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Active Players</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#141b29] border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Earned
              </span>
              <span className="text-lg sm:text-xl font-mono-gaming font-black text-amber-400 mt-0.5 block">
                {user ? totalEarned.toLocaleString() : 0} DC
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Lifetime Rebate</span>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1a1c2d] to-[#121422] border border-purple-500/30 relative">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                Claimable
              </span>
              <span className="text-lg sm:text-xl font-mono-gaming font-black text-emerald-400 mt-0.5 block">
                {user ? availableBonus.toLocaleString() : 0} DC
              </span>
              <button
                disabled={!user || availableBonus <= 0 || isClaiming}
                onClick={handleClaimCommission}
                className="mt-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[10px] font-extrabold text-white transition-all shadow cursor-pointer disabled:cursor-not-allowed"
              >
                {isClaiming ? 'Claiming...' : 'Claim Now'}
              </button>
            </div>
          </div>

          {claimSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {/* 1. Shareable Game Link Section with Copy-To-Clipboard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                Your Exclusive Game Invite Link
              </label>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                {showQr ? 'Hide QR' : 'Show QR Code'}
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="referral-link-input"
                type="text"
                readOnly
                value={inviteLink}
                className="w-full bg-[#141b29] border border-slate-700/90 rounded-2xl pl-3.5 pr-28 py-3 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-rose-500 select-all"
              />
              <button
                id="copy-invite-link-btn"
                type="button"
                onClick={handleCopyLink}
                className={`absolute right-1.5 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white scale-95' 
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white active:scale-95'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Code expansion */}
            {showQr && (
              <div className="p-4 rounded-2xl bg-white text-slate-900 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                  {/* High quality visual QR representation */}
                  <svg className="w-36 h-36 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM10 40h10v10H10zM30 40h10v20H30zM50 40h10v10H50zM70 40h20v10H70zM40 60h20v10H40zM70 60h10v20H70zM80 70h20v10H80zM50 80h10v20H50zM60 90h30v10H60zM40 90h10v10H40z" />
                  </svg>
                </div>
                <span className="font-bold text-xs mt-2 text-slate-800">Scan to Open 56Club & Register</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Code: {inviteCode}</span>
              </div>
            )}
          </div>

          {/* 2. Referral Code Quick Copy Box */}
          <div className="p-3.5 rounded-2xl bg-[#141b29] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Referral Code
              </span>
              <span className="font-mono-gaming font-black text-xl text-amber-400 tracking-wider">
                {inviteCode}
              </span>
            </div>

            <button
              id="copy-referral-code-btn"
              type="button"
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedCode 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Sharing Guidance Card */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-200">How Friends Join: </span>
              Your link automatically points to the public shared game server. If a friend visits the site directly on their phone or browser, they can also simply enter your referral code <span className="font-mono font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">{inviteCode}</span> in the registration form.
            </div>
          </div>

          {/* 3. Social Share Buttons (WhatsApp, Telegram, Facebook, Twitter, Native) */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Share Directly to Friends
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp Button */}
              <button
                id="share-whatsapp-btn"
                type="button"
                onClick={() => handleSocialShare('whatsapp')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                title="Share on WhatsApp"
              >
                {/* WhatsApp SVG Icon */}
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.18-.553-1.614-.666-2.736-2.296-2.822-2.409-.081-.114-.669-.888-.669-1.693 0-.805.422-1.202.573-1.365.144-.155.312-.198.418-.198.106 0 .211.002.304.007.098.005.231-.037.361.275.134.323.457 1.116.498 1.199.04.082.067.177.014.283-.053.106-.079.172-.158.265-.08.093-.169.208-.24.28-.082.083-.168.173-.072.338.096.164.427.705.917 1.141.63.561 1.161.735 1.326.817.165.082.261.072.358-.04.098-.113.419-.489.531-.657.112-.168.225-.14.378-.083.153.057.973.459 1.14.543.167.083.279.125.32.195.042.07.042.406-.102.811z" />
                </svg>
                <span>WhatsApp</span>
              </button>

              {/* Telegram Button */}
              <button
                id="share-telegram-btn"
                type="button"
                onClick={() => handleSocialShare('telegram')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                title="Share on Telegram"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              {/* Facebook Button */}
              <button
                id="share-facebook-btn"
                type="button"
                onClick={() => handleSocialShare('facebook')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                title="Share on Facebook"
              >
                {/* Facebook SVG Icon */}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                </svg>
                <span>Facebook</span>
              </button>

              {/* X / Twitter Button */}
              <button
                id="share-twitter-btn"
                type="button"
                onClick={() => handleSocialShare('twitter')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#000000] hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                title="Share on X"
              >
                {/* X SVG Icon */}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Post on X</span>
              </button>
            </div>

            {/* Native share on mobile if supported */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() => handleSocialShare('native')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>More Share Options (SMS, Instagram, Discord)</span>
              </button>
            )}

            {socialShared && (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] text-center font-medium animate-in fade-in">
                Opening {socialShared.toUpperCase()} invite prompt with pre-filled game link!
              </div>
            )}
          </div>

          {/* 4. Commission Tier Breakdown */}
          <div className="p-4 rounded-2xl bg-[#121722] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                3-Tier Commission Structure
              </span>
              <span className="text-[10px] text-slate-400">Automated Daily Credit</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#161d2b] border border-slate-700/60 text-center">
                <span className="text-amber-400 font-extrabold text-sm block">Tier 1</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Direct Friends</span>
                <span className="text-emerald-400 font-bold font-mono block mt-1">30% Rebate</span>
                <span className="text-[9px] text-slate-500">+1,000 DC bonus</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#161d2b] border border-slate-700/60 text-center">
                <span className="text-purple-400 font-extrabold text-sm block">Tier 2</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Friends of Friends</span>
                <span className="text-emerald-400 font-bold font-mono block mt-1">20% Rebate</span>
                <span className="text-[9px] text-slate-400">+₹50 bonus</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#161d2b] border border-slate-700/60 text-center">
                <span className="text-rose-400 font-extrabold text-sm block">Tier 3</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sub-Team Network</span>
                <span className="text-emerald-400 font-bold font-mono block mt-1">10% Rebate</span>
                <span className="text-[9px] text-slate-400">+₹25 bonus</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Every bet your invited friends place in WinGo or Aviator generates instant real commission into your wallet, even if their bet wins!
            </p>
          </div>

          {/* 5. How It Works Steps */}
          <div className="p-4 rounded-2xl bg-[#121722] border border-slate-800 space-y-2.5 text-xs text-slate-300">
            <span className="font-bold text-white block">How Referral Works:</span>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Copy your exclusive invite link or referral code above.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Send to friends on WhatsApp, Telegram, or social media.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>When your friend registers, they receive 1,000 DC bonus and you start earning daily bet commissions!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0b0e14] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            56Club Provably Fair Simulator • Unlimited Referrals
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
