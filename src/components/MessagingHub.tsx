import React from 'react';
import { Send, Search, Paperclip, Scale, Shield, FileText, CheckCheck, RefreshCw, Eye, Download, Image as ImageIcon, Maximize2, X, Lock } from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';
import { safeFetch } from '../lib/safeFetch';

interface MessagingHubProps {
  conversations: Conversation[];
  messages: Message[];
  currentUser: UserType;
  selectedConversationId: string;
  onSendMessage: (text: string, fileAttachment?: { name: string; url: string; type: string }) => void;
  onRefresh: () => void;
}

const SAMPLE_SMART_ID = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380" fill="none"><rect width="600" height="380" rx="16" fill="%230F172A"/><rect x="20" y="20" width="560" height="340" rx="12" fill="%231E293B" stroke="%23C59B27" stroke-width="2"/><text x="45" y="65" fill="%23C59B27" font-family="sans-serif" font-size="15" font-weight="bold" letter-spacing="1">REPUBLIC OF SOUTH AFRICA • NATIONAL IDENTITY CARD</text><line x1="45" y1="80" x2="555" y2="80" stroke="%23334155" stroke-width="1"/><rect x="45" y="105" width="120" height="150" rx="8" fill="%23334155" stroke="%23C59B27" stroke-width="1"/><circle cx="105" cy="155" r="35" fill="%23475569"/><path d="M70 230 C70 195, 140 195, 140 230 Z" fill="%23475569"/><text x="185" y="125" fill="%2394A3B8" font-family="sans-serif" font-size="11" font-weight="bold">SURNAME / VAN</text><text x="185" y="145" fill="%23FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">BUYER</text><text x="185" y="175" fill="%2394A3B8" font-family="sans-serif" font-size="11" font-weight="bold">NAMES / VOORNAME</text><text x="185" y="195" fill="%23FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">JOHN ALEXANDER</text><text x="185" y="225" fill="%2394A3B8" font-family="sans-serif" font-size="11" font-weight="bold">IDENTITY NUMBER</text><text x="185" y="245" fill="%23C59B27" font-family="monospace" font-size="15" font-weight="bold">880412 5082 08 4</text><rect x="45" y="280" width="510" height="40" rx="6" fill="%230F172A" stroke="%23334155"/><text x="60" y="305" fill="%2310B981" font-family="monospace" font-size="12" font-weight="bold">VERIFIED FICA ENCRYPTED • MASINA CONVEYANCING PORTAL</text></svg>`;

