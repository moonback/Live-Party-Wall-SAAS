import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../../../types';

interface TieOverlayProps {
  tieData: { photo1: Photo; photo2: Photo } | null;
}

export const TieOverlay = React.memo(({ tieData }: TieOverlayProps) => {
  return (
    <AnimatePresence>
      {tieData && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 via-slate-500/20 to-gray-500/20 backdrop-blur-sm"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative max-w-6xl w-full mx-4"
          >
            <div className="absolute -top-8 md:-top-12 lg:-top-16 left-1/2 -translate-x-1/2 z-10 animate-bounce">
              <div className="bg-gradient-to-r from-gray-400 via-slate-400 to-gray-400 px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-5 rounded-full shadow-2xl border-4 md:border-[5px] lg:border-8 border-white/50 flex items-center gap-2 md:gap-3 lg:gap-4">
                <span className="text-white font-black text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">🤝 ÉGALITÉ !</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 xl:gap-10">
              {[tieData.photo1, tieData.photo2].map((photo) => (
                  <div key={photo.id} className="relative bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-[0_30px_90px_rgba(100,100,100,0.4)] border-4 md:border-[5px] lg:border-8 border-gray-400/60 p-4 md:p-6 lg:p-8 xl:p-10">
                    <div className="absolute -inset-2 md:-inset-3 lg:-inset-4 bg-gradient-to-r from-gray-500 via-slate-500 to-gray-500 rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] opacity-30 blur-2xl animate-pulse"></div>
                    
                    <div className="relative bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                      {photo.type === 'video' ? (
                        <video
                          src={photo.url}
                          className="w-full max-h-[50vh] md:max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh] object-contain"
                          autoPlay
                          loop
                          muted
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full max-h-[50vh] md:max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh] object-contain"
                        />
                      )}
                    </div>
                    
                    <div className="relative p-4 md:p-6 lg:p-8 xl:p-10 text-slate-900 text-center">
                      <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-slate-800 mb-2 md:mb-3 lg:mb-4">
                        {photo.author}
                      </p>
                      <p className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-slate-600 italic">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
              ))}
            </div>

            <div className="mt-6 md:mt-8 lg:mt-10 xl:mt-12 text-center">
              <p className="text-white/90 text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold bg-gray-700/50 backdrop-blur-sm px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-5 rounded-full inline-block border-2 md:border-[3px] border-gray-500/30">
                Les deux photos ont reçu le même nombre de votes ! 🎉
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

