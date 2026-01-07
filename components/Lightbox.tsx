import React from 'react';
import { Photo } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Heart, ArrowLeft, ArrowRight, X } from 'lucide-react';

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalPhotos: number;
  downloadUrl: string;
}

const Lightbox: React.FC<LightboxProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalPhotos,
  downloadUrl
}) => {
  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
        <div className="relative w-full max-w-6xl">
          {/* Close Button - Amélioré */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border-2 border-white/20 text-white min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 px-5 py-3 sm:py-2.5 rounded-2xl backdrop-blur-xl transition-all duration-300 font-bold text-sm shadow-2xl hover:scale-110 active:scale-95 z-50 flex items-center justify-center"
            aria-label="Fermer"
          >
            <span className="flex items-center gap-2">
              <X className="w-5 h-5" />
              <span className="hidden md:inline">Fermer</span>
            </span>
          </button>

          {/* Navigation - Améliorée */}
          {totalPhotos > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 active:scale-95 border-2 border-white/30 text-white w-14 h-14 md:w-16 md:h-16 rounded-2xl backdrop-blur-xl transition-all duration-300 text-2xl shadow-2xl hover:scale-110 z-50 flex items-center justify-center"
                aria-label="Photo précédente"
              >
                <ArrowLeft className="w-8 h-8" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 active:scale-95 border-2 border-white/30 text-white w-14 h-14 md:w-16 md:h-16 rounded-2xl backdrop-blur-xl transition-all duration-300 text-2xl shadow-2xl hover:scale-110 z-50 flex items-center justify-center"
                aria-label="Photo suivante"
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Content - Amélioré avec effet Polaroid premium */}
          <div className="relative bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.5)] border-4 border-white/80 animate-scale-in p-5 md:p-6 transform rotate-0 hover:rotate-0 transition-transform duration-500">
            {/* Glow multicolore */}
            <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl opacity-30 blur-2xl" style={{ animation: 'pulseSlow 8s ease-in-out infinite' }}></div>
            
            {/* Media Container */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {photo.type === 'video' ? (
                <video
                  src={photo.url}
                  className="w-full max-h-[70vh] md:max-h-[80vh] object-contain"
                  controls
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full max-h-[60vh] md:max-h-[70vh] object-contain"
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              )}
            </div>
            
            {/* Caption Section avec design amélioré */}
            <div className="relative p-4 md:p-6 text-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-handwriting text-3xl md:text-4xl leading-tight text-slate-800 mb-2 drop-shadow-sm">
                    {photo.caption}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-pink-500 to-transparent"></div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-extrabold">
                      Par {photo.author}
                    </p>
                  </div>
                </div>
                
                {/* Likes Counter */}
                {photo.likes_count > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-pink-100 to-pink-50 px-4 py-2 rounded-2xl shadow-lg border-2 border-pink-200/50">
                    <Heart className="w-5 h-5 text-pink-500 fill-current animate-pulse" />
                    <span className="text-lg font-extrabold text-pink-600">{photo.likes_count}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Decorative corner marks */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-pink-400/50 rounded-tl-xl"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-pink-400/50 rounded-tr-xl"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-pink-400/50 rounded-bl-xl"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-pink-400/50 rounded-bl-xl"></div>
          </div>
          
          {/* Counter en bas */}
          {totalPhotos > 1 && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-6 py-2 rounded-full border border-white/20 text-white text-sm font-bold shadow-2xl">
              {currentIndex + 1} / {totalPhotos}
            </div>
          )}

          {/* QR Code pour télécharger la photo - En bas à droite */}
          <div className="absolute -bottom-1 right-0 md:right-4 z-50">
            <div className="relative bg-gradient-to-br from-white via-white to-gray-50 p-3 md:p-4 rounded-2xl shadow-2xl transition-all duration-500 group border-2 border-white/50 transform rotate-[2deg] hover:rotate-0 hover:scale-105 hover:shadow-[0_20px_60px_rgba(34,211,238,0.4)]">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
              
              {/* QR Code Container */}
              <div className="relative bg-white p-2.5 rounded-xl shadow-inner">
                <QRCodeCanvas 
                  value={downloadUrl} 
                  size={100}
                  level={"H"}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  includeMargin={false}
                  key={photo.id} // Réinitialiser le QR code quand la photo change
                />
                {/* Logo overlay center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full p-1 shadow-lg">
                    <span className="text-xl md:text-2xl drop-shadow-md">⬇️</span>
                  </div>
                </div>
              </div>
              
              {/* Text avec animations */}
              <div className="text-center mt-2 relative z-10">
                <p className="text-slate-900 font-extrabold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-0.5 group-hover:text-cyan-600 transition-colors">Télécharger</p>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 font-extrabold text-[9px] md:text-[10px]">cette photo !</p>
              </div>
              
              {/* Decorative corner marks */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-lg"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/40 rounded-br-lg"></div>
              
              {/* Effet de scotch (tape) en haut */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/60 backdrop-blur-sm border border-white/80 shadow-md opacity-70 group-hover:opacity-90 transition-opacity" style={{ transform: 'translateX(-50%) rotate(2deg)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;

