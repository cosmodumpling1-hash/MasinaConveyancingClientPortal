import React from 'react';
import { Folder, Upload, FileText, CheckCircle, XCircle, AlertTriangle, Eye, Search, Calendar, User, CornerDownRight, Check, X, ShieldAlert, Sparkles, Send, File, Download, HardDrive } from 'lucide-react';
import { Document, DocumentCategory, User as UserType } from '../types';

interface DocumentManagerProps {
  documents: Document[];
  currentUser: UserType;
  matterId: string;
  onUpload: (docData: { name: string; category: DocumentCategory; fileUrl?: string; size?: string }) => void;
  onReview: (docId: string, status: 'approved' | 'rejected', notes: string) => void;
}

export default function DocumentManager({ documents, currentUser, matterId, onUpload, onReview }: DocumentManagerProps) {
  const [selectedFolder, setSelectedFolder] = React.useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [reviewNotes, setReviewNotes] = React.useState<{ [key: string]: string }>({});
  const [uploadCategory, setUploadCategory] = React.useState<DocumentCategory>('fica');
  
  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [customFileName, setCustomFileName] = React.useState('');
  const [fileDataUrl, setFileDataUrl] = React.useState<string>('');
  const [formattedFileSize, setFormattedFileSize] = React.useState<string>('1.5 MB');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
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

  const processFile = (file: File) => {
    setSelectedFile(file);
    setCustomFileName(file.name);
    
    // Format file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB < 1) {
      setFormattedFileSize(`${Math.round(file.size / 1024)} KB`);
    } else {
      setFormattedFileSize(`${sizeInMB.toFixed(1)} MB`);
    }

    // Auto select category if keywords match
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('id') || lowerName.includes('passport') || lowerName.includes('identity')) {
      setUploadCategory('identity');
    } else if (lowerName.includes('fica') || lowerName.includes('utility') || lowerName.includes('invoice') || lowerName.includes('address')) {
      setUploadCategory('fica');
    } else if (lowerName.includes('sale') || lowerName.includes('otp') || lowerName.includes('agreement')) {
      setUploadCategory('sale_agreement');
    } else if (lowerName.includes('deed') || lowerName.includes('title')) {
      setUploadCategory('deed');
    } else if (lowerName.includes('rates') || lowerName.includes('clearance') || lowerName.includes('municipal')) {
      setUploadCategory('rates_clearance');
    } else if (lowerName.includes('tax') || lowerName.includes('bank') || lowerName.includes('sars') || lowerName.includes('financial')) {
      setUploadCategory('financial');
    }

    // Read file data URL for inline preview / downloading
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileDataUrl(e.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileNameToUse = customFileName.trim();
    if (!fileNameToUse) {
      alert("Please select a file or enter a document name.");
      return;
    }

    const finalName = fileNameToUse.match(/\.[a-zA-Z0-9]+$/)
      ? fileNameToUse
      : `${fileNameToUse}.pdf`;

    setIsUploading(true);
    let finalUrl = fileDataUrl || '#';

    try {
      if (fileDataUrl && fileDataUrl.startsWith('data:')) {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile?.name || finalName,
            fileData: fileDataUrl,
            bucketName: 'mdocs',
            folder: uploadCategory
          })
        });
        const storageData = await res.json();
        if (storageData.url) {
          finalUrl = storageData.url;
        }
      }

      onUpload({
        name: finalName,
        category: uploadCategory,
        fileUrl: finalUrl,
        size: formattedFileSize
      });

      setUploadSuccessMsg(`Successfully uploaded "${finalName}" to Cloud Storage ('mdocs')!`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);

      // Reset state
      setSelectedFile(null);
      setCustomFileName('');
      setFileDataUrl('');
      setFormattedFileSize('1.5 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error("Document storage upload failed:", err);
      alert("Failed to upload document to the system storage.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectPresetUpload = (presetName: string, category: DocumentCategory) => {
    setCustomFileName(presetName);
    setUploadCategory(category);
    setFormattedFileSize('1.2 MB');
    // Set a valid minimal base64 PDF representation from the database simulation
    setFileDataUrl('data:application/pdf;base64,JVBERi0xLjUKMSAwIG9iaj88L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoTWFzaW5hIExhdyAtIENvbnZleWFuY2luZyBEb2N1bWVudCkgVGogRVQKZW5kc3RyZWFtZW5kb2JqeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjEyIDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G');
    setSelectedFile(null);
  };

  const isStaff = currentUser.role !== 'buyer' && currentUser.role !== 'seller';

  return (
    <div className="space-y-6" id="document-manager">
      {/* Overview Grid with automatic missing documents alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance checklist */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 p-5 shadow-premium space-y-4">
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

        {/* Document Upload Port (Drag & Drop + File Selector) */}
        <div className="bg-brand-navy text-white rounded-xl p-5 shadow-premium border border-brand-gold/15 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                <Upload className="h-4 w-4" />
                <span>Secure Digital Filing</span>
              </h3>
              <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded font-mono font-bold">256-BIT ENCRYPTED</span>
            </div>
            <h4 className="text-base font-serif font-bold text-slate-100">Document Upload Port</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload documents (PDF, PNG, JPG, Word). Submissions are instantly signed with an audit trail and logged to your matter repository.
            </p>
          </div>

          {uploadSuccessMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs p-3 rounded-lg flex items-center space-x-2 animate-fade-in">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              className="hidden"
            />

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-gold bg-brand-gold/10'
                  : selectedFile
                  ? 'border-emerald-500/80 bg-emerald-950/30'
                  : 'border-slate-700 hover:border-brand-gold/60 bg-brand-blue-slate/50'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between text-left space-x-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">{formattedFileSize} • Ready to upload</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setCustomFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 py-1">
                  <Upload className="h-6 w-6 text-brand-gold mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-200">
                    Drag & Drop file here, or <span className="text-brand-gold underline font-extrabold">Browse Files</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Supports PDF, PNG, JPG, DOCX (Max 25MB)</p>
                </div>
              )}
            </div>

            {/* Target Category Directory */}
            <div>
              <label className="block text-[10px] text-slate-300 font-bold uppercase mb-1">Target Folder Directory</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                className="w-full bg-brand-blue-slate text-xs text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Document Title Input */}
            <div>
              <label className="block text-[10px] text-slate-300 font-bold uppercase mb-1">Document Display Title</label>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="e.g. Utility_Bill_June_2026.pdf"
                className="w-full bg-brand-blue-slate text-xs text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  <span>Uploading to Cloud Storage...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-slate-950" />
                  <span>Upload Document to Cloud Storage</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Upload Cloud Presets */}
          <div className="border-t border-slate-800 pt-3">
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Quick Demo Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => selectPresetUpload('Municipal_Water_Electricity_Invoice.pdf', 'fica')}
                className="bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
              >
                + Address Proof
              </button>
              <button
                type="button"
                onClick={() => selectPresetUpload('Certified_SARS_Tax_Clearance.pdf', 'financial')}
                className="bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
              >
                + SARS Tax Clearance
              </button>
              <button
                type="button"
                onClick={() => selectPresetUpload('Signed_Offer_To_Purchase.pdf', 'sale_agreement')}
                className="bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors"
              >
                + Signed OTP
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
                  <th className="p-4">Size & File</th>
                  <th className="p-4">Upload History</th>
                  <th className="p-4">Status & Clearances</th>
                  {isStaff ? (
                    <th className="p-4 text-right">Attorney Actions</th>
                  ) : (
                    <th className="p-4 text-right">Preview</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map(doc => {
                  const uploaderLabel = doc.uploadedBy.startsWith('usr-') ? (doc.uploadedBy === currentUser.id ? 'You' : 'Staff/Client') : doc.uploadedBy;
                  const hasValidUrl = doc.fileUrl && doc.fileUrl !== '#';

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
                              <CornerDownRight className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>Notes: "{doc.reviewerNotes}"</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions Column */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {hasValidUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.name}
                              className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded text-[11px] font-bold transition-colors"
                              title="View or Download Document"
                            >
                              <Eye className="h-3.5 w-3.5 text-brand-navy" />
                              <span>View</span>
                            </a>
                          )}

                          {isStaff && doc.status === 'pending_review' && (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={reviewNotes[doc.id] || ''}
                                onChange={(e) => setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })}
                                placeholder="Add notes..."
                                className="px-2 py-1 border border-slate-200 rounded text-[10px] w-28 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
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
                          )}
                        </div>
                      </td>
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

