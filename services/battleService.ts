import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Photo, PhotoBattle, BattleStatus, BattleRow, BattleVoteRow } from '../types';
import { enrichPhotoWithOrientation } from './photoService';
import { logger } from '../utils/logger';

/**
 * Convertit une BattleRow de Supabase en PhotoBattle
 */
const convertBattleRowToPhotoBattle = async (
  row: BattleRow,
  photo1: Photo,
  photo2: Photo,
  userVote?: string | null
): Promise<PhotoBattle> => {
  return {
    id: row.id,
    photo1: await enrichPhotoWithOrientation(photo1),
    photo2: await enrichPhotoWithOrientation(photo2),
    status: row.status,
    winnerId: row.winner_id,
    votes1Count: row.votes1_count || 0,
    votes2Count: row.votes2_count || 0,
    createdAt: new Date(row.created_at).getTime(),
    finishedAt: row.finished_at ? new Date(row.finished_at).getTime() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    userVote: userVote || null,
  };
};

// Cache simple pour les photos (évite les requêtes répétitives)
const photoCache = new Map<string, { photo: Photo; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Récupère une photo par son ID (avec cache)
 */
const getPhotoById = async (photoId: string): Promise<Photo | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Vérifier le cache
  const cached = photoCache.get(photoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.photo;
  }

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('id, url, caption, author, created_at, type, duration, likes_count')
      .eq('id', photoId)
      .single();

    if (error) {
      logger.error('Error fetching photo:', error);
      return null;
    }

    if (!data) return null;

    const photo: Photo = {
      id: data.id,
      url: data.url,
      caption: data.caption || '',
      author: data.author || '',
      timestamp: new Date(data.created_at).getTime(),
      likes_count: data.likes_count || 0,
      type: (data.type || 'photo') as 'photo' | 'video',
      duration: data.duration ? Number(data.duration) : undefined,
    };

    // Mettre en cache
    photoCache.set(photoId, { photo, timestamp: Date.now() });
    return photo;
  } catch (error) {
    logger.error('Error in getPhotoById:', error);
    return null;
  }
};

/**
 * Récupère plusieurs photos par leurs IDs en une seule requête
 */
const getPhotosByIds = async (photoIds: string[]): Promise<Map<string, Photo>> => {
  if (!isSupabaseConfigured() || photoIds.length === 0) {
    return new Map();
  }

  // Filtrer les IDs déjà en cache
  const uncachedIds: string[] = [];
  const result = new Map<string, Photo>();

  for (const id of photoIds) {
    const cached = photoCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result.set(id, cached.photo);
    } else {
      uncachedIds.push(id);
    }
  }

  // Récupérer les photos non mises en cache
  if (uncachedIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('id, url, caption, author, created_at, type, duration, likes_count')
        .in('id', uncachedIds);

      if (error) {
        logger.error('Error fetching photos:', error);
      } else if (data) {
        for (const row of data) {
          const photo: Photo = {
            id: row.id,
            url: row.url,
            caption: row.caption || '',
            author: row.author || '',
            timestamp: new Date(row.created_at).getTime(),
            likes_count: row.likes_count || 0,
            type: (row.type || 'photo') as 'photo' | 'video',
            duration: row.duration ? Number(row.duration) : undefined,
          };
          result.set(row.id, photo);
          // Mettre en cache
          photoCache.set(row.id, { photo, timestamp: Date.now() });
        }
      }
    } catch (error) {
      logger.error('Error in getPhotosByIds:', error);
    }
  }

  return result;
};

/**
 * Recalcule les compteurs de votes pour une battle depuis les votes réels
 * Note: Les triggers SQL devraient normalement maintenir ces compteurs à jour,
 * donc cette fonction ne devrait être appelée qu'en cas de besoin (vérification)
 */
