import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { AftermovieProgress } from '../../../types';

interface ProgressDisplayProps {
  progress: AftermovieProgress | null;
}

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'analyzing':
      return <Loader2 className="w-4 h-4 animate-spin text-purple-400" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    default:
      return null;
  }
};

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ progress }) => {
  const percentage = progress && progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-800 rounded-lg p-4 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        {progress && getStageIcon(progress.stage)}
        <h3 className="text-sm font-semibold text-slate-100">Progression</h3>
      </div>
      {progress ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-300">
              {progress.message || progress.stage}
            </div>
            <div className="text-xs font-semibold text-indigo-400">
              {percentage}%
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg relative overflow-hidden"
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </motion.div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{progress.processed} / {progress.total} photos</span>
            {progress.stage === 'processing' && (
              <span className="text-indigo-400">Génération en cours…</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Circle className="w-3 h-3" />
          En attente de génération…
        </div>
      )}
    </motion.div>
  );
};

