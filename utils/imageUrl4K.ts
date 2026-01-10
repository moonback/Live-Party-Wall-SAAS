/**
 * Utilitaires pour forcer le chargement d'images en qualité 4K (3840x2160)
 * pour l'affichage sur le mur
 */

// Résolution 4K standard
export const RESOLUTION_4K = {
  width: 3840,
  height: 2160
};

/**
 * Génère une URL d'image optimisée pour 4K
 * Charge l'image originale en pleine résolution (sans transformation)
 * Supabase Storage ne supporte pas les transformations d'image par défaut,
 * donc on charge directement l'image originale qui est déjà en haute qualité
 * 
 * @param originalUrl - URL originale de l'image
 * @param force4K - Forcer le 4K même si l'image est plus petite (défaut: true)
 * @returns URL de l'image originale en pleine résolution
 */
export function get4KImageUrl(originalUrl: string, force4K: boolean = true): string {
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
    
    return url.toString();
  } catch {
    // Si l'URL n'est pas valide, retourner tel quel
    return originalUrl;
  }
}

/**
 * Génère un srcset pour différentes résolutions (responsive images)
 * Pour le mur, on charge toujours l'image originale en 4K
 * Le navigateur choisira automatiquement la meilleure résolution disponible
 * 
 * @param originalUrl - URL originale de l'image
 * @returns String srcset pour l'attribut srcset (vide car on charge toujours l'original)
 */
export function get4KImageSrcSet(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return '';
  }

  // Pour le mur, on charge toujours l'image originale en pleine résolution
  // Le navigateur gérera automatiquement l'affichage selon la taille de l'écran
  // On retourne une chaîne vide car on utilise directement l'URL 4K dans src
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

