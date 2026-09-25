import crypto from 'crypto';
import type {
  UserProfile,
  UserWallet,
  DemoWalletLedger,
  DemoBet,
  DemoRoundResult,
  DemoWithdrawal,
  DepositRequest,
  AuditLog,
  GameSettings,
  WinGoColor,
  WinGoSize,
  WinGoMode
} from '../src/types';

// Password hashing utility with salt
export function hashPassword(password: string): string {
  const salt = '56club_salt_secret_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// In-memory persistent data store
class DatabaseStore {
  public profiles: Map<string, UserProfile> = new Map();
  public authCredentials: Map<string, { mobile_number: string; password_hash: string; user_id: string }> = new Map();
  public wallets: Map<string, UserWallet> = new Map();
  public ledgers: DemoWalletLedger[] = [];
  public bets: DemoBet[] = [];
  public roundResults: DemoRoundResult[] = [];
  public withdrawals: DemoWithdrawal[] = [];
  public deposits: DepositRequest[] = [];
  public auditLogs: AuditLog[] = [];
  public settings: GameSettings = {
    wingo_min_stake: 10,
    wingo_max_stake: 10000,
    aviator_min_stake: 10,
    aviator_max_stake: 20000,
    wagering_multiplier: 1,
    maintenance_mode: false,
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Sole Admin account: username "mrcat" with password "1111"
    const adminId = 'usr_admin_mrcat';
    const adminProfile: UserProfile = {
      id: 'prof_admin_mrcat',
      user_id: adminId,
      mobile_number: '9999999999',
      username: 'mrcat',
      display_name: 'Mr Cat (Admin)',
      role: 'admin',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    };
    this.profiles.set(adminId, adminProfile);
    this.authCredentials.set('mrcat', {
      mobile_number: 'mrcat',
      password_hash: hashPassword('1111'),
      user_id: adminId
    });
    this.authCredentials.set('9999999999', {
      mobile_number: '9999999999',
      password_hash: hashPassword('1111'),
      user_id: adminId
    });
    this.wallets.set(adminId, {
      id: 'wal_admin_mrcat',
      user_id: adminId,
      demo_balance: 1000000,
      bonus_demo_balance: 100000,
      locked_demo_balance: 0,
      total_winnings: 120000,
      total_losses: 45000,
      updated_at: new Date().toISOString()
    });

    // Seed historical WinGo rounds
    const modes: WinGoMode[] = ['30s', '1m', '5m'];
    const now = Date.now();
    for (const mode of modes) {
      for (let i = 25; i >= 1; i--) {
        const roundId = `20260919${mode.replace('s','').replace('m','')}${String(1000 + i).padStart(4, '0')}`;
        const num = Math.floor(Math.random() * 10);
        let color: WinGoColor | 'red-violet' | 'green-violet' = 'green';
        if (num === 0) color = 'red-violet';
        else if (num === 5) color = 'green-violet';
        else if ([1, 3, 7, 9].includes(num)) color = 'green';
        else color = 'red';
        const size: WinGoSize = num >= 5 ? 'big' : 'small';

        this.roundResults.push({
          id: `rnd_hist_${mode}_${i}`,
          game_type: 'wingo',
          mode,
          round_id: roundId,
          result_number: num,
          result_size: size,
          result_color: color,
          hash: generateHash(`${roundId}_secret_${num}`),
          seed: `seed_${i}_${num}`,
          generated_at: new Date(now - i * 60000).toISOString(),
          round_status: 'settled',
          completed_at: new Date(now - i * 60000 + 30000).toISOString()
        });
      }
    }

    // Seed historical Aviator rounds
    const multipliers = [1.24, 2.85, 1.05, 5.42, 1.88, 12.40, 1.15, 3.20, 1.45, 8.75, 1.95, 2.10, 1.02, 4.50, 1.67];
    multipliers.forEach((mult, index) => {
      const rId = `AV-2026-${String(500 + index)}`;
      this.roundResults.push({
        id: `rnd_av_hist_${index}`,
        game_type: 'aviator',
        mode: 'aviator',
        round_id: rId,
        crash_multiplier: mult,
        hash: generateHash(`${rId}_crash_${mult}`),
        seed: `aviator_seed_${index}`,
        generated_at: new Date(now - (15 - index) * 45000).toISOString(),
        round_status: 'settled',
        completed_at: new Date(now - (15 - index) * 45000 + 15000).toISOString()
      });
    } );

    // Seed initial Audit logs
    this.auditLogs.push({
      id: 'aud_01',
      actor_id: adminId,
      actor_name: '56Club Admin',
      action: 'SYSTEM_INITIALIZED',
      entity_type: 'PLATFORM',
      entity_id: 'SYS_01',
      metadata: { description: '56Club virtual credit demo engine initialized' },
      created_at: new Date(now - 86400000).toISOString()
    });

  }

  // User management
  public getUserByMobile(mobile: string) {
    const cred = this.authCredentials.get(mobile);
    if (!cred) return null;
    return {
      profile: this.profiles.get(cred.user_id),
      credential: cred
    };
  }

  public getUserByUsernameOrMobile(identifier: string) {
    const trimmed = identifier.trim();
    // 1. Direct match in authCredentials (works for mobile or username)
    let cred = this.authCredentials.get(trimmed);
    if (cred) {
      return {
        profile: this.profiles.get(cred.user_id),
        credential: cred
      };
    }

    // 2. Case-insensitive username match or profile matching
    const lower = trimmed.toLowerCase();
    for (const profile of this.profiles.values()) {
      if (
        (profile.username && profile.username.toLowerCase() === lower) ||
        profile.mobile_number === trimmed
      ) {
        for (const [key, c] of this.authCredentials.entries()) {
          if (c.user_id === profile.user_id) {
            return {
              profile,
              credential: c
            };
          }
        }
      }
    }
    return null;
  }

  public getUserById(userId: string) {
    return this.profiles.get(userId) || null;
  }

  public registerUser(mobile: string, password: string, referralCode?: string) {
    if (this.authCredentials.has(mobile)) {
      throw new Error('This mobile number is already registered. Please log in.');
    }

    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const profile: UserProfile = {
      id: `prof_${userId}`,
      user_id: userId,
      mobile_number: mobile,
      display_name: `Club56_${mobile.slice(-4)}`,
      role: 'user',
      status: 'active',
      referral_code: referralCode || undefined,
      created_at: new Date().toISOString()
    };

    // First time registration grants ₹10 bonus
    const initialBalance = 10;
    const initialBonus = 10;

    const wallet: UserWallet = {
      id: `wal_${userId}`,
      user_id: userId,
      demo_balance: initialBalance,
      bonus_demo_balance: initialBonus,
      locked_demo_balance: 0,
      total_winnings: 0,
      total_losses: 0,
      updated_at: new Date().toISOString()
    };

    this.profiles.set(userId, profile);
    this.authCredentials.set(mobile, {
      mobile_number: mobile,
      password_hash: hashPassword(password),
      user_id: userId
    });
    this.wallets.set(userId, wallet);

    // Initial ledger entry for ₹10 First Time Registration Bonus
    this.addLedgerEntry({
      user_id: userId,
      transaction_type: 'bonus',
      amount: 10,
      balance_type: 'bonus',
      reference_id: 'FIRST_REGISTRATION_BONUS_10',
      status: 'completed',
      metadata: { note: '₹10 First Time Registration Bonus' }
    });

    this.logAudit({
      actor_id: userId,
      actor_name: profile.display_name,
      action: 'USER_REGISTERED',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { mobile: `${mobile.slice(0, 3)}****${mobile.slice(-2)}`, referral: referralCode }
    });

    return { profile, wallet };
  }

  // Wallets
  public getWallet(userId: string): UserWallet {
    let wal = this.wallets.get(userId);
    if (!wal) {
      wal = {
        id: `wal_${userId}`,
        user_id: userId,
        demo_balance: 10000,
        bonus_demo_balance: 500,
        locked_demo_balance: 0,
        total_winnings: 0,
        total_losses: 0,
        updated_at: new Date().toISOString()
      };
      this.wallets.set(userId, wal);
    }
    return wal;
  }

  public updateWalletBalance(
    userId: string,
    deltaMain: number,
    deltaBonus: number = 0,
    winningsDelta: number = 0,
    lossesDelta: number = 0
  ): UserWallet {
    const wal = this.getWallet(userId);
    wal.demo_balance = Math.max(0, Math.round((wal.demo_balance + deltaMain) * 100) / 100);
    wal.bonus_demo_balance = Math.max(0, Math.round((wal.bonus_demo_balance + deltaBonus) * 100) / 100);
    if (winningsDelta > 0) wal.total_winnings += winningsDelta;
    if (lossesDelta > 0) wal.total_losses += lossesDelta;
    wal.updated_at = new Date().toISOString();
    return wal;
  }

  // Ledger
  public addLedgerEntry(entry: Omit<DemoWalletLedger, 'id' | 'created_at'>): DemoWalletLedger {
    const record: DemoWalletLedger = {
      id: `led_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      ...entry,
      created_at: new Date().toISOString()
    };
    this.ledgers.unshift(record);
    return record;
  }

  public getLedgers(userId?: string): DemoWalletLedger[] {
    if (!userId) return this.ledgers;
    return this.ledgers.filter(l => l.user_id === userId);
  }

  // Bets
  public createBet(bet: Omit<DemoBet, 'id' | 'created_at'>): DemoBet {
    const record: DemoBet = {
      id: `bet_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      ...bet,
      created_at: new Date().toISOString()
    };
    this.bets.unshift(record);
    return record;
  }

  public getBets(userId?: string, gameType?: string, limit = 50): DemoBet[] {
    let result = this.bets;
    if (userId) result = result.filter(b => b.user_id === userId);
    if (gameType) result = result.filter(b => b.game_type === gameType);
    return result.slice(0, limit);
  }

  // Withdrawals
  public createWithdrawal(
    userId: string, 
    amount: number, 
    upiId: string, 
    beneficiaryName?: string, 
    accountIdentifier?: string
  ): DemoWithdrawal {
    const wal = this.getWallet(userId);
    if (wal.demo_balance < amount) {
      throw new Error('Insufficient balance for withdrawal.');
    }

    const profile = this.getUserById(userId);

    // Deduct immediately into pending hold
    this.updateWalletBalance(userId, -amount);

    const withdrawal: DemoWithdrawal = {
      id: `wd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user_name: profile?.display_name || 'Player',
      user_mobile: profile?.mobile_number || '',
      amount,
      upi_id: upiId,
      beneficiary_name: beneficiaryName || profile?.display_name || 'User',
      account_identifier: accountIdentifier || upiId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      note: 'Pending Admin Transfer to UPI'
    };

    this.withdrawals.unshift(withdrawal);

    this.addLedgerEntry({
      user_id: userId,
      transaction_type: 'withdrawal',
      amount,
      balance_type: 'main',
      reference_id: withdrawal.id,
      status: 'pending',
      metadata: { 
        upi_id: upiId, 
        beneficiary_name: beneficiaryName,
        note: `Withdrawal request to UPI: ${upiId}` 
      }
    });

    this.logAudit({
      actor_id: userId,
      actor_name: profile?.display_name,
      action: 'WITHDRAWAL_REQUESTED',
      entity_type: 'WITHDRAWAL',
      entity_id: withdrawal.id,
      metadata: { amount, upi_id: upiId, beneficiary_name: beneficiaryName }
    });

    return withdrawal;
  }

  public updateWithdrawalStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminId: string, 
    transferUtr?: string, 
    note?: string
  ): DemoWithdrawal {
    const wd = this.withdrawals.find(w => w.id === id);
    if (!wd) throw new Error('Withdrawal request not found');

    wd.status = status;
    wd.updated_at = new Date().toISOString();
    if (transferUtr) wd.transfer_utr = transferUtr;
    if (note) wd.note = note;

    if (status === 'rejected') {
      // Refund balance back to user
      this.updateWalletBalance(wd.user_id, wd.amount);
      this.addLedgerEntry({
        user_id: wd.user_id,
        transaction_type: 'recharge',
        amount: wd.amount,
        balance_type: 'main',
        reference_id: `REFUND_${wd.id}`,
        status: 'completed',
        metadata: { note: `Withdrawal rejected & refunded: ${note || 'Cancelled by Admin'}` }
      });
    } else if (status === 'approved') {
      // Mark corresponding pending ledger entry as completed
      const ledger = this.ledgers.find(l => l.reference_id === wd.id);
      if (ledger) {
        ledger.status = 'completed';
        if (!ledger.metadata) ledger.metadata = {};
        ledger.metadata.transfer_utr = transferUtr;
        ledger.metadata.transferred_at = new Date().toISOString();
      }
    }

    this.logAudit({
      actor_id: adminId,
      action: `WITHDRAWAL_${status.toUpperCase()}`,
      entity_type: 'WITHDRAWAL',
      entity_id: id,
      metadata: { status, transfer_utr: transferUtr, note, amount: wd.amount, user_upi: wd.upi_id }
    });

    return wd;
  }

  // Deposits
  public createDepositRequest(
    userId: string,
    amount: number,
    utrNumber: string,
    senderUpi?: string
  ): DepositRequest {
    const profile = this.getUserById(userId);

    // Check if duplicate UTR
    const existing = this.deposits.find(d => d.utr_number.toLowerCase() === utrNumber.toLowerCase().trim());
    if (existing) {
      throw new Error('This UTR / Transaction Reference has already been submitted.');
    }

    const deposit: DepositRequest = {
      id: `dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user_name: profile?.display_name || 'Player',
      user_mobile: profile?.mobile_number || '',
      amount,
      destination_upi: 'shahidddd@naviaxis',
      utr_number: utrNumber.trim(),
      sender_upi: senderUpi?.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.deposits.unshift(deposit);

    this.addLedgerEntry({
      user_id: userId,
      transaction_type: 'recharge',
      amount,
      balance_type: 'main',
      reference_id: deposit.id,
      status: 'pending',
      metadata: { 
        destination_upi: 'shahidddd@naviaxis',
        utr_number: utrNumber,
        sender_upi: senderUpi,
        note: 'Deposit submitted - awaiting admin verification' 
      }
    });

    this.logAudit({
      actor_id: userId,
      actor_name: profile?.display_name,
      action: 'DEPOSIT_SUBMITTED',
      entity_type: 'DEPOSIT',
      entity_id: deposit.id,
      metadata: { amount, utr_number: utrNumber, destination: 'shahidddd@naviaxis' }
    });

    return deposit;
  }

  public updateDepositStatus(
    id: string,
    status: 'approved' | 'rejected',
    adminId: string,
    adminNote?: string
  ): DepositRequest {
    const dep = this.deposits.find(d => d.id === id);
    if (!dep) throw new Error('Deposit request not found');

    dep.status = status;
    dep.updated_at = new Date().toISOString();
    if (adminNote) dep.admin_note = adminNote;

    if (status === 'approved') {
      // Credit user's wallet
      const bonus = Math.round(dep.amount * 0.10); // 10% first deposit bonus
      this.updateWalletBalance(dep.user_id, dep.amount, bonus);

      // Update ledger
      const ledger = this.ledgers.find(l => l.reference_id === dep.id);
      if (ledger) {
        ledger.status = 'completed';
        if (!ledger.metadata) ledger.metadata = {};
        ledger.metadata.approved_at = new Date().toISOString();
        ledger.metadata.admin_note = adminNote || 'Deposit verified and credited';
      }

      if (bonus > 0) {
        this.addLedgerEntry({
          user_id: dep.user_id,
          transaction_type: 'bonus',
          amount: bonus,
          balance_type: 'bonus',
          reference_id: `BONUS_${dep.id}`,
          status: 'completed',
          metadata: { note: '10% Deposit Bonus Credited' }
        });
      }
    } else if (status === 'rejected') {
      const ledger = this.ledgers.find(l => l.reference_id === dep.id);
      if (ledger) {
        ledger.status = 'reversed';
        if (!ledger.metadata) ledger.metadata = {};
        ledger.metadata.rejected_at = new Date().toISOString();
        ledger.metadata.rejection_reason = adminNote || 'UTR verification failed';
      }
    }

    this.logAudit({
      actor_id: adminId,
      action: `DEPOSIT_${status.toUpperCase()}`,
      entity_type: 'DEPOSIT',
      entity_id: id,
      metadata: { status, admin_note: adminNote, amount: dep.amount, utr: dep.utr_number }
    });

    return dep;
  }

  // Audit Logs
  public logAudit(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const record: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    return record;
  }
}

export const db = new DatabaseStore();
