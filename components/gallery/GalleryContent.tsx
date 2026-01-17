import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo, PhotoBattle, GalleryViewMode } from '../../types';
import { GuestPhotoCard } from './GuestPhotoCard';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import { PhotoCardSkeletons } from '../PhotoCardSkeleton';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { ReactionType } from '../../types';
import { motion } from 'framer-motion';

interface GalleryContentProps {
  loading: boolean;
  photos: Photo[];
  battles: PhotoBattle[];
  showBattles: boolean;
  battleModeEnabled: boolean;
  likedPhotoIds: Set<string>;
  downloadingIds: Set<string>;
  userReactions: Map<string, ReactionType>;
  photosReactions: Map<string, import('../../types').ReactionCounts>;
  guestAvatars: Map<string, string>;
  searchQuery: string;
  mediaFilter: string;
  onLike: (id: string) => void;
  onDownload: (photo: Photo) => void;
  onReaction: (photoId: string, reactionType: ReactionType | null) => void;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  onPhotoClick?: (photo: Photo, index: number) => void;
  onNavigatePhoto?: (direction: 'next' | 'prev', currentIndex: number) => void;
  userId: string;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onUpdateCaption?: (photoId: string, caption: string) => Promise<void>;
  onClearCaption?: (photoId: string) => Promise<void>;
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<void>;
  viewMode?: GalleryViewMode;
}

type ColumnItem = 
  | { type: 'photo'; photo: Photo; originalIndex: number }
  | { type: 'battle'; battle: PhotoBattle };

interface VirtualColumnProps {
  data: ColumnItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  allPhotos: Photo[];
  likedPhotoIds: Set<string>;
  downloadingIds: Set<string>;
  userReactions: Map<string, ReactionType>;
  photosReactions: Map<string, import('../../types').ReactionCounts>;
  guestAvatars: Map<string, string>;
  onLike: (id: string) => void;
  onDownload: (photo: Photo) => void;
  onReaction: (photoId: string, reactionType: ReactionType | null) => void;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  onPhotoClick?: (photo: Photo, index: number) => void;
  onNavigatePhoto?: (direction: 'next' | 'prev', currentIndex: number) => void;
  userId: string;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelect?: (id: string) => void;
  numColumns: number;
  isMobile: boolean;
  onUpdateCaption?: (photoId: string, caption: string) => Promise<void>;
  onClearCaption?: (photoId: string) => Promise<void>;
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<void>;
}

