import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-10 bg-black flex flex-col"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-12 xs:top-14 sm:top-18 md:top-20 lg:top-24 landscape:top-10 landscape:xs:top-12 landscape:sm:top-14 landscape:md:top-16 left-0 right-0 px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 landscape:px-2 landscape:xs:px-2.5 landscape:sm:px-3 landscape:md:px-4 z-30"
      >
        <div className="bg-black/60 backdrop-blur-md p-3 xs:p-3.5 sm:p-4 md:p-5 landscape:p-2 landscape:xs:p-2.5 landscape:sm:p-3 landscape:md:p-3.5 rounded-xl sm:rounded-2xl md:rounded-3xl landscape:rounded-lg border border-white/10">
          <h3 className="text-white text-center font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl landscape:text-xs landscape:xs:text-sm landscape:sm:text-base landscape:md:text-lg">
            Sélectionnez votre meilleure photo
          </h3>
          <p className="text-white/70 text-center text-[10px] xs:text-xs sm:text-sm md:text-base landscape:text-[9px] landscape:xs:text-[10px] landscape:sm:text-xs landscape:md:text-sm mt-1 xs:mt-1.5 sm:mt-2 landscape:mt-0.5 landscape:xs:mt-0.5 landscape:sm:mt-1">
            {burstPhotos.length} photo{burstPhotos.length > 1 ? 's' : ''} capturée{burstPhotos.length > 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Photos Grid */}
      <div className="flex-1 w-full h-full overflow-y-auto p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 landscape:p-2 landscape:xs:p-2.5 landscape:sm:p-3 landscape:md:p-4 pt-20 xs:pt-24 sm:pt-28 md:pt-32 lg:pt-36 landscape:pt-14 landscape:xs:pt-16 landscape:sm:pt-18 landscape:md:pt-20 pb-16 xs:pb-20 sm:pb-24 md:pb-28 landscape:pb-10 landscape:xs:pb-12 landscape:sm:pb-14 landscape:md:pb-16">
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 landscape:grid-cols-3 landscape:xs:grid-cols-3 landscape:sm:grid-cols-4 landscape:md:grid-cols-5 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 landscape:gap-2 landscape:xs:gap-2.5 landscape:sm:gap-3 landscape:md:gap-4 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {burstPhotos.map((photo, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onSelectPhoto(index)}
                className={`relative aspect-[3/4] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-[3px] xs:border-4 sm:border-4 md:border-[5px] transition-all duration-300 ${
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
                <AnimatePresence>
                  {selectedIndex === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-pink-500/20 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-pink-500 flex items-center justify-center shadow-2xl"
                      >
                        <Check className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Numéro de la photo */}
                <div className="absolute top-1.5 xs:top-2 sm:top-2.5 md:top-3 left-1.5 xs:left-2 sm:left-2.5 md:left-3 bg-black/60 backdrop-blur-sm px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1 md:py-1.5 rounded-lg sm:rounded-xl text-white text-[10px] xs:text-xs sm:text-sm md:text-base font-bold">
                  {index + 1}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Actions */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 w-full p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 landscape:p-2 landscape:xs:p-2.5 landscape:sm:p-3 landscape:md:p-4 pb-4 xs:pb-5 sm:pb-6 md:pb-7 lg:pb-8 landscape:pb-3 landscape:xs:pb-3.5 landscape:sm:pb-4 landscape:md:pb-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20"
          >
            <motion.button
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="w-full py-2.5 xs:py-3 sm:py-3.5 md:py-4 lg:py-5 landscape:py-2 landscape:xs:py-2.5 landscape:sm:py-3 landscape:md:py-3.5 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-xl sm:rounded-2xl md:rounded-3xl landscape:rounded-lg font-bold shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 transition-all duration-300 flex items-center justify-center border border-pink-400/50 touch-manipulation text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl landscape:text-[10px] landscape:xs:text-xs landscape:sm:text-sm landscape:md:text-base"
            >
              <span className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 landscape:gap-1 landscape:xs:gap-1.5 landscape:sm:gap-2 font-semibold">
                <span role="img" aria-label="Valider" className="text-sm xs:text-base sm:text-lg md:text-xl landscape:text-xs landscape:xs:text-sm landscape:sm:text-base">✓</span>
                <span>Utiliser cette photo</span>
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

