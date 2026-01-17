import React from 'react';
import { AftermovieProgress } from '../../../types';

interface ProgressDisplayProps {
  progress: AftermovieProgress | null;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ progress }) => {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-2">Progression</h3>
      {progress ? (
        <div className="space-y-2">
          <div className="text-sm text-slate-300">
            {progress.message || progress.stage}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{
                width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%`
              }}
            ></div>
          </div>
          <div className="text-xs text-slate-500">
            {progress.processed} / {progress.total}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">En attente…</div>
      )}
    </div>
  );
};

