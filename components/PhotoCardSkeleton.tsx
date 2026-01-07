import React from 'react';

/**
 * Composant Skeleton pour afficher un placeholder pendant le chargement des photos
 * Amélioré avec effet shimmer et animations fluides
 */
export const PhotoCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/95 rounded-xl overflow-hidden border border-gray-800/80 shadow-lg mb-4 break-inside-avoid relative group">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
      
      {/* Header Skeleton */}
      <div className="px-4 py-3 flex items-center gap-3 bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="relative w-10 h-10 rounded-full bg-gray-800/80 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
            style={{ 
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite'
            }} 
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="relative h-3 w-24 bg-gray-800/80 rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite'
              }} 
            />
          </div>
          <div className="relative h-2 w-16 bg-gray-800/60 rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                animationDelay: '0.2s'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Media Skeleton */}
      <div className="bg-black/50 aspect-auto min-h-[300px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-800/60">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" 
            style={{ 
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite',
              animationDelay: '0.4s'
            }} 
          />
        </div>
        {/* Placeholder icon */}
        <div className="relative z-10 text-gray-700/30 text-4xl">
          📸
        </div>
      </div>

      {/* Actions & Caption Skeleton */}
      <div className="px-4 py-3 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative w-7 h-7 rounded-full bg-gray-800/80 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                animationDelay: '0.6s'
              }} 
            />
          </div>
          <div className="relative w-7 h-7 rounded-full bg-gray-800/80 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                animationDelay: '0.8s'
              }} 
            />
          </div>
        </div>
        <div className="relative h-4 w-20 bg-gray-800/80 rounded mb-2 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
            style={{ 
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite',
              animationDelay: '1s'
            }} 
          />
        </div>
        <div className="space-y-2">
          <div className="relative h-3 w-full bg-gray-800/60 rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                animationDelay: '1.2s'
              }} 
            />
          </div>
          <div className="relative h-3 w-3/4 bg-gray-800/60 rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
              style={{ 
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                animationDelay: '1.4s'
              }} 
            />
          </div>
        </div>
        <div className="relative h-2 w-32 bg-gray-800/60 rounded mt-2 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
            style={{ 
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite',
              animationDelay: '1.6s'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Composant pour afficher plusieurs skeletons en colonnes
 */
interface PhotoCardSkeletonsProps {
  count?: number;
  columns?: number;
}

export const PhotoCardSkeletons: React.FC<PhotoCardSkeletonsProps> = ({ 
  count = 6, 
  columns = 1 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div 
          key={`skeleton-${i}`}
          style={{ 
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: `${i * 50}ms`
          }}
        >
          <PhotoCardSkeleton />
        </div>
      ))}
    </div>
  );
};

