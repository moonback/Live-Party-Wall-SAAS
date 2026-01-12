import { createClient } from '@supabase/supabase-js';

// Client Supabase séparé pour la base de données des licences
// Utilise des variables d'environnement distinctes
const licenseSupabaseUrl = import.meta.env.VITE_LICENSE_SUPABASE_URL;
const licenseSupabaseKey = import.meta.env.VITE_LICENSE_SUPABASE_ANON_KEY;

/**
 * Vérifie si le client Supabase des licences est configuré
 */
export const isLicenseSupabaseConfigured = (): boolean => {
  return !!licenseSupabaseUrl && !!licenseSupabaseKey;
};

/**
 * Client Supabase pour la base de données des licences
 * Retourne null si non configuré
 */
export const licenseSupabase = licenseSupabaseUrl && licenseSupabaseKey
  ? createClient(licenseSupabaseUrl, licenseSupabaseKey)
  : null;

