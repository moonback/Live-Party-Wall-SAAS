import React from 'react';
import { X, Heart } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';

interface PhotoPreviewModalProps {
  photo: Photo;
  reactions?: ReactionCounts;
  onClose: () => void;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({ photo, reactions, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full md:max-w-4xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 md:p-3 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 active:scale-95 md:hover:scale-110 transition-all z-10 touch-manipulation shadow-lg"
          aria-label="Fermer"
        >
          <X className="w-6 h-6 md:w-7 md:h-7" />
        </button>
        {photo.type === 'video' ? (
          <video
            src={photo.url}
            controls
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={photo.url}
            alt={photo.caption}
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="mt-4 text-center">
          <div className="font-medium">{photo.author}</div>
          <div className="text-sm text-white/70">{photo.caption}</div>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm flex-wrap">
            {photo.likes_count > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span>{photo.likes_count}</span>
              </div>
            )}
            {reactions && Object.entries(reactions).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="flex items-center gap-1">
                  <span className="text-lg">{REACTIONS[type as keyof typeof REACTIONS]?.emoji}</span>
                  <span>{count}</span>
                </div>
              )
            ))}
          </div>
          <div className="text-xs text-white/50 mt-2">
            {new Date(photo.timestamp).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoPreviewModal;

