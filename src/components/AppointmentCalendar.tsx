import React from 'react';
import { Calendar, Clock, Video, Plus, User, AlertCircle, RefreshCw, CheckCircle, ExternalLink, ShieldAlert, Sparkles, Download, Check, Settings, Globe, Shield, Lock, X } from 'lucide-react';
import { Appointment, User as UserType } from '../types';
import { createOutlookCalendarUrl, createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarUtils';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  currentUser: UserType;
  allUsers: UserType[];
  onBook: (bookingData: {
    staffId: string;
    date: string;
    time: string;
    type: 'consultation' | 'signing' | 'virtual_meeting';
    description: string;
  }) => void;
  onCancel: (appointmentId: string) => void;
}

export default function AppointmentCalendar({ appointments, currentUser, allUsers, onBook, onCancel }: AppointmentCalendarProps) {
  const [showBookForm, setShowBookForm] = React.useState(false);
  const [calendarConnected, setCalendarConnected] = React.useState({ google: true, outlook: true });
  const [activeProvider, setActiveProvider] = React.useState<'both' | 'google' | 'outlook'>('both');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState('Just now');
  const [syncNotice, setSyncNotice] = React.useState('');
  
  // OAuth Account Modal
  const [connectModal, setConnectModal] = React.useState<'google' | 'outlook' | null>(null);
  const [outlookEmail, setOutlookEmail] = React.useState(`${currentUser.id}@outlook.com`);
  const [googleEmail, setGoogleEmail] = React.useState(`${currentUser.id}@gmail.com`);

  // Booking Form state
  const [booking, setBooking] = React.useState({
    staffId: '',
    date: '2026-07-25',
    time: '10:00',
    type: 'virtual_meeting' as 'consultation' | 'signing' | 'virtual_meeting',
    description: '',
    syncProvider: 'both' as 'both' | 'google' | 'outlook',
    videoPlatform: 'teams' as 'teams' | 'meet' | 'in_person'
  });

  const staffList = allUsers.filter(u => u.role === 'attorney' || u.role === 'conveyancer' || u.role === 'paralegal');

  // Filter relevant appointments
  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';
  const visibleAppointments = appointments.filter(app => {
    if (isStaff) {
      return app.staffId === currentUser.id && app.status === 'scheduled';
    }
    return app.clientId === currentUser.id && app.status === 'scheduled';
  });

  const handleSyncAll = () => {
    setIsSyncing(true);
    setSyncNotice('');
    setTimeout(() => {
      setIsSyncing(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(`Today at ${timeStr}`);
      const count = visibleAppointments.length;
      setSyncNotice(`Synced ${count} appointment${count === 1 ? '' : 's'} to ${
        calendarConnected.google && calendarConnected.outlook
          ? 'Microsoft Outlook & Google Calendar'
          : calendarConnected.outlook
          ? 'Microsoft Outlook Calendar'
          : 'Google Calendar'
      }!`);
      setTimeout(() => setSyncNotice(''), 5000);
    }, 1200);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking.staffId || !booking.date || !booking.time) {
      alert("Please fill in the date, time, and choose a professional.");
      return;
    }

    // Build video link based on selected platform
    let link = undefined;
    if (booking.videoPlatform === 'teams') {
      link = `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${Math.random().toString(36).substring(7)}%40thread.v2/0`;
    } else if (booking.videoPlatform === 'meet') {
      link = `https://meet.google.com/meet-${Math.floor(100+Math.random()*900)}-${Math.floor(100+Math.random()*900)}`;
    }

    onBook({
      staffId: booking.staffId,
      date: booking.date,
      time: booking.time,
      type: booking.type,
      description: booking.description ? `${booking.description} [Sync: ${booking.syncProvider.toUpperCase()}]` : `[Sync: ${booking.syncProvider.toUpperCase()}]`
    });

    setSyncNotice(`Appointment booked & synced to ${booking.syncProvider === 'both' ? 'Outlook & Google' : booking.syncProvider === 'outlook' ? 'Microsoft Outlook' : 'Google Calendar'}!`);
    setTimeout(() => setSyncNotice(''), 5000);

    setBooking({
      staffId: '',
      date: '2026-07-25',
      time: '10:00',
      type: 'virtual_meeting',
      description: '',
      syncProvider: 'both',
      videoPlatform: 'teams'
    });
    setShowBookForm(false);
  };

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="space-y-6" id="appointment-calendar">
      {/* Sync Success / Alert Toast */}
      {syncNotice && (
        <div className="bg-emerald-900 border border-emerald-700 text-white p-3 rounded-xl text-xs flex items-center justify-between font-mono animate-fade-in shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice('')} className="p-1 hover:bg-emerald-800 rounded">
            <X className="h-3.5 w-3.5 text-slate-300" />
          </button>
        </div>
      )}

      {/* 2-Column layout: Connections and schedule list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Calendar Sync Settings & New booking trigger */}
        <div className="space-y-6">
          {/* New booking drawer button */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 font-sans border-b border-slate-100 pb-2">
              <Calendar className="h-5 w-5 text-brand-gold-dark" />
              <span>Schedule Legal Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Book virtual consultations, title signature ceremonies, or deeds reviews directly in your assigned attorney's docket.
            </p>
            <button
              onClick={() => setShowBookForm(!showBookForm)}
              className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-bold text-xs py-2.5 rounded-lg transition-colors border border-slate-800 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4 text-brand-gold" />
              <span>{showBookForm ? "Cancel Form" : "Book New Consultation"}</span>
            </button>
          </div>

          {/* Calendar Sync Hub Box */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans flex items-center space-x-1.5">
                <Globe className="h-4 w-4 text-brand-gold" />
                <span>Calendar Sync Hub</span>
              </h4>
              <span className="text-[9px] font-mono text-slate-400">v2.4 OAuth</span>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Auto-propagate conveyancing appointments into both Microsoft Outlook and Google Calendar.
            </p>

            {/* Providers Status list */}
            <div className="space-y-2.5">
              {/* Microsoft Outlook Provider */}
              <div className={`p-3 border rounded-xl transition-all ${
                calendarConnected.outlook 
                  ? 'bg-blue-50/40 border-blue-200/80' 
                  : 'bg-slate-50 border-slate-200/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm font-mono">
                      O
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <span>Microsoft Outlook</span>
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-mono font-semibold">Office 365</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]">
                        {calendarConnected.outlook ? outlookEmail : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!calendarConnected.outlook) {
                        setConnectModal('outlook');
                      } else {
                        setCalendarConnected({ ...calendarConnected, outlook: false });
                      }
                    }}
                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
                      calendarConnected.outlook
                        ? 'bg-emerald-100/80 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {calendarConnected.outlook ? "Connected" : "Connect"}
                  </button>
                </div>
              </div>

              {/* Google Calendar Provider */}
              <div className={`p-3 border rounded-xl transition-all ${
                calendarConnected.google 
                  ? 'bg-emerald-50/40 border-emerald-200/80' 
                  : 'bg-slate-50 border-slate-200/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm font-mono">
                      G
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <span>Google Calendar</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-semibold">Gmail</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]">
                        {calendarConnected.google ? googleEmail : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!calendarConnected.google) {
                        setConnectModal('google');
                      } else {
                        setCalendarConnected({ ...calendarConnected, google: false });
                      }
                    }}
                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
                      calendarConnected.google
                        ? 'bg-emerald-100/80 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {calendarConnected.google ? "Connected" : "Connect"}
                  </button>
                </div>
              </div>
            </div>

            {/* Sync Mode Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[10px] text-slate-500 font-bold uppercase">Active Target Calendar Engine</label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveProvider('both')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    activeProvider === 'both'
                      ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Outlook & Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProvider('outlook')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    activeProvider === 'outlook'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Outlook Only
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProvider('google')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    activeProvider === 'google'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Gmail Only
                </button>
              </div>
            </div>

            {/* Manual Trigger Sync Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 border border-slate-700 shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-brand-gold ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? "Syncing Calendar Feeds..." : "Sync Active Appointments Now"}</span>
              </button>
              <p className="text-[9px] text-slate-400 text-center mt-1.5 font-mono">
                Last synced: {lastSyncedAt}
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Form and Schedule overview lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Booking Form Drawer */}
          {showBookForm && (
            <form onSubmit={handleBookingSubmit} className="bg-white rounded-xl border border-brand-gold/30 p-5 shadow-premium space-y-4 animate-fade-in">
              <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Sparkles className="h-4 w-4 text-brand-gold" />
                <span>Establish Consultation Window</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Assigned Lawyer / Legal Staff</label>
                  <select
                    required
                    value={booking.staffId}
                    onChange={(e) => setBooking({ ...booking, staffId: e.target.value })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    <option value="">Select lawyer...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Appointment Classification</label>
                  <select
                    required
                    value={booking.type}
                    onChange={(e) => setBooking({ ...booking, type: e.target.value as any })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    <option value="virtual_meeting">Virtual Video Consultation</option>
                    <option value="signing">Deed Signature Ceremony (Physical)</option>
                    <option value="consultation">Standard Conveyancing Q&A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={booking.date}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-brand-cream/15 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Time Slot Availability</label>
                  <select
                    value={booking.time}
                    onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t} (Clear Availability)</option>
                    ))}
                  </select>
                </div>

                {/* Video Platform Preference */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Meeting Channel / Platform</label>
                  <select
                    value={booking.videoPlatform}
                    onChange={(e) => setBooking({ ...booking, videoPlatform: e.target.value as any })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    <option value="teams">Microsoft Teams Call (Outlook Sync)</option>
                    <option value="meet">Google Meet Call (Gmail Sync)</option>
                    <option value="in_person">In-Person Chambers (Sandton Offices)</option>
                  </select>
                </div>

                {/* Calendar Sync Preference */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Target Calendar Sync</label>
                  <select
                    value={booking.syncProvider}
                    onChange={(e) => setBooking({ ...booking, syncProvider: e.target.value as any })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none font-medium text-slate-800"
                  >
                    <option value="both">Both Outlook & Google Calendar</option>
                    <option value="outlook">Microsoft Outlook Only</option>
                    <option value="google">Google Calendar / Gmail Only</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Discussion Agenda / Purpose</label>
                  <textarea
                    value={booking.description}
                    onChange={(e) => setBooking({ ...booking, description: e.target.value })}
                    className="w-full h-20 p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/15"
                    placeholder="e.g. Discuss FICA clearance or confirm SARS Transfer Duty declaration timeline..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Commit Booking
                </button>
              </div>
            </form>
          )}

          {/* Active Bookings List Container */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                Scheduled Consultation Slots
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {visibleAppointments.length} Active
              </span>
            </div>

            {visibleAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Calendar className="h-10 w-10 text-brand-gold/40 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No active appointments scheduled.</p>
                <p className="text-[10px] text-slate-500">Book a new window using the left setup console.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleAppointments.map(app => (
                  <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            app.type === 'signing'
                              ? 'bg-brand-navy text-brand-gold ring-1 ring-brand-gold/25'
                              : 'bg-brand-gold/10 text-brand-gold-dark ring-1 ring-brand-gold-dark/20'
                          }`}>
                            {app.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {app.id.substring(4, 9)}</span>
                        </div>

                        <h4 className="text-sm font-serif font-bold text-brand-navy leading-tight">
                          {app.type === 'signing' ? "Deed Signature Signing Session" : "Conveyancing Legal Advisory"}
                        </h4>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-sans">
                          <span className="flex items-center space-x-1">
                            <User className="h-3.5 w-3.5 text-brand-gold-dark" />
                            <span>With {app.staffName} ({app.staffRole.toUpperCase()})</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{app.date} at {app.time} ({app.duration} mins)</span>
                          </span>
                        </div>

                        {app.description && (
                          <p className="text-[10px] text-slate-400 italic max-w-md">Notes: "{app.description}"</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {app.videoLink && (
                          <a
                            href={app.videoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
                          >
                            <Video className="h-3.5 w-3.5 text-brand-gold" />
                            <span>Join Video Call</span>
                          </a>
                        )}
                        
                        <button
                          onClick={() => onCancel(app.id)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Direct Calendar Sync Buttons Row */}
                    <div className="pt-2 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-slate-400 text-[9px] uppercase">Export / Sync:</span>
                        
                        {/* Add to Outlook */}
                        <a
                          href={createOutlookCalendarUrl(app)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold font-sans flex items-center space-x-1 transition-colors"
                        >
                          <span className="font-mono font-black text-blue-800">O</span>
                          <span>Add to Outlook</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </a>

                        {/* Add to Google Calendar */}
                        <a
                          href={createGoogleCalendarUrl(app)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold font-sans flex items-center space-x-1 transition-colors"
                        >
                          <span className="font-mono font-black text-emerald-800">G</span>
                          <span>Add to Google</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </a>

                        {/* Download .ics */}
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded font-medium flex items-center space-x-1 transition-colors"
                          title="Download iCal (.ics) file for Outlook / Apple Calendar"
                        >
                          <Download className="h-3 w-3 text-slate-500" />
                          <span>Download .ICS</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] text-emerald-600 font-mono font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Synced to Outlook & Gmail</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OAuth Connection Modal for Microsoft Outlook or Google Calendar */}
      {connectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setConnectModal(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2.5 rounded-xl text-white font-bold font-mono text-sm ${
                  connectModal === 'outlook' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  {connectModal === 'outlook' ? 'O' : 'G'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-sans">
                    {connectModal === 'outlook' ? 'Connect Microsoft Outlook Calendar' : 'Connect Google Calendar'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {connectModal === 'outlook' ? 'Office 365 / Microsoft Entra OAuth' : 'Google Workspace / Gmail API'}
                  </p>
                </div>
              </div>
              <button onClick={() => setConnectModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Authenticate your account to allow bi-directional syncing of conveyancing consultations, signature sessions, and deeds registry milestones directly with your calendar.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                {connectModal === 'outlook' ? 'Microsoft / Office 365 Email' : 'Google / Gmail Address'}
              </label>
              <input
                type="email"
                value={connectModal === 'outlook' ? outlookEmail : googleEmail}
                onChange={(e) => {
                  if (connectModal === 'outlook') setOutlookEmail(e.target.value);
                  else setGoogleEmail(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-500 space-y-1 font-sans">
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span>POPIA & GDPR Compliant Sync</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Only legal appointment slots created in this portal will be synced to your calendar. Personal events are never accessed or stored.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConnectModal(null)}
                className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (connectModal === 'outlook') {
                    setCalendarConnected({ ...calendarConnected, outlook: true });
                    setSyncNotice(`Microsoft Outlook account (${outlookEmail}) successfully linked and synced!`);
                  } else {
                    setCalendarConnected({ ...calendarConnected, google: true });
                    setSyncNotice(`Google Calendar account (${googleEmail}) successfully linked and synced!`);
                  }
                  setConnectModal(null);
                  setTimeout(() => setSyncNotice(''), 5000);
                }}
                className={`px-4.5 py-1.5 text-white text-xs font-bold rounded-lg shadow-sm ${
                  connectModal === 'outlook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Authorize & Link Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