const recalculateBattleCounts = async (battleId: string): Promise<{ votes1Count: number; votes2Count: number }> => {
  if (!isSupabaseConfigured()) {
    return { votes1Count: 0, votes2Count: 0 };
  }

  try {
    // Récupérer la battle pour avoir les IDs des photos
    const { data: battle } = await supabase
      .from('photo_battles')
      .select('photo1_id, photo2_id, votes1_count, votes2_count')
      .eq('id', battleId)
      .single();

    if (!battle) {
      return { votes1Count: 0, votes2Count: 0 };
    }

    // Si les compteurs sont déjà à jour (vérification rapide), on les utilise
    // Sinon, on recalcule depuis les votes réels
    // Pour l'instant, on fait confiance aux triggers SQL et on retourne les compteurs existants
    // On ne recalcule que si nécessaire (par exemple, si les compteurs semblent incorrects)
    return {
      votes1Count: battle.votes1_count || 0,
      votes2Count: battle.votes2_count || 0,
    };
  } catch (error) {
    logger.error('Error recalculating battle counts:', error);
    return { votes1Count: 0, votes2Count: 0 };
  }
};

// Cache pour éviter d'appeler finishExpiredBattles trop souvent
let lastExpiredCheck = 0;
const EXPIRED_CHECK_INTERVAL = 30000; // 30 secondes

/**
 * Termine automatiquement les battles expirées (avec throttling)
 */
/**
 * Termine les battles expirées pour un événement
 * @param eventId - ID de l'événement
 */
export const finishExpiredBattles = async (eventId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  // Throttling : ne pas vérifier plus d'une fois toutes les 30 secondes
  const now = Date.now();
  const lastCheckKey = `lastExpiredCheck_${eventId}`;
  const lastCheck = (globalThis as any)[lastCheckKey] || 0;
  if (now - lastCheck < EXPIRED_CHECK_INTERVAL) {
    return;
  }
  (globalThis as any)[lastCheckKey] = now;

  try {
    // Mettre à jour manuellement les battles expirées pour cet événement
    const { error } = await supabase
      .from('photo_battles')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      logger.warn('Error finishing expired battles:', error);
    }
  } catch (error) {
    logger.error('Error in finishExpiredBattles:', error);
  }
};

/**
 * Récupère les battles terminées (pour afficher les résultats)
 */
/**
 * Récupère les battles terminées pour un événement
 * @param eventId - ID de l'événement
 */
export const getFinishedBattles = async (eventId: string, limit: number = 20): Promise<PhotoBattle[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // Récupérer les battles terminées pour cet événement
    const { data: battles, error } = await supabase
      .from('photo_battles')
      .select('id, photo1_id, photo2_id, status, winner_id, votes1_count, votes2_count, created_at, finished_at, expires_at, event_id')
      .eq('event_id', eventId)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching finished battles:', error);
      return [];
    }

    if (!battles || battles.length === 0) {
      return [];
    }

    // Récupérer toutes les photos en une seule requête
    const allPhotoIds = battles.flatMap(b => [b.photo1_id, b.photo2_id]);
    const photosMap = await getPhotosByIds(allPhotoIds);

    // Construire les battles avec les photos
    const battlesWithPhotos: PhotoBattle[] = [];
    for (const battle of battles as BattleRow[]) {
      const photo1 = photosMap.get(battle.photo1_id);
      const photo2 = photosMap.get(battle.photo2_id);

      if (photo1 && photo2) {
        const photoBattle = await convertBattleRowToPhotoBattle(
          battle,
          photo1,
          photo2
        );
        battlesWithPhotos.push(photoBattle);
      }
    }

    return battlesWithPhotos;
  } catch (error) {
    logger.error('Error in getFinishedBattles:', error);
    return [];
  }
};

/**
 * Récupère toutes les battles actives pour un événement
 * @param eventId - ID de l'événement
 */
