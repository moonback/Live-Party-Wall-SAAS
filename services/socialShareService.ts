/**
 * Service de partage sur les réseaux sociaux
 */

import { logger } from '../utils/logger';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  file?: File | Blob;
  files?: File[];
}

/**
 * Télécharge un fichier depuis une URL et le convertit en File
 * @param url - URL du fichier à télécharger
 * @param filename - Nom du fichier (optionnel)
 * @param mimeType - Type MIME du fichier (optionnel)
 * @returns Promise résolue avec le File ou null en cas d'erreur
 */
export async function downloadFileFromUrl(
  url: string,
  filename?: string,
  mimeType?: string
): Promise<File | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const blob = await response.blob();
    const finalMimeType = mimeType || blob.type || 'application/octet-stream';
    const finalFilename = filename || `shared-file-${Date.now()}`;

    // Créer un File à partir du Blob
    const file = new File([blob], finalFilename, { type: finalMimeType });
    return file;
  } catch (error) {
    logger.error('Erreur lors du téléchargement du fichier', error, {
      component: 'socialShareService',
      action: 'downloadFileFromUrl',
      url
    });
    return null;
  }
}

/**
 * Vérifie si le navigateur supporte le partage de fichiers
 */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    navigator.canShare({ files: [new File([''], 'test', { type: 'image/jpeg' })] })
  );
}

/**
 * Type pour les données de partage (étend ShareData pour inclure files)
 */
interface ExtendedShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Partage natif via Web Share API
 * Supporte le partage de fichiers (images, vidéos) sur mobile
 */
export async function nativeShare(options: ShareOptions): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    const shareData: ExtendedShareData = {
      title: options.title,
      text: options.text,
      url: options.url
    };

    // Gérer le partage de fichiers
    if (options.files && options.files.length > 0) {
      if (navigator.canShare && navigator.canShare({ files: options.files })) {
        shareData.files = options.files;
        // Ne pas inclure l'URL si on partage des fichiers
        delete shareData.url;
      } else {
        logger.warn('Le navigateur ne supporte pas le partage de fichiers', {
          component: 'socialShareService',
          action: 'nativeShare'
        });
        return false;
      }
    } else if (options.file) {
      if (navigator.canShare && navigator.canShare({ files: [options.file as File] })) {
        shareData.files = [options.file as File];
        delete shareData.url;
      } else {
        logger.warn('Le navigateur ne supporte pas le partage de fichiers', {
          component: 'socialShareService',
          action: 'nativeShare'
        });
        return false;
      }
    }

    await navigator.share(shareData as ShareData);
    return true;
  } catch (error) {
    // AbortError signifie que l'utilisateur a annulé le partage, ce n'est pas une erreur
    if ((error as Error).name !== 'AbortError') {
      logger.error('Erreur lors du partage', error, {
        component: 'socialShareService',
        action: 'nativeShare'
      });
    }
    return false;
  }
}

/**
 * Partage une photo ou vidéo via l'API Web Share
 * Télécharge automatiquement le fichier depuis l'URL si nécessaire
 * @param url - URL de la photo/vidéo
 * @param title - Titre du partage
 * @param text - Texte du partage
 * @param filename - Nom du fichier (optionnel)
 * @param mimeType - Type MIME (optionnel, détecté automatiquement)
 * @returns Promise résolue avec true si le partage a réussi, false sinon
 */
export async function sharePhotoOrVideo(
  url: string,
  title?: string,
  text?: string,
  filename?: string,
  mimeType?: string
): Promise<boolean> {
  // Vérifier si le navigateur supporte le partage de fichiers
  if (!canShareFiles()) {
    // Fallback: partage de l'URL uniquement
    return nativeShare({
      title: title || 'Photo',
      text: text || 'Regardez cette photo !',
      url
    });
  }

  // Télécharger le fichier depuis l'URL
  const file = await downloadFileFromUrl(url, filename, mimeType);
  if (!file) {
    // Fallback: partage de l'URL si le téléchargement échoue
    return nativeShare({
      title: title || 'Photo',
      text: text || 'Regardez cette photo !',
      url
    });
  }

  // Partager le fichier
  return nativeShare({
    title: title || 'Photo',
    text: text || 'Regardez cette photo !',
    files: [file]
  });
}

/**
 * Partage un aftermovie (vidéo) via l'API Web Share
 * @param url - URL de l'aftermovie
 * @param title - Titre de l'aftermovie
 * @param text - Texte du partage
 * @returns Promise résolue avec true si le partage a réussi, false sinon
 */
export async function shareAftermovie(
  url: string,
  title?: string,
  text?: string
): Promise<boolean> {
  return sharePhotoOrVideo(
    url,
    title || 'Aftermovie',
    text || 'Regardez notre aftermovie !',
    `aftermovie-${Date.now()}.mp4`,
    'video/mp4'
  );
}

/**
 * Partage sur Instagram
 */
export function shareToInstagram(aftermovieUrl: string, isMobile: boolean = false): void {
  if (isMobile && navigator.share) {
    nativeShare({
      title: 'Aftermovie',
      text: 'Regardez notre aftermovie !',
      url: aftermovieUrl
    });
  } else {
    // Sur desktop, ouvrir Instagram dans un nouvel onglet
    // Note: Instagram ne permet pas le partage direct depuis le web
    // Il faut télécharger la vidéo et l'uploader manuellement
    window.open('https://www.instagram.com/', '_blank');
  }
}

/**
 * Partage sur TikTok
 */
export function shareToTikTok(aftermovieUrl: string): void {
  // TikTok ne permet pas le partage direct depuis le web
  // Redirection vers la page d'upload
  window.open('https://www.tiktok.com/upload', '_blank');
}

/**
 * Partage sur YouTube
 */
export function shareToYouTube(aftermovieUrl: string): void {
  // Redirection vers YouTube Studio
  window.open('https://studio.youtube.com/', '_blank');
}

/**
 * Partage sur Facebook
 */
export function shareToFacebook(aftermovieUrl: string): void {
  const encodedUrl = encodeURIComponent(aftermovieUrl);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
}

/**
 * Partage sur Twitter/X
 */
export function shareToTwitter(aftermovieUrl: string, text?: string): void {
  const tweetText = text || 'Regardez notre aftermovie !';
  const encodedText = encodeURIComponent(tweetText);
  const encodedUrl = encodeURIComponent(aftermovieUrl);
  window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
}

/**
 * Partage par email
 */
export function shareByEmail(aftermovieUrl: string, subject?: string, body?: string): void {
  const emailSubject = subject || 'Aftermovie de l\'événement';
  const emailBody = body || `Regardez notre aftermovie : ${aftermovieUrl}`;
  const encodedSubject = encodeURIComponent(emailSubject);
  const encodedBody = encodeURIComponent(emailBody);
  window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Copie le lien dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback pour navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Télécharge la vidéo (pour partage manuel)
 */
export function downloadVideo(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


