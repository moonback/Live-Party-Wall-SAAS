import React, { useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo, PhotoBattle, ReactionCounts } from '../../types';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import PhotoCard from './PhotoCard';
import { WallPhotoCardSkeleton } from '../WallPhotoCardSkeleton';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';

export type ColumnItem = 
  | { type: 'photo'; photo: Photo; originalIndex: number }
  | { type: 'battle'; battle: PhotoBattle };

interface VirtualColumnProps {
  data: ColumnItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  photosReactions: Map<string, ReactionCounts>;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  numColumns: number;
  photoBadges: Map<string, { type: string; emoji: string } | null>;
  authorBadges: Map<string, boolean>;
}

const VirtualColumn = React.memo(({ 
  data, 
  scrollContainerRef, 
  photosReactions,
  onBattleFinished,
  numColumns,
  photoBadges,
  authorBadges
}: VirtualColumnProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  const overscan = useMemo(() => {
    const MIN_PHOTOS_TOTAL = 50; // Réduit de 100 à 50
    const photosPerColumn = Math.ceil(MIN_PHOTOS_TOTAL / numColumns);
    
    // Estimation moyenne de la hauteur (400px par défaut)
    const avgHeight = 400;
    const visiblePhotosInViewport = Math.ceil(viewportHeight / avgHeight);
    
    // Overscan réduit à max 10 éléments
    const overscanNeeded = Math.min(
      Math.max(
        photosPerColumn - visiblePhotosInViewport + 10, // Réduit de 20 à 10
        Math.ceil(MIN_PHOTOS_TOTAL / numColumns)
      ),
      10 // Max 10 éléments en overscan
    );
    
    return Math.min(overscanNeeded, data.length);
  }, [numColumns, data.length, viewportHeight]);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const item = data[index];
      if (item?.type === 'battle') return 420; // Hauteur améliorée pour le nouveau design
      
      // Estimation améliorée basée sur l'orientation
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
      className="flex-1 w-full" 
      style={{ 
        height: `${virtualizer.getTotalSize()}px`, 
        position: 'relative' 
      }}
    >
      {data.length === 0 ? (
        <div className="pb-12 px-4 md:px-6">
          <WallPhotoCardSkeleton />
        </div>
      ) : (
        virtualizer.getVirtualItems().map((virtualRow) => {
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
              className="pb-0"
            >
              {item.type === 'battle' ? (
                <PhotoBattleComponent
                  battle={item.battle}
                  userId=""
                  compact={true}
                  onBattleFinished={onBattleFinished}
                />
              ) : (
                <PhotoCard 
                  photo={item.photo} 
                  index={item.originalIndex} 
                  photoBadge={photoBadges.get(item.photo.id) || null}
                  authorHasPhotographerBadge={authorBadges.get(item.photo.author) || false}
                  reactions={photosReactions.get(item.photo.id)}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour React.memo
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, index) => {
      const nextItem = nextProps.data[index];
      if (!nextItem) return false;
      if (item.type !== nextItem.type) return false;
      if (item.type === 'battle' && nextItem.type === 'battle') {
        return item.battle.id === nextItem.battle.id;
      }
      if (item.type === 'photo' && nextItem.type === 'photo') {
        return item.photo.id === nextItem.photo.id;
      }
      return false;
    }) &&
    prevProps.numColumns === nextProps.numColumns &&
    prevProps.photosReactions === nextProps.photosReactions &&
    prevProps.photoBadges === nextProps.photoBadges &&
    prevProps.authorBadges === nextProps.authorBadges
  );
});

VirtualColumn.displayName = 'VirtualColumn';

interface WallMasonryProps {
  photos: Photo[];
  battles: PhotoBattle[];
  showBattles: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  photosReactions: Map<string, ReactionCounts>;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
}

export const WallMasonry = React.memo(({
  photos,
  battles,
  showBattles,
  scrollRef,
  photosReactions,
  onBattleFinished
}: WallMasonryProps) => {
  const [numColumns, setNumColumns] = useState(1);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const w = window.innerWidth;
        // Breakpoints optimisés pour TV et vidéoprojecteurs (75"+)
        if (w >= 3840) setNumColumns(12); // 4K Ultra HD (TV 75"+)
        else if (w >= 2560) setNumColumns(10); // 2K/QHD (TV 65"+)
        else if (w >= 1920) setNumColumns(8); // Full HD (TV 55"+)
        else if (w >= 1536) setNumColumns(6); // Laptops larges
        else if (w >= 1280) setNumColumns(5); // Laptops standards
        else if (w >= 1024) setNumColumns(4); // Tablettes paysage
        else if (w >= 768) setNumColumns(3); // Tablettes portrait
        else if (w >= 640) setNumColumns(2); // Grands mobiles
        else setNumColumns(1); // Petits mobiles
      }, 100); // Réduction du délai pour une réactivité plus rapide
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Pré-calculer les badges une seule fois
  const photoBadges = useMemo(() => {
    const badges = new Map<string, { type: string; emoji: string } | null>();
    photos.forEach(photo => {
      const badge = getPhotoBadge(photo, photos, photosReactions);
      badges.set(photo.id, badge ? { type: badge.type, emoji: badge.emoji } : null);
    });
    return badges;
  }, [photos, photosReactions]);

  const authorBadges = useMemo(() => {
    const badges = new Map<string, boolean>();
    const uniqueAuthors = new Set(photos.map(p => p.author));
    uniqueAuthors.forEach(author => {
      badges.set(author, hasPhotographerBadge(author, photos, photosReactions));
    });
    return badges;
  }, [photos, photosReactions]);

  // Mémoriser la fonction estimateHeight pour éviter les recalculs
  const estimateHeight = useMemo(() => {
    return (item: ColumnItem): number => {
      if (item.type === 'battle') return 420;
      
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
    };
  }, []);

  const columnsData = useMemo(() => {
    const cols = Array.from({ length: numColumns }, () => [] as ColumnItem[]);
    const columnHeights = new Array(numColumns).fill(0);
    
    // Ajouter les battles d'abord
    if (showBattles && battles.length > 0) {
      battles.slice(0, numColumns).forEach((battle, battleIndex) => {
        const colIndex = battleIndex % numColumns;
        cols[colIndex].push({ type: 'battle', battle });
        columnHeights[colIndex] += estimateHeight({ type: 'battle', battle });
      });
    }
    
    // Distribution intelligente des photos : toujours mettre dans la colonne la plus courte
    photos.forEach((photo, index) => {
      // Trouver la colonne la plus courte
      let shortestColumnIndex = 0;
      let shortestHeight = columnHeights[0];
      
      for (let i = 1; i < numColumns; i++) {
        if (columnHeights[i] < shortestHeight) {
          shortestHeight = columnHeights[i];
          shortestColumnIndex = i;
        }
      }
      
      const item: ColumnItem = {
        type: 'photo',
        photo,
        originalIndex: index
      };
      
      cols[shortestColumnIndex].push(item);
      columnHeights[shortestColumnIndex] += estimateHeight(item);
    });
    
    return cols;
  }, [photos, numColumns, battles, showBattles, estimateHeight]);

  return (
    <div className="flex gap-0 w-full px-0 mx-auto max-w-[100%] items-start transition-all duration-300 ease-in-out">
      {columnsData.map((colData, i) => (
        <div key={i} className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          <VirtualColumn 
            data={colData} 
            scrollContainerRef={scrollRef} 
            photosReactions={photosReactions}
            numColumns={numColumns}
            onBattleFinished={onBattleFinished}
            photoBadges={photoBadges}
            authorBadges={authorBadges}
          />
        </div>
      ))}
    </div>
  );
});

