import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface CreationGuideProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  onClose?: () => void;
}

export const CreationGuide: React.FC<CreationGuideProps> = ({
  steps,
  currentStep,
  onStepClick,
  onClose
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (steps.length === 0) return null;

  const allCompleted = steps.every(s => s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 rounded-xl p-3 sm:p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 flex-shrink-0">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">Guide de création</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">Suivez ces étapes pour créer votre aftermovie</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {allCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 border border-green-500/30 rounded-lg hidden sm:flex"
            >
              <span className="text-[10px] sm:text-xs font-semibold text-green-300 flex items-center gap-1 sm:gap-1.5">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Terminé
              </span>
            </motion.div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isCollapsed ? 'Développer' : 'Réduire'}
          >
            <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Fermer le guide"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isPast = index < currentStep;
                const isCompleted = step.completed;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onStepClick?.(index)}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-md shadow-indigo-500/20'
                        : isCompleted
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
                        : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center"
                        >
                          <span className="text-[10px] sm:text-xs font-bold text-white">{index + 1}</span>
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-400">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${
                        isActive ? 'text-indigo-300' : isCompleted ? 'text-green-300' : 'text-slate-300'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                        {step.description}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

