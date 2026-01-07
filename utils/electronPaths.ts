/**
 * Utilitaires pour gérer les chemins de fichiers dans Electron
 * Permet de servir les fichiers statiques depuis public/ via un protocole personnalisé
 */

/**
 * Vérifie si l'application s'exécute dans Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Convertit un chemin relatif (ex: /models/face-api) en URL accessible dans Electron
 * En Electron, utilise le protocole personnalisé 'app://'
 * Sinon, retourne le chemin tel quel (pour le web)
 */
export function getStaticAssetPath(relativePath: string): string {
  // Supprimer le slash initial si présent
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  if (isElectron()) {
    // En Electron, utiliser le protocole personnalisé
    return `app://${cleanPath}`;
  }
  
  // En web, utiliser le chemin relatif normal
  return `/${cleanPath}`;
}

/**
 * Obtient le chemin vers les modèles face-api.js
 */
export function getFaceModelsPath(): string {
  return getStaticAssetPath('models/face-api');
}

/**
 * Obtient le chemin vers un cadre décoratif
 */
export function getFramePath(filename: string): string {
  return getStaticAssetPath(`cadres/${filename}`);
}

/**
 * Obtient le chemin vers le manifest des cadres
 */
export function getFramesManifestPath(): string {
  return getStaticAssetPath('cadres/frames-manifest.json');
}

