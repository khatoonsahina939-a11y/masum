import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomePage } from './components/home/HomePage';
import { GamesLobby } from './components/games/GamesLobby';
import { WinGoGame } from './components/wingo/WinGoGame';
import { AviatorGame } from './components/aviator/AviatorGame';
import { WalletPage } from './components/wallet/WalletPage';
import { WithdrawalPage } from './components/wallet/WithdrawalPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { SupportPage } from './components/support/SupportPage';
import { RechargeModal } from './components/wallet/RechargeModal';
import { RechargeRequirementModal } from './components/wallet/RechargeRequirementModal';
import { WithdrawModal } from './components/wallet/WithdrawModal';
import { AuthModals } from './components/auth/AuthModals';
import { ReferModal } from './components/referral/ReferModal';
import type { WinGoMode } from './types';

function MainApp() {
  const { user, wallet, setAdminSession, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/home');
  const [wingoMode, setWingoMode] = useState<WinGoMode>('30s');

  // Modal controls
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isRechargeReqOpen, setIsRechargeReqOpen] = useState(false);
  const [reqGameName, setReqGameName] = useState('WinGo');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<'login' | 'register' | 'forgot' | null>(null);

  // Check for referral query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode && !user) {
        setAuthModalState('register');
      }
    }
  }, [user]);

  // Sync hash routing or internal route
  const handleNavigate = (route: string) => {
    if (route.startsWith('/wingo')) {
      if (route.includes('1m')) setWingoMode('1m');
      else if (route.includes('5m')) setWingoMode('5m');
      else setWingoMode('30s');

      // Check first-time minimum recharge requirement (min ₹100)
      const hasRecharged = wallet && wallet.demo_balance >= 100;
      if (!hasRecharged) {
        setReqGameName('WinGo');
        setIsRechargeReqOpen(true);
      }
      setCurrentRoute('/wingo');
    } else if (route === '/aviator') {
      const hasRecharged = wallet && wallet.demo_balance >= 100;
      if (!hasRecharged) {
        setReqGameName('Aviator');
        setIsRechargeReqOpen(true);
      }
      setCurrentRoute('/aviator');
    } else {
      setCurrentRoute(route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isGameRoute = currentRoute === '/wingo' || currentRoute === '/aviator';
  const isAdminRoute = currentRoute === '/admin';
  const isAdminAuthenticated = user?.role === 'admin';

  // If user navigated to /admin but is not authenticated as admin, render dedicated AdminLoginPage
  if (isAdminRoute && !isAdminAuthenticated) {
    return (
      <AdminLoginPage
        onSuccess={(adminUser, token) => {
          setAdminSession(adminUser, token);
          setCurrentRoute('/admin');
        }}
        onBackToApp={() => handleNavigate('/home')}
      />
    );
  }

  // If user is authenticated as admin and on /admin, render the full admin dashboard
  if (isAdminRoute && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
        <AdminDashboard
          onBack={() => handleNavigate('/home')}
          onLogout={() => {
            logout();
            handleNavigate('/admin');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Global Header (rendered for non-game pages) */}
      {!isGameRoute && (
        <Header
          onOpenRecharge={() => setIsRechargeOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onOpenAuth={(mode) => setAuthModalState(mode)}
          onOpenRefer={() => setIsReferModalOpen(true)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isGameRoute ? 'max-w-4xl w-full mx-auto p-3 sm:p-5' : ''}`}>
        {currentRoute === '/home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenAuth={(mode) => setAuthModalState(mode)}
            onOpenRefer={() => setIsReferModalOpen(true)}
          />
        )}

        {currentRoute === '/games' && (
          <GamesLobby onNavigate={handleNavigate} />
        )}

        {currentRoute === '/wingo' && (
          <WinGoGame
            initialMode={wingoMode}
            onBack={() => handleNavigate('/home')}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onNavigate={handleNavigate}
            onOpenRechargeRequirement={() => {
              setReqGameName('WinGo');
              setIsRechargeReqOpen(true);
            }}
          />
        )}

        {currentRoute === '/aviator' && (
          <AviatorGame
            onBack={() => handleNavigate('/home')}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onNavigate={handleNavigate}
            onOpenRechargeRequirement={() => {
              setReqGameName('Aviator');
              setIsRechargeReqOpen(true);
            }}
          />
        )}

        {currentRoute === '/wallet' && (
          <WalletPage
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => handleNavigate('/withdraw')}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === '/withdraw' && (
          <WithdrawalPage
            onBack={() => handleNavigate('/wallet')}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === '/profile' && (
          <ProfilePage
            onNavigate={handleNavigate}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenAuth={(mode) => setAuthModalState(mode)}
            onOpenRefer={() => setIsReferModalOpen(true)}
          />
        )}

        {currentRoute === '/support' && (
          <SupportPage onBack={() => handleNavigate('/home')} />
        )}
      </main>

      {/* Bottom Navigation (rendered for non-game pages or fixed on mobile) */}
      {!isGameRoute && (
        <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}

      {/* Global Modals */}
      <RechargeRequirementModal
        isOpen={isRechargeReqOpen}
        onClose={() => setIsRechargeReqOpen(false)}
        onOpenRecharge={() => {
          setIsRechargeReqOpen(false);
          setIsRechargeOpen(true);
        }}
        onOpenAuth={(mode) => {
          setIsRechargeReqOpen(false);
          setAuthModalState(mode);
        }}
        gameName={reqGameName}
      />

      <RechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />

      <ReferModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        onOpenAuth={(mode) => setAuthModalState(mode)}
      />

      <AuthModals
        isOpen={!!authModalState}
        initialMode={authModalState || 'login'}
        onClose={() => setAuthModalState(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
