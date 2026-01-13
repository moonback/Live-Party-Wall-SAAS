import { contextBridge, ipcRenderer } from 'electron';
import { networkInterfaces } from 'os';

/**
 * Script preload pour exposer des APIs sécurisées au renderer process
 * 
 * Ce script s'exécute dans un contexte isolé avec accès à Node.js,
 * mais avant que le code de la page ne soit chargé.
 * Il permet de créer un pont sécurisé entre le main process et le renderer.
 */

/**
 * Obtient l'adresse IP locale du réseau
 * Retourne la première adresse IPv4 non-localhost trouvée
 */
function getLocalIP(): string | null {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (!nets) continue;
    
    for (const net of nets) {
      // Ignorer les adresses non-IPv4 et localhost
      // family peut être 'IPv4' (string) ou 4 (number) selon la version de Node.js
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) {
        return net.address;
      }
    }
  }
  
  return null;
}

// Exemple d'API exposée (à adapter selon les besoins)
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemple : obtenir la version de l'application
  getVersion: () => {
    return process.versions.electron;
  },
  
  // Exemple : obtenir la plateforme
  getPlatform: () => {
    return process.platform;
  },
  
  // Obtenir l'adresse IP locale pour les QR codes
  getLocalIP: () => {
    return getLocalIP();
  },
  
  // Vérifier si on est dans Electron
  isElectron: () => {
    return true;
  },
  
  // Fermer l'application
  closeApp: () => {
    return ipcRenderer.invoke('app:close');
  },

  // Ouvrir une nouvelle fenêtre avec la même session
  openWindow: (url: string) => {
    return ipcRenderer.invoke('app:openWindow', url);
  },
});

// Types pour TypeScript (sera utilisé dans l'application React)
export type ElectronAPI = {
  getVersion: () => string;
  getPlatform: () => NodeJS.Platform;
  getLocalIP: () => string | null;
  isElectron: () => boolean;
  closeApp: () => Promise<void>;
  openWindow: (url: string) => Promise<number | null>;
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

