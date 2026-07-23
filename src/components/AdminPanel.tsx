import React from 'react';
import { Shield, Users, Mail, Bell, FileText, CheckCircle2, Terminal, Sparkles, RefreshCw, Copy, Check, Power, Database, ExternalLink, UserCheck, ShieldAlert, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { User, AuditLog, AutomationRule, AutomationLog } from '../types';
import { safeFetch } from '../lib/safeFetch';

interface AdminPanelProps {
  currentUser: User;
  allUsers: User[];
  auditLogs: AuditLog[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  onAddUser: (user: Partial<User>) => void;
  onToggleRule: (ruleId: string) => void;
  onAllocateRole?: (userId: string, newRole: string) => void;
  onDeleteUser?: (userId: string) => Promise<void>;
}

export default function AdminPanel({
  currentUser,
  allUsers,
  auditLogs,
  automationRules,
  automationLogs,
  onAddUser,
  onToggleRule,
  onAllocateRole,
  onDeleteUser
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'audit' | 'automation' | 'templates' | 'users' | 'supabase'>('audit');
  
  // User Management & Role Allocation state
  const [usersList, setUsersList] = React.useState<User[]>(allUsers);
  const [selectedRoleMap, setSelectedRoleMap] = React.useState<{ [userId: string]: string }>({});
  const [allocatingId, setAllocatingId] = React.useState<string | null>(null);
  const [allocationMsg, setAllocationMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    setUsersList(allUsers);
  }, [allUsers]);

  const handleAllocateRole = async (userId: string) => {
    const targetRole = selectedRoleMap[userId];
    if (!targetRole) return;

    setAllocatingId(userId);
    setAllocationMsg(null);

    try {
      const data = await safeFetch(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole, adminUserId: currentUser.id })
      });

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: targetRole as any } : u));
      setAllocationMsg({ type: 'success', text: `Role successfully allocated to ${targetRole.toUpperCase()} for ${data.user?.name || 'User'}.` });
      
      if (onAllocateRole) {
        onAllocateRole(userId, targetRole);
      }
    } catch (err: any) {
      setAllocationMsg({ type: 'error', text: err.message || 'Error updating user role.' });
    } finally {
      setAllocatingId(null);
    }
  };
  
  // Supabase state
  const [supabaseConfig, setSupabaseConfig] = React.useState<{ url: string; projectId: string; hasKey: boolean } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = React.useState<{ configured: boolean; connected: boolean; isTableMissing?: boolean; error?: string; message: string } | null>(null);
  const [supabaseSql, setSupabaseSql] = React.useState<string>('');
  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{ success: boolean; message: string; report?: any } | null>(null);
  const [copiedSql, setCopiedSql] = React.useState(false);
  const [loadingConfig, setLoadingConfig] = React.useState(false);

  const fetchSupabaseInfo = async () => {
    setLoadingConfig(true);
    try {
      try {
        const configData = await safeFetch('/api/supabase/config');
        setSupabaseConfig(configData);
      } catch (e) {}

      try {
        const statusData = await safeFetch('/api/supabase/status');
        setSupabaseStatus(statusData);
      } catch (e) {}

      try {
        const sqlData = await safeFetch('/api/supabase/sql-schema');
        if (sqlData?.sql) setSupabaseSql(sqlData.sql);
      } catch (e) {}
    } catch (err) {
      console.error("Error fetching Supabase configuration:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  React.useEffect(() => {
    fetchSupabaseInfo();
  }, []);

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const data = await safeFetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setSyncResult(data);
      // Refresh status after trying to sync
      try {
        const statusData = await safeFetch('/api/supabase/status');
        setSupabaseStatus(statusData);
      } catch (e) {}
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `Synchronization failed: ${err.message || err}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLocalData = async () => {
    if (!window.confirm("Are you sure you want to clear all local data and reset to initial baseline?")) return;
    try {
      const data = await safeFetch('/api/admin/clear-local-data', { method: 'POST' });
      if (data.success) {
        alert(data.message || "Local data successfully cleared!");
        window.location.reload();
      } else {
        alert(data.error || "Failed to clear local data.");
      }
    } catch (err: any) {
      alert("Error clearing local data: " + err.message);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };
  
  // Template Generator state
  const [templateType, setTemplateType] = React.useState('power_of_attorney');
  const [drafting, setDrafting] = React.useState(false);
  const [draftedTemplate, setDraftedTemplate] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // New team member state
  const [newTeam, setNewTeam] = React.useState({
    name: '',
    email: '',
    role: 'paralegal' as any,
    phone: ''
  });

  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.email) {
      alert("Please fill in Name and Email.");
      return;
    }
    onAddUser({
      name: newTeam.name,
      email: newTeam.email,
      role: newTeam.role,
      phone: newTeam.phone,
      kycStatus: 'verified',
      consentAccepted: true
    });
    setNewTeam({ name: '', email: '', role: 'paralegal', phone: '' });
    alert("New team member registered in Masina database successfully.");
  };

  const handleDraftTemplate = async () => {
    setDrafting(true);
    try {
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          propertyAddress: '124 Villa Rosa, Sandton',
          buyerName: 'John Buyer',
          sellerName: 'Sarah Seller',
          price: '2450000'
        })
      });
      const data = await response.json();
      setDraftedTemplate(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setDrafting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftedTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium overflow-hidden" id="admin-panel">
      {/* Tab select header bar */}
      <div className="bg-brand-cream/10 border-b border-slate-200/60 p-4 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center ${
              activeTab === 'audit'
                ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-gold/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 mr-1 text-brand-gold" />
            Security Audit Trail
          </button>

          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center ${
              activeTab === 'automation'
                ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-gold/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            <Bell className="h-3.5 w-3.5 mr-1 text-brand-gold" />
            Workflow Automation Rules
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center ${
              activeTab === 'templates'
                ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-gold/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1 text-brand-gold" />
            AI Deeds Draft Board
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center ${
              activeTab === 'users'
                ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-gold/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            <Users className="h-3.5 w-3.5 mr-1 text-brand-gold" />
            User Access Management
          </button>

          <button
            onClick={() => { setActiveTab('supabase'); fetchSupabaseInfo(); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center ${
              activeTab === 'supabase'
                ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-gold/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
            }`}
          >
            <Database className="h-3.5 w-3.5 mr-1 text-brand-gold" />
            Supabase Integration
          </button>
        </div>

        <div className="text-[10px] text-brand-gold-dark font-mono font-bold bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded">
          Admin: {currentUser.name} (Alice)
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: IMMUTABLE AUDIT TRAIL LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="h-4.5 w-4.5 text-brand-gold-dark" />
                <span>Regulatory Activity Registry</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Immutable cryptographic records active</span>
            </div>

            <div className="bg-brand-navy text-slate-300 rounded-xl p-4 font-mono text-[11px] h-96 overflow-y-auto border border-slate-800 space-y-2.5 shadow-inner">
              {auditLogs.map(log => (
                <div key={log.id} className="border-b border-slate-900 pb-2 hover:bg-slate-900/40 transition-colors">
                  <div className="flex flex-wrap justify-between text-[10px] text-brand-gold font-bold">
                    <span>[{log.timestamp}] EVENT: {log.action}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                  <p className="text-white mt-0.5 leading-relaxed">{log.details}</p>
                  <div className="text-[9px] text-slate-500 mt-1">
                    Actor: {log.userName} (Role: {log.userRole.toUpperCase()}) | Log ID: {log.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATION WORKFLOW RULES MATRIX */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
                <Bell className="h-4.5 w-4.5 text-brand-gold-dark" />
                <span>Workflow Automation Triggers</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Configure instant notifications triggered by conveyancing operations. Rule dispatches utilize secured OAuth pipelines.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automationRules.map(rule => (
                  <div key={rule.id} className="border border-slate-200/60 rounded-xl p-4 bg-brand-cream/10 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-bold text-brand-gold-dark font-mono block">{rule.trigger}</span>
                        <button
                          type="button"
                          onClick={() => onToggleRule(rule.id)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            rule.enabled
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25'
                              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{rule.name}</h4>
                      <p className="text-[11px] text-slate-500 bg-white border border-slate-150 p-2.5 rounded font-mono leading-relaxed shadow-sm">
                        {rule.template}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical automation dispatch logs list */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical Dispatch Logs</h4>
              <div className="overflow-x-auto border border-slate-200/60 rounded-xl shadow-sm">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-brand-cream/20 border-b border-slate-200/60 font-bold text-slate-600 font-sans">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Trigger / Rule Name</th>
                      <th className="p-3">Recipient Address</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Clearing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    {automationLogs.map(log => (
                      <tr key={log.id} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3">
                          <span className="font-serif font-bold text-brand-navy block">{log.triggerName}</span>
                          <span className="text-[9px] text-brand-gold-dark font-mono font-bold">Matter Ref: {log.matterNumber}</span>
                        </td>
                        <td className="p-3 font-medium truncate max-w-[150px]">{log.recipient}</td>
                        <td className="p-3 uppercase font-bold text-slate-400 font-mono">{log.type}</td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-[10px] px-2 py-0.5 rounded font-bold font-mono">✓ DELIVERED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GEMINI AI LEGAL TEMPLATE DRAFTER */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-4.5 w-4.5 text-brand-gold-dark animate-pulse" />
                <span>AI Deeds Office & FICA Template Drafting</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Utilize server-side Gemini AI to auto-generate and fill complex deeds documents and affidavits. Modify the drafted segments below before exporting to physical print.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Selector Panel */}
              <div className="space-y-4">
                <div className="border border-slate-200/60 rounded-xl p-4 bg-brand-cream/10 space-y-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200/60 pb-1 font-mono">Draft Settings</span>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Template Classification</label>
                    <select
                      value={templateType}
                      onChange={(e) => setTemplateType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold focus:outline-none"
                    >
                      <option value="power_of_attorney">Special Power of Attorney to Transfer</option>
                      <option value="fica_affidavit">FICA Compliance Address Affidavit</option>
                      <option value="sars_duty">SARS Transfer Duty Declaration</option>
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed font-sans bg-white border border-slate-150 p-3 rounded-lg shadow-sm">
                    <strong>Preloaded parameters:</strong>
                    <ul className="list-disc list-inside mt-1 text-[10px] space-y-0.5 font-mono text-slate-400">
                      <li>Property: Erf 124, Villa Rosa, Sandton</li>
                      <li>Buyer: John Buyer (ID Smart Card verified)</li>
                      <li>Seller: Sarah Seller (Title deed owner)</li>
                      <li>Price: ZAR 2,450,000</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDraftTemplate}
                    disabled={drafting}
                    className="w-full bg-brand-navy hover:bg-brand-navy/95 disabled:bg-slate-300 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 border border-slate-800 shadow-sm cursor-pointer"
                  >
                    {drafting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-gold" />
                        <span>AI Drafting Active...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-brand-gold" />
                        <span>Draft Template with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Output text area */}
              <div className="md:col-span-2 border border-slate-200/60 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between min-h-[360px] shadow-premium">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider">Draft Output Preview</h4>
                  {draftedTemplate && (
                    <button
                      onClick={copyToClipboard}
                      className="text-xs text-brand-gold-dark hover:text-brand-gold font-bold flex items-center space-x-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copied" : "Copy Draft"}</span>
                    </button>
                  )}
                </div>

                {draftedTemplate ? (
                  <textarea
                    readOnly
                    value={draftedTemplate}
                    className="flex-1 w-full bg-slate-50 border border-slate-150 rounded-lg p-4 font-mono text-[10px] leading-relaxed whitespace-pre focus:outline-none focus:ring-1 focus:ring-brand-gold overflow-y-auto"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
                    <FileText className="h-10 w-10 text-brand-gold/40" />
                    <p className="text-xs font-semibold text-slate-700">Workspace is empty.</p>
                    <p className="text-[10px] text-slate-500 max-w-sm">Select template metrics on the left, then trigger drafting to populate this workspace.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT PANEL */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in font-sans">
            {/* Top Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Total System Accounts</span>
                <span className="text-xl font-extrabold text-brand-navy block font-serif">{usersList.length}</span>
              </div>
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block font-mono">Pending Allocations</span>
                <span className="text-xl font-extrabold text-amber-800 block font-serif">{usersList.filter(u => u.role === 'other').length}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Firm Legal Staff</span>
                <span className="text-xl font-extrabold text-brand-gold-dark block font-serif">
                  {usersList.filter(u => u.role === 'attorney' || u.role === 'conveyancer' || u.role === 'paralegal' || u.role === 'admin').length}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Client Portal Users</span>
                <span className="text-xl font-extrabold text-emerald-700 block font-serif">
                  {usersList.filter(u => u.role === 'buyer' || u.role === 'seller').length}
                </span>
              </div>
            </div>

            {/* Pending Staff Allocation Banner */}
            {usersList.some(u => u.role === 'other') && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 flex items-start space-x-3 text-amber-900 shadow-sm animate-pulse">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 font-mono">
                    System Security Alert: {usersList.filter(u => u.role === 'other').length} User(s) Pending Role Allocation
                  </h4>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Per security policy, users who registered as 'Other' (unassigned staff or custom users) cannot access practitioner privileges until a System Administrator allocates their specific role (Attorney, Conveyancer, Paralegal, Administrator, Buyer, or Seller). Select the designated role in the table below and click <strong>Allocate Role</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback notification toast */}
            {allocationMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
                allocationMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{allocationMsg.text}</span>
                </div>
                <button onClick={() => setAllocationMsg(null)} className="text-xs opacity-60 hover:opacity-100 font-mono">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Provisioning Form */}
              <div className="bg-brand-cream/10 border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center space-x-1.5">
                  <Users className="h-4 w-4 text-brand-gold-dark" />
                  <span>Direct Provision Staff</span>
                </h3>
                
                <form onSubmit={handleAddTeamSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      placeholder="e.g. Richard Convey"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newTeam.email}
                      onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })}
                      placeholder="richard@masinalaw.co.za"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Role Classification</label>
                    <select
                      value={newTeam.role}
                      onChange={(e) => setNewTeam({ ...newTeam, role: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    >
                      <option value="paralegal">Paralegal Clerk</option>
                      <option value="conveyancer">Conveyancer Practitioner</option>
                      <option value="attorney">Associate Attorney</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Phone Contact</label>
                    <input
                      type="text"
                      value={newTeam.phone}
                      onChange={(e) => setNewTeam({ ...newTeam, phone: e.target.value })}
                      placeholder="+27 11 432 9005"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-navy hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs py-2 rounded shadow-sm transition-colors cursor-pointer"
                  >
                    Provision Team Member
                  </button>
                </form>
              </div>

              {/* Active Users Table list */}
              <div className="lg:col-span-2 border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-premium p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center space-x-1.5">
                      <UserCheck className="h-4 w-4 text-brand-gold" />
                      <span>Registered User Accounts & Administrator Role Allocation</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select a designated role from the dropdown and click 'Allocate Role' to update system permissions.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-brand-cream/20 border-b border-slate-200/60 font-bold uppercase text-slate-600 font-sans">
                        <th className="p-3">User Entity</th>
                        <th className="p-3">Current Role</th>
                        <th className="p-3">Administrator Role Allocation</th>
                        <th className="p-3">KYC Clearing</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {usersList.map(user => {
                        const isPending = user.role === 'other';
                        const selectedRole = selectedRoleMap[user.id] || user.role;
                        const hasRoleChanged = selectedRoleMap[user.id] && selectedRoleMap[user.id] !== user.role;

                        return (
                          <tr key={user.id} className={`transition-colors ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-brand-cream/10'}`}>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'} className="h-8 w-8 rounded-full object-cover border border-brand-gold/25" alt="" />
                                <div>
                                  <span className="font-serif font-bold text-brand-navy block text-sm">{user.name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {isPending ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  <Clock className="h-3 w-3 mr-1" /> Pending Allocation
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider border ${
                                  user.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : user.role === 'attorney' || user.role === 'conveyancer' || user.role === 'paralegal'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <select
                                  value={selectedRole}
                                  onChange={(e) => setSelectedRoleMap({ ...selectedRoleMap, [user.id]: e.target.value })}
                                  className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                                >
                                  <option value="buyer">Buyer Client</option>
                                  <option value="seller">Seller Client</option>
                                  <option value="attorney">Attorney Staff</option>
                                  <option value="conveyancer">Conveyancer Staff</option>
                                  <option value="paralegal">Paralegal Staff</option>
                                  <option value="admin">System Administrator</option>
                                  <option value="other">Other / Pending Allocation</option>
                                </select>
                                <button
                                  onClick={() => handleAllocateRole(user.id)}
                                  disabled={allocatingId === user.id || !hasRoleChanged}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1 font-mono ${
                                    allocatingId === user.id
                                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                      : hasRoleChanged
                                      ? 'bg-brand-navy hover:bg-slate-800 text-brand-gold shadow-md border border-slate-800 cursor-pointer animate-bounce'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                                  }`}
                                >
                                  {allocatingId === user.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin text-brand-gold" />
                                  ) : (
                                    <>
                                      <UserCheck className="h-3 w-3" />
                                      <span>Allocate</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider ${
                                user.kycStatus === 'verified'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {user.kycStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) {
                                    if (onDeleteUser) {
                                      await onDeleteUser(user.id);
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete user account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: SUPABASE DATABASE SYNCHRONIZER */}
        {activeTab === 'supabase' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
                  <Database className="h-4.5 w-4.5 text-brand-gold-dark animate-pulse" />
                  <span>Supabase Real-Time Sync Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connect and synchronize Masina Law database structures with your cloud-hosted Supabase PostgreSQL instance.
                </p>
              </div>
              <button
                onClick={fetchSupabaseInfo}
                disabled={loadingConfig}
                className="self-start md:self-auto px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loadingConfig ? 'animate-spin' : ''}`} />
                <span>Check Connection</span>
              </button>
            </div>

            {loadingConfig ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-gold" />
                <p className="text-xs text-slate-500 font-medium">Analyzing Supabase Project Status...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Configuration Stats Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Status Indicator Card */}
                  <div className="border border-slate-200/60 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">CONNECTION STATUS</span>
                      {supabaseStatus?.connected ? (
                        <div className="mt-3 flex items-start space-x-2.5">
                          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping mt-1" />
                          <div>
                            <h4 className="text-sm font-bold text-emerald-800">CONNECTED</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Online communication established</p>
                          </div>
                        </div>
                      ) : supabaseStatus?.isTableMissing ? (
                        <div className="mt-3 flex items-start space-x-2.5">
                          <span className="h-3 w-3 rounded-full bg-amber-500 mt-1" />
                          <div>
                            <h4 className="text-sm font-bold text-amber-800">TABLES MISSING</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Connected, but database schema not loaded</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-start space-x-2.5">
                          <span className="h-3 w-3 rounded-full bg-slate-300 mt-1" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-700">NOT CONFIGURED</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">No API secret configured yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>API Secret Check:</span>
                      <span className={`font-bold ${supabaseConfig?.hasKey ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {supabaseConfig?.hasKey ? '✓ SECURED' : '⚠ MISSING'}
                      </span>
                    </div>
                  </div>

                  {/* Supabase Endpoint Info Card */}
                  <div className="border border-slate-200/60 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">SUPABASE CREDENTIALS</span>
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 font-mono block">PROJECT ID</label>
                          <span className="text-xs font-mono font-bold text-brand-navy bg-brand-cream/35 px-1.5 py-0.5 rounded border border-brand-gold/15 block w-fit">
                            {supabaseConfig?.projectId || 'lxdescdgxgzxfahhbqfy'}
                          </span>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 font-mono block">ENDPOINT URL</label>
                          <span className="text-[10px] font-mono text-slate-600 truncate block">
                            {supabaseConfig?.url || 'https://lxdescdgxgzxfahhbqfy.supabase.co'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://supabase.com/dashboard/project/${supabaseConfig?.projectId || 'lxdescdgxgzxfahhbqfy'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-brand-gold-dark hover:text-brand-gold font-bold font-sans"
                    >
                      <span>Open Supabase Dashboard</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Synchronization Control Card */}
                  <div className="border border-slate-200/60 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">DATA SYNCHRONIZER</span>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Export existing conveyancing matters, documents, rules, and security audits from Masina local JSON directly into Supabase tables.
                      </p>
                    </div>

                    <button
                      onClick={handleSyncSupabase}
                      disabled={syncing || !supabaseConfig?.hasKey}
                      className="mt-4 w-full bg-brand-navy hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 text-brand-gold font-bold text-xs py-2.5 rounded-lg border border-slate-800 shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-brand-gold" />
                          <span>Pushing Demo Data to Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 text-brand-gold" />
                          <span>Push All Demo Data to Supabase</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClearLocalData}
                      className="mt-2 w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2 rounded-lg border border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      <span>Clear All Local Storage</span>
                    </button>
                  </div>
                </div>

                {/* If API Key is missing, guide them with step-by-step instructions on how to add it */}
                {!supabaseConfig?.hasKey && (
                  <div className="bg-amber-50/55 border border-amber-200/60 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider font-sans flex items-center space-x-1.5">
                      <span>⚠ API SECRET NOT SET (REQUIRED STEP)</span>
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                      We have integrated your Supabase client targeting URL <strong className="font-mono text-[11px]">https://lxdescdgxgzxfahhbqfy.supabase.co</strong>. However, to authorize writes, you must add the <strong className="font-sans text-brand-navy text-[11px]">SUPABASE_ANON_KEY</strong> secret to your environment.
                    </p>
                    <div className="text-xs text-amber-950 font-serif">
                      <strong className="block font-sans text-[11px] text-slate-800 font-bold mb-1 uppercase tracking-widest">How to configure the API key:</strong>
                      <ol className="list-decimal list-inside space-y-1 font-sans text-[11px] text-slate-600">
                        <li>Open the App settings menu in the top-right corner of Google AI Studio.</li>
                        <li>Click on the <strong className="font-bold text-brand-navy">Secrets / Environment variables</strong> section.</li>
                        <li>Add a new secret variable named <strong className="font-mono bg-slate-100 text-brand-navy px-1 py-0.5 rounded">SUPABASE_ANON_KEY</strong>.</li>
                        <li>Paste your Supabase Anonymous Key (available in your Supabase dashboard under API settings) into the value field.</li>
                        <li>Restart the applet to reload environment configs!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* RLS Guidance Banner */}
                {syncResult && syncResult.message && (syncResult.message.includes('row-level security') || syncResult.message.includes('policy')) && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-900 space-y-2.5 shadow-md font-sans animate-fade-in">
                    <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                      <span>REQUIRED SETUP: Disable Row Level Security (RLS) in Supabase SQL Editor</span>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed">
                      Supabase currently blocks database writes because <strong>Row Level Security (RLS)</strong> is enabled on your tables without write permissions. To allow your application to store registered users and seed demo data:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-amber-900 font-medium bg-white/80 p-3 rounded-lg border border-amber-200/80">
                      <li>Click <strong>Copy SQL Schema</strong> below.</li>
                      <li>Open your <a href={`https://supabase.com/dashboard/project/${supabaseConfig?.projectId || 'lxdescdgxgzxfahhbqfy'}/sql/new`} target="_blank" rel="noreferrer" className="underline font-bold text-brand-navy hover:text-brand-gold-dark">Supabase SQL Editor (New Query)</a>.</li>
                      <li>Paste the SQL script and click <strong>Run</strong>.</li>
                      <li>Click <strong>Push All Demo Data to Supabase</strong> above!</li>
                    </ol>
                  </div>
                )}

                {/* Synchronization Success/Failure Reporting */}
                {syncResult && (
                  <div className={`rounded-xl p-5 border space-y-3.5 ${
                    syncResult.success 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : 'bg-red-50/40 border-red-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-bold uppercase tracking-wider font-sans ${
                        syncResult.success ? 'text-emerald-800' : 'text-red-800'
                      }`}>
                        {syncResult.success ? '✓ Synchronization Succeeded' : '⚠ Sync Completed with Failures'}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Pipeline Report</span>
                    </div>
                    <p className={`text-xs ${syncResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {syncResult.message}
                    </p>

                    {syncResult.report && (
                      <div className="overflow-x-auto border border-slate-150 rounded-lg bg-white shadow-sm">
                        <table className="w-full text-[11px] text-left border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase font-mono text-[9px]">
                              <th className="p-2.5">Table Name</th>
                              <th className="p-2.5">Local Records</th>
                              <th className="p-2.5">Successfully Synced</th>
                              <th className="p-2.5">Status / Errors</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {Object.entries(syncResult.report).map(([tbl, info]: [string, any]) => (
                              <tr key={tbl} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-bold font-mono text-brand-navy">{tbl}</td>
                                <td className="p-2.5 font-mono">{info.total}</td>
                                <td className="p-2.5 font-mono text-emerald-600 font-bold">{info.synced}</td>
                                <td className="p-2.5">
                                  {info.error ? (
                                    <span className="text-red-600 font-mono text-[10px] bg-red-50/80 px-2 py-0.5 rounded block max-w-sm truncate" title={info.error}>
                                      Error: {info.error}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                      SUCCESS
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SQL Editor DDL schema area */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                        Supabase SQL DDL Schema Script
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Run this script in your Supabase SQL Editor to instantly provision all required tables before syncing.
                      </p>
                    </div>
                    <button
                      onClick={copySqlToClipboard}
                      className="text-xs text-brand-gold-dark hover:text-brand-gold font-bold flex items-center space-x-1 border border-slate-250 bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded cursor-pointer"
                    >
                      {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSql ? 'Copied' : 'Copy SQL Schema'}</span>
                    </button>
                  </div>

                  <div className="bg-brand-navy text-slate-300 rounded-xl p-4 font-mono text-[10px] h-72 overflow-y-auto border border-slate-800 space-y-1.5 shadow-inner leading-relaxed font-mono">
                    <pre className="whitespace-pre-wrap">{supabaseSql}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
