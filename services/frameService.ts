import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface UploadFrameResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload un cadre décoratif (PNG) dans le bucket Supabase `party-frames`.
 * Nécessite un utilisateur authentifié (admin).
 */
export async function uploadDecorativeFramePng(file: File): Promise<UploadFrameResult> {
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
  const path = `frames/${Date.now()}-${Math.random().toString(36).slice(2)}-${filenameSafe}`;

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


