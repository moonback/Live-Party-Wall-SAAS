import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface UploadFrameResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload un cadre décoratif (PNG) dans le bucket Supabase `party-frames` pour un événement.
 * Nécessite un utilisateur authentifié (admin).
 * @param eventId - ID de l'événement
 */
export async function uploadDecorativeFramePng(eventId: string, file: File): Promise<UploadFrameResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  // ⚡ Valider le fichier avant l'upload : type PNG et taille max 10MB
  if (file.type !== 'image/png') {
    throw new Error('Le cadre doit être un fichier PNG.');
  }

  const { MAX_FILE_SIZE } = await import('../constants');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux (max 10MB)');
  }

  const filenameSafe = file.name.replace(/[^\w.\-]/g, '_');
  // Organiser par événement : party-frames/{eventId}/frames/{filename}
  const path = `${eventId}/frames/${Date.now()}-${Math.random().toString(36).slice(2)}-${filenameSafe}`;

  const { error: uploadError } = await supabase.storage
    .from('party-frames')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/png'
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('party-frames')
    .getPublicUrl(path);

  return { publicUrl, path };
}


