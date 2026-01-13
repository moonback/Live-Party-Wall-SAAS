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
 * Upload un logo dans le bucket Supabase `party-backgrounds` pour un événement.
 * Nécessite un utilisateur authentifié (admin).
 * @param eventId - ID de l'événement
 * @param file - Fichier image à uploader
 * @returns Promise résolue avec l'URL publique et le chemin du fichier
 */
export async function uploadLogoImage(
  eventId: string,
  file: File
): Promise<UploadBackgroundResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  // Valider le type de fichier (images uniquement, avec support pour SVG)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Le fichier doit être une image (JPEG, PNG, WebP ou SVG).');
  }

  // Valider la taille (max 5MB pour les logos, plus petit que les backgrounds)
  const { MAX_FILE_SIZE } = await import('../constants');
  const maxLogoSize = Math.min(MAX_FILE_SIZE, 5 * 1024 * 1024); // 5MB max
  if (file.size > maxLogoSize) {
    throw new Error('Le fichier est trop volumineux (max 5MB)');
  }

  const filenameSafe = file.name.replace(/[^\w.\-]/g, '_');
  // Organiser par événement : party-backgrounds/{eventId}/logo-{timestamp}-{filename}
  const path = `${eventId}/logo-${Date.now()}-${Math.random().toString(36).slice(2)}-${filenameSafe}`;

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
 * Interface pour les images de fond dans l'historique
 */
export interface BackgroundImageHistory {
  path: string;
  publicUrl: string;
  type: 'desktop' | 'mobile';
  createdAt: Date;
  name: string;
}

/**
 * Liste toutes les images de fond d'un événement (historique)
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la liste des images de fond triées par date (plus récentes en premier)
 */
export async function listBackgroundImages(eventId: string): Promise<BackgroundImageHistory[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  const { data, error } = await supabase.storage
    .from('party-backgrounds')
    .list(eventId, {
      sortBy: { column: 'created_at', order: 'desc' },
      limit: 1000
    });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Filtrer uniquement les images de fond (pas les logos)
  const backgroundFiles = data.filter(file => 
    file.name.startsWith('background-') && 
    (file.name.includes('-desktop-') || file.name.includes('-mobile-'))
  );

  // Mapper les fichiers en BackgroundImageHistory
  const backgrounds: BackgroundImageHistory[] = backgroundFiles.map(file => {
    const path = `${eventId}/${file.name}`;
    const { data: { publicUrl } } = supabase.storage
      .from('party-backgrounds')
      .getPublicUrl(path);

    // Extraire le type depuis le nom du fichier
    const type: 'desktop' | 'mobile' = file.name.includes('-desktop-') ? 'desktop' : 'mobile';
    
    // Extraire le timestamp depuis le nom du fichier (format: background-{type}-{timestamp}-...)
    const timestampMatch = file.name.match(/background-(?:desktop|mobile)-(\d+)-/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : file.created_at ? new Date(file.created_at).getTime() : Date.now();

    return {
      path,
      publicUrl,
      type,
      createdAt: new Date(timestamp),
      name: file.name
    };
  });

  // Trier par date (plus récentes en premier)
  return backgrounds.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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



