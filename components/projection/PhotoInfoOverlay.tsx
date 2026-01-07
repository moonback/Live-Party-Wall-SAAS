import React from 'react';
import { Heart } from 'lucide-react';
import { Photo } from '../../types';
import type { ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';
import { getUserAvatar } from '../../utils/userAvatar';

interface PhotoInfoOverlayProps {
  photo: Photo;
  reactions?: ReactionCounts;
  isTransitioning: boolean;
}

/**
 * Composant pour afficher les informations de la photo (légende, auteur, likes, réactions)
 */
export const PhotoInfoOverlay: React.FC<PhotoInfoOverlayProps> = ({
  photo,
  reactions,
  isTransitioning,
}) => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-3 md:p-5 lg:p-6 z-10 transition-all duration-500 pointer-events-none"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
      }}
    >
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {/* Container principal avec fond élégant et transparent */}
        <div className="relative bg-gradient-to-t from-black/60 via-black/40 to-black/20 backdrop-blur-md rounded-xl md:rounded-2xl p-2.5 md:p-3 lg:p-4 border border-white/10 shadow-2xl">
          {/* Effet de brillance subtil */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl md:rounded-2xl pointer-events-none" />

          {/* Layout horizontal : Légende + Infos sur la même ligne */}
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
            {/* Légende principale */}
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-white text-base md:text-xl lg:text-2xl xl:text-3xl font-extrabold leading-tight drop-shadow-2xl break-words">
                {photo.caption}
              </p>
            </div>

            {/* Informations secondaires (auteur et likes) - Layout compact */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Auteur avec avatar */}
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-sm px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 group">
                {/* Avatar */}
                {getUserAvatar(photo.author) ? (
                  <img
                    src={getUserAvatar(photo.author)!}
                    alt={photo.author}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-white/30 shadow-md group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-xs md:text-sm font-bold text-white border-2 border-white/30 shadow-md group-hover:scale-110 transition-transform duration-300">
                    {photo.author.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white/60 text-[8px] md:text-[9px] font-medium uppercase tracking-wider leading-tight">
                    Photographe
                  </p>
                  <p className="text-white text-xs md:text-sm lg:text-base font-bold drop-shadow-lg leading-tight">
                    {photo.author}
                  </p>
                </div>
              </div>

              {/* Nombre de likes - Compact */}
              <div
                className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 ${
                  (photo.likes_count ?? 0) > 0
                    ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-400/40 hover:from-pink-500/30 hover:to-purple-500/30'
                    : 'bg-white/10 border-white/20 hover:bg-white/15'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                    (photo.likes_count ?? 0) > 0
                      ? 'text-pink-400 fill-pink-400 drop-shadow-lg animate-pulse'
                      : 'text-white/60 fill-white/20'
                  }`}
                />
                <div>
                  <p className="text-white/60 text-[8px] md:text-[9px] font-medium uppercase tracking-wider leading-tight">
                    Likes
                  </p>
                  <p
                    className={`text-sm md:text-base lg:text-lg font-extrabold drop-shadow-2xl leading-tight ${
                      (photo.likes_count ?? 0) > 0 ? 'text-pink-300' : 'text-white'
                    }`}
                  >
                    {photo.likes_count ?? 0}
                  </p>
                </div>
              </div>

              {/* Réactions - Compact */}
              {reactions &&
                Object.entries(reactions).map(([type, count]) => {
                  if (count === 0) return null;
                  const reaction = REACTIONS[type as keyof typeof REACTIONS];
                  if (!reaction) return null;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 bg-white/10 border-white/20 hover:bg-white/15"
                    >
                      <span className="text-base md:text-lg lg:text-xl">{reaction.emoji}</span>
                      <div>
                        <p className="text-white/60 text-[8px] md:text-[9px] font-medium uppercase tracking-wider leading-tight">
                          {reaction.label}
                        </p>
                        <p className="text-sm md:text-base lg:text-lg font-extrabold drop-shadow-2xl leading-tight text-white">
                          {count}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

