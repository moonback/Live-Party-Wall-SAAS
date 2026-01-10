import React, { useMemo } from 'react';
import { Photo, PhotoBattle } from '../../types';
import { GuestPhotoCard } from './GuestPhotoCard';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import { PhotoCardSkeletons } from '../PhotoCardSkeleton';
import { useIsMobile } from '../../hooks/useIsMobile';
import Leaderboard from '../Leaderboard';
import type { ReactionType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryContentProps {
  loading: boolean;
  photos: Photo[];
  battles: PhotoBattle[];
  showBattles: boolean;
  battleModeEnabled: boolean;
  showLeaderboard: boolean;
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
}

export const GalleryContent: React.FC<GalleryContentProps> = ({
  loading,
  photos,
  battles,
  showBattles,
  battleModeEnabled,
  showLeaderboard,
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
  onSelect
}) => {
  const isMobile = useIsMobile();

  // Trier les battles par date de création (plus récentes en premier)
  const battlesForGrid = useMemo(() => {
    return [...battles].sort((a, b) => b.createdAt - a.createdAt);
  }, [battles]);

  // Masonry layout logic
  const columns = useMemo(() => {
    if (isMobile) return [photos];
    const cols: Photo[][] = [[], [], [], []];
    photos.forEach((photo, i) => {
      cols[i % 4].push(photo);
    });
    return cols;
  }, [photos, isMobile]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <PhotoCardSkeletons count={8} columns={isMobile ? 1 : 4} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 sm:py-20 md:py-24 px-4 sm:px-6"
      >
        <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">
          {searchQuery || mediaFilter !== 'all' ? '🔍' : '📸'}
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5 sm:mb-2">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Aucun résultat' 
            : 'Le mur est vide'}
        </h3>
        <p className="text-slate-500 max-w-xs mx-auto text-xs sm:text-sm">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Essayez de modifier vos filtres ou votre recherche.' 
            : 'Soyez le premier à capturer un moment magique !'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Leaderboard Panel */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border border-white/5 shadow-2xl">
              <Leaderboard photos={photos} maxEntries={5} guestAvatars={guestAvatars} photosReactions={photosReactions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de photos avec Masonry Style */}
      <div className={`flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6`}>
        {columns.map((colPhotos, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-3 sm:gap-4 md:gap-6">
            {/* Show battles only in the first column on desktop, or top on mobile */}
            {colIdx === 0 && battleModeEnabled && showBattles && battlesForGrid.map((battle) => (
              <motion.div
                key={`battle-${battle.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <PhotoBattleComponent
                  battle={battle}
                  userId={userId}
                  compact={false}
                  onBattleFinished={onBattleFinished}
                  onPhotoClick={onPhotoClick ? (photo) => {
                    const photoIndex = photos.findIndex(p => p.id === photo.id);
                    onPhotoClick(photo, photoIndex !== -1 ? photoIndex : 0);
                  } : undefined}
                />
              </motion.div>
            ))}

            <AnimatePresence mode="popLayout">
              {colPhotos.map((photo, index) => (
                <GuestPhotoCard
                  key={photo.id}
                  photo={photo}
                  isLiked={likedPhotoIds.has(photo.id)}
                  onLike={onLike}
                  onDownload={onDownload}
                  allPhotos={photos}
                  index={index}
                  isDownloading={downloadingIds.has(photo.id)}
                  onSwipeLeft={onNavigatePhoto ? () => onNavigatePhoto('next', index) : undefined}
                  onSwipeRight={onNavigatePhoto ? () => onNavigatePhoto('prev', index) : undefined}
                  userReaction={userReactions.get(photo.id) || null}
                  onReaction={onReaction}
                  reactions={photosReactions.get(photo.id) || {}}
                  guestAvatars={guestAvatars}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(photo.id)}
                  onSelect={onSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

