import React from 'react';
import { 
  Building2, FileText, ClipboardList, MessageSquare, Calendar, Shield, LayoutDashboard, 
  Users, CheckSquare, Settings, Scale, AlertCircle, PlayCircle, PlusCircle, ArrowRight, BookOpen, Clock,
  Lock, Database
} from 'lucide-react';

import { User, PropertyMatter, Document, Task, Conversation, Message, Appointment, AuditLog, AutomationRule, AutomationLog } from './types';
import Navbar from './components/Navbar';
import OnboardingWizard from './components/OnboardingWizard';
import DocumentManager from './components/DocumentManager';
import StageTracker from './components/StageTracker';
import TaskCenter from './components/TaskCenter';
import MessagingHub from './components/MessagingHub';
import AppointmentCalendar from './components/AppointmentCalendar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminPanel from './components/AdminPanel';
import SupabaseAuthCenter from './components/SupabaseAuthCenter';
import MasinaLogo from './components/MasinaLogo';

export default function App() {
  // Session context states
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [selectedMatterId, setSelectedMatterId] = React.useState<string>('mat-1');
  const [allUsers, setAllUsers] = React.useState<User[]>([]);

  // Navigation tab controls (depends on Client vs Staff role)
  const [activeTab, setActiveTab] = React.useState<string>('dashboard');

  // Backend state synchronized collections
  const [matters, setMatters] = React.useState<PropertyMatter[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [automationRules, setAutomationRules] = React.useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = React.useState<AutomationLog[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  const [loading, setLoading] = React.useState(true);

  // Load and refresh state from Full-stack API
  const refreshAllContexts = async (userIdToAuth?: string) => {
    try {
      // 1. Fetch Users List
      // To get the starter users list, we can load matters or construct local users as we initialize, 
      // but let's query our login/auth configurations. Since we don't have a separate /users endpoint, 
      // we can do a mock loading or fetch. Wait, our server has initial users!
      // Let's create an authentication simulation that fetches matters, tasks, appointments and logs first.
      
      const mattersRes = await fetch('/api/matters');
      const mattersData = await mattersRes.json();
      setMatters(mattersData);

      const docsRes = await fetch('/api/documents');
      const docsData = await docsRes.json();
      setDocuments(docsData);

      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      const appointmentsRes = await fetch('/api/appointments');
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData);

      const convsRes = await fetch('/api/conversations');
      const convsData = await convsRes.json();
      setConversations(convsData);

      const rulesRes = await fetch('/api/automation/rules');
      // If endpoint doesn't exist, use fallbacks gracefully
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setAutomationRules(rulesData);
      } else {
        // Fallback placeholder rules
        setAutomationRules([
          { id: 'rule-1', name: 'Welcome Onboarding Notification', trigger: 'matter_opened', actionType: 'email', template: 'Dear {{client_name}}, welcome...', enabled: true },
          { id: 'rule-2', name: 'Stage Completed Alert', trigger: 'stage_completed', actionType: 'push', template: 'Great news...', enabled: true }
        ]);
      }

      const autoLogsRes = await fetch('/api/automation/logs');
      const autoLogsData = await autoLogsRes.json();
      setAutomationLogs(autoLogsData);

      const auditRes = await fetch('/api/audit/logs');
      const auditData = await auditRes.json();
      setAuditLogs(auditData);

      // Initialize the default user profile context on startup
      const targetUserId = userIdToAuth || 'usr-client-1'; // Default: John Buyer
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
      const loginData = await loginRes.json();
      setCurrentUser(loginData.user);

      // Re-populate all available mock-auth accounts
      // Arthur, John, Sarah, Clara, Pamela, Alice
      setAllUsers([
        { id: 'usr-client-1', name: 'John Buyer', email: 'john.buyer@gmail.com', role: 'buyer', kycStatus: 'pending', idNumber: '8907125012083', address: '14 Blue Crane Estate, Midrand', consentAccepted: true },
        { id: 'usr-client-2', name: 'Sarah Seller', email: 'sarah.seller@yahoo.com', role: 'seller', kycStatus: 'verified', idNumber: '7504020084089', address: '124 Villa Rosa, Sandton', consentAccepted: true },
        { id: 'usr-attorney-1', name: 'Arthur Masina', email: 'arthur@masinalaw.co.za', role: 'attorney', kycStatus: 'verified', consentAccepted: true },
        { id: 'usr-convey-1', name: 'Clara Convey', email: 'clara@masinalaw.co.za', role: 'conveyancer', kycStatus: 'verified', consentAccepted: true },
        { id: 'usr-paralegal-1', name: 'Pamela Paralegal', email: 'pamela@masinalaw.co.za', role: 'paralegal', kycStatus: 'verified', consentAccepted: true },
        { id: 'usr-admin-1', name: 'Admin Alice', email: 'alice@masinalaw.co.za', role: 'admin', kycStatus: 'verified', consentAccepted: true }
      ]);

      // Pull message thread for current active conversation
      const msgRes = await fetch('/api/conversations/conv-1/messages');
      const msgData = await msgRes.json();
      setMessages(msgData);

    } catch (err) {
      console.error("API Fetch Error, using simulated framework:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshAllContexts();
  }, []);

  // Triggered when switching role persona in Navbar dropdown
  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    await refreshAllContexts(userId);
    // Auto reset tab depending on role scope
    if (userId.startsWith('usr-client')) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard'); // Attorneys see analytics/workload first
    }
  };

  const handleUpdateUserKyc = async (updatedUser: User) => {
    try {
      const res = await fetch('/api/auth/kyc-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedUser.id,
          idNumber: updatedUser.idNumber,
          address: updatedUser.address,
          phone: updatedUser.phone
        })
      });
      const data = await res.json();
      setCurrentUser(data.user);
      await refreshAllContexts(updatedUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMatter = async (matterData: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matterData)
      });
      const data = await res.json();
      setSelectedMatterId(data.id);
      await refreshAllContexts(currentUser?.id);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (docData: { name: string; category: string }) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docData,
          matterId: selectedMatterId,
          uploadedBy: currentUser?.name || 'Client'
        })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewDocument = async (docId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await fetch(`/api/documents/${docId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewerNotes: notes,
          staffId: currentUser?.id
        })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (matterId: string, currentStage: number, lawyerNotes?: string, tasks?: any[]) => {
    try {
      await fetch(`/api/matters/${matterId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage, lawyerNotes, tasks })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, matterId: selectedMatterId })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (text: string, fileAttachment?: any) => {
    try {
      await fetch('/api/conversations/conv-1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id,
          text,
          fileAttachment
        })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async (bookingData: any) => {
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingData, clientId: currentUser?.id })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAppointment = async (appId: string) => {
    try {
      await fetch(`/api/appointments/${appId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeamMember = async (userData: any) => {
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateRole = async (userId: string, newRole: string) => {
    try {
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        await refreshAllContexts(currentUser?.id);
      } else {
        // Fallback to optimistic local toggle if server fails
        setAutomationRules(rules => 
          rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
        );
      }
    } catch (err) {
      console.error(err);
      setAutomationRules(rules => 
        rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 text-emerald-400 font-mono">
        <div className="h-12 w-12 rounded-full border-4 border-brand-gold border-t-transparent animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-wide">MASINA DEEDS REGISTRY CORE LOADING...</p>
        <p className="text-[10px] text-slate-400 mt-1">Establishing SECURE OAUTH2 & FICA Verification instances</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex flex-col items-center justify-center text-center mb-4">
            <MasinaLogo size="lg" />
          </div>
          <SupabaseAuthCenter 
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              refreshAllContexts(user.id);
            }}
            onLogoutSuccess={() => {
              setCurrentUser(null);
            }}
            allUsers={allUsers}
          />
        </div>
      </div>
    );
  }

  // Active Matter variables
  const activeMatter = matters.find(m => m.id === selectedMatterId) || matters[0];
  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';

  // Sidebar navigation options depending on role
  const navigationItems = isStaff ? [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'matters', label: 'Property Matters', icon: Building2 },
    { id: 'documents', label: 'Deeds Documents', icon: FileText },
    { id: 'tasks', label: 'Action Tasks', icon: ClipboardList },
    { id: 'messages', label: 'Secure Message', icon: MessageSquare },
    { id: 'appointments', label: 'Consultation Calendar', icon: Calendar },
    { id: 'supabase-auth', label: 'Identity & Supabase Auth', icon: Lock },
    { id: 'admin', label: 'System Admin Panel', icon: Shield }
  ] : [
    { id: 'dashboard', label: 'Active Matter Tracker', icon: Building2 },
    { id: 'onboarding', label: 'Digital Onboarding Wizard', icon: SparklesIcon },
    { id: 'documents', label: 'Secure Document Vault', icon: FileText },
    { id: 'tasks', label: 'My Action Tasks', icon: ClipboardList },
    { id: 'messages', label: 'Message Attorney', icon: MessageSquare },
    { id: 'appointments', label: 'Book Consultation', icon: Calendar },
    { id: 'supabase-auth', label: 'Identity & Supabase Auth', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-slate-800" id="main-app">
      {/* Navbar Global Brand Header */}
      <Navbar 
        currentUser={currentUser} 
        allUsers={allUsers} 
        onSwitchUser={handleSwitchUser} 
        onLogout={async () => {
          try {
            await fetch('/api/supabase/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser?.id })
            });
          } catch (e) {}
          setCurrentUser(null);
        }} 
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left Vertical Sidebar Section */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-premium space-y-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2">Navigation Deck</span>
            <div className="space-y-1">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                      isSelected
                        ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/10 border border-slate-800'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Matter Selection Indicator widget */}
          {activeMatter && (
            <div className="bg-brand-navy text-white rounded-xl p-4.5 shadow-premium border border-brand-gold/15 space-y-3.5">
              <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest block font-mono">Current Context Matter</span>
              
              <div className="space-y-1 border-l-2 border-brand-gold pl-2.5">
                <span className="text-xs font-mono font-bold text-brand-gold/90 block leading-tight">{activeMatter.matterNumber}</span>
                <span className="text-xs font-sans font-medium leading-normal block text-slate-200">{activeMatter.propertyAddress}</span>
              </div>

              {isStaff ? (
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Select Active Matter:</span>
                  <div className="space-y-1.5">
                    {matters.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMatterId(m.id)}
                        className={`w-full text-left p-2 rounded text-[10px] font-bold block truncate transition-colors ${
                          selectedMatterId === m.id
                            ? 'bg-brand-gold text-brand-navy shadow-sm'
                            : 'bg-brand-blue-slate/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {m.matterNumber} - {m.propertyAddress.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-3 flex justify-between items-center">
                  <span>Assigned Lawyer:</span>
                  <span className="font-bold text-brand-gold">{activeMatter.assignedAttorneyName.split(' ')[0]}</span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Main Core Visual Pane */}
        <main className="flex-1 min-w-0">
          
          {/* Supabase Security Hub View */}
          {activeTab === 'supabase-auth' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Supabase Security Hub</h2>
                <p className="text-xs text-slate-500 mt-1">Authenticate sessions, register compliant client profiles, and check synchronization pipelines.</p>
              </div>
              <SupabaseAuthCenter 
                currentUser={currentUser}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  refreshAllContexts(user.id);
                }}
                onLogoutSuccess={() => {
                  setCurrentUser(null);
                }}
                allUsers={allUsers}
              />
            </div>
          )}

          {/* STAFF VIEWS */}
          {isStaff && activeTab !== 'supabase-auth' && (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs text-[#5F7E44] font-bold uppercase tracking-wider block font-sans">MASINA LAW ADVISORY</span>
                      <h2 className="text-2xl font-serif font-bold tracking-wide text-brand-navy mt-1">Welcome back, {currentUser.name}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-sans">Track case completion, audit submissions, and manage SARS declarations seamlessly.</p>
                    </div>
                  </div>
                  <AnalyticsDashboard matters={matters} documents={documents} tasks={tasks} />
                </div>
              )}

              {activeTab === 'matters' && activeMatter && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Active Matter Timeline Administrator</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage stage progressions (Stage 1 to 8), review tasks checklists and advisor logs.</p>
                  </div>
                  <StageTracker 
                    matter={activeMatter} 
                    currentUser={currentUser} 
                    onUpdateStage={handleUpdateStage} 
                  />
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Incoming Validation Document Pool</h2>
                    <p className="text-xs text-slate-500 mt-1">Examine FICA identity certificates, rates clearances, and sales deeds. Approve or request re-uploads with feedback notes.</p>
                  </div>
                  <DocumentManager 
                    documents={documents} 
                    currentUser={currentUser} 
                    matterId={selectedMatterId}
                    onUpload={handleUploadDocument}
                    onReview={handleReviewDocument}
                  />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Action Tasks Board</h2>
                    <p className="text-xs text-slate-500 mt-1">Assign task instructions to clients or paralegals, check deadlines, and toggle compliance clear paths.</p>
                  </div>
                  <TaskCenter 
                    tasks={tasks} 
                    currentUser={currentUser} 
                    matterId={selectedMatterId}
                    allUsers={allUsers}
                    onCreateTask={handleCreateTask}
                    onCompleteTask={handleCompleteTask}
                  />
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Secure Dispatch Channels</h2>
                    <p className="text-xs text-slate-500 mt-1">Direct messaging portal with clients and co-counsel. Features biometric and secure transport dispatches.</p>
                  </div>
                  <MessagingHub 
                    conversations={conversations} 
                    messages={messages} 
                    currentUser={currentUser} 
                    selectedConversationId="conv-1"
                    onSendMessage={handleSendMessage}
                    onRefresh={() => refreshAllContexts(currentUser.id)}
                  />
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Consultation Calendar Docket</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage scheduled client consults, deeds signing schedules, or connect to secure virtual video conference links.</p>
                  </div>
                  <AppointmentCalendar 
                    appointments={appointments} 
                    currentUser={currentUser} 
                    allUsers={allUsers}
                    onBook={handleBookAppointment}
                    onCancel={handleCancelAppointment}
                  />
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">System Admin Control Room</h2>
                    <p className="text-xs text-slate-500 mt-1">View immutable audit trails, adjust automatic triggers, draft legal deeds with AI, and provision lawyer accounts.</p>
                  </div>
                  <AdminPanel 
                    currentUser={currentUser} 
                    allUsers={allUsers}
                    auditLogs={auditLogs}
                    automationRules={automationRules}
                    automationLogs={automationLogs}
                    onAddUser={handleAddTeamMember}
                    onToggleRule={handleToggleRule}
                    onAllocateRole={handleAllocateRole}
                  />
                </div>
              )}
            </>
          )}

          {/* CLIENT VIEWS */}
          {!isStaff && activeTab !== 'supabase-auth' && (
            <>
              {activeTab === 'dashboard' && activeMatter && (
                <div className="space-y-6">
                  {/* Client Greeting Dashboard Box */}
                  <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs text-brand-gold-dark font-bold uppercase tracking-wider block font-sans">Conveyancing Client Portal</span>
                      <h2 className="text-2xl font-serif font-bold tracking-wide text-brand-navy mt-1">Good day, {currentUser.name}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-sans">Monitor the live transfer of your property at <strong>{activeMatter.propertyAddress}</strong>.</p>
                    </div>
                    
                    {/* Expected Completion Card */}
                    <div className="bg-brand-navy text-white rounded-xl p-4 shadow-premium shrink-0 flex items-center space-x-3 text-xs border border-brand-gold/15 animate-pulse animate-duration-[4000ms]">
                      <Clock className="h-5 w-5 text-brand-gold shrink-0" />
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-sans">Est. Registration</span>
                        <span className="font-bold text-brand-gold font-sans">{activeMatter.expectedCompletionDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Progress Timelines */}
                  <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-premium space-y-4">
                    <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider font-sans border-b border-slate-100 pb-2">Property Registration Stage</h3>
                    <p className="text-xs text-slate-500 font-sans">Below is your live 8-stage visual conveyancing sequence. Hover or click stages in the Stepper to review required client checklists.</p>
                    <StageTracker 
                      matter={activeMatter} 
                      currentUser={currentUser} 
                      onUpdateStage={handleUpdateStage} 
                    />
                  </div>
                </div>
              )}

              {activeTab === 'onboarding' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Onboarding & Digital KYC Portal</h2>
                    <p className="text-xs text-slate-500 mt-1">Accept digital disclaimers, complete personal data forms, and scan identity tags with our automated compliance modules.</p>
                  </div>
                  <OnboardingWizard 
                    currentUser={currentUser} 
                    onUpdateUser={handleUpdateUserKyc} 
                    onOpenMatter={handleOpenMatter} 
                  />
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Secure Document Vault</h2>
                    <p className="text-xs text-slate-500 mt-1">Store, access, and upload required transfer assets. Verify compliance checklists on demand.</p>
                  </div>
                  <DocumentManager 
                    documents={documents} 
                    currentUser={currentUser} 
                    matterId={selectedMatterId}
                    onUpload={handleUploadDocument}
                    onReview={handleReviewDocument}
                  />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Outstanding Client Actions</h2>
                    <p className="text-xs text-slate-500 mt-1">Review urgent tasks assigned to you to facilitate municipal clearances or FICA KYC validations.</p>
                  </div>
                  <TaskCenter 
                    tasks={tasks} 
                    currentUser={currentUser} 
                    matterId={selectedMatterId}
                    allUsers={allUsers}
                    onCreateTask={handleCreateTask}
                    onCompleteTask={handleCompleteTask}
                  />
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Secure Client Chat</h2>
                    <p className="text-xs text-slate-500 mt-1">Chat directly with your assigned paralegal and conveyancer. Share mock file attachments securely.</p>
                  </div>
                  <MessagingHub 
                    conversations={conversations} 
                    messages={messages} 
                    currentUser={currentUser} 
                    selectedConversationId="conv-1"
                    onSendMessage={handleSendMessage}
                    onRefresh={() => refreshAllContexts(currentUser.id)}
                  />
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Schedule Consultations & Signings</h2>
                    <p className="text-xs text-slate-500 mt-1">Arrange virtual meetings or physical deeds signature sessions with your representative legal team.</p>
                  </div>
                  <AppointmentCalendar 
                    appointments={appointments} 
                    currentUser={currentUser} 
                    allUsers={allUsers}
                    onBook={handleBookAppointment}
                    onCancel={handleCancelAppointment}
                  />
                </div>
              )}
            </>
          )}

        </main>

      </div>
    </div>
  );
}

// Sparkles / Star custom mock placeholder icon since lucide might lack SparklesIcon directly
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}
