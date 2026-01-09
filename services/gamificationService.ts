import { Photo, AuthorStats, LeaderboardEntry, Badge, PhotoBadge, BadgeType } from '../types';

/**
 * Service de gamification pour calculer les badges et classements
 */

// Définition des badges
export const BADGES: Record<BadgeType, Badge> = {
  photographer: {
    type: 'photographer',
    label: 'Photographe de la soirée',
    emoji: '📸',
    description: 'A posté le plus de photos',
    color: 'from-yellow-500 to-orange-500'
  },
  star: {
    type: 'star',
    label: 'Star du mur',
    emoji: '⭐',
    description: 'Photo la plus likée',
    color: 'from-pink-500 to-purple-500'
  },
  challenge_winner: {
    type: 'challenge_winner',
    label: 'Gagnant de défi',
    emoji: '🏆',
    description: 'A gagné un challenge photo',
    color: 'from-yellow-400 to-orange-500'
  }
};

/**
 * Calcule les statistiques par auteur
 */
export const calculateAuthorStats = (photos: Photo[]): Map<string, AuthorStats> => {
  const statsMap = new Map<string, AuthorStats>();

  photos.forEach(photo => {
    const existing = statsMap.get(photo.author) || {
      author: photo.author,
      photoCount: 0,
      totalLikes: 0,
      averageLikes: 0,
      badges: []
    };

    existing.photoCount += 1;
    existing.totalLikes += photo.likes_count;
    statsMap.set(photo.author, existing);
  });

  // Calculer la moyenne de likes
  statsMap.forEach((stats, author) => {
    stats.averageLikes = stats.photoCount > 0 
      ? Math.round((stats.totalLikes / stats.photoCount) * 10) / 10 
      : 0;
  });

  return statsMap;
};

/**
 * Trouve l'auteur avec le plus de photos (Badge Photographe)
 */
export const getTopPhotographer = (photos: Photo[]): AuthorStats | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos);
  let topAuthor: AuthorStats | null = null;
  let maxPhotos = 0;

  statsMap.forEach((stats) => {
    if (stats.photoCount > maxPhotos) {
      maxPhotos = stats.photoCount;
      topAuthor = { ...stats, badges: [BADGES.photographer] };
    }
  });

  return topAuthor;
};

/**
 * Trouve la photo la plus likée (Badge Star)
 */
export const getStarPhoto = (photos: Photo[]): Photo | null => {
  if (photos.length === 0) return null;

  let starPhoto: Photo | null = null;
  let maxLikes = -1;

  photos.forEach(photo => {
    if (photo.likes_count > maxLikes) {
      maxLikes = photo.likes_count;
      starPhoto = photo;
    }
  });

  return starPhoto;
};

/**
 * Vérifie si une photo a le badge Star
 */
export const hasStarBadge = (photo: Photo, photos: Photo[]): boolean => {
  const starPhoto = getStarPhoto(photos);
  return starPhoto?.id === photo.id && photo.likes_count > 0;
};

/**
 * Vérifie si un auteur a le badge Photographe
 */
export const hasPhotographerBadge = (author: string, photos: Photo[]): boolean => {
  const topPhotographer = getTopPhotographer(photos);
  return topPhotographer?.author === author && topPhotographer.photoCount > 0;
};

/**
 * Récupère tous les badges d'un auteur
 */
export const getAuthorBadges = (author: string, photos: Photo[]): Badge[] => {
  const badges: Badge[] = [];
  
  if (hasPhotographerBadge(author, photos)) {
    badges.push(BADGES.photographer);
  }

  return badges;
};

/**
 * Récupère le badge d'une photo (si elle est la star)
 */
export const getPhotoBadge = (photo: Photo, photos: Photo[]): Badge | null => {
  if (hasStarBadge(photo, photos)) {
    return BADGES.star;
  }
  return null;
};

/**
 * Génère le classement des auteurs
 */
export const generateLeaderboard = (photos: Photo[]): LeaderboardEntry[] => {
  if (photos.length === 0) return [];

  const statsMap = calculateAuthorStats(photos);
  const topPhotographer = getTopPhotographer(photos);
  
  // Convertir en array et trier
  const entries: LeaderboardEntry[] = Array.from(statsMap.values())
    .map((stats, index) => ({
      rank: 0, // Sera calculé après le tri
      author: stats.author,
      photoCount: stats.photoCount,
      totalLikes: stats.totalLikes,
      badges: getAuthorBadges(stats.author, photos)
    }))
    .sort((a, b) => {
      // Trier par nombre de photos (desc), puis par likes totaux (desc)
      if (b.photoCount !== a.photoCount) {
        return b.photoCount - a.photoCount;
      }
      return b.totalLikes - a.totalLikes;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  return entries;
};

/**
 * Récupère les statistiques d'un auteur spécifique
 */
export const getAuthorStats = (author: string, photos: Photo[]): AuthorStats | null => {
  const statsMap = calculateAuthorStats(photos);
  const stats = statsMap.get(author);
  
  if (!stats) return null;

  return {
    ...stats,
    badges: getAuthorBadges(author, photos)
  };
};

/**
 * Vérifie si un auteur a gagné un challenge
 * @param author - Nom de l'auteur
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec true si l'auteur a gagné au moins un challenge
 */
export const hasChallengeWinnerBadge = async (
  author: string,
  eventId: string
): Promise<boolean> => {
  const { getFinishedChallenges } = await import('./challengeService');
  
  try {
    const finishedChallenges = await getFinishedChallenges(eventId, 100);
    
    // Vérifier si l'auteur a gagné au moins un challenge
    return finishedChallenges.some(challenge => {
      if (!challenge.winnerPhotoId || !challenge.submissions) return false;
      
      const winnerSubmission = challenge.submissions.find(
        s => s.photo.id === challenge.winnerPhotoId
      );
      
      return winnerSubmission?.submittedBy === author;
    });
  } catch (error) {
    console.error('Error checking challenge winner badge:', error);
    return false;
  }
};

/**
 * Récupère tous les badges d'un auteur (incluant les badges de challenges)
 * @param author - Nom de l'auteur
 * @param photos - Liste des photos
 * @param eventId - ID de l'événement (optionnel, pour vérifier les badges de challenges)
 * @returns Promise résolue avec la liste des badges
 */
export const getAllAuthorBadges = async (
  author: string,
  photos: Photo[],
  eventId?: string
): Promise<Badge[]> => {
  const badges: Badge[] = [];
  
  // Badges basés sur les photos
  if (hasPhotographerBadge(author, photos)) {
    badges.push(BADGES.photographer);
  }
  
  // Badge de gagnant de challenge (si eventId fourni)
  if (eventId) {
    const hasChallengeBadge = await hasChallengeWinnerBadge(author, eventId);
    if (hasChallengeBadge) {
      badges.push(BADGES.challenge_winner);
    }
  }
  
  return badges;
};

