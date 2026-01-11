import React from 'react';
import { X, Check, Zap, Video } from 'lucide-react';
import { Photo } from '../../types';

interface CreateBattleFormProps {
  photos: Photo[];
  selectedPhoto1: Photo | null;
  selectedPhoto2: Photo | null;
  battleDuration: number;
  isCreating: boolean;
  onClose: () => void;
  onSelectPhoto1: (photo: Photo) => void;
  onSelectPhoto2: (photo: Photo) => void;
  onClearPhoto1: () => void;
  onClearPhoto2: () => void;
  onDurationChange: (duration: number) => void;
  onCreateRandom: () => Promise<void>;
  onCreate: () => Promise<void>;
}

const CreateBattleForm: React.FC<CreateBattleFormProps> = ({
  photos,
  selectedPhoto1,
  selectedPhoto2,
  battleDuration,
  isCreating,
  onClose,
  onSelectPhoto1,
  onSelectPhoto2,
  onClearPhoto1,
  onClearPhoto2,
  onDurationChange,
  onCreateRandom,
  onCreate,
}) => {
  return (
    <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-md md:text-lg font-semibold text-white">Créer une battle</h3>
        <button
          onClick={onClose}
          className="p-1 md:p-2 rounded-lg hover:bg-white/10 active:bg-white/20 md:hover:scale-110 transition-all touch-manipulation"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Durée */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Durée (minutes): {battleDuration}
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={battleDuration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>5 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Sélection photo 1 */}
        <div>
          <label className="block text-sm font-medium mb-2">Photo 1</label>
          {selectedPhoto1 ? (
            <div className="relative">
              <img
                src={selectedPhoto1.url}
                alt={selectedPhoto1.caption}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={onClearPhoto1}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 active:bg-red-600 transition-colors touch-manipulation"
                aria-label="Désélectionner"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1 text-xs text-white/70 truncate">
                {selectedPhoto1.author} - {selectedPhoto1.caption}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center">
              <p className="text-sm text-white/60 mb-2">Sélectionner une photo</p>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {photos.filter(p => p.id !== selectedPhoto2?.id).map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => onSelectPhoto1(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-pink-500 active:ring-4 transition-all touch-manipulation"
                  >
                    {photo.type === 'video' ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white/50" />
                      </div>
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sélection photo 2 */}
        <div>
          <label className="block text-sm font-medium mb-2">Photo 2</label>
          {selectedPhoto2 ? (
            <div className="relative">
              <img
                src={selectedPhoto2.url}
                alt={selectedPhoto2.caption}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={onClearPhoto2}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 active:bg-red-600 transition-colors touch-manipulation"
                aria-label="Désélectionner"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1 text-xs text-white/70 truncate">
                {selectedPhoto2.author} - {selectedPhoto2.caption}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center">
              <p className="text-sm text-white/60 mb-2">Sélectionner une photo</p>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {photos.filter(p => p.id !== selectedPhoto1?.id).map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => onSelectPhoto2(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-pink-500 active:ring-4 transition-all touch-manipulation"
                  >
                    {photo.type === 'video' ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white/50" />
                      </div>
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCreateRandom}
            disabled={isCreating || photos.length < 2}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 active:scale-95 transition-all disabled:opacity-50 text-sm touch-manipulation border border-purple-500/30 shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Aléatoire
          </button>
          <button
            onClick={onCreate}
            disabled={isCreating || !selectedPhoto1 || !selectedPhoto2 || selectedPhoto1.id === selectedPhoto2.id}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 active:bg-pink-500/40 active:scale-95 transition-all disabled:opacity-50 text-sm touch-manipulation border border-pink-500/30 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBattleForm;

