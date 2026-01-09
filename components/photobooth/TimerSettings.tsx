import React, { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(enabled, duration);
    onClose();
  };

  const durationOptions = [0, 1, 2, 3, 5, 10];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
            Paramètres du Timer
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Toggle Activer/Désactiver */}
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              {enabled ? (
                <Timer className="w-5 h-5 text-pink-400" />
              ) : (
                <TimerOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="text-white font-medium">Timer activé</p>
                <p className="text-xs text-white/60">
                  {enabled ? 'La photo sera prise après le décompte' : 'La photo sera prise immédiatement'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-pink-500' : 'bg-slate-600'
              }`}
              aria-label={enabled ? 'Désactiver le timer' : 'Activer le timer'}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Durée du Timer */}
          {enabled && (
            <div className="p-4 bg-black/40 rounded-xl border border-white/10">
              <label className="block text-white font-medium mb-3">
                Durée du décompte (secondes)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {durationOptions.map((value) => (
                  <button
                    key={value}
                    onClick={() => setDuration(value)}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      duration === value
                        ? 'bg-pink-500 text-white shadow-lg scale-105'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {value === 0 ? 'Off' : `${value}s`}
                  </button>
                ))}
              </div>
              {duration === 0 && (
                <p className="mt-3 text-xs text-yellow-400">
                  ⚠️ Le timer sera désactivé même si l'option est activée
                </p>
              )}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

