/**
 * Service de gestion de la conformité RGPD
 * Gère le consentement, les préférences cookies et les droits des utilisateurs
 */

export type CookieCategory = 'essential' | 'analytics' | 'marketing' | 'functional';

export interface CookiePreferences {
  essential: boolean; // Toujours true, ne peut pas être désactivé
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface ConsentData {
  consentGiven: boolean;
  consentDate: string; // ISO date string
  cookiePreferences: CookiePreferences;
  version: string; // Version de la politique de confidentialité
}

const CONSENT_STORAGE_KEY = 'rgpd_consent';
const CONSENT_VERSION = '1.0'; // Incrémenter lors de changements majeurs

/**
 * Cookies essentiels (toujours activés)
 */
const ESSENTIAL_COOKIES = [
  'party_user_name',
  'party_user_avatar',
  'party_user_event_id',
  'party_user_id',
  'rgpd_consent',
  'rgpd_preferences'
];

/**
 * Récupère les préférences de consentement depuis le localStorage
 */
export const getConsentData = (): ConsentData | null => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    const data: ConsentData = JSON.parse(stored);
    
    // Vérifier si la version est à jour
    if (data.version !== CONSENT_VERSION) {
      return null; // Demander un nouveau consentement
    }
    
    return data;
  } catch (error) {
    console.error('Error reading consent data:', error);
    return null;
  }
};

/**
 * Sauvegarde les préférences de consentement
 */
export const saveConsentData = (preferences: CookiePreferences): void => {
  const consentData: ConsentData = {
    consentGiven: true,
    consentDate: new Date().toISOString(),
    cookiePreferences: {
      ...preferences,
      essential: true // Toujours true
    },
    version: CONSENT_VERSION
  };
  
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
  } catch (error) {
    console.error('Error saving consent data:', error);
  }
};

/**
 * Vérifie si l'utilisateur a donné son consentement
 */
export const hasConsent = (): boolean => {
  const consent = getConsentData();
  return consent?.consentGiven === true;
};

/**
 * Vérifie si une catégorie de cookies est autorisée
 */
export const isCookieCategoryAllowed = (category: CookieCategory): boolean => {
  const consent = getConsentData();
  if (!consent) return false;
  
  if (category === 'essential') return true; // Toujours autorisé
  
  return consent.cookiePreferences[category] === true;
};

/**
 * Révoque le consentement et supprime les cookies non essentiels
 */
export const revokeConsent = (): void => {
  // Supprimer le consentement
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  
  // Supprimer tous les cookies non essentiels
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (!ESSENTIAL_COOKIES.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  // Supprimer les cookies du navigateur (si utilisés)
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (!ESSENTIAL_COOKIES.includes(name)) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
};

/**
 * Exporte toutes les données personnelles de l'utilisateur
 */
export const exportUserData = async (): Promise<{
  localStorage: Record<string, string>;
  cookies: Record<string, string>;
  timestamp: string;
}> => {
  // Exporter localStorage
  const localStorageData: Record<string, string> = {};
  Object.keys(localStorage).forEach(key => {
    localStorageData[key] = localStorage.getItem(key) || '';
  });
  
  // Exporter cookies
  const cookiesData: Record<string, string> = {};
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    if (eqPos > -1) {
      const name = cookie.substr(0, eqPos).trim();
      const value = cookie.substr(eqPos + 1).trim();
      cookiesData[name] = value;
    }
  });
  
  return {
    localStorage: localStorageData,
    cookies: cookiesData,
    timestamp: new Date().toISOString()
  };
};

/**
 * Supprime toutes les données personnelles de l'utilisateur
 */
export const deleteUserData = async (): Promise<void> => {
  // Supprimer tout le localStorage (sauf les préférences RGPD pour garder trace)
  const consentData = getConsentData();
  localStorage.clear();
  
  // Si on veut garder une trace du consentement révoqué
  if (consentData) {
    const revokedData: ConsentData = {
      ...consentData,
      consentGiven: false,
      consentDate: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(revokedData));
  }
  
  // Supprimer tous les cookies
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
};

/**
 * Vérifie si on doit afficher le banner de consentement
 */
export const shouldShowConsentBanner = (): boolean => {
  return !hasConsent();
};

/**
 * Obtient la description d'une catégorie de cookies
 */
export const getCookieCategoryDescription = (category: CookieCategory): string => {
  const descriptions: Record<CookieCategory, string> = {
    essential: 'Cookies nécessaires au fonctionnement de l\'application (authentification, préférences utilisateur). Ces cookies ne peuvent pas être désactivés.',
    analytics: 'Cookies permettant d\'analyser l\'utilisation de l\'application pour améliorer l\'expérience utilisateur.',
    marketing: 'Cookies utilisés pour la publicité et le marketing personnalisé.',
    functional: 'Cookies permettant d\'améliorer les fonctionnalités de l\'application (mémorisation des préférences, personnalisation).'
  };
  
  return descriptions[category];
};

/**
 * Obtient le nom d'affichage d'une catégorie de cookies
 */
export const getCookieCategoryName = (category: CookieCategory): string => {
  const names: Record<CookieCategory, string> = {
    essential: 'Cookies essentiels',
    analytics: 'Cookies analytiques',
    marketing: 'Cookies marketing',
    functional: 'Cookies fonctionnels'
  };
  
  return names[category];
};