const SAMPLE_UTILITY = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="none"><rect width="600" height="420" rx="12" fill="%23F8FAFC"/><rect x="20" y="20" width="560" height="380" rx="8" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><rect x="40" y="40" width="200" height="35" rx="6" fill="%231E3A8A"/><text x="50" y="62" fill="%23FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold">CITY OF JOHANNESBURG</text><text x="360" y="55" fill="%230F172A" font-family="sans-serif" font-size="13" font-weight="bold">MUNICIPAL RATES STATEMENT</text><text x="360" y="72" fill="%2364748B" font-family="sans-serif" font-size="11">Date: 12 July 2026</text><line x1="40" y1="95" x2="560" y2="95" stroke="%23CBD5E1" stroke-width="1"/><text x="40" y="125" fill="%2364748B" font-family="sans-serif" font-size="11" font-weight="bold">ACCOUNT HOLDER & RESIDENTIAL ADDRESS</text><text x="40" y="145" fill="%230F172A" font-family="sans-serif" font-size="14" font-weight="bold">JOHN BUYER</text><text x="40" y="165" fill="%23334155" font-family="sans-serif" font-size="12">124 Villa Rosa, 14th Road, Sandton, 2196</text><rect x="40" y="195" width="520" height="120" rx="6" fill="%23F1F5F9"/><text x="60" y="225" fill="%23475569" font-family="sans-serif" font-size="12" font-weight="bold">Service: Electricity & Refuse</text><text x="60" y="250" fill="%23475569" font-family="sans-serif" font-size="12">Current Assessment Balance: R 2,450.00</text><text x="60" y="275" fill="%2310B981" font-family="sans-serif" font-size="12" font-weight="bold">Status: PAID IN FULL • COMPLIANT FOR FICA</text><rect x="40" y="340" width="220" height="35" rx="6" fill="%23ECFDF5" stroke="%2310B981"/><text x="55" y="362" fill="%23065F46" font-family="sans-serif" font-size="11" font-weight="bold">✔ FICA ADDRESS VALIDATED</text></svg>`;

function isImageAttachment(att?: { name: string; url: string; type?: string }) {
  if (!att) return false;
  if (att.type && att.type.toLowerCase().startsWith('image/')) return true;
  if (att.url && (att.url.startsWith('data:image/') || att.url.match(/\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i))) return true;
  if (att.name && att.name.match(/\.(png|jpe?g|gif|webp|svg|bmp)$/i)) return true;
  return false;
}

function getImageFormatBadge(att?: { name: string; url: string; type?: string }) {
  if (!att) return 'IMAGE';
  if (att.type) {
    if (att.type.includes('png')) return 'PNG';
    if (att.type.includes('jpeg') || att.type.includes('jpg')) return 'JPG';
    if (att.type.includes('webp')) return 'WEBP';
    if (att.type.includes('svg')) return 'SVG';
  }
  const match = att.name.match(/\.(png|jpe?g|gif|webp|svg|bmp)$/i);
  if (match) return match[1].toUpperCase();
  return 'IMAGE';
}

function resolveImageUrl(att?: { name: string; url: string; type?: string }) {
  if (!att) return SAMPLE_SMART_ID;
  if (att.url && att.url !== '#' && att.url.length > 5) {
    return att.url;
  }
  const nameLower = (att.name || '').toLowerCase();
  if (nameLower.includes('rates') || nameLower.includes('utility') || nameLower.includes('residence') || nameLower.includes('statement')) {
    return SAMPLE_UTILITY;
  }
  return SAMPLE_SMART_ID;
}

export default function MessagingHub({ conversations, messages, currentUser, selectedConversationId, onSendMessage, onRefresh }: MessagingHubProps) {
  const [text, setText] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [simulatedAttachment, setSimulatedAttachment] = React.useState<{ name: string; url: string; type: string } | null>(null);
  const [viewingImage, setViewingImage] = React.useState<{ name: string; url: string; sender: string; timestamp: string; format: string } | null>(null);

  const msgFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeConversation = conversations.find(c => c.id === selectedConversationId) || conversations[0];

  const handleMsgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingAttachment(true);

      const reader = new FileReader();
      reader.onload = async (evt) => {
        if (evt.target?.result) {
          const base64Data = evt.target.result as string;
          try {
            let attachmentUrl = base64Data;
            try {
              const data = await safeFetch<{ url?: string }>('/api/storage/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: file.name,
                  fileData: base64Data,
                  bucketName: 'mdocs',
                  folder: 'chat-files'
                })
              });
              if (data && data.url) {
                attachmentUrl = data.url;
              }
            } catch (err) {
              console.warn("Storage upload notice, falling back to local payload:", err);
            }
            setSimulatedAttachment({
              name: file.name,
              url: attachmentUrl,
              type: file.type || (file.name.endsWith('.png') ? 'image/png' : file.name.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream')
            });
          } finally {
            setIsUploadingAttachment(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !simulatedAttachment) return;
    onSendMessage(text, simulatedAttachment || undefined);
    setText('');
    setSimulatedAttachment(null);
  };

  const handlePresetAttachment = (fileName: string, type: string, presetUrl?: string) => {
    setSimulatedAttachment({
      name: fileName,
      url: presetUrl || '#',
      type
    });
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => 
    msg.conversationId === selectedConversationId &&
    (msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
     msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (msg.fileAttachment && msg.fileAttachment.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium overflow-hidden h-[560px] flex flex-col md:flex-row" id="messaging-hub">
      {/* Left Sidebar: Conversations list */}
      <div className="w-full md:w-80 border-r border-slate-250/60 flex flex-col bg-slate-50/40">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="font-sans">Secure Channels</span>
            <button onClick={onRefresh} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors" title="Refresh Feed">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">Encrypted client-lawyer portals active.</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map(conv => (
            <button
              key={conv.id}
              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col space-y-1.5 ${
                selectedConversationId === conv.id ? 'bg-brand-gold/10 border-l-4 border-brand-gold pl-3' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{conv.title}</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider font-bold">MATTER ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-sans font-medium">{conv.lastMessageText || 'No message history yet.'}</p>
              <div className="text-[10px] text-brand-gold-dark font-mono font-semibold">Ref: {conv.matterNumber}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Chat Pane */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header with Search inside */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2">
            <div className="bg-brand-gold/10 p-1.5 rounded-lg text-brand-gold-dark border border-brand-gold/15">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-brand-navy leading-tight">
                {activeConversation?.title || 'Masina Conveyancing Hub'}
              </h4>
              <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5 flex items-center space-x-1">
                <Shield className="h-3 w-3 shrink-0" />
                <span>End-to-End Encryption active</span>
              </p>
            </div>
          </div>

          {/* Search messages */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat transcript..."
              className="pl-8 pr-3 py-1 w-full sm:w-48 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
            />
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-brand-cream/10">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
              <FileText className="h-8 w-8 text-brand-gold/40" />
              <p className="text-xs font-semibold">No messages cleared.</p>
              <p className="text-[10px] text-slate-500">Search criteria yielded no match or transcript is pristine.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] rounded-xl px-4 py-3 shadow-md ${
                    isMe
                      ? 'bg-brand-navy text-white rounded-br-none border border-slate-800'
                      : 'bg-white border border-slate-200/65 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between space-x-2 border-b border-slate-200/20 pb-1 mb-1.5 text-[10px] font-semibold opacity-85">
                      <span className={isMe ? 'text-brand-gold' : 'text-brand-gold-dark'}>{msg.senderName} ({msg.senderRole.toUpperCase()})</span>
                      <span className="font-mono text-[9px] opacity-75">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Text body */}
                    {msg.text && (
                      <p className="text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Attachment node if exists */}
                    {msg.fileAttachment && (
                      isImageAttachment(msg.fileAttachment) ? (
                        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-200/40 bg-slate-900/90 shadow-md transition-all hover:shadow-lg group/img">
                          {/* Image Format Header */}
                          <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] flex items-center justify-between border-b border-slate-800 text-slate-300">
                            <span className="flex items-center space-x-1.5 font-mono truncate max-w-[180px]" title={msg.fileAttachment.name}>
                              <ImageIcon className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                              <span className="truncate">{msg.fileAttachment.name}</span>
                            </span>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className="bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                {getImageFormatBadge(msg.fileAttachment)}
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center space-x-1">
                                <Lock className="h-2.5 w-2.5" />
                                <span>SECURE</span>
                              </span>
                            </div>
                          </div>

                          {/* Displayed Image */}
                          <div
                            className="relative overflow-hidden cursor-pointer bg-slate-950 flex items-center justify-center min-h-[140px] max-h-[220px]"
                            onClick={() => setViewingImage({
                              name: msg.fileAttachment!.name,
                              url: resolveImageUrl(msg.fileAttachment),
                              sender: msg.senderName,
                              timestamp: msg.timestamp,
                              format: getImageFormatBadge(msg.fileAttachment)
                            })}
                          >
                            <img
                              src={resolveImageUrl(msg.fileAttachment)}
                              alt={msg.fileAttachment.name}
                              referrerPolicy="no-referrer"
                              className="w-full max-h-[220px] object-contain transition-transform duration-300 group-hover/img:scale-102"
                            />
                            {/* Hover overlay button */}
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <span className="bg-brand-navy/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-gold/40 flex items-center space-x-1.5 shadow-lg backdrop-blur">
                                <Maximize2 className="h-3.5 w-3.5 text-brand-gold" />
                                <span>Expand Image Format</span>
                              </span>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="px-3 py-1 bg-slate-900/90 text-[9px] font-mono text-slate-400 flex justify-between items-center border-t border-slate-800/80">
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <CheckCheck className="h-3 w-3 shrink-0" />
                              <span>Verified Transmitted Format</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingImage({
                                name: msg.fileAttachment!.name,
                                url: resolveImageUrl(msg.fileAttachment),
                                sender: msg.senderName,
                                timestamp: msg.timestamp,
                                format: getImageFormatBadge(msg.fileAttachment)
                              })}
                              className="text-brand-gold hover:underline font-bold flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Document attachment pill for PDFs etc */
                        <div className={`mt-2 p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono font-medium ${
                          isMe
                            ? 'bg-brand-blue-slate border-slate-800 text-slate-300'
                            : 'bg-brand-gold/10 border-brand-gold/15 text-brand-gold-dark'
                        }`}>
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 text-brand-gold-dark shrink-0" />
                            <span className="truncate max-w-[150px]">{msg.fileAttachment.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[9px] bg-slate-800/20 px-1.5 py-0.5 rounded text-slate-400 font-bold">PDF</span>
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          </div>
                        </div>
                      )
                    )}

                    {/* Read Receipts indicator */}
                    <div className="flex justify-end mt-1 text-[9px] text-brand-gold/80 font-mono font-semibold">
                      <span>✓ Received & Logged</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Messaging Composer Controls */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {/* Simulated Attachment status banner */}
          {simulatedAttachment && (
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs flex items-center justify-between mb-3 text-white font-mono animate-fade-in shadow-md">
              <div className="flex items-center space-x-3 truncate">
                {isImageAttachment(simulatedAttachment) ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-gold/40 shrink-0 bg-slate-950 flex items-center justify-center">
                    <img
                      src={resolveImageUrl(simulatedAttachment)}
                      alt={simulatedAttachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-brand-gold/20 text-brand-gold rounded-lg shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-200 truncate max-w-[200px]">{simulatedAttachment.name}</span>
                    <span className="bg-brand-gold/20 text-brand-gold text-[9px] px-1.5 py-0.5 rounded font-bold">
                      {getImageFormatBadge(simulatedAttachment)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center space-x-1">
                    <Shield className="h-2.5 w-2.5" />
                    <span>Ready to transmit on secure channel</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSimulatedAttachment(null)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center space-x-2.5">
            {/* Hidden attachment file input - accepts images and docs */}
            <input
              type="file"
              ref={msgFileInputRef}
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleMsgFileSelect}
              className="hidden"
            />

            {/* Simulation attachment options trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => msgFileInputRef.current?.click()}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center space-x-1"
                title="Attach Document or Image"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <div className="absolute bottom-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-150 py-1.5 z-40 hidden group-hover:block hover:block divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Attach Channel File</span>
                  <button type="button" onClick={() => msgFileInputRef.current?.click()} className="text-[9px] text-brand-navy font-bold hover:underline">Browse Computer...</button>
                </div>
                <button
                  type="button"
                  onClick={() => handlePresetAttachment('FICA_Smart_ID_Card.png', 'image/png', SAMPLE_SMART_ID)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium truncate flex items-center space-x-1.5"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                  <span>📷 Pin FICA Smart ID Card (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetAttachment('Sandton_Utility_Rates_Statement.jpg', 'image/jpeg', SAMPLE_UTILITY)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium truncate flex items-center space-x-1.5"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>📄 Pin Municipal Rates Image (JPG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetAttachment('SARS_Payment_Deed_Signed.pdf', 'application/pdf', '#')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium truncate flex items-center space-x-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>📑 Pin Signed Transfer Duty PDF</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              required={!simulatedAttachment}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Draft encrypted dispatch to counsel..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold focus:outline-none"
            />

            <button
              type="submit"
              disabled={isUploadingAttachment}
              className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white p-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-brand-gold" />
            </button>
          </form>
        </div>
      </div>

      {/* High Resolution Image Viewer Lightbox Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingImage(null)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <div className="bg-brand-gold/20 p-2 rounded-lg text-brand-gold border border-brand-gold/30">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans flex items-center space-x-2">
                    <span>{viewingImage.name}</span>
                    <span className="bg-brand-gold/20 text-brand-gold text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      {viewingImage.format}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Sent by <span className="text-brand-gold">{viewingImage.sender}</span> • {new Date(viewingImage.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Image Viewer */}
            <div className="p-6 bg-slate-950/80 flex items-center justify-center overflow-auto max-h-[65vh]">
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[60vh] object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
                <Shield className="h-3.5 w-3.5" />
                <span>FICA Encrypted Channel Asset</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={viewingImage.url}
                  download={viewingImage.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-brand-navy hover:bg-slate-800 border border-slate-700 text-white rounded-lg font-mono text-[11px] font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-brand-gold" />
                  <span>Download Format</span>
                </a>
                <button
                  onClick={() => setViewingImage(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

