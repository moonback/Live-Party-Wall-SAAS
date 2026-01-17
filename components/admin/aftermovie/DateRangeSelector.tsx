import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DateRangeSelectorProps {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  disabled?: boolean;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  start,
  end,
  onStartChange,
  onEndChange,
  disabled = false
}) => {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
        <h3 className="text-xs sm:text-sm font-semibold text-slate-100">Plage de dates</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-400 mb-1.5 sm:mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Début
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all hover:border-slate-700"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-[10px] sm:text-xs font-medium text-slate-400 mb-1.5 sm:mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Fin
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all hover:border-slate-700"
            disabled={disabled}
          />
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-2 sm:mt-3">
        Sélectionnez la période pour filtrer les photos à inclure dans l'aftermovie
      </p>
    </div>
  );
};

