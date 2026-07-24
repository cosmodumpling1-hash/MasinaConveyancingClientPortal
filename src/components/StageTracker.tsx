import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight, ArrowLeft, Landmark, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PropertyMatter, StageDetails, StageTask, User } from '../types';

interface StageTrackerProps {
  matter: PropertyMatter;
  currentUser: User;
  allUsers?: User[];
  onUpdateStage: (matterId: string, currentStage: number, lawyerNotes?: string, tasks?: StageTask[]) => void;
}

export default function StageTracker({ matter, currentUser, allUsers, onUpdateStage }: StageTrackerProps) {
  const [expandedStage, setExpandedStage] = React.useState<number>(matter.currentStage);
  const [editingNotes, setEditingNotes] = React.useState(false);
  const [lawyerNotesInput, setLawyerNotesInput] = React.useState('');

  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';

  const stages: StageDetails[] = React.useMemo(() => {
    if (!matter || !matter.stages) return [];
    if (Array.isArray(matter.stages)) return matter.stages;
    if (typeof matter.stages === 'string') {
      try {
        const parsed = JSON.parse(matter.stages);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse matter.stages JSON:", e);
      }
    }
    return [];
  }, [matter?.stages, matter]);

  React.useEffect(() => {
    setExpandedStage(matter.currentStage);
    const activeStage = stages.find(s => s.stageNumber === matter.currentStage);
    setLawyerNotesInput(activeStage?.lawyerNotes || '');
  }, [matter.currentStage, matter, stages]);

  const handleTaskToggle = (stageNumber: number, taskId: string) => {
    if (!isStaff) return; // Only staff can check off checklist tasks

    const stage = stages.find(s => s.stageNumber === stageNumber);
    if (!stage) return;

    const updatedTasks = stage.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined };
      }
      return t;
    });

    onUpdateStage(matter.id, matter.currentStage, stage.lawyerNotes, updatedTasks);
  };

  const handleNotesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStage(matter.id, matter.currentStage, lawyerNotesInput, undefined);
    setEditingNotes(false);
  };

  const advanceStage = () => {
    if (matter.currentStage < 8) {
      onUpdateStage(matter.id, matter.currentStage + 1);
    }
  };

  const revertStage = () => {
    if (matter.currentStage > 1) {
      onUpdateStage(matter.id, matter.currentStage - 1);
    }
  };

  // Stage details list (8 standard South African conveyancing stages)
  const stageDescriptions = [
    { num: 1, name: "OTP Received" },
    { num: 2, name: "Contract Review" },
    { num: 3, name: "FICA & Compliance" },
    { num: 4, name: "Due Diligence" },
    { num: 5, name: "Transfer Prep" },
    { num: 6, name: "Lodgement" },
    { num: 7, name: "Registration" },
    { num: 8, name: "Finalisation" }
  ];

  return (
    <div className="space-y-6" id="stage-tracker">
      {/* 1. Progress Bar / Stepper (Horizontal) */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
            Conveyancing Progress Index
          </h3>
          <span className="text-[11px] font-bold bg-brand-gold/10 text-brand-gold-dark px-2.5 py-1 rounded-full border border-brand-gold/15">
            Active: Stage {matter.currentStage}/8 — {stages.find(s => s.stageNumber === matter.currentStage)?.name || 'Stage ' + matter.currentStage}
          </span>
        </div>

        {/* Stepper container */}
        <div className="relative flex justify-between items-center mt-6">
          <div className="absolute left-0 right-0 h-1 bg-slate-100 top-4 z-0"></div>
          {/* Progress bar line overlay */}
          <div
            className="absolute left-0 h-1 bg-brand-gold top-4 z-0 transition-all duration-500"
            style={{ width: `${((matter.currentStage - 1) / 7) * 100}%` }}
          ></div>

          {stageDescriptions.map((stg) => {
            const isCompleted = stg.num < matter.currentStage;
            const isActive = stg.num === matter.currentStage;
            
            return (
              <button
                key={stg.num}
                onClick={() => setExpandedStage(stg.num)}
                className="relative z-10 flex flex-col items-center focus:outline-none group"
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-brand-navy border-brand-navy text-brand-gold'
                      : isActive
                      ? 'bg-white border-brand-gold text-brand-gold-dark shadow-md ring-4 ring-brand-gold/10'
                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5 text-brand-gold" /> : stg.num}
                </div>
                <span
                  className={`hidden md:block text-[10px] font-bold mt-2 text-center max-w-[80px] leading-tight ${
                    isActive ? 'text-brand-navy font-extrabold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stg.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Staff Timeline Administrator Actions */}
        {isStaff && (
          <div className="border-t border-slate-100 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Staff Tools: Update conveyancing timeline sequence.
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={matter.currentStage === 1}
                onClick={revertStage}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Revert Stage</span>
              </button>
              <button
                disabled={matter.currentStage === 8}
                onClick={advanceStage}
                className="px-4.5 py-1.5 bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Advance Stage</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand-gold" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Expanded Stage Details card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main expanded card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-premium p-6 space-y-6">
          {(() => {
            const currentStageDetails = stages.find(s => s.stageNumber === expandedStage);
            if (!currentStageDetails) return null;

            const isCompleted = expandedStage < matter.currentStage;
            const isActive = expandedStage === matter.currentStage;
            const pendingClientTasks = currentStageDetails.tasks.filter(t => !t.completed && t.assignedTo === 'client');

            return (
              <>
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-brand-gold-dark tracking-wider">
                      Stage {expandedStage} Description
                    </span>
                    <h3 className="text-lg font-serif font-bold text-brand-navy mt-0.5">
                      {currentStageDetails.name}
                    </h3>
                  </div>
                  <div>
                    {isCompleted ? (
                      <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Completed</span>
                    ) : isActive ? (
                      <span className="bg-brand-navy text-brand-gold ring-1 ring-brand-gold/30 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Active Progress</span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 ring-1 ring-slate-200 text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider">Not Started</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-brand-cream/40 p-4 rounded-lg border border-slate-150">
                  {currentStageDetails.description || "The Deeds Registries Act requires meticulous reviews of physical transfer records prior to submission."}
                </p>

                {/* Tasks checklist per stage */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Required Compliance Checklists</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-lg overflow-hidden bg-white shadow-sm">
                    {currentStageDetails.tasks && currentStageDetails.tasks.length > 0 ? (
                      currentStageDetails.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskToggle(expandedStage, task.id)}
                          className={`p-3.5 flex items-start space-x-3 text-xs transition-colors ${
                            isStaff ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Assigned to: <span className="font-bold text-brand-gold-dark uppercase tracking-wider">{task.assignedTo}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 italic">No checklist tasks assigned for this stage.</div>
                    )}
                  </div>
                  {isStaff && (
                    <p className="text-[10px] text-slate-400 italic font-mono">
                      💡 Click any checklist row above to toggle task completion.
                    </p>
                  )}
                </div>

                {/* Client Actions Callout */}
                {pendingClientTasks.length > 0 && (
                  <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Attention Required from Client</h4>
                      <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                        There are outstanding actions assigned to the client for this stage:
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-amber-700 mt-1 font-semibold space-y-1">
                        {pendingClientTasks.map(t => (
                          <li key={t.id}>{t.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Lawyer notes sidebar */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 text-brand-gold-dark" />
              <span className="font-sans">Attorneys Advisory Annotations</span>
            </h4>
            
            {editingNotes ? (
              <form onSubmit={handleNotesSubmit} className="space-y-3">
                <textarea
                  value={lawyerNotesInput}
                  onChange={(e) => setLawyerNotesInput(e.target.value)}
                  className="w-full h-36 p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-navy bg-brand-cream/10"
                  placeholder="Provide timeline feedback, legal advice, or clarify missing parameters..."
                />
                <div className="flex justify-end space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingNotes(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-brand-navy hover:bg-brand-navy/95 text-white border border-slate-800 text-xs font-bold rounded"
                  >
                    Save Notes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="bg-brand-cream/30 border border-slate-200/40 rounded-lg p-3.5 text-xs text-slate-600 italic leading-relaxed whitespace-pre-line min-h-[140px] shadow-inner">
                  {lawyerNotesInput ? `"${lawyerNotesInput}"` : "No advice notes currently published by the lawyer for this stage."}
                </div>
                {isStaff && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="w-full py-1.5 bg-brand-navy text-white hover:bg-brand-navy/95 border border-slate-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Edit Advisory Notes
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-sans">
            <div className="flex justify-between text-slate-500">
              <span>Expected Completion:</span>
              <span className="font-semibold text-slate-700">{matter.expectedCompletionDate}</span>
            </div>

            {/* Allocated Legal Staff Team */}
            {(() => {
              const clientUser = allUsers?.find(u => u.id === matter.buyerId || u.id === matter.sellerId) || currentUser;
              const allocatedStaff = allUsers?.filter(u => (clientUser.allocatedStaffIds || []).includes(u.id)) || [];
              const attorneys = allocatedStaff.filter(u => u.role === 'attorney');
              const conveyancers = allocatedStaff.filter(u => u.role === 'conveyancer');
              const paralegals = allocatedStaff.filter(u => u.role === 'paralegal');

              if (allocatedStaff.length === 0) {
                return (
                  <div className="flex justify-between text-slate-500">
                    <span>Lead Attorney:</span>
                    <span className="font-semibold text-slate-700">{matter.assignedAttorneyName}</span>
                  </div>
                );
              }

              return (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Allocated Legal Team ({allocatedStaff.length})
                  </div>

                  {attorneys.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-blue-700 font-bold block">⚖️ Attorneys:</span>
                      <div className="flex flex-wrap gap-1">
                        {attorneys.map(a => (
                          <span key={a.id} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {conveyancers.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-700 font-bold block">📜 Conveyancers:</span>
                      <div className="flex flex-wrap gap-1">
                        {conveyancers.map(c => (
                          <span key={c.id} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {paralegals.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-700 font-bold block">📋 Paralegals:</span>
                      <div className="flex flex-wrap gap-1">
                        {paralegals.map(p => (
                          <span key={p.id} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
