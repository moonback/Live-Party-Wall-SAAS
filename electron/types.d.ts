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
  
  /**
   * Ouvre une nouvelle fenêtre avec la même session que la fenêtre actuelle
   * @param url - URL à charger dans la nouvelle fenêtre
   * @returns ID de la fenêtre créée ou null en cas d'erreur
   */
  openWindow: (url: string) => Promise<number | null>;
}

declare global {
  interface Window {
    /**
     * API Electron exposée via le preload script
     */
    electronAPI?: ElectronAPI;
  }
}

