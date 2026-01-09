import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Challenge, 
  ChallengeRow, 
  ChallengeSubmission, 
  ChallengeSubmissionRow,
  ChallengeStatus,
  ChallengeType,
  Photo 
} from '../types';
import { enrichPhotoWithOrientation } from './photoService';
import { logger } from '../utils/logger';

/**
 * Convertit une ChallengeRow de Supabase en Challenge
 */
const convertChallengeRowToChallenge = async (
  row: ChallengeRow,
  submissions?: ChallengeSubmission[],
  userVote?: string | null
): Promise<Challenge> => {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    type: row.type,
    theme: row.theme,
    startAt: new Date(row.start_at).getTime(),
    endAt: new Date(row.end_at).getTime(),
    status: row.status,
    winnerPhotoId: row.winner_photo_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    submissions: submissions || [],
    userVote: userVote || null,
  };
};

/**
 * Récupère une photo par son ID
 */
const getPhotoById = async (photoId: string): Promise<Photo | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
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
      tags: data.tags || undefined,
    };

    return await enrichPhotoWithOrientation(photo);
  } catch (error) {
    logger.error('Error in getPhotoById:', error);
    return null;
  }
};

/**
 * Convertit une ChallengeSubmissionRow en ChallengeSubmission
 */
const convertSubmissionRowToSubmission = async (
  row: ChallengeSubmissionRow
): Promise<ChallengeSubmission | null> => {
  const photo = await getPhotoById(row.photo_id);
  if (!photo) return null;

  return {
    id: row.id,
    challengeId: row.challenge_id,
    photo,
    submittedBy: row.submitted_by,
    submittedAt: new Date(row.submitted_at).getTime(),
    votesCount: row.votes_count || 0,
  };
};

/**
 * Récupère les soumissions d'un challenge
 */
const getChallengeSubmissions = async (
  challengeId: string
): Promise<ChallengeSubmission[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('challenge_submissions')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('votes_count', { ascending: false })
      .order('submitted_at', { ascending: true });

    if (error) {
      logger.error('Error fetching challenge submissions:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const submissions = await Promise.all(
      data.map(row => convertSubmissionRowToSubmission(row as ChallengeSubmissionRow))
    );

    return submissions.filter((s): s is ChallengeSubmission => s !== null);
  } catch (error) {
    logger.error('Error in getChallengeSubmissions:', error);
    return [];
  }
};

/**
 * Récupère le vote d'un utilisateur pour un challenge
 */
const getUserVote = async (
  challengeId: string,
  userIdentifier: string
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('challenge_votes')
      .select('submission_id')
      .eq('challenge_id', challengeId)
      .eq('user_identifier', userIdentifier)
      .single();

    if (error || !data) {
      return null;
    }

    return data.submission_id;
  } catch (error) {
    logger.error('Error in getUserVote:', error);
    return null;
  }
};

/**
 * Crée un nouveau challenge
 * @param eventId - ID de l'événement
 * @param title - Titre du challenge
 * @param description - Description du challenge
 * @param type - Type de challenge ('time_based' ou 'theme')
 * @param theme - Thème du challenge (optionnel, pour les défis thématiques)
 * @param durationMinutes - Durée du challenge en minutes (défaut: 30)
 */
export const createChallenge = async (
  eventId: string,
  title: string,
  description: string,
  type: ChallengeType,
  theme: string | null = null,
  durationMinutes: number = 30
): Promise<Challenge | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  if (!title.trim()) {
    throw new Error('Le titre du challenge est requis');
  }

  try {
    const startAt = new Date();
    const endAt = new Date();
    endAt.setMinutes(endAt.getMinutes() + durationMinutes);

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        event_id: eventId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        theme: theme?.trim() || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating challenge:', error);
      throw error;
    }

    if (!data) return null;

    return await convertChallengeRowToChallenge(data as ChallengeRow);
  } catch (error) {
    logger.error('Error in createChallenge:', error);
    throw error;
  }
};

/**
 * Récupère tous les challenges actifs d'un événement
 * @param eventId - ID de l'événement
 * @param userIdentifier - Identifiant de l'utilisateur (pour récupérer son vote)
 */
export const getActiveChallenges = async (
  eventId: string,
  userIdentifier?: string
): Promise<Challenge[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    // D'abord, terminer automatiquement les challenges expirés
    // Note: La fonction RPC est définie dans la migration SQL
    const { error: rpcError } = await supabase.rpc('finish_challenge_if_expired');
    if (rpcError) {
      logger.warn('Error calling finish_challenge_if_expired:', rpcError);
      // Continuer même si la fonction RPC échoue
    }

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('event_id', eventId)
      .in('status', ['active', 'voting'])
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching active challenges:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const challenges = await Promise.all(
      data.map(async (row) => {
        const submissions = await getChallengeSubmissions(row.id);
        const userVote = userIdentifier 
          ? await getUserVote(row.id, userIdentifier)
          : null;
        return convertChallengeRowToChallenge(
          row as ChallengeRow,
          submissions,
          userVote
        );
      })
    );

    return challenges;
  } catch (error) {
    logger.error('Error in getActiveChallenges:', error);
    return [];
  }
};

/**
 * Récupère un challenge par son ID
 * @param challengeId - ID du challenge
 * @param userIdentifier - Identifiant de l'utilisateur (pour récupérer son vote)
 */
