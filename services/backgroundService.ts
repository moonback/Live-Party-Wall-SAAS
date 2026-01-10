import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface UploadBackgroundResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload une image de fond (desktop ou mobile) dans le bucket Supabase `party-backgrounds` pour un événement.
 * Nécessite un utilisateur authentifié (admin).
 * @param eventId - ID de l'événement
 * @param file - Fichier image à uploader
 * @param type - Type d'image de fond ('desktop' ou 'mobile')
 * @returns Promise résolue avec l'URL publique et le chemin du fichier
 */
export async function uploadBackgroundImage(
  eventId: string,
  file: File,
  type: 'desktop' | 'mobile'
): Promise<UploadBackgroundResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  // Valider le type de fichier (images uniquement)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Le fichier doit être une image (JPEG, PNG ou WebP).');
  }

  // Valider la taille (max 10MB)
  const { MAX_FILE_SIZE } = await import('../constants');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux (max 10MB)');
  }

  const filenameSafe = file.name.replace(/[^\w.\-]/g, '_');
  // Organiser par événement : party-backgrounds/{eventId}/background-{type}-{timestamp}-{filename}
  const path = `${eventId}/background-${type}-${Date.now()}-${Math.random().toString(36).slice(2)}-${filenameSafe}`;

  const { error: uploadError } = await supabase.storage
    .from('party-backgrounds')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('party-backgrounds')
    .getPublicUrl(path);

  return { publicUrl, path };
}

/**
 * Supprime une image de fond du bucket Supabase
 * @param eventId - ID de l'événement
 * @param path - Chemin du fichier à supprimer
 */
export async function deleteBackgroundImage(eventId: string, path: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  // Vérifier que le chemin appartient bien à l'événement
  if (!path.startsWith(`${eventId}/`)) {
    throw new Error('Chemin invalide pour cet événement');
  }

  const { error } = await supabase.storage
    .from('party-backgrounds')
    .remove([path]);

  if (error) {
    throw error;
  }
}



