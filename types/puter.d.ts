/**
 * Types TypeScript pour Puter.js
 * Déclaration globale pour l'API Puter.js
 */

interface PuterAI {
  /**
   * Génère une image à partir d'un prompt texte
   * @param prompt - Description de l'image à générer
   * @param options - Options de génération (modèle, qualité, etc.)
   * @returns Promise résolue avec un HTMLImageElement
   */
  txt2img(
    prompt: string,
    options?: {
      model?: string;
      quality?: 'low' | 'medium' | 'high' | 'hd' | 'standard';
    }
  ): Promise<HTMLImageElement>;
}

interface Puter {
  ai: PuterAI;
}

declare global {
  interface Window {
    puter?: Puter;
  }
}

export {};

