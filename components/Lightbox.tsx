import React, { useMemo } from 'react';
import { Photo, ReactionCounts } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Heart, ArrowLeft, ArrowRight, X, Clock, User, Tag, TrendingUp } from 'lucide-react';
import { REACTIONS } from '../constants';

// Fonction pour obtenir le temps relatif (ex: "Il y a 5 minutes")
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalPhotos: number;
  downloadUrl: string;
  reactions?: ReactionCounts;
  isAutoMode?: boolean; // Indique si le modal a été ouvert automatiquement
}

const Lightbox: React.FC<LightboxProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalPhotos,
  downloadUrl,
  reactions,
  isAutoMode = false
}) => {
  // Formater la date et l'heure
  const formattedDate = useMemo(() => {
    const date = new Date(photo.timestamp);
    return {
      date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(date)
    };
  }, [photo.timestamp]);

  // Calculer le total des réactions
  const totalReactions = useMemo(() => {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((sum, count) => sum + (count || 0), 0);
  }, [reactions]);

  // Calculer le total d'engagement (likes + réactions)
  const totalEngagement = photo.likes_count + totalReactions;
  return (
    <div className="fixed inset-0 z-50 animate-fade-in overflow-hidden">
      {/* Backdrop avec blur moderne */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container principal - Plein écran */}
      <div className="relative h-full w-full flex flex-col p-2 md:p-4 lg:p-6">
        <div className="relative w-full h-full max-w-[100vw] mx-auto flex flex-col">
          {/* Header avec boutons de contrôle */}
          <div className="absolute top-2 md:top-4 left-0 right-0 flex items-center justify-between z-50 px-2 md:px-4">
            {/* Indicateur mode automatique */}
            {isAutoMode && (
              <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/20 shadow-2xl animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">Mode automatique</span>
                </div>
              </div>
            )}
            
            {/* Close Button - Design moderne */}
            <button
              onClick={onClose}
              className="ml-auto bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white w-9 h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 flex items-center justify-center group"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Navigation - Design moderne et discret */}
          {totalPhotos > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 z-50 flex items-center justify-center group"
                aria-label="Photo précédente"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 z-50 flex items-center justify-center group"
                aria-label="Photo suivante"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          {/* Content - Design moderne et épuré - Plein écran */}
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-scale-in flex-1 flex flex-col min-h-0">
            {/* Media Container - Utilise l'espace disponible */}
            <div className="relative bg-gradient-to-br from-slate-900 via-black to-slate-900 overflow-hidden flex-1 flex items-center justify-center min-h-0">
              {photo.type === 'video' ? (
                <video
                  src={photo.url}
                  className="w-full h-full max-h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full max-h-full object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    height: 'auto'
                  }}
                />
              )}
            </div>

            {/* Info Panel - Design moderne et organisé - Scrollable */}
            <div className="relative bg-white p-4 md:p-6 lg:p-8 overflow-y-auto max-h-[40vh] md:max-h-[35vh] lg:max-h-[30vh]">
              {/* Légende principale - Adaptée plein écran */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-slate-900 leading-tight mb-3 md:mb-4 max-w-full break-words">
                  {photo.caption}
                </h2>
              </div>

              {/* Grid d'informations - 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                {/* Auteur et date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Auteur</p>
                      <p className="text-sm md:text-base font-bold text-slate-900">{photo.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm pl-13">
                    <Clock className="w-4 h-4" />
                    <span>{formattedDate.relative}</span>
                    <span className="text-slate-400">•</span>
                    <span>{formattedDate.time}</span>
                  </div>
                </div>

                {/* Statistiques d'engagement */}
                {totalEngagement > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Engagement</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {photo.likes_count > 0 && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-2.5 rounded-xl border border-pink-200/50 shadow-sm">
                          <Heart className="w-5 h-5 text-pink-500 fill-current" />
                          <span className="text-base font-bold text-pink-600">{photo.likes_count}</span>
                        </div>
                      )}
                      {totalReactions > 0 && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2.5 rounded-xl border border-purple-200/50 shadow-sm">
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                          <span className="text-base font-bold text-purple-600">{totalReactions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Réactions détaillées */}
              {reactions && totalReactions > 0 && (
                <div className="pt-4 md:pt-6 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 md:mb-4">Réactions</p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {Object.entries(reactions).map(([type, count]) => {
                      if (!count || count === 0) return null;
                      const reaction = REACTIONS[type as keyof typeof REACTIONS];
                      if (!reaction) return null;
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md hover:border-slate-300/50 transition-all cursor-default"
                        >
                          <span className="text-lg">{reaction.emoji}</span>
                          <span className="text-sm font-bold text-slate-700">{count}</span>
                          <span className="text-xs text-slate-500 hidden sm:inline ml-1">{reaction.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="pt-4 md:pt-6 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs font-medium rounded-lg border border-cyan-200/50 hover:border-cyan-300/50 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer avec compteur et QR Code - Fixe en bas */}
          <div className="absolute bottom-2 md:bottom-4 left-0 right-0 flex items-center justify-between z-50 px-2 md:px-4">
            {/* Counter */}
            {totalPhotos > 1 && (
              <div className="bg-white/10 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/20 text-white text-xs md:text-sm font-semibold shadow-xl">
                {currentIndex + 1} / {totalPhotos}
              </div>
            )}

            {/* QR Code pour télécharger - Design moderne */}
            <div className="ml-auto">
              <div className="relative bg-white/95 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl border border-white/30 transition-all duration-300 hover:scale-105 group">
                <div className="relative bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <QRCodeCanvas 
                    value={downloadUrl} 
                    size={60}
                    level={"H"}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    includeMargin={false}
                    key={photo.id}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-full p-0.5 md:p-1 shadow-md">
                      <span className="text-sm md:text-base">⬇️</span>
                    </div>
                  </div>
                </div>
                <p className="text-center mt-1 md:mt-2 text-[9px] md:text-[10px] font-bold text-slate-700 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
                  Télécharger
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;

