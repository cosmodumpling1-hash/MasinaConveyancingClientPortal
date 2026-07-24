import React from 'react';
import { 
  Shield, Users, Bell, UserCheck, RefreshCw, Clock, Trash2, 
  Activity, Calendar, TrendingUp, Zap, FileCheck, CheckCircle,
  Scale, Briefcase, FileText, Search, UserPlus, Check, X,
  Grid, Layers, ArrowRight, User
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Area, 
  XAxis, YAxis, Tooltip, Cell, CartesianGrid 
} from 'recharts';
import { User as UserType, AuditLog, AutomationRule, AutomationLog } from '../types';

interface AdminPanelProps {
  currentUser: UserType;
  allUsers: UserType[];
  auditLogs: AuditLog[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  onAddUser: (user: Partial<UserType>) => void;
  onToggleRule: (ruleId: string) => void;
  onAllocateRole?: (userId: string, newRole: string) => void;
  onAllocateStaffToClient?: (clientId: string, staffIds: string[]) => Promise<void>;
  onAllocateClientsToStaff?: (staffId: string, clientIds: string[]) => Promise<void>;
  onBulkAllocate?: (allocations: { clientId: string; staffIds: string[] }[]) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

// Generate 30 days of portal activity data (login frequency & document review times)
const generate30DayActivityData = () => {
  const data = [];
  const today = new Date('2026-07-24');
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseLogins = isWeekend ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 25) + 18;
    const baseReviewMins = isWeekend ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 20) + 12;
    const docsProcessed = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 12) + 4;
    
    let intensity = 1;
    if (baseLogins > 35) intensity = 5;
    else if (baseLogins > 25) intensity = 4;
    else if (baseLogins > 18) intensity = 3;
    else if (baseLogins > 10) intensity = 2;

    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      logins: baseLogins,
      reviewTimeAvg: baseReviewMins,
      docsReviewed: docsProcessed,
      intensity
    });
  }
  return data;
};

