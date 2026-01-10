import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, MAX_AUTHOR_NAME_LENGTH, MIN_AUTHOR_NAME_LENGTH, MAX_VIDEO_FILE_SIZE, ALLOWED_VIDEO_TYPES, MAX_VIDEO_DURATION } from '../constants';

export { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, MAX_AUTHOR_NAME_LENGTH, MIN_AUTHOR_NAME_LENGTH, MAX_VIDEO_FILE_SIZE, ALLOWED_VIDEO_TYPES, MAX_VIDEO_DURATION };

/**
 * Valide un fichier image avant l'upload
 * Vérifie la taille (max 20MB pour HD/Full HD) et le type MIME (JPEG, PNG, WebP)
 * 
 * @param file - Le fichier à valider
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `Le fichier est trop volumineux (max ${maxSizeMB}MB)` };
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
  }
  
  return { valid: true };
};

/**
 * Valide une image en base64 avant l'upload
 * Vérifie la taille approximative (max 20MB pour HD/Full HD) et le type MIME
 * 
 * @param base64Image - Image en base64 (data URL ou base64 pur)
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateBase64Image = (base64Image: string): { valid: boolean; error?: string } => {
  if (!base64Image || base64Image.trim().length === 0) {
    return { valid: false, error: 'Aucune image fournie' };
  }

  // Extraire le base64 pur (sans le préfixe data:image/...;base64,)
  const base64Data = base64Image.includes(',') 
    ? base64Image.split(',')[1] 
    : base64Image;

  // Vérifier le type MIME depuis le préfixe data URL
  if (base64Image.startsWith('data:')) {
    const mimeMatch = base64Image.match(/data:([^;]+)/);
    if (mimeMatch) {
      const mimeType = mimeMatch[1];
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
      }
    }
  }

  // Calculer la taille approximative en bytes
  // Base64 augmente la taille d'environ 33%, donc on divise par 1.33 pour obtenir la taille réelle
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  // Soustraire le padding si présent
  const padding = (base64Data.match(/=/g) || []).length;
  const actualSize = sizeInBytes - padding;

  if (actualSize > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `Le fichier est trop volumineux (max ${maxSizeMB}MB)` };
  }

  return { valid: true };
};

/**
 * Valide un Blob d'image avant l'upload
 * Vérifie la taille (max 20MB pour HD/Full HD) et le type MIME
 * 
 * @param blob - Le blob à valider
 * @param expectedMimeType - Type MIME attendu (optionnel, sera vérifié depuis le blob si disponible)
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateImageBlob = (blob: Blob, expectedMimeType?: string): { valid: boolean; error?: string } => {
  if (!blob) {
    return { valid: false, error: 'Aucun blob fourni' };
  }

  if (blob.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `Le fichier est trop volumineux (max ${maxSizeMB}MB)` };
  }

  // Vérifier le type MIME
  const mimeType = expectedMimeType || blob.type;
  if (mimeType && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
  }

  return { valid: true };
};

/**
 * Valide un fichier vidéo avant l'upload
 * Vérifie la taille (max 50MB) et le type MIME (MP4, WebM, QuickTime)
 * 
 * @param file - Le fichier vidéo à valider
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return { valid: false, error: 'Le fichier vidéo est trop volumineux (max 50MB)' };
  }
  
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'Type de fichier vidéo non autorisé. Utilisez MP4, WebM ou QuickTime.' };
  }
  
  return { valid: true };
};

/**
 * Valide un Blob vidéo avant l'upload
 * Vérifie la taille (max 50MB) et le type MIME
 * 
 * @param blob - Le blob vidéo à valider
 * @param expectedMimeType - Type MIME attendu (optionnel, sera vérifié depuis le blob si disponible)
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateVideoBlob = (blob: Blob, expectedMimeType?: string): { valid: boolean; error?: string } => {
  if (!blob) {
    return { valid: false, error: 'Aucun blob fourni' };
  }

  if (blob.size > MAX_VIDEO_FILE_SIZE) {
    return { valid: false, error: 'Le fichier vidéo est trop volumineux (max 50MB)' };
  }

  // Vérifier le type MIME
  const mimeType = expectedMimeType || blob.type;
  if (mimeType && !ALLOWED_VIDEO_TYPES.includes(mimeType as any)) {
    return { valid: false, error: 'Type de fichier vidéo non autorisé. Utilisez MP4, WebM ou QuickTime.' };
  }

  return { valid: true };
};

/**
 * Valide la durée d'une vidéo (en secondes)
 */
export const validateVideoDuration = (duration: number): { valid: boolean; error?: string } => {
  if (duration > MAX_VIDEO_DURATION) {
    return { valid: false, error: `La vidéo ne peut pas dépasser ${MAX_VIDEO_DURATION} secondes` };
  }
  
  if (duration <= 0) {
    return { valid: false, error: 'La durée de la vidéo doit être supérieure à 0' };
  }
  
  return { valid: true };
};

export const validateAuthorName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (trimmed.length < MIN_AUTHOR_NAME_LENGTH) {
    return { valid: false, error: 'Le nom est requis' };
  }
  
  if (trimmed.length > MAX_AUTHOR_NAME_LENGTH) {
    return { valid: false, error: `Le nom ne peut pas dépasser ${MAX_AUTHOR_NAME_LENGTH} caractères` };
  }
  
  // Sanitize pour éviter XSS
  const sanitized = trimmed.replace(/[<>]/g, '');
  if (sanitized !== trimmed) {
    return { valid: false, error: 'Le nom contient des caractères invalides' };
  }
  
  return { valid: true };
};

