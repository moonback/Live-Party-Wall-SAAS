import React from 'react';
import { Photo, PhotoBattle } from '../../types';
import { GuestPhotoCard } from './GuestPhotoCard';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import { PhotoCardSkeletons } from '../PhotoCardSkeleton';
import { useIsMobile } from '../../hooks/useIsMobile';
import Leaderboard from '../Leaderboard';
import type { ReactionType } from '../../types';

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
  userId
}) => {
  const isMobile = useIsMobile();

  // Trier les battles par date de création (plus récentes en premier)
  const battlesForGrid = React.useMemo(() => {
    return [...battles].sort((a, b) => b.createdAt - a.createdAt);
  }, [battles]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <PhotoCardSkeletons count={8} columns={isMobile ? 1 : 4} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 md:py-32 px-6 text-slate-400 animate-fade-in-up">
        <div className="relative mb-8">
          <p className="relative text-6xl md:text-7xl mb-4">
            {searchQuery || mediaFilter !== 'all' ? '🔍' : '📸'}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-white mb-2">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Aucun résultat trouvé' 
            : 'Aucune photo pour le moment'}
        </p>
        <p className="text-sm md:text-base text-slate-500 mb-6">
          {searchQuery || mediaFilter !== 'all' 
            ? 'Essayez avec d\'autres critères' 
            : 'Soyez le premier à partager !'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div className="mb-6 md:mb-10 animate-fade-in-up">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-white/10 shadow-2xl">
            <Leaderboard photos={photos} maxEntries={10} />
          </div>
        </div>
      )}

      {/* Grid de photos */}
      <div className={`grid grid-cols-1 ${
        isMobile 
          ? '' 
          : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
      } ${isMobile ? 'space-y-3' : ''}`}>
        {/* Photo Battles */}
        {battleModeEnabled && showBattles && battlesForGrid.map((battle) => (
          <div
            key={`battle-${battle.id}`}
            className={isMobile ? '' : 'break-inside-avoid'}
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
          </div>
        ))}
        
        {/* Photos normales */}
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            data-photo-index={index}
            className={isMobile ? '' : 'break-inside-avoid'}
          >
            <GuestPhotoCard
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
            />
          </div>
        ))}
      </div>
    </>
  );
};

