import { db, generateHash } from './db';
import type {
  WinGoMode,
  WinGoRoundStatus,
  AviatorRoundStatus,
  DemoRoundResult,
  WinGoColor,
  WinGoSize,
  DemoBet
} from '../src/types';

interface WinGoActiveRound {
  mode: WinGoMode;
  round_id: string;
  duration_seconds: number;
  start_timestamp: number;
  end_timestamp: number;
  secret_number: number;
  secret_seed: string;
  hash: string;
}

interface AviatorActiveRound {
  round_id: string;
  state: 'waiting' | 'betting_open' | 'running' | 'crashed' | 'settled';
  state_start_time: number;
  crash_multiplier: number;
  current_multiplier: number;
  secret_seed: string;
  hash: string;
  active_bets: DemoBet[];
}

export class GameEngine {
  private wingoRounds: Map<WinGoMode, WinGoActiveRound> = new Map();
  private aviatorRound!: AviatorActiveRound;
  private intervalId: any = null;

  constructor() {
    this.initWinGoRounds();
    this.initAviatorRound();
    this.startTicker();
  }

  private initWinGoRounds() {
    const modes: { mode: WinGoMode; duration: number }[] = [
      { mode: '30s', duration: 30 },
      { mode: '1m', duration: 60 },
      { mode: '3m', duration: 180 },
      { mode: '5m', duration: 300 }
    ];

    const now = Date.now();
    for (const { mode, duration } of modes) {
      this.startNewWinGoRound(mode, duration, now);
    }
  }

  private startNewWinGoRound(mode: WinGoMode, duration: number, startTime = Date.now()) {
    const roundNumber = Math.floor(startTime / (duration * 1000));
    const roundId = `${new Date(startTime).toISOString().slice(0, 10).replace(/-/g, '')}${mode.toUpperCase()}${String(roundNumber % 10000).padStart(4, '0')}`;
    
    // Deterministic yet pre-generated fair random result
    const seed = `seed_${roundId}_${Math.random().toString(36).substring(2)}`;
    const num = Math.floor(Math.random() * 10);
    const hash = generateHash(`${roundId}:${seed}:${num}`);

    const round: WinGoActiveRound = {
      mode,
      round_id: roundId,
      duration_seconds: duration,
      start_timestamp: startTime,
      end_timestamp: startTime + duration * 1000,
      secret_number: num,
      secret_seed: seed,
      hash
    };

    this.wingoRounds.set(mode, round);
  }

  private initAviatorRound() {
    this.startNewAviatorRound();
  }

  private generateCrashMultiplier(): number {
    // 97% RTP style distribution:
    // 8% instant crash under 1.10x
    // 60% crashes between 1.10x and 2.50x
    // 25% crashes between 2.50x and 10.00x
    // 7% big multipliers up to 100x
    const rand = Math.random();
    let mult = 1.00;
    if (rand < 0.08) {
      mult = 1.00 + Math.random() * 0.10;
    } else if (rand < 0.68) {
      mult = 1.10 + Math.random() * 1.40;
    } else if (rand < 0.93) {
      mult = 2.50 + Math.random() * 7.50;
    } else {
      mult = 10.00 + Math.random() * 40.00;
    }
    return Math.round(mult * 100) / 100;
  }

  private startNewAviatorRound() {
    const now = Date.now();
    const roundId = `AV-${Date.now().toString().slice(-6)}`;
    const crashMult = this.generateCrashMultiplier();
    const seed = `av_seed_${roundId}_${Math.random().toString(36).slice(2)}`;
    const hash = generateHash(`${roundId}:${seed}:${crashMult}`);

    this.aviatorRound = {
      round_id: roundId,
      state: 'betting_open',
      state_start_time: now,
      crash_multiplier: crashMult,
      current_multiplier: 1.00,
      secret_seed: seed,
      hash,
      active_bets: []
    };
  }

  private startTicker() {
    // 100ms ticker for smooth high-fidelity game updates
    this.intervalId = setInterval(() => {
      this.tick();
    }, 100);
  }

