import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Photo } from '../../../types';

interface WinnerOverlayProps {
  photo: Photo | null;
}

export const WinnerOverlay = React.memo(({ photo }: WinnerOverlayProps) => {
  return (
    <AnimatePresence>
      {photo && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          {/* Overlay avec effet de glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-sm"></div>
          
          {/* Conteneur de la photo gagnante */}
          <motion.div 
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative max-w-4xl w-full mx-4"
          >
            {/* Badge "Gagnant" */}
            <div className="absolute -top-8 md:-top-12 lg:-top-16 left-1/2 -translate-x-1/2 z-10">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-5 rounded-full shadow-2xl border-4 md:border-[5px] lg:border-8 border-white/50 flex items-center gap-2 md:gap-3 lg:gap-4"
              >
                <Trophy className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-yellow-900" />
                <span className="text-yellow-900 font-black text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">PHOTO GAGNANTE !</span>
                <Trophy className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-yellow-900" />
              </motion.div>
            </div>

            {/* Photo */}
            <div className="relative bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-[0_30px_90px_rgba(236,72,153,0.6)] border-4 md:border-[5px] lg:border-8 border-yellow-400/80 p-4 md:p-6 lg:p-8 xl:p-10">
              {/* Glow multicolore animé */}
              <div className="absolute -inset-2 md:-inset-3 lg:-inset-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] opacity-40 blur-2xl animate-pulse"></div>
              
              {/* Media Container */}
              <div className="relative bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                {photo.type === 'video' ? (
                  <video
                    src={photo.url}
                    className="w-full max-h-[60vh] md:max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] object-contain"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full max-h-[60vh] md:max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] object-contain"
                  />
                )}
              </div>
              
              {/* Caption Section */}
              <div className="relative p-4 md:p-6 lg:p-8 xl:p-10 text-slate-900 text-center">
                <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-slate-800 mb-2 md:mb-3 lg:mb-4">
                  {photo.author}
                </p>
                <p className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-slate-600 italic">
                  {photo.caption}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

