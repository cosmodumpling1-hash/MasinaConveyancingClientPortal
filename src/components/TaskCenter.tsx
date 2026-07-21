import React from 'react';
import { ClipboardList, Calendar, CheckCircle, Clock, Plus, User, AlertCircle, Sparkles } from 'lucide-react';
import { Task, User as UserType, DocumentCategory } from '../types';

interface TaskCenterProps {
  tasks: Task[];
  currentUser: UserType;
  matterId: string;
  allUsers: UserType[];
  onCreateTask: (taskData: {
    title: string;
    description: string;
    assignedToId: string;
    dueDate: string;
    requiresDocumentCategory?: DocumentCategory;
  }) => void;
  onCompleteTask: (taskId: string) => void;
}

export default function TaskCenter({ tasks, currentUser, matterId, allUsers, onCreateTask, onCompleteTask }: TaskCenterProps) {
  const [filter, setFilter] = React.useState<'pending' | 'completed'>('pending');
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Form state
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    requiresDocumentCategory: '' as DocumentCategory | ''
  });

  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';

  // Filter tasks belonging to current matter
  const matterTasks = tasks.filter(t => t.matterId === matterId);
  
  // Further filter by user role (clients only see tasks assigned to them)
  const visibleTasks = matterTasks.filter(t => {
    const matchesStatus = t.status === filter;
    if (isStaff) {
      return matchesStatus; // Staff can track all tasks
    }
    return matchesStatus && t.assignedToId === currentUser.id; // Clients see only their tasks
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId) {
      alert("Please fill in the task title and choose an assignee.");
      return;
    }
    onCreateTask({
      title: newTask.title,
      description: newTask.description,
      assignedToId: newTask.assignedToId,
      dueDate: newTask.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      requiresDocumentCategory: newTask.requiresDocumentCategory || undefined
    });
    setNewTask({
      title: '',
      description: '',
      assignedToId: '',
      dueDate: '',
      requiresDocumentCategory: ''
    });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6" id="task-center">
      {/* Task Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/60 shadow-premium">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === 'pending'
                ? 'bg-brand-navy text-white shadow-md border border-slate-800'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
            }`}
          >
            <Clock className="h-4 w-4 text-brand-gold" />
            <span>Outstanding ({matterTasks.filter(t => t.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === 'completed'
                ? 'bg-brand-navy text-white shadow-md border border-slate-800'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
            }`}
          >
            <CheckCircle className="h-4 w-4 text-brand-gold" />
            <span>Completed ({matterTasks.filter(t => t.status === 'completed').length})</span>
          </button>
        </div>

        {isStaff && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-brand-navy hover:bg-brand-navy/95 text-white text-xs font-bold px-4 py-2 rounded-lg border border-slate-800 shadow-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="h-4 w-4 text-brand-gold" />
            <span>Assign New Task</span>
          </button>
        )}
      </div>

      {/* Create Task Form (Staff Drawer) */}
      {showCreateForm && isStaff && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-xl border border-brand-gold/30 p-5 shadow-premium space-y-4 animate-fade-in">
          <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <Sparkles className="h-4 w-4 text-brand-gold" />
            <span>Add Conveyancing Action Mandate</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Task Title / Required Action</label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold focus:outline-none bg-brand-cream/15"
                placeholder="e.g. Upload 3 months salary deposit bank statements"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Assignee</label>
              <select
                required
                value={newTask.assignedToId}
                onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
              >
                <option value="">Select participant...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Detailed Instructions / Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full h-20 px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none bg-brand-cream/15"
                placeholder="Clarify specific FICA guidelines, target Deeds registry acts, or SAR tax criteria..."
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none bg-brand-cream/15"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Binds to Document Folder (Optional)</label>
              <select
                value={newTask.requiresDocumentCategory}
                onChange={(e) => setNewTask({ ...newTask, requiresDocumentCategory: e.target.value as DocumentCategory })}
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
              >
                <option value="">No folder binding required</option>
                <option value="identity">Identity Documents</option>
                <option value="fica">FICA proof of address</option>
                <option value="deed">Property Deeds</option>
                <option value="rates_clearance">Rates Clearance Certificates</option>
                <option value="financial">Financial bank accounts</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-navy hover:bg-brand-navy/95 text-white border border-slate-800 text-xs font-bold rounded shadow-sm"
            >
              Commit Task
            </button>
          </div>
        </form>
      )}

      {/* Task List container */}
      {visibleTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center text-slate-400 space-y-2 shadow-premium">
          <ClipboardList className="h-12 w-12 text-brand-gold/40 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No tasks currently logged.</p>
          <p className="text-xs text-slate-500">All pending compliance actions are fully cleared for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTasks.map((task) => {
            const isAssignedToCurrentUser = task.assignedToId === currentUser.id;
            
            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-5 shadow-premium flex flex-col justify-between transition-all ${
                  task.status === 'completed'
                    ? 'border-slate-150 opacity-80'
                    : isAssignedToCurrentUser
                    ? 'border-brand-gold/40 ring-2 ring-brand-gold/5 bg-brand-gold-light/5'
                    : 'border-slate-200/60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Ref: {task.matterNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      task.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-brand-navy leading-snug font-sans">{task.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                  
                  {task.requiresDocumentCategory && (
                    <div className="inline-flex items-center space-x-1 bg-brand-gold/10 text-brand-gold-dark text-[9px] font-bold px-2 py-0.5 rounded border border-brand-gold/15 uppercase tracking-wider font-sans">
                      <span>Binds to Folder: {task.requiresDocumentCategory.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 font-sans">
                  <div className="space-y-1">
                    <span className="flex items-center space-x-1">
                      <User className="h-3.5 w-3.5 text-brand-gold-dark" />
                      <span className="font-semibold text-slate-700">{task.assignedToName}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Due Date: {task.dueDate}</span>
                    </span>
                  </div>

                  {task.status === 'pending' && (isAssignedToCurrentUser || isStaff) && (
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className="bg-brand-navy hover:bg-brand-navy/95 text-white border border-slate-800 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-brand-gold" />
                      <span>Resolve Task</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
