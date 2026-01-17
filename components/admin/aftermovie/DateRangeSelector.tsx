import React from 'react';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Début</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Fin</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