  private tick() {
    const now = Date.now();

    // 1. Tick WinGo rounds
    for (const [mode, round] of this.wingoRounds.entries()) {
      if (now >= round.end_timestamp) {
        this.settleWinGoRound(round);
        this.startNewWinGoRound(mode, round.duration_seconds, now);
      }
    }

    // 2. Tick Aviator
    this.tickAviator(now);
  }

  private settleWinGoRound(round: WinGoActiveRound) {
    const num = round.secret_number;
    let color: WinGoColor | 'red-violet' | 'green-violet' = 'green';
    if (num === 0) color = 'red-violet';
    else if (num === 5) color = 'green-violet';
    else if ([1, 3, 7, 9].includes(num)) color = 'green';
    else color = 'red';
    const size: WinGoSize = num >= 5 ? 'big' : 'small';

    const resultRecord: DemoRoundResult = {
      id: `res_${round.round_id}`,
      game_type: 'wingo',
      mode: round.mode,
      round_id: round.round_id,
      result_number: num,
      result_size: size,
      result_color: color,
      hash: round.hash,
      seed: round.secret_seed,
      generated_at: new Date(round.start_timestamp).toISOString(),
      round_status: 'settled',
      completed_at: new Date().toISOString()
    };

    db.roundResults.unshift(resultRecord);

    // Settle all pending bets for this round
    const pendingBets = db.bets.filter(
      b => b.game_type === 'wingo' && b.round_id === round.round_id && b.status === 'pending'
    );

    for (const bet of pendingBets) {
      let isWin = false;
      let multiplier = 0;

      try {
        const sel = JSON.parse(bet.selection);
        if (sel.type === 'number') {
          if (Number(sel.value) === num) {
            isWin = true;
            multiplier = 9;
          }
        } else if (sel.type === 'size') {
          if (sel.value === size) {
            isWin = true;
            multiplier = 2;
          }
        } else if (sel.type === 'color') {
          if (sel.value === 'green') {
            if ([1, 3, 7, 9].includes(num)) {
              isWin = true;
              multiplier = 2;
            } else if (num === 5) {
              isWin = true;
              multiplier = 1.5;
            }
          } else if (sel.value === 'red') {
            if ([2, 4, 6, 8].includes(num)) {
              isWin = true;
              multiplier = 2;
            } else if (num === 0) {
              isWin = true;
              multiplier = 1.5;
            }
          } else if (sel.value === 'violet') {
            if (num === 0 || num === 5) {
              isWin = true;
              multiplier = 4.5;
            }
          }
        }
      } catch (err) {
        console.error('Error parsing bet selection', err);
      }

      bet.status = 'settled';
      bet.winning_number = num;
      bet.settled_at = new Date().toISOString();

      if (isWin) {
        bet.result = 'win';
        bet.payout = Math.round(bet.stake * multiplier * 100) / 100;
        // Credit user wallet
        db.updateWalletBalance(bet.user_id, bet.payout, 0, bet.payout - bet.stake, 0);
        db.addLedgerEntry({
          user_id: bet.user_id,
          transaction_type: 'bet_payout',
          amount: bet.payout,
          balance_type: 'main',
          reference_id: bet.id,
          status: 'completed',
          metadata: { round_id: round.round_id, multiplier, winning_number: num }
        });
      } else {
        bet.result = 'loss';
        bet.payout = 0;
        db.updateWalletBalance(bet.user_id, 0, 0, 0, bet.stake);
      }
    }
  }

