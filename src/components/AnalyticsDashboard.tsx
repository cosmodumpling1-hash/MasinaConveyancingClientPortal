import React from 'react';
import { BarChart2, TrendingUp, Clock, AlertCircle, FileText, CheckCircle, Scale, Star, Smile } from 'lucide-react';
import { PropertyMatter, Document, Task } from '../types';

interface AnalyticsDashboardProps {
  matters: PropertyMatter[];
  documents: Document[];
  tasks: Task[];
}

export default function AnalyticsDashboard({ matters, documents, tasks }: AnalyticsDashboardProps) {
  // Analytical processing
  const activeMatters = matters.filter(m => m.status === 'active');
  const outstandingDocs = documents.filter(d => d.status === 'pending_review');
  const outstandingTasks = tasks.filter(t => t.status === 'pending');

  // Staff workload compilation
  const lawyerWorkloads = [
    { name: 'Arthur Masina', role: 'Attorney', mattersCount: 4, tasksCount: 5, rating: 4.9 },
    { name: 'Clara Convey', role: 'Conveyancer', mattersCount: 2, tasksCount: 3, rating: 4.8 },
    { name: 'Pamela Paralegal', role: 'Paralegal', mattersCount: 3, tasksCount: 8, rating: 4.7 }
  ];

  // Distribution counts for the Donut Chart
  const distribution = [
    { label: 'OTP Received', count: matters.filter(m => m.currentStage === 1).length, color: 'bg-indigo-500' },
    { label: 'FICA Compliance', count: matters.filter(m => m.currentStage === 3).length, color: 'bg-indigo-600' },
    { label: 'Lodgement', count: matters.filter(m => m.currentStage === 6).length, color: 'bg-sky-500' },
    { label: 'Complete / Archived', count: matters.filter(m => m.status === 'completed').length + 12, color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-6" id="analytics-dashboard">
      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Active Matters</span>
            <Scale className="h-4 w-4 text-brand-gold-dark" />
          </div>
          <p className="text-2xl font-serif font-bold text-brand-navy">{activeMatters.length}</p>
          <div className="text-[10px] text-brand-gold-dark font-semibold">Active Conveyancing queues</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Completed Transfers</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-brand-navy">14</p>
          <div className="text-[10px] text-emerald-700 font-semibold">Registered this fiscal cycle</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Document Backlog</span>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-brand-navy">{outstandingDocs.length}</p>
          <div className="text-[10px] text-amber-700 font-semibold">Awaiting deeds validation</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Average Cycle</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-brand-navy">68 Days</p>
          <div className="text-[10px] text-rose-700 font-semibold">Below standard deeds KPI (75d)</div>
        </div>
      </div>

      {/* Main Charts & Workload grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Custom Interactive Workload Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-brand-gold-dark" />
              <span>Attorney Workloads & Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Relative distribution index</span>
          </div>

          {/* SVG Bar Chart rendering */}
          <div className="p-4 bg-brand-cream/15 rounded-xl border border-slate-200/50">
            <svg viewBox="0 0 450 160" className="w-full h-auto">
              {/* Grid lines */}
              <line x1="60" y1="20" x2="420" y2="20" stroke="#FAFBF7" strokeDasharray="3,3" />
              <line x1="60" y1="60" x2="420" y2="60" stroke="#FAFBF7" strokeDasharray="3,3" />
              <line x1="60" y1="100" x2="420" y2="100" stroke="#FAFBF7" strokeDasharray="3,3" />
              <line x1="60" y1="140" x2="420" y2="140" stroke="#76935C" strokeWidth="1.5" />

              {/* Data Bars */}
              {/* Bar 1: Arthur */}
              <rect x="90" y="40" width="36" height="100" rx="2" fill="#112815" className="transition-all hover:opacity-90" />
              <rect x="130" y="70" width="12" height="70" rx="1.5" fill="#76935C" />

              {/* Bar 2: Clara */}
              <rect x="210" y="80" width="36" height="60" rx="2" fill="#2d3748" className="transition-all hover:opacity-90" />
              <rect x="250" y="100" width="12" height="40" rx="1.5" fill="#76935C" opacity="0.6" />

              {/* Bar 3: Pamela */}
              <rect x="330" y="50" width="36" height="90" rx="2" fill="#1e293b" className="transition-all hover:opacity-90" />
              <rect x="370" y="30" width="12" height="110" rx="1.5" fill="#76935C" />

              {/* Axis Labels */}
              <text x="115" y="155" fill="#112815" fontSize="10" textAnchor="middle" fontWeight="bold">Arthur (Atty)</text>
              <text x="235" y="155" fill="#112815" fontSize="10" textAnchor="middle" fontWeight="bold">Clara (Convey)</text>
              <text x="355" y="155" fill="#112815" fontSize="10" textAnchor="middle" fontWeight="bold">Pamela (Para)</text>
              
              <text x="45" y="24" fill="#76935C" fontSize="8" textAnchor="end" fontWeight="bold">Max limit</text>
              <text x="45" y="64" fill="#a1a1aa" fontSize="8" textAnchor="end">Moderate</text>
              <text x="45" y="104" fill="#a1a1aa" fontSize="8" textAnchor="end">Low load</text>
            </svg>

            {/* Legend indicators */}
            <div className="flex justify-center space-x-6 mt-4 text-[10px] font-semibold font-sans">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 bg-brand-navy rounded"></span>
                <span className="text-slate-600">Active Matters</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 bg-brand-gold rounded"></span>
                <span className="text-slate-600">Tasks Queue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution Donut panel */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium flex flex-col justify-between">
          <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center space-x-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-brand-gold-dark" />
            <span>Matter Stage Share</span>
          </h3>

          <div className="flex justify-center py-4">
            {/* Visual Custom Donut representation */}
            <div className="relative h-28 w-28 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FAFBF7" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#112815" strokeWidth="3" strokeDasharray="60 40" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#76935C" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="60" />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-serif font-bold text-brand-navy">16</span>
                <span className="text-[8px] uppercase font-bold text-slate-400 block mt-0.5 font-mono">Total cases</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-[10px] font-bold">
            {distribution.map(d => {
              // override generic colors for Professional theme
              let brandColor = d.color;
              if (d.color.includes('indigo')) brandColor = 'bg-brand-navy';
              else if (d.color.includes('emerald') || d.color.includes('sky')) brandColor = 'bg-brand-gold';
              return (
                <div key={d.label} className="flex justify-between items-center p-1.5 rounded hover:bg-slate-50 font-sans">
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${brandColor}`}></span>
                    <span className="text-slate-600 font-medium">{d.label}</span>
                  </div>
                  <span className="text-slate-900 font-mono">{d.count} files</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff and Team Rating Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium p-5 space-y-4">
        <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
          <Smile className="h-4.5 w-4.5 text-brand-gold-dark" />
          <span>Client Satisfaction Ratings & Lawyers List</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-cream/20 border-b border-slate-200/60 font-bold uppercase text-slate-600 font-sans">
                <th className="p-3">Practitioner</th>
                <th className="p-3">Matters Managed</th>
                <th className="p-3">Tasks Checked</th>
                <th className="p-3">Review Feedback Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {lawyerWorkloads.map(staff => (
                <tr key={staff.name} className="hover:bg-brand-cream/10 transition-colors">
                  <td className="p-3">
                    <div>
                      <span className="font-serif font-bold text-brand-navy block text-sm">{staff.name}</span>
                      <span className="text-[9px] text-brand-gold-dark uppercase font-mono font-bold tracking-wider">{staff.role}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-800 font-sans font-semibold">{staff.mattersCount} active cases</td>
                  <td className="p-3 text-slate-500 font-sans">{staff.tasksCount} actions cleared</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1 text-brand-gold-dark font-bold font-mono">
                      <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" />
                      <span>{staff.rating} / 5.0 Rating</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
