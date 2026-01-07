/**
 * Utilitaires pour la gestion des URLs, notamment pour Electron
 */

/**
 * URL de production pour les QR codes
 * Tous les QR codes pointent vers cette URL pour permettre l'accès depuis n'importe quel appareil
 */
const PRODUCTION_URL = 'https://live-party-wall-saas.vercel.app';

/**
 * Détecte si l'application s'exécute dans Electron
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI?.isElectron?.() === true;
};

/**
 * Obtient l'URL de base pour les QR codes
 * Toujours utilise l'URL de production Vercel pour permettre l'accès depuis n'importe quel appareil
 */
export const getBaseUrl = (): string => {
  // Toujours utiliser l'URL de production pour les QR codes
  // Cela permet aux utilisateurs de scanner le QR code depuis n'importe quel appareil
  return PRODUCTION_URL;
};

/**
 * Génère une URL avec des paramètres de requête
 */
export const buildUrl = (path: string, params?: Record<string, string>): string => {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
};

