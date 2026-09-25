import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  Gamepad2, 
  Coins, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  X,
  XCircle,
  Send,
  LogOut
} from 'lucide-react';
import type { UserProfile, AuditLog, DemoRoundResult, DemoWithdrawal, DepositRequest } from '../../types';

interface AdminDashboardProps {
  onBack: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onLogout }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<DemoWithdrawal[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [recentRounds, setRecentRounds] = useState<DemoRoundResult[]>([]);
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'deposits' | 'overview' | 'users' | 'rounds' | 'audit'>('withdrawals');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Transfer Processing Modal (Admin sending money to user account)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<DemoWithdrawal | null>(null);
  const [transferUtr, setTransferUtr] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('Transferred via UPI');

  // Reject Withdrawal Modal
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<DemoWithdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Invalid UPI address or verification failed');

  // Deposit Approval Modal
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [depositNote, setDepositNote] = useState<string>('UTR verified in bank statement');

  // Balance adjustment modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('500');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      const headers = { 'x-user-id': user?.user_id || '' };
      
      const [statsRes, usersRes, auditRes, roundsRes, withdrawalsRes, depositsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/wingo/status/30s'),
        fetch('/api/admin/withdrawals', { headers }),
        fetch('/api/admin/deposits', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.audit_logs);
      }
      if (roundsRes.ok) {
        const r = await roundsRes.json();
        setRecentRounds(r.last_results);
      }
      if (withdrawalsRes.ok) {
        const w = await withdrawalsRes.json();
        setWithdrawals(w.withdrawals);
      }
      if (depositsRes.ok) {
        const d = await depositsRes.json();
        setDeposits(d.deposits);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ADMIN ACTION: Transfer money and approve withdrawal
  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);
    setActionMessage(null);

    const generatedUtr = transferUtr.trim() || `UPI_PAYOUT_${Date.now()}`;

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          status: 'approved',
          transfer_utr: generatedUtr,
          note: transferNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to approve withdrawal' });
      } else {
        setActionMessage({ 
          type: 'success', 
          text: `Marked as Transferred! ₹${selectedWithdrawal.amount} sent to ${selectedWithdrawal.upi_id}` 
        });
        setSelectedWithdrawal(null);
        setTransferUtr('');
        fetchAdminData();
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error executing transfer' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ADMIN ACTION: Reject withdrawal & refund player
  const handleRejectWithdrawal = async () => {
    if (!rejectingWithdrawal) return;
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/withdrawals/${rejectingWithdrawal.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          status: 'rejected',
          note: rejectionReason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to reject withdrawal' });
      } else {
        setActionMessage({ 
          type: 'success', 
          text: `Withdrawal rejected. ₹${rejectingWithdrawal.amount} refunded back to user's wallet.` 
        });
        setRejectingWithdrawal(null);
        fetchAdminData();
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error rejecting withdrawal' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ADMIN ACTION: Approve deposit and credit user wallet
  const handleApproveDeposit = async (dep: DepositRequest) => {
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/deposits/${dep.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          status: 'approved',
          admin_note: 'Verified UTR: ' + dep.utr_number
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to approve deposit' });
      } else {
        setActionMessage({ 
          type: 'success', 
          text: `Approved! Credited ₹${dep.amount} (+10% Bonus) to ${dep.user_name || 'Player'}` 
        });
        setSelectedDeposit(null);
        fetchAdminData();
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error approving deposit' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ADMIN ACTION: Reject deposit
  const handleRejectDeposit = async (dep: DepositRequest) => {
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/deposits/${dep.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({
          status: 'rejected',
          admin_note: 'Invalid UTR reference'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to reject deposit' });
      } else {
        setActionMessage({ type: 'success', text: `Deposit ${dep.id} rejected.` });
        fetchAdminData();
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error rejecting deposit' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser) return;
    const num = Number(adjustAmount);
    if (isNaN(num) || num <= 0) return;

    setIsProcessing(true);
    setActionMessage(null);

    try {
      const finalAmount = adjustType === 'add' ? num : -num;
      const res = await fetch(`/api/admin/users/${selectedUser.user_id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || ''
        },
        body: JSON.stringify({ amount: finalAmount })
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to adjust balance' });
      } else {
        setActionMessage({ type: 'success', text: `Adjusted ${selectedUser.display_name} balance by ₹${finalAmount}` });
        fetchAdminData();
        setTimeout(() => setSelectedUser(null), 1000);
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Error executing balance adjustment' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;

  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile_number.includes(searchTerm)
  );

  return (
    <div id="admin-dashboard-container" className="space-y-4 pb-28 text-slate-100 px-3 sm:px-4 pt-3 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#121824] p-4 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">56Club Operator Management</h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">Manage user withdrawals, incoming deposits, and platform accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onLogout && (
            <button
              id="admin-logout-button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Log out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Message Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'withdrawals' 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40' 
              : 'bg-[#151d2c] text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdrawals</span>
          {pendingWithdrawalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 text-[10px] font-black">
              {pendingWithdrawalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'deposits' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
              : 'bg-[#151d2c] text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Deposits</span>
          {pendingDepositsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-600 text-[10px] font-black">
              {pendingDepositsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'overview' 
              ? 'bg-slate-700 text-white' 
              : 'bg-[#151d2c] text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Telemetry
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'users' 
              ? 'bg-slate-700 text-white' 
              : 'bg-[#151d2c] text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('rounds')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'rounds' 
              ? 'bg-slate-700 text-white' 
              : 'bg-[#151d2c] text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Round Hashes
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'audit' 
              ? 'bg-slate-700 text-white' 
              : 'bg-[#151d2c] text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Audit
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB: WITHDRAWALS MANAGEMENT (Admin transfers money to user UPI) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-3xl bg-[#141b28] border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Player Withdrawal Requests</span>
              </h3>
              <p className="text-xs text-slate-400">
                User submitted their UPI address. Admin can transfer funds via UPI app and approve with UTR.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-xl border border-amber-500/30">
                {pendingWithdrawalsCount} Pending Transfers
              </span>
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-[#121722] rounded-3xl border border-slate-800">
              No withdrawal requests recorded.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {withdrawals.map((wd) => {
                const isPending = wd.status === 'pending';
                const isApproved = wd.status === 'approved';
                const isRejected = wd.status === 'rejected';
                const userUpi = wd.upi_id || wd.account_identifier || 'N/A';
                const deepLink = `upi://pay?pa=${userUpi}&pn=${encodeURIComponent(wd.beneficiary_name || wd.user_name || 'Player')}&am=${wd.amount}&cu=INR&tn=56Club_Withdrawal_Payout`;

                return (
                  <div
                    key={wd.id}
                    className={`p-4 rounded-3xl border text-xs space-y-3 transition-all ${
                      isPending
                        ? 'bg-[#151c2a] border-amber-500/40 shadow-xl'
                        : isApproved
                        ? 'bg-[#101520] border-emerald-500/30'
                        : 'bg-[#101520] border-slate-800/80 opacity-75'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{wd.user_name || 'Player'}</span>
                        {wd.user_mobile && (
                          <span className="text-[11px] text-slate-400">+91 {wd.user_mobile}</span>
                        )}
                      </div>

                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Transfer
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Transferred
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected & Refunded
                        </span>
                      )}
                    </div>

                    {/* Amount & UPI Box */}
                    <div className="p-3 rounded-2xl bg-[#0c1018] border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Withdraw Amount:</span>
                        <span className="font-mono font-black text-rose-400 text-base">
                          ₹{wd.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* User's Submitted UPI Address */}
                      <div className="pt-2 border-t border-slate-800/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          User's Submitted UPI Address (To Send Money)
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm select-all">
                            {userUpi}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(userUpi, wd.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all shrink-0 active:scale-95"
                          >
                            {copiedId === wd.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === wd.id ? 'Copied' : 'Copy UPI'}</span>
                          </button>
                        </div>
                      </div>

                      {wd.beneficiary_name && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Beneficiary Name:</span>
                          <span className="text-white font-medium">{wd.beneficiary_name}</span>
                        </div>
                      )}

                      {wd.transfer_utr && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                          <span>Transfer Ref / UTR:</span>
                          <span className="font-bold select-all">{wd.transfer_utr}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions if Pending */}
                    {isPending && (
                      <div className="space-y-2 pt-1">
                        {/* 1-click open UPI App intent */}
                        <a
                          href={deepLink}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Pay ₹{wd.amount} in PhonePe / GPay / Paytm</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWithdrawal(wd);
                              setTransferUtr(`UPI_${Math.floor(100000000000 + Math.random() * 900000000000)}`);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Transfer & Complete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingWithdrawal(wd)}
                            className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject & Refund</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>ID: {wd.id}</span>
                      <span>{new Date(wd.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: DEPOSITS MANAGEMENT (Verify UTR to official UPI: shahidddd@naviaxis) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-3xl bg-[#141b28] border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Player Deposit Submissions</span>
              </h3>
              <p className="text-xs text-slate-400">
                Incoming UPI deposits sent to <strong className="text-amber-300">shahidddd@naviaxis</strong>. Check UTR in bank statement and approve.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-xl border border-emerald-500/30">
                {pendingDepositsCount} Pending Verification
              </span>
            </div>
          </div>

          {deposits.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-[#121722] rounded-3xl border border-slate-800">
              No deposit submissions recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deposits.map((dep) => {
                const isPending = dep.status === 'pending';
                const isApproved = dep.status === 'approved';
                const isRejected = dep.status === 'rejected';

                return (
                  <div
                    key={dep.id}
                    className={`p-4 rounded-3xl border text-xs space-y-3 transition-all ${
                      isPending
                        ? 'bg-[#151c2a] border-emerald-500/40 shadow-xl'
                        : isApproved
                        ? 'bg-[#101520] border-emerald-500/20'
                        : 'bg-[#101520] border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{dep.user_name || 'Player'}</span>
                        {dep.user_mobile && (
                          <span className="text-[11px] text-slate-400">+91 {dep.user_mobile}</span>
                        )}
                      </div>

                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Credited (+10% Bonus)
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Deposit Amount:</span>
                        <span className="font-mono font-black text-emerald-400 text-base">
                          ₹{dep.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Submitted UTR Number */}
                      <div className="pt-2 border-t border-slate-800/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Submitted 12-Digit UTR / Transaction Ref
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-amber-300 text-sm select-all">
                            {dep.utr_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(dep.utr_number, dep.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all shrink-0 active:scale-95"
                          >
                            {copiedId === dep.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === dep.id ? 'Copied' : 'Copy UTR'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Destination UPI:</span>
                        <span className="font-mono text-slate-200">{dep.destination_upi}</span>
                      </div>

                      {dep.sender_upi && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Sender UPI:</span>
                          <span className="font-mono text-slate-300">{dep.sender_upi}</span>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApproveDeposit(dep)}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Credit ₹{dep.amount}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRejectDeposit(dep)}
                          className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>ID: {dep.id}</span>
                      <span>{new Date(dep.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: OVERVIEW TELEMETRY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" /> Total Users
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {stats?.total_users || users.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" /> Total Staked Volume
              </span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                ₹{stats?.total_demo_volume?.toLocaleString() || '18,400'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-400" /> Pending Withdrawals
              </span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {stats?.pending_withdrawals_count ?? pendingWithdrawalsCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121824] border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-purple-400" /> Active Modes
              </span>
              <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
                {stats?.active_game_modes?.length || 5} Modes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: USERS MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="p-4 rounded-3xl bg-[#121722] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredUsers.length} accounts</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#182030] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Name / Mobile</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">VIP</th>
                  <th className="py-2.5 px-3">Joined</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="text-white font-bold block">{u.display_name}</span>
                      <span className="text-[11px] text-slate-400">+91 {u.mobile_number}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">VIP {u.vip_level}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: ROUND HASHES & INTEGRITY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rounds' && (
        <div className="p-4 rounded-3xl bg-[#121722] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Pre-Generated Cryptographic Commitments</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#182030] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Round ID</th>
                  <th className="py-2.5 px-3">Number</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRounds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-white font-bold">{r.round_id}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{r.result_number}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">
                      {r.result_size} / {r.result_color}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                      {r.hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: AUDIT LEDGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="p-4 rounded-3xl bg-[#121722] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Immutable Operator Actions</h4>
          <div className="divide-y divide-slate-800 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{log.action}</span>
                  <span className="text-[11px] text-slate-400">{log.details || JSON.stringify(log.metadata)}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {new Date(log.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Process Transfer & Approve Withdrawal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121722] border border-slate-700 rounded-3xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Confirm Transfer to User UPI</span>
              </h3>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0c1018] border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Player:</span>
                <span className="text-white font-bold">{selectedWithdrawal.user_name} (+91 {selectedWithdrawal.user_mobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-rose-400 font-bold text-sm">₹{selectedWithdrawal.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Receiving UPI:</span>
                <span className="text-amber-300 font-bold">{selectedWithdrawal.upi_id || selectedWithdrawal.account_identifier}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bank / UPI Transfer UTR Reference <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={transferUtr}
                onChange={(e) => setTransferUtr(e.target.value)}
                placeholder="e.g. 423198765432"
                className="w-full bg-[#182234] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Admin Note / Remarks
              </label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApproveWithdrawal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Processing...' : 'Confirm Transferred'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Withdrawal & Refund */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121722] border border-rose-900/50 rounded-3xl p-6 text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Reject Withdrawal & Refund Balance</span>
              </h3>
              <button onClick={() => setRejectingWithdrawal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting this request will immediately refund <strong className="text-white font-bold">₹{rejectingWithdrawal.amount.toLocaleString()}</strong> back into the player's wallet balance.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none h-20"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRejectWithdrawal}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Processing...' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Balance Adjustment for testing */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121722] border border-slate-700 rounded-3xl p-6 text-slate-200 space-y-4">
            <h3 className="text-base font-bold text-white mb-1">
              Adjust Balance for {selectedUser.display_name}
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs ${
                  adjustType === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                + Add (Credit)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('deduct')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs ${
                  adjustType === 'deduct' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                - Deduct (Debit)
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustBalance}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