export const getActiveBattles = async (eventId: string, userId?: string): Promise<PhotoBattle[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // D'abord, terminer les battles expirées pour cet événement
    await finishExpiredBattles(eventId);

    // Récupérer les battles actives pour cet événement
    const { data: battles, error } = await supabase
      .from('photo_battles')
      .select('id, photo1_id, photo2_id, status, winner_id, votes1_count, votes2_count, created_at, finished_at, expires_at, event_id')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10); // Limiter à 10 battles actives

    if (error) {
      logger.error('Error fetching battles:', error);
      return [];
    }

    if (!battles || battles.length === 0) {
      return [];
    }

    // Récupérer les votes de l'utilisateur si userId fourni et valide
    let userVotes: Map<string, string> = new Map();
    if (userId && userId.trim() !== '') {
      const battleIds = battles.map(b => b.id);
      if (battleIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from('battle_votes')
          .select('battle_id, voted_for_photo_id')
          .in('battle_id', battleIds)
          .eq('user_identifier', userId);

        if (votesError) {
          logger.warn('Error fetching user votes:', votesError);
        } else if (votes) {
          votes.forEach(vote => {
            userVotes.set(vote.battle_id, vote.voted_for_photo_id);
          });
        }
      }
    }

    // Récupérer toutes les photos en une seule requête
    const allPhotoIds = battles.flatMap(b => [b.photo1_id, b.photo2_id]);
    const photosMap = await getPhotosByIds(allPhotoIds);

    // Construire les battles avec les photos
    const battlesWithPhotos: PhotoBattle[] = [];
    for (const battle of battles as BattleRow[]) {
      const photo1 = photosMap.get(battle.photo1_id);
      const photo2 = photosMap.get(battle.photo2_id);

      if (photo1 && photo2) {
        // Utiliser les compteurs de la base (les triggers SQL les maintiennent à jour)
        const userVote = userId ? userVotes.get(battle.id) : null;
        
        const photoBattle = await convertBattleRowToPhotoBattle(
          battle,
          photo1,
          photo2,
          userVote
        );
        battlesWithPhotos.push(photoBattle);
      }
    }

    return battlesWithPhotos;
  } catch (error) {
    logger.error('Error in getActiveBattles:', error);
    return [];
  }
};

/**
 * Crée une nouvelle battle entre deux photos
 */
/**
 * Crée une battle entre deux photos pour un événement
 * @param eventId - ID de l'événement
 */
export const createBattle = async (
  eventId: string,
  photo1Id: string,
  photo2Id: string,
  durationMinutes: number = 30
): Promise<PhotoBattle | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  if (photo1Id === photo2Id) {
    throw new Error('Les deux photos doivent être différentes');
  }

  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    const { data, error } = await supabase
      .from('photo_battles')
      .insert({
        event_id: eventId,
        photo1_id: photo1Id,
        photo2_id: photo2Id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        votes1_count: 0, // S'assurer que les compteurs sont à 0
        votes2_count: 0, // S'assurer que les compteurs sont à 0
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating battle:', error);
      throw error;
    }

    if (!data) return null;

    // ⚡ OPTIMISATION : Utiliser getPhotosByIds() au lieu de getPhotoById() en parallèle
    const photosMap = await getPhotosByIds([photo1Id, photo2Id]);
    const photo1 = photosMap.get(photo1Id);
    const photo2 = photosMap.get(photo2Id);

    if (!photo1 || !photo2) {
      throw new Error('Impossible de récupérer les photos');
    }

    return await convertBattleRowToPhotoBattle(data as BattleRow, photo1, photo2);
  } catch (error) {
    logger.error('Error in createBattle:', error);
    throw error;
  }
};

/**
 * Sélectionne deux indices aléatoires distincts dans un tableau
 * Algorithme optimisé O(1) pour sélectionner 2 éléments
 */
const selectTwoRandomIndices = (arrayLength: number): [number, number] => {
  if (arrayLength < 2) {
    throw new Error('Array must have at least 2 elements');
  }
  
  // Sélectionner le premier index
  let index1 = Math.floor(Math.random() * arrayLength);
  
  // Sélectionner le second index, différent du premier
  let index2 = Math.floor(Math.random() * arrayLength);
  while (index2 === index1) {
    index2 = Math.floor(Math.random() * arrayLength);
  }
  
  return [index1, index2];
};

