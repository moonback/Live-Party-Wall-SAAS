import { Photo, AuthorStats, LeaderboardEntry, Badge, PhotoBadge, BadgeType, ReactionCounts } from '../types';

/**
 * Helper pour obtenir les réactions d'une photo depuis différentes sources
 */
const getPhotoReactions = (photo: Photo, reactionsMap?: Map<string, ReactionCounts>): ReactionCounts | undefined => {
  // Priorité: reactionsMap > photo.reactions
  if (reactionsMap?.has(photo.id)) {
    return reactionsMap.get(photo.id);
  }
  return photo.reactions;
};

/**
 * Service de gamification pour calculer les badges et classements
 * Version améliorée avec système de points et badges variés
 */

// Définition complète des badges
export const BADGES: Record<BadgeType, Badge> = {
  photographer: {
    type: 'photographer',
    label: 'Photographe de la soirée',
    emoji: '📸',
    description: 'A posté le plus de photos',
    color: 'from-yellow-500 to-orange-500',
    rarity: 'epic'
  },
  star: {
    type: 'star',
    label: 'Star du mur',
    emoji: '⭐',
    description: 'Photo la plus likée',
    color: 'from-pink-500 to-purple-500',
    rarity: 'legendary'
  },
  early_bird: {
    type: 'early_bird',
    label: 'Oiseau matinal',
    emoji: '🐦',
    description: 'A posté la première photo',
    color: 'from-blue-400 to-cyan-500',
    rarity: 'rare'
  },
  popular: {
    type: 'popular',
    label: 'Populaire',
    emoji: '🔥',
    description: 'A reçu le plus de likes au total',
    color: 'from-red-500 to-orange-500',
    rarity: 'epic'
  },
  consistent: {
    type: 'consistent',
    label: 'Régulier',
    emoji: '📅',
    description: 'A posté régulièrement tout au long de l\'événement',
    color: 'from-green-500 to-emerald-500',
    rarity: 'rare'
  },
  quality: {
    type: 'quality',
    label: 'Qualité',
    emoji: '💎',
    description: 'Meilleure moyenne de likes par photo',
    color: 'from-purple-500 to-indigo-500',
    rarity: 'epic'
  },
  social_butterfly: {
    type: 'social_butterfly',
    label: 'Papillon social',
    emoji: '🦋',
    description: 'A reçu le plus de réactions variées',
    color: 'from-pink-400 to-rose-500',
    rarity: 'rare'
  },
  trending: {
    type: 'trending',
    label: 'Tendance',
    emoji: '📈',
    description: 'Photo en forte hausse de popularité',
    color: 'from-green-400 to-teal-500',
    rarity: 'common'
  },
  viral: {
    type: 'viral',
    label: 'Viral',
    emoji: '🚀',
    description: 'Photo avec énormément de réactions',
    color: 'from-orange-500 to-red-500',
    rarity: 'legendary'
  },
  dedicated: {
    type: 'dedicated',
    label: 'Dévoué',
    emoji: '💪',
    description: 'A posté beaucoup de photos rapidement',
    color: 'from-indigo-500 to-purple-500',
    rarity: 'rare'
  },
  influencer: {
    type: 'influencer',
    label: 'Influenceur',
    emoji: '👑',
    description: 'Meilleur ratio likes/photos',
    color: 'from-yellow-400 to-amber-500',
    rarity: 'epic'
  },
  reaction_master: {
    type: 'reaction_master',
    label: 'Maître des réactions',
    emoji: '🎭',
    description: 'A reçu tous les types de réactions',
    color: 'from-violet-500 via-purple-500 to-fuchsia-500',
    rarity: 'legendary'
  }
};

/**
 * Calcule le total de réactions d'une photo
 */
const getTotalReactions = (photo: Photo, reactionsMap?: Map<string, ReactionCounts>): number => {
  const reactions = getPhotoReactions(photo, reactionsMap);
  if (!reactions) return 0;
  return Object.values(reactions).reduce((sum, count) => sum + (count || 0), 0);
};

/**
 * Calcule la variété de réactions (nombre de types différents)
 */
const getReactionVariety = (photo: Photo, reactionsMap?: Map<string, ReactionCounts>): number => {
  const reactions = getPhotoReactions(photo, reactionsMap);
  if (!reactions) return 0;
  return Object.values(reactions).filter(count => (count || 0) > 0).length;
};

