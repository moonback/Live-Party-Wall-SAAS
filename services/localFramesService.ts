/**
 * Service pour gérer les cadres PNG locaux (depuis public/cadres/)
 */

import { getFramesManifestPath, getFramePath } from '../utils/electronPaths';

export interface LocalFrame {
  id: string;
  name: string;
  filename: string;
  thumbnail?: string;
  category: string;
}

/**
 * Récupère la liste des cadres disponibles depuis le manifest JSON
 */
export async function getLocalFrames(): Promise<LocalFrame[]> {
  try {
    const manifestPath = getFramesManifestPath();
    const response = await fetch(manifestPath);
    if (!response.ok) {
      console.warn('frames-manifest.json not found, using empty list');
      return [];
    }
    const frames: LocalFrame[] = await response.json();
    return frames;
  } catch (error) {
    console.error('Error loading local frames:', error);
    return [];
  }
}

/**
 * Retourne l'URL complète d'un cadre local
 */
export function getLocalFrameUrl(filename: string): string {
  return getFramePath(filename);
}

/**
 * Retourne l'URL de la miniature d'un cadre local
 */
export function getLocalFrameThumbnailUrl(frame: LocalFrame): string {
  if (frame.thumbnail) {
    return getFramePath(frame.thumbnail);
  }
  // Fallback sur le cadre complet si pas de miniature
  return getFramePath(frame.filename);
}

/**
 * Catégories de cadres avec leur emoji/icône
 */
export const frameCategories: Record<string, { label: string; emoji: string }> = {
  universal: { label: 'Universel', emoji: '⭐' },
  wedding: { label: 'Mariage', emoji: '💍' },
  birthday: { label: 'Anniversaire', emoji: '🎂' },
  party: { label: 'Soirée', emoji: '🎉' },
  corporate: { label: 'Corporate', emoji: '💼' },
  seasonal: { label: 'Saisonnier', emoji: '🎄' },
  retro: { label: 'Rétro', emoji: '📼' }
};

