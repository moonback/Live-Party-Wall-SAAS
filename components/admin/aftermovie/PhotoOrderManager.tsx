import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Move, ChevronDown, ChevronUp, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { Photo } from '../../../types';
import {
  AFTERMOVIE_MAX_PHOTOS_RECOMMENDED,
  AFTERMOVIE_WARNING_PHOTOS_THRESHOLD
} from '../../../constants';

interface PhotoOrderManagerProps {
  photos: Photo[];
  photoOrder: string[];
  onOrderChange: (newOrder: string[]) => void;
  onResetToChronological: () => void;
  disabled?: boolean;
}

export const PhotoOrderManager: React.FC<PhotoOrderManagerProps> = ({
  photos,
  photoOrder,
  onOrderChange,
  onResetToChronological,
  disabled = false
}) => {
  const [showPhotoOrder, setShowPhotoOrder] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  // Utiliser l'ordre si disponible, sinon l'ordre des photos
  const orderedPhotos = photoOrder.length === photos.length
    ? [...photos].sort((a, b) => {
        const idxA = photoOrder.indexOf(a.id);
        const idxB = photoOrder.indexOf(b.id);
        return idxA - idxB;
      })
    : photos;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newOrder = [...photoOrder.length > 0 ? photoOrder : orderedPhotos.map(p => p.id)];
    const draggedId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedId);

    onOrderChange(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const movePhotoUp = (index: number) => {
    if (index === 0 || photoOrder.length === 0) return;
    const newOrder = [...photoOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onOrderChange(newOrder);
  };

  const movePhotoDown = (index: number) => {
    if (index >= photoOrder.length - 1 || photoOrder.length === 0) return;
    const newOrder = [...photoOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onOrderChange(newOrder);
  };

  const photoCount = photos.length;
  const isHigh = photoCount > AFTERMOVIE_MAX_PHOTOS_RECOMMENDED;
  const isWarning = photoCount > AFTERMOVIE_WARNING_PHOTOS_THRESHOLD;

  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-3 sm:p-4 md:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30 flex-shrink-0">
            <Move className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="truncate">Ordre des photos</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 border text-[10px] sm:text-xs rounded-full font-semibold flex-shrink-0 ${
                  isHigh
                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                    : isWarning
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                    : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                }`}
              >
                {photoCount}
                {isHigh && ' ⚠️'}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
              Réorganisez l'ordre d'apparition dans l'aftermovie
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowPhotoOrder(!showPhotoOrder)}
            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            disabled={disabled}
          >
            {showPhotoOrder ? (
              <>
                <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Masquer</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Afficher</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onResetToChronological}
            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            disabled={disabled || photos.length === 0}
            title="Réinitialiser à l'ordre chronologique"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {showPhotoOrder && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {orderedPhotos.map((photo, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
                onDrop={(e: React.DragEvent) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all cursor-move ${
                  isDragging
                    ? 'opacity-50 border-indigo-500 bg-indigo-500/20 scale-95'
                    : isDragOver
                    ? 'border-indigo-500 bg-indigo-500/30 scale-105 shadow-lg'
                    : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900/70 hover:shadow-md'
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-500/40 flex items-center justify-center text-xs sm:text-sm font-black text-indigo-200 shadow-lg">
                  {index + 1}
                </div>
                <div className="flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1 sm:space-y-1.5">
                    {/* Auteur */}
                    <div className="text-[10px] sm:text-xs font-semibold text-indigo-300 truncate">
                      {photo.author}
                    </div>
                    {/* Légende */}
                    <div className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                      {photo.caption || 'Sans légende'}
                    </div>
                    {/* Tags */}
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {photo.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold text-pink-400/90 bg-pink-500/10 border border-pink-500/20 uppercase tracking-tight"
                          >
                            #{tag.replace(/\s+/g, '')}
                          </span>
                        ))}
                        {photo.tags.length > 3 && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-800/50">
                            +{photo.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Timestamp */}
                    <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1 sm:gap-1.5">
                      <span>{new Date(photo.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{new Date(photo.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => movePhotoUp(index)}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    disabled={disabled || index === 0}
                    title="Déplacer vers le haut"
                  >
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhotoDown(index)}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    disabled={disabled || index >= orderedPhotos.length - 1}
                    title="Déplacer vers le bas"
                  >
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-slate-500 cursor-move hover:text-indigo-400 transition-colors">
                    <Move className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!showPhotoOrder && photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 sm:space-y-3"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap overflow-x-auto pb-2 sm:pb-0">
            {orderedPhotos.slice(0, 12).map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className="relative group cursor-pointer flex-shrink-0"
                title={`Photo ${index + 1}: ${photo.caption || 'Sans légende'}`}
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-slate-700 group-hover:border-indigo-500/50 transition-all shadow-lg group-hover:shadow-indigo-500/20">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.03 + 0.1 }}
                    className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-lg border border-white/20"
                  >
                    {index + 1}
                  </motion.div>
                </div>
              </motion.div>
            ))}
            {orderedPhotos.length > 12 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 12 * 0.03 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-300 shadow-lg hover:border-indigo-500/50 transition-colors flex-shrink-0"
                title={`${orderedPhotos.length - 12} photo(s) supplémentaire(s)`}
              >
                +{orderedPhotos.length - 12}
              </motion.div>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 sm:gap-1.5">
            <Move className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Cliquez sur "Afficher" pour réorganiser l'ordre • Glissez-déposez pour réorganiser</span>
            <span className="sm:hidden">Afficher pour réorganiser</span>
          </p>
        </motion.div>
      )}
    </div>
  );
};