/**
 * Calcule les statistiques par auteur avec réactions
 * @param photos - Liste des photos
 * @param reactionsMap - Map optionnelle des réactions par photo ID
 */
export const calculateAuthorStats = (photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Map<string, AuthorStats> => {
  const statsMap = new Map<string, AuthorStats>();

  photos.forEach(photo => {
    const existing = statsMap.get(photo.author) || {
      author: photo.author,
      photoCount: 0,
      totalLikes: 0,
      averageLikes: 0,
      totalReactions: 0,
      reactionVariety: 0,
      badges: [],
      score: 0,
      firstPhotoTimestamp: photo.timestamp,
      lastPhotoTimestamp: photo.timestamp
    };

    existing.photoCount += 1;
    existing.totalLikes += photo.likes_count;
    existing.totalReactions += getTotalReactions(photo, reactionsMap);
    
    // Mettre à jour les timestamps
    if (photo.timestamp < (existing.firstPhotoTimestamp || Infinity)) {
      existing.firstPhotoTimestamp = photo.timestamp;
    }
    if (photo.timestamp > (existing.lastPhotoTimestamp || 0)) {
      existing.lastPhotoTimestamp = photo.timestamp;
    }

    // Calculer la variété de réactions (types uniques reçus)
    const photoReactionTypes = new Set<string>();
    const reactions = getPhotoReactions(photo, reactionsMap);
    if (reactions) {
      Object.entries(reactions).forEach(([type, count]) => {
        if (count && count > 0) {
          photoReactionTypes.add(type);
        }
      });
    }
    // Garder le maximum de variété
    existing.reactionVariety = Math.max(existing.reactionVariety, photoReactionTypes.size);

    statsMap.set(photo.author, existing);
  });

  // Calculer la moyenne de likes et le score
  statsMap.forEach((stats) => {
    stats.averageLikes = stats.photoCount > 0 
      ? Math.round((stats.totalLikes / stats.photoCount) * 10) / 10 
      : 0;

    // Calcul du score de gamification
    // Points basés sur: photos, likes, réactions, moyenne
    stats.score = 
      (stats.photoCount * 10) + // 10 points par photo
      (stats.totalLikes * 5) + // 5 points par like
      (stats.totalReactions * 3) + // 3 points par réaction
      (stats.averageLikes * 20) + // Bonus pour qualité
      (stats.reactionVariety * 15); // Bonus pour variété
  });

  return statsMap;
};

/**
 * Trouve l'auteur avec le plus de photos (Badge Photographe)
 */
export const getTopPhotographer = (photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): AuthorStats | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos, reactionsMap);
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
 * Trouve l'auteur avec le plus de likes totaux (Badge Popular)
 */
const getMostPopularAuthor = (photos: Photo[]): string | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos);
  let topAuthor: string | null = null;
  let maxLikes = 0;

  statsMap.forEach((stats) => {
    if (stats.totalLikes > maxLikes) {
      maxLikes = stats.totalLikes;
      topAuthor = stats.author;
    }
  });

  return topAuthor;
};

/**
 * Trouve l'auteur avec la meilleure moyenne de likes (Badge Quality)
 */
const getBestQualityAuthor = (photos: Photo[]): string | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos);
  let topAuthor: string | null = null;
  let maxAverage = 0;
  const minPhotos = 3; // Minimum 3 photos pour être éligible

  statsMap.forEach((stats) => {
    if (stats.photoCount >= minPhotos && stats.averageLikes > maxAverage) {
      maxAverage = stats.averageLikes;
      topAuthor = stats.author;
    }
  });

  return topAuthor;
};

/**
 * Trouve l'auteur avec le plus de réactions variées (Badge Social Butterfly)
 */
const getSocialButterflyAuthor = (photos: Photo[]): string | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos);
  let topAuthor: string | null = null;
  let maxReactions = 0;

  statsMap.forEach((stats) => {
    if (stats.totalReactions > maxReactions) {
      maxReactions = stats.totalReactions;
      topAuthor = stats.author;
    }
  });

  return topAuthor;
};

/**
 * Trouve l'auteur avec le meilleur ratio likes/photos (Badge Influencer)
 */
