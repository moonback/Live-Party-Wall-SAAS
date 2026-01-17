import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, CheckCircle2 } from 'lucide-react';
import { Photo } from '../../../types';

interface PhotoSelectionGridProps {
  photos: Photo[];
  selectedIds: Set<string>;
  searchQuery: string;
  onToggleSelection: (photoId: string) => void;
  onOpenFullscreen: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  disabled?: boolean;
}

export const PhotoSelectionGrid: React.FC<PhotoSelectionGridProps> = ({
  photos,
  selectedIds,
  searchQuery,
  onToggleSelection,
  onOpenFullscreen,
  onSelectAll,
  onDeselectAll,
  disabled = false
}) => {
  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(query) ||
      p.author?.toLowerCase().includes(query)
    );
  });

  if (photos.length === 0) {
    return (
      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
        <div className="text-sm text-slate-500">Aucune photo dans la plage (ou plage invalide).</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Photos dans la plage</div>
          <div className="text-xs text-slate-400">
            Sélectionnées: <span className="font-semibold text-slate-100">{selectedIds.size}</span> / {photos.length}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border border-indigo-500/50 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || photos.length === 0}
            title="Ouvrir en plein écran pour sélectionner les photos"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Plein écran</span>
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
            disabled={disabled || photos.length === 0}
          >
            Tout
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
            disabled={disabled || photos.length === 0}
          >
            Aucun
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredPhotos.map((p) => {
            const selected = selectedIds.has(p.id);
            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleSelection(p.id);
                }}
                whileHover={{ scale: selected ? 0.95 : 1.05 }}
                whileTap={{ scale: 0.9 }}
                className={`relative group w-full rounded-lg overflow-hidden border transition-all aspect-square ${
                  selected
                    ? 'border-indigo-500/60 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                disabled={disabled}
              >
                <img
                  src={p.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 left-1 z-10"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-2 border-white shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </motion.div>
                )}
                {/* Overlay avec légende et tags au survol */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                  <div className="space-y-1">
                    {/* Auteur */}
                    <div className="text-[10px] font-semibold text-indigo-300 truncate">
                      {p.author}
                    </div>
                    {/* Légende */}
                    <div className="text-xs font-medium text-white line-clamp-2 leading-tight">
                      {p.caption || 'Sans légende'}
                    </div>
                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 pt-0.5">
                        {p.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold text-pink-300 bg-pink-500/20 border border-pink-400/30 uppercase tracking-tight"
                          >
                            #{tag.replace(/\s+/g, '')}
                          </span>
                        ))}
                        {p.tags.length > 2 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold text-slate-300 bg-slate-700/50">
                            +{p.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

