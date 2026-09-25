import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { AviatorRoundStatus, DemoBet, DemoRoundResult } from '../../types';
import { 
  ArrowLeft, 
  PlusCircle, 
  ArrowUpRight, 
  Coins, 
  History, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Menu,
  X,
  Info,
  Flame,
  Plus,
  Minus,
  Trophy,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  drawVintageAviatorPlane, 
  drawAviatorBackground, 
  SmokeParticle 
} from './AviatorPlaneRenderer';

interface AviatorGameProps {
  onBack: () => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onNavigate: (route: string) => void;
  onOpenRechargeRequirement?: () => void;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  onBack,
  onOpenRecharge,
  onOpenWithdraw,
  onNavigate,
  onOpenRechargeRequirement
}) => {
  const { user, wallet, refreshWallet, updateWalletState } = useAuth();
  
  // Server telemetry state
  const [status, setStatus] = useState<AviatorRoundStatus | null>(null);
  const [activeBets, setActiveBets] = useState<DemoBet[]>([]);
  const [history, setHistory] = useState<DemoRoundResult[]>([]);
  const [myBetsHistory, setMyBetsHistory] = useState<DemoBet[]>([]);

  // Betting Panel 1 state
  const [stake1, setStake1] = useState<number>(10);
  const [customStake1, setCustomStake1] = useState<string>('');
  const [tab1, setTab1] = useState<'bet' | 'auto'>('bet');
  const [autoCashout1, setAutoCashout1] = useState<string>('2.00');
  const [isAutoEnabled1, setIsAutoEnabled1] = useState<boolean>(false);
  const [isPlacing1, setIsPlacing1] = useState<boolean>(false);
  const [isCashing1, setIsCashing1] = useState<boolean>(false);

  // Betting Panel 2 state (Dual bet matching reference image)
  const [showPanel2, setShowPanel2] = useState<boolean>(true);
  const [stake2, setStake2] = useState<number>(10);
  const [customStake2, setCustomStake2] = useState<string>('');
  const [tab2, setTab2] = useState<'bet' | 'auto'>('bet');
  const [autoCashout2, setAutoCashout2] = useState<string>('2.00');
  const [isAutoEnabled2, setIsAutoEnabled2] = useState<boolean>(false);
  const [isPlacing2, setIsPlacing2] = useState<boolean>(false);
  const [isCashing2, setIsCashing2] = useState<boolean>(false);

  // Active Bottom Feed Tab: 'all' | 'my' | 'top'
  const [feedTab, setFeedTab] = useState<'all' | 'my' | 'top'>('all');

  // Alerts & Notifications
  const [betError, setBetError] = useState<string | null>(null);
  const [cashoutSuccess, setCashoutSuccess] = useState<string | null>(null);

  // Modals & Sound
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Canvas and Animation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Flight simulation variables
  const flightStateRef = useRef({
    displayMultiplier: 1.00,
    targetMultiplier: 1.00,
    propellerAngle: 0,
    crashTimestamp: 0,
    lastX: 40,
    lastY: 300,
    lastAngle: -0.15,
    state: 'betting_open',
    particles: [] as SmokeParticle[]
  });

  // Sound generator
  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.15) => {
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
    } catch (e) {}
  };

  // Poll Aviator server state every 150ms for smooth live telemetry
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/aviator/status');
        if (res.ok && isMounted) {
          const data: AviatorRoundStatus = await res.json();
          setStatus(data);

          // Update flight state ref
          flightStateRef.current.targetMultiplier = data.current_multiplier;

          if (data.state === 'crashed' && flightStateRef.current.state !== 'crashed') {
            flightStateRef.current.crashTimestamp = Date.now();
            playSound(160, 'sawtooth', 0.25);
          }
          flightStateRef.current.state = data.state;
        }
      } catch (err) {
        console.error('Error fetching aviator status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 150);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [soundEnabled]);

  // Fetch active bets and round history
  const fetchActiveBets = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/aviator/active-bets', {
        headers: { 'x-user-id': user.user_id }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBets(data.active_bets);
      }
    } catch (e) {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/aviator/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {}
  };

  const fetchMyBets = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/aviator/my-bets', {
        headers: { 'x-user-id': user.user_id }
      });
      if (res.ok) {
        const data = await res.json();
        setMyBetsHistory(data.bets);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchActiveBets();
    fetchHistory();
    fetchMyBets();
  }, [status?.round_id, status?.state]);

  // High-performance 60fps Canvas Animation Loop with HiDPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const fs = flightStateRef.current;
      const currentState = status?.state || 'betting_open';

      // 1. Draw Starfield / Background / Watermark
      drawAviatorBackground(ctx, w, h);

      // Smooth multiplier interpolation
      if (currentState === 'running') {
        fs.displayMultiplier += (fs.targetMultiplier - fs.displayMultiplier) * 0.25;
        // Fast propeller spin during flight
        fs.propellerAngle += 0.55;
      } else if (currentState === 'crashed') {
        fs.displayMultiplier = status?.crash_multiplier || fs.targetMultiplier;
        // High speed propeller spin while soaring away
        fs.propellerAngle += 0.7;
      } else {
        // Idle propeller spin on tarmac
        fs.displayMultiplier = 1.00;
        fs.propellerAngle += 0.08;
      }

      const mult = fs.displayMultiplier;
      const startX = 50;
      const startY = h - 35; // tarmac baseline

      if (currentState === 'running' || currentState === 'crashed') {
        // Exponential trajectory curve mapping
        // Multiplier from 1.00 to 20+ mapped organically across the viewport
        const progress = Math.min(1.0, Math.max(0.02, (mult - 1.0) / 4.8));
        const endX = startX + progress * (w - 140);
        // Exponential curve upward
        const endY = startY - Math.pow(progress, 0.72) * (h - 90);
        const controlX = startX + (endX - startX) * 0.42;
        const controlY = startY - 5;

        // Draw curved glowing flight path
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.strokeStyle = currentState === 'crashed' ? 'rgba(239, 68, 68, 0.65)' : '#e50914';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#e50914';
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Fill area under the curve with iconic crimson gradient
        ctx.lineTo(endX, startY);
        ctx.lineTo(startX, startY);
        const curveGrad = ctx.createLinearGradient(0, endY, 0, startY);
        curveGrad.addColorStop(0, currentState === 'crashed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(229, 9, 20, 0.38)');
        curveGrad.addColorStop(0.7, 'rgba(229, 9, 20, 0.08)');
        curveGrad.addColorStop(1, 'rgba(229, 9, 20, 0.0)');
        ctx.fillStyle = curveGrad;
        ctx.fill();
        ctx.restore();

        // Calculate flight banking angle from tangent
        // Tangent of quadratic curve B(t) at t=1: 2*(end - control)
        const tangentX = endX - controlX;
        const tangentY = endY - controlY;
        const naturalAngle = Math.atan2(tangentY, tangentX);
        // Add subtle aerodynamic pitch buffeting
        const microBuffet = Math.sin(Date.now() / 140) * 0.035;
        const flightAngle = naturalAngle + microBuffet;

        // Update smoke particle emitter at tail
        if (currentState === 'running') {
          // Spawn new red smoke puffs behind tail
          if (Math.random() > 0.3) {
            fs.particles.push({
              x: endX - Math.cos(flightAngle) * 32,
              y: endY - Math.sin(flightAngle) * 32,
              vx: -Math.cos(flightAngle) * (1.5 + Math.random()),
              vy: -Math.sin(flightAngle) * (1.0 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.5,
              alpha: 0.65,
              size: 4 + Math.random() * 3,
              color: Math.random() > 0.5 ? 'rgba(239, 68, 68,' : 'rgba(244, 63, 94,'
            });
          }
        }

        // Render and update smoke particles
        ctx.save();
        for (let i = fs.particles.length - 1; i >= 0; i--) {
          const p = fs.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.25;
          p.alpha -= 0.015;

          if (p.alpha <= 0) {
            fs.particles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color} ${p.alpha})`;
          ctx.shadowColor = '#e50914';
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.restore();

        if (currentState === 'crashed') {
          // Authentic "FLEW AWAY" soaring animation!
          // Plane pulls up and accelerates rapidly off the top right screen
          const elapsedCrash = Date.now() - fs.crashTimestamp;
          const flyAwayProgress = Math.min(1.5, elapsedCrash / 650);

          const flyX = fs.lastX + flyAwayProgress * 550;
          const flyY = fs.lastY - flyAwayProgress * 320;
          const flyAngle = fs.lastAngle - flyAwayProgress * 0.3; // pulls nose up into the sky

          // Draw speed lines behind plane
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.5;
          for (let s = 1; s <= 3; s++) {
            ctx.beginPath();
            ctx.moveTo(flyX - 30 - s * 15, flyY + 10 + s * 8);
            ctx.lineTo(flyX - 70 - s * 30, flyY + 25 + s * 16);
            ctx.stroke();
          }
          ctx.restore();

          // Render plane soaring away if still in viewport vicinity
          if (flyX < w + 80 && flyY > -60) {
            drawVintageAviatorPlane(
              ctx,
              flyX,
              flyY,
              flyAngle,
              fs.propellerAngle,
              0.95,
              Math.max(0, 1 - flyAwayProgress * 0.7)
            );
          }
        } else {
          // Normal Flight: Store coordinates for smooth crash transition
          fs.lastX = endX;
          fs.lastY = endY;
          fs.lastAngle = flightAngle;

          // Draw Vintage Red Aerobatic Propeller Plane at the head of the curve
          drawVintageAviatorPlane(
            ctx,
            endX,
            endY,
            flightAngle,
            fs.propellerAngle,
            1.0,
            1.0
          );
        }
      } else {
        // Idle/Waiting stage: Plane parked at runway start with gentle idle vibration
        const idleBob = Math.sin(Date.now() / 320) * 1.5;
        const parkedX = 65;
        const parkedY = h - 45 + idleBob;
        const parkedAngle = -0.05; // slight nose-up stance on landing gear

        drawVintageAviatorPlane(
          ctx,
          parkedX,
          parkedY,
          parkedAngle,
          fs.propellerAngle,
          0.92,
          0.95
        );
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [status]);

  // Active bets matching
  const pendingBets = activeBets.filter(b => b.status === 'pending');
  const activeBet1 = pendingBets[0] || null;
  const activeBet2 = pendingBets[1] || null;

  // Place Bet Handler
  const handlePlaceBet = async (panel: 1 | 2) => {
    if (status?.state !== 'betting_open') {
      setBetError('Betting is closed for this flight. Wait for next round.');
      return;
    }

    const stakeAmount = panel === 1 
      ? (customStake1 ? Number(customStake1) : stake1)
      : (customStake2 ? Number(customStake2) : stake2);

    const isAuto = panel === 1 ? (tab1 === 'auto' || isAutoEnabled1) : (tab2 === 'auto' || isAutoEnabled2);
    const autoVal = panel === 1 ? autoCashout1 : autoCashout2;

    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      setBetError('Please enter a valid stake amount.');
      return;
    }

    if (!wallet || wallet.demo_balance < 100 || wallet.demo_balance < stakeAmount) {
      if (onOpenRechargeRequirement && (!wallet || wallet.demo_balance < 100)) {
        onOpenRechargeRequirement();
      }
      setBetError('Minimum ₹100 recharge required to activate betting.');
      return;
    }

    if (panel === 1) setIsPlacing1(true);
    else setIsPlacing2(true);
    setBetError(null);
    setCashoutSuccess(null);

    try {
      const res = await fetch('/api/aviator/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          stake: stakeAmount,
          auto_cashout: isAuto && autoVal ? Number(autoVal) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setBetError(data.error || 'Failed to place bet');
      } else {
        playSound(520, 'sine', 0.15);
        if (data.wallet) updateWalletState(data.wallet);
        fetchActiveBets();
      }
    } catch (err) {
      setBetError('Network error placing Aviator bet.');
    } finally {
      if (panel === 1) setIsPlacing1(false);
      else setIsPlacing2(false);
    }
  };

  // Cashout Handler
  const handleCashout = async (betId: string, panel: 1 | 2) => {
    if (status?.state !== 'running') return;

    if (panel === 1) setIsCashing1(true);
    else setIsCashing2(true);
    setBetError(null);

    try {
      const res = await fetch('/api/aviator/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({ bet_id: betId })
      });

      const data = await res.json();
      if (!res.ok) {
        setBetError(data.error || 'Cash out failed');
      } else {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        playSound(880, 'triangle', 0.3);
        setCashoutSuccess(`Cashed out at ${data.multiplier.toFixed(2)}x! +${data.payout} DC`);
        if (data.wallet) updateWalletState(data.wallet);
        fetchActiveBets();
        fetchMyBets();
      }
    } catch (err) {
      setBetError('Network error during cash out.');
    } finally {
      if (panel === 1) setIsCashing1(false);
      else setIsCashing2(false);
    }
  };

  return (
    <div id="aviator-container" className="min-h-screen bg-[#06080d] text-slate-100 pb-24 select-none">
      {/* 
        UPPER ACTION BAR
        Features: Aviator Brand logo, Demo Balance, Deposit (+), Withdraw, History, Audio, Fairness Menu
      */}
      <div
        id="aviator-upper-action-bar"
        className="sticky top-0 z-30 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2 sm:px-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back button & Red Aviator Logo */}
          <div className="flex items-center gap-2">
            <button
              id="aviator-back-btn"
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Authentic Red Slanted Aviator Title */}
            <div 
              onClick={() => onNavigate('/home')}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <span className="text-xl font-black italic tracking-tighter text-rose-500 font-display drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]">
                Aviator
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
          </div>

          {/* Upper Action Area: Wallet Balance, Deposit, Withdraw, History, Audio */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Balance Display */}
            <div
              id="aviator-header-balance"
              className="flex items-center gap-1.5 bg-[#101522] border border-slate-700/80 rounded-full pl-2.5 pr-3 py-1 text-xs"
            >
              <span className="font-mono-gaming font-extrabold text-emerald-400 text-xs sm:text-sm">
                ₹{wallet ? wallet.demo_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10.00'}
              </span>
            </div>

            {/* Deposit Shortcut */}
            <button
              id="aviator-header-add-credits"
              onClick={onOpenRecharge}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all active:scale-95"
              title="Deposit Funds"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Deposit</span>
            </button>

            {/* Withdrawal Shortcut */}
            <button
              id="aviator-header-withdraw"
              onClick={onOpenWithdraw}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141a27] hover:bg-[#1c2436] border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all active:scale-95"
              title="Withdrawal"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Withdraw</span>
            </button>

            {/* Audio Toggle */}
            <button
              id="aviator-header-sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Menu Dropdown */}
            <div className="relative">
              <button
                id="aviator-header-menu"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80"
              >
                <Menu className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#121722] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs text-slate-300 animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowFairnessModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Provable Fairness</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowHistoryModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2"
                  >
                    <History className="w-4 h-4 text-rose-400" />
                    <span>Flight History</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenRecharge();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-emerald-300"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Deposit (₹100)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto p-2.5 sm:p-4 space-y-2.5">
        {/* Top Multiplier Ribbon (Authentic Spribe Colored History Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 bg-[#0d111a] rounded-xl border border-slate-800/90 scrollbar-none">
          {status?.recent_multipliers?.map((mult, idx) => {
            const isMega = mult >= 100;
            const isHigh = mult >= 10 && mult < 100;
            const isMid = mult >= 2 && mult < 10;
            return (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full font-mono-gaming text-[11px] font-extrabold shrink-0 border transition-transform hover:scale-105 ${
                  isMega
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : isHigh
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50'
                    : isMid
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {mult.toFixed(2)}x
              </span>
            );
          })}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white text-[11px] font-bold border border-slate-700 shrink-0"
          >
            ...
          </button>
        </div>

        {/* Flight Simulator Canvas Box */}
        <div className="relative rounded-2xl bg-[#080b11] border border-slate-800 shadow-2xl h-72 sm:h-96 overflow-hidden flex flex-col justify-between p-3.5">
          {/* Top Canvas Bar: Round ID & Provable Fairness */}
          <div className="flex items-center justify-between z-10 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono-gaming text-[10px] font-bold tracking-wider">
                {status?.round_id || 'ROUND_ID'}
              </span>
              <button
                onClick={() => setShowFairnessModal(true)}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Fair</span>
              </button>
            </div>

            {/* Live Flight Phase Badge */}
            <div>
              {status?.state === 'betting_open' && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                  Next flight in {status.time_remaining}s
                </span>
              )}
              {status?.state === 'running' && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-extrabold flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  IN FLIGHT
                </span>
              )}
              {status?.state === 'crashed' && (
                <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 text-xs font-bold border border-slate-700">
                  Waiting for Next Round
                </span>
              )}
            </div>
          </div>

          {/* Centered Large Multiplier Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            {status?.state === 'running' && (
              <div className="text-center animate-in zoom-in-95 duration-75">
                <div className="font-display font-black text-6xl sm:text-8xl tracking-tighter text-white drop-shadow-[0_4px_30px_rgba(244,63,94,0.7)]">
                  {status.current_multiplier.toFixed(2)}
                  <span className="text-rose-500 text-3xl sm:text-5xl ml-1 font-bold">x</span>
                </div>
              </div>
            )}

            {status?.state === 'crashed' && (
              <div className="text-center space-y-1 animate-in zoom-in-90 duration-150">
                <span className="text-rose-500 font-black tracking-widest text-sm uppercase block drop-shadow-[0_2px_10px_rgba(239,68,68,0.8)]">
                  FLEW AWAY
                </span>
                <div className="font-display font-black text-6xl sm:text-8xl tracking-tighter text-rose-500 drop-shadow-[0_4px_30px_rgba(244,63,94,0.8)]">
                  {status.crash_multiplier.toFixed(2)}x
                </div>
              </div>
            )}

            {status?.state === 'betting_open' && (
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full border-3 border-slate-700/80 border-t-rose-500 animate-spin mx-auto shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                  WAITING FOR NEXT ROUND
                </p>
                {/* Horizontal Progress Bar */}
                <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto border border-slate-700/60">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, (5 - (status?.time_remaining || 0)) / 5 * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* HTML5 Canvas Surface */}
          <canvas
            ref={canvasRef}
            width={720}
            height={380}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Status Alerts */}
        {betError && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{betError}</span>
          </div>
        )}

        {cashoutSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{cashoutSuccess}</span>
          </div>
        )}

        {/* 
          DUAL BETTING PANELS (Matching the user's reference image!)
          Allows simultaneous placing of Bet 1 and Bet 2 with Bet/Auto tabs, 2x2 chips, stepper, and large action button.
        */}
        <div className="space-y-2.5">
          {/* BET PANEL 1 */}
          <div className="p-3.5 rounded-2xl bg-[#0f1420] border border-slate-800 shadow-xl space-y-3">
            {/* Header: Bet | Auto toggle tabs */}
            <div className="flex items-center justify-between">
              <div className="flex bg-[#161d2d] p-0.5 rounded-full border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setTab1('bet')}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    tab1 === 'bet' ? 'bg-[#222c42] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bet
                </button>
                <button
                  type="button"
                  onClick={() => setTab1('auto')}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    tab1 === 'auto' ? 'bg-[#222c42] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Collapse/Expand Panel 2 Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPanel2(!showPanel2)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors flex items-center gap-1 text-[11px]"
                title={showPanel2 ? 'Hide Bet 2' : 'Add Bet 2'}
              >
                {showPanel2 ? <Minus className="w-3.5 h-3.5 text-rose-400" /> : <Plus className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="font-semibold">{showPanel2 ? 'Hide 2nd' : 'Add 2nd Bet'}</span>
              </button>
            </div>

            {/* Stepper + Quick 2x2 Chips + Big Action Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Left Column: Stepper & 2x2 Chips */}
              <div className="space-y-2">
                {/* Stepper: [-] 10.00 [+] */}
                <div className="flex items-center gap-1.5 bg-[#172030] p-1 rounded-xl border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setStake1(Math.max(10, stake1 - 10))}
                    className="w-9 h-9 rounded-lg bg-[#222d42] hover:bg-[#2b3954] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-sm"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono-gaming font-extrabold text-white text-base">
                    <input
                      type="number"
                      value={customStake1 || stake1}
                      onChange={(e) => {
                        setCustomStake1(e.target.value);
                        setStake1(Number(e.target.value) || 10);
                      }}
                      className="w-full bg-transparent text-center focus:outline-none font-mono-gaming font-extrabold text-white text-base"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStake1(stake1 + 10)}
                    className="w-9 h-9 rounded-lg bg-[#222d42] hover:bg-[#2b3954] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-sm"
                  >
                    +
                  </button>
                </div>

                {/* 2x2 Quick Chips (10, 100, 500, 1000) exactly as shown in screenshot */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[10, 100, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setStake1(preset);
                        setCustomStake1('');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-mono-gaming font-extrabold border transition-all ${
                        stake1 === preset && !customStake1
                          ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                          : 'bg-[#151c2a] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Auto Cashout Field when in Auto Tab */}
                {tab1 === 'auto' && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="auto1-check"
                        checked={isAutoEnabled1}
                        onChange={(e) => setIsAutoEnabled1(e.target.checked)}
                        className="rounded text-rose-500 bg-slate-800 border-slate-700"
                      />
                      <label htmlFor="auto1-check" className="text-slate-300 font-semibold cursor-pointer">
                        Auto Cash Out
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={autoCashout1}
                        onChange={(e) => setAutoCashout1(e.target.value)}
                        className="w-20 bg-[#161d2d] border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono-gaming text-white text-center focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">x</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Giant Action Button (Bet / Cashout) */}
              <div>
                {activeBet1 && status?.state === 'running' ? (
                  <button
                    type="button"
                    onClick={() => handleCashout(activeBet1.id, 1)}
                    disabled={isCashing1}
                    className="w-full py-6 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-xl shadow-xl shadow-amber-950/50 active:scale-95 transition-all flex flex-col items-center justify-center animate-pulse cursor-pointer"
                  >
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900">
                      CASH OUT
                    </span>
                    <span className="font-mono-gaming text-xl font-black">
                      {(activeBet1.stake * status.current_multiplier).toFixed(2)} DC
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePlaceBet(1)}
                    disabled={isPlacing1 || status?.state !== 'betting_open' || !!activeBet1}
                    className={`w-full py-6 px-4 rounded-2xl font-display font-black text-lg shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer ${
                      activeBet1
                        ? 'bg-slate-800 text-amber-400 border border-slate-700 cursor-not-allowed'
                        : status?.state === 'betting_open'
                        ? 'bg-[#28a745] hover:bg-[#218838] text-white shadow-emerald-950/50'
                        : 'bg-[#182233] text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xl font-black uppercase tracking-wide">
                      {activeBet1 ? 'WAITING FLIGHT' : 'Bet'}
                    </span>
                    <span className="font-mono-gaming text-sm font-bold text-slate-200">
                      {(customStake1 ? Number(customStake1) : stake1).toFixed(2)} DC
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BET PANEL 2 (Dual Bet - can be toggled on/off) */}
          {showPanel2 && (
            <div className="p-3.5 rounded-2xl bg-[#0f1420] border border-slate-800 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex bg-[#161d2d] p-0.5 rounded-full border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setTab2('bet')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                      tab2 === 'bet' ? 'bg-[#222c42] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bet
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab2('auto')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                      tab2 === 'auto' ? 'bg-[#222c42] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Auto
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bet 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Stepper & 2x2 Chips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 bg-[#172030] p-1 rounded-xl border border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setStake2(Math.max(10, stake2 - 10))}
                      className="w-9 h-9 rounded-lg bg-[#222d42] hover:bg-[#2b3954] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-sm"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono-gaming font-extrabold text-white text-base">
                      <input
                        type="number"
                        value={customStake2 || stake2}
                        onChange={(e) => {
                          setCustomStake2(e.target.value);
                          setStake2(Number(e.target.value) || 10);
                        }}
                        className="w-full bg-transparent text-center focus:outline-none font-mono-gaming font-extrabold text-white text-base"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStake2(stake2 + 10)}
                      className="w-9 h-9 rounded-lg bg-[#222d42] hover:bg-[#2b3954] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[10, 100, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setStake2(preset);
                          setCustomStake2('');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-mono-gaming font-extrabold border transition-all ${
                          stake2 === preset && !customStake2
                            ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                            : 'bg-[#151c2a] text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {tab2 === 'auto' && (
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id="auto2-check"
                          checked={isAutoEnabled2}
                          onChange={(e) => setIsAutoEnabled2(e.target.checked)}
                          className="rounded text-rose-500 bg-slate-800 border-slate-700"
                        />
                        <label htmlFor="auto2-check" className="text-slate-300 font-semibold cursor-pointer">
                          Auto Cash Out
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={autoCashout2}
                          onChange={(e) => setAutoCashout2(e.target.value)}
                          className="w-20 bg-[#161d2d] border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono-gaming text-white text-center focus:outline-none"
                        />
                        <span className="text-slate-400 font-bold">x</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Action Button */}
                <div>
                  {activeBet2 && status?.state === 'running' ? (
                    <button
                      type="button"
                      onClick={() => handleCashout(activeBet2.id, 2)}
                      disabled={isCashing2}
                      className="w-full py-6 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black text-xl shadow-xl shadow-amber-950/50 active:scale-95 transition-all flex flex-col items-center justify-center animate-pulse cursor-pointer"
                    >
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900">
                        CASH OUT
                      </span>
                      <span className="font-mono-gaming text-xl font-black">
                        {(activeBet2.stake * status.current_multiplier).toFixed(2)} DC
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlaceBet(2)}
                      disabled={isPlacing2 || status?.state !== 'betting_open' || !!activeBet2}
                      className={`w-full py-6 px-4 rounded-2xl font-display font-black text-lg shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer ${
                        activeBet2
                          ? 'bg-slate-800 text-amber-400 border border-slate-700 cursor-not-allowed'
                          : status?.state === 'betting_open'
                          ? 'bg-[#28a745] hover:bg-[#218838] text-white shadow-emerald-950/50'
                          : 'bg-[#182233] text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xl font-black uppercase tracking-wide">
                        {activeBet2 ? 'WAITING FLIGHT' : 'Bet'}
                      </span>
                      <span className="font-mono-gaming text-sm font-bold text-slate-200">
                        {(customStake2 ? Number(customStake2) : stake2).toFixed(2)} DC
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 
          BOTTOM TABS & FEED: All Bets | Previous (My Bets) | Top
          Matches the reference image tabs at the bottom!
        */}
        <div className="p-3.5 rounded-2xl bg-[#0d121c] border border-slate-800 text-xs space-y-3">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setFeedTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                feedTab === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Bets</span>
            </button>
            <button
              onClick={() => setFeedTab('my')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                feedTab === 'my'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Previous / My Bets</span>
            </button>
            <button
              onClick={() => setFeedTab('top')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                feedTab === 'top'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Top</span>
            </button>
          </div>

          {/* Feed Content */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {feedTab === 'all' && (
              <>
                {pendingBets.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs">
                    No active bets for this flight round. Place your bet above!
                  </div>
                ) : (
                  pendingBets.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-xl bg-[#141a27] border border-slate-800 flex items-center justify-between font-mono-gaming text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                          {user?.display_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-white font-bold">{user?.display_name || 'Pilot'}</span>
                      </div>
                      <span className="text-slate-300 font-extrabold">{b.stake.toFixed(2)} DC</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase animate-pulse">
                        In Flight...
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {feedTab === 'my' && (
              <>
                {myBetsHistory.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs">
                    You haven't completed any Aviator bets yet.
                  </div>
                ) : (
                  myBetsHistory.slice(0, 15).map((b) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-xl bg-[#141a27] border border-slate-800 flex items-center justify-between font-mono-gaming text-xs"
                    >
                      <div>
                        <span className="text-white font-bold block">{b.round_id}</span>
                        <span className="text-[10px] text-slate-500">Stake: {b.stake} DC</span>
                      </div>
                      <div className="text-right">
                        {b.result === 'cashed_out' ? (
                          <span className="text-emerald-400 font-extrabold block">
                            +{b.payout.toFixed(2)} DC ({b.cashout_multiplier}x)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-extrabold block">
                            Lost (-{b.stake} DC)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {feedTab === 'top' && (
              <>
                {history
                  .filter((h) => (h.crash_multiplier ?? 0) >= 2)
                  .slice(0, 10)
                  .map((h, i) => (
                    <div
                      key={h.id}
                      className="p-2 rounded-xl bg-[#141a27] border border-slate-800 flex items-center justify-between font-mono-gaming text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          i === 0 ? 'bg-amber-500 text-slate-950' : i === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-800/80 text-white'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-slate-300 font-bold">{h.round_id}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-xs">
                        {h.crash_multiplier?.toFixed(2)}x
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Platform Notice */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">56Club Official Aviator: </span>
            Welcome bonus of ₹10 granted upon registration. Minimum first recharge is ₹100 to activate full cashout & betting capabilities.
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-rose-400" />
                <span>Aviator Multiplier History</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-800 font-mono-gaming text-xs">
              {history.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-300 font-bold block">{h.round_id}</span>
                    <span className="text-[10px] text-slate-500">
                      {h.completed_at ? new Date(h.completed_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-extrabold px-2.5 py-0.5 rounded-md ${
                      (h.crash_multiplier ?? 0) >= 10
                        ? 'bg-amber-500/20 text-amber-300'
                        : (h.crash_multiplier ?? 0) >= 2
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {h.crash_multiplier?.toFixed(2)}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Provable Fairness Modal */}
      {showFairnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>Aviator Provable Fairness</span>
              </div>
              <button onClick={() => setShowFairnessModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Each Aviator flight multiplier is generated <strong>before takeoff</strong> using an HMAC-SHA256 transparent cryptographic commitment.
              </p>
              <div className="p-3 rounded-xl bg-[#0b0e14] border border-slate-800 font-mono-gaming space-y-1">
                <span className="text-[10px] uppercase text-slate-500 block">Flight Round Pre-Hash</span>
                <p className="text-white text-[11px] break-all">{status?.hash}</p>
              </div>
              <p className="text-[11px] text-slate-400">
                The multiplier cannot be altered once bets are locked. No previous multiplier predicts future outcomes.
              </p>
            </div>
            <button
              onClick={() => setShowFairnessModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
