import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(id), 280);
  };

  useEffect(() => {
    closeTimerRef.current = window.setTimeout(() => {
      requestClose();
    }, 5000);
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, [id]);

  const bgColors = {
    success: 'from-emerald-500/90 via-emerald-600/90 to-emerald-500/90',
    error: 'from-red-500/90 via-rose-600/90 to-red-500/90',
    info: 'from-sky-500/90 via-indigo-600/90 to-sky-500/90'
  } as const;

  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`relative overflow-hidden flex items-center p-4 mb-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] text-white min-w-[280px] max-w-[420px] backdrop-blur-xl border border-white/20 bg-gradient-to-r ${bgColors[type]} ${closing ? 'animate-fade-out' : 'animate-slide-in'} transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02]`}>
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${bgColors[type]} opacity-0 blur-xl transition-opacity duration-300 hover:opacity-30`} />
      
      {/* Life bar */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/20 rounded-b-2xl overflow-hidden">
        <div className={`h-full w-full bg-white/80 ${closing ? '' : 'animate-toast-life'} rounded-full`} />
      </div>

      {/* Icon with pulse animation */}
      <div className="relative mr-3 flex-shrink-0">
        <span className="text-xl drop-shadow-lg relative z-10">{icons[type]}</span>
        {!closing && (
          <div className={`absolute inset-0 ${type === 'success' ? 'bg-emerald-400' : type === 'error' ? 'bg-red-400' : 'bg-sky-400'} rounded-full opacity-20 animate-ping`} style={{ animationDuration: '2s' }} />
        )}
      </div>
      
      <p className="flex-1 font-semibold leading-snug text-sm md:text-base pr-2">{message}</p>
      
      <button 
        onClick={requestClose}
        className="ml-2 flex-shrink-0 text-white/70 hover:text-white active:scale-90 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 backdrop-blur-sm"
        aria-label="Fermer la notification"
        title="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

