import React, { useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo, PhotoBattle, ReactionCounts, Badge } from '../../types';
import { PhotoBattle as PhotoBattleComponent } from '../PhotoBattle';
import PhotoCard from './PhotoCard';
import { WallPhotoCardSkeleton } from '../WallPhotoCardSkeleton';
import { getPhotoBadge, hasPhotographerBadge } from '../../services/gamificationService';
import { useSettings } from '../../context/SettingsContext';

export type ColumnItem = 
  | { type: 'photo'; photo: Photo; originalIndex: number; photoBadge: Badge | null; authorHasPhotographerBadge: boolean }
  | { type: 'battle'; battle: PhotoBattle };

interface VirtualColumnProps {
  data: ColumnItem[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  photosReactions: Map<string, ReactionCounts>;
  onBattleFinished: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  numColumns: number;
  logoUrl?: string | null;
  logoWatermarkEnabled?: boolean;
}

const VirtualColumn = React.memo(({ 
  data, 
  scrollContainerRef, 
  photosReactions,
  onBattleFinished,
  numColumns,
  logoUrl,
  logoWatermarkEnabled
}: VirtualColumnProps) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  // Mémoriser le calcul de overscan avec des dépendances stables
  const overscan = useMemo(() => {
    const MIN_PHOTOS_TOTAL = 100;
    const photosPerColumn = Math.ceil(MIN_PHOTOS_TOTAL / numColumns);
    
    // Estimation moyenne de la hauteur (400px par défaut)
    const avgHeight = 400;
    const visiblePhotosInViewport = Math.ceil(viewportHeight / avgHeight);
    
    const overscanNeeded = Math.max(
      photosPerColumn - visiblePhotosInViewport + 20,
      Math.ceil(MIN_PHOTOS_TOTAL / numColumns)
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
                  photoBadge={item.photoBadge}
                  authorHasPhotographerBadge={item.authorHasPhotographerBadge}
                  reactions={photosReactions.get(item.photo.id)}
                  logoUrl={logoUrl}
                  logoWatermarkEnabled={logoWatermarkEnabled}
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
  const { settings } = useSettings();
  
  // Pré-calculer les badges pour toutes les photos (une seule fois)
  const photoBadgesMap = useMemo(() => {
    const badgesMap = new Map<string, Badge | null>();
    const photographerBadgesMap = new Map<string, boolean>();
    
    // Calculer les badges pour chaque photo
    photos.forEach((photo) => {
      const badge = getPhotoBadge(photo, photos, photosReactions);
      badgesMap.set(photo.id, badge);
      
      // Calculer le badge photographer pour l'auteur
      if (!photographerBadgesMap.has(photo.author)) {
        const hasBadge = hasPhotographerBadge(photo.author, photos, photosReactions);
        photographerBadgesMap.set(photo.author, hasBadge);
      }
    });
    
    return { badgesMap, photographerBadgesMap };
  }, [photos, photosReactions]);
  
  // Extraire uniquement les valeurs nécessaires des settings
  const logoUrl = settings.logo_url;
  const logoWatermarkEnabled = settings.logo_watermark_enabled;

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
      // Trouver la colonne la plus courte
      let shortestColumnIndex = 0;
      let shortestHeight = columnHeights[0];
      
      for (let i = 1; i < numColumns; i++) {
        if (columnHeights[i] < shortestHeight) {
          shortestHeight = columnHeights[i];
          shortestColumnIndex = i;
        }
      }
      
      // Récupérer les badges pré-calculés
      const photoBadge = photoBadgesMap.badgesMap.get(photo.id) || null;
      const authorHasPhotographerBadge = photoBadgesMap.photographerBadgesMap.get(photo.author) || false;
      
      const item: ColumnItem = {
        type: 'photo',
        photo,
        originalIndex: index,
        photoBadge,
        authorHasPhotographerBadge
      };
      
      cols[shortestColumnIndex].push(item);
      columnHeights[shortestColumnIndex] += estimateHeight(item);
    });
    
    return cols;
  }, [photos, numColumns, battles, showBattles, photoBadgesMap]);

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
            logoUrl={logoUrl}
            logoWatermarkEnabled={logoWatermarkEnabled}
          />
        </div>
      ))}
    </div>
  );
});

