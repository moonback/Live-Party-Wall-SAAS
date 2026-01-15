/**
 * Composant de sélection de filtres avec suggestions IA
 * Affiche les filtres prédéfinis avec suggestions IA et option de filtre personnalisé
 */

import React, { useState, useEffect } from 'react';
import { FilterType, ArtisticFilterType } from '../../utils/imageFilters';
import { AIFilterParams } from '../../types';
import { useAIFilters } from '../../hooks/useAIFilters';
import { generateArtisticFilterSuggestion, generateCustomFilterParams } from '../../services/aiFilterService';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIFilterSelectorProps {
  showFilters: boolean;
  activeFilter: FilterType | 'ai-custom';
  originalImage: string | null;
  onFilterChange: (filter: FilterType | 'ai-custom') => void;
  onAIFilterParamsChange?: (params: AIFilterParams | null) => void;
  suggestedArtisticStyle?: ArtisticFilterType;
  aiFilterParams?: AIFilterParams;
}

export const AIFilterSelector: React.FC<AIFilterSelectorProps> = ({
  showFilters,
  activeFilter,
  originalImage,
  onFilterChange,
  onAIFilterParamsChange,
  suggestedArtisticStyle,
  aiFilterParams
}) => {
  const { previewFilter, isLoading } = useAIFilters();
  const [previewingFilter, setPreviewingFilter] = useState<FilterType | 'ai-custom' | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatingCustom, setGeneratingCustom] = useState(false);

  // Générer un aperçu du filtre personnalisé IA si demandé
  const handleGenerateCustomFilter = async () => {
    if (!originalImage) return;

    try {
      setGeneratingCustom(true);
      const params = await generateCustomFilterParams(originalImage);
      if (onAIFilterParamsChange) {
        onAIFilterParamsChange(params);
      }
      const preview = await previewFilter(originalImage, 'ai-custom', params);
      setPreviewImage(preview);
      onFilterChange('ai-custom');
    } catch (error) {
      console.error('Error generating custom filter:', error);
    } finally {
      setGeneratingCustom(false);
    }
  };

  // Prévisualiser un filtre au survol
  const handleFilterHover = async (filter: FilterType) => {
    if (!originalImage || isLoading) return;
    setPreviewingFilter(filter);
    try {
      const preview = await previewFilter(originalImage, filter);
      setPreviewImage(preview);
    } catch (error) {
      console.error('Error previewing filter:', error);
    }
  };

  const handleFilterLeave = () => {
    setPreviewingFilter(null);
    setPreviewImage(null);
  };

  if (!showFilters) return null;

  const artisticFilters: ArtisticFilterType[] = ['impressionist', 'popart', 'cinematic', 'vibrant', 'dreamy', 'dramatic', 'retro', 'neon'];
  const basicFilters: FilterType[] = ['none', 'vintage', 'blackwhite', 'warm', 'cool'];

  const getFilterLabel = (filter: FilterType): string => {
    const labels: Record<string, string> = {
      'none': 'Aucun',
      'vintage': 'Vintage',
      'blackwhite': 'N&B',
      'warm': 'Chaud',
      'cool': 'Froid',
      'impressionist': 'Impressionniste',
      'popart': 'Pop Art',
      'cinematic': 'Cinématique',
      'vibrant': 'Vibrant',
      'dreamy': 'Onirique',
      'dramatic': 'Dramatique',
      'retro': 'Rétro',
      'neon': 'Néon'
    };
    return labels[filter] || filter;
  };

  return (
    <div className="absolute top-12 xs:top-14 sm:top-18 md:top-20 lg:top-24 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 xs:p-2.5 sm:p-3 md:p-3.5 flex flex-col gap-2 animate-scale-in max-w-[95%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%]">
      {/* Filtres de base */}
      <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide">
        {basicFilters.map(f => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(f)}
            onMouseEnter={() => handleFilterHover(f)}
            onMouseLeave={handleFilterLeave}
            className={`px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 py-1 xs:py-1.5 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${
              activeFilter === f ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {getFilterLabel(f)}
          </motion.button>
        ))}
      </div>

      {/* Filtres artistiques avec suggestions IA */}
      <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide">
        {artisticFilters.map(f => {
          const isSuggested = suggestedArtisticStyle === f;
          return (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterChange(f)}
              onMouseEnter={() => handleFilterHover(f)}
              onMouseLeave={handleFilterLeave}
              className={`relative px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 py-1 xs:py-1.5 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${
                activeFilter === f 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50' 
                  : isSuggested
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {getFilterLabel(f)}
              {isSuggested && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5"
                  title="Suggéré par IA"
                >
                  <Sparkles className="w-2 h-2 text-white" />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Filtre personnalisé IA */}
      <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateCustomFilter}
          disabled={generatingCustom || isLoading || !originalImage}
          className={`relative px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 py-1 xs:py-1.5 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-bold capitalize whitespace-nowrap transition-colors touch-manipulation flex items-center gap-1.5 ${
            activeFilter === 'ai-custom'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
              : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30'
          } ${(generatingCustom || isLoading || !originalImage) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {generatingCustom ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Génération...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              <span className="hidden sm:inline">IA Personnalisé</span>
              <span className="sm:hidden">IA</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Aperçu du filtre au survol */}
      <AnimatePresence>
        {previewImage && previewingFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 h-32 rounded-lg overflow-hidden border-2 border-white/30 shadow-xl z-40"
          >
            <img 
              src={previewImage} 
              alt="Aperçu filtre" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

