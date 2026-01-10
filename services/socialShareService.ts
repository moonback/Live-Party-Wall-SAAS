/**
 * Service de partage sur les réseaux sociaux
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
  file?: File | Blob;
}

/**
 * Partage natif via Web Share API
 */
export async function nativeShare(options: ShareOptions): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    const shareData: ShareData = {
      title: options.title || 'Aftermovie',
      text: options.text || 'Regardez notre aftermovie !',
      url: options.url
    };

    if (options.file && navigator.canShare && navigator.canShare({ files: [options.file as File] })) {
      shareData.files = [options.file as File];
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Erreur lors du partage:', error);
    }
    return false;
  }
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

