import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserWallet } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  wallet: UserWallet | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (mobile: string, pass: string, confirm: string, refCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
  updateWalletState: (newWallet: UserWallet) => void;
  setAdminSession: (adminUser: UserProfile, token: string) => void;
  forgotPassword: (mobile: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('56club_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('56club_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'x-user-id': storedToken.split(':')[0]
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWallet(data.wallet);
        } else {
          // Token invalid or expired
          localStorage.removeItem('56club_token');
          setToken(null);
          setUser(null);
          setWallet(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  const refreshWallet = async () => {
    if (!token && !user) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: {
          Authorization: `Bearer ${token || user?.user_id}`,
          'x-user-id': user?.user_id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const updateWalletState = (newWallet: UserWallet) => {
    setWallet(newWallet);
  };

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: identifier,
          username: identifier,
          password: pass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      setWallet(data.wallet);
      setToken(data.token);
      localStorage.setItem('56club_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error or server unreachable' };
    }
  };

  const setAdminSession = (adminUser: UserProfile, adminToken: string) => {
    setUser(adminUser);
    setToken(adminToken);
    localStorage.setItem('56club_token', adminToken);
    refreshWallet();
  };

  const register = async (mobile: string, pass: string, confirm: string, refCode?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobile,
          password: pass,
          confirm_password: confirm,
          referral_code: refCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setUser(data.user);
      setWallet(data.wallet);
      setToken(data.token);
      localStorage.setItem('56club_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error or server unreachable' };
    }
  };

  const forgotPassword = async (mobile: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('56club_token');
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshWallet,
        updateWalletState,
        setAdminSession,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
