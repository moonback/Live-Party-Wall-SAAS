import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Guest, GuestRow, BlockedGuest, BlockedGuestRow } from '../types';
import { logger } from '../utils/logger';
import { memoryCache } from '../utils/cache';

/**
 * Vérifie si un invité est actuellement bloqué pour un événement
 * @param eventId - ID de l'événement
 * @param guestName - Nom de l'invité à vérifier
 * @returns Promise résolue avec true si bloqué, false sinon
 */
export const isGuestBlocked = async (eventId: string, guestName: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    // Nettoyer d'abord les blocages expirés
    // Si la fonction n'existe pas encore, on continue quand même
    try {
      const { error: rpcError } = await supabase.rpc('cleanup_expired_blocks');
      if (rpcError) {
        // Fonction peut ne pas exister, on ignore l'erreur
        logger.debug("cleanup_expired_blocks RPC not available or failed", rpcError, { component: 'guestService', action: 'isGuestBlocked' });
      }
    } catch (rpcError) {
      // Ignorer les erreurs de RPC (fonction peut ne pas exister)
      logger.debug("cleanup_expired_blocks RPC error", rpcError, { component: 'guestService', action: 'isGuestBlocked' });
    }

    const { data, error } = await supabase
      .from('blocked_guests')
      .select('id, event_id, name, blocked_at, expires_at')
      .eq('event_id', eventId)
      .eq('name', guestName)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      logger.error("Error checking blocked guest", error, { component: 'guestService', action: 'isGuestBlocked', guestName });
      return false;
    }

    return (data && data.length > 0);
  } catch (error) {
    logger.error("Error in isGuestBlocked", error, { component: 'guestService', action: 'isGuestBlocked', guestName });
    return false;
  }
};

/**
 * Récupère les informations de blocage d'un invité pour un événement
 * @param eventId - ID de l'événement
 * @param guestName - Nom de l'invité
 * @returns Promise résolue avec les informations de blocage ou null si non bloqué
 */
export const getBlockedGuestInfo = async (eventId: string, guestName: string): Promise<{ isBlocked: boolean; expiresAt: number | null; remainingMinutes: number | null }> => {
  if (!isSupabaseConfigured()) {
    return { isBlocked: false, expiresAt: null, remainingMinutes: null };
  }

  try {
    const { data, error } = await supabase
      .from('blocked_guests')
      .select('id, event_id, name, blocked_at, expires_at')
      .eq('event_id', eventId)
      .eq('name', guestName)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { isBlocked: false, expiresAt: null, remainingMinutes: null };
    }

    const expiresAt = new Date(data.expires_at).getTime();
    const now = Date.now();
    const remainingMinutes = Math.ceil((expiresAt - now) / (1000 * 60));

    return {
      isBlocked: true,
      expiresAt,
      remainingMinutes: remainingMinutes > 0 ? remainingMinutes : 0
    };
  } catch (error) {
    logger.error("Error in getBlockedGuestInfo", error, { component: 'guestService', action: 'getBlockedGuestInfo', guestName });
    return { isBlocked: false, expiresAt: null, remainingMinutes: null };
  }
};

/**
 * Bloque un invité pendant 20 minutes pour un événement
 * @param eventId - ID de l'événement
 * @param guestName - Nom de l'invité à bloquer
 * @returns Promise résolue si le blocage réussit
 */
