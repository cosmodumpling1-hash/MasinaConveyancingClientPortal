import React from 'react';
import { X, Scale, ShieldCheck, FileText, CheckCircle2, Lock, Building2, Eye, ExternalLink } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = React.useState<'privacy' | 'terms'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between border-b border-brand-gold/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-gold/20 rounded-xl border border-brand-gold/30 text-brand-gold">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white leading-tight">Masina Attorneys Inc. Governance</h2>
              <p className="text-xs text-brand-gold/90 font-mono">POPIA, GDPR & Conveyancing Portal Regulatory Framework</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-5 py-3 text-xs font-bold transition-colors border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-brand-gold text-brand-navy bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Privacy Policy (POPIA)</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-5 py-3 text-xs font-bold transition-colors border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'border-brand-gold text-brand-navy bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4 text-brand-gold-dark" />
            <span>Terms & Conditions</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-xs leading-relaxed">
          
          {/* PRIVACY POLICY CONTENT */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in font-sans">
              
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 flex items-start space-x-3">
                <Lock className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider font-mono">POPIA & GDPR Statutory Compliance Notice</h3>
                  <p className="text-[11px] text-emerald-800/90 leading-normal">
                    Masina Attorneys Inc. is committed to protecting your personal information in strict accordance with the South African Protection of Personal Information Act 4 of 2013 (POPIA) and international GDPR standards.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">1. Information We Collect</h4>
                <p>
                  To process property transfers, bond registrations, and legal conveyancing transactions, Masina Attorneys Inc. collects personal, financial, and regulatory identification data. This includes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Identity Information:</strong> Full names, South African ID numbers, passport numbers, and marital status records.</li>
                  <li><strong>Contact Details:</strong> Email addresses, telephone numbers, and current residential/postal addresses.</li>
                  <li><strong>FICA & Financial Records:</strong> Bank statements, proof of address, income tax numbers, and source-of-funds verification documents required under the Financial Intelligence Centre Act 38 of 2001 (FICA).</li>
                  <li><strong>Property & Transaction Data:</strong> Deed numbers, purchase prices, municipal account numbers, rates clearance certificates, and SARS Transfer Duty declarations.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">2. Purpose of Data Processing</h4>
                <p>Your personal information is strictly processed for legitimate legal purposes, including:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Lodging and registering deeds with the Deeds Registries Office of South Africa.</li>
                  <li>Obtaining municipal Rates Clearance Certificates and SARS Transfer Duty Receipts.</li>
                  <li>Fulfilling statutory FICA identity verification and anti-money laundering duties.</li>
                  <li>Communicating real-time transaction updates, milestone completions, and document signature requests.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">3. Data Sharing & Disclosure</h4>
                <p>
                  We do not sell, rent, or lease client information to third parties. Information is disclosed solely to authorized statutory bodies and transaction counterparties as necessary for conveyancing completion:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>The South African Deeds Office and Registrar of Deeds.</li>
                  <li>The South African Revenue Service (SARS) and local Municipalities.</li>
                  <li>Financial Institutions and Mortgage Bond Attorneys involved in the transaction.</li>
                  <li>Authorized auditing authorities and law enforcement when required by statutory order.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">4. Data Security & Storage</h4>
                <p>
                  All digital records are encrypted in transit via TLS 1.3 and at rest using AES-256 encryption. Access controls are strictly enforced using multi-factor authentication and role-based permissions.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">5. Your Legal Rights</h4>
                <p>
                  Under POPIA Section 24, you retain the right to request access to, correction of, or deletion of your personal information (subject to statutory legal record-keeping retention periods required for conveyancing files).
                </p>
              </section>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex justify-between items-center">
                <span>Information Officer: <strong>privacy@masinalaw.co.za</strong></span>
                <span className="font-mono text-[10px] text-slate-400">Effective: July 2026</span>
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS CONTENT */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in font-sans">
              
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start space-x-3">
                <FileText className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wider font-mono">Conveyancing Portal Terms of Use</h3>
                  <p className="text-[11px] text-amber-800/90 leading-normal">
                    By registering or interacting with the Masina Attorneys Inc. digital portal, you agree to comply with the following binding terms and conditions governing electronic transactions.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">1. Portal Authorization & Account Access</h4>
                <p>
                  1.1. Account credentials are assigned strictly to individual users. You are responsible for maintaining the confidentiality of your login credentials.
                </p>
                <p>
                  1.2. Self-registration grants client-level view access. Access to staff modules (Attorney, Conveyancer, Paralegal) requires explicit role allocation by a System Administrator following verification.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">2. FICA Compliance & Document Accuracy</h4>
                <p>
                  2.1. Users warrant that all documents, identification numbers, and proof of address submitted via the FICA portal are truthful, authentic, and current.
                </p>
                <p>
                  2.2. Intentional submission of falsified documents constitutes fraud and will result in immediate account termination and reporting to relevant statutory law enforcement authorities.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">3. Conveyancing Turnaround Times & External Dependencies</h4>
                <p>
                  3.1. Displayed stage progress indicators and estimated registration completion dates are projected estimates dependent on external state departments (Deeds Office, SARS, Municipalities, Banks).
                </p>
                <p>
                  3.2. Masina Attorneys Inc. shall not be held liable for conveyancing delays caused by municipal system outages, Deeds Office backlog lodgements, or SARS clearance audits.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">4. Electronic Signatures & Communications</h4>
                <p>
                  In terms of the Electronic Communications and Transactions Act 25 of 2002 (ECTA), electronic confirmations, document uploads, and portal communications carry full legal weight as written instructions.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-brand-navy font-serif border-b border-slate-100 pb-1">5. Account Termination & Suspension</h4>
                <p>
                  Masina Attorneys Inc. reserves the right to suspend or terminate portal access for any user found violating security protocols, engaging in unauthorized access attempts, or breaching these terms.
                </p>
              </section>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex justify-between items-center">
                <span>Legal Counsel: <strong>legal@masinalaw.co.za</strong></span>
                <span className="font-mono text-[10px] text-slate-400">Jurisdiction: High Court of South Africa</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Masina Attorneys Inc. Official Governance Document</span>
          </div>
          <button
            onClick={onClose}
            className="bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
}
