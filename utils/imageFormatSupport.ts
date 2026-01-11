/**
 * ⚡ OPTIMISATION : Détection du support des formats d'images modernes
 * 
 * Détecte le support de WebP et AVIF pour servir les formats optimaux
 */

let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

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

  // ⚡ OPTIMISATION : Détecter le support des formats
  const { avif, webp } = await detectImageFormatSupport();

  // ⚡ OPTIMISATION : Choisir le meilleur format selon le support
  if (preferFormat === 'avif' && avif) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  if (preferFormat === 'webp' && webp) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  if (avif) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  if (webp) {
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // Fallback vers l'original
  return originalUrl;
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
  const { avif, webp } = await detectImageFormatSupport();
  const srcsetParts: string[] = [];

  // ⚡ OPTIMISATION : Générer srcset pour chaque format supporté
  if (avif) {
    widths.forEach((width) => {
      const url = baseUrl.replace(/\.(jpg|jpeg|png)$/i, `.avif?w=${width}`);
      srcsetParts.push(`${url} ${width}w`);
    });
  }

  if (webp) {
    widths.forEach((width) => {
      const url = baseUrl.replace(/\.(jpg|jpeg|png)$/i, `.webp?w=${width}`);
      srcsetParts.push(`${url} ${width}w`);
    });
  }

  // Fallback vers original
  widths.forEach((width) => {
    const url = `${baseUrl}?w=${width}`;
    srcsetParts.push(`${url} ${width}w`);
  });

  return srcsetParts.join(', ');
};