const getInfluencerAuthor = (photos: Photo[]): string | null => {
  if (photos.length === 0) return null;

  const statsMap = calculateAuthorStats(photos);
  let topAuthor: string | null = null;
  let maxRatio = 0;
  const minPhotos = 2; // Minimum 2 photos

  statsMap.forEach((stats) => {
    if (stats.photoCount >= minPhotos) {
      const ratio = stats.totalLikes / stats.photoCount;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        topAuthor = stats.author;
      }
    }
  });

  return topAuthor;
};

/**
 * Trouve l'auteur de la première photo (Badge Early Bird)
 */
const getEarlyBirdAuthor = (photos: Photo[]): string | null => {
  if (photos.length === 0) return null;

  let earliestPhoto: Photo | null = null;
  let earliestTimestamp = Infinity;

  photos.forEach(photo => {
    if (photo.timestamp < earliestTimestamp) {
      earliestTimestamp = photo.timestamp;
      earliestPhoto = photo;
    }
  });

  return earliestPhoto?.author || null;
};

/**
 * Vérifie si un auteur a posté régulièrement (Badge Consistent)
 */
const hasConsistentPosting = (author: string, photos: Photo[]): boolean => {
  const authorPhotos = photos
    .filter(p => p.author === author)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (authorPhotos.length < 5) return false; // Minimum 5 photos

  // Vérifier si les photos sont réparties sur au moins 3 périodes différentes
  const timeSpan = authorPhotos[authorPhotos.length - 1].timestamp - authorPhotos[0].timestamp;
  const intervals = timeSpan / 3; // Diviser en 3 périodes

  const periods = [0, 0, 0];
  authorPhotos.forEach(photo => {
    const relativeTime = photo.timestamp - authorPhotos[0].timestamp;
    const periodIndex = Math.min(2, Math.floor(relativeTime / intervals));
    periods[periodIndex]++;
  });

  // Au moins une photo dans chaque période
  return periods.every(count => count > 0);
};

/**
 * Vérifie si un auteur a reçu tous les types de réactions (Badge Reaction Master)
 */
const hasAllReactionTypes = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): boolean => {
  const authorPhotos = photos.filter(p => p.author === author);
  const receivedTypes = new Set<string>();

  authorPhotos.forEach(photo => {
    const reactions = getPhotoReactions(photo, reactionsMap);
    if (reactions) {
      Object.entries(reactions).forEach(([type, count]) => {
        if (count && count > 0) {
          receivedTypes.add(type);
        }
      });
    }
  });

  // Vérifier si on a reçu au moins 5 types de réactions différents
  return receivedTypes.size >= 5;
};

/**
 * Trouve la photo avec le plus de réactions (Badge Viral)
 */
const getViralPhoto = (photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Photo | null => {
  if (photos.length === 0) return null;

  let viralPhoto: Photo | null = null;
  let maxReactions = 0;

  photos.forEach(photo => {
    const totalReactions = getTotalReactions(photo, reactionsMap);
    if (totalReactions > maxReactions) {
      maxReactions = totalReactions;
      viralPhoto = photo;
    }
  });

  return viralPhoto && maxReactions >= 10 ? viralPhoto : null; // Minimum 10 réactions
};

/**
 * Vérifie si une photo a le badge Star
 */
export const hasStarBadge = (photo: Photo, photos: Photo[]): boolean => {
  const starPhoto = getStarPhoto(photos);
  return starPhoto?.id === photo.id && photo.likes_count > 0;
};

/**
 * Vérifie si une photo a le badge Viral
 */
const hasViralBadge = (photo: Photo, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): boolean => {
  const viralPhoto = getViralPhoto(photos, reactionsMap);
  return viralPhoto?.id === photo.id;
};

/**
 * Vérifie si un auteur a le badge Photographe
 */
export const hasPhotographerBadge = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): boolean => {
  const topPhotographer = getTopPhotographer(photos, reactionsMap);
  return topPhotographer?.author === author && topPhotographer.photoCount > 0;
};

/**
 * Récupère tous les badges d'un auteur
 */
