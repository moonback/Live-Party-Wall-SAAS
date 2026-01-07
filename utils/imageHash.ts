/**
 * Utilitaires pour générer des hash d'images
 * Utilisé pour le cache des analyses Gemini (évite les appels API pour images identiques)
 */

/**
 * Génère un hash SHA-256 d'une image base64
 * @param base64Image - Image en base64 (avec ou sans prefix data:image/...)
 * @returns Promise<string> - Hash hexadécimal de l'image
 */
export async function getImageHash(base64Image: string): Promise<string> {
  try {
    // Nettoyer le base64 (enlever le prefix si présent)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    // Convertir base64 en ArrayBuffer
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Générer le hash SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    // Convertir en hexadécimal
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback : utiliser un hash simple basé sur la longueur et les premiers caractères
    // Moins fiable mais fonctionne même si crypto.subtle n'est pas disponible
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const hash = btoa(cleanBase64.slice(0, 100)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    return hash;
  }
}

/**
 * Génère un hash rapide (non cryptographique) pour le cache
 * Plus rapide que SHA-256 mais moins fiable (risque de collision)
 * Utilisé pour un cache temporaire en mémoire
 * @param base64Image - Image en base64
 * @returns string - Hash simple
 */
export function getImageHashSimple(base64Image: string): string {
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  // Utiliser les premiers et derniers caractères + longueur
  const start = cleanBase64.slice(0, 50);
  const end = cleanBase64.slice(-50);
  const length = cleanBase64.length.toString();
  const combined = `${start}${end}${length}`;
  
  // Hash simple (non cryptographique)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

