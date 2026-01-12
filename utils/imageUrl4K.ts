/**
 * Utilitaires pour optimiser le chargement d'images pour le mur
 * Optimisé pour réduire la consommation de ressources
 */

// Résolution 4K standard
export const RESOLUTION_4K = {
  width: 3840,
  height: 2160
};

// Résolution optimisée pour le mur (réduit la consommation mémoire)
export const RESOLUTION_OPTIMIZED = {
  width: 1920,
  height: 1080
};

/**
 * Génère une URL d'image optimisée
 * Charge l'image avec une résolution adaptée à la taille d'affichage réelle
 * 
 * @param originalUrl - URL originale de l'image
 * @param maxWidth - Largeur maximale souhaitée (défaut: 1920px pour optimiser les performances)
 * @returns URL de l'image optimisée
 */
export function get4KImageUrl(originalUrl: string, maxWidth: number = RESOLUTION_OPTIMIZED.width): string {
  if (!originalUrl) return originalUrl;

  // Si l'URL est déjà une data URL (base64), retourner tel quel
  if (originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // Pour Supabase Storage, on peut utiliser les transformations d'image si disponibles
  // Sinon, on charge l'image originale mais on limite la résolution côté client
  try {
    const url = new URL(originalUrl);
    
    // Si maxWidth est spécifié et inférieur à 4K, on peut essayer d'ajouter un paramètre de transformation
    // Note: Supabase Storage peut supporter width/height selon la configuration
    if (maxWidth < RESOLUTION_4K.width) {
      // Essayer d'utiliser les transformations Supabase si disponibles
      // Sinon, le navigateur redimensionnera l'image
      url.searchParams.set('width', maxWidth.toString());
      url.searchParams.set('quality', '85'); // Qualité réduite pour optimiser la taille
    } else {
      // Pour 4K, retirer les paramètres pour charger l'original
      url.searchParams.delete('width');
      url.searchParams.delete('height');
      url.searchParams.delete('quality');
      url.searchParams.delete('resize');
      url.searchParams.delete('transform');
    }
    
    return url.toString();
  } catch {
    // Si l'URL n'est pas valide, retourner tel quel
    return originalUrl;
  }
}

/**
 * Génère un srcset pour différentes résolutions (responsive images)
 * Optimisé pour charger des images adaptées à la taille d'affichage
 * 
 * @param originalUrl - URL originale de l'image
 * @param maxWidth - Largeur maximale (défaut: 1920px)
 * @returns String srcset pour l'attribut srcset
 */
export function get4KImageSrcSet(originalUrl: string, maxWidth: number = RESOLUTION_OPTIMIZED.width): string {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return '';
  }

  // Pour optimiser les performances, on retourne une chaîne vide
  // Le navigateur utilisera directement l'URL optimisée dans src
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