  private tickAviator(now: number) {
    const elapsed = now - this.aviatorRound.state_start_time;

    if (this.aviatorRound.state === 'betting_open') {
      // 5 seconds betting phase
      const countdown = Math.max(0, 5000 - elapsed);
      if (countdown <= 0) {
        // Transition to flight
        this.aviatorRound.state = 'running';
        this.aviatorRound.state_start_time = now;
        this.aviatorRound.current_multiplier = 1.00;
      }
    } else if (this.aviatorRound.state === 'running') {
      const flightTimeSeconds = elapsed / 1000;
      // Realistic exponential flight curve
      // 1.00 + 0.07 * t^1.4 + 0.01 * t^2
      const calculatedMult = Math.round((1.00 + 0.08 * Math.pow(flightTimeSeconds, 1.45) + 0.005 * Math.pow(flightTimeSeconds, 2)) * 100) / 100;
      
      if (calculatedMult >= this.aviatorRound.crash_multiplier) {
        // Plane crashed / flew away!
        this.aviatorRound.current_multiplier = this.aviatorRound.crash_multiplier;
        this.aviatorRound.state = 'crashed';
        this.aviatorRound.state_start_time = now;

        // Record history
        db.roundResults.unshift({
          id: `res_${this.aviatorRound.round_id}`,
          game_type: 'aviator',
          mode: 'aviator',
          round_id: this.aviatorRound.round_id,
          crash_multiplier: this.aviatorRound.crash_multiplier,
          hash: this.aviatorRound.hash,
          seed: this.aviatorRound.secret_seed,
          generated_at: new Date(now - elapsed).toISOString(),
          round_status: 'settled',
          completed_at: new Date().toISOString()
        });

        // Settle remaining uncashed active bets as loss
        for (const bet of this.aviatorRound.active_bets) {
          if (bet.status === 'pending') {
            bet.status = 'settled';
            bet.result = 'loss';
            bet.payout = 0;
            bet.multiplier = this.aviatorRound.crash_multiplier;
            bet.settled_at = new Date().toISOString();
            db.updateWalletBalance(bet.user_id, 0, 0, 0, bet.stake);
          }
        }
      } else {
        this.aviatorRound.current_multiplier = calculatedMult;

        // Check for Auto-Cashout on active bets
        for (const bet of this.aviatorRound.active_bets) {
          if (bet.status === 'pending' && bet.cashout_multiplier && calculatedMult >= bet.cashout_multiplier) {
            this.cashoutAviatorBet(bet.user_id, bet.id, bet.cashout_multiplier);
          }
        }
      }
    } else if (this.aviatorRound.state === 'crashed') {
      // 3.5 seconds post-crash celebration / cool-off, then next round
      if (elapsed >= 3500) {
        this.startNewAviatorRound();
      }
    }
  }

  // Aviator cashout action
  public cashoutAviatorBet(userId: string, betId: string, requestedMult?: number) {
    if (this.aviatorRound.state !== 'running') {
      throw new Error('Round is not currently in flight');
    }

    const bet = this.aviatorRound.active_bets.find(b => b.id === betId && b.user_id === userId);
    if (!bet) throw new Error('Active bet not found');
    if (bet.status !== 'pending') throw new Error('Bet is already settled or cashed out');

    const mult = requestedMult || this.aviatorRound.current_multiplier;
    if (mult > this.aviatorRound.crash_multiplier) {
      throw new Error('Flight already crashed');
    }

    const payout = Math.round(bet.stake * mult * 100) / 100;
    bet.status = 'settled';
    bet.result = 'cashed_out';
    bet.cashout_multiplier = mult;
    bet.payout = payout;
    bet.settled_at = new Date().toISOString();

    // Credit user balance
    db.updateWalletBalance(userId, payout, 0, payout - bet.stake, 0);
    db.addLedgerEntry({
      user_id: userId,
      transaction_type: 'bet_payout',
      amount: payout,
      balance_type: 'main',
      reference_id: bet.id,
      status: 'completed',
      metadata: { round_id: this.aviatorRound.round_id, multiplier: mult, game_type: 'aviator' }
    });

    return { bet, payout, multiplier: mult };
  }

  public placeAviatorBet(userId: string, stake: number, autoCashout?: number) {
    if (this.aviatorRound.state !== 'betting_open') {
      throw new Error('Betting is closed for this round. Please wait for the next flight.');
    }

    if (stake < db.settings.aviator_min_stake || stake > db.settings.aviator_max_stake) {
      throw new Error(`Stake must be between ${db.settings.aviator_min_stake} and ${db.settings.aviator_max_stake} Demo Credits.`);
    }

    const wallet = db.getWallet(userId);
    if (wallet.demo_balance < stake) {
      throw new Error('Insufficient Demo Credits to place this bet.');
    }

    // Deduct stake
    db.updateWalletBalance(userId, -stake);

    const bet = db.createBet({
      user_id: userId,
      game_type: 'aviator',
      mode: 'aviator',
      round_id: this.aviatorRound.round_id,
      selection: JSON.stringify({ auto_cashout: autoCashout || null }),
      stake,
      result: 'pending',
      payout: 0,
      status: 'pending',
      cashout_multiplier: autoCashout || undefined
    });

    this.aviatorRound.active_bets.push(bet);

    db.addLedgerEntry({
      user_id: userId,
      transaction_type: 'bet_stake',
      amount: stake,
      balance_type: 'main',
      reference_id: bet.id,
      status: 'completed',
      metadata: { round_id: this.aviatorRound.round_id, game_type: 'aviator' }
    });

    return bet;
  }

