import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, X } from 'lucide-react';
import { Photo } from '../../../types';

interface FullscreenPhotoSelectionProps {
  isOpen: boolean;
  photos: Photo[];
  selectedIds: Set<string>;
  onClose: () => void;
  onToggleSelection: (photoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  disabled?: boolean;
}

export const FullscreenPhotoSelection: React.FC<FullscreenPhotoSelectionProps> = ({
  isOpen,
  photos,
  selectedIds,
  onClose,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  disabled = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Raccourcis clavier
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        onSelectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAll]);

  if (!isOpen) return null;

  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(query) ||
      p.author?.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col bg-slate-900 rounded-lg border border-slate-800"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <h2 className="text-lg sm:text-xl font-bold text-white">Sélection des photos</h2>
          <div className="text-xs sm:text-sm text-slate-400">
            {selectedIds.size} / {photos.length} sélectionnée{selectedIds.size > 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Recherche */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          {/* Vue grille/liste */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-colors"
          >
            Tout sélectionner
          </button>
          <button
            onClick={onDeselectAll}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs sm:text-sm font-medium transition-colors"
          >
            Tout désélectionner
          </button>
        </div>
        <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 hidden sm:block">
          Cliquez sur une photo pour la sélectionner/désélectionner • <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Ctrl+A</kbd> Tout sélectionner • <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 rounded text-[10px] sm:text-xs">Esc</kbd> Fermer
        </div>
      </div>

      {/* Grille de photos */}
      <div className="max-h-[600px] overflow-y-auto p-3 sm:p-4 md:p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
            {filteredPhotos.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: selected ? 0.95 : 1 }}
                  whileHover={{ scale: selected ? 0.95 : 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => onToggleSelection(p.id)}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                    selected
                      ? 'border-indigo-500 ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  disabled={disabled}
                >
                  <img
                    src={p.url}
                    alt={p.caption || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-xl border-4 border-white">
                        ✓
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="space-y-1.5">
                      {/* Auteur */}
                      <div className="text-xs font-semibold text-indigo-300 truncate">
                        {p.author}
                      </div>
                      {/* Légende */}
                      <div className="text-sm font-medium text-white line-clamp-2 leading-relaxed">
                        {p.caption || 'Sans légende'}
                      </div>
                      {/* Tags */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-pink-300 bg-pink-500/20 border border-pink-400/30 uppercase tracking-tight"
                            >
                              #{tag.replace(/\s+/g, '')}
                            </span>
                          ))}
                          {p.tags.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 bg-slate-700/50">
                              +{p.tags.length - 3}
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
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {filteredPhotos.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => onToggleSelection(p.id)}
                  className={`w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                  disabled={disabled}
                >
                  <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={p.url}
                      alt={p.caption || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selected && (
                      <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-black">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="space-y-1 sm:space-y-1.5">
                      {/* Auteur */}
                      <div className="text-[10px] sm:text-xs font-semibold text-indigo-300 truncate">
                        {p.author}
                      </div>
                      {/* Légende */}
                      <div className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-relaxed">
                        {p.caption || 'Sans légende'}
                      </div>
                      {/* Tags */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {p.tags.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold text-pink-400/90 bg-pink-500/10 border border-pink-500/20 uppercase tracking-tight"
                            >
                              #{tag.replace(/\s+/g, '')}
                            </span>
                          ))}
                          {p.tags.length > 4 && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-800/50">
                              +{p.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Timestamp */}
                      <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1 sm:gap-1.5">
                        <span>{new Date(p.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{new Date(p.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                  {selected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-black">
                        {Array.from(selectedIds).indexOf(p.id) + 1}
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

