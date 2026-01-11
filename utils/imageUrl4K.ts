/**
 * ⚡ OPTIMISATION : Utilitaires pour forcer le chargement d'images en qualité 4K (3840x2160)
 * avec support des formats modernes (WebP, AVIF)
 * pour l'affichage sur le mur
 */

import { getOptimalImageUrl } from './imageFormatSupport';

// Résolution 4K standard
export const RESOLUTION_4K = {
  width: 3840,
  height: 2160
};

/**
 * ⚡ OPTIMISATION : Génère une URL d'image optimisée pour 4K avec formats modernes
 * Charge l'image originale en pleine résolution avec le meilleur format supporté (AVIF > WebP > Original)
 * 
 * @param originalUrl - URL originale de l'image
 * @param force4K - Forcer le 4K même si l'image est plus petite (défaut: true)
 * @param preferFormat - Format préféré ('avif' | 'webp' | 'original')
 * @returns URL de l'image optimisée en pleine résolution
 */
export async function get4KImageUrl(
  originalUrl: string, 
  force4K: boolean = true,
  preferFormat: 'avif' | 'webp' | 'original' = 'avif'
): Promise<string> {
  if (!originalUrl) return originalUrl;

  // Si l'URL est déjà une data URL (base64), retourner tel quel
  if (originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // Pour Supabase Storage, on charge directement l'image originale
  // Les images sont déjà uploadées en haute qualité (sans compression)
  // On retire tous les paramètres de transformation pour charger l'original
  try {
    const url = new URL(originalUrl);
    
    // Retirer tous les paramètres de transformation pour forcer l'image originale
    // Cela garantit que l'image est chargée en pleine résolution
    url.searchParams.delete('width');
    url.searchParams.delete('height');
    url.searchParams.delete('quality');
    url.searchParams.delete('resize');
    url.searchParams.delete('transform');
    
    const cleanUrl = url.toString();
    
    // ⚡ OPTIMISATION : Utiliser le meilleur format supporté
    return await getOptimalImageUrl(cleanUrl, preferFormat);
  } catch {
    // Si l'URL n'est pas valide, retourner tel quel
    return originalUrl;
  }
}

/**
 * ⚡ OPTIMISATION : Version synchrone (fallback si async non disponible)
 * Génère une URL d'image optimisée pour 4K sans détection de format
 */
export function get4KImageUrlSync(originalUrl: string, force4K: boolean = true): string {
  if (!originalUrl) return originalUrl;

  if (originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    url.searchParams.delete('width');
    url.searchParams.delete('height');
    url.searchParams.delete('quality');
    url.searchParams.delete('resize');
    url.searchParams.delete('transform');
    return url.toString();
  } catch {
    return originalUrl;
  }
}

/**
 * ⚡ OPTIMISATION : Génère un srcset optimisé avec formats modernes
 * Pour le mur, on charge toujours l'image originale en 4K avec le meilleur format
 * 
 * @param originalUrl - URL originale de l'image
 * @returns Promise résolue avec srcset string optimisé
 */
export async function get4KImageSrcSet(originalUrl: string): Promise<string> {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return '';
  }

  // ⚡ OPTIMISATION : Générer srcset avec formats multiples
  const { generateOptimizedSrcSet } = await import('./imageFormatSupport');
  return await generateOptimizedSrcSet(originalUrl, [800, 1600, 2400, 3840]);
}

/**
 * ⚡ OPTIMISATION : Version synchrone (fallback)
 */
export function get4KImageSrcSetSync(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return '';
  }
  return '';
}

/**
 * Génère les sizes pour le responsive images
 * Optimisé pour les écrans 4K et grands écrans
 * 
 * @returns String sizes pour l'attribut sizes
 */
export function get4KImageSizes(): string {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1920px) 33vw, (max-width: 2560px) 25vw, 3840px';
}

