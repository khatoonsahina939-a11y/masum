import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiftySixClubHeaderLogo } from './FiftySixClubHeaderLogo';
import { WinGoBall } from './WinGoBall';
import { WinGoResultModal, type WinGoResultModalData } from './WinGoResultModal';
import type { 
  WinGoMode, 
  WinGoRoundStatus, 
  DemoRoundResult, 
  DemoBet, 
  WinGoSelection,
  WinGoColor,
  WinGoSize
} from '../../types';
import { 
  ArrowLeft, 
  Headphones, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Wallet, 
  BookOpen, 
  Clock, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Check, 
  X, 
  TrendingUp, 
  HelpCircle,
  BarChart2,
  FileSpreadsheet,
  Zap,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinGoGameProps {
  initialMode?: WinGoMode;
  onBack: () => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onNavigate: (route: string) => void;
  onOpenRechargeRequirement?: () => void;
}

export const WinGoGame: React.FC<WinGoGameProps> = ({
  initialMode = '30s',
  onBack,
  onOpenRecharge,
  onOpenWithdraw,
  onNavigate,
  onOpenRechargeRequirement
}) => {
  const { user, wallet, refreshWallet, updateWalletState } = useAuth();
  const [mode, setMode] = useState<WinGoMode>(initialMode);
  const [roundStatus, setRoundStatus] = useState<WinGoRoundStatus | null>(null);
  const [history, setHistory] = useState<DemoRoundResult[]>([]);
  const [myBets, setMyBets] = useState<DemoBet[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Bottom tabs: 'chart' is active by default to match the reference screenshot!
  const [activeTab, setActiveTab] = useState<'history' | 'chart' | 'strategy'>('chart');

  // Selected bet & Bottom Sheet
  const [selectedBet, setSelectedBet] = useState<WinGoSelection | null>(null);
  const [baseUnit, setBaseUnit] = useState<number>(10);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);
  const [agreeRules, setAgreeRules] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [betFeedback, setBetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);

  // Win / Loss Result Popup Modal
  const [resultModalData, setResultModalData] = useState<WinGoResultModalData | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);
  const shownRoundIdsRef = useRef<Set<string>>(new Set());
  const placedRoundIdsRef = useRef<Set<string>>(new Set());

  // Reset round tracking when changing game mode
  useEffect(() => {
    prevRoundIdRef.current = null;
  }, [mode]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lucky Dragon highlight ball (default 9 as shown in screenshot)
  const [luckyDragonBall, setLuckyDragonBall] = useState<number>(9);

  // Total stake amount
  const totalStake = baseUnit * quantity * selectedMultiplier;

  // Sound generator
  const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.15) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted without interaction
    }
  };

  // Poll WinGo round status every 1s
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/wingo/status/${mode}`);
        if (res.ok && isMounted) {
          const data: WinGoRoundStatus = await res.json();
          setRoundStatus(data);
          setHistory(data.last_results);

          // Audio beep during last 5 seconds
          if (data.time_remaining <= 5 && data.time_remaining > 0) {
            playTone(850, 'square', 0.08);
          }

          // Detect round completion & check if user placed bets in the finished round
          if (prevRoundIdRef.current && prevRoundIdRef.current !== data.round_id) {
            const finishedRoundId = prevRoundIdRef.current;

            if (!shownRoundIdsRef.current.has(finishedRoundId) && user) {
              try {
                const betsRes = await fetch('/api/wingo/my-bets', {
                  headers: { 'x-user-id': user.user_id }
                });
                if (betsRes.ok) {
                  const betsData = await betsRes.json();
                  const allBets: DemoBet[] = betsData.bets || [];
                  const settledBets = allBets.filter(
                    (b: DemoBet) => b.round_id === finishedRoundId && b.status === 'settled'
                  );

                  // If user had bets in this settled round, trigger the Win/Lose popup!
                  if (settledBets.length > 0) {
                    shownRoundIdsRef.current.add(finishedRoundId);
                    const totalStakeAmount = settledBets.reduce((sum, b) => sum + b.stake, 0);
                    const totalPayoutAmount = settledBets.reduce((sum, b) => sum + (b.payout || 0), 0);
                    const isWin = totalPayoutAmount > 0;
                    const profit = totalPayoutAmount - totalStakeAmount;

                    // Locate finished round result
                    const finishedResult = (data.last_results || []).find(r => r.round_id === finishedRoundId) || data.last_results[0];

                    const parsedBets = settledBets.map(b => {
                      let selType = 'number';
                      let selVal: string | number = '';
                      try {
                        const parsed = typeof b.selection === 'string' ? JSON.parse(b.selection) : b.selection;
                        selType = parsed.type || 'number';
                        selVal = parsed.value ?? '';
                      } catch {
                        selVal = b.selection;
                      }
                      return {
                        selectionType: selType,
                        selectionValue: selVal,
                        stake: b.stake,
                        payout: b.payout || 0,
                        isWin: b.result === 'win'
                      };
                    });

                    setResultModalData({
                      roundId: finishedRoundId,
                      isWin,
                      totalStake: totalStakeAmount,
                      totalPayout: totalPayoutAmount,
                      profit,
                      winningNumber: finishedResult?.result_number ?? 0,
                      winningColor: finishedResult?.result_color ?? 'green',
                      winningSize: finishedResult?.result_size ?? 'small',
                      bets: parsedBets
                    });

                    // Refresh balance and my bets list
                    refreshWallet();
                    setMyBets(allBets.filter(b => b.mode === mode || !b.mode));
                  }
                }
              } catch (e) {
                console.error('Error settling round outcome for user:', e);
              }
            }
          }

          prevRoundIdRef.current = data.round_id;
        }
      } catch (err) {
        console.error('Error fetching wingo status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mode, soundEnabled, user]);

  // Fetch my bets & statistics
  const fetchMyBets = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/wingo/my-bets', {
        headers: { 'x-user-id': user.user_id }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBets(data.bets.filter((b: DemoBet) => b.mode === mode || !b.mode));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/wingo/stats/${mode}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'strategy') fetchMyBets();
    if (activeTab === 'chart') fetchStats();
  }, [activeTab, mode]);

  // Refresh my bets & wallet when round completes
  useEffect(() => {
    if (roundStatus && roundStatus.time_remaining === 1) {
      setTimeout(() => {
        fetchMyBets();
        refreshWallet();
        fetchStats();
      }, 1500);
    }
  }, [roundStatus?.round_id, roundStatus?.time_remaining]);

  // Manual wallet refresh
  const handleRefreshWallet = async () => {
    setIsRefreshingWallet(true);
    playTone(520, 'sine', 0.1);
    await refreshWallet();
    setTimeout(() => setIsRefreshingWallet(false), 600);
  };

  // Open bet sheet for an item
  const handleSelectBet = (selection: WinGoSelection) => {
    setSelectedBet(selection);
    if (selection.type === 'number') {
      setLuckyDragonBall(selection.value as number);
    }
    playTone(600, 'sine', 0.1);
  };

  // Quick random pick
  const handleRandomPick = () => {
    const randomNum = Math.floor(Math.random() * 10);
    setLuckyDragonBall(randomNum);
    setSelectedBet({ type: 'number', value: randomNum });
    playTone(750, 'triangle', 0.15);
  };

  // Submit bet
  const handlePlaceBet = async () => {
    if (!selectedBet) return;
    if (totalStake <= 0) {
      setBetFeedback({ type: 'error', text: 'Please select a valid stake.' });
      return;
    }

    if (!roundStatus?.is_betting_open) {
      setBetFeedback({ type: 'error', text: 'Betting is closed for this round (resolving).' });
      return;
    }

    if (!wallet || wallet.demo_balance < 100 || wallet.demo_balance < totalStake) {
      if (onOpenRechargeRequirement && (!wallet || wallet.demo_balance < 100)) {
        onOpenRechargeRequirement();
      }
      setBetFeedback({ type: 'error', text: 'Minimum ₹100 recharge required to activate game betting.' });
      return;
    }

    if (!agreeRules) {
      setBetFeedback({ type: 'error', text: 'Please agree to the pre-sale rules.' });
      return;
    }

    setIsSubmitting(true);
    setBetFeedback(null);

    try {
      const res = await fetch('/api/wingo/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          mode,
          selection: selectedBet,
          stake: totalStake
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setBetFeedback({ type: 'error', text: data.error || 'Failed to place bet' });
      } else {
        if (data.bet?.round_id) {
          placedRoundIdsRef.current.add(data.bet.round_id);
        }
        setBetFeedback({ type: 'success', text: `Bet of ₹${totalStake.toFixed(2)} placed successfully!` });
        playTone(650, 'sine', 0.2);
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.85 }
        });
        if (data.wallet) updateWalletState(data.wallet);
        fetchMyBets();
        setTimeout(() => {
          setSelectedBet(null);
          setBetFeedback(null);
        }, 1200);
      }
    } catch (err) {
      setBetFeedback({ type: 'error', text: 'Network error placing bet.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview helper for instant testing of Win / Lose popups
  const handlePreviewResult = (type: 'win' | 'lose') => {
    const currentRoundId = roundStatus?.round_id || '20260919100052380';
    if (type === 'win') {
      setResultModalData({
        roundId: currentRoundId,
        isWin: true,
        totalStake: 100,
        totalPayout: 196,
        profit: 96,
        winningNumber: 7,
        winningColor: 'green',
        winningSize: 'big',
        bets: [
          {
            selectionType: 'color',
            selectionValue: 'green',
            stake: 100,
            payout: 196,
            isWin: true
          }
        ]
      });
    } else {
      setResultModalData({
        roundId: currentRoundId,
        isWin: false,
        totalStake: 100,
        totalPayout: 0,
        profit: -100,
        winningNumber: 2,
        winningColor: 'red',
        winningSize: 'small',
        bets: [
          {
            selectionType: 'color',
            selectionValue: 'green',
            stake: 100,
            payout: 0,
            isWin: false
          }
        ]
      });
    }
  };

  // Format 4-digit flip cards: MM SS -> 4 distinct cards
  const timeSecs = roundStatus?.time_remaining || 0;
  const mins = Math.floor(timeSecs / 60);
  const secs = timeSecs % 60;
  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');
  const flipDigits = [minStr[0], minStr[1], secStr[0], secStr[1]];

  // Mode label helper
  const getModeLabel = (m: WinGoMode) => {
    switch (m) {
      case '30s': return 'WinGo 30sec';
      case '1m': return 'WinGo 1 Min';
      case '3m': return 'WinGo 3 Min';
      case '5m': return 'WinGo 5 Min';
    }
  };

  // Payout description for sheet
  const getPayoutTitle = () => {
    if (!selectedBet) return '';
    if (selectedBet.type === 'color') {
      if (selectedBet.value === 'green') return 'Green (Pays 2X / 1.5X on 5)';
      if (selectedBet.value === 'violet') return 'Violet (Pays 4.5X on 0 & 5)';
      if (selectedBet.value === 'red') return 'Red (Pays 2X / 1.5X on 0)';
    }
    if (selectedBet.type === 'number') {
      return `Number ${selectedBet.value} (Pays 9X)`;
    }
    if (selectedBet.type === 'size') {
      return selectedBet.value === 'big' ? 'Big (5-9) (Pays 2X)' : 'Small (0-4) (Pays 2X)';
    }
    return '';
  };

  // Color theme for sheet header
  const getSheetHeaderBg = () => {
    if (!selectedBet) return 'bg-[#f04449]';
    if (selectedBet.type === 'color') {
      if (selectedBet.value === 'green') return 'bg-[#10b981]';
      if (selectedBet.value === 'violet') return 'bg-[#9333ea]';
      return 'bg-[#f04449]';
    }
    if (selectedBet.type === 'size') {
      return selectedBet.value === 'big' ? 'bg-[#f59e0b]' : 'bg-[#60a5fa]';
    }
    if (selectedBet.type === 'number') {
      const n = selectedBet.value as number;
      if (n === 0 || n === 5) return 'bg-[#9333ea]';
      if ([1, 3, 7, 9].includes(n)) return 'bg-[#10b981]';
      return 'bg-[#f04449]';
    }
    return 'bg-[#f04449]';
  };

  return (
    <div id="wingo-container" className="min-h-screen bg-[#1c1c1e] text-slate-100 pb-28 font-sans">
      
      {/* 1. TOP BAR (56Club Game Header) */}
      <div className="sticky top-0 z-30 bg-[#1c1c1e]/98 backdrop-blur-md px-3.5 py-2.5 border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Back Button (Round Dark Circle with <) */}
          <button
            id="wingo-back-btn"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#2a2b30] hover:bg-[#34353b] text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-md"
            title="Back to Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Center 56Club Game Logo */}
          <FiftySixClubHeaderLogo onClick={() => onNavigate('/home')} />

          {/* Right Action Icons: Customer Support Headset & Sound Toggle */}
          <div className="flex items-center gap-2">
            <button
              id="wingo-support-btn"
              onClick={() => setShowSupportModal(true)}
              className="w-9 h-9 rounded-full bg-[#2a2b30] hover:bg-[#34353b] text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-md"
              title="24/7 Customer Support"
            >
              <Headphones className="w-4 h-4 text-slate-200" />
            </button>

            <button
              id="wingo-audio-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-9 h-9 rounded-full bg-[#2a2b30] hover:bg-[#34353b] text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-md"
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN MOBILE-FIRST CONTAINER */}
      <div className="max-w-md mx-auto px-3.5 pt-3 space-y-3.5">
        
        {/* 2. WALLET BALANCE CARD (Rounded 3XL, Large ₹0.42, Refresh ↻, Withdraw & Deposit Pills) */}
        <div 
          id="wingo-wallet-card" 
          className="rounded-3xl bg-[#26272b] p-4 sm:p-5 border border-white/5 shadow-xl space-y-4"
        >
          {/* Top: Balance Amount with Refresh ↻ */}
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              ₹{(wallet?.demo_balance ?? 0).toFixed(2)}
            </span>
            <button
              onClick={handleRefreshWallet}
              className={`w-7 h-7 rounded-full bg-[#34353b] text-slate-300 hover:text-white flex items-center justify-center transition-all ${
                isRefreshingWallet ? 'animate-spin text-emerald-400' : ''
              }`}
              title="Refresh Wallet Balance"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subtitle: Wallet Icon + "Wallet balance" */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#9e9ea7]">
            <div className="w-3.5 h-3.5 rounded bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Wallet className="w-2.5 h-2.5" />
            </div>
            <span>Wallet balance</span>
          </div>

          {/* Two Large Action Pills: Withdraw & Deposit */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="wingo-withdraw-btn"
              onClick={onOpenWithdraw}
              className="w-full py-3 rounded-full bg-[#f04449] hover:bg-[#e0383d] active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-red-950/40 transition-all cursor-pointer"
            >
              Withdraw
            </button>

            <button
              id="wingo-deposit-btn"
              onClick={onOpenRecharge}
              className="w-full py-3 rounded-full bg-[#10b981] hover:bg-[#0da070] active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* 3. WINGO 4-MODE SELECTOR (30sec, 1 Min, 3 Min, 5 Min) */}
        <div 
          id="wingo-mode-selector" 
          className="rounded-2xl bg-[#26272b] p-1.5 grid grid-cols-4 gap-1.5 border border-white/5"
        >
          {(['30s', '1m', '3m', '5m'] as WinGoMode[]).map((m) => {
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setSelectedBet(null);
                  playTone(550, 'sine', 0.1);
                }}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#f04449] text-white shadow-md'
                    : 'bg-[#33353b]/80 hover:bg-[#3d3f47] text-slate-300'
                }`}
              >
                {/* Clock Dial Icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 relative ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}>
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>

                {/* Two-line text */}
                <span className={`text-[11px] font-extrabold leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  WinGo
                </span>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-white/95' : 'text-slate-400'}`}>
                  {m === '30s' ? '30sec' : m === '1m' ? '1 Min' : m === '3m' ? '3 Min' : '5 Min'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. PERFORATED TICKET CARD (Solid Coral-Red, How To Play, 5 Recent Balls, 4 Flip-Clock Cards, Period ID) */}
        <div 
          id="wingo-ticket-banner" 
          className="relative rounded-3xl bg-[#f04449] p-4 sm:p-5 text-white shadow-2xl overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.15) 0%, transparent 60%)'
          }}
        >
          {/* Perforation Cutouts (Left & Right semicircular notches) */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1c1c1e] shadow-inner pointer-events-none" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1c1c1e] shadow-inner pointer-events-none" />

          <div className="grid grid-cols-2 gap-3 relative z-10">
            
            {/* Left Column: How To Play, Mode Title, 5 Recent Balls */}
            <div className="pr-3 border-r border-dashed border-white/40 flex flex-col justify-between">
              
              {/* "How To Play" Rounded Pill Button */}
              <div>
                <button
                  id="wingo-rules-btn"
                  onClick={() => setShowHowToPlay(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/80 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>How To Play</span>
                </button>
              </div>

              {/* Mode Name (e.g. WinGo 30sec) */}
              <div className="my-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wide drop-shadow-sm">
                  {getModeLabel(mode)}
                </span>
              </div>

              {/* 5 Recent Drawn Balls in a Row */}
              <div className="flex items-center gap-1 sm:gap-1.5 pt-1 overflow-x-auto">
                {history.slice(0, 5).map((h, i) => (
                  <WinGoBall
                    key={h.id || i}
                    number={h.result_number ?? 0}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Time Remaining, 4 Flip-Clock Cards, Period ID */}
            <div className="pl-2 flex flex-col justify-between items-end text-right">
              
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                Time remaining
              </span>

              {/* 4 White Flip-Clock Cards: [0] [0] : [0] [7] */}
              <div className="flex items-center gap-1 my-1.5">
                {/* Minute Digit 1 */}
                <div className="w-6 sm:w-7 h-8 sm:h-9 bg-white text-[#f04449] rounded-md flex items-center justify-center font-mono-gaming font-black text-lg sm:text-xl shadow-md border border-slate-100">
                  {flipDigits[0]}
                </div>
                {/* Minute Digit 2 */}
                <div className="w-6 sm:w-7 h-8 sm:h-9 bg-white text-[#f04449] rounded-md flex items-center justify-center font-mono-gaming font-black text-lg sm:text-xl shadow-md border border-slate-100">
                  {flipDigits[1]}
                </div>
                
                {/* Red Colon Divider */}
                <span className="text-white font-black text-lg px-0.5">:</span>

                {/* Second Digit 1 */}
                <div className={`w-6 sm:w-7 h-8 sm:h-9 bg-white text-[#f04449] rounded-md flex items-center justify-center font-mono-gaming font-black text-lg sm:text-xl shadow-md border border-slate-100 ${
                  timeSecs <= 5 ? 'animate-pulse' : ''
                }`}>
                  {flipDigits[2]}
                </div>
                {/* Second Digit 2 */}
                <div className={`w-6 sm:w-7 h-8 sm:h-9 bg-white text-[#f04449] rounded-md flex items-center justify-center font-mono-gaming font-black text-lg sm:text-xl shadow-md border border-slate-100 ${
                  timeSecs <= 5 ? 'animate-pulse' : ''
                }`}>
                  {flipDigits[3]}
                </div>
              </div>

              {/* Period ID (Long numeric identifier) */}
              <div className="text-[11px] font-mono-gaming font-bold text-white tracking-tight">
                {roundStatus?.round_id || '20260917100052379'}
              </div>
            </div>
          </div>
        </div>

        {/* 5. COLOR BETTING BUTTONS (Green, Violet, Red) */}
        <div id="wingo-color-buttons" className="grid grid-cols-3 gap-2.5">
          <button
            id="bet-green-btn"
            onClick={() => handleSelectBet({ type: 'color', value: 'green' })}
            className={`py-3.5 rounded-2xl font-bold text-base text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center ${
              selectedBet?.type === 'color' && selectedBet.value === 'green'
                ? 'bg-[#10b981] ring-3 ring-white shadow-emerald-900/60'
                : 'bg-[#10b981] hover:bg-[#0fa472]'
            }`}
          >
            <span>Green</span>
          </button>

          <button
            id="bet-violet-btn"
            onClick={() => handleSelectBet({ type: 'color', value: 'violet' })}
            className={`py-3.5 rounded-2xl font-bold text-base text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center ${
              selectedBet?.type === 'color' && selectedBet.value === 'violet'
                ? 'bg-[#a855f7] ring-3 ring-white shadow-purple-900/60'
                : 'bg-[#a855f7] hover:bg-[#9333ea]'
            }`}
          >
            <span>Violet</span>
          </button>

          <button
            id="bet-red-btn"
            onClick={() => handleSelectBet({ type: 'color', value: 'red' })}
            className={`py-3.5 rounded-2xl font-bold text-base text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center ${
              selectedBet?.type === 'color' && selectedBet.value === 'red'
                ? 'bg-[#f04449] ring-3 ring-white shadow-rose-900/60'
                : 'bg-[#f04449] hover:bg-[#e0383d]'
            }`}
          >
            <span>Red</span>
          </button>
        </div>

        {/* 6. NUMBER BALLS GRID (2 rows of 5 balls: 0-4 and 5-9, with lucky dragon on 9 / selected) */}
        <div id="wingo-number-balls-grid" className="rounded-2xl bg-[#26272b] p-3.5 border border-white/5 shadow-xl">
          {/* Row 1: 0, 1, 2, 3, 4 */}
          <div className="grid grid-cols-5 gap-2 justify-items-center mb-3">
            {[0, 1, 2, 3, 4].map((num) => {
              const isSelected = selectedBet?.type === 'number' && selectedBet.value === num;
              const hasDragon = luckyDragonBall === num;
              return (
                <WinGoBall
                  key={num}
                  number={num}
                  size="md"
                  isSelected={isSelected}
                  hasDragon={hasDragon}
                  onClick={() => handleSelectBet({ type: 'number', value: num })}
                />
              );
            })}
          </div>

          {/* Row 2: 5, 6, 7, 8, 9 */}
          <div className="grid grid-cols-5 gap-2 justify-items-center">
            {[5, 6, 7, 8, 9].map((num) => {
              const isSelected = selectedBet?.type === 'number' && selectedBet.value === num;
              const hasDragon = luckyDragonBall === num;
              return (
                <WinGoBall
                  key={num}
                  number={num}
                  size="md"
                  isSelected={isSelected}
                  hasDragon={hasDragon}
                  onClick={() => handleSelectBet({ type: 'number', value: num })}
                />
              );
            })}
          </div>
        </div>

        {/* 7. RANDOM & MULTIPLIERS BAR (Random button + X1, X5, X10, X20, X50, X100 chips) */}
        <div id="wingo-multipliers-bar" className="flex items-center justify-between gap-1.5 overflow-x-auto py-1">
          {/* Random Button */}
          <button
            id="wingo-random-pick-btn"
            onClick={handleRandomPick}
            className="px-3 py-1.5 rounded-lg border border-[#f04449] text-[#f04449] hover:bg-[#f04449]/15 active:scale-95 font-bold text-xs shrink-0 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Random</span>
          </button>

          {/* Multiplier Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[1, 5, 10, 20, 50, 100].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedMultiplier(m);
                  playTone(450 + m * 5, 'sine', 0.08);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMultiplier === m
                    ? 'bg-[#f04449] text-white shadow-md'
                    : 'bg-[#28292e] text-slate-400 hover:text-slate-200 hover:bg-[#34353d]'
                }`}
              >
                X{m}
              </button>
            ))}
          </div>
        </div>

        {/* 8. BIG / SMALL SELECTION (Big: Amber, Small: Sky Blue) */}
        <div id="wingo-big-small-buttons" className="grid grid-cols-2 gap-3">
          <button
            id="bet-big-btn"
            onClick={() => handleSelectBet({ type: 'size', value: 'big' })}
            className={`py-3.5 rounded-2xl font-bold text-lg text-white shadow-lg active:scale-95 transition-all flex items-center justify-center ${
              selectedBet?.type === 'size' && selectedBet.value === 'big'
                ? 'bg-[#f59e0b] ring-3 ring-white shadow-amber-900/60'
                : 'bg-[#f59e0b] hover:bg-[#d97706]'
            }`}
          >
            <span>Big</span>
          </button>

          <button
            id="bet-small-btn"
            onClick={() => handleSelectBet({ type: 'size', value: 'small' })}
            className={`py-3.5 rounded-2xl font-bold text-lg text-white shadow-lg active:scale-95 transition-all flex items-center justify-center ${
              selectedBet?.type === 'size' && selectedBet.value === 'small'
                ? 'bg-[#60a5fa] ring-3 ring-white shadow-blue-900/60'
                : 'bg-[#60a5fa] hover:bg-[#3b82f6]'
            }`}
          >
            <span>Small</span>
          </button>
        </div>

        {/* WIN/LOSE POPUP TEST PREVIEW BAR */}
        <div id="wingo-popup-preview-bar" className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#26272b] border border-white/5 shadow-md">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Win/Lose Pop-up:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="wingo-test-win-popup-btn"
              onClick={() => handlePreviewResult('win')}
              className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
              title="Test Win Pop-up"
            >
              <span>🎉 Win Pop-up</span>
            </button>
            <button
              id="wingo-test-lose-popup-btn"
              onClick={() => handlePreviewResult('lose')}
              className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
              title="Test Lose Pop-up"
            >
              <span>💔 Lose Pop-up</span>
            </button>
          </div>
        </div>

        {/* 9. BOTTOM NAVIGATION TABS (Game history, Chart [Active], Follow Strategy) */}
        <div className="pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            
            {/* Game history */}
            <button
              onClick={() => setActiveTab('history')}
              className={`text-xs sm:text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${
                activeTab === 'history'
                  ? 'bg-[#f04449] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Game history
            </button>

            {/* Chart (Active Red Pill in screenshot) */}
            <button
              onClick={() => setActiveTab('chart')}
              className={`text-xs sm:text-sm font-bold transition-all px-4 py-1.5 rounded-lg ${
                activeTab === 'chart'
                  ? 'bg-[#f04449] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chart
            </button>

            {/* Follow Strategy / My Bets */}
            <button
              onClick={() => setActiveTab('strategy')}
              className={`text-xs sm:text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${
                activeTab === 'strategy'
                  ? 'bg-[#f04449] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Follow Strategy
            </button>
          </div>

          {/* TAB CONTENT 1: CHART (Active by default) */}
          {activeTab === 'chart' && (
            <div id="wingo-chart-view" className="mt-3 rounded-2xl bg-[#26272b] p-3.5 border border-white/5 space-y-4">
              
              {/* Number Distribution Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#f04449]" />
                  Winning Numbers Trend
                </span>
                <button
                  onClick={() => setShowFairnessModal(true)}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono-gaming"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Provably Fair
                </button>
              </div>

              {/* Connected Dots Visual Table */}
              <div className="overflow-x-auto rounded-xl bg-[#1c1c1e] p-2 border border-white/5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/5 pb-1">
                      <th className="py-1 px-1.5 text-left font-mono-gaming text-[11px]">Period</th>
                      <th className="py-1 px-1.5 text-center font-mono-gaming text-[11px]">Number</th>
                      <th className="py-1 px-1.5 text-center font-mono-gaming text-[11px]">Size</th>
                      <th className="py-1 px-1.5 text-center font-mono-gaming text-[11px]">Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.slice(0, 10).map((h) => (
                      <tr key={h.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-1.5 px-1.5 font-mono-gaming text-slate-300 text-[11px]">
                          {h.round_id.slice(-6)}
                        </td>
                        <td className="py-1.5 px-1.5 text-center">
                          <WinGoBall number={h.result_number ?? 0} size="sm" />
                        </td>
                        <td className="py-1.5 px-1.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            h.result_size === 'big' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {h.result_size}
                          </span>
                        </td>
                        <td className="py-1.5 px-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              h.result_color?.includes('violet')
                                ? 'bg-[#9333ea]'
                                : h.result_color === 'green'
                                ? 'bg-[#10b981]'
                                : 'bg-[#f04449]'
                            }`} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Number Frequency Statistics Bar */}
              {stats && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Digit Frequency (Last {stats.total_rounds_analyzed} Draws)
                  </span>
                  <div className="grid grid-cols-10 gap-1 items-end h-20 bg-[#1c1c1e] p-2 rounded-xl border border-white/5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const count = stats.frequency[num] || 0;
                      const maxCount = Math.max(...Object.values(stats.frequency as Record<number, number>)) || 1;
                      const heightPct = Math.round((count / maxCount) * 100);

                      return (
                        <div key={num} className="flex flex-col items-center h-full justify-end">
                          <span className="text-[9px] text-slate-400 font-mono-gaming mb-0.5">{count}</span>
                          <div
                            style={{ height: `${Math.max(14, heightPct)}%` }}
                            className={`w-full rounded-t-sm ${
                              num === 0 || num === 5
                                ? 'bg-purple-500'
                                : [1, 3, 7, 9].includes(num)
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-[10px] font-black text-white mt-1">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: GAME HISTORY */}
          {activeTab === 'history' && (
            <div id="wingo-history-view" className="mt-3 rounded-2xl bg-[#26272b] p-3.5 border border-white/5 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1c1c1e] text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-2 px-2.5 font-mono-gaming">Period</th>
                    <th className="py-2 px-2.5 text-center">Number</th>
                    <th className="py-2 px-2.5 text-center">Big/Small</th>
                    <th className="py-2 px-2.5 text-center">Color</th>
                    <th className="py-2 px-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-gaming">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-white/5">
                      <td className="py-2 px-2.5 text-slate-300 font-bold">{h.round_id}</td>
                      <td className="py-2 px-2.5 text-center">
                        <WinGoBall number={h.result_number ?? 0} size="sm" />
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          h.result_size === 'big' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {h.result_size}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="capitalize text-slate-300 text-[11px]">{h.result_color}</span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-400 text-[10px]">
                        {h.completed_at ? new Date(h.completed_at).toLocaleTimeString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB CONTENT 3: FOLLOW STRATEGY / MY BETS */}
          {activeTab === 'strategy' && (
            <div id="wingo-strategy-view" className="mt-3 rounded-2xl bg-[#26272b] p-3.5 border border-white/5">
              {myBets.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No bets recorded in {getModeLabel(mode)} yet. Tap any ball or color above to test!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myBets.map((b) => {
                    let parsedSel: any = {};
                    try { parsedSel = JSON.parse(b.selection); } catch (e) {}

                    return (
                      <div key={b.id} className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="text-slate-400 font-mono-gaming text-[11px]">{b.round_id}</div>
                          <div className="font-bold text-white uppercase flex items-center gap-1.5">
                            <span>{parsedSel.type}:</span>
                            <span className="text-[#f04449]">{parsedSel.value}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">Stake: ₹{b.stake.toFixed(2)}</div>
                        </div>

                        <div className="text-right space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                            b.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : b.result === 'win'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {b.status === 'pending' ? 'Pending' : b.result}
                          </span>
                          <div className="font-mono-gaming font-extrabold text-sm">
                            {b.result === 'win' ? (
                              <span className="text-emerald-400">+₹{b.payout.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-500">₹0.00</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 10. AUTHENTIC BET PLACEMENT BOTTOM SHEET / DRAWER */}
      {selectedBet && (
        <div 
          id="wingo-bet-sheet-overlay" 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBet(null);
          }}
        >
          <div 
            id="wingo-bet-sheet"
            className="w-full max-w-md bg-[#26272b] rounded-t-3xl border-t border-white/10 shadow-2xl p-4 sm:p-5 text-slate-100 animate-in slide-in-from-bottom duration-200"
          >
            {/* Top Color Banner */}
            <div className={`-mt-4 -mx-4 sm:-mt-5 sm:-mx-5 p-3.5 rounded-t-3xl ${getSheetHeaderBg()} text-white flex items-center justify-between shadow-md`}>
              <div className="font-extrabold text-base tracking-wide">
                {getPayoutTitle()}
              </div>
              <button 
                onClick={() => setSelectedBet(null)}
                className="w-7 h-7 rounded-full bg-black/25 flex items-center justify-center text-white hover:bg-black/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balance Info */}
            <div className="flex items-center justify-between pt-4 pb-2 text-xs text-slate-300 border-b border-white/5">
              <span>Available Balance</span>
              <span className="font-bold text-white font-mono-gaming text-sm">
                ₹{(wallet?.demo_balance ?? 0).toFixed(2)}
              </span>
            </div>

            {/* Base Unit Chips (₹1, ₹10, ₹100, ₹1000) */}
            <div className="pt-3">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Base Unit (₹)</span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 10, 100, 1000].map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setBaseUnit(unit)}
                    className={`py-2 rounded-xl font-bold font-mono-gaming text-xs sm:text-sm border transition-all ${
                      baseUnit === unit
                        ? 'bg-[#f04449] text-white border-[#f04449] shadow-md'
                        : 'bg-[#1c1c1e] text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    ₹{unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper: [-] quantity [+] with Quick Chips */}
            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Quantity</span>
              <div className="flex items-center gap-3 bg-[#1c1c1e] rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-[#2a2b30] hover:bg-[#34353b] text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-mono-gaming font-black text-sm text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-[#2a2b30] hover:bg-[#34353b] text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Multipliers Quick Bar */}
            <div className="pt-3">
              <div className="flex items-center justify-between gap-1">
                {[1, 5, 10, 20, 50, 100].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedMultiplier === m
                        ? 'bg-[#f04449] text-white shadow-md'
                        : 'bg-[#1c1c1e] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    X{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAgreeRules(!agreeRules)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  agreeRules ? 'bg-[#f04449] border-[#f04449] text-white' : 'border-slate-500 bg-transparent'
                }`}
              >
                {agreeRules && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span className="text-[11px] text-slate-400">
                I agree to the <strong className="text-slate-200">PRE-SALE RULES</strong>
              </span>
            </div>

            {/* Feedback Alert */}
            {betFeedback && (
              <div className={`mt-3 p-2.5 rounded-xl text-xs font-semibold ${
                betFeedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {betFeedback.text}
              </div>
            )}

            {/* Action Buttons: Cancel & Total Amount Confirm */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={() => setSelectedBet(null)}
                className="w-1/3 py-3 rounded-full bg-[#34353b] hover:bg-[#3d3f47] text-slate-200 font-bold text-sm transition-all"
              >
                Cancel
              </button>

              <button
                id="confirm-place-bet-btn"
                onClick={handlePlaceBet}
                disabled={isSubmitting || !roundStatus?.is_betting_open}
                className="w-2/3 py-3 rounded-full bg-[#f04449] hover:bg-[#e0383d] text-white font-black text-sm sm:text-base shadow-lg shadow-rose-950/50 transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Confirming...'
                  : !roundStatus?.is_betting_open
                  ? 'Round Closed'
                  : `Total amount ₹${totalStake.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. "HOW TO PLAY" MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#26272b] border border-white/10 rounded-3xl p-5 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#f04449] font-extrabold text-base">
                <BookOpen className="w-5 h-5" />
                <span>WinGo Game Rules</span>
              </div>
              <button onClick={() => setShowHowToPlay(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 max-h-96 overflow-y-auto pr-1">
              <p>
                <strong>Game Cycles:</strong> WinGo runs in 30s, 1 Min, 3 Min, and 5 Min intervals. The last 5 seconds of every round are reserved for outcome settlement.
              </p>
              
              <div className="space-y-2 p-3 rounded-xl bg-[#1c1c1e] border border-white/5">
                <h4 className="font-bold text-white">Payout Structure:</h4>
                <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                  <li><strong className="text-emerald-400">Green (1, 3, 7, 9):</strong> 2X payout. If 5 appears, pays 1.5X.</li>
                  <li><strong className="text-rose-400">Red (2, 4, 6, 8):</strong> 2X payout. If 0 appears, pays 1.5X.</li>
                  <li><strong className="text-purple-400">Violet (0, 5):</strong> 4.5X payout.</li>
                  <li><strong className="text-amber-400">Number (0 - 9):</strong> Exact match pays 9X.</li>
                  <li><strong className="text-blue-400">Big (5 - 9) / Small (0 - 4):</strong> 2X payout.</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-400">
                All rounds use cryptographic SHA-256 pre-seeded provably fair algorithms to ensure absolute transparency.
              </p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-full bg-[#f04449] text-white font-bold text-sm shadow-md"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* 12. 24/7 CUSTOMER SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#26272b] border border-white/10 rounded-3xl p-5 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base">
                <Headphones className="w-5 h-5" />
                <span>24/7 Customer Service</span>
              </div>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Welcome to 56Club Support! How can our automated assistant help you today?</p>
              
              <div className="space-y-2">
                <button 
                  onClick={() => alert('Customer Support: Deposit via official UPI (shahidddd@naviaxis). Minimum first recharge is ₹100.')}
                  className="w-full p-2.5 rounded-xl bg-[#1c1c1e] hover:bg-white/5 border border-white/5 text-left font-medium text-[11px] text-slate-200"
                >
                  💳 Deposit / Recharge Assistance
                </button>
                <button 
                  onClick={() => alert('Customer Support: Withdrawals are processed 24/7 directly to your registered UPI ID.')}
                  className="w-full p-2.5 rounded-xl bg-[#1c1c1e] hover:bg-white/5 border border-white/5 text-left font-medium text-[11px] text-slate-200"
                >
                  💸 Withdrawal Verification Queries
                </button>
                <button 
                  onClick={() => alert('Customer Support: All WinGo outcomes are provably fair with pre-published SHA-256 hashes!')}
                  className="w-full p-2.5 rounded-xl bg-[#1c1c1e] hover:bg-white/5 border border-white/5 text-left font-medium text-[11px] text-slate-200"
                >
                  🛡️ Provably Fair Game Verification
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-full bg-[#34353b] hover:bg-[#3d3f47] text-white font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 13. PROVABLE FAIRNESS VERIFICATION MODAL */}
      {showFairnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#26272b] border border-white/10 rounded-3xl p-5 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>Provable Fairness Verification</span>
              </div>
              <button onClick={() => setShowFairnessModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                In 56Club's transparent simulation engine, every round outcome is predetermined and hashed
                <strong> before</strong> user betting opens.
              </p>

              <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5 font-mono-gaming space-y-1">
                <span className="text-[10px] uppercase text-slate-500 block">Active Round SHA-256 Hash</span>
                <p className="text-white text-[11px] break-all">{roundStatus?.hash || 'SHA-256...'}</p>
              </div>

              <p className="text-[11px] text-slate-400">
                Because this hash is published ahead of time, results cannot be manipulated during or after betting.
              </p>
            </div>

            <button
              onClick={() => setShowFairnessModal(false)}
              className="w-full py-2.5 rounded-full bg-[#34353b] hover:bg-[#3d3f47] text-white font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 14. WIN / LOSE RESULT POPUP MODAL */}
      {resultModalData && (
        <WinGoResultModal
          data={resultModalData}
          onClose={() => setResultModalData(null)}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
};