const VirtualColumn = React.memo(({ 
  data, 
  scrollContainerRef, 
  allPhotos,
  likedPhotoIds,
  downloadingIds,
  userReactions,
  photosReactions,
  guestAvatars,
  onLike,
  onDownload,
  onReaction,
  onBattleFinished,
  onPhotoClick,
  onNavigatePhoto,
  userId,
  selectionMode,
  selectedIds,
  onSelect,
  numColumns,
  isMobile,
  onUpdateCaption,
  onClearCaption,
  onDeletePhoto
}: VirtualColumnProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  const overscan = useMemo(() => {
    // Optimisation : réduire l'overscan pour améliorer les performances
    const MIN_PHOTOS_TOTAL = 50; // Réduit de 100 à 50
    const photosPerColumn = Math.ceil(MIN_PHOTOS_TOTAL / numColumns);
    
    // Estimation moyenne de la hauteur basée sur les photos dans cette colonne
    let avgHeight = 400;
    if (data.length > 0) {
      const heights = data.slice(0, Math.min(5, data.length)).map(item => { // Réduit de 10 à 5
        if (item.type === 'battle') return 420;
        const orientation = item.photo.orientation || 'unknown';
        switch (orientation) {
          case 'portrait': return 560;
          case 'landscape': return 280;
          case 'square': return 400;
          default: return 400;
        }
      });
      avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    }
    
    const visiblePhotosInViewport = Math.ceil(viewportHeight / avgHeight);
    
    // Réduire l'overscan pour moins de rendus
    const overscanNeeded = Math.max(
      photosPerColumn - visiblePhotosInViewport + 10, // Réduit de 20 à 10
      Math.ceil(MIN_PHOTOS_TOTAL / numColumns)
    );
    
    return Math.min(overscanNeeded, data.length);
  }, [numColumns, data.length, viewportHeight, data]);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const item = data[index];
      if (item?.type === 'battle') return 420;
      
      if (item?.type === 'photo') {
        const orientation = item.photo.orientation || 'unknown';
        const baseHeight = 400;
        
        switch (orientation) {
          case 'portrait':
            return baseHeight * 1.4;
          case 'landscape':
            return baseHeight * 0.7;
          case 'square':
            return baseHeight;
          default:
            return baseHeight;
        }
      }
      
      return 400;
    },
    overscan: overscan,
    scrollMargin: 0,
    measureElement: (el) => {
      if (!el) return 400;
      const height = el.getBoundingClientRect().height;
      return height > 0 ? height : 400;
    },
  });

  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ 
        height: `${virtualizer.getTotalSize()}px`, 
        position: 'relative' 
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = data[virtualRow.index];
        if (!item) return null;
        
        // Générer une clé unique en combinant le type, l'id et l'index pour éviter les doublons
        const uniqueKey = item.type === 'battle' 
          ? `battle-${item.battle.id}-${virtualRow.index}` 
          : `photo-${item.photo.id}-${virtualRow.index}`;
        
        return (
          <div
            key={uniqueKey}
            ref={(el) => {
              if (el && virtualRow && typeof virtualRow.index === 'number') {
                // Utiliser une approche plus sûre pour éviter les boucles infinies
                const currentIndex = virtualRow.index;
                if (el.isConnected) {
                  // Mesurer seulement si l'élément est connecté au DOM
                  requestAnimationFrame(() => {
                    if (el.isConnected) {
                      virtualizer.measureElement(el);
                    }
                  });
                }
              }
            }}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className="pb-3 sm:pb-4 md:pb-6"
          >
            {item.type === 'battle' ? (
              <div
                className="relative"
                style={{ willChange: 'transform' }}
              >
                <PhotoBattleComponent
                  battle={item.battle}
                  userId={userId}
                  compact={false}
                  onBattleFinished={onBattleFinished}
                  onPhotoClick={onPhotoClick ? (photo) => {
                    const photoIndex = allPhotos.findIndex(p => p.id === photo.id);
                    onPhotoClick(photo, photoIndex !== -1 ? photoIndex : 0);
                  } : undefined}
                />
              </div>
            ) : (
              <div
                className="relative group"
                style={{ willChange: 'transform' }}
              >
                <GuestPhotoCard
                  photo={item.photo}
                  isLiked={likedPhotoIds.has(item.photo.id)}
                  onLike={onLike}
                  onDownload={onDownload}
                  allPhotos={allPhotos}
                  index={item.originalIndex}
                  isDownloading={downloadingIds.has(item.photo.id)}
                  onSwipeLeft={onNavigatePhoto ? () => onNavigatePhoto('next', item.originalIndex) : undefined}
                  onSwipeRight={onNavigatePhoto ? () => onNavigatePhoto('prev', item.originalIndex) : undefined}
                  userReaction={userReactions.get(item.photo.id) || null}
                  onReaction={onReaction}
                  reactions={photosReactions.get(item.photo.id) || {}}
                  guestAvatars={guestAvatars}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(item.photo.id)}
                  onSelect={onSelect}
                  onUpdateCaption={onUpdateCaption}
                  onClearCaption={onClearCaption}
                  onDeletePhoto={onDeletePhoto}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

VirtualColumn.displayName = 'VirtualColumn';

export const GalleryContent: React.FC<GalleryContentProps> = ({
  loading,
  photos,
  battles,
  showBattles,
  battleModeEnabled,
  likedPhotoIds,
  downloadingIds,
  userReactions,
  photosReactions,
  guestAvatars,
  searchQuery,
  mediaFilter,
  onLike,
  onDownload,
  onReaction,
  onBattleFinished,
  onPhotoClick,
  onNavigatePhoto,
  userId,
  selectionMode = false,
  selectedIds = new Set(),
  onSelect,
  scrollContainerRef,
  onUpdateCaption,
  onClearCaption,
  onDeletePhoto,
  viewMode = 'grid'
}) => {
  const isMobile = useIsMobile();
  const defaultScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollContainerRef || defaultScrollRef;
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Optimisation : calculer le nombre de colonnes de manière adaptative
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Nombre de colonnes adaptatif selon la largeur de l'écran - Breakpoints optimisés
  const numColumns = useMemo(() => {
    if (isMobile) return 1;
    // Mobile: < 640px
    if (windowWidth < 640) return 1;
    // Tablette portrait: 640px - 768px
    if (windowWidth < 768) return 2;
    // Tablette paysage: 768px - 1024px
    if (windowWidth < 1024) return 3;
    // Desktop petit: 1024px - 1280px
    if (windowWidth < 1280) return 4;
    // Desktop moyen: 1280px - 1536px
    if (windowWidth < 1536) return 4;
    // Desktop large: 1536px+
    return 5;
  }, [isMobile, windowWidth]);

  // Trier les battles par date de création (plus récentes en premier)
  const battlesForGrid = useMemo(() => {
    return [...battles].sort((a, b) => b.createdAt - a.createdAt);
  }, [battles]);

  // Calculer masonryColumns au niveau supérieur pour respecter les règles des Hooks
  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: Math.min(numColumns, 4) }, () => [] as Photo[]);
    photos.forEach((photo, index) => {
      cols[index % cols.length].push(photo);
    });
    return cols;
  }, [photos, numColumns]);

  // Préparer les données pour chaque colonne avec virtualisation
  const columnsData = useMemo(() => {
    const cols = Array.from({ length: numColumns }, () => [] as ColumnItem[]);
    
    // Ajouter les battles dans la première colonne si activées (desktop et mobile)
    if (battleModeEnabled && showBattles) {
      battlesForGrid.forEach((battle) => {
        cols[0].push({ type: 'battle', battle });
      });
    }
    
    // Distribuer les photos dans les colonnes
    photos.forEach((photo, index) => {
      const colIndex = isMobile ? 0 : (index % numColumns);
      cols[colIndex].push({ 
        type: 'photo', 
        photo, 
        originalIndex: index 
      });
    });
    
    return cols;
  }, [photos, battlesForGrid, battleModeEnabled, showBattles, numColumns, isMobile]);

  if (loading) {
    return (
      <div className="w-full">
        <PhotoCardSkeletons count={numColumns * 2} columns={numColumns} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div 
        className="text-center py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6"
      >
        <div className="text-5xl mb-4 sm:text-6xl md:text-7xl sm:mb-6">
          {searchQuery || mediaFilter !== 'all' ? '🔍' : '📸'}
        </div>
        <h3 className="text-lg mb-2 sm:text-xl md:text-2xl sm:mb-1.5 md:mb-2 font-black text-white">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Aucun résultat' 
            : 'Le mur est vide'}
        </h3>
        <p className="text-slate-500 max-w-xs mx-auto text-sm sm:text-xs md:text-sm">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Essayez de modifier vos filtres ou votre recherche.' 
            : 'Soyez le premier à capturer un moment magique !'}
        </p>
      </div>
    );
  }

  // Render selon le mode de vue
  const renderGridView = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
      <div className={`flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-6 ${numColumns > 1 ? 'md:flex-row' : ''}`}>
        {columnsData.map((colData, colIdx) => (
          <motion.div 
            key={colIdx} 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: colIdx * 0.1 }}
          >
            <VirtualColumn
              data={colData}
              scrollContainerRef={scrollRef}
              allPhotos={photos}
              likedPhotoIds={likedPhotoIds}
              downloadingIds={downloadingIds}
              userReactions={userReactions}
              photosReactions={photosReactions}
              guestAvatars={guestAvatars}
              onLike={onLike}
              onDownload={onDownload}
              onReaction={onReaction}
              onBattleFinished={onBattleFinished}
              onPhotoClick={onPhotoClick}
              onNavigatePhoto={onNavigatePhoto}
              userId={userId}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelect={onSelect}
              numColumns={numColumns}
              isMobile={isMobile}
              onUpdateCaption={onUpdateCaption}
              onClearCaption={onClearCaption}
              onDeletePhoto={onDeletePhoto}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3 md:space-y-4">
      {battlesForGrid.map((battle, index) => (
        <motion.div 
          key={battle.id} 
          className="mb-3 sm:mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhotoBattleComponent
            battle={battle}
            userId={userId}
            compact={true}
            onBattleFinished={onBattleFinished}
            onPhotoClick={onPhotoClick ? (photo) => {
              const photoIndex = photos.findIndex(p => p.id === photo.id);
              onPhotoClick(photo, photoIndex !== -1 ? photoIndex : 0);
            } : undefined}
          />
        </motion.div>
      ))}
      {photos.map((photo, index) => (
        <motion.div 
          key={photo.id} 
          className="mb-3 sm:mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: (battlesForGrid.length + index) * 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex gap-3 sm:gap-4 md:gap-6 bg-slate-900/40 backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300">
            <div className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-48 h-24 sm:h-32 md:h-40 lg:h-48">
              {photo.type === 'video' ? (
                <video
                  src={photo.url}
                  className="w-full h-full object-cover rounded-l-xl sm:rounded-l-2xl"
                  preload="metadata"
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover rounded-l-xl sm:rounded-l-2xl"
                  loading="lazy"
                />
              )}
            </div>
            <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <p className="font-bold text-white text-sm sm:text-base md:text-lg truncate">{photo.author}</p>
                  <span className="text-slate-500 text-xs sm:text-sm">
                    {new Date(photo.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {photo.caption && (
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base line-clamp-2 mb-2">{photo.caption}</p>
                )}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                <button
                  onClick={() => onLike(photo.id)}
                  className={`p-2 sm:p-2.5 rounded-lg transition-colors ${
                    likedPhotoIds.has(photo.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                  }`}
                  disabled={selectionMode}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={likedPhotoIds.has(photo.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <span className="text-slate-400 text-xs sm:text-sm md:text-base">{photo.likes_count} likes</span>
                <button
                  onClick={() => onDownload(photo)}
                  className="p-2 sm:p-2.5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                  disabled={downloadingIds.has(photo.id) || selectionMode}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderMasonryView = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 md:gap-6">
        {photos.map((photo, index) => (
          <motion.div 
            key={photo.id} 
            className="break-inside-avoid mb-3 sm:mb-4 md:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <GuestPhotoCard
              photo={photo}
              isLiked={likedPhotoIds.has(photo.id)}
              onLike={onLike}
              onDownload={onDownload}
              allPhotos={photos}
              index={index}
              isDownloading={downloadingIds.has(photo.id)}
              userReaction={userReactions.get(photo.id) || null}
              onReaction={onReaction}
              reactions={photosReactions.get(photo.id) || {}}
              guestAvatars={guestAvatars}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(photo.id)}
              onSelect={onSelect}
              onUpdateCaption={onUpdateCaption}
              onClearCaption={onClearCaption}
              onDeletePhoto={onDeletePhoto}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCarouselView = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 sm:gap-4 md:gap-6 pb-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] lg:w-[45vw] xl:w-[35vw] snap-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <GuestPhotoCard
              photo={photo}
              isLiked={likedPhotoIds.has(photo.id)}
              onLike={onLike}
              onDownload={onDownload}
              allPhotos={photos}
              index={index}
              isDownloading={downloadingIds.has(photo.id)}
              userReaction={userReactions.get(photo.id) || null}
              onReaction={onReaction}
              reactions={photosReactions.get(photo.id) || {}}
              guestAvatars={guestAvatars}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(photo.id)}
              onSelect={onSelect}
              onUpdateCaption={onUpdateCaption}
              onClearCaption={onClearCaption}
              onDeletePhoto={onDeletePhoto}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Sélectionner le rendu selon le mode
  switch (viewMode) {
    case 'list':
      return renderListView();
    case 'masonry':
      return renderMasonryView();
    case 'carousel':
      return renderCarouselView();
    case 'grid':
    default:
      return renderGridView();
  }
};

