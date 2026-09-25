import React from 'react';
import { ShieldCheck, HelpCircle, FileText, HeartHandshake, ArrowLeft, Coins, Sparkles } from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
  return (
    <div id="support-page-container" className="space-y-4 pb-24 text-slate-100">
      <div className="flex items-center gap-3 bg-[#121824] p-4 rounded-3xl border border-slate-800">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Rules, Fairness & Legal Notice</h2>
          <p className="text-xs text-slate-400">Complete documentation of 56Club's simulation engine</p>
        </div>
      </div>

      {/* WinGo Rules Card */}
      <div className="p-5 rounded-3xl bg-[#121722] border border-slate-800 shadow-xl space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <FileText className="w-4 h-4" />
          <span>WinGo Lottery Simulation Rules</span>
        </div>
        <p className="text-slate-300">
          In WinGo, a random single-digit number (0 to 9) is selected each round through an automated cryptographic ticker.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#0b0e14] border border-slate-800/80 space-y-1">
            <span className="font-bold text-white block">Number Bet (0 - 9)</span>
            <p className="text-slate-400 text-[11px]">
              Payout: <strong>9.0x</strong>. If you select the exact winning number, you receive 9 times your demo stake.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#0b0e14] border border-slate-800/80 space-y-1">
            <span className="font-bold text-white block">Big / Small Bet</span>
            <p className="text-slate-400 text-[11px]">
              Payout: <strong>2.0x</strong>. Numbers 5, 6, 7, 8, 9 are "Big". Numbers 0, 1, 2, 3, 4 are "Small".
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#0b0e14] border border-slate-800/80 space-y-1">
            <span className="font-bold text-white block">Green / Red Bet</span>
            <p className="text-slate-400 text-[11px]">
              Payout: <strong>2.0x</strong> (or 1.5x if split with Violet 0 or 5). Green covers 1, 3, 7, 9. Red covers 2, 4, 6, 8.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#0b0e14] border border-slate-800/80 space-y-1">
            <span className="font-bold text-white block">Violet Bet (0, 5)</span>
            <p className="text-slate-400 text-[11px]">
              Payout: <strong>4.5x</strong>. Violet occurs when 0 or 5 is drawn.
            </p>
          </div>
        </div>
      </div>

      {/* Aviator Rules Card */}
      <div className="p-5 rounded-3xl bg-[#121722] border border-slate-800 shadow-xl space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <FileText className="w-4 h-4" />
          <span>Aviator Flight Multiplier Rules</span>
        </div>
        <p className="text-slate-300">
          The Aviator simulator generates a continuous rising multiplier curve from 1.00x upward.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-[11px]">
          <li>Place your demo stake while the round is in the "Waiting for next flight" phase.</li>
          <li>Once in flight, click <strong>CASH OUT</strong> at any moment to lock in your payout at the current multiplier.</li>
          <li>If the plane flies away (crashes) before you cash out, your demo stake is lost.</li>
          <li>Auto Cash Out allows you to preset a target multiplier (e.g. 2.00x) that automatically claims your winnings if reached.</li>
        </ul>
      </div>

      {/* Provable Fairness Commitment */}
      <div className="p-5 rounded-3xl bg-[#121722] border border-emerald-500/30 shadow-xl space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Provably Fair SHA-256 Engine</span>
        </div>
        <p className="text-slate-300">
          To eliminate doubts regarding outcome tampering, 56Club generates round seeds and calculates outcomes before any bets are accepted.
        </p>
        <div className="p-3 rounded-2xl bg-[#0b0e14] border border-slate-800 font-mono-gaming text-[11px] text-slate-400 space-y-1">
          <p className="text-white font-bold">Fairness Formula:</p>
          <p className="text-emerald-400">Round_Hash = SHA256(Secret_Seed + Round_ID + Timestamp)</p>
          <p>Because the Round_Hash is published before betting commences, the result cannot be modified mid-round based on user stakes.</p>
        </div>
      </div>

      {/* Regulatory & Virtual Credit Simulation Notice */}
      <div className="p-5 rounded-3xl bg-[#1a1424] border border-purple-500/30 shadow-xl space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
          <HeartHandshake className="w-4 h-4" />
          <span>Virtual Simulator Legal Notice</span>
        </div>
        <p className="text-slate-400 text-[11px]">
          <strong>Notice of Pure Simulation:</strong> 56Club operates entirely on fictitious, non-redeemable Demo Credits. No real money, legal tender, or virtual cryptocurrency can be deposited or won. No payment gateways (PhonePe, Google Pay, Paytm, UPI, or Credit Cards) are connected.
        </p>
        <p className="text-slate-400 text-[11px]">
          Any future commercial transition to real-money gaming would require formal statutory gaming licensing, KYC/AML identification verification, geofencing compliance, and approved banking integrations.
        </p>
      </div>
    </div>
  );
};
