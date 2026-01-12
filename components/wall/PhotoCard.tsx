import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses, ImageOrientation } from '../../hooks/useImageOrientation';
import { get4KImageUrl, get4KImageSrcSet, get4KImageSizes } from '../../utils/imageUrl4K';
import { useSettings } from '../../context/SettingsContext';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick?: () => void;
  allPhotos: Photo[];
  reactions?: ReactionCounts;
}

export const PhotoCard = React.memo(({ 
  photo, 
  index, 
  onClick, 
  allPhotos, 
  reactions 
}: PhotoCardProps) => {
  const { settings } = useSettings();
  const photoBadge = useMemo(() => getPhotoBadge(photo, allPhotos), [photo.id, photo.likes_count, allPhotos.length]);
  const authorHasPhotographerBadge = useMemo(() => hasPhotographerBadge(photo.author, allPhotos), [photo.author, allPhotos.length]);

  const imageOrientation: ImageOrientation = photo.type === 'photo' 
    ? (photo.orientation || 'unknown')
    : 'unknown';
    
  const isMobile = useIsMobile();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div 
      layoutId={`photo-${photo.id}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
      className={`group relative break-inside-avoid bg-slate-900/80 backdrop-blur-sm rounded-none overflow-hidden shadow-none transition-all duration-500 hover:z-[25] border-2 border-white
        ${onClick ? 'cursor-zoom-in' : 'cursor-default'}
        ${index === 0 ? 'z-[15]' : 'z-[10]'}
      `}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      onClick={onClick}
    >
      {/* Glow effect au hover */}
      <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/30 group-hover:via-purple-500/30 group-hover:to-cyan-500/30 rounded-none blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"></div>
      
      {/* Rayon de lumière */}
      <div className="absolute inset-0 overflow-hidden rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/10 to-transparent transform -skew-x-12 animate-light-ray"></div>
      </div>
      
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
            className="w-full h-auto object-contain max-h-[40vh] md:max-h-none md:object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            preload="metadata"
          />
        ) : (
          <img 
            src={get4KImageUrl(photo.url, true)} 
            srcSet={get4KImageSrcSet(photo.url)}
            sizes={get4KImageSizes()}
            alt={photo.caption} 
            className={`${getImageClasses(imageOrientation, isMobile)} md:object-cover md:group-hover:scale-[1.02] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        )}
        
        {/* Shine Effect */}
        {photo.type === 'photo' && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-none">
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:animate-shimmer-enhanced" />
          </div>
        )}

        {/* Badge vidéo */}
        {photo.type === 'video' && (
          <div className="absolute top-2 left-2 z-20">
            <div className="relative bg-gradient-to-r from-red-500/90 via-purple-500/90 to-blue-500/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/30 shadow-lg flex items-center gap-1">
              <span className="text-white text-xs font-bold drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]">🎬</span>
              {photo.duration && (
                <span className="text-white text-[10px] font-medium drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]">{Math.floor(photo.duration)}s</span>
              )}
              {/* Effet de brillance subtil */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer-enhanced"></div>
              </div>
            </div>
          </div>
        )}

        {/* Likes et Réactions - En haut, discrets */}
        {(photo.likes_count > 0 || (reactions && Object.values(reactions).some(count => count > 0))) && (
          <div className="absolute top-2 md:top-3 lg:top-4 right-2 md:right-3 lg:right-4 flex items-center gap-1 md:gap-1.5 flex-wrap justify-end z-10 opacity-70 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {photo.likes_count > 0 && (
              <div className="bg-black/60 backdrop-blur-sm text-white/80 text-[10px] md:text-xs lg:text-sm font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-pink-500/20 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 fill-pink-400/70 text-pink-400/70" /> 
                <span>{photo.likes_count}</span>
              </div>
            )}
            {reactions && Object.entries(reactions).map(([type, count]) => {
              if (count === 0) return null;
              const reaction = REACTIONS[type as keyof typeof REACTIONS];
              if (!reaction) return null;
              return (
                <div key={type} className="bg-black/60 backdrop-blur-sm text-white/80 text-[10px] md:text-xs lg:text-sm font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-slate-500/20 flex items-center gap-1">
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
            <div className="bg-black/30 backdrop-blur-sm rounded-lg md:rounded-xl p-1 md:p-1.5 border border-white/10 shadow-lg">
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
      
      {/* Badge NEW - Bandeau au-dessus du nom */}
      {index === 0 && (
        <div className="pointer-events-none select-none absolute bottom-12 md:bottom-14 lg:bottom-16 left-2 md:left-3 z-30 animate-bounce-slow">
          <div className="relative">
            {/* Glow effect animé */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500/60 via-purple-500/60 to-cyan-400/60 blur-lg opacity-75 animate-pulse"></div>
            
            {/* Bandeau principal */}
            <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/60 shadow-[0_0_15px_rgba(236,72,153,0.6)] flex items-center justify-center">
              <span className="text-[10px] md:text-xs lg:text-sm font-black text-white italic drop-shadow-[0_0_6px_rgba(236,72,153,0.8)] relative z-10 tracking-wide">
                NEW
              </span>
              
              {/* Effet de brillance */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 animate-pulse">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer-enhanced"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Star */}
      {photoBadge && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 z-20">
          <div className="relative w-auto">
            {/* Glow effect animé */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-pink-500/60 blur-lg opacity-75 animate-pulse"></div>
            
            {/* Badge principal */}
            <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 backdrop-blur-md px-2 py-1 rounded-full border border-white/60 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center gap-1 animate-bounce-slow">
              {/* Effet de brillance sur l'étoile */}
              <span className="text-sm md:text-base relative z-10 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-spin-slow" style={{ animationDuration: '3s' }}>⭐</span>
              <span className="text-[10px] md:text-xs font-extrabold text-white relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] tracking-tight">Star</span>
              
              {/* Effet de scintillement */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 animate-pulse">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer-enhanced"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auteur sous la photo */}
      <div className="pointer-events-none select-none absolute bottom-3 md:bottom-4 left-3 md:left-4 z-30">
        <div className="flex items-center gap-2 md:gap-2.5 bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-md px-4 md:px-5 py-2 md:py-2.5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-2 border-white/40 hover:border-white/60 transition-all duration-300 group/author">
          {/* Glow effect animé */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur-md opacity-0 group-hover/author:opacity-100 transition-opacity duration-500"></div>
          
          {authorHasPhotographerBadge && (
            <span className="text-lg md:text-xl lg:text-2xl relative inline-block z-10">
              {/* Glow effect pour le badge photographe */}
              <span className="absolute inset-0 blur-md opacity-70 animate-pulse">📸</span>
              <span className="relative drop-shadow-[0_0_8px_rgba(251,191,36,1)] filter brightness-110">📸</span>
            </span>
          )}
          <p className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wider truncate max-w-[140px] md:max-w-[180px] lg:max-w-[220px] relative z-10">
            {photo.author}
          </p>
          
          {/* Effet de brillance subtil */}
          <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover/author:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer-enhanced"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Comparaison personnalisée pour React.memo
// On re-rend seulement si les props essentielles changent
export default PhotoCard;

