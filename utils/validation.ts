import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, MAX_AUTHOR_NAME_LENGTH, MIN_AUTHOR_NAME_LENGTH } from '../constants';

export { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, MAX_AUTHOR_NAME_LENGTH, MIN_AUTHOR_NAME_LENGTH };

/**
 * Valide un fichier image avant l'upload
 * Vérifie la taille (max 10MB) et le type MIME (JPEG, PNG, WebP)
 * 
 * @param file - Le fichier à valider
 * @returns Objet avec valid (boolean) et error (string optionnel)
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Le fichier est trop volumineux (max 10MB)' };
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
  }
  
  return { valid: true };
};

/**
 * Valide une image en base64 avant l'upload
 * Vérifie la taille approximative (max 10MB) et le type MIME
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
    return { valid: false, error: 'Le fichier est trop volumineux (max 10MB)' };
  }

  return { valid: true };
};

/**
 * Valide un Blob d'image avant l'upload
 * Vérifie la taille (max 10MB) et le type MIME
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
    return { valid: false, error: 'Le fichier est trop volumineux (max 10MB)' };
  }

  // Vérifier le type MIME
  const mimeType = expectedMimeType || blob.type;
  if (mimeType && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
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

