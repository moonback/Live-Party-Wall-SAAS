import React from 'react';
import { Check } from 'lucide-react';

interface BurstModeViewProps {
  burstPhotos: string[];
  onSelectPhoto: (photoIndex: number) => void;
  selectedIndex: number | null;
  onConfirm: () => void;
}

export const BurstModeView: React.FC<BurstModeViewProps> = ({
  burstPhotos,
  onSelectPhoto,
  selectedIndex,
  onConfirm
}) => {
  return (
    <div className="absolute inset-0 z-10 bg-black animate-fade-in-up flex flex-col">
      {/* Header */}
      <div className="absolute top-14 sm:top-20 landscape:top-10 landscape:sm:top-12 left-0 right-0 px-4 sm:px-6 landscape:px-2 landscape:sm:px-3 z-30">
        <div className="bg-black/60 backdrop-blur-md p-3 sm:p-4 landscape:p-2 landscape:sm:p-2.5 rounded-xl sm:rounded-2xl landscape:rounded-lg border border-white/10">
          <h3 className="text-white text-center font-bold text-base sm:text-lg landscape:text-sm landscape:sm:text-base">
            Sélectionnez votre meilleure photo
          </h3>
          <p className="text-white/70 text-center text-xs sm:text-sm landscape:text-[10px] landscape:sm:text-xs mt-1 landscape:mt-0.5">
            {burstPhotos.length} photo{burstPhotos.length > 1 ? 's' : ''} capturée{burstPhotos.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-6 landscape:p-2 landscape:sm:p-3 pt-24 sm:pt-32 landscape:pt-16 landscape:sm:pt-20 pb-20 landscape:pb-12 landscape:sm:pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 landscape:grid-cols-3 landscape:sm:grid-cols-4 gap-3 sm:gap-4 landscape:gap-2 landscape:sm:gap-2.5 max-w-4xl mx-auto">
          {burstPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => onSelectPhoto(index)}
              className={`relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                selectedIndex === index
                  ? 'border-pink-500 scale-105 shadow-2xl shadow-pink-500/50'
                  : 'border-white/20 hover:border-white/40 hover:scale-[1.02]'
              }`}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de sélection */}
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pink-500 flex items-center justify-center shadow-2xl">
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                  </div>
                </div>
              )}
              
              {/* Numéro de la photo */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs sm:text-sm font-bold">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      {selectedIndex !== null && (
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 landscape:p-2 landscape:sm:p-3 pb-6 sm:pb-8 landscape:pb-3 landscape:sm:pb-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20">
          <button
            onClick={onConfirm}
            className="w-full py-3 sm:py-4 landscape:py-2 landscape:sm:py-2.5 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-xl sm:rounded-2xl landscape:rounded-lg font-bold shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 active:scale-95 transition-all duration-300 flex items-center justify-center border border-pink-400/50 touch-manipulation text-sm sm:text-base landscape:text-xs landscape:sm:text-sm"
          >
            <span className="flex items-center justify-center gap-2 landscape:gap-1.5 font-semibold">
              <span role="img" aria-label="Valider" className="text-base sm:text-lg landscape:text-sm landscape:sm:text-base">✓</span>
              <span>Utiliser cette photo</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