export const getChallengeById = async (
  challengeId: string,
  userIdentifier?: string
): Promise<Challenge | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error) {
      logger.error('Error fetching challenge:', error);
      return null;
    }

    if (!data) return null;

    const submissions = await getChallengeSubmissions(challengeId);
    const userVote = userIdentifier 
      ? await getUserVote(challengeId, userIdentifier)
      : null;

    return await convertChallengeRowToChallenge(
      data as ChallengeRow,
      submissions,
      userVote
    );
  } catch (error) {
    logger.error('Error in getChallengeById:', error);
    return null;
  }
};

/**
 * Soumet une photo à un challenge
 * @param challengeId - ID du challenge
 * @param photoId - ID de la photo à soumettre
 * @param submittedBy - Nom de l'auteur qui soumet la photo
 */
export const submitPhotoToChallenge = async (
  challengeId: string,
  photoId: string,
  submittedBy: string
): Promise<ChallengeSubmission | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  if (!submittedBy.trim()) {
    throw new Error('Le nom de l\'auteur est requis');
  }

  try {
    // Vérifier que le challenge existe et est actif
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge introuvable');
    }

    if (challenge.status !== 'active' && challenge.status !== 'voting') {
      throw new Error('Ce challenge n\'accepte plus de soumissions');
    }

    // Vérifier que la photo n'a pas déjà été soumise
    const { data: existing } = await supabase
      .from('challenge_submissions')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('photo_id', photoId)
      .single();

    if (existing) {
      throw new Error('Cette photo a déjà été soumise à ce challenge');
    }

    const { data, error } = await supabase
      .from('challenge_submissions')
      .insert({
        challenge_id: challengeId,
        photo_id: photoId,
        submitted_by: submittedBy.trim(),
        votes_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error submitting photo to challenge:', error);
      throw error;
    }

    if (!data) return null;

    // Si c'est la première soumission, passer le challenge en mode "voting"
    const submissions = await getChallengeSubmissions(challengeId);
    if (submissions.length === 1) {
      await supabase
        .from('challenges')
        .update({ status: 'voting' })
        .eq('id', challengeId);
    }

    return await convertSubmissionRowToSubmission(data as ChallengeSubmissionRow);
  } catch (error) {
    logger.error('Error in submitPhotoToChallenge:', error);
    throw error;
  }
};

/**
 * Vote pour une soumission dans un challenge
 * @param challengeId - ID du challenge
 * @param submissionId - ID de la soumission pour laquelle voter
 * @param userIdentifier - Identifiant unique de l'utilisateur
 */
export const voteForSubmission = async (
  challengeId: string,
  submissionId: string,
  userIdentifier: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Vérifier que le challenge existe et est en mode voting
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge introuvable');
    }

    if (challenge.status !== 'voting') {
      throw new Error('Ce challenge n\'accepte plus de votes');
    }

    // Vérifier que l'utilisateur n'a pas déjà voté
    const existingVote = await getUserVote(challengeId, userIdentifier);
    if (existingVote) {
      throw new Error('Vous avez déjà voté pour ce challenge');
    }

    // Vérifier que la soumission existe
    const { data: submission } = await supabase
      .from('challenge_submissions')
      .select('id')
      .eq('id', submissionId)
      .eq('challenge_id', challengeId)
      .single();

    if (!submission) {
      throw new Error('Soumission introuvable');
    }

    const { error } = await supabase
      .from('challenge_votes')
      .insert({
        challenge_id: challengeId,
        submission_id: submissionId,
        user_identifier: userIdentifier,
      });

    if (error) {
      logger.error('Error voting for submission:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in voteForSubmission:', error);
    throw error;
  }
};

/**
 * Termine un challenge et détermine le gagnant
 * @param challengeId - ID du challenge
 */
export const finishChallenge = async (
  challengeId: string
): Promise<Challenge | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Récupérer la soumission avec le plus de votes
    const { data: topSubmission } = await supabase
      .from('challenge_submissions')
      .select('photo_id')
      .eq('challenge_id', challengeId)
      .order('votes_count', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('challenges')
      .update({
        status: 'finished',
        winner_photo_id: topSubmission?.photo_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) {
      logger.error('Error finishing challenge:', error);
      throw error;
    }

    if (!data) return null;

    const submissions = await getChallengeSubmissions(challengeId);
    return await convertChallengeRowToChallenge(data as ChallengeRow, submissions);
  } catch (error) {
    logger.error('Error in finishChallenge:', error);
    throw error;
  }
};

/**
 * Annule un challenge
 * @param challengeId - ID du challenge
 */
export const cancelChallenge = async (
  challengeId: string
): Promise<Challenge | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('challenges')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) {
      logger.error('Error cancelling challenge:', error);
      throw error;
    }

    if (!data) return null;

    const submissions = await getChallengeSubmissions(challengeId);
    return await convertChallengeRowToChallenge(data as ChallengeRow, submissions);
  } catch (error) {
    logger.error('Error in cancelChallenge:', error);
    throw error;
  }
};

/**
 * Récupère tous les challenges terminés d'un événement
 * @param eventId - ID de l'événement
 * @param limit - Nombre maximum de challenges à récupérer (défaut: 10)
 */
export const getFinishedChallenges = async (
  eventId: string,
  limit: number = 10
): Promise<Challenge[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching finished challenges:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const challenges = await Promise.all(
      data.map(async (row) => {
        const submissions = await getChallengeSubmissions(row.id);
        return convertChallengeRowToChallenge(row as ChallengeRow, submissions);
      })
    );

    return challenges;
  } catch (error) {
    logger.error('Error in getFinishedChallenges:', error);
    return [];
  }
};

