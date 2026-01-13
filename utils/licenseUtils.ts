/**
 * Utilitaires pour la gestion des licences
 * Contrôle l'accès aux fonctionnalités premium basé sur les 4 derniers caractères de la licence
 */

/**
 * Liste des fonctionnalités premium qui nécessitent une licence PROS
 */
export const PREMIUM_FEATURES = [
  'caption_generation_enabled',
  'tags_generation_enabled',
  'video_capture_enabled',
  'find_me_enabled',
  'aftermovies_enabled'
] as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[number];

/**
 * Extrait les 4 derniers caractères de la clé de licence
 * @param licenseKey - Clé de licence complète
 * @returns Les 4 derniers caractères en majuscules, ou chaîne vide si la clé est invalide
 */
export const getLicenseSuffix = (licenseKey: string | null | undefined): string => {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return '';
  }
  
  const trimmed = licenseKey.trim().toUpperCase();
  if (trimmed.length < 4) {
    return '';
  }
  
  return trimmed.slice(-4);
};

/**
 * Vérifie si la licence est de type PROS (toutes les fonctionnalités activées)
 * @param licenseKey - Clé de licence complète
 * @returns true si la licence se termine par "PROS"
 */
export const isProLicense = (licenseKey: string | null | undefined): boolean => {
  const suffix = getLicenseSuffix(licenseKey);
  return suffix === 'PROS';
};

/**
 * Vérifie si la licence est de type PART (fonctionnalités premium désactivées)
 * @param licenseKey - Clé de licence complète
 * @returns true si la licence se termine par "PART"
 */
export const isPartLicense = (licenseKey: string | null | undefined): boolean => {
  const suffix = getLicenseSuffix(licenseKey);
  return suffix === 'PART';
};

/**
 * Vérifie si une fonctionnalité est disponible selon le type de licence
 * @param featureKey - Clé de la fonctionnalité à vérifier
 * @param licenseKey - Clé de licence complète
 * @returns true si la fonctionnalité est disponible, false sinon
 */
export const isFeatureEnabled = (
  featureKey: string,
  licenseKey: string | null | undefined
): boolean => {
  // Si ce n'est pas une fonctionnalité premium, elle est toujours disponible
  if (!PREMIUM_FEATURES.includes(featureKey as PremiumFeature)) {
    return true;
  }
  
  // Si pas de licence, considérer comme PART (fonctionnalités désactivées)
  if (!licenseKey) {
    return false;
  }
  
  // Si licence PROS, toutes les fonctionnalités sont disponibles
  if (isProLicense(licenseKey)) {
    return true;
  }
  
  // Si licence PART, les fonctionnalités premium sont désactivées
  if (isPartLicense(licenseKey)) {
    return false;
  }
  
  // Pour toute autre licence (non PART/PROS), considérer comme disponible par défaut
  // Cela permet la rétrocompatibilité avec les licences existantes
  return true;
};

