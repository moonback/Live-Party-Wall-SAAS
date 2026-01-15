/**
 * Hook pour gérer l'application, la prévisualisation et le cache des filtres IA
 */

import { useState, useCallback, useRef } from 'react';
import { applyImageFilter, applyAIGeneratedFilter, FilterType } from '../utils/imageFilters';
import { AIFilterParams } from '../types';
import { logger } from '../utils/logger';

// Cache en mémoire pour les images filtrées
const filterCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

/**
 * Nettoie le cache si trop volumineux
 */
function cleanFilterCache(): void {
  if (filterCache.size > MAX_CACHE_SIZE) {
    // Supprimer les 10 plus anciennes entrées
    const entries = Array.from(filterCache.entries());
    const toDelete = entries.slice(0, 10);
    for (const [key] of toDelete) {
      filterCache.delete(key);
    }
  }
}

export interface UseAIFiltersReturn {
  /**
   * Applique un filtre à une image
   */
  applyFilter: (imageDataUrl: string, filter: FilterType | 'ai-custom', aiParams?: AIFilterParams) => Promise<string>;
  
  /**
   * Prévisualise un filtre sans l'appliquer définitivement
   */
  previewFilter: (imageDataUrl: string, filter: FilterType | 'ai-custom', aiParams?: AIFilterParams) => Promise<string>;
  
  /**
   * Efface le cache des filtres
   */
  clearCache: () => void;
  
  /**
   * Récupère une image filtrée depuis le cache
   */
  getFilteredImage: (imageDataUrl: string, filter: FilterType | 'ai-custom') => string | null;
  
  /**
   * État de chargement
   */
  isLoading: boolean;
}

/**
 * Hook pour gérer les filtres IA
 */
export const useAIFilters = (): UseAIFiltersReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef<Set<string>>(new Set());

  /**
   * Génère une clé de cache pour une image et un filtre
   */
  const getCacheKey = useCallback((imageDataUrl: string, filter: FilterType | 'ai-custom', aiParams?: AIFilterParams): string => {
    if (filter === 'ai-custom' && aiParams) {
      // Pour les filtres personnalisés, inclure les paramètres dans la clé
      const paramsHash = JSON.stringify(aiParams);
      return `${imageDataUrl.substring(0, 50)}_${filter}_${paramsHash.substring(0, 50)}`;
    }
    return `${imageDataUrl.substring(0, 50)}_${filter}`;
  }, []);

  /**
   * Applique un filtre à une image
   */
  const applyFilter = useCallback(async (
    imageDataUrl: string,
    filter: FilterType | 'ai-custom',
    aiParams?: AIFilterParams
  ): Promise<string> => {
    if (!imageDataUrl) {
      throw new Error('Image data URL is required');
    }

    const cacheKey = getCacheKey(imageDataUrl, filter, aiParams);
    
    // Vérifier le cache
    const cached = filterCache.get(cacheKey);
    if (cached) {
      logger.debug('Filter cache hit', { cacheKey: cacheKey.substring(0, 20) });
      return cached;
    }

    // Éviter les traitements en double
    if (processingRef.current.has(cacheKey)) {
      // Attendre que le traitement en cours se termine
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const cached = filterCache.get(cacheKey);
          if (cached) {
            clearInterval(checkInterval);
            resolve(cached);
          }
        }, 100);
      });
    }

    try {
      setIsLoading(true);
      processingRef.current.add(cacheKey);

      let filteredImage: string;

      if (filter === 'ai-custom' && aiParams) {
        filteredImage = await applyAIGeneratedFilter(imageDataUrl, aiParams);
      } else {
        filteredImage = await applyImageFilter(imageDataUrl, filter as FilterType);
      }

      // Mettre en cache
      cleanFilterCache();
      filterCache.set(cacheKey, filteredImage);

      return filteredImage;
    } catch (error) {
      logger.error('Error applying filter', error, {
        component: 'useAIFilters',
        action: 'applyFilter',
        filter
      });
      // En cas d'erreur, retourner l'image originale
      return imageDataUrl;
    } finally {
      setIsLoading(false);
      processingRef.current.delete(cacheKey);
    }
  }, [getCacheKey]);

  /**
   * Prévisualise un filtre sans l'appliquer définitivement
   * (identique à applyFilter mais avec un nom plus explicite)
   */
  const previewFilter = useCallback(async (
    imageDataUrl: string,
    filter: FilterType | 'ai-custom',
    aiParams?: AIFilterParams
  ): Promise<string> => {
    return applyFilter(imageDataUrl, filter, aiParams);
  }, [applyFilter]);

  /**
   * Efface le cache des filtres
   */
  const clearCache = useCallback(() => {
    filterCache.clear();
    processingRef.current.clear();
    logger.debug('Filter cache cleared');
  }, []);

  /**
   * Récupère une image filtrée depuis le cache
   */
  const getFilteredImage = useCallback((
    imageDataUrl: string,
    filter: FilterType | 'ai-custom'
  ): string | null => {
    const cacheKey = getCacheKey(imageDataUrl, filter);
    return filterCache.get(cacheKey) || null;
  }, [getCacheKey]);

  return {
    applyFilter,
    previewFilter,
    clearCache,
    getFilteredImage,
    isLoading
  };
};

