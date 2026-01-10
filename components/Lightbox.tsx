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

          {/* Content - Design moderne et épuré - Plein écran - Thème sombre */}
          <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 animate-scale-in flex-1 flex flex-col min-h-0">
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

            {/* Info Panel - Design compact et thème sombre - Scrollable */}
            <div className="relative bg-slate-900 p-3 md:p-4 overflow-y-auto max-h-[35vh] md:max-h-[30vh] lg:max-h-[25vh]">
              {/* Légende principale - Compacte */}
              <div className="mb-3">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 max-w-full break-words">
                  {photo.caption}
                </h2>
              </div>

              {/* Grid d'informations - 2 colonnes - Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Auteur et date */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Auteur</p>
                      <p className="text-xs md:text-sm font-bold text-white truncate">{photo.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] md:text-xs pl-10">
                    <Clock className="w-3 h-3" />
                    <span>{formattedDate.relative}</span>
                    <span className="text-slate-600">•</span>
                    <span>{formattedDate.time}</span>
                  </div>
                </div>

                {/* Statistiques d'engagement */}
                {totalEngagement > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Engagement</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {photo.likes_count > 0 && (
                        <div className="flex items-center gap-1.5 bg-pink-500/20 px-2.5 py-1.5 rounded-lg border border-pink-500/30">
                          <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
                          <span className="text-xs font-bold text-pink-300">{photo.likes_count}</span>
                        </div>
                      )}
                      {totalReactions > 0 && (
                        <div className="flex items-center gap-1.5 bg-purple-500/20 px-2.5 py-1.5 rounded-lg border border-purple-500/30">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-bold text-purple-300">{totalReactions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Réactions détaillées - Compact */}
              {reactions && totalReactions > 0 && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Réactions</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.entries(reactions).map(([type, count]) => {
                      if (!count || count === 0) return null;
                      const reaction = REACTIONS[type as keyof typeof REACTIONS];
                      if (!reaction) return null;
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-default"
                        >
                          <span className="text-sm">{reaction.emoji}</span>
                          <span className="text-xs font-bold text-slate-300">{count}</span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline ml-0.5">{reaction.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags - Compact */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    Tags
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-medium rounded border border-cyan-500/30 hover:border-cyan-500/50 transition-colors"
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
            {/* Counter - Masqué en mode automatique */}
            {totalPhotos > 1 && !isAutoMode && (
              <div className="bg-white/10 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/20 text-white text-xs md:text-sm font-semibold shadow-xl">
                {currentIndex + 1} / {totalPhotos}
              </div>
            )}

            {/* QR Code pour télécharger - Design moderne - Thème sombre */}
            <div className="ml-auto">
              <div className="relative bg-slate-800/95 backdrop-blur-xl p-2 rounded-xl shadow-2xl border border-slate-700/50 transition-all duration-300 hover:scale-105 group">
                <div className="relative bg-white p-1.5 rounded-lg">
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
                    <div className="bg-white rounded-full p-0.5 shadow-md">
                      <span className="text-sm">⬇️</span>
                    </div>
                  </div>
                </div>
                <p className="text-center mt-1 text-[9px] font-bold text-slate-300 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
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