/**
 * Crée une battle automatique avec deux photos aléatoires pour un événement
 * Exclut les photos déjà dans une battle active
 * 
 * Algorithme optimisé pour la performance :
 * - Limite le nombre de photos récupérées (1000 max)
 * - Utilise une requête SQL optimisée pour exclure les photos en battle
 * - Utilise Fisher-Yates shuffle pour sélection aléatoire O(k) au lieu de O(n log n)
 * @param eventId - ID de l'événement
 */
export const createRandomBattle = async (
  eventId: string,
  durationMinutes: number = 30
): Promise<PhotoBattle | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Étape 1: Récupérer les IDs des photos déjà dans une battle active pour cet événement (requête légère)
    const { data: activeBattles, error: battlesError } = await supabase
      .from('photo_battles')
      .select('photo1_id, photo2_id')
      .eq('event_id', eventId)
      .eq('status', 'active');

    if (battlesError) {
      logger.error('Error fetching active battles:', battlesError);
      // Continuer quand même, on va juste éviter les doublons si possible
    }

    // Créer un Set des IDs de photos déjà en battle (O(1) lookup)
    const photosInActiveBattles = new Set<string>();
    if (activeBattles) {
      activeBattles.forEach(battle => {
        photosInActiveBattles.add(battle.photo1_id);
        photosInActiveBattles.add(battle.photo2_id);
      });
    }

    // Étape 2: Récupérer un échantillon limité de photos récentes pour cet événement (optimisation performance)
    // Limiter à 1000 photos les plus récentes pour éviter de charger toute la base
    const MAX_PHOTOS_TO_FETCH = 1000;
    const { data: recentPhotos, error: photosError } = await supabase
      .from('photos')
      .select('id')
      .eq('event_id', eventId)
      .eq('type', 'photo')
      .order('created_at', { ascending: false })
      .limit(MAX_PHOTOS_TO_FETCH);

    if (photosError) {
      logger.error('Error fetching photos for random battle:', photosError);
      throw photosError;
    }

    if (!recentPhotos || recentPhotos.length < 2) {
      logger.warn('Not enough photos available for random battle');
      return null;
    }

    // Étape 3: Filtrer les photos disponibles (exclure celles déjà en battle)
    const availablePhotos = recentPhotos
      .map(p => p.id)
      .filter(id => !photosInActiveBattles.has(id));

    // Si moins de 2 photos disponibles après filtrage, essayer avec toutes les photos récentes
    const photosToUse = availablePhotos.length >= 2 
      ? availablePhotos 
      : recentPhotos.map(p => p.id);

    if (photosToUse.length < 2) {
      logger.warn('Not enough available photos for random battle');
      return null;
    }

    // Étape 4: Sélectionner deux photos aléatoirement avec algorithme optimisé
    // Utiliser sélection directe O(1) au lieu de shuffle complet O(n log n)
    const [index1, index2] = selectTwoRandomIndices(photosToUse.length);
    const photo1Id = photosToUse[index1];
    const photo2Id = photosToUse[index2];

    // Étape 5: Créer la battle
    return await createBattle(eventId, photo1Id, photo2Id, durationMinutes);
  } catch (error) {
    logger.error('Error in createRandomBattle:', error);
    throw error;
  }
};

/**
 * Vote pour une photo dans une battle
 */
