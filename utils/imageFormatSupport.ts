/**
 * ⚡ OPTIMISATION : Détection du support des formats d'images modernes
 * 
 * Détecte le support de WebP et AVIF pour servir les formats optimaux
 */

let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

// ⚡ OPTIMISATION : Cache des URLs qui ont échoué en AVIF pour éviter de réessayer
const failedAvifUrls = new Set<string>();

// ⚡ OPTIMISATION : Compteur d'échecs AVIF globaux - si trop d'échecs, désactiver AVIF complètement
let avifFailureCount = 0;
const MAX_AVIF_FAILURES = 5; // Après 5 échecs, désactiver AVIF pour toutes les images
let avifGloballyDisabled = false;

/**
 * ⚡ OPTIMISATION : Détecter le support WebP
 * @returns Promise résolue avec true si WebP est supporté
 */
export const detectWebPSupport = (): Promise<boolean> => {
  if (webpSupport !== null) {
    return Promise.resolve(webpSupport);
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupport = webP.height === 2;
      resolve(webpSupport);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * ⚡ OPTIMISATION : Détecter le support AVIF
 * @returns Promise résolue avec true si AVIF est supporté
 */
export const detectAVIFSupport = (): Promise<boolean> => {
  if (avifSupport !== null) {
    return Promise.resolve(avifSupport);
  }

  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      avifSupport = avif.height === 2;
      resolve(avifSupport);
    };
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * ⚡ OPTIMISATION : Détecter tous les formats supportés
 * @returns Promise résolue avec un objet indiquant les formats supportés
 */
export const detectImageFormatSupport = async (): Promise<{
  webp: boolean;
  avif: boolean;
}> => {
  const [webp, avif] = await Promise.all([
    detectWebPSupport(),
    detectAVIFSupport(),
  ]);

  return { webp, avif };
};

/**
 * ⚡ OPTIMISATION : Obtenir le meilleur format d'image supporté
 * @param originalUrl - URL de l'image originale
 * @param preferFormat - Format préféré ('avif' | 'webp' | 'original')
 * @returns URL optimisée avec le meilleur format
 */
export const getOptimalImageUrl = async (
  originalUrl: string,
  preferFormat: 'avif' | 'webp' | 'original' = 'original'
): Promise<string> => {
  // Si l'URL contient déjà un format spécifique, la retourner telle quelle
  if (originalUrl.match(/\.(avif|webp|jpg|jpeg|png)$/i)) {
    return originalUrl;
  }

  // ⚡ OPTIMISATION : Si AVIF est désactivé globalement ou cette URL a échoué, ne plus essayer
  if (avifGloballyDisabled || failedAvifUrls.has(originalUrl)) {
    preferFormat = preferFormat === 'avif' ? 'webp' : preferFormat;
  }

  // ⚡ OPTIMISATION : Détecter le support des formats
  const { avif, webp } = await detectImageFormatSupport();

  // ⚡ OPTIMISATION : Choisir le meilleur format selon le support (sauf si AVIF désactivé globalement)
  if (preferFormat === 'avif' && avif && !avifGloballyDisabled && !failedAvifUrls.has(originalUrl)) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  if (preferFormat === 'webp' && webp) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  if (avif && !avifGloballyDisabled && !failedAvifUrls.has(originalUrl)) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  if (webp) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // Fallback vers l'original
  return originalUrl;
};

/**
 * ⚡ OPTIMISATION : Marquer une URL comme ayant échoué en AVIF
 * @param url - URL qui a échoué
 */
export const markAvifFailed = (url: string): void => {
  // Extraire l'URL de base sans l'extension AVIF
  const baseUrl = url.replace(/\.avif(\?.*)?$/i, '');
  failedAvifUrls.add(baseUrl);
  
  // ⚡ OPTIMISATION : Incrémenter le compteur d'échecs globaux
  avifFailureCount++;
  
  // ⚡ OPTIMISATION : Si trop d'échecs, désactiver AVIF globalement
  if (avifFailureCount >= MAX_AVIF_FAILURES && !avifGloballyDisabled) {
    avifGloballyDisabled = true;
    console.warn('[Performance] AVIF désactivé globalement après', avifFailureCount, 'échecs');
  }
};

/**
 * ⚡ OPTIMISATION : Vérifier si AVIF est désactivé globalement
 * @returns true si AVIF est désactivé globalement
 */
export const isAvifGloballyDisabled = (): boolean => {
  return avifGloballyDisabled;
};

/**
 * ⚡ OPTIMISATION : Filtrer les URLs AVIF d'un srcSet existant
 * @param srcSet - srcSet string à filtrer
 * @returns srcSet sans URLs AVIF
 */
export const filterAvifFromSrcSet = (srcSet: string): string => {
  if (!srcSet || avifGloballyDisabled) {
    // Si AVIF est désactivé, retirer toutes les URLs AVIF du srcSet
    return srcSet
      .split(', ')
      .filter((part) => !part.includes('.avif'))
      .join(', ');
  }
  return srcSet;
};

/**
 * ⚡ OPTIMISATION : Générer un srcset avec formats multiples
 * @param baseUrl - URL de base de l'image
 * @param widths - Largeurs à générer (optionnel)
 * @returns srcset string avec formats optimisés
 */
export const generateOptimizedSrcSet = async (
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600, 2000]
): Promise<string> => {
  // ⚡ OPTIMISATION : Vérifier d'abord si AVIF est désactivé globalement (sans async pour éviter les appels inutiles)
  if (avifGloballyDisabled) {
    // Si AVIF est désactivé, générer seulement WebP et original
    const { webp } = await detectImageFormatSupport();
    const srcsetParts: string[] = [];

    if (webp) {
      widths.forEach((width) => {
        const url = baseUrl.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, `.webp?w=${width}`);
        srcsetParts.push(`${url} ${width}w`);
      });
    }

    // Fallback vers original
    widths.forEach((width) => {
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}w=${width}`;
      srcsetParts.push(`${url} ${width}w`);
    });

    return srcsetParts.join(', ');
  }

  const { avif, webp } = await detectImageFormatSupport();
  const srcsetParts: string[] = [];

  // ⚡ OPTIMISATION : Générer srcset pour chaque format supporté, en évitant AVIF si désactivé ou déjà échoué
  const baseUrlWithoutExt = baseUrl.replace(/\.(jpg|jpeg|png|avif|webp)(\?.*)?$/i, '');
  const shouldUseAvif = avif && !avifGloballyDisabled && !failedAvifUrls.has(baseUrlWithoutExt);

  if (shouldUseAvif) {
    widths.forEach((width) => {
      const url = baseUrl.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, `.avif?w=${width}`);
      srcsetParts.push(`${url} ${width}w`);
    });
  }

  if (webp) {
    widths.forEach((width) => {
      const url = baseUrl.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, `.webp?w=${width}`);
      srcsetParts.push(`${url} ${width}w`);
    });
  }

  // Fallback vers original
  widths.forEach((width) => {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}w=${width}`;
    srcsetParts.push(`${url} ${width}w`);
  });

  return srcsetParts.join(', ');
};

