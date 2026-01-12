import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';
import { ImageOrientation } from '../../hooks/useImageOrientation';
import { OptimizedImage } from './OptimizedImage';
import { useSettings } from '../../context/SettingsContext';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick?: () => void;
  photoBadge?: { type: string; emoji: string } | null;
  authorHasPhotographerBadge?: boolean;
  reactions?: ReactionCounts;
}

export const PhotoCard = React.memo(({ 
  photo, 
  index, 
  onClick, 
  photoBadge,
  authorHasPhotographerBadge = false,
  reactions 
}: PhotoCardProps) => {
  const { settings } = useSettings();

  const imageOrientation: ImageOrientation = photo.type === 'photo' 
    ? (photo.orientation || 'unknown')
    : 'unknown';
    
  const isMobile = useIsMobile();

  return (
    <div 
      className={`group relative break-inside-avoid bg-slate-900/80 rounded-none overflow-hidden shadow-none transition-transform duration-300 hover:z-[25] border-2 border-white
        ${onClick ? 'cursor-zoom-in hover:scale-[1.02]' : 'cursor-default'}
        ${index === 0 ? 'z-[15]' : 'z-[10]'}
      `}
      style={{
        opacity: 1,
        transform: 'scale(1) translateY(0)',
        willChange: 'transform'
      }}
      onClick={onClick}
    >
      {/* Glow effect au hover - simplifié */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/20 group-hover:via-purple-500/20 group-hover:to-cyan-500/20 rounded-none blur-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"></div>
      
      {/* Bordure blanche */}
      <div className="absolute inset-0 border-2 border-white pointer-events-none"></div>

      {/* Media Container */}
      <div className={`relative overflow-hidden bg-slate-800 rounded-none ${
        isMobile && photo.type === 'photo' && imageOrientation === 'portrait' 
          ? 'min-h-[250px]' 
          : 'aspect-auto'
      }`}>
        {photo.type === 'video' ? (
          <video
            src={photo.url}
            className="w-full h-auto object-contain max-h-[40vh] md:max-h-none md:object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            preload="metadata"
          />
        ) : (
          <OptimizedImage
            src={photo.url}
            alt={photo.caption}
            orientation={imageOrientation}
            isMobile={isMobile}
            className="md:object-cover"
          />
        )}
        
        {/* Shine Effect - simplifié */}
        {photo.type === 'photo' && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-none">
            <div className="absolute top-0 left-0 h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-20" />
          </div>
        )}

        {/* Badge vidéo */}
        {photo.type === 'video' && (
          <div className="absolute top-2 left-2 z-20">
            <div className="relative bg-gradient-to-r from-red-500/90 via-purple-500/90 to-blue-500/90 px-2 py-1 rounded-full border border-white/30 shadow-md flex items-center gap-1">
              <span className="text-white text-xs font-bold drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">🎬</span>
              {photo.duration && (
                <span className="text-white text-[10px] font-medium drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]">{Math.floor(photo.duration)}s</span>
              )}
            </div>
          </div>
        )}

        {/* Likes et Réactions - En haut, discrets */}
        {(photo.likes_count > 0 || (reactions && Object.values(reactions).some(count => count > 0))) && (
          <div className="absolute top-2 md:top-3 lg:top-4 right-2 md:right-3 lg:right-4 flex items-center gap-1 md:gap-1.5 flex-wrap justify-end z-10 opacity-70 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {photo.likes_count > 0 && (
              <div className="bg-black/70 text-white/80 text-[10px] md:text-xs lg:text-sm font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-pink-500/20 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 fill-pink-400/70 text-pink-400/70" /> 
                <span>{photo.likes_count}</span>
              </div>
            )}
            {reactions && Object.entries(reactions).map(([type, count]) => {
              if (count === 0) return null;
              const reaction = REACTIONS[type as keyof typeof REACTIONS];
              if (!reaction) return null;
              return (
                <div key={type} className="bg-black/70 text-white/80 text-[10px] md:text-xs lg:text-sm font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-slate-500/20 flex items-center gap-1">
                  <span className="text-xs md:text-sm lg:text-base opacity-80">{reaction.emoji}</span>
                  <span className="text-[9px] md:text-[10px] lg:text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Logo Watermark */}
        {settings.logo_url && settings.logo_watermark_enabled && (
          <div className="absolute bottom-2 md:bottom-3 lg:bottom-4 left-2 md:left-3 lg:left-4 z-20 pointer-events-none">
            <div className="bg-black/40 rounded-lg md:rounded-xl p-1 md:p-1.5 border border-white/10 shadow-md">
              <img
                src={settings.logo_url}
                alt="Logo événement"
                className={`${isMobile ? 'h-6 w-auto max-w-[80px]' : 'h-8 md:h-10 lg:h-12 w-auto max-w-[120px] lg:max-w-[150px]'} object-contain opacity-80`}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Badge NEW - Bandeau au-dessus du nom - simplifié */}
      {index === 0 && (
        <div className="pointer-events-none select-none absolute bottom-12 md:bottom-14 lg:bottom-16 left-2 md:left-3 z-30 flex items-center gap-2">
          <div className="relative">
            {/* Effet de halo simplifié */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500/50 via-purple-500/40 to-cyan-400/40 blur-xl opacity-60" />
            
            {/* Bandeau principal */}
            <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400/90 px-4 lg:px-5 py-1.5 md:py-2 rounded-full border border-white/80 shadow-lg flex items-center justify-center">
              <span className="mr-1.5 text-xs md:text-sm lg:text-base">✨</span>
              <span className="text-xs md:text-sm lg:text-base font-extrabold text-white tracking-widest drop-shadow-[0_1px_3px_rgba(236,72,153,0.5)] relative z-10 italic">
                New
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Badge Star - simplifié */}
      {photoBadge && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 z-20">
          <div className="relative w-auto">
            {/* Glow effect simplifié */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-pink-500/40 blur-md opacity-60"></div>
            
            {/* Badge principal */}
            <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-2 py-1 rounded-full border border-white/60 shadow-md flex items-center gap-1">
              <span className="text-sm md:text-base relative z-10 drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]">⭐</span>
              <span className="text-[10px] md:text-xs font-extrabold text-white relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] tracking-tight">Star</span>
            </div>
          </div>
        </div>
      )}

      {/* Auteur sous la photo */}
      <div className="pointer-events-none select-none absolute bottom-1 md:bottom-2 left-1 md:left-2 z-30">
        <div className="flex items-center gap-1 bg-gradient-to-r from-black/90 via-black/85 to-black/90 px-1.5 md:px-2 py-1 rounded-md shadow-md border border-white/20 transition-all duration-200 group/author relative min-h-[22px]">
          {authorHasPhotographerBadge && (
            <span className="text-xs md:text-sm relative inline-block z-10 leading-none drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]">📸</span>
          )}
          <p className="text-xs md:text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] tracking-wider truncate max-w-[60px] md:max-w-[90px] relative z-10 leading-none">
            {photo.author}
          </p>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour React.memo
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.likes_count === nextProps.photo.likes_count &&
    prevProps.photo.url === nextProps.photo.url &&
    prevProps.photo.caption === nextProps.photo.caption &&
    prevProps.photo.author === nextProps.photo.author &&
    prevProps.index === nextProps.index &&
    prevProps.photoBadge === nextProps.photoBadge &&
    prevProps.authorHasPhotographerBadge === nextProps.authorHasPhotographerBadge &&
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions)
  );
});

// Comparaison personnalisée pour React.memo
// On re-rend seulement si les props essentielles changent
export default PhotoCard;

