/**
 * ⚡ OPTIMISATION : Service Worker pour cache des images
 * 
 * Stratégie de cache :
 * - Cache-First pour les images (performance maximale)
 * - Network-First pour les API calls (données à jour)
 * - Stale-While-Revalidate pour les assets statiques
 */

const CACHE_NAME = 'live-party-wall-v1';
const IMAGE_CACHE_NAME = 'live-party-wall-images-v1';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max pour images
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ⚡ OPTIMISATION : Installer le Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened');
      return cache.addAll([
        '/',
        '/index.html',
        // ⚡ OPTIMISATION : Ne pas pré-cacher les images (trop volumineux)
        // Elles seront mises en cache à la demande
      ]);
    })
  );
  self.skipWaiting(); // Activer immédiatement
});

// ⚡ OPTIMISATION : Activer le Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Prendre contrôle immédiatement
});

// ⚡ OPTIMISATION : Nettoyer le cache images si trop volumineux
const cleanImageCache = async () => {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const keys = await cache.keys();
  
  if (keys.length === 0) return;
  
  // Calculer la taille totale du cache
  let totalSize = 0;
  const entries = [];
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      const size = blob.size;
      const date = parseInt(response.headers.get('sw-cache-date') || '0', 10);
      totalSize += size;
      entries.push({ key, size, date });
    }
  }
  
  // Si le cache dépasse la taille max, supprimer les plus anciens
  if (totalSize > MAX_CACHE_SIZE) {
    // Trier par date (plus ancien en premier)
    entries.sort((a, b) => a.date - b.date);
    
    // Supprimer jusqu'à ce que la taille soit acceptable
    let currentSize = totalSize;
    for (const entry of entries) {
      if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Garder 80% du max
      await cache.delete(entry.key);
      currentSize -= entry.size;
    }
    
    console.log('[SW] Cleaned image cache, new size:', currentSize);
  }
};

// ⚡ OPTIMISATION : Intercepter les requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ⚡ OPTIMISATION : Cache-First pour les images
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // ⚡ OPTIMISATION : Network-First pour les API calls
  if (isApiRequest(event.request)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // ⚡ OPTIMISATION : Stale-While-Revalidate pour les assets statiques
  if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }
  
  // ⚡ OPTIMISATION : Network-First par défaut
  event.respondWith(fetch(event.request));
});

// ⚡ OPTIMISATION : Détecter si c'est une requête image
const isImageRequest = (request: Request): boolean => {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) !== null ||
    url.searchParams.has('image') ||
    request.headers.get('accept')?.includes('image')
  );
};

// ⚡ OPTIMISATION : Détecter si c'est une requête API
const isApiRequest = (request: Request): boolean => {
  const url = new URL(request.url);
  return (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('rest/v1/')
  );
};

// ⚡ OPTIMISATION : Détecter si c'est un asset statique
const isStaticAsset = (request: Request): boolean => {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i) !== null ||
    url.pathname.startsWith('/assets/')
  );
};

// ⚡ OPTIMISATION : Gérer les requêtes images (Cache-First)
const handleImageRequest = async (request: Request): Promise<Response> => {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Si en cache et pas trop vieux, retourner le cache
  if (cachedResponse) {
    const cacheDate = parseInt(
      cachedResponse.headers.get('sw-cache-date') || '0',
      10
    );
    const age = Date.now() - cacheDate;
    
    if (age < MAX_CACHE_AGE) {
      // ⚡ OPTIMISATION : Retourner le cache et mettre à jour en arrière-plan
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            clonedResponse.headers.set('sw-cache-date', Date.now().toString());
            cache.put(request, clonedResponse);
          }
        })
        .catch(() => {
          // Ignorer les erreurs de mise à jour
        });
      
      return cachedResponse;
    }
  }
  
  // Sinon, récupérer du réseau et mettre en cache
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const clonedResponse = response.clone();
      clonedResponse.headers.set('sw-cache-date', Date.now().toString());
      await cache.put(request, clonedResponse);
      
      // ⚡ OPTIMISATION : Nettoyer le cache si nécessaire
      cleanImageCache().catch(() => {
        // Ignorer les erreurs de nettoyage
      });
    }
    
    return response;
  } catch (error) {
    // Si erreur réseau et cache disponible, retourner le cache même s'il est vieux
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// ⚡ OPTIMISATION : Gérer les requêtes API (Network-First)
const handleApiRequest = async (request: Request): Promise<Response> => {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // En cas d'erreur, essayer le cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// ⚡ OPTIMISATION : Gérer les assets statiques (Stale-While-Revalidate)
const handleStaticAsset = async (request: Request): Promise<Response> => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Retourner le cache immédiatement
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cachedResponse || fetchPromise;
};
