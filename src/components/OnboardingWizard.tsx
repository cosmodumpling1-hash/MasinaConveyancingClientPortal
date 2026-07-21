import React from 'react';
import { Shield, Fingerprint, FileText, Check, AlertCircle, Camera, CheckCircle2, UserCheck, Sparkles, Signature, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface OnboardingWizardProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onOpenMatter: (matterData: {
    propertyAddress: string;
    propertyPrice: number;
    buyerName: string;
    sellerName: string;
    expectedCompletionDate: string;
  }) => void;
}

export default function OnboardingWizard({ currentUser, onUpdateUser, onOpenMatter }: OnboardingWizardProps) {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<any>(null);

  // Form states
  const [personalDetails, setPersonalDetails] = React.useState({
    fullName: currentUser.name || '',
    idNumber: currentUser.idNumber || '',
    phone: currentUser.phone || '',
    address: currentUser.address || ''
  });

  const [propertyDetails, setPropertyDetails] = React.useState({
    address: '',
    price: '1850000',
    sellerName: '',
    buyerName: currentUser.name || '',
    hasBondApproved: 'yes',
    expectedDate: '2026-11-30'
  });

  const [consent, setConsent] = React.useState({
    popia: false,
    gdpr: false,
    eSign: false,
    electronicSignatureName: ''
  });

  const [simulatedDoc, setSimulatedDoc] = React.useState({
    name: '',
    category: 'identity',
    textContent: ''
  });

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleConsentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent.popia || !consent.gdpr || !consent.eSign || !consent.electronicSignatureName) {
      alert("Please review and accept all compliance declarations and sign below.");
      return;
    }
    setStep(4);
  };

  const selectDocumentPreset = (preset: 'id' | 'utility') => {
    if (preset === 'id') {
      setSimulatedDoc({
        name: 'South_African_ID_SmartCard.jpg',
        category: 'identity',
        textContent: `REPUBLIC OF SOUTH AFRICA IDENTITY CARD. Surname: BUYER, Given Names: JOHN, Sex: M, Nationality: RSA, Date of Birth: 12 JUL 1989. ID NUMBER: 8907125012083. Country of Birth: RSA.`
      });
    } else {
      setSimulatedDoc({
        name: 'City_Power_Municipal_Invoice.pdf',
        category: 'fica',
        textContent: `CITY OF JOHANNESBURG MUNICIPAL INVOICE. Date: 2026-06-15. Account Number: 99201944. To: JOHN BUYER, Residence: 14 BLUE CRANE ESTATE, MIDRAND, 1685. Outstanding Balance Paid: ZAR 1200.00. Water and Electricity Charges.`
      });
    }
  };

  const handleAIKYCVerify = async () => {
    if (!simulatedDoc.name) {
      alert("Please snap a camera snapshot or select a document to verify.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/ai/kyc-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName: simulatedDoc.name,
          docCategory: simulatedDoc.category,
          textContent: simulatedDoc.textContent
        })
      });
      const data = await response.json();
      setVerificationResult(data);

      if (data.success) {
        // Update user state with verified fields
        const idNum = data.extractedInfo.idNumber !== 'N/A' ? data.extractedInfo.idNumber : personalDetails.idNumber;
        const addr = data.extractedInfo.residentialAddress !== 'N/A' ? data.extractedInfo.residentialAddress : personalDetails.address;
        
        onUpdateUser({
          ...currentUser,
          idNumber: idNum,
          address: addr,
          kycStatus: 'verified',
          consentAccepted: true,
          consentDate: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    // Open a real property matter
    onOpenMatter({
      propertyAddress: propertyDetails.address || 'Plot 22 Sandton Estate, Johannesburg',
      propertyPrice: Number(propertyDetails.price) || 1850000,
      buyerName: currentUser.name,
      sellerName: propertyDetails.sellerName || 'Sarah Seller',
      expectedCompletionDate: propertyDetails.expectedDate
    });
  };

  const generatedFingerprint = consent.electronicSignatureName
    ? `MASINA-SECURE-SHA256:89a4c8e7${consent.electronicSignatureName.length * 3}d10f8821`
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-premium overflow-hidden max-w-4xl mx-auto animate-fade-in" id="onboarding-wizard">
      {/* Banner / Header */}
      <div className="bg-brand-navy text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-brand-gold font-bold uppercase text-xs tracking-wider">
            <Fingerprint className="h-4 w-4" />
            <span>Identity Trust & Regulatory Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight mt-1">Conveyancing Digital Onboarding</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            In compliance with the Deeds Registries Act, POPIA (South Africa), and GDPR regulations, we require identity verification and legal transfer declarations prior to drafting deeds.
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-brand-gold/10 text-brand-gold font-mono border border-brand-gold/25 px-3 py-1.5 rounded-lg text-xs font-semibold">
          Step {step} of 5
        </div>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="bg-brand-cream/10 border-b border-slate-200/60 px-6 sm:px-8 py-3.5 flex justify-between items-center text-xs font-semibold text-slate-400">
        <div className={`flex items-center space-x-1.5 ${step >= 1 ? 'text-brand-gold-dark' : ''}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-brand-navy text-white font-bold ring-1 ring-brand-gold/40' : 'bg-slate-200'}`}>1</div>
          <span className="font-sans">Personal Data</span>
        </div>
        <div className="h-0.5 bg-slate-200 flex-1 mx-3 hidden sm:block"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 2 ? 'text-brand-gold-dark' : ''}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-brand-navy text-white font-bold ring-1 ring-brand-gold/40' : 'bg-slate-200'}`}>2</div>
          <span className="font-sans">Property Matter</span>
        </div>
        <div className="h-0.5 bg-slate-200 flex-1 mx-3 hidden sm:block"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 3 ? 'text-brand-gold-dark' : ''}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-brand-navy text-white font-bold ring-1 ring-brand-gold/40' : 'bg-slate-200'}`}>3</div>
          <span className="font-sans">Consent</span>
        </div>
        <div className="h-0.5 bg-slate-200 flex-1 mx-3 hidden sm:block"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 4 ? 'text-brand-gold-dark' : ''}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-brand-navy text-white font-bold ring-1 ring-brand-gold/40' : 'bg-slate-200'}`}>4</div>
          <span className="font-sans">KYC ID Scan</span>
        </div>
        <div className="h-0.5 bg-slate-200 flex-1 mx-3 hidden sm:block"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 5 ? 'text-brand-gold-dark' : ''}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 5 ? 'bg-brand-navy text-white font-bold ring-1 ring-brand-gold/40' : 'bg-slate-200'}`}>5</div>
          <span className="font-sans">Complete</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <form onSubmit={handlePersonalSubmit} className="space-y-6">
            <div className="border-l-4 border-brand-gold bg-brand-cream/10 p-4 rounded-r-lg">
              <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-1.5">
                <Shield className="h-4.5 w-4.5 text-brand-gold-dark" />
                <span>Verify Your Contact & Registration Details</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Please ensure this matches your official identification document. These details will be hardcoded into SARS transfer duty records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={personalDetails.fullName}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. John Buyer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">South African ID or Passport No.</label>
                <input
                  type="text"
                  required
                  value={personalDetails.idNumber}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, idNumber: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. 8907125012083"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mobile Contact Number</label>
                <input
                  type="text"
                  required
                  value={personalDetails.phone}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. +27 82 555 0192"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Residential Physical Address</label>
                <input
                  type="text"
                  required
                  value={personalDetails.address}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. 14 Blue Crane Estate, Midrand"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <span>Proceed to Property Setup</span>
                <Check className="h-4 w-4 text-brand-gold" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Property Transfer Details */}
        {step === 2 && (
          <form onSubmit={handlePropertySubmit} className="space-y-6">
            <div className="border-l-4 border-brand-gold bg-brand-cream/10 p-4 rounded-r-lg">
              <h3 className="text-sm font-serif font-bold text-brand-navy">
                Property Transaction Detail Declaration
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Tell us about the property you are purchasing or selling. This initiates our automated deed checklists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Physical Address of the Property</label>
                <input
                  type="text"
                  required
                  value={propertyDetails.address}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. 124 Villa Rosa, Sandton, Johannesburg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Purchase Contract Price (ZAR)</label>
                <input
                  type="number"
                  required
                  value={propertyDetails.price}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, price: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. 1850000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Counterparty (Seller's Name)</label>
                <input
                  type="text"
                  required
                  value={propertyDetails.sellerName}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, sellerName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  placeholder="e.g. Sarah Seller"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Do you require a bank-approved Bond?</label>
                <select
                  value={propertyDetails.hasBondApproved}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, hasBondApproved: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                >
                  <option value="yes">Yes, pre-approval/bond in progress</option>
                  <option value="no">No, cash transfer purchase</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Expected Transfer/Registration Date</label>
                <input
                  type="date"
                  required
                  value={propertyDetails.expectedDate}
                  onChange={(e) => setPropertyDetails({ ...propertyDetails, expectedDate: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-brand-navy font-bold text-sm px-4 py-2 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <span>Proceed to Compliance Consent</span>
                <Check className="h-4 w-4 text-brand-gold" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Legal Disclosures & Compliance Consent */}
        {step === 3 && (
          <form onSubmit={handleConsentSubmit} className="space-y-6">
            <div className="bg-brand-cream/10 rounded-xl border border-slate-200/60 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-1.5 uppercase tracking-wider">
                <FileText className="h-4.5 w-4.5 text-brand-gold-dark" />
                <span>POPIA / GDPR Regulatory Policy Act & E-Sign Declarations</span>
              </h3>
              
              <div className="text-xs text-slate-600 space-y-3 max-h-56 overflow-y-auto pr-2 leading-relaxed border-b border-slate-200/60 pb-3">
                <p className="font-semibold text-slate-800">1. POPI ACT COMPLIANCE (South Africa):</p>
                <p>
                  By checking below, you authorize Masina Law Firm to collect, store, and process your personal details (including identity document copies, tax records, and contact details) solely to facilitate property registry and transfer procedures with SARS and the Deeds Office. Under POPIA, we maintain bank-grade file encryption and zero external data sharing.
                </p>
                <p className="font-semibold text-slate-800">2. GDPR COMPLIANCE (European Union General Data Protection):</p>
                <p>
                  You acknowledge your Right to Access and Right to Rectify any personal details held on file. Historical archives are cleared 5 years post property register completion in line with municipal Deeds Registry retention criteria.
                </p>
                <p className="font-semibold text-slate-800">3. ELECTRONIC SIGNATURE COMPLIANCE (ECT Act 25 of 2002):</p>
                <p>
                  Your typed signature below constitutes a legally binding digital mark. This authorized consent acts as an electronic execution of deeds instruction mandate.
                </p>
              </div>

              {/* Accept boxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start space-x-3 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.popia}
                    onChange={(e) => setConsent({ ...consent, popia: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-brand-navy focus:ring-brand-gold h-4 w-4"
                  />
                  <span>I accept the <strong>POPIA (South African Protection of Personal Information Act)</strong> disclosure and allow processing of identity assets.</span>
                </label>

                <label className="flex items-start space-x-3 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.gdpr}
                    onChange={(e) => setConsent({ ...consent, gdpr: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-brand-navy focus:ring-brand-gold h-4 w-4"
                  />
                  <span>I accept the <strong>GDPR guidelines</strong> and approve personal records retention parameters.</span>
                </label>

                <label className="flex items-start space-x-3 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.eSign}
                    onChange={(e) => setConsent({ ...consent, eSign: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-brand-navy focus:ring-brand-gold h-4 w-4"
                  />
                  <span>I approve the use of my digital electronic mark for deeds processing.</span>
                </label>
              </div>
            </div>

            {/* Signature Box */}
            <div className="border border-slate-200/60 rounded-xl p-5 bg-brand-cream/10 space-y-4 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 uppercase">Electronic Signature</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <input
                    type="text"
                    required
                    value={consent.electronicSignatureName}
                    onChange={(e) => setConsent({ ...consent, electronicSignatureName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                    placeholder="Type your full legal name to sign"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Example: John William Buyer</p>
                </div>
                <div className="p-4 border border-dashed border-brand-gold/30 bg-brand-gold/5 rounded-lg flex flex-col items-center justify-center min-h-[90px]">
                  {consent.electronicSignatureName ? (
                    <div className="text-center">
                      <span className="font-serif italic text-lg text-brand-navy tracking-wider">
                        {consent.electronicSignatureName}
                      </span>
                      <span className="text-[9px] block text-brand-gold-dark font-mono mt-1.5">
                        {generatedFingerprint}
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs flex items-center space-x-1">
                      <Signature className="h-4 w-4 text-brand-gold/40" />
                      <span>Signature preview will appear here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-slate-600 hover:text-brand-navy font-bold text-sm px-4 py-2 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <span>Authorize & Continue</span>
                <Check className="h-4 w-4 text-brand-gold" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: AI Identity KYC Verification Scans */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-l-4 border-brand-gold bg-brand-cream/10 p-4 rounded-r-lg flex justify-between items-start">
              <div>
                <h3 className="text-sm font-serif font-bold text-brand-navy flex items-center space-x-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-brand-gold-dark animate-pulse" />
                  <span>Interactive FICA KYC Document Verification Scan</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Take a photo of your national Smart ID Card, Passport, or upload a recent utilities bill (FICA proof of address).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Simulation Viewport */}
              <div className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col justify-between min-h-[280px]">
                <div className="px-4 py-2.5 bg-slate-850 flex justify-between items-center text-[10px] text-brand-gold font-mono">
                  <span>CAMERA STREAM: LIVE [MOCK-WIDGET]</span>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  {simulatedDoc.name ? (
                    <div className="space-y-3">
                      <div className="bg-brand-gold/10 border border-brand-gold/25 text-brand-gold p-4 rounded-lg inline-flex items-center justify-center">
                        <FileText className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-slate-200 font-semibold">{simulatedDoc.name}</p>
                      <p className="text-xs text-slate-400 max-w-xs truncate mx-auto">{simulatedDoc.textContent}</p>
                      <button
                        onClick={() => setSimulatedDoc({ name: '', category: 'identity', textContent: '' })}
                        className="text-xs text-slate-400 hover:text-slate-300 underline flex items-center space-x-1 mx-auto cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3 text-brand-gold" />
                        <span>Reset stream</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="h-10 w-10 text-slate-600 mx-auto" />
                      <div>
                        <p className="text-sm text-slate-300 font-semibold">Select an identity asset to capture:</p>
                        <p className="text-xs text-slate-500 mt-1">Simulates real mobile camera snaps</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => selectDocumentPreset('id')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          Snap Smart ID Card
                        </button>
                        <button
                          type="button"
                          onClick={() => selectDocumentPreset('utility')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          Snap Utility Municipal Bill
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 bg-slate-850 text-center border-t border-slate-700">
                  <button
                    type="button"
                    disabled={loading || !simulatedDoc.name}
                    onClick={handleAIKYCVerify}
                    className="w-full bg-brand-navy hover:bg-brand-navy/95 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5 border border-slate-800 shadow-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 animate-spin text-brand-gold" />
                        <span>AI Document Parsing Active...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-brand-gold animate-bounce" />
                        <span>Analyze & Verify Document with Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Scan Results Display */}
              <div className="border border-slate-200/60 rounded-xl p-5 bg-brand-cream/10 flex flex-col justify-between min-h-[280px] shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI FICA KYC Verification Output</h4>
                
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                    <div className="h-10 w-10 rounded-full border-2 border-brand-navy border-t-transparent animate-spin"></div>
                    <p className="text-xs text-slate-500 font-mono text-center">Gemini reviewing identity, watermarks & deeds record matches...</p>
                  </div>
                ) : verificationResult ? (
                  <div className="flex-1 flex flex-col justify-between mt-3 space-y-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase">Verification Result: PASSED</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 px-2 py-0.5 rounded text-xs font-bold font-mono">
                        Match: {verificationResult.score}%
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-xs font-mono space-y-1.5 text-slate-700 shadow-sm">
                      <div><span className="text-brand-gold-dark font-bold font-mono">DOC TYPE:</span> {verificationResult.extractedInfo.documentType}</div>
                      <div><span className="text-brand-gold-dark font-bold font-mono">FULL NAME:</span> {verificationResult.extractedInfo.fullName}</div>
                      <div><span className="text-brand-gold-dark font-bold font-mono">ID NUMBER:</span> {verificationResult.extractedInfo.idNumber}</div>
                      {verificationResult.extractedInfo.residentialAddress && (
                        <div><span className="text-brand-gold-dark font-bold font-mono">ADDRESS:</span> {verificationResult.extractedInfo.residentialAddress}</div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded border border-slate-200/60 leading-relaxed shadow-sm">
                      <strong>AI Recommendation:</strong> {verificationResult.auditRecommendation}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <AlertCircle className="h-8 w-8 text-brand-gold/40" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">No results logged yet.</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Please snap a document stream and hit "Verify with Gemini AI" to trigger OCR validation.</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200/60 flex justify-end">
                  <button
                    type="button"
                    disabled={!verificationResult}
                    onClick={() => setStep(5)}
                    className="bg-brand-navy hover:bg-brand-navy/95 disabled:bg-slate-200 disabled:text-slate-400 text-white border border-slate-800 font-bold text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Continue to Summary
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-start border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-slate-600 hover:text-brand-navy font-bold text-sm px-4 py-2 cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Congratulations / Summary Completed */}
        {step === 5 && (
          <div className="text-center py-8 px-4 space-y-6">
            <div className="bg-emerald-50 h-16 w-16 rounded-full flex items-center justify-center text-emerald-700 mx-auto shadow-sm ring-8 ring-emerald-500/10">
              <UserCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy">Onboarding & Consent Completed!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you, <strong>{personalDetails.fullName}</strong>. Your POPIA, GDPR disclosures, electronic signature, and FICA identity scan are officially secured under biometric trust. We are now ready to establish your active conveyancing property matter!
              </p>
            </div>

            {/* Structured details display card */}
            <div className="bg-brand-cream/10 border border-slate-200/60 rounded-xl p-6 text-left max-w-md mx-auto space-y-3.5 shadow-sm">
              <h4 className="text-xs font-serif font-bold text-brand-gold-dark uppercase tracking-widest border-b border-slate-200/60 pb-1.5">Onboard Record</h4>
              <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 text-xs">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Client Entity</span>
                <span className="col-span-2 text-brand-navy font-serif font-bold text-sm">{personalDetails.fullName}</span>

                <span className="text-slate-400 font-mono text-[10px] uppercase">Verified ID</span>
                <span className="col-span-2 text-slate-800 font-mono font-semibold">{personalDetails.idNumber || '8907125012083'}</span>

                <span className="text-slate-400 font-mono text-[10px] uppercase">Property</span>
                <span className="col-span-2 text-slate-800 font-semibold">{propertyDetails.address || '124 Villa Rosa, Sandton'}</span>

                <span className="text-slate-400 font-mono text-[10px] uppercase">Deal Price</span>
                <span className="col-span-2 text-brand-gold-dark font-mono font-bold">ZAR {Number(propertyDetails.price).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="w-full bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white font-serif font-bold tracking-wide text-sm py-3 rounded-xl transition-all shadow-premium flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Initialize Conveyancing Matter Case File</span>
                <Check className="h-4 w-4 text-brand-gold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
