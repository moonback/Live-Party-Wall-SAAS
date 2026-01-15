import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from './router';

// Configuration du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 secondes - les photos restent "fraîches" pendant 30s
      gcTime: 5 * 60 * 1000, // 5 minutes - garder en cache pendant 5 minutes (anciennement cacheTime)
      refetchOnWindowFocus: false, // Ne pas refetch automatiquement au focus
      retry: 1, // Retry une fois en cas d'erreur
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enregistrer le Service Worker pour le cache offline
if ('serviceWorker' in navigator) {
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
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // Temporairement désactivé StrictMode pour éviter les problèmes avec TanStack Router et React 19
  // TODO: Réactiver StrictMode une fois que TanStack Router sera complètement compatible avec React 19
  <QueryClientProvider client={queryClient}>
    <RouterProvider />
  </QueryClientProvider>
);