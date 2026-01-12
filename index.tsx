import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Enregistrer le Service Worker pour le cache offline
// Désactiver en développement pour éviter les conflits avec Vite HMR
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Vérifier les mises à jour du Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouveau Service Worker disponible, demander à l'utilisateur de recharger
                console.log('[SW] New Service Worker available');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // En développement, désinscrire tous les service workers existants immédiatement
  // et nettoyer les caches
  (async () => {
    try {
      // Désinscrire tous les service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW] Service Worker unregistered in development mode');
      }
      
      // Nettoyer tous les caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
          console.log('[SW] Cache deleted:', name);
        }
      }
    } catch (error) {
      console.warn('[SW] Error cleaning up service workers:', error);
    }
  })();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);