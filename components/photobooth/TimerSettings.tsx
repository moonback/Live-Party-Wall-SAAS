import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, TimerOff } from 'lucide-react';

interface TimerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  timerEnabled: boolean;
  timerDuration: number;
  onSave: (enabled: boolean, duration: number) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  isOpen,
  onClose,
  timerEnabled,
  timerDuration,
  onSave
}) => {
  const [enabled, setEnabled] = useState(timerEnabled);
  const [duration, setDuration] = useState(timerDuration);

  useEffect(() => {
    if (isOpen) {
      setEnabled(timerEnabled);
      setDuration(timerDuration);
    }
  }, [isOpen, timerEnabled, timerDuration]);

  const handleSave = () => {
    onSave(enabled, duration);
    onClose();
  };

  const durationOptions = [0, 1, 2, 3, 5, 10];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 sm:p-5 md:p-6 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 xs:p-6 sm:p-7 md:p-8 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5 xs:mb-6 sm:mb-7 md:mb-8">
              <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Timer className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-pink-400" />
                Paramètres du Timer
              </h3>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-1.5 xs:p-2 hover:bg-white/10 rounded-full"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7" />
              </button>
            </div>

            <div className="space-y-5 xs:space-y-6 sm:space-y-7 md:space-y-8">
              {/* Toggle Activer/Désactiver */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center justify-between p-3 xs:p-4 sm:p-5 bg-black/40 rounded-xl sm:rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-4">
                  {enabled ? (
                    <Timer className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-pink-400" />
                  ) : (
                    <TimerOff className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-slate-400" />
                  )}
                  <div>
                    <p className="text-white font-medium text-sm xs:text-base sm:text-lg">Timer activé</p>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-white/60">
                      {enabled ? 'La photo sera prise après le décompte' : 'La photo sera prise immédiatement'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`relative w-12 h-6 xs:w-14 xs:h-7 sm:w-16 sm:h-8 rounded-full transition-colors ${
                    enabled ? 'bg-pink-500' : 'bg-slate-600'
                  }`}
                  aria-label={enabled ? 'Désactiver le timer' : 'Activer le timer'}
                >
                  <motion.span
                    animate={{ x: enabled ? 6 : 0 }}
                    className="absolute top-1 left-1 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 bg-white rounded-full"
                  />
                </button>
              </motion.div>

              {/* Durée du Timer */}
              <AnimatePresence>
                {enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 xs:p-4 sm:p-5 bg-black/40 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden"
                  >
                    <label className="block text-white font-medium mb-3 xs:mb-4 text-sm xs:text-base sm:text-lg">
                      Durée du décompte (secondes)
                    </label>
                    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-6 gap-2 xs:gap-2.5 sm:gap-3">
                      {durationOptions.map((value) => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDuration(value)}
                          className={`px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base transition-all ${
                            duration === value
                              ? 'bg-pink-500 text-white shadow-lg scale-105'
                              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {value === 0 ? 'Off' : `${value}s`}
                        </motion.button>
                      ))}
                    </div>
                    {duration === 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 xs:mt-4 text-[10px] xs:text-xs sm:text-sm text-yellow-400"
                      >
                        ⚠️ Le timer sera désactivé même si l'option est activée
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Boutons d'action */}
              <div className="flex gap-2.5 xs:gap-3 sm:gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors text-sm xs:text-base sm:text-lg"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl text-sm xs:text-base sm:text-lg"
                >
                  Enregistrer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

