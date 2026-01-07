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
 * Sauvegarde l'avatar d'un utilisateur
 * @param authorName - Nom de l'auteur
 * @param avatarUrl - URL de l'avatar (base64)
 */
export const saveUserAvatar = (authorName: string, avatarUrl: string): void => {
  // Sauvegarder l'avatar de l'utilisateur actuel
  const currentUserName = localStorage.getItem('party_user_name');
  if (currentUserName === authorName) {
    localStorage.setItem('party_user_avatar', avatarUrl);
  }
  
  // Sauvegarder dans le mapping global
  let avatarMap: Record<string, string> = {};
  const existingMap = localStorage.getItem('party_user_avatars');
  if (existingMap) {
    try {
      avatarMap = JSON.parse(existingMap);
    } catch (e) {
      console.error('Error parsing existing avatar map:', e);
    }
  }
  
  avatarMap[authorName] = avatarUrl;
  localStorage.setItem('party_user_avatars', JSON.stringify(avatarMap));
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
  // Note: On garde party_user_id et party_user_avatars pour ne pas perdre les likes/réactions
};

