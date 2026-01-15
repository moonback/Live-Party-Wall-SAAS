/**
 * Utilitaires pour gérer les avatars des utilisateurs
 */

/**
 * Récupère l'avatar d'un utilisateur depuis localStorage
 * @param authorName - Nom de l'auteur
 * @returns URL de l'avatar (base64) ou null si non trouvé
 */
export const getUserAvatar = (authorName: string): string | null => {
  // Pour l'instant, on stocke l'avatar de l'utilisateur actuel
  // Dans le futur, on pourrait stocker un mapping nom -> avatar
  const currentUserName = localStorage.getItem('party_user_name');
  
  if (currentUserName === authorName) {
    return localStorage.getItem('party_user_avatar');
  }
  
  // Si ce n'est pas l'utilisateur actuel, on pourrait chercher dans un mapping
  // Pour l'instant, on retourne null (affichera l'initiale)
  const avatarMap = localStorage.getItem('party_user_avatars');
  if (avatarMap) {
    try {
      const map = JSON.parse(avatarMap);
      return map[authorName] || null;
    } catch (e) {
      console.error('Error parsing avatar map:', e);
    }
  }
  
  return null;
};

/**
 * Limite maximale d'avatars à stocker dans localStorage
 */
const MAX_AVATARS = 50;

/**
 * Taille maximale approximative pour le stockage des avatars (en bytes)
 * localStorage a généralement une limite de 5-10MB, on limite à 2MB pour être sûr
 */
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Compresse une image base64 en réduisant sa qualité
 */
const compressAvatar = (dataUrl: string, maxSize: number = 100 * 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Réduire la taille si nécessaire (max 200x200 pour les avatars)
      const maxDimension = 200;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback si canvas non disponible
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Essayer différentes qualités jusqu'à obtenir la taille souhaitée
      let quality = 0.8;
      let compressed = canvas.toDataURL('image/jpeg', quality);
      
      // Si toujours trop gros, réduire la qualité progressivement
      while (compressed.length > maxSize && quality > 0.3) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl); // Fallback en cas d'erreur
    img.src = dataUrl;
  });
};

/**
 * Nettoie les anciens avatars pour libérer de l'espace
 */
const cleanupOldAvatars = (avatarMap: Record<string, string>): Record<string, string> => {
  const entries = Object.entries(avatarMap);
  
  // Si on dépasse le nombre max, garder seulement les plus récents
  if (entries.length > MAX_AVATARS) {
    // Trier par ordre (on garde les derniers)
    const sorted = entries.slice(-MAX_AVATARS);
    return Object.fromEntries(sorted);
  }
  
  // Vérifier la taille totale
  const totalSize = JSON.stringify(avatarMap).length;
  if (totalSize > MAX_STORAGE_SIZE) {
    // Supprimer les avatars les plus anciens jusqu'à ce que la taille soit acceptable
    const sorted = entries.slice(-MAX_AVATARS);
    let cleaned = Object.fromEntries(sorted);
    let cleanedSize = JSON.stringify(cleaned).length;
    
    // Si toujours trop gros, réduire encore
    while (cleanedSize > MAX_STORAGE_SIZE && sorted.length > 10) {
      sorted.shift();
      cleaned = Object.fromEntries(sorted);
      cleanedSize = JSON.stringify(cleaned).length;
    }
    
    return cleaned;
  }
  
  return avatarMap;
};

/**
 * Sauvegarde l'avatar d'un utilisateur
 * Limite le nombre d'avatars et compresse pour éviter de dépasser le quota localStorage
 * @param authorName - Nom de l'auteur
 * @param avatarUrl - URL de l'avatar (base64)
 */
export const saveUserAvatar = async (authorName: string, avatarUrl: string): Promise<void> => {
  try {
    // Compresser l'avatar avant de le sauvegarder
    const compressedAvatar = await compressAvatar(avatarUrl);
    
    // Sauvegarder l'avatar de l'utilisateur actuel
    const currentUserName = localStorage.getItem('party_user_name');
    if (currentUserName === authorName) {
      try {
        localStorage.setItem('party_user_avatar', compressedAvatar);
      } catch (e) {
        console.warn('Failed to save current user avatar, quota may be exceeded');
      }
    }
    
    // Sauvegarder dans le mapping global
    let avatarMap: Record<string, string> = {};
    const existingMap = localStorage.getItem('party_user_avatars');
    if (existingMap) {
      try {
        avatarMap = JSON.parse(existingMap);
      } catch (e) {
        console.error('Error parsing existing avatar map:', e);
        // Si le parsing échoue, réinitialiser
        avatarMap = {};
      }
    }
    
    // Ajouter le nouvel avatar
    avatarMap[authorName] = compressedAvatar;
    
    // Nettoyer les anciens avatars
    avatarMap = cleanupOldAvatars(avatarMap);
    
    // Sauvegarder le mapping nettoyé
    try {
      localStorage.setItem('party_user_avatars', JSON.stringify(avatarMap));
    } catch (e) {
      // Si le quota est toujours dépassé, supprimer les avatars les plus anciens
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Quota exceeded, cleaning up more avatars');
        // Garder seulement les 20 plus récents
        const entries = Object.entries(avatarMap);
        const recent = entries.slice(-20);
        avatarMap = Object.fromEntries(recent);
        
        try {
          localStorage.setItem('party_user_avatars', JSON.stringify(avatarMap));
        } catch (e2) {
          console.error('Failed to save avatars even after cleanup', e2);
          // Dernier recours : supprimer complètement
          localStorage.removeItem('party_user_avatars');
        }
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('Error saving user avatar:', error);
    // Ne pas bloquer l'application si la sauvegarde échoue
  }
};

/**
 * Récupère l'avatar de l'utilisateur actuel
 */
export const getCurrentUserAvatar = (): string | null => {
  return localStorage.getItem('party_user_avatar');
};

/**
 * Récupère le nom de l'utilisateur actuel
 */
export const getCurrentUserName = (): string | null => {
  return localStorage.getItem('party_user_name');
};

/**
 * Déconnecte l'utilisateur en supprimant toutes ses données du localStorage
 */
export const disconnectUser = (): void => {
  localStorage.removeItem('party_user_name');
  localStorage.removeItem('party_user_avatar');
  localStorage.removeItem('party_user_event_id');
  // Note: On garde party_user_id et party_user_avatars pour ne pas perdre les likes/réactions
};

