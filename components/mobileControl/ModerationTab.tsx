import React, { useState } from 'react';
import { Trash2, Heart, Video, X, Check, RefreshCw, Shield, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';

interface ModerationTabProps {
  photos: Photo[];
  photosReactions: Map<string, ReactionCounts>;
  isLoading: boolean;
  onPhotoClick: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  getTimeAgo: (timestamp: number) => string;
}

const ModerationTab: React.FC<ModerationTabProps> = ({
  photos,
  photosReactions,
  isLoading,
  onPhotoClick,
  onDeletePhoto,
  onDeleteAll,
  getTimeAgo,
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    setIsDeleting(photoId);
    try {
      await onDeletePhoto(photoId);
      setShowDeleteConfirm(null);
    } finally {
      setIsDeleting(null);
    }
  };

  const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* En-tête */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-red-400 to-orange-400 rounded-full" />
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Modération</h2>
              <p className="text-[10px] md:text-xs text-white/50">{sortedPhotos.length} photo{sortedPhotos.length > 1 ? 's' : ''} à modérer</p>
            </div>
          </div>
          {photos.length > 0 && (
            <button
              onClick={async () => {
                if (confirm('Supprimer toutes les photos ?\n\n⚠️ Cette action supprimera également TOUS les invités.\n\nCette action est irréversible.')) {
                  if (confirm('Confirmez-vous vraiment la suppression TOTALE (photos + invités) ?')) {
                    await onDeleteAll();
                  }
                }
              }}
              className="group relative flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 active:scale-95 transition-all duration-300 touch-manipulation border border-red-500/20 hover:border-red-500/40 shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
              <span className="text-[10px] md:text-xs font-semibold text-red-400">Tout supprimer</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <RefreshCw className="w-10 h-10 md:w-12 md:h-12 animate-spin mx-auto mb-3 text-red-400" />
          <div className="text-sm md:text-base text-white/60">Chargement...</div>
        </div>
      ) : sortedPhotos.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="p-3 rounded-full bg-green-500/10 border border-green-500/20 w-fit mx-auto mb-4">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-green-400/50" />
          </div>
          <p className="text-base md:text-lg font-semibold text-white mb-2">Aucune photo à modérer</p>
          <p className="text-xs md:text-sm text-white/50">Tout est propre ! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2.5 md:space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {sortedPhotos.map((photo) => {
            const reactions = photosReactions.get(photo.id);
            const totalReactions = reactions ? Object.values(reactions).reduce((sum, count) => sum + count, 0) : 0;
            
            return (
              <div
                key={photo.id}
                className="group bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5"
              >
                <div className="flex gap-3">
                  <div
                    onClick={() => onPhotoClick(photo)}
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer touch-manipulation transition-transform duration-300 group-hover:scale-105 border border-white/10"
                  >
                    {photo.type === 'video' ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center relative">
                        <Video className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80 font-medium border border-white/10">
                          VID
                        </div>
                      </div>
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1.5">
                      <div>
                        <div className="font-semibold text-sm md:text-base text-white truncate">{photo.author || 'Anonyme'}</div>
                        {photo.caption && (
                          <div className="text-[10px] md:text-xs text-white/60 truncate line-clamp-1">{photo.caption}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-white/50 flex-wrap">
                        {photo.likes_count > 0 && (
                          <span className="flex items-center gap-0.5 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                            <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                            {photo.likes_count}
                          </span>
                        )}
                        {totalReactions > 0 && (
                          <span className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                            <span className="text-xs">💬</span>
                            {totalReactions}
                          </span>
                        )}
                        <span className="text-white/40">{getTimeAgo(photo.timestamp)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(photo.id)}
                      disabled={isDeleting === photo.id}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 active:from-red-500/40 active:to-rose-500/40 active:scale-95 transition-all duration-300 text-[10px] md:text-xs disabled:opacity-50 touch-manipulation border border-red-500/30 shadow-sm"
                    >
                      <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      {isDeleting === photo.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
                {showDeleteConfirm === photo.id && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm">
                    <div className="text-xs md:text-sm font-medium text-white mb-2.5">Confirmer la suppression ?</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(photo.id)}
                        disabled={isDeleting === photo.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 active:from-red-500/50 active:to-red-600/50 active:scale-95 transition-all duration-300 text-xs md:text-sm disabled:opacity-50 touch-manipulation border border-red-500/30 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Confirmer
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all duration-300 text-xs md:text-sm touch-manipulation border border-white/10 shadow-sm"
                      >
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModerationTab;

