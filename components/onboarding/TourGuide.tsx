import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // Sélecteur CSS pour l'élément à mettre en évidence
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string; // Clé pour localStorage (si null, le tour s'affiche toujours)
}

/**
 * Tour guidé interactif pour découvrir les fonctionnalités
 */
export const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  onComplete,
  onSkip,
  storageKey = 'tour_guide_completed',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  // Vérifier si le tour a déjà été complété
  useEffect(() => {
    if (storageKey && localStorage.getItem(storageKey) === 'true') {
      return;
    }
    setIsVisible(true);
  }, [storageKey]);

  // Mettre à jour la position de l'overlay pour chaque étape
  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (!step.targetSelector) {
      // Si pas de cible, centrer l'overlay
      setOverlayPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0,
      });
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(step.targetSelector) as HTMLElement;
    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      setOverlayPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll vers l'élément si nécessaire
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, steps, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] pointer-events-auto">
        {/* Overlay sombre avec trou pour l'élément cible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleSkip}
        >
          {/* Trou pour l'élément cible */}
          {targetElement && (
            <div
              className="absolute bg-transparent border-4 border-pink-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]"
              style={{
                top: `${overlayPosition.top - 8}px`,
                left: `${overlayPosition.left - 8}px`,
                width: `${overlayPosition.width + 16}px`,
                height: `${overlayPosition.height + 16}px`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 30px rgba(236, 72, 153, 0.5)`,
              }}
            />
          )}
        </motion.div>

        {/* Tooltip avec instructions */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md mx-4 pointer-events-auto"
        >
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 shadow-2xl border-2 border-white/20 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{step.title}</h3>
                  <p className="text-white/80 text-xs">
                    Étape {currentStep + 1} sur {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors touch-manipulation"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Description */}
            <p className="text-white/90 text-sm leading-relaxed mb-6">{step.description}</p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : index < currentStep
                      ? 'w-2 bg-white/60'
                      : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all touch-manipulation ${
                  isFirst
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              <button
                onClick={isLast ? handleComplete : handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-pink-600 rounded-xl font-bold hover:bg-white/90 active:scale-95 transition-all shadow-lg touch-manipulation"
              >
                {isLast ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Terminer</span>
                  </>
                ) : (
                  <>
                    <span>Suivant</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

