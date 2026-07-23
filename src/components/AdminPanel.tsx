import React from 'react';
import { Shield, Users, Bell, Sparkles, UserCheck, RefreshCw, Clock, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = React.useState<'audit' | 'automation' | 'templates' | 'users'>('audit');
  const [usersList, setUsersList] = React.useState<User[]>(allUsers);
  const [selectedRoleMap, setSelectedRoleMap] = React.useState<{ [userId: string]: string }>({});
  const [allocatingId, setAllocatingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUsersList(allUsers);
  }, [allUsers]);

  const handleAllocateRole = async (userId: string) => {
    const newRole = selectedRoleMap[userId];
    if (!newRole || !onAllocateRole) return;
    setAllocatingId(userId);
    try {
      await onAllocateRole(userId, newRole);
    } catch (e) {
      console.error(e);
    }
    setAllocatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">System Administration</h2>
          <p className="text-xs text-slate-500 mt-1">Manage users, audit logs, and automation rules.</p>
        </div>
        <div className="text-[10px] text-brand-gold-dark font-mono font-bold bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded">
          Admin: {currentUser.name}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 space-x-2">
          {['audit', 'automation', 'templates', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Shield className="w-4 h-4"/> Audit Logs</h3>
              <div className="bg-brand-navy text-slate-300 rounded-xl p-4 font-mono text-[11px] h-96 overflow-y-auto space-y-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="border-b border-slate-800 pb-2">
                    <div className="flex justify-between text-brand-gold">
                      <span>[{log.timestamp}] {log.action}</span>
                      <span>{log.ipAddress}</span>
                    </div>
                    <p className="text-white mt-1">{log.details}</p>
                    <div className="text-slate-500 mt-1">Actor: {log.userName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Bell className="w-4 h-4"/> Automation Rules</h3>
               <div className="grid gap-4 md:grid-cols-2">
                  {automationRules.map(rule => (
                    <div key={rule.id} className="border p-4 rounded-xl shadow-sm bg-slate-50">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold">{rule.name}</h4>
                        <button onClick={() => onToggleRule(rule.id)} className={`text-xs px-2 py-1 rounded ${rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <p className="text-xs mt-2 text-slate-600">{rule.template}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Templates</h3>
              <p className="text-sm text-slate-600">Templates are currently being migrated to use server-side generation.</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Users className="w-4 h-4"/> Users</h3>
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b"><th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Actions</th></tr></thead>
                <tbody>
                  {usersList.map(user => (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="p-2 font-bold">{user.name} ({user.email})</td>
                      <td className="p-2">
                        <select 
                          value={selectedRoleMap[user.id] || user.role}
                          onChange={(e) => setSelectedRoleMap({...selectedRoleMap, [user.id]: e.target.value})}
                          className="border p-1 rounded"
                        >
                          <option value="buyer">Buyer</option><option value="seller">Seller</option>
                          <option value="admin">Admin</option><option value="other">Other</option>
                        </select>
                        <button onClick={() => handleAllocateRole(user.id)} className="ml-2 text-brand-navy font-bold">Save</button>
                      </td>
                      <td className="p-2">
                         <button onClick={() => onDeleteUser?.(user.id)} className="text-rose-600"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
