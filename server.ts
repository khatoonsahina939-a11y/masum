import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './server/db';
import { gameEngine } from './server/engine';

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple Bearer / Header auth extraction
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;
  if (customUserId) {
    const user = db.getUserById(customUserId);
    if (user) return user;
  }
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Simple demo token format: "userId:timestamp" or direct userId
    const [userId] = token.split(':');
    return db.getUserById(userId);
  }
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or not authenticated. Please log in.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your demo account is suspended. Please contact support.' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  try {
    const { mobile_number, password, confirm_password, referral_code } = req.body;

    if (!mobile_number || !/^\d{10}$/.test(mobile_number.trim())) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Confirm password does not match.' });
    }

    const { profile, wallet } = db.registerUser(mobile_number.trim(), password, referral_code?.trim());

    res.status(201).json({
      message: 'Registration successful! ₹10 First Time Registration Bonus added to your account.',
      user: profile,
      wallet,
      token: `${profile.user_id}:${Date.now()}`
    });
  } catch (err: any) {
    if (err.message.includes('already registered')) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please log in.' });
    }
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { mobile_number, username, password } = req.body;
    const identifier = (username || mobile_number || '').toString().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username or mobile number and password are required.' });
    }

    const userObj = db.getUserByUsernameOrMobile(identifier);
    if (!userObj || !userObj.profile) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (userObj.profile.status === 'suspended') {
      return res.status(403).json({ error: 'Your demo account is suspended.' });
    }

    const hash = hashPassword(password);
    if (hash !== userObj.credential.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const wallet = db.getWallet(userObj.profile.user_id);

    db.logAudit({
      actor_id: userObj.profile.user_id,
      actor_name: userObj.profile.display_name,
      action: 'USER_LOGIN',
      entity_type: 'USER',
      entity_id: userObj.profile.user_id,
      metadata: { role: userObj.profile.role, username: userObj.profile.username }
    });

    res.json({
      message: 'Logged in successfully',
      user: userObj.profile,
      wallet,
      token: `${userObj.profile.user_id}:${Date.now()}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Dedicated Administrator Authentication endpoint (strictly for mrcat / 1111)
app.post('/api/admin/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = (username || '').toString().trim();
    const cleanPass = (password || '').toString();

    // Sole permitted admin: username mrcat, password 1111
    if (cleanUser.toLowerCase() !== 'mrcat' || cleanPass !== '1111') {
      return res.status(401).json({
        error: 'Access Denied: Only authorized administrator (mrcat) can access this console.'
      });
    }

    const adminObj = db.getUserByUsernameOrMobile('mrcat');
    if (!adminObj || !adminObj.profile || adminObj.profile.role !== 'admin') {
      return res.status(500).json({ error: 'Admin configuration error' });
    }

    const wallet = db.getWallet(adminObj.profile.user_id);

    db.logAudit({
      actor_id: adminObj.profile.user_id,
      actor_name: adminObj.profile.display_name,
      action: 'ADMIN_CONSOLE_LOGIN',
      entity_type: 'ADMIN',
      entity_id: adminObj.profile.user_id,
      metadata: { role: 'admin', username: 'mrcat' }
    });

    res.json({
      message: 'Admin console authenticated successfully',
      user: adminObj.profile,
      wallet,
      token: `${adminObj.profile.user_id}:${Date.now()}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Admin login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user;
  const wallet = db.getWallet(user.user_id);
  res.json({
    user,
    wallet
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { mobile_number } = req.body;
  if (!mobile_number || !/^\d{10}$/.test(mobile_number.trim())) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }
  const userObj = db.getUserByMobile(mobile_number.trim());
  if (!userObj) {
    return res.status(404).json({ error: 'No account registered with this mobile number.' });
  }
  // In demo simulation mode, reset to standard password 'club123'
  userObj.credential.password_hash = hashPassword('club123');
  res.json({
    message: 'Demo security reset: Your temporary password has been reset to "club123". Please log in and update your security credentials in Settings.'
  });
});

// ----------------------------------------------------
// WALLET & TRANSACTIONS
// ----------------------------------------------------

app.get('/api/wallet', requireAuth, (req, res) => {
  const user = (req as any).user;
  const wallet = db.getWallet(user.user_id);
  res.json({ wallet });
});

app.post('/api/wallet/recharge', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 10 || numAmount > 100000) {
      return res.status(400).json({ error: 'Invalid Demo Recharge amount. Minimum 10, Maximum 100,000 Demo Credits.' });
    }

    // 10% bonus simulation demo
    const bonus = Math.round(numAmount * 0.10);
    const updatedWallet = db.updateWalletBalance(user.user_id, numAmount, bonus);

    db.addLedgerEntry({
      user_id: user.user_id,
      transaction_type: 'recharge',
      amount: numAmount,
      balance_type: 'main',
      reference_id: `DEMO_TOPUP_${Date.now()}`,
      status: 'completed',
      metadata: { note: 'Demo Credits added successfully. No real payment was made.' }
    });

    if (bonus > 0) {
      db.addLedgerEntry({
        user_id: user.user_id,
        transaction_type: 'bonus',
        amount: bonus,
        balance_type: 'bonus',
        reference_id: `BONUS_${Date.now()}`,
        status: 'completed',
        metadata: { note: '10% Demo Deposit Simulation Bonus' }
      });
    }

    db.logAudit({
      actor_id: user.user_id,
      actor_name: user.display_name,
      action: 'DEMO_CREDITS_ADDED',
      entity_type: 'WALLET',
      entity_id: updatedWallet.id,
      metadata: { amount: numAmount, bonus }
    });

    res.json({
      message: 'Demo Credits added successfully. No real payment was made.',
      wallet: updatedWallet
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add demo credits' });
  }
});

// Deposit Submission Route (UPI with UTR verification)
app.post('/api/wallet/deposit', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { amount, utr_number, sender_upi } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹100.' });
    }

    if (!utr_number || utr_number.trim().length < 6) {
      return res.status(400).json({ error: 'Please provide a valid 12-digit UPI UTR / Transaction Reference Number.' });
    }

    const deposit = db.createDepositRequest(
      user.user_id,
      numAmount,
      utr_number.trim(),
      sender_upi ? sender_upi.trim() : undefined
    );

    res.status(201).json({
      message: 'Deposit request submitted successfully! Your account will be credited once verified by Admin.',
      deposit
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Deposit submission failed.' });
  }
});

