import { supabase, isSupabaseConfigured } from './supabaseClient';
import { PrintRequest, PrintRequestRow, PrintRequestStatus } from '../types';
import { logger } from '../utils/logger';

/**
 * Convertit une ligne de base de données en objet PrintRequest
 */
const rowToPrintRequest = (row: PrintRequestRow): PrintRequest => {
  return {
    id: row.id,
    event_id: row.event_id,
    photo_id: row.photo_id,
    requested_by: row.requested_by,
    status: row.status,
    created_at: new Date(row.created_at).getTime(),
    printed_at: row.printed_at ? new Date(row.printed_at).getTime() : undefined,
    printed_by: row.printed_by || undefined,
  };
};

/**
 * Crée une demande d'impression pour une photo
 * @param eventId - ID de l'événement
 * @param photoId - ID de la photo à imprimer
 * @param requestedBy - Nom de l'invité qui fait la demande
 * @returns Promise résolue avec la demande d'impression créée
 */
export const createPrintRequest = async (
  eventId: string,
  photoId: string,
  requestedBy: string
): Promise<PrintRequest> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Vérifier si une demande en attente existe déjà pour cette photo et cet invité
    const { data: existingRequest } = await supabase
      .from('print_requests')
      .select('*')
      .eq('event_id', eventId)
      .eq('photo_id', photoId)
      .eq('requested_by', requestedBy)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      // Retourner la demande existante
      return rowToPrintRequest(existingRequest as PrintRequestRow);
    }

    // Créer une nouvelle demande
    const { data, error } = await supabase
      .from('print_requests')
      .insert({
        event_id: eventId,
        photo_id: photoId,
        requested_by: requestedBy,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating print request', error, {
        eventId,
        photoId,
        requestedBy,
      });
      throw error;
    }

    return rowToPrintRequest(data as PrintRequestRow);
  } catch (error) {
    logger.error('Error in createPrintRequest', error, {
      eventId,
      photoId,
      requestedBy,
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la création de la demande d'impression");
  }
};

/**
 * Récupère toutes les demandes d'impression pour un événement
 * @param eventId - ID de l'événement
 * @param status - Filtrer par statut (optionnel)
 * @returns Promise résolue avec la liste des demandes d'impression
 */
export const getPrintRequests = async (
  eventId: string,
  status?: PrintRequestStatus
): Promise<PrintRequest[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    let query = supabase
      .from('print_requests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching print requests', error, { eventId, status });
      throw error;
    }

    return (data || []).map(rowToPrintRequest);
  } catch (error) {
    logger.error('Error in getPrintRequests', error, { eventId, status });
    throw error instanceof Error ? error : new Error("Erreur lors de la récupération des demandes d'impression");
  }
};

/**
 * Met à jour le statut d'une demande d'impression
 * @param requestId - ID de la demande d'impression
 * @param status - Nouveau statut
 * @param printedBy - Nom de l'organisateur qui a imprimé (optionnel)
 * @returns Promise résolue avec la demande d'impression mise à jour
 */
export const updatePrintRequestStatus = async (
  requestId: string,
  status: PrintRequestStatus,
  printedBy?: string
): Promise<PrintRequest> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const updateData: Partial<PrintRequestRow> = {
      status,
    };

    if (status === 'printed') {
      updateData.printed_at = new Date().toISOString();
      if (printedBy) {
        updateData.printed_by = printedBy;
      }
    }

    const { data, error } = await supabase
      .from('print_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating print request', error, {
        requestId,
        status,
        printedBy,
      });
      throw error;
    }

    return rowToPrintRequest(data as PrintRequestRow);
  } catch (error) {
    logger.error('Error in updatePrintRequestStatus', error, {
      requestId,
      status,
      printedBy,
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la mise à jour de la demande d'impression");
  }
};

/**
 * Supprime une demande d'impression
 * @param requestId - ID de la demande d'impression
 * @returns Promise résolue
 */
export const deletePrintRequest = async (requestId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { error } = await supabase
      .from('print_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      logger.error('Error deleting print request', error, { requestId });
      throw error;
    }
  } catch (error) {
    logger.error('Error in deletePrintRequest', error, { requestId });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de la demande d'impression");
  }
};

/**
 * Récupère une demande d'impression par son ID
 * @param requestId - ID de la demande d'impression
 * @returns Promise résolue avec la demande d'impression
 */
export const getPrintRequestById = async (requestId: string): Promise<PrintRequest | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('print_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune ligne trouvée
        return null;
      }
      logger.error('Error fetching print request', error, { requestId });
      throw error;
    }

    return rowToPrintRequest(data as PrintRequestRow);
  } catch (error) {
    logger.error('Error in getPrintRequestById', error, { requestId });
    throw error instanceof Error ? error : new Error("Erreur lors de la récupération de la demande d'impression");
  }
};

/**
 * Récupère les demandes d'impression pour une photo spécifique
 * @param eventId - ID de l'événement
 * @param photoId - ID de la photo
 * @returns Promise résolue avec la liste des demandes d'impression
 */
export const getPrintRequestsByPhoto = async (
  eventId: string,
  photoId: string
): Promise<PrintRequest[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('print_requests')
      .select('*')
      .eq('event_id', eventId)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching print requests by photo', error, {
        eventId,
        photoId,
      });
      throw error;
    }

    return (data || []).map(rowToPrintRequest);
  } catch (error) {
    logger.error('Error in getPrintRequestsByPhoto', error, {
      eventId,
      photoId,
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la récupération des demandes d'impression");
  }
};

/**
 * Vérifie si un invité a déjà fait une demande d'impression pour une photo
 * @param eventId - ID de l'événement
 * @param photoId - ID de la photo
 * @param requestedBy - Nom de l'invité
 * @returns Promise résolue avec true si une demande en attente existe
 */
export const hasPendingPrintRequest = async (
  eventId: string,
  photoId: string,
  requestedBy: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('print_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('photo_id', photoId)
      .eq('requested_by', requestedBy)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune ligne trouvée
        return false;
      }
      logger.error('Error checking print request', error, {
        eventId,
        photoId,
        requestedBy,
      });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('Error in hasPendingPrintRequest', error, {
      eventId,
      photoId,
      requestedBy,
    });
    return false;
  }
};

