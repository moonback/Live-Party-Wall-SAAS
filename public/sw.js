/**
 * Service Worker pour Partywall
 * Gère le cache offline des images et ressources statiques
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `Partywall-${CACHE_VERSION}`;

// Ressources critiques à mettre en cache immédiatement
// Note: On utilise des chemins relatifs pour éviter les problèmes de base path
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
];

// Stratégie de cache : Cache First pour les images, Network First pour le reste
const CACHE_FIRST_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /\/party-photos\//,
  /\/party-frames\//,
  /\/party-avatars\//,
];

// Taille maximale du cache (50MB)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

/**
 * Installation du Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching critical resources');
        
        // Mettre en cache chaque ressource individuellement pour éviter que l'échec d'une ressource bloque tout
        const cachePromises = CRITICAL_RESOURCES.map(async (resource) => {
          try {
            const response = await fetch(resource);
            // Ne mettre en cache que les réponses réussies (200-299)
            if (response && response.status >= 200 && response.status < 300) {
              await cache.put(resource, response);
              console.log('[SW] Cached:', resource);
            } else {
              console.warn('[SW] Failed to cache (status ' + response.status + '):', resource);
            }
          } catch (error) {
            // Ne pas bloquer l'installation si une ressource ne peut pas être mise en cache
            console.warn('[SW] Failed to cache:', resource, error.message);
          }
        });
        
        // Attendre que toutes les tentatives de cache soient terminées
        await Promise.allSettled(cachePromises);
        
        // Forcer l'activation immédiate même si certaines ressources n'ont pas pu être mises en cache
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during installation:', error);
        // Même en cas d'erreur, on active le service worker pour ne pas bloquer l'application
        return self.skipWaiting();
      })
  );
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Prendre le contrôle de toutes les pages
        return self.clients.claim();
      })
  );
});

/**
 * Gestion des requêtes
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes de développement Vite (HMR, etc.)
  if (url.pathname.startsWith('/@') || url.pathname.includes('vite')) {
    return;
  }

  // Ignorer les requêtes vers des domaines externes (sauf images)
  if (url.origin !== location.origin && !isImageRequest(request)) {
    return;
  }

  // Stratégie Cache First pour les images
  if (isImageRequest(request) || isCachedResource(request)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Stratégie Network First pour le reste
    event.respondWith(networkFirst(request));
  }
});

/**
 * Vérifie si la requête est pour une image
 */
function isImageRequest(request) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(request.url));
}

/**
 * Vérifie si la ressource doit être mise en cache
 */
function isCachedResource(request) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(request.url));
}

/**
 * Stratégie Cache First : vérifie le cache d'abord, puis le réseau
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Vérifier si le cache est encore valide (optionnel : vérifier l'âge)
      return cachedResponse;
    }

    // Si pas en cache, récupérer depuis le réseau
    const networkResponse = await fetch(request);
    
    // Mettre en cache si la réponse est valide
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      
      // Vérifier la taille du cache avant d'ajouter
      await manageCacheSize(cache);
      
      // Cloner la réponse car elle ne peut être utilisée qu'une fois
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Error in cacheFirst:', error);
    // En cas d'erreur, retourner une réponse de fallback si disponible
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Sinon, retourner une réponse d'erreur
    return new Response('Network error', { status: 408 });
  }
}

/**
 * Stratégie Network First : essaie le réseau d'abord, puis le cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Si la requête réussit, mettre à jour le cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await manageCacheSize(cache);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    // Si le réseau échoue, essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Si pas de cache non plus, retourner une erreur
    return new Response('Network error and no cache available', { status: 408 });
  }
}

/**
 * Gère la taille du cache en supprimant les entrées les plus anciennes
 */
async function manageCacheSize(cache) {
  try {
    const keys = await cache.keys();
    
    // Calculer la taille totale du cache
    let totalSize = 0;
    const entries = [];
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        const size = blob.size;
        totalSize += size;
        entries.push({ key, size, response });
      }
    }
    
    // Si la taille dépasse la limite, supprimer les entrées les plus anciennes
    if (totalSize > MAX_CACHE_SIZE) {
      // Trier par taille (les plus grandes d'abord) et supprimer jusqu'à ce que la taille soit acceptable
      entries.sort((a, b) => b.size - a.size);
      
      let sizeToRemove = totalSize - MAX_CACHE_SIZE;
      for (const entry of entries) {
        if (sizeToRemove <= 0) break;
        await cache.delete(entry.key);
        sizeToRemove -= entry.size;
        console.log('[SW] Removed from cache:', entry.key);
      }
    }
  } catch (error) {
    console.error('[SW] Error managing cache size:', error);
  }
}

/**
 * Message handler pour communication avec l'application
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared');
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
});

