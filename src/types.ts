export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  id: string;
  user_id: string;
  mobile_number: string;
  username?: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  vip_level?: number;
  referral_code?: string;
  created_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  demo_balance: number;
  bonus_demo_balance: number;
  locked_demo_balance: number;
  total_winnings: number;
  total_losses: number;
  updated_at: string;
}

export type LedgerTransactionType = 
  | 'recharge' 
  | 'withdrawal' 
  | 'bet_stake' 
  | 'bet_payout' 
  | 'bonus';

export interface DemoWalletLedger {
  id: string;
  user_id: string;
  transaction_type: LedgerTransactionType;
  amount: number;
  balance_type: 'main' | 'bonus';
  reference_id: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  metadata?: Record<string, any>;
  created_at: string;
}

export type GameType = 'wingo' | 'aviator';
export type WinGoMode = '30s' | '1m' | '3m' | '5m';

export type WinGoSelectionType = 'number' | 'color' | 'size';
export type WinGoColor = 'green' | 'red' | 'violet';
export type WinGoSize = 'big' | 'small';

export interface WinGoSelection {
  type: WinGoSelectionType;
  value: number | WinGoColor | WinGoSize;
}

export interface DemoBet {
  id: string;
  user_id: string;
  game_type: GameType;
  mode?: WinGoMode | 'aviator';
  round_id: string;
  selection: string; // JSON or formatted string
  stake: number;
  result: 'win' | 'loss' | 'pending' | 'cashed_out';
  payout: number;
  status: 'pending' | 'settled';
  cashout_multiplier?: number;
  created_at: string;
  settled_at?: string;
  winning_number?: number;
  multiplier?: number;
}

export interface DemoRoundResult {
  id: string;
  game_type: GameType;
  mode: string;
  round_id: string;
  result_number?: number;
  result_size?: WinGoSize;
  result_color?: WinGoColor | 'red-violet' | 'green-violet';
  crash_multiplier?: number;
  hash?: string; // transparent provable fairness hash
  seed?: string;
  generated_at: string;
  round_status: 'open' | 'closed' | 'settled';
  completed_at?: string;
}

export interface DepositRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_mobile?: string;
  amount: number;
  destination_upi: string; // 'shahidddd@naviaxis'
  utr_number: string;
  sender_upi?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  admin_note?: string;
}

export interface DemoWithdrawal {
  id: string;
  user_id: string;
  user_name?: string;
  user_mobile?: string;
  amount: number;
  account_identifier?: string; // Backwards compatible
  upi_id: string; // User submitted UPI ID e.g. user@okaxis
  beneficiary_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  transfer_utr?: string; // Admin transfer reference/UTR
  created_at: string;
  updated_at: string;
  note?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GameSettings {
  wingo_min_stake: number;
  wingo_max_stake: number;
  aviator_min_stake: number;
  aviator_max_stake: number;
  wagering_multiplier: number;
  maintenance_mode: boolean;
}

export interface WinGoRoundStatus {
  round_id: string;
  mode: WinGoMode;
  duration_seconds: number;
  time_remaining: number;
  is_betting_open: boolean;
  hash: string;
  last_results: DemoRoundResult[];
}

export interface AviatorRoundStatus {
  round_id: string;
  state: 'waiting' | 'betting_open' | 'running' | 'crashed' | 'settled';
  time_remaining: number;
  current_multiplier: number;
  crash_multiplier: number;
  elapsed_flight_time_ms: number;
  hash: string;
  recent_multipliers: number[];
  active_bets_count: number;
}
