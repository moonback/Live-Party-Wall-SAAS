import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses, ImageOrientation } from '../../hooks/useImageOrientation';
import { get4KImageUrl, get4KImageUrlSync, get4KImageSrcSet, get4KImageSrcSetSync, get4KImageSizes } from '../../utils/imageUrl4K';
import { useSettings } from '../../context/SettingsContext';
import { useSmartLazyImage } from '../../hooks/useSmartLazyImage'; // ⚡ OPTIMISATION : Lazy loading intelligent

// ⚡ OPTIMISATION : Composant pour image optimisée avec formats modernes (mémorisé)
const OptimizedImage = React.memo<{
  photo: Photo;
  imageOrientation: ImageOrientation;
  isMobile: boolean;
  index: number;
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
}>(({ photo, imageOrientation, isMobile, index, imageLoaded, setImageLoaded }) => {
  // ⚡ OPTIMISATION : Initialiser avec la valeur synchrone et charger async seulement si nécessaire
  const initialUrl = useMemo(() => get4KImageUrlSync(photo.url, true), [photo.url]);
  const [optimizedUrl, setOptimizedUrl] = useState<string>(initialUrl);
  const [optimizedSrcSet, setOptimizedSrcSet] = useState<string>('');

  useEffect(() => {
    // ⚡ OPTIMISATION : Charger les formats optimisés seulement pour les images prioritaires
    if (index >= 20) {
      // Pour les images non prioritaires, utiliser la version synchrone
      return;
    }

    let cancelled = false;
    const loadOptimized = async () => {
      try {
        const [url, srcSet] = await Promise.all([
          get4KImageUrl(photo.url, true, 'avif'),
          get4KImageSrcSet(photo.url),
        ]);
        if (!cancelled) {
          setOptimizedUrl(url);
          setOptimizedSrcSet(srcSet);
        }
      } catch (error) {
        if (!cancelled) {
          // ⚡ OPTIMISATION : Si AVIF échoue, marquer comme échoué et utiliser l'original
          if (photo.url.includes('.avif')) {
            const { markAvifFailed } = await import('../../utils/imageFormatSupport');
            markAvifFailed(photo.url);
          }
          setOptimizedUrl(get4KImageUrlSync(photo.url, true));
          setOptimizedSrcSet(get4KImageSrcSetSync(photo.url));
        }
      }
    };
    loadOptimized();

    return () => {
      cancelled = true;
    };
  }, [photo.url, index]);

  const imageClasses = useMemo(() => 
    `${getImageClasses(imageOrientation, isMobile)} md:object-cover md:group-hover:scale-[1.02] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`,
    [imageOrientation, isMobile, imageLoaded]
  );

  // ⚡ OPTIMISATION : Gérer les erreurs de chargement AVIF
  const handleImageError = useCallback(async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const src = img.src;
    
    // Si c'est une image AVIF qui échoue, marquer comme échouée et charger l'original
    if (src.includes('.avif')) {
      const { markAvifFailed } = await import('../../utils/imageFormatSupport');
      markAvifFailed(src);
      // Charger l'URL originale sans AVIF
      const originalUrl = get4KImageUrlSync(photo.url, true);
      setOptimizedUrl(originalUrl);
    }
  }, [photo.url]);

  return (
    <img 
      src={optimizedUrl}
      srcSet={optimizedSrcSet || undefined}
      sizes={get4KImageSizes()}
      alt={photo.caption} 
      className={imageClasses}
      loading="lazy"
      decoding="async"
      fetchPriority={index < 20 ? "high" : "low"}
      onLoad={() => setImageLoaded(true)}
      onError={handleImageError}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
});

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
  const { settings } = useSettings();
  
  // ⚡ OPTIMISATION : Mémoriser les badges pour éviter les recalculs
  const photoBadge = useMemo(() => getPhotoBadge(photo, allPhotos), [photo.id, photo.likes_count, allPhotos.length]);
  const authorHasPhotographerBadge = useMemo(() => hasPhotographerBadge(photo.author, allPhotos), [photo.author, allPhotos.length]);

  const imageOrientation: ImageOrientation = useMemo(() => 
    photo.type === 'photo' ? (photo.orientation || 'unknown') : 'unknown',
    [photo.type, photo.orientation]
  );
    
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // ⚡ OPTIMISATION : Debounce resize avec useMemo pour éviter trop de listeners
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;
    const checkMobile = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };
    
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  // ⚡ OPTIMISATION : Lazy loading intelligent avec priorisation
  const { containerRef, shouldLoad, isLoading } = useSmartLazyImage({
    loadDelay: index < 20 ? 0 : 150, // Charger immédiatement les 20 premières (wall visible)
    rootMargin: '300px', // Précharger 300px avant (wall scroll)
    priority: index < 20 ? 'high' : 'low',
    threshold: 0.1,
  });

  // ⚡ OPTIMISATION : Mémoriser les handlers pour éviter les re-renders
  const handleMouseEnter = useCallback(() => setHoveredPhoto(photo.id), [photo.id, setHoveredPhoto]);
  const handleMouseLeave = useCallback(() => setHoveredPhoto(null), [setHoveredPhoto]);
  
  // ⚡ OPTIMISATION : Réduire les animations pour les performances
  const shouldAnimate = index < 50; // Animer seulement les 50 premières photos

  return (
    <motion.div 
      layoutId={shouldAnimate ? `photo-${photo.id}` : undefined}
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : false}
      transition={shouldAnimate ? { duration: 0.3, delay: Math.min((index % 10) * 0.03, 0.3) } : undefined}
      className={`group relative break-inside-avoid bg-slate-900/80 backdrop-blur-sm rounded-none overflow-hidden shadow-none transition-all duration-500 hover:z-[25] border-2 border-white
        ${onClick ? 'cursor-zoom-in' : 'cursor-default'}
        ${index === 0 ? 'z-[15]' : 'z-[10]'}
      `}
      whileHover={onClick && index < 100 ? { scale: 1.05 } : undefined}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      <div 
        ref={containerRef}
        className={`relative overflow-hidden bg-slate-800 rounded-none ${
          isMobile && photo.type === 'photo' && imageOrientation === 'portrait' 
            ? 'min-h-[250px]' 
            : 'aspect-auto'
        }`}
      >
        {shouldLoad ? (
          photo.type === 'video' ? (
            <video
              src={photo.url}
              className="w-full h-auto object-contain max-h-[40vh] md:max-h-none md:object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              preload="metadata"
              loading="lazy"
            />
          ) : (
            <OptimizedImage
              photo={photo}
              imageOrientation={imageOrientation}
              isMobile={isMobile}
              index={index}
              imageLoaded={imageLoaded}
              setImageLoaded={setImageLoaded}
            />
          )
        ) : (
          // ⚡ OPTIMISATION : Placeholder pendant chargement
          <div className={`${imageOrientation === 'portrait' ? 'aspect-[3/4]' : imageOrientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'} bg-slate-800/50 flex items-center justify-center`}>
            {isLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            )}
          </div>
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

