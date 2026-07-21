import React from 'react';
import { Calendar, Clock, Video, Plus, User, AlertCircle, RefreshCw, CheckCircle, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { Appointment, User as UserType } from '../types';

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
  const [calendarConnected, setCalendarConnected] = React.useState({ google: true, outlook: false });
  
  // Booking Form state
  const [booking, setBooking] = React.useState({
    staffId: '',
    date: '2026-07-25',
    time: '10:00',
    type: 'virtual_meeting' as 'consultation' | 'signing' | 'virtual_meeting',
    description: ''
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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking.staffId || !booking.date || !booking.time) {
      alert("Please fill in the date, time, and choose a professional.");
      return;
    }
    onBook(booking);
    setBooking({
      staffId: '',
      date: '2026-07-25',
      time: '10:00',
      type: 'virtual_meeting',
      description: ''
    });
    setShowBookForm(false);
  };

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="space-y-6" id="appointment-calendar">
      {/* 2-Column layout: Connections and schedule list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Calendar Sync Settings & New booking trigger */}
        <div className="space-y-6">
          {/* New booking drawer */}
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

          {/* Third Party Integrations Box */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans border-b border-slate-100 pb-2">Calendar Sync Hub</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Auto-propagate booked slots into your personal schedules. Secure OAuth sync clears schedule parameters dynamically.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-brand-cream/15 border border-slate-200/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-white border border-brand-gold/25 flex items-center justify-center font-bold text-brand-navy text-xs shadow-inner font-mono">G</div>
                  <span className="text-xs font-bold text-slate-700 font-sans">Google Calendar</span>
                </div>
                <button
                  onClick={() => setCalendarConnected({ ...calendarConnected, google: !calendarConnected.google })}
                  className={`text-[9px] font-bold px-2.5 py-1.5 rounded transition-all uppercase tracking-wider ${
                    calendarConnected.google
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                  }`}
                >
                  {calendarConnected.google ? "Connected" : "Sync Now"}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-brand-cream/15 border border-slate-200/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-white border border-brand-gold/25 flex items-center justify-center font-bold text-brand-navy text-xs shadow-inner font-mono">O</div>
                  <span className="text-xs font-bold text-slate-700 font-sans">Microsoft Outlook</span>
                </div>
                <button
                  onClick={() => setCalendarConnected({ ...calendarConnected, outlook: !calendarConnected.outlook })}
                  className={`text-[9px] font-bold px-2.5 py-1.5 rounded transition-all uppercase tracking-wider ${
                    calendarConnected.outlook
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                  }`}
                >
                  {calendarConnected.outlook ? "Connected" : "Sync Now"}
                </button>
              </div>
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
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    <option value="">Select lawyer...</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Appointment Classification</label>
                  <select
                    required
                    value={booking.type}
                    onChange={(e) => setBooking({ ...booking, type: e.target.value as any })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-brand-cream/15 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Time Slot Availability</label>
                  <select
                    value={booking.time}
                    onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                    className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t} (Clear Availability)</option>
                    ))}
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
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white text-xs font-bold rounded shadow-sm"
                >
                  Commit Booking
                </button>
              </div>
            </form>
          )}

          {/* Active Bookings List Container */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans border-b border-slate-100 pb-2">Scheduled Consultation Slots</h3>

            {visibleAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Calendar className="h-10 w-10 text-brand-gold/40 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No active appointments scheduled.</p>
                <p className="text-[10px] text-slate-500">Book a new window using the left setup console.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleAppointments.map(app => (
                  <div key={app.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
                    <div className="space-y-1.5">
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
                          <span>Join Video Meet</span>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