export const blockGuest = async (eventId: string, guestName: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de bloquer l'invité.");
  }

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes

    // Supprimer les anciens blocages pour ce nom et cet événement (au cas où)
    await supabase
      .from('blocked_guests')
      .delete()
      .eq('event_id', eventId)
      .eq('name', guestName);

    // Créer un nouveau blocage
    const { error } = await supabase
      .from('blocked_guests')
      .insert([
        {
          event_id: eventId,
          name: guestName,
          blocked_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (error) throw error;
  } catch (error) {
    logger.error("Error in blockGuest", error, { component: 'guestService', action: 'blockGuest', guestName });
    throw error instanceof Error ? error : new Error("Erreur lors du blocage de l'invité");
  }
};

/**
 * Upload un avatar vers Supabase Storage et enregistre l'invité en base de données
 * @param eventId - ID de l'événement
 * @param base64Image - Image en base64 (data URL)
 * @param guestName - Nom de l'invité
 * @returns Promise résolue avec l'objet Guest créé
 */
export const registerGuest = async (
  eventId: string,
  base64Image: string,
  guestName: string
): Promise<Guest> => {
  // Invalider le cache des invités pour cet événement
  memoryCache.invalidate(eventId);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible d'enregistrer l'invité.");
  }

  // Vérifier si l'invité est bloqué
  const blocked = await isGuestBlocked(eventId, guestName);
  if (blocked) {
    const blockInfo = await getBlockedGuestInfo(eventId, guestName);
    const remainingMinutes = blockInfo.remainingMinutes || 0;
    throw new Error(`Vous êtes temporairement bloqué. Réessayez dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`);
  }

  // ⚡ Valider l'image avant l'upload pour éviter les fichiers trop volumineux ou formats invalides
  const { validateBase64Image } = await import('../utils/validation');
  const validation = validateBase64Image(base64Image);
  if (!validation.valid) {
    throw new Error(validation.error || 'Image invalide');
  }

  try {
    // 1. Convert Base64 to Blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // ⚡ Valider le blob également pour double vérification
    const { validateImageBlob } = await import('../utils/validation');
    const blobValidation = validateImageBlob(blob, 'image/jpeg');
    if (!blobValidation.valid) {
      throw new Error(blobValidation.error || 'Blob invalide');
    }

    // 2. Generate filename (utiliser le nom de l'invité pour faciliter l'identification)
    const sanitizedName = guestName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `avatars/${sanitizedName}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // 3. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('party-avatars')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('party-avatars')
      .getPublicUrl(filename);

    // 5. Insert into Database
    const { data, error: insertError } = await supabase
      .from('guests')
      .insert([
        {
          event_id: eventId,
          name: guestName,
          avatar_url: publicUrl
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Return mapped object
    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };

  } catch (error) {
    logger.error("Error in registerGuest", error, { component: 'guestService', action: 'registerGuest', guestName });
    throw error instanceof Error ? error : new Error("Erreur lors de l'enregistrement de l'invité");
  }
};

/**
 * Récupère un invité par son nom pour un événement
 * @param eventId - ID de l'événement
 * @param guestName - Nom de l'invité
 * @returns Promise résolue avec l'invité ou null si non trouvé
 */
export const getGuestByName = async (eventId: string, guestName: string): Promise<Guest | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('guests')
      .select('id, name, avatar_url, created_at, updated_at, event_id')
      .eq('event_id', eventId)
      .eq('name', guestName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    logger.error("Error in getGuestByName", error, { component: 'guestService', action: 'getGuestByName', guestName });
    return null;
  }
};

/**
 * Récupère tous les invités pour un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la liste des invités
 */
export const getAllGuests = async (eventId: string): Promise<Guest[]> => {
  if (!isSupabaseConfigured()) return [];

  // Vérifier le cache
  const cacheKey = `guests:${eventId}`;
  const cached = memoryCache.get<Guest[]>(cacheKey, eventId);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('guests')
      .select('id, name, avatar_url, created_at, updated_at, event_id')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const guests = data.map((row: GuestRow) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime()
    }));

    // Mettre en cache
    memoryCache.set(cacheKey, eventId, guests);
    return guests;
  } catch (error) {
    logger.error("Error in getAllGuests", error, { component: 'guestService', action: 'getAllGuests' });
    return [];
  }
};

/**
 * Met à jour l'avatar d'un invité existant pour un événement
 * @param eventId - ID de l'événement
 * @param guestName - Nom de l'invité
 * @param base64Image - Nouvelle image en base64
 * @returns Promise résolue avec l'invité mis à jour
 */
export const updateGuestAvatar = async (
  eventId: string,
  guestName: string,
  base64Image: string
): Promise<Guest> => {
  // Invalider le cache des invités pour cet événement
  memoryCache.invalidate(eventId);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de mettre à jour l'avatar.");
  }

  try {
    // 1. Récupérer l'invité existant
    const existingGuest = await getGuestByName(eventId, guestName);
    if (!existingGuest) {
      // Si l'invité n'existe pas, créer un nouvel enregistrement
      return await registerGuest(eventId, base64Image, guestName);
    }

    // 2. Convert Base64 to Blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // 3. Generate filename
    const sanitizedName = guestName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `avatars/${sanitizedName}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // 4. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('party-avatars')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('party-avatars')
      .getPublicUrl(filename);

    // 6. Update Database
    const { data, error: updateError } = await supabase
      .from('guests')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingGuest.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };

  } catch (error) {
    logger.error("Error in updateGuestAvatar", error, { component: 'guestService', action: 'updateGuestAvatar', guestName });
    throw error instanceof Error ? error : new Error("Erreur lors de la mise à jour de l'avatar");
  }
};

