import React from 'react';
import { Send, Search, Paperclip, User, Scale, Shield, FileText, CheckCheck, RefreshCw } from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';

interface MessagingHubProps {
  conversations: Conversation[];
  messages: Message[];
  currentUser: UserType;
  selectedConversationId: string;
  onSendMessage: (text: string, fileAttachment?: { name: string; url: string; type: string }) => void;
  onRefresh: () => void;
}

export default function MessagingHub({ conversations, messages, currentUser, selectedConversationId, onSendMessage, onRefresh }: MessagingHubProps) {
  const [text, setText] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [simulatedAttachment, setSimulatedAttachment] = React.useState<{ name: string; url: string; type: string } | null>(null);

  const activeConversation = conversations.find(c => c.id === selectedConversationId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !simulatedAttachment) return;
    onSendMessage(text, simulatedAttachment || undefined);
    setText('');
    setSimulatedAttachment(null);
  };

  const handlePresetAttachment = (fileName: string, type: string) => {
    setSimulatedAttachment({
      name: fileName,
      url: '#',
      type
    });
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => 
    msg.conversationId === selectedConversationId &&
    (msg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
     msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-premium overflow-hidden h-[540px] flex flex-col md:flex-row" id="messaging-hub">
      {/* Left Sidebar: Conversations list */}
      <div className="w-full md:w-80 border-r border-slate-250/60 flex flex-col bg-slate-50/40">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="font-sans">Secure Channels</span>
            <button onClick={onRefresh} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Refresh Feed">
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
                {activeConversation?.title || 'Pendelton Conveyancing Hub'}
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
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 shadow-md ${
                    isMe
                      ? 'bg-brand-navy text-white rounded-br-none border border-slate-800'
                      : 'bg-white border border-slate-200/65 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between space-x-2 border-b border-slate-200/20 pb-1 mb-1 text-[10px] font-semibold opacity-85">
                      <span className={isMe ? 'text-brand-gold' : 'text-brand-gold-dark'}>{msg.senderName} ({msg.senderRole.toUpperCase()})</span>
                      <span className="font-mono text-[9px] opacity-75">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Text body */}
                    <p className="text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap">{msg.text}</p>

                    {/* Attachment node if exists */}
                    {msg.fileAttachment && (
                      <div className={`mt-2 p-2 rounded-lg border flex items-center space-x-2 text-xs font-mono font-medium ${
                        isMe
                          ? 'bg-brand-blue-slate border-slate-800 text-slate-300'
                          : 'bg-brand-gold/10 border-brand-gold/15 text-brand-gold-dark'
                      }`}>
                        <FileText className="h-4 w-4 text-brand-gold-dark shrink-0" />
                        <span className="truncate max-w-[150px]">{msg.fileAttachment.name}</span>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      </div>
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
            <div className="bg-brand-gold/10 border border-brand-gold/20 p-2 rounded-lg text-xs flex items-center justify-between mb-3 text-brand-gold-dark font-mono font-bold animate-fade-in">
              <span className="flex items-center space-x-1.5">
                <Paperclip className="h-3.5 w-3.5 text-brand-gold-dark" />
                <span>Simulated Attached: {simulatedAttachment.name}</span>
              </span>
              <button onClick={() => setSimulatedAttachment(null)} className="text-rose-600 hover:text-rose-800 font-bold">Cancel</button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center space-x-2.5">
            {/* Simulation attachment options trigger */}
            <div className="relative group">
              <button
                type="button"
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                title="Mock Attachment Pin"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <div className="absolute bottom-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-150 py-1.5 z-40 hidden group-hover:block hover:block divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Mock File Pins</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePresetAttachment('FICA_Proof_Of_Residence.png', 'image/png')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium truncate"
                >
                  + Pin Address Proof Image
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetAttachment('SARS_Payment_Deed_Signed.pdf', 'application/pdf')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium truncate"
                >
                  + Pin Signed SARS Transfer Duty PDF
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
              className="bg-brand-navy hover:bg-brand-navy/95 border border-slate-800 text-white p-2.5 rounded-lg transition-all"
            >
              <Send className="h-4 w-4 text-brand-gold" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