export const voteForBattle = async (
  battleId: string,
  photoId: string,
  userId: string
): Promise<{ success: boolean; votes1Count: number; votes2Count: number }> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  // Vérifier que userId n'est pas vide (évite l'erreur 406)
  if (!userId || userId.trim() === '') {
    throw new Error('Identifiant utilisateur invalide');
  }

  try {
    // Vérifier que la battle existe et est active
    const { data: battle, error: battleError } = await supabase
      .from('photo_battles')
      .select('id, photo1_id, photo2_id, status, votes1_count, votes2_count, event_id')
      .eq('id', battleId)
      .eq('status', 'active')
      .single();

    if (battleError || !battle) {
      throw new Error('Battle introuvable ou terminée');
    }

    const battleRow = battle as BattleRow;

    // Vérifier que la photo fait partie de la battle
    if (photoId !== battleRow.photo1_id && photoId !== battleRow.photo2_id) {
      throw new Error('Photo invalide pour cette battle');
    }

    // Vérifier si l'utilisateur a déjà voté (seulement si userId est valide)
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('battle_votes')
      .select('id, voted_for_photo_id')
      .eq('battle_id', battleId)
      .eq('user_identifier', userId)
      .maybeSingle();

    // Ignorer l'erreur si c'est juste "pas de résultat" (maybeSingle retourne null sans erreur)
    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      logger.error('Error checking existing vote:', voteCheckError);
    }

    if (existingVote) {
      // L'utilisateur a déjà voté, on met à jour son vote
      if (existingVote.voted_for_photo_id === photoId) {
        // Il vote pour la même photo, rien à faire
        const { data: updatedBattle } = await supabase
          .from('photo_battles')
          .select('votes1_count, votes2_count')
          .eq('id', battleId)
          .single();

        return {
          success: true,
          votes1Count: updatedBattle?.votes1_count || 0,
          votes2Count: updatedBattle?.votes2_count || 0,
        };
      }

      // Supprimer l'ancien vote
      await supabase
        .from('battle_votes')
        .delete()
        .eq('id', existingVote.id);
    }

    // Ajouter le nouveau vote
    const { error: voteError } = await supabase
      .from('battle_votes')
      .insert({
        battle_id: battleId,
        user_identifier: userId,
        voted_for_photo_id: photoId,
      });

    if (voteError) {
      logger.error('Error voting for battle:', voteError);
      throw voteError;
    }

    // Récupérer les compteurs mis à jour
    const { data: updatedBattle } = await supabase
      .from('photo_battles')
      .select('votes1_count, votes2_count')
      .eq('id', battleId)
      .single();

    return {
      success: true,
      votes1Count: updatedBattle?.votes1_count || 0,
      votes2Count: updatedBattle?.votes2_count || 0,
    };
  } catch (error) {
    logger.error('Error in voteForBattle:', error);
    throw error;
  }
};

/**
 * Récupère le vote de l'utilisateur pour une battle
 */
export const getUserBattleVote = async (
  battleId: string,
  userId: string
): Promise<string | null> => {
  if (!isSupabaseConfigured() || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('battle_votes')
      .select('voted_for_photo_id')
      .eq('battle_id', battleId)
      .eq('user_identifier', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.voted_for_photo_id;
  } catch (error) {
    logger.error('Error in getUserBattleVote:', error);
    return null;
  }
};

/**
 * Termine une battle et détermine le gagnant
 */
export const finishBattle = async (battleId: string): Promise<PhotoBattle | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Récupérer la battle
    const { data: battle, error: battleError } = await supabase
      .from('photo_battles')
      .select('id, photo1_id, photo2_id, status, votes1_count, votes2_count, event_id')
      .eq('id', battleId)
      .single();

    if (battleError || !battle) {
      throw new Error('Battle introuvable');
    }

    const battleRow = battle as BattleRow;

    // Déterminer le gagnant
    let winnerId: string | null = null;
    if (battleRow.votes1_count > battleRow.votes2_count) {
      winnerId = battleRow.photo1_id;
    } else if (battleRow.votes2_count > battleRow.votes1_count) {
      winnerId = battleRow.photo2_id;
    }
    // Si égalité, winnerId reste null

    // Mettre à jour la battle
    const { data: updatedBattle, error: updateError } = await supabase
      .from('photo_battles')
      .update({
        status: 'finished',
        winner_id: winnerId,
        finished_at: new Date().toISOString(),
      })
      .eq('id', battleId)
      .select()
      .single();

    if (updateError || !updatedBattle) {
      throw updateError || new Error('Erreur lors de la mise à jour');
    }

    // ⚡ OPTIMISATION : Utiliser getPhotosByIds() au lieu de getPhotoById() en parallèle
    const photosMap = await getPhotosByIds([battleRow.photo1_id, battleRow.photo2_id]);
    const photo1 = photosMap.get(battleRow.photo1_id);
    const photo2 = photosMap.get(battleRow.photo2_id);

    if (!photo1 || !photo2) {
      throw new Error('Impossible de récupérer les photos');
    }

    return await convertBattleRowToPhotoBattle(updatedBattle as BattleRow, photo1, photo2);
  } catch (error) {
    logger.error('Error in finishBattle:', error);
    throw error;
  }
};

