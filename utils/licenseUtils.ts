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

/**
 * Limites du nombre d'événements selon le type de licence
 */
export const MAX_EVENTS_PART = 1;
export const MAX_EVENTS_PROS = 20;
export const MAX_EVENTS_DEMO = 1;

/**
 * Limites du nombre de photos selon le type de licence
 */
export const MAX_PHOTOS_DEMO = 50;

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
 * Vérifie si la licence est de type DEMO (licence de démonstration avec limitations)
 * @param licenseKey - Clé de licence complète
 * @returns true si la licence se termine par "DEMO"
 */
export const isDemoLicense = (licenseKey: string | null | undefined): boolean => {
  const suffix = getLicenseSuffix(licenseKey);
  return suffix === 'DEMO';
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
  
  // Si licence DEMO, les fonctionnalités premium sont désactivées (comme PART)
  if (isDemoLicense(licenseKey)) {
    return false;
  }
  
  // Pour toute autre licence (non PART/PROS/DEMO), considérer comme disponible par défaut
  // Cela permet la rétrocompatibilité avec les licences existantes
  return true;
};

/**
 * Retourne le nombre maximum d'événements autorisés selon le type de licence
 * @param licenseKey - Clé de licence complète
 * @returns Nombre maximum d'événements autorisés
 */
export const getMaxEvents = (licenseKey: string | null | undefined): number => {
  if (isProLicense(licenseKey)) {
    return MAX_EVENTS_PROS;
  }
  
  if (isDemoLicense(licenseKey)) {
    return MAX_EVENTS_DEMO;
  }
  
  // Si PART ou pas de licence, limite à 1 événement
  return MAX_EVENTS_PART;
};

/**
 * Retourne les informations sur la limite d'événements
 * @param licenseKey - Clé de licence complète
 * @returns Objet avec la limite max et le type de licence
 */
export const getEventLimitInfo = (
  licenseKey: string | null | undefined
): { max: number; type: 'PART' | 'PROS' | 'DEMO' | 'UNLIMITED' } => {
  if (isProLicense(licenseKey)) {
    return { max: MAX_EVENTS_PROS, type: 'PROS' };
  }
  
  if (isPartLicense(licenseKey)) {
    return { max: MAX_EVENTS_PART, type: 'PART' };
  }
  
  if (isDemoLicense(licenseKey)) {
    return { max: MAX_EVENTS_DEMO, type: 'DEMO' };
  }
  
  // Pour les licences non reconnues, considérer comme PART par défaut
  return { max: MAX_EVENTS_PART, type: 'PART' };
};

/**
 * Retourne le nombre maximum de photos autorisées selon le type de licence
 * @param licenseKey - Clé de licence complète
 * @returns Nombre maximum de photos autorisées, ou null si illimité
 */
export const getMaxPhotos = (licenseKey: string | null | undefined): number | null => {
  if (isDemoLicense(licenseKey)) {
    return MAX_PHOTOS_DEMO;
  }
  
  // Pour les autres types de licences (PART, PROS), pas de limite
  return null;
};

