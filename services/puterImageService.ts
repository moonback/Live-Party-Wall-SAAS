/**
 * Service pour générer des images avec Puter.js (IA)
 * Documentation: https://developer.puter.com/tutorials/free-unlimited-image-generation-api/
 */

// Déclaration globale pour Puter.js
declare global {
  interface Window {
    puter?: {
      ai: {
        txt2img: (
          prompt: string,
          options?: {
            model?: string;
            quality?: string;
          }
        ) => Promise<HTMLImageElement>;
      };
    };
  }
}

export interface PuterImageOptions {
  model?: string;
  quality?: 'low' | 'medium' | 'high' | 'hd' | 'standard';
}

/**
 * Vérifie si Puter.js est chargé et disponible
 * @returns true si Puter.js est disponible, false sinon
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.puter !== 'undefined' && 
         typeof window.puter.ai !== 'undefined' &&
         typeof window.puter.ai.txt2img === 'function';
}

/**
 * Génère une image avec Puter.js à partir d'un prompt texte
 * @param prompt - Description de l'image à générer
 * @param options - Options de génération (modèle, qualité)
 * @returns Promise résolue avec l'élément HTMLImageElement généré
 * @throws Error si Puter.js n'est pas disponible ou si la génération échoue
 */
export async function generateImage(
  prompt: string,
  options: PuterImageOptions = {}
): Promise<HTMLImageElement> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js n\'est pas disponible. Vérifiez que le script est chargé.');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Le prompt ne peut pas être vide.');
  }

  try {
    const defaultOptions = {
      model: options.model || 'gpt-image-1',
      quality: options.quality || 'low'
    };

    // Appel à l'API Puter.js
    const imageElement = await window.puter!.ai.txt2img(prompt, defaultOptions);
    
    return imageElement;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Erreur lors de la génération d'image: ${errorMessage}`);
  }
}

/**
 * Liste des modèles d'image supportés par Puter.js
 */
export const PUTER_IMAGE_MODELS = [
  { value: 'gpt-image-1', label: 'GPT Image 1 (Rapide)' },
  { value: 'gpt-image-1-mini', label: 'GPT Image 1 Mini' },
  { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
  { value: 'dall-e-2', label: 'DALL-E 2' },
  { value: 'dall-e-3', label: 'DALL-E 3 (HD)' },
  { value: 'gemini-2.5-flash-image-preview', label: 'Gemini 2.5 Flash (Nano Banana)' },
  { value: 'stabilityai/stable-diffusion-3-medium', label: 'Stable Diffusion 3' },
  { value: 'black-forest-labs/FLUX.1-schnell', label: 'Flux.1 Schnell' },
  { value: 'black-forest-labs/FLUX.1.1-pro', label: 'Flux 1.1 Pro' },
] as const;

/**
 * Options de qualité par modèle
 */
export const MODEL_QUALITY_OPTIONS: Record<string, Array<'low' | 'medium' | 'high' | 'hd' | 'standard'>> = {
  'gpt-image-1': ['low', 'medium', 'high'],
  'gpt-image-1-mini': ['low', 'medium', 'high'],
  'dall-e-3': ['standard', 'hd'],
  'gemini-2.5-flash-image-preview': [], // Pas de qualité
};

