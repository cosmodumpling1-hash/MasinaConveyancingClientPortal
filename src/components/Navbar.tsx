import React from 'react';
import { Shield, Users, Landmark, Scale, LogOut, ChevronDown } from 'lucide-react';
import { User } from '../types';
import MasinaLogo from './MasinaLogo';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, allUsers, onSwitchUser, onLogout }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'buyer':
        return <span className="bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-600/15 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">Buyer Client</span>;
      case 'seller':
        return <span className="bg-amber-50/80 text-amber-800 ring-1 ring-amber-600/15 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">Seller Client</span>;
      case 'attorney':
        return <span className="bg-brand-gold/10 text-brand-gold-dark ring-1 ring-brand-gold/25 text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wider">Senior Attorney</span>;
      case 'conveyancer':
        return <span className="bg-blue-50/80 text-blue-800 ring-1 ring-blue-700/15 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">Conveyancer</span>;
      case 'paralegal':
        return <span className="bg-purple-50/80 text-purple-800 ring-1 ring-purple-700/15 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">Paralegal</span>;
      case 'admin':
        return <span className="bg-rose-50/80 text-rose-800 ring-1 ring-rose-700/15 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">Admin</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] uppercase px-2 py-0.5 rounded font-semibold tracking-wider">{role}</span>;
    }
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm" id="main-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand section */}
          <div className="flex items-center">
            <MasinaLogo size="md" />
          </div>

          {/* Center Sandbox Information */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 bg-brand-cream px-3 py-1.5 rounded-lg border border-slate-100">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-medium text-slate-600">POPIA & GDPR Compliant Security Active</span>
          </div>

          {/* Right Action Switcher Panel */}
          <div className="flex items-center space-x-4">
            {/* Simulation Identity Select */}
            <div className="relative">
              <button
                id="switch-persona-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-left bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700"
              >
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Role: {currentUser.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-premium border border-slate-100 py-2 z-50 overflow-hidden divide-y divide-slate-50 animate-fade-in animate-duration-200">
                  <div className="px-4 py-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Quick Switch Persona</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Toggle accounts to test client-side vs. staff dashboards.</p>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {allUsers.map((usr) => (
                      <button
                        key={usr.id}
                        onClick={() => {
                          onSwitchUser(usr.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-brand-cream/60 transition-colors ${
                          currentUser.id === usr.id ? 'bg-brand-gold/5' : ''
                        }`}
                      >
                        <img src={usr.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'} className="h-8 w-8 rounded-full border border-slate-200 object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{usr.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{usr.email}</p>
                        </div>
                        <div>{getRoleBadge(usr.role)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="hidden sm:flex items-center space-x-3 border-l border-slate-100 pl-4">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                className="h-9 w-9 rounded-full ring-2 ring-brand-gold/10 border border-white object-cover"
                alt="Profile"
              />
              <div className="text-left leading-none">
                <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
                <span className="text-[9px] uppercase tracking-wider font-bold text-brand-gold-dark block mt-1.5 font-sans">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 ml-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer"
                title="Sign Out Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