export const getAuthorBadges = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Badge[] => {
  const badges: Badge[] = [];
  const statsMap = calculateAuthorStats(photos, reactionsMap);
  const stats = statsMap.get(author);
  
  if (!stats) return badges;

  // Badge Photographe
  if (hasPhotographerBadge(author, photos)) {
    badges.push(BADGES.photographer);
  }

  // Badge Popular
  if (getMostPopularAuthor(photos) === author) {
    badges.push(BADGES.popular);
  }

  // Badge Quality
  if (getBestQualityAuthor(photos) === author) {
    badges.push(BADGES.quality);
  }

  // Badge Social Butterfly
  if (getSocialButterflyAuthor(photos) === author) {
    badges.push(BADGES.social_butterfly);
  }

  // Badge Influencer
  if (getInfluencerAuthor(photos) === author) {
    badges.push(BADGES.influencer);
  }

  // Badge Early Bird
  if (getEarlyBirdAuthor(photos) === author) {
    badges.push(BADGES.early_bird);
  }

  // Badge Consistent
  if (hasConsistentPosting(author, photos)) {
    badges.push(BADGES.consistent);
  }

  // Badge Reaction Master
  if (hasAllReactionTypes(author, photos, reactionsMap)) {
    badges.push(BADGES.reaction_master);
  }

  return badges;
};

/**
 * Récupère le badge d'une photo (si elle est la star ou virale)
 */
