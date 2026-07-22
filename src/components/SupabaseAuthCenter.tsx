import React from 'react';
import { Shield, Mail, Lock, UserPlus, LogIn, LogOut, CheckCircle2, RefreshCw, AlertCircle, Sparkles, User, FileText, Phone, MapPin, Key, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';

interface SupabaseAuthCenterProps {
  currentUser: UserType | null;
  onLoginSuccess: (user: UserType) => void;
  onLogoutSuccess: () => void;
  allUsers: UserType[];
}

export default function SupabaseAuthCenter({
  currentUser,
  onLoginSuccess,
  onLogoutSuccess,
  allUsers
}: SupabaseAuthCenterProps) {
  const [activeTab, setActiveTab] = React.useState<'login' | 'signup'>('login');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Connection config state
  const [supabaseConfig, setSupabaseConfig] = React.useState<{ url: string; projectId: string; hasKey: boolean } | null>(null);

  // Form States
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('buyer');
  const [phone, setPhone] = React.useState('');
  const [idNumber, setIdNumber] = React.useState('');
  const [address, setAddress] = React.useState('');

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/supabase/config');
      if (res.ok) {
        const data = await res.json();
        setSupabaseConfig(data);
      }
    } catch (err) {
      console.error("Error fetching Supabase configuration:", err);
    }
  };

  React.useEffect(() => {
    fetchConfig();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/supabase/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess(data.message || 'Authenticated successfully!');
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/supabase/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          phone,
          idNumber,
          address
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message || 'Account registered successfully!');
      onLoginSuccess(data.user);
      setActiveTab('login');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/supabase/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      onLogoutSuccess();
      setSuccess('Logged out successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('masina123'); // Preset password for simulation ease
    setActiveTab('login');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-premium overflow-hidden max-w-2xl mx-auto animate-fade-in" id="supabase-auth-hub">
      {/* Top Banner header */}
      <div className="bg-brand-navy text-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-brand-gold font-bold uppercase text-xs tracking-wider">
            <Shield className="h-4 w-4 animate-pulse" />
            <span>Identity Trust & Supabase Auth Hub</span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white mt-1">Conveyancing Portal Authorization</h2>
        </div>
        
        {supabaseConfig?.hasKey ? (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE CLOUD MODE</span>
          </span>
        ) : (
          <span className="bg-amber-500/10 text-brand-gold border border-brand-gold/20 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
            <span>SANDBOX MODE</span>
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Error / Success Banners */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-2.5 text-red-800 text-xs font-sans">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider block">Authentication Error</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-2.5 text-emerald-800 text-xs font-sans">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider block">Success Action</span>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* LOGGED IN VIEW */}
        {currentUser && (
          <div className="space-y-5">
            <div className="bg-brand-cream/45 border border-brand-gold/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  className="h-14 w-14 rounded-full ring-2 ring-brand-gold/20 border-2 border-white object-cover"
                  alt=""
                />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{currentUser.name}</h3>
                    <span className="bg-brand-navy text-white text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {currentUser.id}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full md:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span>{loading ? 'Signing out...' : 'Sign Out Session'}</span>
              </button>
            </div>

            {/* Profile compliance parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">FICA Compliance Status</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className={`h-2 w-2 rounded-full ${currentUser.kycStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`font-bold capitalize font-mono ${currentUser.kycStatus === 'verified' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {currentUser.kycStatus || 'pending'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mt-1">
                  Compliance and deeds processing requires identity verification and POPIA declarations to be complete.
                </p>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Consent Regulations</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold text-slate-700">POPIA & GDPR Accepted</span>
                </div>
                {currentUser.consentDate && (
                  <p className="text-[10px] text-slate-400 font-mono">Date Accepted: {new Date(currentUser.consentDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOGGED OUT FORM */}
        {!currentUser && (
          <div className="space-y-6">
            {/* Tab selection bar */}
            <div className="flex border-b border-slate-150">
              <button
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'login'
                    ? 'border-brand-gold text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <LogIn className="h-3.5 w-3.5 inline mr-1.5 align-middle" />
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'signup'
                    ? 'border-brand-gold text-brand-navy'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 inline mr-1.5 align-middle" />
                Sign Up
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">EMAIL ADDRESS</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. john.buyer@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-gold/45 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">ACCOUNT PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter security password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-gold/45 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-bold text-xs py-3 rounded-xl border border-slate-800 shadow-md shadow-brand-navy/5 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-gold" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 text-brand-gold" />
                      <span>Authorize conveyancing Session</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="John Buyer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-gold/45"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="john.buyer@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-gold/45"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-gold/45"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Role Segment</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-gold/45"
                      >
                        <option value="buyer">Buyer Client</option>
                        <option value="seller">Seller Client</option>
                        <option value="other">Other / Pending Staff Allocation</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Staff allocation security policy notice */}
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 space-y-1 font-sans shadow-sm">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Staff Role Allocation Policy</span>
                  </div>
                  <p className="text-[10.5px] text-amber-800/90 leading-relaxed">
                    Staff roles (Attorney, Conveyancer, Paralegal, Administrator) cannot be self-assigned upon registration. If you are firm staff, please register as <strong>Other / Pending Staff Allocation</strong>. A System Administrator will review your profile and allocate your official staff role.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="+27 82 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">ID / Passport Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="8907125012083"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">Residential Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 14 Blue Crane Estate, Midrand, Johannesburg"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl border border-slate-800 shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer animate-duration-200"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-gold" />
                      <span>Writing Cloud Profile...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 text-brand-gold" />
                      <span>Register Portal Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick-test accounts block */}
            <div className="border-t border-slate-150 pt-5 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Quick-Launch Tester Personas</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Click any persona to load preset credentials instantly for rapid security check validation. (Pass: <code className="font-mono bg-slate-100 text-brand-navy px-1 py-0.5 rounded">masina123</code>)
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleQuickLogin(u.email)}
                    className="text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-200/60 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-[11px] text-slate-700 block truncate">{u.name}</span>
                    <span className="text-[9px] text-brand-gold-dark font-mono font-bold block uppercase mt-0.5 truncate">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
