/**
 * Service de stockage local des descripteurs faciaux
 * Utilise IndexedDB pour stocker les données faciales localement sur l'appareil
 * Fallback vers localStorage si IndexedDB n'est pas disponible
 */

import { logger } from '../utils/logger';

const DB_NAME = 'partywall_faces';
const DB_VERSION = 1;
const STORE_NAME = 'face_descriptors';

// Cache pour la connexion IndexedDB
let db: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Vérifie si IndexedDB est disponible
 */
const isIndexedDBAvailable = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

/**
 * Initialise la base de données IndexedDB
 */
const initDatabase = (): Promise<IDBDatabase> => {
  // Si déjà initialisée, retourner la connexion existante
  if (db) {
    return Promise.resolve(db);
  }

  // Si une initialisation est en cours, attendre qu'elle se termine
  if (dbInitPromise) {
    return dbInitPromise;
  }

  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB', request.error, { component: 'faceStorageService' });
      dbInitPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      logger.info('IndexedDB initialized successfully', { component: 'faceStorageService' });
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Créer le store s'il n'existe pas
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: ['userName', 'eventId']
        });

        // Créer un index pour rechercher par userName
        objectStore.createIndex('userName', 'userName', { unique: false });
        // Créer un index pour rechercher par eventId
        objectStore.createIndex('eventId', 'eventId', { unique: false });

        logger.info('IndexedDB store created', { component: 'faceStorageService' });
      }
    };
  });

  return dbInitPromise;
};

/**
 * Génère une clé pour localStorage (fallback)
 */
const getLocalStorageKey = (userName: string, eventId: string): string => {
  return `face_descriptor_${userName}_${eventId}`;
};

/**
 * Sauvegarde un descripteur facial dans IndexedDB (ou localStorage en fallback)
 * @param userName - Nom de l'utilisateur
 * @param eventId - ID de l'événement
 * @param descriptor - Descripteur facial (Float32Array)
 * @returns Promise résolue une fois sauvegardé
 */
export const saveFaceDescriptor = async (
  userName: string,
  eventId: string,
  descriptor: Float32Array
): Promise<void> => {
  // Sérialiser le descripteur (Float32Array → Array<number>)
  const serializedDescriptor = Array.from(descriptor);

  try {
    // Essayer IndexedDB d'abord
    const database = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        userName,
        eventId,
        descriptor: serializedDescriptor,
        savedAt: new Date().toISOString()
      };

      const request = store.put(data);

      request.onsuccess = () => {
        logger.info('Face descriptor saved to IndexedDB', {
          component: 'faceStorageService',
          userName,
          eventId
        });
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to save face descriptor to IndexedDB', request.error, {
          component: 'faceStorageService',
          userName,
          eventId
        });
        reject(request.error);
      };
    });
  } catch (error) {
    // Fallback vers localStorage
    logger.warn('IndexedDB unavailable, falling back to localStorage', {
      component: 'faceStorageService',
      error
    });

    try {
      const key = getLocalStorageKey(userName, eventId);
      const data = {
        descriptor: serializedDescriptor,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
      logger.info('Face descriptor saved to localStorage', {
        component: 'faceStorageService',
        userName,
        eventId
      });
    } catch (localStorageError) {
      logger.error('Failed to save face descriptor to localStorage', localStorageError, {
        component: 'faceStorageService',
        userName,
        eventId
      });
      throw new Error('Impossible de sauvegarder le descripteur facial');
    }
  }
};

/**
 * Récupère un descripteur facial depuis IndexedDB (ou localStorage en fallback)
 * @param userName - Nom de l'utilisateur
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec le descripteur (Float32Array) ou null si non trouvé
 */
export const getFaceDescriptor = async (
  userName: string,
  eventId: string
): Promise<Float32Array | null> => {
  try {
    // Essayer IndexedDB d'abord
    const database = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get([userName, eventId]);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.descriptor) {
          // Désérialiser le descripteur (Array<number> → Float32Array)
          const descriptor = new Float32Array(result.descriptor);
          logger.info('Face descriptor retrieved from IndexedDB', {
            component: 'faceStorageService',
            userName,
            eventId
          });
          resolve(descriptor);
        } else {
          logger.info('Face descriptor not found in IndexedDB', {
            component: 'faceStorageService',
            userName,
            eventId
          });
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error('Failed to retrieve face descriptor from IndexedDB', request.error, {
          component: 'faceStorageService',
          userName,
          eventId
        });
        reject(request.error);
      };
    });
  } catch (error) {
    // Fallback vers localStorage
    logger.warn('IndexedDB unavailable, falling back to localStorage', {
      component: 'faceStorageService',
      error
    });

    try {
      const key = getLocalStorageKey(userName, eventId);
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const data = JSON.parse(stored);
        if (data.descriptor) {
          // Désérialiser le descripteur (Array<number> → Float32Array)
          const descriptor = new Float32Array(data.descriptor);
          logger.info('Face descriptor retrieved from localStorage', {
            component: 'faceStorageService',
            userName,
            eventId
          });
          return descriptor;
        }
      }
      
      logger.info('Face descriptor not found in localStorage', {
        component: 'faceStorageService',
        userName,
        eventId
      });
      return null;
    } catch (localStorageError) {
      logger.error('Failed to retrieve face descriptor from localStorage', localStorageError, {
        component: 'faceStorageService',
        userName,
        eventId
      });
      return null;
    }
  }
};

/**
 * Supprime un descripteur facial depuis IndexedDB (ou localStorage en fallback)
 * @param userName - Nom de l'utilisateur
 * @param eventId - ID de l'événement
 * @returns Promise résolue une fois supprimé
 */
export const deleteFaceDescriptor = async (
  userName: string,
  eventId: string
): Promise<void> => {
  try {
    // Essayer IndexedDB d'abord
    const database = await initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete([userName, eventId]);

      request.onsuccess = () => {
        logger.info('Face descriptor deleted from IndexedDB', {
          component: 'faceStorageService',
          userName,
          eventId
        });
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to delete face descriptor from IndexedDB', request.error, {
          component: 'faceStorageService',
          userName,
          eventId
        });
        reject(request.error);
      };
    });
  } catch (error) {
    // Fallback vers localStorage
    logger.warn('IndexedDB unavailable, falling back to localStorage', {
      component: 'faceStorageService',
      error
    });

    try {
      const key = getLocalStorageKey(userName, eventId);
      localStorage.removeItem(key);
      logger.info('Face descriptor deleted from localStorage', {
        component: 'faceStorageService',
        userName,
        eventId
      });
    } catch (localStorageError) {
      logger.error('Failed to delete face descriptor from localStorage', localStorageError, {
        component: 'faceStorageService',
        userName,
        eventId
      });
      // Ne pas rejeter, la suppression est idempotente
    }
  }
};

/**
 * Vérifie si un descripteur existe pour un utilisateur et un événement
 * @param userName - Nom de l'utilisateur
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec true si le descripteur existe
 */
export const hasFaceDescriptor = async (
  userName: string,
  eventId: string
): Promise<boolean> => {
  const descriptor = await getFaceDescriptor(userName, eventId);
  return descriptor !== null;
};

