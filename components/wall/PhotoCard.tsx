import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses, ImageOrientation } from '../../hooks/useImageOrientation';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick?: () => void;
  allPhotos: Photo[];
  hoveredPhoto: string | null;
  setHoveredPhoto: (id: string | null) => void;
  reactions?: ReactionCounts;
}

export const PhotoCard = React.memo(({ 
  photo, 
  index, 
  onClick, 
  allPhotos, 
  setHoveredPhoto, 
  reactions 
}: PhotoCardProps) => {
  const photoBadge = useMemo(() => getPhotoBadge(photo, allPhotos), [photo.id, photo.likes_count, allPhotos.length]);
  const authorHasPhotographerBadge = useMemo(() => hasPhotographerBadge(photo.author, allPhotos), [photo.author, allPhotos.length]);

  const imageOrientation: ImageOrientation = photo.type === 'photo' 
    ? (photo.orientation || 'unknown')
    : 'unknown';
    
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div 
      layoutId={`photo-${photo.id}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
      className={`group relative break-inside-avoid bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-500 hover:z-[25] hover:shadow-[0_20px_60px_rgba(236,72,153,0.5)] border border-slate-700/50
        ${onClick ? 'cursor-zoom-in' : 'cursor-default'}
        ${index === 0 ? 'z-[15]' : 'z-[10]'}
      `}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      onClick={onClick}
      onMouseEnter={() => setHoveredPhoto(photo.id)}
      onMouseLeave={() => setHoveredPhoto(null)}
    >
      {/* Glow effect au hover */}
      <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/30 group-hover:via-purple-500/30 group-hover:to-cyan-500/30 rounded-2xl blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"></div>
      
      {/* Rayon de lumière */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/10 to-transparent transform -skew-x-12 animate-light-ray"></div>
      </div>
      
      {/* Bordure */}
      <div className="absolute inset-0 rounded-2xl border border-slate-600/50 group-hover:border-pink-400/60 transition-colors duration-500 pointer-events-none"></div>

      {/* Media Container */}
      <div className={`relative overflow-hidden bg-slate-800 rounded-t-2xl ${
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
            src={photo.url} 
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
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-md">
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:animate-shimmer-enhanced" />
          </div>
        )}

        {/* Badge vidéo */}
        {photo.type === 'video' && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <span className="text-white text-xs font-bold">🎬</span>
            {photo.duration && <span className="text-white text-[10px] font-medium">{Math.floor(photo.duration)}s</span>}
          </div>
        )}
      </div>
      
      {/* Author */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm px-3 py-2.5 flex items-center justify-end">
        <div className="flex items-center gap-1.5">
          {authorHasPhotographerBadge && <span className="text-xs">📸</span>}
          <p className="text-[10px] md:text-xs font-semibold text-white/90 uppercase tracking-wide truncate max-w-[120px]">
            {photo.author}
          </p>
        </div>
      </div>

      {/* Badge NEW */}
      {index === 0 && (
        <div className="absolute -top-3 -right-3 w-14 h-14 z-20 animate-bounce-slow">
           <div className="relative w-full h-full">
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-cyan-300 animate-spin-slow blur-[2px] opacity-90"></div>
             <div className="absolute inset-[2px] rounded-full bg-slate-900 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
               <span className="text-[11px] font-black text-white italic transform -rotate-12">NEW</span>
             </div>
           </div>
        </div>
      )}

      {/* Badge Star */}
      {photoBadge && (
        <div className="absolute top-3 right-3 z-20">
          <div className="relative bg-gradient-to-r from-pink-500/95 via-purple-500/95 to-pink-500/95 backdrop-blur-md px-3 py-1.5 rounded-full border-2 border-white/40 shadow-lg flex items-center gap-1.5 animate-bounce-slow">
            <span className="text-base relative z-10">⭐</span>
            <span className="text-[10px] font-extrabold text-white relative z-10">Star</span>
          </div>
        </div>
      )}
      
      {/* Likes et Réactions */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 flex-wrap max-w-[120px] justify-end z-10">
        {photo.likes_count > 0 && (
          <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-pink-500/30 flex items-center gap-1">
            <Heart className="w-3 h-3 fill-pink-400 text-pink-400" /> 
            <span>{photo.likes_count}</span>
          </div>
        )}
        {reactions && Object.entries(reactions).map(([type, count]) => {
          if (count === 0) return null;
          const reaction = REACTIONS[type as keyof typeof REACTIONS];
          if (!reaction) return null;
          return (
            <div key={type} className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-500/30 flex items-center gap-1">
              <span className="text-xs">{reaction.emoji}</span>
              <span className="text-[9px]">{count}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});

// Comparaison personnalisée pour React.memo
// On re-rend seulement si les props essentielles changent
export default PhotoCard;

