import React from 'react';
import { Folder, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Eye, Search, Calendar, User, CornerDownRight, Check, X, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { Document, DocumentCategory, User as UserType } from '../types';

interface DocumentManagerProps {
  documents: Document[];
  currentUser: UserType;
  matterId: string;
  onUpload: (docData: { name: string; category: DocumentCategory }) => void;
  onReview: (docId: string, status: 'approved' | 'rejected', notes: string) => void;
}

export default function DocumentManager({ documents, currentUser, matterId, onUpload, onReview }: DocumentManagerProps) {
  const [selectedFolder, setSelectedFolder] = React.useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [reviewNotes, setReviewNotes] = React.useState<{ [key: string]: string }>({});
  const [uploadCategory, setUploadCategory] = React.useState<DocumentCategory>('fica');
  const [simulatedFileName, setSimulatedFileName] = React.useState('');
  
  // Custom document requirements checklist for transfer compliance
  const folders: { id: DocumentCategory; label: string; count: number; required: boolean }[] = [
    { id: 'identity', label: 'Identity Documents', count: documents.filter(d => d.category === 'identity').length, required: true },
    { id: 'fica', label: 'FICA Documents', count: documents.filter(d => d.category === 'fica').length, required: true },
    { id: 'sale_agreement', label: 'Sale Agreements', count: documents.filter(d => d.category === 'sale_agreement').length, required: true },
    { id: 'deed', label: 'Property Deeds', count: documents.filter(d => d.category === 'deed').length, required: true },
    { id: 'rates_clearance', label: 'Rates Clearance Certificates', count: documents.filter(d => d.category === 'rates_clearance').length, required: true },
    { id: 'financial', label: 'Financial Records', count: documents.filter(d => d.category === 'financial').length, required: true },
    { id: 'transfer', label: 'Transfer Documents', count: documents.filter(d => d.category === 'transfer').length, required: true }
  ];

  // Filter documents based on folder and search query
  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = selectedFolder === 'all' || doc.category === selectedFolder;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"><CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> <span>Approved</span></span>;
      case 'rejected':
        return <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"><XCircle className="h-3.5 w-3.5 text-rose-600" /> <span>Rejected</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 bg-brand-gold/10 text-brand-gold-dark ring-1 ring-brand-gold-dark/25 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"><AlertTriangle className="h-3.5 w-3.5 text-brand-gold-dark" /> <span>Awaiting Review</span></span>;
    }
  };

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedFileName) {
      alert("Please enter a simulated file name or drag a local asset.");
      return;
    }
    onUpload({
      name: simulatedFileName.endsWith('.pdf') || simulatedFileName.endsWith('.png') || simulatedFileName.endsWith('.jpg') ? simulatedFileName : `${simulatedFileName}.pdf`,
      category: uploadCategory
    });
    setSimulatedFileName('');
  };

  const selectPresetUpload = (preset: string, category: DocumentCategory) => {
    setSimulatedFileName(preset);
    setUploadCategory(category);
  };

  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';

  return (
    <div className="space-y-6" id="document-manager">
      {/* Overview Grid with automatic missing documents alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance checklist */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 font-sans border-b border-slate-100 pb-2">
            <CheckCircle className="h-5 w-5 text-brand-gold-dark" />
            <span>FICA Conveyancing Document Checklist</span>
          </h3>
          <p className="text-xs text-slate-500">
            Automated checklist generated based on SARS and deeds registry requirements. Complete uploads of required documents to progress from Stage 3 to Stage 4.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {folders.map(folder => {
              const uploadedDocs = documents.filter(d => d.category === folder.id);
              const approvedDocs = uploadedDocs.filter(d => d.status === 'approved');
              const isApproved = approvedDocs.length > 0;
              const hasPending = uploadedDocs.filter(d => d.status === 'pending_review').length > 0;
              
              let statusText = 'Outstanding document';
              let statusColor = 'text-rose-600 bg-rose-50 border-rose-100/80';
              if (isApproved) {
                statusText = 'Verified & Clear';
                statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100/80';
              } else if (hasPending) {
                statusText = 'Awaiting staff review';
                statusColor = 'text-amber-700 bg-amber-50 border-amber-100/80';
              }

              return (
                <div key={folder.id} className={`border p-3 rounded-lg flex items-start justify-between text-xs transition-all ${statusColor}`}>
                  <div className="space-y-1">
                    <p className="font-bold">{folder.label}</p>
                    <p className="text-[10px] font-medium opacity-80">{statusText}</p>
                  </div>
                  <div>
                    {isApproved ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : hasPending ? (
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Document Alerts and upload center */}
        <div className="bg-brand-navy text-white rounded-xl p-5 shadow-premium border border-brand-gold/15 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center space-x-1 font-mono">
              <Upload className="h-4 w-4" />
              <span>Secure Digital Filing</span>
            </h3>
            <h4 className="text-base font-serif font-bold text-slate-100">Document Upload Port</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload electronic assets (PDF, JPG, PNG, or Word docs). Submissions are instantly signed with an audit signature and encrypted in our deeds cloud.
            </p>
          </div>

          <form onSubmit={handleSimulatedUpload} className="space-y-3 mt-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Category Directory</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                className="w-full bg-brand-blue-slate text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">File Name</label>
              <input
                type="text"
                value={simulatedFileName}
                onChange={(e) => setSimulatedFileName(e.target.value)}
                placeholder="e.g. Utility_Bill_June_2026.pdf"
                className="w-full bg-brand-blue-slate text-xs text-white px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-bold text-xs py-2 rounded transition-colors flex items-center justify-center space-x-1"
            >
              <Upload className="h-3.5 w-3.5 text-brand-gold" />
              <span>Upload Document</span>
            </button>
          </form>

          {/* Quick Upload Sandbox Presets */}
          <div className="mt-4 border-t border-slate-800 pt-3">
            <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1.5">Sandbox Upload Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => selectPresetUpload('Municipal_Water_Electricity_Invoice.pdf', 'fica')}
                className="bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-850"
              >
                + Municipal Address Proof
              </button>
              <button
                type="button"
                onClick={() => selectPresetUpload('Certified_SARS_Tax_Clearance.pdf', 'financial')}
                className="bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-850"
              >
                + SARS Tax clearance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Folder Explorer & Documents List */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium overflow-hidden">
        {/* Search and control bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-3 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedFolder === 'all'
                  ? 'bg-brand-navy text-white border border-slate-800 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
              }`}
            >
              All Folders ({documents.length})
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedFolder === f.id
                    ? 'bg-brand-navy text-white border border-slate-800 shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm'
                }`}
              >
                <Folder className={`h-3.5 w-3.5 ${selectedFolder === f.id ? 'text-brand-gold' : 'text-slate-400'}`} />
                <span>{f.label} ({f.count})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search secure database..."
              className="pl-9 pr-4 py-1.5 w-full sm:w-64 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-white"
            />
          </div>
        </div>

        {/* Documents Table / Card List */}
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Folder className="h-12 w-12 text-brand-gold/40 mx-auto" />
            <p className="text-sm font-semibold">No secure documents found.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">This folder directory is currently empty. Use the digital filing upload box above to transmit credentials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-150">
                  <th className="p-4">Document Details</th>
                  <th className="p-4">Size & Version</th>
                  <th className="p-4">Upload History</th>
                  <th className="p-4">Status & Clearances</th>
                  {isStaff && <th className="p-4 text-right">Attorney Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map(doc => {
                  const uploaderLabel = doc.uploadedBy.startsWith('usr-') ? (doc.uploadedBy === currentUser.id ? 'You' : 'Staff/Client') : doc.uploadedBy;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-brand-gold/10 text-brand-gold-dark p-2 rounded-lg border border-brand-gold/15">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-sm leading-tight">{doc.name}</span>
                            <span className="text-[10px] uppercase font-bold text-brand-gold-dark block mt-0.5 tracking-wider font-mono">{doc.category} folder</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-600 block">{doc.size}</span>
                        <span className="text-[10px] text-slate-400 font-mono">v{doc.version}.0 Digital Copy</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="space-y-1">
                          <p className="flex items-center space-x-1">
                            <User className="h-3.5 w-3.5 text-brand-gold-dark" />
                            <span className="font-medium text-slate-750">{uploaderLabel}</span>
                          </p>
                          <p className="flex items-center space-x-1 text-[10px] text-slate-450 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(doc.uploadDate).toLocaleString()}</span>
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {getStatusBadge(doc.status)}
                          {doc.reviewerNotes && (
                            <div className="flex items-start space-x-1 text-[10px] text-rose-600 mt-1.5 italic font-medium max-w-xs">
                              <CornerDownRight className="h-3 w-3 shrink-0 mt-0.5 animate-bounce animate-duration-[2000ms]" />
                              <span>Notes: "{doc.reviewerNotes}"</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Lawyer Actions */}
                      {isStaff && (
                        <td className="p-4 text-right">
                          {doc.status === 'pending_review' ? (
                            <div className="flex items-center justify-end space-x-2">
                              <input
                                type="text"
                                value={reviewNotes[doc.id] || ''}
                                onChange={(e) => setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })}
                                placeholder="Add review notes..."
                                className="px-2 py-1 border border-slate-200 rounded text-[10px] w-36 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                              />
                              <button
                                onClick={() => onReview(doc.id, 'approved', reviewNotes[doc.id] || 'FICA requirements verified.')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded transition-colors"
                                title="Approve Document"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onReview(doc.id, 'rejected', reviewNotes[doc.id] || 'Insufficient clearance. Re-upload requested.')}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded transition-colors"
                                title="Reject Document"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
