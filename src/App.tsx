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
import AuthCenter from './components/AuthCenter';
import UserProfileModal from './components/UserProfileModal';
import LegalModal from './components/LegalModal';
import MasinaLogo from './components/MasinaLogo';
import ToastContainer, { ToastMessage } from './components/Toast';
import { safeFetch } from './lib/safeFetch';

export default function App() {
  // Session context states
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [selectedMatterId, setSelectedMatterId] = React.useState<string>('mat-1');
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = React.useState<boolean>(false);
  const [legalInitialTab, setLegalInitialTab] = React.useState<'privacy' | 'terms'>('privacy');

  // Toast Notification system state
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
      // 1. Fetch Users List from Live API
      let liveUsers: User[] = [];
      try {
        liveUsers = await safeFetch<User[]>('/api/users');
        setAllUsers(liveUsers);
      } catch (e) {
        console.warn('Failed to load users list from API', e);
      }

      try {
        const mattersData = await safeFetch<PropertyMatter[]>('/api/matters');
        setMatters(mattersData);
      } catch (e) {}

      try {
        const docsData = await safeFetch<Document[]>('/api/documents');
        setDocuments(docsData);
      } catch (e) {}

      try {
        const tasksData = await safeFetch<Task[]>('/api/tasks');
        setTasks(tasksData);
      } catch (e) {}

      try {
        const appointmentsData = await safeFetch<Appointment[]>('/api/appointments');
        setAppointments(appointmentsData);
      } catch (e) {}

      try {
        const convsData = await safeFetch<Conversation[]>('/api/conversations');
        setConversations(convsData);
      } catch (e) {}

      try {
        const rulesData = await safeFetch<AutomationRule[]>('/api/automation/rules');
        setAutomationRules(rulesData);
      } catch (e) {
        setAutomationRules([
          { id: 'rule-1', name: 'Welcome Onboarding Notification', trigger: 'matter_opened', actionType: 'email', template: 'Dear {{client_name}}, welcome...', enabled: true },
          { id: 'rule-2', name: 'Stage Completed Alert', trigger: 'stage_completed', actionType: 'push', template: 'Great news...', enabled: true }
        ]);
      }

      try {
        const autoLogsData = await safeFetch<AutomationLog[]>('/api/automation/logs');
        setAutomationLogs(autoLogsData);
      } catch (e) {}

      try {
        const auditData = await safeFetch<AuditLog[]>('/api/audit/logs');
        setAuditLogs(auditData);
      } catch (e) {}

      // Initialize the active user profile context on startup
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('masina_current_user_id') : null;
      const targetUserId = userIdToAuth || savedUserId || currentUser?.id || (liveUsers[0]?.id || 'usr-admin-1');
      try {
        const loginData = await safeFetch<{ user: User }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId })
        });
        if (loginData?.user) {
          setCurrentUser(loginData.user);
          try { localStorage.setItem('masina_current_user_id', loginData.user.id); } catch (e) {}
        }
      } catch (e) {
        if (liveUsers.length > 0) {
          const found = liveUsers.find(u => u.id === targetUserId) || liveUsers[0];
          setCurrentUser(found);
          try { localStorage.setItem('masina_current_user_id', found.id); } catch (e) {}
        }
      }

      // Pull message thread for current active conversation
      try {
        const msgData = await safeFetch<Message[]>('/api/conversations/conv-1/messages');
        setMessages(msgData);
      } catch (e) {}

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
    try { localStorage.setItem('masina_current_user_id', userId); } catch (e) {}
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
      const data = await safeFetch('/api/auth/kyc-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedUser.id,
          idNumber: updatedUser.idNumber,
          address: updatedUser.address,
          phone: updatedUser.phone
        })
      });
      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshAllContexts(updatedUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMatter = async (matterData: any) => {
    setLoading(true);
    try {
      const data = await safeFetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matterData)
      });
      if (data.id) {
        setSelectedMatterId(data.id);
      }
      await refreshAllContexts(currentUser?.id);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (docData: { name: string; category: string; fileUrl?: string; size?: string }) => {
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
      addToast({
        type: 'success',
        title: 'Document Transmitted',
        message: `File '${docData.name}' uploaded to Deeds Registry vault.`
      });
      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Unable to upload document to secure vault.'
      });
    }
  };

  const handleReviewDocument = async (docId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      const docObj = documents.find(d => d.id === docId);
      const docName = docObj ? docObj.name : 'Legal Document';

      await fetch(`/api/documents/${docId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewerNotes: notes,
          staffId: currentUser?.id
        })
      });

      addToast({
        type: status === 'approved' ? 'success' : 'warning',
        title: status === 'approved' ? 'Document Verified' : 'Document Rejected',
        message: status === 'approved' 
          ? `'${docName}' status updated to APPROVED by attorney.` 
          : `'${docName}' status set to REJECTED. Re-upload required.`
      });

      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Review Action Failed',
        message: 'Could not submit attorney review status.'
      });
    }
  };

  const handleUpdateStage = async (matterId: string, currentStage: number, lawyerNotes?: string, tasks?: any[]) => {
    try {
      await fetch(`/api/matters/${matterId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage, lawyerNotes, tasks })
      });
      
      addToast({
        type: 'info',
        title: 'Conveyancing Stage Advanced',
        message: `Transfer matter progress updated to Stage ${currentStage}.`
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
      addToast({
        type: 'info',
        title: 'New Conveyancing Task',
        message: `Task '${taskData.title || 'Conveyancing Action'}' created.`
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
      addToast({
        type: 'success',
        title: 'Task Cleared',
        message: 'Conveyancing requirement marked complete.'
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

      addToast({
        type: 'info',
        title: 'New Portal Message Arrived',
        message: `Message sent: "${text.substring(0, 45)}${text.length > 45 ? '...' : ''}"`
      });

      await refreshAllContexts(currentUser?.id);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Message Dispatch Failed',
        message: 'Unable to send message to portal chat.'
      });
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
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, adminUserId: currentUser?.id })
      });
      if (res.ok) {
        await refreshAllContexts(currentUser?.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateStaffToClient = async (clientId: string, staffIds: string[]) => {
    try {
      const res = await fetch(`/api/users/${clientId}/allocate-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds, adminUserId: currentUser?.id })
      });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Legal Team Allocated',
          message: 'Legal staff allocation updated successfully for client.'
        });
        await refreshAllContexts(currentUser?.id);
      }
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Allocation Failed',
        message: 'Could not update legal staff allocation.'
      });
    }
  };

  const handleAllocateClientsToStaff = async (staffId: string, clientIds: string[]) => {
    try {
      const res = await fetch(`/api/users/${staffId}/allocate-clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds, adminUserId: currentUser?.id })
      });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Client Portfolio Updated',
          message: 'Client portfolio updated successfully for staff member.'
        });
        await refreshAllContexts(currentUser?.id);
      }
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Allocation Failed',
        message: 'Could not update client portfolio allocation.'
      });
    }
  };

  const handleBulkAllocate = async (allocations: { clientId: string; staffIds: string[] }[]) => {
    try {
      const res = await fetch('/api/users/allocate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations, adminUserId: currentUser?.id })
      });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Bulk Allocations Saved',
          message: `Updated client-staff allocations across ${allocations.length} accounts.`
        });
        await refreshAllContexts(currentUser?.id);
      }
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

  const handleUpdateUserProfile = async (updatedFields: Partial<User>) => {
    if (!currentUser) return;
    try {
      const data = await safeFetch<{ user: User }>(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (data.user) {
        setCurrentUser(data.user);
        await refreshAllContexts(data.user.id);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await safeFetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (currentUser?.id === userId) {
        setCurrentUser(null);
      }
      await refreshAllContexts();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSubscribe = async (plan: 'free' | 'pro' | 'enterprise', newsletter: boolean) => {
    if (!currentUser) return;
    try {
      const data = await safeFetch<{ user: User }>(`/api/users/${currentUser.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, subscribedToNewsletter: newsletter })
      });
      if (data.user) {
        setCurrentUser(data.user);
        await refreshAllContexts(data.user.id);
      }
    } catch (err) {
      console.error(err);
      throw err;
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
          <AuthCenter 
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              try { localStorage.setItem('masina_current_user_id', user.id); } catch (e) {}
              setCurrentUser(user);
              refreshAllContexts(user.id);
            }}
            onLogoutSuccess={() => {
              try { localStorage.removeItem('masina_current_user_id'); } catch (e) {}
              setCurrentUser(null);
            }}
            allUsers={allUsers}
            onOpenLegalModal={(tab) => {
              if (tab) setLegalInitialTab(tab);
              setIsLegalModalOpen(true);
            }}
          />
          <div className="text-center text-xs text-slate-500 pt-2 flex items-center justify-center space-x-4">
            <button
              onClick={() => { setLegalInitialTab('privacy'); setIsLegalModalOpen(true); }}
              className="hover:text-brand-navy underline cursor-pointer"
            >
              Privacy Policy (POPIA)
            </button>
            <span>•</span>
            <button
              onClick={() => { setLegalInitialTab('terms'); setIsLegalModalOpen(true); }}
              className="hover:text-brand-navy underline cursor-pointer"
            >
              Terms & Conditions
            </button>
          </div>
        </div>

        <LegalModal 
          isOpen={isLegalModalOpen} 
          onClose={() => setIsLegalModalOpen(false)} 
          initialTab={legalInitialTab} 
        />
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
    { id: 'auth-center', label: 'Identity & Auth', icon: Lock },
    { id: 'admin', label: 'System Admin Panel', icon: Shield }
  ] : [
    { id: 'dashboard', label: 'Active Matter Tracker', icon: Building2 },
    { id: 'onboarding', label: 'Digital Onboarding Wizard', icon: SparklesIcon },
    { id: 'documents', label: 'Secure Document Vault', icon: FileText },
    { id: 'tasks', label: 'My Action Tasks', icon: ClipboardList },
    { id: 'messages', label: 'Message Attorney', icon: MessageSquare },
    { id: 'appointments', label: 'Book Consultation', icon: Calendar },
    { id: 'auth-center', label: 'Identity & Auth', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-slate-800" id="main-app">
      {/* Navbar Global Brand Header */}
      <Navbar 
        currentUser={currentUser} 
        allUsers={allUsers} 
        onSwitchUser={handleSwitchUser} 
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenLegalModal={(tab) => {
          if (tab) setLegalInitialTab(tab);
          setIsLegalModalOpen(true);
        }}
        onLogout={async () => {
          try { localStorage.removeItem('masina_current_user_id'); } catch (e) {}
          try {
            await fetch('/api/auth/logout', {
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
          
          {/* Security Hub View */}
          {activeTab === 'auth-center' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Security Hub</h2>
                <p className="text-xs text-slate-500 mt-1">Authenticate sessions, register compliant client profiles, and check synchronization pipelines.</p>
              </div>
              <AuthCenter 
                currentUser={currentUser}
                onLoginSuccess={(user) => {
                  try { localStorage.setItem('masina_current_user_id', user.id); } catch (e) {}
                  setCurrentUser(user);
                  refreshAllContexts(user.id);
                }}
                onLogoutSuccess={() => {
                  try { localStorage.removeItem('masina_current_user_id'); } catch (e) {}
                  setCurrentUser(null);
                }}
                allUsers={allUsers}
                onOpenLegalModal={(tab) => {
                  if (tab) setLegalInitialTab(tab);
                  setIsLegalModalOpen(true);
                }}
              />
            </div>
          )}

          {/* STAFF VIEWS */}
          {isStaff && activeTab !== 'auth-center' && (
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
                    allUsers={allUsers}
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
                    onAllocateStaffToClient={handleAllocateStaffToClient}
                    onAllocateClientsToStaff={handleAllocateClientsToStaff}
                    onBulkAllocate={handleBulkAllocate}
                    onDeleteUser={handleDeleteUser}
                  />
                </div>
              )}
            </>
          )}

          {/* CLIENT VIEWS */}
          {!isStaff && activeTab !== 'auth-center' && (
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
                      allUsers={allUsers}
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

      <UserProfileModal 
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateUser={handleUpdateUserProfile}
        onDeleteUser={handleDeleteUser}
        onSubscribe={handleSubscribe}
      />

      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalInitialTab} 
      />

      {/* Global Portal Toast Notification System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
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
