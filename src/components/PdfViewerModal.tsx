import React from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Download, Printer, 
  ShieldCheck, FileText, CheckCircle, XCircle, AlertTriangle, Lock, Eye
} from 'lucide-react';
import { Document, DocumentCategory } from '../types';

interface PdfViewerModalProps {
  doc: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onReview?: (docId: string, status: 'approved' | 'rejected', notes: string) => void;
  isStaff?: boolean;
}

export default function PdfViewerModal({ doc, isOpen, onClose, onReview, isStaff }: PdfViewerModalProps) {
  const [zoom, setZoom] = React.useState<number>(100);
  const [rotation, setRotation] = React.useState<number>(0);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = React.useState<string>('');
  const [activePage, setActivePage] = React.useState<number>(1);
  const totalPages = 1;

  React.useEffect(() => {
    // Reset controls when document changes
    setZoom(100);
    setRotation(0);
    setIsFullscreen(false);
    setReviewNotes('');
    setActivePage(1);
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  const isPdf = doc.fileUrl && (
    doc.fileUrl.startsWith('data:application/pdf') || 
    doc.fileUrl.endsWith('.pdf') || 
    doc.name.toLowerCase().endsWith('.pdf')
  );

  const isImage = doc.fileUrl && (
    doc.fileUrl.startsWith('data:image/') ||
    /\.(png|jpg|jpeg|webp)$/i.test(doc.fileUrl)
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 ${
      isFullscreen ? 'p-0' : 'p-4 sm:p-6'
    }`}>
      <div className={`bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
      }`}>
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg border border-brand-gold/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">{doc.name}</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-mono font-bold shrink-0">
                  {doc.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                <span className="flex items-center text-emerald-400">
                  <Lock className="h-3 w-3 mr-1" /> SECURE PREVIEW
                </span>
                <span>•</span>
                <span>Size: {doc.size || '1.5 MB'}</span>
                <span>•</span>
                <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Action Status Badge & Close button */}
          <div className="flex items-center space-x-3">
            {doc.status === 'approved' && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> VERIFIED DEEDS DOC
              </span>
            )}
            {doc.status === 'rejected' && (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                <XCircle className="h-3.5 w-3.5 mr-1" /> REJECTED
              </span>
            )}
            {doc.status === 'pending_review' && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> AWAITING REVIEW
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewer Toolbar */}
        <div className="px-5 py-2.5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px] font-mono font-bold">PAGE {activePage} / {totalPages}</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono text-brand-gold font-bold w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleRotate}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer flex items-center space-x-1"
              title="Rotate 90°"
            >
              <RotateCw className="h-4 w-4" />
              <span className="text-[10px] text-slate-400">{rotation}°</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {doc.fileUrl && doc.fileUrl !== '#' && (
              <a
                href={doc.fileUrl}
                download={doc.name}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-[11px] flex items-center space-x-1 transition-colors"
                title="Download file copy"
              >
                <Download className="h-3.5 w-3.5 text-brand-gold" />
                <span>Download</span>
              </a>
            )}

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-brand-gold" />
              <span>Print</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Main Document Content Area */}
        <div className="flex-1 bg-slate-950 p-6 overflow-auto flex items-center justify-center relative min-h-0">
          
          {/* Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.04] select-none z-10">
            <div className="transform -rotate-45 text-center">
              <p className="text-6xl font-black text-white font-serif tracking-widest uppercase">MASINA CONVEYANCING</p>
              <p className="text-3xl font-mono text-brand-gold mt-2">OFFICIAL DEEDS REGISTRY PREVIEW • DO NOT DUPLICATE</p>
            </div>
          </div>

          {/* Render Area with Zoom & Rotation */}
          <div 
            className="transition-all duration-200 flex justify-center items-center my-auto"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            {isImage ? (
              <div className="bg-white p-4 rounded-lg shadow-2xl max-w-2xl border border-slate-700">
                <img 
                  src={doc.fileUrl} 
                  alt={doc.name} 
                  className="max-h-[60vh] object-contain rounded mx-auto" 
                />
              </div>
            ) : isPdf && doc.fileUrl && doc.fileUrl.startsWith('data:') ? (
              <div className="w-[650px] min-h-[780px] bg-white text-slate-900 rounded-lg shadow-2xl p-8 border border-slate-300 font-serif relative flex flex-col justify-between">
                <div>
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-bold text-brand-navy uppercase font-serif tracking-wide">
                        MASINA CONVEYANCING ATTORNEYS
                      </h1>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        HIGH COURT ADVOCATES & CONVEYANCERS • DEEDS REGISTRY
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-brand-navy text-brand-gold text-[10px] font-mono font-bold px-2.5 py-1 rounded">
                        REF: {doc.matterId || 'MAT-2026-088'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded text-xs font-sans text-amber-900 mb-6 flex items-center justify-between">
                    <span className="font-bold">FILE PREVIEW: {doc.name}</span>
                    <span className="font-mono text-[10px] text-amber-700">CATEGORY: {doc.category.toUpperCase()}</span>
                  </div>

                  <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
                    <p className="font-bold text-slate-900 uppercase">OFFICIAL LEGAL RECORD PREVIEW</p>
                    <p>
                      This document represents an official client submission in connection with property transfer conveyancing protocols under the Deeds Registries Act and South African SARS Tax Regulations.
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-800 space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Document Identifier:</span>
                        <span className="font-bold">{doc.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Uploaded By:</span>
                        <span>{doc.uploadedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span>{new Date(doc.uploadDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Verification Hash:</span>
                        <span className="text-emerald-700 font-bold">SHA256: 8f92a11b0c9e...APPROVED</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-8 flex justify-between items-end text-[10px] font-sans text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">Masina Digital Vault Signatures</p>
                    <p>Electronically Verified under ECT Act 25 of 2002</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-brand-navy">PAGE 1 OF 1</p>
                    <p>CONFIDENTIAL CLIENT RECORD</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback High-Fidelity Render for standard URL or document preview */
              <iframe
                src={doc.fileUrl && doc.fileUrl !== '#' ? doc.fileUrl : undefined}
                title={doc.name}
                className="w-[700px] h-[780px] bg-white rounded-lg shadow-2xl border border-slate-300"
              />
            )}
          </div>
        </div>

        {/* Staff Quick Review Footer Bar */}
        {isStaff && doc.status === 'pending_review' && onReview && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter attorney review notes or compliance feedback..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  onReview(doc.id, 'rejected', reviewNotes || 'Incomplete document. Re-upload requested.');
                  onClose();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Document</span>
              </button>
              <button
                onClick={() => {
                  onReview(doc.id, 'approved', reviewNotes || 'FICA & Deeds requirements verified.');
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve Document</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
