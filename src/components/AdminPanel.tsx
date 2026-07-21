import React from 'react';
import { Shield, Users, Mail, Bell, FileText, CheckCircle2, Terminal, Sparkles, RefreshCw, Copy, Check, Power } from 'lucide-react';
import { User, AuditLog, AutomationRule, AutomationLog } from '../types';

interface AdminPanelProps {
  currentUser: User;
  allUsers: User[];
  auditLogs: AuditLog[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  onAddUser: (user: Partial<User>) => void;
  onToggleRule: (ruleId: string) => void;
}

export default function AdminPanel({
  currentUser,
  allUsers,
  auditLogs,
  automationRules,
  automationLogs,
  onAddUser,
  onToggleRule
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'audit' | 'automation' | 'templates' | 'users'>('audit');
  
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
    alert("New team member registered in Pendelton database successfully.");
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

            <div className="bg-[#0B192C] text-slate-300 rounded-xl p-4 font-mono text-[11px] h-96 overflow-y-auto border border-slate-800 space-y-2.5 shadow-inner">
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Provisioning Form */}
              <div className="bg-brand-cream/10 border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Provision Practitioner
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
                      placeholder="richard@pendeltonlaw.co.za"
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
                    className="w-full bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-bold text-xs py-2 rounded shadow-sm transition-colors cursor-pointer"
                  >
                    Register Team Member
                  </button>
                </form>
              </div>

              {/* Active Users Table list */}
              <div className="lg:col-span-2 border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-premium p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Registered System Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-brand-cream/20 border-b border-slate-200/60 font-bold uppercase text-slate-600 font-sans">
                        <th className="p-3">User Entity</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">KYC Clearing State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {allUsers.map(user => (
                        <tr key={user.id} className="hover:bg-brand-cream/10 transition-colors animate-fade-in">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'} className="h-7 w-7 rounded-full object-cover border border-brand-gold/25" alt="" />
                              <div>
                                <span className="font-serif font-bold text-brand-navy block text-sm">{user.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 uppercase font-bold text-[10px] text-brand-gold-dark font-mono">{user.role}</td>
                          <td className="p-3 font-mono text-slate-500">{user.phone || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider ${
                              user.kycStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {user.kycStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