/**
 * Supprime un invité de la base de données et le bloque pendant 20 minutes
 * @param eventId - ID de l'événement
 * @param guestId - ID de l'invité à supprimer
 * @param guestName - Nom de l'invité (pour le blocage)
 * @returns Promise résolue si la suppression réussit
 */
export const deleteGuest = async (eventId: string, guestId: string, guestName?: string): Promise<void> => {
  // Invalider le cache des invités pour cet événement
  memoryCache.invalidate(eventId);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de supprimer l'invité.");
  }

  try {
    // Récupérer le nom et l'event_id de l'invité si non fourni
    let nameToBlock = guestName;
    let eventIdToUse: string | null = null;
    if (!nameToBlock || !eventId) {
      const { data: guestData, error: fetchError } = await supabase
        .from('guests')
        .select('name, event_id')
        .eq('id', guestId)
        .single();

      if (fetchError || !guestData) {
        throw new Error("Impossible de récupérer les informations de l'invité");
      }
      nameToBlock = guestData.name;
      eventIdToUse = guestData.event_id;
    } else {
      eventIdToUse = eventId;
    }

    // Supprimer l'invité
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) throw error;

    // Bloquer l'invité pendant 20 minutes
    if (nameToBlock && eventIdToUse) {
      try {
        await blockGuest(eventIdToUse, nameToBlock);
      } catch (blockError) {
        // Log l'erreur mais ne fait pas échouer la suppression
        logger.error("Error blocking guest after deletion", blockError, { component: 'guestService', action: 'deleteGuest', guestId, guestName: nameToBlock });
      }
    }
  } catch (error) {
    logger.error("Error in deleteGuest", error, { component: 'guestService', action: 'deleteGuest', guestId });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de l'invité");
  }
};

/**
 * Supprime tous les invités de la base de données (sans les bloquer)
 * @returns Promise résolue si la suppression réussit
 */
export const deleteAllGuests = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de supprimer les invités.");
  }

  try {
    // 1. Récupérer tous les invités pour obtenir leurs IDs
    const { data: allGuests, error: fetchError } = await supabase
      .from('guests')
      .select('id');

    if (fetchError) throw fetchError;

    if (!allGuests || allGuests.length === 0) {
      // Aucun invité à supprimer
      return;
    }

    // 2. Supprimer tous les invités (sans les bloquer)
    const allIds = allGuests.map(g => g.id);
    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .in('id', allIds);

    if (deleteError) throw deleteError;

    logger.info("All guests deleted", { component: 'guestService', action: 'deleteAllGuests', count: allGuests.length });
  } catch (error) {
    logger.error("Error in deleteAllGuests", error, { component: 'guestService', action: 'deleteAllGuests' });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de tous les invités");
  }
};

