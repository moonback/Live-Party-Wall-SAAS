import React, { useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo, PhotoBattle, ReactionCounts } from '../../types';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import PhotoCard from './PhotoCard';
import { WallPhotoCardSkeleton } from '../WallPhotoCardSkeleton';

export type ColumnItem = 
  | { type: 'photo'; photo: Photo; originalIndex: number; rotation: number; animationDelay: number }
  | { type: 'battle'; battle: PhotoBattle };

interface VirtualColumnProps {
  data: ColumnItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  allPhotos: Photo[];
  hoveredPhoto: string | null;
  setHoveredPhoto: (id: string | null) => void;
  photosReactions: Map<string, ReactionCounts>;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  numColumns: number;
}

const VirtualColumn = React.memo(({ 
  data, 
  scrollContainerRef, 
  allPhotos, 
  hoveredPhoto, 
  setHoveredPhoto, 
  photosReactions,
  onBattleFinished,
  numColumns
}: VirtualColumnProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  // ⚡ OPTIMISATION : Overscan adaptatif (max 20 photos au lieu de 100+)
  const overscan = useMemo(() => {
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
    
    // ⚡ OPTIMISATION : Overscan minimal (2-3 photos de chaque côté) avec max de 20
    const overscanNeeded = Math.min(
      visiblePhotosInViewport + 5, // 5 photos supplémentaires (2-3 de chaque côté)
      20 // Maximum absolu pour éviter de surcharger
    );
    
    return Math.min(overscanNeeded, data.length);
  }, [data.length, viewportHeight, data]);

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
                  allPhotos={allPhotos}
                  hoveredPhoto={hoveredPhoto}
                  setHoveredPhoto={setHoveredPhoto}
                  reactions={photosReactions.get(item.photo.id)}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
});

interface WallMasonryProps {
  photos: Photo[];
  battles: PhotoBattle[];
  showBattles: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  hoveredPhoto: string | null;
  setHoveredPhoto: (id: string | null) => void;
  photosReactions: Map<string, ReactionCounts>;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
}

export const WallMasonry = React.memo(({
  photos,
  battles,
  showBattles,
  scrollRef,
  hoveredPhoto,
  setHoveredPhoto,
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

  const columnsData = useMemo(() => {
    const cols = Array.from({ length: numColumns }, () => [] as ColumnItem[]);
    const columnHeights = new Array(numColumns).fill(0);
    
    // Fonction pour estimer la hauteur d'un élément
    const estimateHeight = (item: ColumnItem): number => {
      if (item.type === 'battle') return 420; // Hauteur améliorée pour le nouveau design
      
      // Estimation basée sur l'orientation de la photo
      const orientation = item.photo.orientation || 'unknown';
      const baseHeight = 400;
      
      switch (orientation) {
        case 'portrait':
          return baseHeight * 1.4; // Photos portrait plus hautes
        case 'landscape':
          return baseHeight * 0.7; // Photos landscape plus courtes
        case 'square':
          return baseHeight;
        default:
          return baseHeight;
      }
    };
    
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
      const rotation = ((index * 137) % 6) - 3;
      const animationDelay = Math.min(index * 30, 800);
      
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
        originalIndex: index,
        rotation,
        animationDelay
      };
      
      cols[shortestColumnIndex].push(item);
      columnHeights[shortestColumnIndex] += estimateHeight(item);
    });
    
    return cols;
  }, [photos, numColumns, battles, showBattles]);

  return (
    <div className="flex gap-0 w-full px-0 mx-auto max-w-[100%] items-start transition-all duration-300 ease-in-out">
      {columnsData.map((colData, i) => (
        <div key={i} className="flex-1 min-w-0 transition-all duration-300 ease-in-out">
          <VirtualColumn 
            data={colData} 
            scrollContainerRef={scrollRef} 
            allPhotos={photos}
            hoveredPhoto={hoveredPhoto}
            setHoveredPhoto={setHoveredPhoto}
            photosReactions={photosReactions}
            numColumns={numColumns}
            onBattleFinished={onBattleFinished}
          />
        </div>
      ))}
    </div>
  );
});