app.post('/api/wallet/withdraw', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { amount, upi_id, beneficiary_name, account_identifier } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100.' });
    }

    const targetUpi = upi_id?.trim() || account_identifier?.trim();
    if (!targetUpi || targetUpi.length < 3) {
      return res.status(400).json({ error: 'Please enter a valid UPI address (e.g. yourname@okaxis, 9876543210@ybl).' });
    }

    const withdrawal = db.createWithdrawal(
      user.user_id, 
      numAmount, 
      targetUpi, 
      beneficiary_name?.trim(),
      targetUpi
    );
    const wallet = db.getWallet(user.user_id);

    res.json({
      message: 'Withdrawal request submitted successfully! Admin will transfer the amount to your UPI.',
      withdrawal,
      wallet
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Withdrawal failed.' });
  }
});

app.get('/api/wallet/transactions', requireAuth, (req, res) => {
  const user = (req as any).user;
  const ledgers = db.getLedgers(user.user_id);
  const withdrawals = db.withdrawals.filter(w => w.user_id === user.user_id);
  const deposits = db.deposits.filter(d => d.user_id === user.user_id);
  res.json({ ledgers, withdrawals, deposits });
});

// ----------------------------------------------------
// WINGO GAME ROUTES
// ----------------------------------------------------

app.get('/api/wingo/status/:mode', (req, res) => {
  try {
    const mode = (req.params.mode || '30s') as any;
    const status = gameEngine.getWinGoStatus(mode);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/wingo/bet', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { mode, selection, stake } = req.body;

    if (!mode || !['30s', '1m', '3m', '5m'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid game mode.' });
    }

    const numStake = Number(stake);
    if (isNaN(numStake) || numStake <= 0) {
      return res.status(400).json({ error: 'Invalid demo bet amount.' });
    }

    if (!selection || typeof selection !== 'object') {
      return res.status(400).json({ error: 'Please select a number, color, or size.' });
    }

    const bet = gameEngine.placeWinGoBet(user.user_id, mode, selection, numStake);
    const wallet = db.getWallet(user.user_id);

    res.json({
      message: 'Demo bet placed successfully!',
      bet,
      wallet
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/wingo/history/:mode', (req, res) => {
  const mode = req.params.mode || '30s';
  const history = db.roundResults
    .filter(r => r.game_type === 'wingo' && r.mode === mode)
    .slice(0, 50);
  res.json({ history });
});

app.get('/api/wingo/my-bets', requireAuth, (req, res) => {
  const user = (req as any).user;
  const bets = db.getBets(user.user_id, 'wingo', 50);
  res.json({ bets });
});

app.get('/api/wingo/stats/:mode', (req, res) => {
  const mode = req.params.mode || '30s';
  const results = db.roundResults
    .filter(r => r.game_type === 'wingo' && r.mode === mode)
    .slice(0, 100);

  // Calculate number frequency
  const frequency: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) frequency[i] = 0;
  let bigCount = 0;
  let smallCount = 0;
  let redCount = 0;
  let greenCount = 0;
  let violetCount = 0;

  results.forEach(r => {
    if (r.result_number !== undefined) {
      frequency[r.result_number] = (frequency[r.result_number] || 0) + 1;
      if (r.result_size === 'big') bigCount++;
      if (r.result_size === 'small') smallCount++;
      if (r.result_color?.includes('red')) redCount++;
      if (r.result_color?.includes('green')) greenCount++;
      if (r.result_color?.includes('violet')) violetCount++;
    }
  });

  res.json({
    total_rounds_analyzed: results.length,
    frequency,
    counts: { big: bigCount, small: smallCount, red: redCount, green: greenCount, violet: violetCount }
  });
});

// ----------------------------------------------------
// AVIATOR GAME ROUTES
// ----------------------------------------------------

app.get('/api/aviator/status', (req, res) => {
  const status = gameEngine.getAviatorStatus();
  res.json(status);
});

app.post('/api/aviator/bet', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { stake, auto_cashout } = req.body;
    const numStake = Number(stake);
    const numAuto = auto_cashout ? Number(auto_cashout) : undefined;

    if (isNaN(numStake) || numStake <= 0) {
      return res.status(400).json({ error: 'Invalid demo stake amount.' });
    }

    const bet = gameEngine.placeAviatorBet(user.user_id, numStake, numAuto);
    const wallet = db.getWallet(user.user_id);

    res.json({
      message: 'Aviator demo bet placed! Waiting for takeoff.',
      bet,
      wallet
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/aviator/cashout', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { bet_id } = req.body;

    if (!bet_id) {
      return res.status(400).json({ error: 'Bet ID is required' });
    }

    const result = gameEngine.cashoutAviatorBet(user.user_id, bet_id);
    const wallet = db.getWallet(user.user_id);

    res.json({
      message: `Cashed out at ${result.multiplier.toFixed(2)}x! +${result.payout} Demo Credits`,
      ...result,
      wallet
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/aviator/active-bets', requireAuth, (req, res) => {
  const user = (req as any).user;
  const activeBets = gameEngine.getAviatorActiveBets(user.user_id);
  res.json({ active_bets: activeBets });
});

app.get('/api/aviator/history', (req, res) => {
  const history = db.roundResults
    .filter(r => r.game_type === 'aviator')
    .slice(0, 50);
  res.json({ history });
});

app.get('/api/aviator/my-bets', requireAuth, (req, res) => {
  const user = (req as any).user;
  const bets = db.getBets(user.user_id, 'aviator', 50);
  res.json({ bets });
});

// ----------------------------------------------------
// ADMIN DASHBOARD ROUTES
// ----------------------------------------------------

app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const totalUsers = db.profiles.size;
  const activeUsers = Array.from(db.profiles.values()).filter(p => p.status === 'active').length;
  const totalBets = db.bets.length;
  const totalWagered = db.bets.reduce((acc, b) => acc + b.stake, 0);
  const totalPayouts = db.bets.reduce((acc, b) => acc + b.payout, 0);
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'pending');
  const totalDemoBalances = Array.from(db.wallets.values()).reduce((acc, w) => acc + w.demo_balance, 0);

  res.json({
    metrics: {
      total_users: totalUsers,
      active_users: activeUsers,
      total_bets: totalBets,
      total_wagered: totalWagered,
      total_payouts: totalPayouts,
      pending_withdrawals_count: pendingWithdrawals.length,
      pending_withdrawals_amount: pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0),
      total_demo_balance_circulating: totalDemoBalances
    },
    recent_bets: db.bets.slice(0, 10),
    pending_withdrawals: pendingWithdrawals.slice(0, 5)
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const usersWithWallets = Array.from(db.profiles.values()).map(profile => ({
    ...profile,
    wallet: db.getWallet(profile.user_id)
  }));
  res.json({ users: usersWithWallets });
});

app.post('/api/admin/users/:id/toggle-status', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const targetId = req.params.id;
  const profile = db.profiles.get(targetId);
  if (!profile) return res.status(404).json({ error: 'User profile not found' });

  if (profile.role === 'admin') {
    return res.status(400).json({ error: 'Cannot modify primary administrator account status' });
  }

  profile.status = profile.status === 'active' ? 'suspended' : 'active';

  db.logAudit({
    actor_id: admin.user_id,
    actor_name: admin.display_name,
    action: `USER_${profile.status.toUpperCase()}`,
    entity_type: 'USER',
    entity_id: targetId,
    metadata: { new_status: profile.status }
  });

  res.json({ message: `Account status updated to ${profile.status}`, profile });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'pending');
  const pendingDeposits = db.deposits.filter(d => d.status === 'pending');
  res.json({
    total_users: db.profiles.size,
    total_demo_volume: db.bets.reduce((acc, b) => acc + b.stake, 0),
    total_rounds_played: db.roundResults.length,
    active_game_modes: ['WinGo 30s', 'WinGo 1m', 'WinGo 3m', 'WinGo 5m', 'Aviator'],
    pending_withdrawals_count: pendingWithdrawals.length,
    pending_withdrawals_amount: pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0),
    pending_deposits_count: pendingDeposits.length,
    pending_deposits_amount: pendingDeposits.reduce((acc, d) => acc + d.amount, 0),
  });
});

app.get('/api/admin/deposits', requireAdmin, (req, res) => {
  res.json({ deposits: db.deposits });
});

app.post('/api/admin/deposits/:id/update-status', requireAdmin, (req, res) => {
  try {
    const admin = (req as any).user;
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
    }
    const updated = db.updateDepositStatus(req.params.id, status, admin.user_id, admin_note);
    res.json({ message: `Deposit request marked as ${status}`, deposit: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/withdrawals', requireAdmin, (req, res) => {
  res.json({ withdrawals: db.withdrawals });
});

app.post('/api/admin/withdrawals/:id/update-status', requireAdmin, (req, res) => {
  try {
    const admin = (req as any).user;
    const { status, transfer_utr, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
    }
    const updated = db.updateWithdrawalStatus(req.params.id, status, admin.user_id, transfer_utr, note);
    res.json({ message: `Withdrawal request marked as ${status}`, withdrawal: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/games/settings', requireAdmin, (req, res) => {
  res.json({ settings: db.settings });
});

app.post('/api/admin/games/settings', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const { wingo_min_stake, wingo_max_stake, aviator_min_stake, aviator_max_stake, wagering_multiplier } = req.body;

  if (wingo_min_stake) db.settings.wingo_min_stake = Number(wingo_min_stake);
  if (wingo_max_stake) db.settings.wingo_max_stake = Number(wingo_max_stake);
  if (aviator_min_stake) db.settings.aviator_min_stake = Number(aviator_min_stake);
  if (aviator_max_stake) db.settings.aviator_max_stake = Number(aviator_max_stake);
  if (wagering_multiplier) db.settings.wagering_multiplier = Number(wagering_multiplier);

  db.logAudit({
    actor_id: admin.user_id,
    actor_name: admin.display_name,
    action: 'GAME_SETTINGS_UPDATED',
    entity_type: 'SETTINGS',
    entity_id: 'CONFIG',
    metadata: db.settings
  });

  res.json({ message: 'Settings updated successfully', settings: db.settings });
});

app.get('/api/admin/games/rounds', requireAdmin, (req, res) => {
  res.json({ rounds: db.roundResults.slice(0, 100) });
});

app.get('/api/admin/bonuses', requireAdmin, (req, res) => {
  const bonuses = db.ledgers.filter(l => l.transaction_type === 'bonus');
  res.json({
    bonuses,
    rules: {
      deposit_bonus_percent: 10,
      signup_bonus_credits: 500,
      referral_bonus_credits: 1000,
      wagering_multiplier: db.settings.wagering_multiplier
    }
  });
});

app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  res.json({ audit_logs: db.auditLogs });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER START
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`56Club Server running on port ${PORT}`);
  });
}

startServer();
