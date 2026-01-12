import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo, PhotoBattle } from '../../types';
import { GuestPhotoCard } from './GuestPhotoCard';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import { PhotoCardSkeletons } from '../PhotoCardSkeleton';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { ReactionType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<void>;
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
  onDeletePhoto
}: VirtualColumnProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  const overscan = useMemo(() => {
    const MIN_PHOTOS_TOTAL = 100;
    const photosPerColumn = Math.ceil(MIN_PHOTOS_TOTAL / numColumns);
    
    // Estimation moyenne de la hauteur basée sur les photos dans cette colonne
    let avgHeight = 400;
    if (data.length > 0) {
      const heights = data.slice(0, Math.min(10, data.length)).map(item => {
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
    
    const overscanNeeded = Math.max(
      photosPerColumn - visiblePhotosInViewport + 20,
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
        
        return (
          <div
            key={
              item.type === 'battle' 
                ? `battle-${item.battle.id}` 
                : `photo-${item.photo.id}`
            }
            ref={el => virtualRow && typeof virtualRow.index === 'number' ? virtualizer.measureElement(el) : undefined}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: Math.min(item.originalIndex * 0.03, 0.5),
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-pink-500/20 group-hover:via-purple-500/20 group-hover:to-indigo-500/20 rounded-2xl blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
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
                  onDeletePhoto={onDeletePhoto}
                />
              </motion.div>
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
  onDeletePhoto
}) => {
  const isMobile = useIsMobile();
  const defaultScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollContainerRef || defaultScrollRef;

  // Trier les battles par date de création (plus récentes en premier)
  const battlesForGrid = useMemo(() => {
    return [...battles].sort((a, b) => b.createdAt - a.createdAt);
  }, [battles]);

  // Nombre de colonnes selon le breakpoint
  const numColumns = isMobile ? 1 : 4;

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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-6">
        <PhotoCardSkeletons count={8} columns={isMobile ? 1 : 4} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-4 sm:py-16 md:py-20 lg:py-24 sm:px-6"
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
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid de photos avec Masonry Style et Virtualisation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3 md:flex-row sm:gap-4 md:gap-6"
      >
        {columnsData.map((colData, colIdx) => (
          <motion.div 
            key={colIdx} 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colIdx * 0.1, duration: 0.4 }}
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
              onDeletePhoto={onDeletePhoto}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