  // WinGo Status
  public getWinGoStatus(mode: WinGoMode): WinGoRoundStatus {
    const round = this.wingoRounds.get(mode);
    if (!round) throw new Error('Invalid WinGo mode');

    const now = Date.now();
    const remainingMs = Math.max(0, round.end_timestamp - now);
    const timeRemaining = Math.ceil(remainingMs / 1000);
    // Betting closes 5s before round end
    const isBettingOpen = timeRemaining > 5;

    const lastResults = db.roundResults
      .filter(r => r.game_type === 'wingo' && r.mode === mode)
      .slice(0, 30);

    return {
      round_id: round.round_id,
      mode,
      duration_seconds: round.duration_seconds,
      time_remaining: timeRemaining,
      is_betting_open: isBettingOpen,
      hash: round.hash,
      last_results: lastResults
    };
  }

  // Place WinGo Bet
  public placeWinGoBet(userId: string, mode: WinGoMode, selection: any, stake: number): DemoBet {
    const round = this.wingoRounds.get(mode);
    if (!round) throw new Error('Invalid WinGo mode');

    const now = Date.now();
    const remainingMs = round.end_timestamp - now;
    if (remainingMs <= 5000) {
      throw new Error('Betting has closed for this round (last 5 seconds). Please wait for next round.');
    }

    if (stake < db.settings.wingo_min_stake || stake > db.settings.wingo_max_stake) {
      throw new Error(`Stake must be between ${db.settings.wingo_min_stake} and ${db.settings.wingo_max_stake} Demo Credits.`);
    }

    const wallet = db.getWallet(userId);
    if (wallet.demo_balance < stake) {
      throw new Error('Insufficient Demo Credits to place this bet.');
    }

    // Deduct stake
    db.updateWalletBalance(userId, -stake);

    const bet = db.createBet({
      user_id: userId,
      game_type: 'wingo',
      mode,
      round_id: round.round_id,
      selection: JSON.stringify(selection),
      stake,
      result: 'pending',
      payout: 0,
      status: 'pending'
    });

    db.addLedgerEntry({
      user_id: userId,
      transaction_type: 'bet_stake',
      amount: stake,
      balance_type: 'main',
      reference_id: bet.id,
      status: 'completed',
      metadata: { round_id: round.round_id, mode, selection }
    });

    return bet;
  }

  // Aviator Status
  public getAviatorStatus(): AviatorRoundStatus {
    const now = Date.now();
    const elapsed = now - this.aviatorRound.state_start_time;
    let timeRemaining = 0;
    if (this.aviatorRound.state === 'betting_open') {
      timeRemaining = Math.max(0, Math.ceil((5000 - elapsed) / 1000));
    } else if (this.aviatorRound.state === 'crashed') {
      timeRemaining = Math.max(0, Math.ceil((3500 - elapsed) / 1000));
    }

    const recentMultipliers = db.roundResults
      .filter(r => r.game_type === 'aviator')
      .slice(0, 20)
      .map(r => r.crash_multiplier || 1.00);

    return {
      round_id: this.aviatorRound.round_id,
      state: this.aviatorRound.state,
      time_remaining: timeRemaining,
      current_multiplier: this.aviatorRound.current_multiplier,
      crash_multiplier: this.aviatorRound.state === 'crashed' ? this.aviatorRound.crash_multiplier : 0,
      elapsed_flight_time_ms: this.aviatorRound.state === 'running' ? elapsed : 0,
      hash: this.aviatorRound.hash,
      recent_multipliers: recentMultipliers,
      active_bets_count: this.aviatorRound.active_bets.length
    };
  }

  public getAviatorActiveBets(userId: string) {
    return this.aviatorRound.active_bets.filter(b => b.user_id === userId);
  }
}

export const gameEngine = new GameEngine();
