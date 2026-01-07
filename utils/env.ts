import { z } from 'zod';

/**
 * Validation des variables d'environnement avec Zod
 * Lance une erreur au démarrage si les variables requises sont manquantes
 */

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL doit être une URL valide'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY est requis'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY est requis').optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export const getEnv = (): Env => {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
    });
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(
        `❌ Variables d'environnement manquantes ou invalides:\n${missingVars}\n\n` +
        `Veuillez créer un fichier .env avec les variables requises.`
      );
    }
    throw error;
  }
};

// Valider au chargement du module
try {
  getEnv();
} catch (error) {
  // En développement, on affiche l'erreur mais on ne bloque pas
  if (import.meta.env.DEV) {
    console.error(error);
  }
}

