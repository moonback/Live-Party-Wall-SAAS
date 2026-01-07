import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, ArrowUp } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface GalleryFABProps {
  showScrollTop: boolean;
  onScrollTop: () => void;
  onUploadClick: () => void;
}

export const GalleryFAB: React.FC<GalleryFABProps> = ({
  showScrollTop,
  onScrollTop,
  onUploadClick
}) => {
  const isMobile = useIsMobile();

  return createPortal(
    <div className={`fixed z-[9999] flex flex-col gap-3 items-end pointer-events-auto ${
      isMobile ? 'bottom-5 right-5' : 'bottom-6 right-6'
    }`}>
      {/* Scroll Top Button */}
      {showScrollTop && (
        <button
          onClick={onScrollTop}
          className={`relative bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-xl rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl border border-white/20 hover:border-pink-500/40 transition-all duration-300 animate-fade-in-up touch-manipulation group ${
            isMobile 
              ? 'w-12 h-12 active:scale-95' 
              : 'w-14 h-14 hover:scale-110'
          }`}
          title="Haut de page"
          aria-label="Retourner en haut de la page"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all duration-300 blur-sm" />
          <ArrowUp className={`relative ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} group-hover:-translate-y-0.5 transition-transform duration-300`} />
        </button>
      )}

      {/* Upload FAB */}
      <button
        onClick={onUploadClick}
        className={`relative bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-3xl hover:shadow-pink-900/50 transition-all duration-300 touch-manipulation overflow-hidden group ${
          isMobile 
            ? 'w-16 h-16 active:scale-90' 
            : 'w-16 h-16 hover:scale-110 active:scale-95'
        }`}
        aria-label="Envoyer une photo"
        title="Envoyer une photo"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <div className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
        <Camera className={`relative ${isMobile ? 'w-7 h-7' : 'w-7 h-7'} group-hover:scale-110 transition-transform duration-300`} />
      </button>
    </div>,
    document.body
  );
};

