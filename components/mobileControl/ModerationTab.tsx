import React, { useState } from 'react';
import { Trash2, Heart, Video, X, Check, RefreshCw } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold">Modération</h2>
        {photos.length > 0 && (
          <button
            onClick={async () => {
              if (confirm('Supprimer toutes les photos ?\n\n⚠️ Cette action supprimera également TOUS les invités.\n\nCette action est irréversible.')) {
                if (confirm('Confirmez-vous vraiment la suppression TOTALE (photos + invités) ?')) {
                  await onDeleteAll();
                }
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 active:text-red-200 transition-colors touch-manipulation"
          >
            Tout supprimer
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <div className="text-white/60">Chargement...</div>
        </div>
      ) : sortedPhotos.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          Aucune photo à modérer
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-sm md:hover:bg-white/15 transition-colors"
            >
              <div className="flex gap-3 md:gap-4">
                <div
                  onClick={() => onPhotoClick(photo)}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer touch-manipulation md:hover:scale-105 transition-transform"
                >
                  {photo.type === 'video' ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white/50" />
                    </div>
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{photo.author}</div>
                  <div className="text-sm text-white/70 truncate mb-1">{photo.caption}</div>
                  <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                    {photo.likes_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {photo.likes_count}
                      </span>
                    )}
                    {photosReactions.get(photo.id) && Object.entries(photosReactions.get(photo.id)!).map(([type, count]) => (
                      count > 0 && (
                        <span key={type} className="flex items-center gap-1">
                          <span>{REACTIONS[type as keyof typeof REACTIONS]?.emoji}</span>
                          <span>{count}</span>
                        </span>
                      )
                    ))}
                    <span>{getTimeAgo(photo.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(photo.id)}
                    disabled={isDeleting === photo.id}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 transition-colors text-sm disabled:opacity-50 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting === photo.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
              {showDeleteConfirm === photo.id && (
                <div className="mt-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div className="text-sm mb-2">Confirmer la suppression ?</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-sm touch-manipulation"
                    >
                      <Check className="w-4 h-4" />
                      Confirmer
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-sm touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationTab;

