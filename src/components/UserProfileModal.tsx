import React from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Trash2, Upload, CheckCircle, Shield, Sparkles, Camera, Bell, Crown, AlertTriangle, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface UserProfileModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: Partial<UserType>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSubscribe: (plan: 'free' | 'pro' | 'enterprise', newsletter: boolean) => Promise<void>;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onDeleteUser,
  onSubscribe,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'subscription' | 'danger'>('profile');

  // Profile form state
  const [name, setName] = React.useState(user.name || '');
  const [email, setEmail] = React.useState(user.email || '');
  const [phone, setPhone] = React.useState(user.phone || '');
  const [idNumber, setIdNumber] = React.useState(user.idNumber || '');
  const [address, setAddress] = React.useState(user.address || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || '');

  // Subscription form state
  const [selectedPlan, setSelectedPlan] = React.useState<'free' | 'pro' | 'enterprise'>(user.subscriptionPlan || 'free');
  const [subscribedToNewsletter, setSubscribedToNewsletter] = React.useState(user.subscribedToNewsletter ?? true);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingPic, setIsUploadingPic] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setIdNumber(user.idNumber || '');
      setAddress(user.address || '');
      setAvatarUrl(user.avatarUrl || '');
      setSelectedPlan(user.subscriptionPlan || 'free');
      setSubscribedToNewsletter(user.subscribedToNewsletter ?? true);
    }
  }, [user]);

  if (!isOpen) return null;

  // Preset avatar choices
  const presetAvatars = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  ];

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPic(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          if (evt.target?.result) {
            const base64Data = evt.target.result as string;

            // Upload directly to Supabase Storage file bucket
            const res = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileData: base64Data,
                bucketName: 'avatars',
                folder: 'profile-pictures'
              })
            });

            const data = await res.json();
            if (data.url) {
              setAvatarUrl(data.url);
              if (data.isFallback) {
                setSuccessMessage('Photo processed and updated!');
              } else {
                setSuccessMessage(`Saved in Supabase Storage bucket ('${data.bucket}')!`);
              }
              setTimeout(() => setSuccessMessage(''), 4000);
            }
            setIsUploadingPic(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error("Profile picture upload error:", err);
        setErrorMessage("Failed to upload image file.");
        setIsUploadingPic(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await onUpdateUser({
        name,
        email,
        phone,
        idNumber,
        address,
        avatarUrl,
      });
      setSuccessMessage('Profile and picture updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSubscription = async () => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await onSubscribe(selectedPlan, subscribedToNewsletter);
      setSuccessMessage(`Subscribed to ${selectedPlan.toUpperCase()} plan!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteUser(user.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between border-b border-brand-gold/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                className="h-12 w-12 rounded-full ring-2 ring-brand-gold border border-white object-cover"
                alt="Avatar"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-brand-gold text-slate-950 p-1 rounded-full shadow hover:scale-110 transition-transform cursor-pointer"
                title="Change Picture"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white leading-tight">{user.name}</h2>
              <p className="text-xs text-brand-gold/90 font-mono flex items-center space-x-1">
                <Shield className="h-3 w-3 inline" />
                <span className="uppercase">{user.role} Account</span>
                <span className="text-slate-400">• ID: {user.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'border-brand-gold text-brand-navy bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Picture</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'subscription'
                ? 'border-brand-gold text-brand-navy bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>Subscription & Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'danger'
                ? 'border-rose-500 text-rose-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account</span>
          </button>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: PROFILE & PICTURE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Picture Upload Zone */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Profile Picture & Avatar
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>SUPABASE BUCKET: ACTIVE</span>
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <img
                      src={avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      className="h-16 w-16 rounded-full border-2 border-brand-gold object-cover shadow-sm shrink-0"
                      alt="Current Avatar"
                    />
                    {isUploadingPic && (
                      <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-gold border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <button
                      type="button"
                      disabled={isUploadingPic}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 bg-brand-navy hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-brand-gold" />
                      <span>{isUploadingPic ? 'Uploading to Supabase Storage...' : 'Upload Custom Photo'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500">
                      Photos are stored in the <strong className="font-mono text-slate-700">avatars</strong> Supabase Storage bucket. Replaces current avatar.
                    </p>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Or Select Preset Avatar:</span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {presetAvatars.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`p-0.5 rounded-full border-2 transition-all ${
                          avatarUrl === url ? 'border-brand-gold scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} className="h-8 w-8 rounded-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 82 000 0000"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SA ID / Passport Number</label>
                  <div className="relative">
                    <Shield className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="e.g. 8907125012083"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
                <div className="relative">
                  <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 14 Blue Crane Estate, Midrand, South Africa"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg shadow transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4 text-slate-950" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SUBSCRIPTION & SITE MEMBERSHIP */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 font-serif">Select Membership Subscription Tier</h3>
                <p className="text-xs text-slate-500">Subscribe to access advanced conveyancing tracking, instant deeds notifications, and staff collaboration tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* FREE TIER */}
                <div
                  onClick={() => setSelectedPlan('free')}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'free'
                      ? 'border-brand-gold bg-brand-gold/5 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase">Free Client</span>
                      {selectedPlan === 'free' && <Check className="h-4 w-4 text-brand-gold-dark" />}
                    </div>
                    <div className="text-xl font-serif font-bold text-slate-900">R0 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Basic stage tracker</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>FICA Upload Portal</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Email stage updates</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CONVEYANCING PRO TIER */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between relative ${
                    selectedPlan === 'pro'
                      ? 'border-brand-navy bg-slate-900 text-white shadow-xl'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-slate-950 font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow">
                    Most Popular
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase ${selectedPlan === 'pro' ? 'text-brand-gold' : 'text-slate-700'}`}>
                        Conveyancing Pro
                      </span>
                      {selectedPlan === 'pro' && <Check className="h-4 w-4 text-brand-gold" />}
                    </div>
                    <div className={`text-xl font-serif font-bold ${selectedPlan === 'pro' ? 'text-white' : 'text-slate-900'}`}>
                      R299 <span className={`text-xs font-normal ${selectedPlan === 'pro' ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
                    </div>
                    <ul className={`text-[11px] space-y-1.5 pt-2 border-t ${selectedPlan === 'pro' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-brand-gold shrink-0" />
                        <span>Real-time SMS & Push alerts</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-brand-gold shrink-0" />
                        <span>Direct Attorney Chat Channel</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-brand-gold shrink-0" />
                        <span>Instant Deeds lodgement sync</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* ENTERPRISE FIRM TIER */}
                <div
                  onClick={() => setSelectedPlan('enterprise')}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'enterprise'
                      ? 'border-brand-gold bg-brand-gold/5 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase">Enterprise Firm</span>
                      {selectedPlan === 'enterprise' && <Check className="h-4 w-4 text-brand-gold-dark" />}
                    </div>
                    <div className="text-xl font-serif font-bold text-slate-900">R999 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Multi-user firm admin dashboard</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Automated SARS & Rates workflow</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Dedicated Conveyance Specialist</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Newsletter & Notification Preferences */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-brand-navy" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Site Conveyancing Updates & Newsletter</h4>
                      <p className="text-[10px] text-slate-500">Receive regulatory updates, property law insights, and matter progress alerts.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subscribedToNewsletter}
                      onChange={(e) => setSubscribedToNewsletter(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-navy"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSubscription}
                  disabled={isSubmitting}
                  className="bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Crown className="h-4 w-4 text-brand-gold" />
                  <span>{isSubmitting ? 'Updating...' : `Confirm & Subscribe (${selectedPlan.toUpperCase()})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DELETE ACCOUNT */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-rose-900 font-serif">Permanently Delete User Account</h3>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      Warning: Deleting your account will permanently purge your user profile, registered credentials, and access permissions from both the local database and Supabase.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 cursor-pointer mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Request Account Deletion</span>
                  </button>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-rose-300 space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-slate-800">
                      Are you completely sure you want to delete <span className="text-rose-600">{user.name}</span> ({user.email})?
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isSubmitting}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {isSubmitting ? 'Deleting...' : 'Yes, Permanently Delete My Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