export default function AdminPanel({
  currentUser,
  allUsers,
  auditLogs,
  automationRules,
  automationLogs,
  onAddUser,
  onToggleRule,
  onAllocateRole,
  onAllocateStaffToClient,
  onAllocateClientsToStaff,
  onBulkAllocate,
  onDeleteUser
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'allocations' | 'heatmap' | 'users' | 'audit' | 'automation'>('allocations');
  const [usersList, setUsersList] = React.useState<UserType[]>(allUsers);
  const [selectedRoleMap, setSelectedRoleMap] = React.useState<{ [userId: string]: string }>({});
  
  // Allocations tab sub-state
  const [allocSubView, setAllocSubView] = React.useState<'by-client' | 'by-staff' | 'matrix'>('by-client');
  const [searchClientQuery, setSearchClientQuery] = React.useState('');
  const [filterClientRole, setFilterClientRole] = React.useState<'all' | 'buyer' | 'seller'>('all');
  const [filterStaffRole, setFilterStaffRole] = React.useState<'all' | 'attorney' | 'conveyancer' | 'paralegal'>('all');
  
  // Modal for Client Allocation
  const [modalClient, setModalClient] = React.useState<UserType | null>(null);
  const [modalDraftStaffIds, setModalDraftStaffIds] = React.useState<string[]>([]);
  
  // Modal for Staff Allocation
  const [modalStaff, setModalStaff] = React.useState<UserType | null>(null);
  const [modalDraftClientIds, setModalDraftClientIds] = React.useState<string[]>([]);

  // Matrix State
  const [matrixState, setMatrixState] = React.useState<{ [clientId: string]: string[] }>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const activityData = React.useMemo(() => generate30DayActivityData(), []);

  React.useEffect(() => {
    setUsersList(allUsers);
    // Initialize matrixState
    const initialMatrix: { [clientId: string]: string[] } = {};
    allUsers.forEach(u => {
      if (['buyer', 'seller', 'other'].includes(u.role)) {
        initialMatrix[u.id] = u.allocatedStaffIds || [];
      }
    });
    setMatrixState(initialMatrix);
  }, [allUsers]);

  // User Helpers
  const clients = React.useMemo(() => {
    return usersList.filter(u => ['buyer', 'seller', 'other'].includes(u.role));
  }, [usersList]);

  const attorneys = React.useMemo(() => {
    return usersList.filter(u => u.role === 'attorney');
  }, [usersList]);

  const conveyancers = React.useMemo(() => {
    return usersList.filter(u => u.role === 'conveyancer');
  }, [usersList]);

  const paralegals = React.useMemo(() => {
    return usersList.filter(u => u.role === 'paralegal');
  }, [usersList]);

  const legalStaff = React.useMemo(() => {
    return usersList.filter(u => ['attorney', 'conveyancer', 'paralegal'].includes(u.role));
  }, [usersList]);

  // Open Client Allocation Modal
  const handleOpenClientModal = (client: UserType) => {
    setModalClient(client);
    setModalDraftStaffIds(client.allocatedStaffIds || []);
  };

  // Open Staff Allocation Modal
  const handleOpenStaffModal = (staff: UserType) => {
    setModalStaff(staff);
    setModalDraftClientIds(staff.allocatedClientIds || []);
  };

  const handleSaveClientAllocation = async () => {
    if (!modalClient) return;
    setIsSaving(true);
    try {
      if (onAllocateStaffToClient) {
        await onAllocateStaffToClient(modalClient.id, modalDraftStaffIds);
      } else {
        await fetch(`/api/users/${modalClient.id}/allocate-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffIds: modalDraftStaffIds, adminUserId: currentUser.id })
        });
      }
      setModalClient(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaffAllocation = async () => {
    if (!modalStaff) return;
    setIsSaving(true);
    try {
      if (onAllocateClientsToStaff) {
        await onAllocateClientsToStaff(modalStaff.id, modalDraftClientIds);
      } else {
        await fetch(`/api/users/${modalStaff.id}/allocate-clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientIds: modalDraftClientIds, adminUserId: currentUser.id })
        });
      }
      setModalStaff(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      const allocations = Object.entries(matrixState).map(([clientId, staffIds]) => ({
        clientId,
        staffIds: (staffIds || []) as string[]
      }));
      if (onBulkAllocate) {
        await onBulkAllocate(allocations);
      } else {
        await fetch('/api/users/allocate-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allocations, adminUserId: currentUser.id })
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoDistribute = () => {
    const updated = { ...matrixState };
    clients.forEach(c => {
      const current = updated[c.id] || [];
      const hasAttorney = current.some(id => attorneys.some(a => a.id === id));
      const hasConveyancer = current.some(id => conveyancers.some(a => a.id === id));
      const hasParalegal = current.some(id => paralegals.some(a => a.id === id));

      const newIds = [...current];
      if (!hasAttorney && attorneys.length > 0) newIds.push(attorneys[0].id);
      if (!hasConveyancer && conveyancers.length > 0) newIds.push(conveyancers[0].id);
      if (!hasParalegal && paralegals.length > 0) newIds.push(paralegals[0].id);

      updated[c.id] = Array.from(new Set(newIds));
    });
    setMatrixState(updated);
  };

  const handleAllocateRole = async (userId: string) => {
    const newRole = selectedRoleMap[userId];
    if (!newRole || !onAllocateRole) return;
    try {
      await onAllocateRole(userId, newRole);
    } catch (e) {
      console.error(e);
    }
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 5: return 'bg-brand-navy border-brand-gold text-brand-gold shadow-md';
      case 4: return 'bg-brand-gold text-brand-navy font-bold';
      case 3: return 'bg-amber-200 text-amber-900';
      case 2: return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const total30DayLogins = activityData.reduce((acc, curr) => acc + curr.logins, 0);
  const avg30DayReviewTime = Math.round(activityData.reduce((acc, curr) => acc + curr.reviewTimeAvg, 0) / activityData.length);
  const totalDocsReviewed = activityData.reduce((acc, curr) => acc + curr.docsReviewed, 0);

  // Filtered clients list
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchClientQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchClientQuery.toLowerCase());
    const matchesRole = filterClientRole === 'all' || c.role === filterClientRole;
    return matchesSearch && matchesRole;
  });

  // Filtered staff list
  const filteredStaff = legalStaff.filter(s => {
    if (filterStaffRole === 'all') return true;
    return s.role === filterStaffRole;
  });

  return (
    <div className="space-y-6" id="admin-panel">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-brand-gold-dark" />
            <span>System Administration & Legal Allocations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Allocate clients to Attorneys, Conveyancers, and Paralegals, monitor system logs, and inspect activity heatmaps.
          </p>
        </div>
        <div className="text-[10px] text-brand-gold-dark font-mono font-bold bg-brand-gold/10 border border-brand-gold/20 px-3 py-1.5 rounded-lg flex items-center space-x-2">
          <Activity className="h-3.5 w-3.5 text-brand-gold-dark" />
          <span>Admin Profile: {currentUser.name}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 space-x-2 overflow-x-auto">
          {[
            { id: 'allocations', label: 'Client Staff Allocations', icon: UserCheck },
            { id: 'heatmap', label: 'Activity Heatmap (30 Days)', icon: Activity },
            { id: 'users', label: 'User Accounts & Roles', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: Shield },
            { id: 'automation', label: 'Automation Rules', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? 'bg-brand-navy text-white shadow-md border border-slate-800' 
                    : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: CLIENT STAFF ALLOCATIONS */}
          {activeTab === 'allocations' && (
            <div className="space-y-6">
              {/* Allocation KPI Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl space-y-1 shadow-sm border border-slate-700">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Total Clients</span>
                    <User className="h-4 w-4 text-brand-gold" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-gold">{clients.length}</p>
                  <p className="text-[10px] text-slate-300 font-mono">Buyers & Sellers registered</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Attorneys</span>
                    <Scale className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{attorneys.length}</p>
                  <p className="text-[10px] text-blue-700 font-semibold font-mono">Legal counsel team</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Conveyancers</span>
                    <Briefcase className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{conveyancers.length}</p>
                  <p className="text-[10px] text-amber-700 font-semibold font-mono">Deeds transfer team</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Paralegals</span>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{paralegals.length}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold font-mono">Compliance & FICA support</p>
                </div>
              </div>

              {/* Sub-View Switcher Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAllocSubView('by-client')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      allocSubView === 'by-client' 
                        ? 'bg-brand-navy text-brand-gold shadow' 
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Allocate by Client</span>
                  </button>

                  <button
                    onClick={() => setAllocSubView('by-staff')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      allocSubView === 'by-staff' 
                        ? 'bg-brand-navy text-brand-gold shadow' 
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Allocate by Legal Staff</span>
                  </button>

                  <button
                    onClick={() => setAllocSubView('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      allocSubView === 'matrix' 
                        ? 'bg-brand-navy text-brand-gold shadow' 
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Allocation Matrix</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 italic font-sans">
                  Multiple Attorneys, Conveyancers & Paralegals can be allocated to multiple clients.
                </p>
              </div>

              {/* SUB-VIEW 1: ALLOCATE BY CLIENT */}
              {allocSubView === 'by-client' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search clients by name or email..."
                        value={searchClientQuery}
                        onChange={(e) => setSearchClientQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-bold">Role:</span>
                      <select
                        value={filterClientRole}
                        onChange={(e) => setFilterClientRole(e.target.value as any)}
                        className="border border-slate-200 px-3 py-2 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50 font-medium"
                      >
                        <option value="all">All Clients</option>
                        <option value="buyer">Buyers Only</option>
                        <option value="seller">Sellers Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Clients Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClients.map(client => {
                      const allocatedStaff = legalStaff.filter(s => (client.allocatedStaffIds || []).includes(s.id));
                      const allocatedAttorneys = allocatedStaff.filter(s => s.role === 'attorney');
                      const allocatedConveyancers = allocatedStaff.filter(s => s.role === 'conveyancer');
                      const allocatedParalegals = allocatedStaff.filter(s => s.role === 'paralegal');

                      return (
                        <div key={client.id} className="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={client.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                  alt={client.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                                  <p className="text-xs text-slate-500">{client.email}</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                client.role === 'buyer' 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {client.role}
                              </span>
                            </div>

                            {/* Allocated Staff Categories */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Allocated Legal Team ({allocatedStaff.length})
                              </div>

                              {allocatedStaff.length === 0 ? (
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200/60 p-2 rounded-lg italic">
                                  No legal staff allocated yet. Click 'Manage Allocations' to assign team.
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {/* Attorneys */}
                                  {allocatedAttorneys.length > 0 && (
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className="font-bold text-blue-700 w-24 flex items-center space-x-1">
                                        <Scale className="h-3 w-3" />
                                        <span>Attorneys ({allocatedAttorneys.length}):</span>
                                      </span>
                                      <div className="flex flex-wrap gap-1 flex-1">
                                        {allocatedAttorneys.map(a => (
                                          <span key={a.id} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {a.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Conveyancers */}
                                  {allocatedConveyancers.length > 0 && (
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className="font-bold text-amber-700 w-24 flex items-center space-x-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>Conveyancers ({allocatedConveyancers.length}):</span>
                                      </span>
                                      <div className="flex flex-wrap gap-1 flex-1">
                                        {allocatedConveyancers.map(c => (
                                          <span key={c.id} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {c.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Paralegals */}
                                  {allocatedParalegals.length > 0 && (
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className="font-bold text-emerald-700 w-24 flex items-center space-x-1">
                                        <FileText className="h-3 w-3" />
                                        <span>Paralegals ({allocatedParalegals.length}):</span>
                                      </span>
                                      <div className="flex flex-wrap gap-1 flex-1">
                                        {allocatedParalegals.map(p => (
                                          <span key={p.id} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {p.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleOpenClientModal(client)}
                              className="px-3 py-1.5 bg-brand-navy hover:bg-slate-800 text-brand-gold text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                            >
                              <UserPlus className="h-3.5 w-3.5 text-brand-gold" />
                              <span>Manage Allocations</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: ALLOCATE BY LEGAL STAFF */}
              {allocSubView === 'by-staff' && (
                <div className="space-y-4">
                  {/* Staff Filter Bar */}
                  <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-bold text-slate-600">Filter Staff Role:</span>
                    {(['all', 'attorney', 'conveyancer', 'paralegal'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setFilterStaffRole(role)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          filterStaffRole === role 
                            ? 'bg-brand-navy text-white shadow' 
                            : 'bg-white text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {role === 'all' ? 'All Staff' : role + 's'}
                      </button>
                    ))}
                  </div>

                  {/* Staff Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map(staff => {
                      const allocatedClientUsers = clients.filter(c => (staff.allocatedClientIds || []).includes(c.id));

                      let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      if (staff.role === 'conveyancer') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (staff.role === 'paralegal') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                      return (
                        <div key={staff.id} className="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={staff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                  alt={staff.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                                  <p className="text-xs text-slate-500">{staff.email}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                                {staff.role}
                              </span>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Allocated Client Portfolio ({allocatedClientUsers.length})
                              </div>

                              {allocatedClientUsers.length === 0 ? (
                                <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded-lg italic">
                                  No clients allocated to this staff member yet.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {allocatedClientUsers.map(c => (
                                    <span key={c.id} className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1">
                                      <User className="h-3 w-3 text-slate-500" />
                                      <span>{c.name}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleOpenStaffModal(staff)}
                              className="px-3 py-1.5 bg-brand-navy hover:bg-slate-800 text-brand-gold text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                            >
                              <UserPlus className="h-3.5 w-3.5 text-brand-gold" />
                              <span>Manage Client Portfolio</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: ALLOCATION MATRIX */}
              {allocSubView === 'matrix' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                        <Grid className="h-4 w-4 text-brand-gold-dark" />
                        <span>Interactive Client-Staff Allocation Matrix</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Check cells to allocate multiple Attorneys, Conveyancers, and Paralegals to multiple Clients.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAutoDistribute}
                        className="px-3 py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-amber-300"
                      >
                        Auto-Balance Staff
                      </button>
                      <button
                        onClick={handleSaveMatrix}
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-brand-navy text-brand-gold hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
                      >
                        {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        <span>Save Matrix Changes</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3 border-b border-slate-800 sticky left-0 bg-slate-900 z-10 w-48">
                            Client Account
                          </th>
                          {legalStaff.map(staff => (
                            <th key={staff.id} className="p-3 border-b border-slate-800 text-center min-w-[120px]">
                              <div>{staff.name}</div>
                              <div className={`text-[9px] font-normal capitalize ${
                                staff.role === 'attorney' ? 'text-blue-300' :
                                staff.role === 'conveyancer' ? 'text-amber-300' : 'text-emerald-300'
                              }`}>
                                ({staff.role})
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {clients.map(client => {
                          const currentAllocations = matrixState[client.id] || [];
                          return (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <img
                                    src={client.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                    alt={client.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">{client.name}</div>
                                    <div className="text-[10px] text-slate-400 capitalize">{client.role}</div>
                                  </div>
                                </div>
                              </td>

                              {legalStaff.map(staff => {
                                const isChecked = currentAllocations.includes(staff.id);
                                return (
                                  <td key={staff.id} className="p-3 text-center border-r border-slate-100">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const updated = { ...matrixState };
                                        const list = updated[client.id] || [];
                                        if (e.target.checked) {
                                          updated[client.id] = [...list, staff.id];
                                        } else {
                                          updated[client.id] = list.filter(id => id !== staff.id);
                                        }
                                        setMatrixState(updated);
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-gold cursor-pointer"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITY HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>30-Day Portal Logins</span>
                    <Zap className="h-4 w-4 text-brand-gold-dark" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{total30DayLogins}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold font-mono">
                    +18.4% user session velocity
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Avg Review Speed</span>
                    <Clock className="h-4 w-4 text-brand-gold-dark" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{avg30DayReviewTime} Mins</p>
                  <p className="text-[10px] text-brand-gold-dark font-semibold font-mono">
                    Per legal document verification
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Docs Processed</span>
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-brand-navy">{totalDocsReviewed}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold font-mono">
                    Verified across 30 days
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-2">
                      <TrendingUp className="h-4.5 w-4.5 text-brand-gold-dark" />
                      <span>Portal Login Frequency & Document Review Duration (Last 30 Days)</span>
                    </h3>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#1e293b' }} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#d97706' }} axisLine={false} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-brand-navy text-white p-3 rounded-lg shadow-2xl border border-slate-700 text-xs space-y-1">
                              <p className="font-mono text-brand-gold font-bold">{d.dayName}, {d.date}</p>
                              <p>Portal Logins: {d.logins} sessions</p>
                              <p>Avg Review Time: {d.reviewTimeAvg} mins</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar yAxisId="left" dataKey="logins" name="Portal Logins" fill="#0f172a" radius={[3, 3, 0, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.intensity >= 4 ? '#112815' : entry.intensity === 3 ? '#1e293b' : '#334155'} />
                        ))}
                      </Bar>
                      <Area yAxisId="right" type="monotone" dataKey="reviewTimeAvg" fill="#fef3c7" stroke="#d97706" strokeWidth={2} fillOpacity={0.4} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER ACCOUNTS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-2">
                <Users className="w-4 h-4 text-brand-gold-dark"/>
                <span>System Registered Users Directory</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                      <th className="p-3">User & Email</th>
                      <th className="p-3">Assigned System Role</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {usersList.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">
                          {user.name} <span className="text-slate-500 font-normal">({user.email})</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <select 
                              value={selectedRoleMap[user.id] || user.role}
                              onChange={(e) => setSelectedRoleMap({...selectedRoleMap, [user.id]: e.target.value})}
                              className="border border-slate-300 p-1 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold capitalize"
                            >
                              <option value="buyer">Buyer</option>
                              <option value="seller">Seller</option>
                              <option value="attorney">Attorney</option>
                              <option value="conveyancer">Conveyancer</option>
                              <option value="paralegal">Paralegal</option>
                              <option value="admin">Admin</option>
                              <option value="other">Other</option>
                            </select>
                            <button 
                              onClick={() => handleAllocateRole(user.id)} 
                              className="text-xs bg-brand-navy text-brand-gold px-2.5 py-1 rounded font-bold cursor-pointer hover:bg-brand-navy/90"
                            >
                              Save Role
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => onDeleteUser?.(user.id)} 
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-2">
                <Shield className="w-4 h-4 text-brand-gold-dark"/>
                <span>Immutable System Audit Logs</span>
              </h3>
              <div className="bg-brand-navy text-slate-300 rounded-xl p-4 font-mono text-[11px] h-96 overflow-y-auto space-y-2 border border-slate-800">
                {auditLogs.map(log => (
                  <div key={log.id} className="border-b border-slate-800 pb-2">
                    <div className="flex justify-between text-brand-gold font-bold">
                      <span>[{log.timestamp}] {log.action}</span>
                      <span>{log.ipAddress}</span>
                    </div>
                    <p className="text-white mt-1 font-sans">{log.details}</p>
                    <div className="text-slate-500 mt-1">Actor: {log.userName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUTOMATION RULES */}
          {activeTab === 'automation' && (
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-2">
                <Bell className="w-4 h-4 text-brand-gold-dark"/>
                <span>Automated Workflow Dispatch Triggers</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {automationRules.map(rule => (
                  <div key={rule.id} className="border border-slate-200/80 p-4 rounded-xl shadow-sm bg-slate-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-xs">{rule.name}</h4>
                      <button 
                        onClick={() => onToggleRule(rule.id)} 
                        className={`text-[10px] px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                          rule.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 font-sans leading-relaxed">{rule.template}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLIENT ALLOCATION MODAL */}
      {modalClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={modalClient.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={modalClient.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Allocate Legal Team to {modalClient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select multiple Attorneys, Conveyancers, and Paralegals for this client.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalClient(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Attorneys Section */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1.5 bg-blue-50 p-2 rounded-lg">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Attorneys ({attorneys.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {attorneys.map(a => {
                    const isChecked = modalDraftStaffIds.includes(a.id);
                    return (
                      <label 
                        key={a.id} 
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img src={a.avatarUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{a.name}</div>
                            <div className="text-[10px] text-slate-500">{a.email}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalDraftStaffIds([...modalDraftStaffIds, a.id]);
                            } else {
                              setModalDraftStaffIds(modalDraftStaffIds.filter(id => id !== a.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Conveyancers Section */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1.5 bg-amber-50 p-2 rounded-lg">
                  <Briefcase className="h-4 w-4 text-amber-600" />
                  <span>Conveyancers ({conveyancers.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {conveyancers.map(c => {
                    const isChecked = modalDraftStaffIds.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img src={c.avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{c.name}</div>
                            <div className="text-[10px] text-slate-500">{c.email}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalDraftStaffIds([...modalDraftStaffIds, c.id]);
                            } else {
                              setModalDraftStaffIds(modalDraftStaffIds.filter(id => id !== c.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Paralegals Section */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 bg-emerald-50 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span>Paralegals ({paralegals.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {paralegals.map(p => {
                    const isChecked = modalDraftStaffIds.includes(p.id);
                    return (
                      <label 
                        key={p.id} 
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.email}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalDraftStaffIds([...modalDraftStaffIds, p.id]);
                            } else {
                              setModalDraftStaffIds(modalDraftStaffIds.filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold">
                {modalDraftStaffIds.length} staff member(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setModalClient(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClientAllocation}
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-navy hover:bg-slate-800 text-brand-gold text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Allocations</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAFF PORTFOLIO ALLOCATION MODAL */}
      {modalStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={modalStaff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={modalStaff.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Manage Client Portfolio for {modalStaff.name} ({modalStaff.role})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Check clients to assign to this {modalStaff.role}.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalStaff(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {clients.map(c => {
                const isChecked = modalDraftClientIds.includes(c.id);
                return (
                  <label 
                    key={c.id} 
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isChecked ? 'bg-brand-navy/5 border-brand-navy ring-1 ring-brand-navy/20' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={c.avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.email} • {c.role}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setModalDraftClientIds([...modalDraftClientIds, c.id]);
                        } else {
                          setModalDraftClientIds(modalDraftClientIds.filter(id => id !== c.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-brand-navy focus:ring-brand-gold cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold">
                {modalDraftClientIds.length} client(s) allocated
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setModalStaff(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaffAllocation}
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-navy hover:bg-slate-800 text-brand-gold text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Portfolio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
