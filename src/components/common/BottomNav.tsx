import React from 'react';
import { Home, Gamepad2, Wallet, User } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'nav-home', label: 'Home', icon: Home, route: '/home' },
    { id: 'nav-games', label: 'Games', icon: Gamepad2, route: '/games' },
    { id: 'nav-wallet', label: 'Wallet', icon: Wallet, route: '/wallet' },
    { id: 'nav-profile', label: 'Profile', icon: User, route: '/profile' }
  ];

  const isActive = (route: string) => {
    if (route === '/home') {
      return currentRoute === '/' || currentRoute === '/home';
    }
    return currentRoute.startsWith(route);
  };

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#0d121c]/95 backdrop-blur-md border-t border-slate-800/90 py-1.5 px-4 sm:hidden"
    >
      <div className="grid grid-cols-4 gap-1 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.route);
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => onNavigate(item.route)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 relative ${
                active ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-transform ${
                  active ? 'scale-110 bg-rose-500/10 text-rose-500' : ''
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${active ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