/**
 * S'abonne aux mises à jour d'une battle en temps réel
 */
export const subscribeToBattleUpdates = (
  battleId: string,
  onUpdate: (battle: PhotoBattle) => void
) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel(`battle:${battleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'photo_battles',
        filter: `id=eq.${battleId}`,
      },
      async (payload) => {
        const battleRow = payload.new as BattleRow;
        if (!battleRow) return;

        // ⚡ OPTIMISATION : Utiliser getPhotosByIds() au lieu de getPhotoById() en parallèle
        const photosMap = await getPhotosByIds([battleRow.photo1_id, battleRow.photo2_id]);
        const photo1 = photosMap.get(battleRow.photo1_id);
        const photo2 = photosMap.get(battleRow.photo2_id);

        if (photo1 && photo2) {
          // Utiliser les compteurs de la base (les triggers SQL les maintiennent à jour)
          const photoBattle = await convertBattleRowToPhotoBattle(battleRow, photo1, photo2);
          onUpdate(photoBattle);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'battle_votes',
        filter: `battle_id=eq.${battleId}`,
      },
      async (payload) => {
        // Quand un vote change, les triggers SQL mettent à jour les compteurs automatiquement
        // On récupère juste la battle mise à jour (les compteurs sont déjà à jour)
        const { data: battle } = await supabase
          .from('photo_battles')
          .select('id, photo1_id, photo2_id, status, winner_id, votes1_count, votes2_count, created_at, finished_at, expires_at, event_id')
          .eq('id', battleId)
          .single();

        if (battle) {
          const battleRow = battle as BattleRow;
          // ⚡ OPTIMISATION : Utiliser getPhotosByIds() au lieu de getPhotoById() en parallèle
          const photosMap = await getPhotosByIds([battleRow.photo1_id, battleRow.photo2_id]);
          const photo1 = photosMap.get(battleRow.photo1_id);
          const photo2 = photosMap.get(battleRow.photo2_id);

          if (photo1 && photo2) {
            const photoBattle = await convertBattleRowToPhotoBattle(battleRow, photo1, photo2);
            onUpdate(photoBattle);
          }
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * S'abonne aux nouvelles battles en temps réel
 */
/**
 * S'abonne aux nouvelles battles pour un événement
 * @param eventId - ID de l'événement
 */
export const subscribeToNewBattles = (eventId: string, onNewBattle: (battle: PhotoBattle) => void) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const channelId = `public:new_battles:${eventId}:${Math.floor(Math.random() * 1000000)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'photo_battles',
        filter: 'status=eq.active',
      },
      async (payload) => {
        const battleRow = payload.new as BattleRow & { event_id?: string };
        // Filtrer par event_id côté client (RLS devrait déjà le faire, mais on double-vérifie)
        if (!battleRow || battleRow.event_id !== eventId) return;

        // ⚡ OPTIMISATION : Utiliser getPhotosByIds() au lieu de getPhotoById() en parallèle
        const photosMap = await getPhotosByIds([battleRow.photo1_id, battleRow.photo2_id]);
        const photo1 = photosMap.get(battleRow.photo1_id);
        const photo2 = photosMap.get(battleRow.photo2_id);

        if (photo1 && photo2) {
          const photoBattle = await convertBattleRowToPhotoBattle(battleRow, photo1, photo2);
          onNewBattle(photoBattle);
        }
      }
    )
    .subscribe();

  return channel;
};