export const getPhotoBadge = (photo: Photo, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Badge | null => {
  if (hasStarBadge(photo, photos)) {
    return BADGES.star;
  }
  if (hasViralBadge(photo, photos, reactionsMap)) {
    return BADGES.viral;
  }
  return null;
};

/**
 * Génère le classement des auteurs avec score
 * @param photos - Liste des photos
 * @param reactionsMap - Map optionnelle des réactions par photo ID
 */
export const generateLeaderboard = (photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): LeaderboardEntry[] => {
  if (photos.length === 0) return [];

  const statsMap = calculateAuthorStats(photos, reactionsMap);
  
  // Convertir en array et trier par score
  const entries: LeaderboardEntry[] = Array.from(statsMap.values())
    .map((stats) => ({
      rank: 0, // Sera calculé après le tri
      author: stats.author,
      photoCount: stats.photoCount,
      totalLikes: stats.totalLikes,
      totalReactions: stats.totalReactions,
      badges: getAuthorBadges(stats.author, photos, reactionsMap),
      score: stats.score
    }))
    .sort((a, b) => {
      // Trier par score (desc), puis par nombre de photos (desc), puis par likes totaux (desc)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
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
export const getAuthorStats = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): AuthorStats | null => {
  const statsMap = calculateAuthorStats(photos, reactionsMap);
  const stats = statsMap.get(author);
  
  if (!stats) return null;

  return {
    ...stats,
    badges: getAuthorBadges(author, photos, reactionsMap)
  };
};

/**
 * Types de milestones/achievements
 */
export interface Milestone {
  id: string;
  label: string;
  emoji: string;
  description: string;
  threshold: number;
  type: 'photos' | 'likes' | 'reactions' | 'score' | 'average';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Définition des milestones
 */
export const MILESTONES: Milestone[] = [
  // Milestones photos
  { id: 'first_photo', label: 'Première photo', emoji: '🎬', description: 'Poster votre première photo', threshold: 1, type: 'photos', rarity: 'common' },
  { id: 'photo_5', label: '5 photos', emoji: '📷', description: 'Poster 5 photos', threshold: 5, type: 'photos', rarity: 'common' },
  { id: 'photo_10', label: '10 photos', emoji: '📸', description: 'Poster 10 photos', threshold: 10, type: 'photos', rarity: 'rare' },
  { id: 'photo_25', label: '25 photos', emoji: '🎥', description: 'Poster 25 photos', threshold: 25, type: 'photos', rarity: 'epic' },
  { id: 'photo_50', label: '50 photos', emoji: '🏆', description: 'Poster 50 photos', threshold: 50, type: 'photos', rarity: 'legendary' },
  
  // Milestones likes
  { id: 'like_10', label: '10 likes', emoji: '👍', description: 'Recevoir 10 likes au total', threshold: 10, type: 'likes', rarity: 'common' },
  { id: 'like_50', label: '50 likes', emoji: '❤️', description: 'Recevoir 50 likes au total', threshold: 50, type: 'likes', rarity: 'rare' },
  { id: 'like_100', label: '100 likes', emoji: '🔥', description: 'Recevoir 100 likes au total', threshold: 100, type: 'likes', rarity: 'epic' },
  { id: 'like_250', label: '250 likes', emoji: '⭐', description: 'Recevoir 250 likes au total', threshold: 250, type: 'likes', rarity: 'legendary' },
  
  // Milestones réactions
  { id: 'reaction_20', label: '20 réactions', emoji: '🎉', description: 'Recevoir 20 réactions au total', threshold: 20, type: 'reactions', rarity: 'common' },
  { id: 'reaction_50', label: '50 réactions', emoji: '🎊', description: 'Recevoir 50 réactions au total', threshold: 50, type: 'reactions', rarity: 'rare' },
  { id: 'reaction_100', label: '100 réactions', emoji: '🚀', description: 'Recevoir 100 réactions au total', threshold: 100, type: 'reactions', rarity: 'epic' },
  
  // Milestones score
  { id: 'score_100', label: '100 points', emoji: '💯', description: 'Atteindre 100 points', threshold: 100, type: 'score', rarity: 'common' },
  { id: 'score_500', label: '500 points', emoji: '💎', description: 'Atteindre 500 points', threshold: 500, type: 'score', rarity: 'rare' },
  { id: 'score_1000', label: '1000 points', emoji: '👑', description: 'Atteindre 1000 points', threshold: 1000, type: 'score', rarity: 'epic' },
  { id: 'score_2500', label: '2500 points', emoji: '🌟', description: 'Atteindre 2500 points', threshold: 2500, type: 'score', rarity: 'legendary' },
  
  // Milestones moyenne
  { id: 'avg_5', label: 'Moyenne 5', emoji: '✨', description: 'Avoir une moyenne de 5 likes par photo (min 3 photos)', threshold: 5, type: 'average', rarity: 'rare' },
  { id: 'avg_10', label: 'Moyenne 10', emoji: '💫', description: 'Avoir une moyenne de 10 likes par photo (min 5 photos)', threshold: 10, type: 'average', rarity: 'epic' },
];

/**
 * Récupère les milestones atteints par un auteur
 */
export const getAuthorMilestones = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Milestone[] => {
  const stats = getAuthorStats(author, photos, reactionsMap);
  if (!stats) return [];

  const achieved: Milestone[] = [];

  MILESTONES.forEach(milestone => {
    let value = 0;
    let eligible = false;

    switch (milestone.type) {
      case 'photos':
        value = stats.photoCount;
        eligible = true;
        break;
      case 'likes':
        value = stats.totalLikes;
        eligible = true;
        break;
      case 'reactions':
        value = stats.totalReactions;
        eligible = true;
        break;
      case 'score':
        value = stats.score;
        eligible = true;
        break;
      case 'average':
        // Pour la moyenne, on vérifie aussi le nombre minimum de photos
        value = stats.averageLikes;
        eligible = milestone.id === 'avg_5' ? stats.photoCount >= 3 : stats.photoCount >= 5;
        break;
    }

    if (eligible && value >= milestone.threshold) {
      achieved.push(milestone);
    }
  });

  return achieved.sort((a, b) => {
    // Trier par rareté puis par seuil
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    if (rarityOrder[b.rarity] !== rarityOrder[a.rarity]) {
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    }
    return b.threshold - a.threshold;
  });
};

/**
 * Récupère le prochain milestone à atteindre pour un auteur
 */
export const getNextMilestone = (author: string, photos: Photo[], reactionsMap?: Map<string, ReactionCounts>): Milestone | null => {
  const stats = getAuthorStats(author, photos, reactionsMap);
  if (!stats) return null;

  const achieved = getAuthorMilestones(author, photos);
  const achievedIds = new Set(achieved.map(m => m.id));

  // Trouver le prochain milestone non atteint
  for (const milestone of MILESTONES.sort((a, b) => {
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    return a.threshold - b.threshold;
  })) {
    if (!achievedIds.has(milestone.id)) {
      let value = 0;
      let eligible = false;

      switch (milestone.type) {
        case 'photos':
          value = stats.photoCount;
          eligible = true;
          break;
        case 'likes':
          value = stats.totalLikes;
          eligible = true;
          break;
        case 'reactions':
          value = stats.totalReactions;
          eligible = true;
          break;
        case 'score':
          value = stats.score;
          eligible = true;
          break;
        case 'average':
          value = stats.averageLikes;
          eligible = milestone.id === 'avg_5' ? stats.photoCount >= 3 : stats.photoCount >= 5;
          break;
      }

      if (eligible && value < milestone.threshold) {
        return milestone;
      }
    }
  }

  return null;
};
