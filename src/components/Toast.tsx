import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Bell, MessageSquare, X, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { key?: string; toast: ToastMessage; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-slate-900 border-emerald-500/60 text-slate-100',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          icon: <CheckCircle className="h-5 w-5" />,
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        };
      case 'warning':
        return {
          bg: 'bg-slate-900 border-amber-500/60 text-slate-100',
          iconBg: 'bg-amber-500/20 text-amber-400',
          icon: <AlertTriangle className="h-5 w-5" />,
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        };
      case 'error':
        return {
          bg: 'bg-slate-900 border-rose-500/60 text-slate-100',
          iconBg: 'bg-rose-500/20 text-rose-400',
          icon: <XCircle className="h-5 w-5" />,
          badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        };
      default:
        return {
          bg: 'bg-brand-navy border-brand-gold/60 text-white',
          iconBg: 'bg-brand-gold/20 text-brand-gold',
          icon: <MessageSquare className="h-5 w-5" />,
          badge: 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-2xl transition-all duration-300 transform translate-y-0 animate-slide-in ${style.bg}`}
    >
      <div className="flex items-start space-x-3 min-w-0 pr-2">
        <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
          {style.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold font-sans tracking-wide truncate">{toast.title}</h4>
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${style.badge}`}>
              {toast.type}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-sans leading-snug">{toast.message}</p>
          <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
            {toast.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
