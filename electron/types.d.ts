/**
 * Types pour les APIs Electron exposées via le preload script
 */

export interface ElectronAPI {
  /**
   * Obtient la version d'Electron
   */
  getVersion: () => string;
  
  /**
   * Obtient la plateforme (win32, darwin, linux)
   */
  getPlatform: () => NodeJS.Platform;
  
  /**
   * Obtient l'adresse IP locale du réseau (pour les QR codes)
   */
  getLocalIP: () => string | null;
  
  /**
   * Vérifie si on est dans Electron
   */
  isElectron: () => boolean;
  
  /**
   * Ferme l'application Electron
   */
  closeApp: () => Promise<void>;
}

declare global {
  interface Window {
    /**
     * API Electron exposée via le preload script
     */
    electronAPI?: ElectronAPI;
  }
}

