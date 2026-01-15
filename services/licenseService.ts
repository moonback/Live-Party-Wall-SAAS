import { supabase, isSupabaseConfigured } from './supabaseClient';
import { licenseSupabase, isLicenseSupabaseConfigured } from './licenseSupabaseClient';
import { License, LicenseRow, LicenseValidity, LicenseUpdate, LicenseStatus } from '../types';
import { logger } from '../utils/logger';
import { isElectron } from '../utils/electronPaths';
import { isDemoLicense } from '../utils/licenseUtils';

/**
 * Vérifie la validité de la licence pour l'utilisateur actuel
 * @param userId - ID de l'utilisateur (optionnel, utilise auth.uid() si non fourni)
 * @returns Promise résolue avec les informations de validité de la licence
 */
export const checkLicenseValidity = async (userId?: string): Promise<LicenseValidity> => {
  if (!isSupabaseConfigured()) {
    // Sur Electron, on bloque l'accès si Supabase n'est pas configuré
    if (isElectron()) {
      logger.error("Supabase not configured in Electron, blocking access", null, { component: 'licenseService', action: 'checkLicenseValidity' });
      return {
        is_valid: false,
        license_id: null,
        expires_at: null,
        status: null,
        days_remaining: null
      };
    }
    // En mode développement web sans Supabase, on peut permettre l'accès
    logger.warn("Supabase not configured, allowing access", null, { component: 'licenseService', action: 'checkLicenseValidity' });
    return {
      is_valid: true,
      license_id: null,
      expires_at: null,
      status: null,
      days_remaining: null
    };
  }

  try {
    // Récupérer l'ID utilisateur depuis la session si non fourni
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        logger.error("User not authenticated", sessionError, { component: 'licenseService', action: 'checkLicenseValidity' });
        return {
          is_valid: false,
          license_id: null,
          expires_at: null,
          status: null,
          days_remaining: null
        };
      }
      finalUserId = session.user.id;
    }

    // Appeler la fonction SQL pour vérifier la validité
    const { data, error } = await supabase
      .rpc('check_license_validity', { user_uuid: finalUserId });

    if (error) {
      logger.error("Error checking license validity", error, { 
        component: 'licenseService', 
        action: 'checkLicenseValidity',
        userId: finalUserId 
      });
      // En cas d'erreur, on bloque l'accès par sécurité
      return {
        is_valid: false,
        license_id: null,
        expires_at: null,
        status: null,
        days_remaining: null
      };
    }

    if (!data || data.length === 0) {
      // Aucune licence active trouvée
      logger.warn("No active license found", null, { 
        component: 'licenseService', 
        action: 'checkLicenseValidity',
        userId: finalUserId 
      });
      return {
        is_valid: false,
        license_id: null,
        expires_at: null,
        status: null,
        days_remaining: null
      };
    }

    const result = data[0];
    return {
      is_valid: result.is_valid,
      license_id: result.license_id,
      expires_at: result.expires_at,
      status: result.status,
      days_remaining: result.days_remaining
    };
  } catch (error) {
    logger.error("Error in checkLicenseValidity", error, { component: 'licenseService', action: 'checkLicenseValidity' });
    // En cas d'erreur, on bloque l'accès par sécurité
    return {
      is_valid: false,
      license_id: null,
      expires_at: null,
      status: null,
      days_remaining: null
    };
  }
};

/**
 * Met à jour la date de dernière vérification de la licence
 * @param licenseId - ID de la licence
 * @returns Promise résolue si la mise à jour réussit
 */
export const updateLicenseLastCheck = async (licenseId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from('licenses')
      .update({ last_check_at: new Date().toISOString() })
      .eq('id', licenseId);

    if (error) {
      logger.error("Error updating license last check", error, { 
        component: 'licenseService', 
        action: 'updateLicenseLastCheck',
        licenseId 
      });
    }
  } catch (error) {
    logger.error("Error in updateLicenseLastCheck", error, { 
      component: 'licenseService', 
      action: 'updateLicenseLastCheck',
      licenseId 
    });
  }
};

/**
 * Récupère la licence active d'un utilisateur
 * @param userId - ID de l'utilisateur (optionnel, utilise auth.uid() si non fourni)
 * @returns Promise résolue avec la licence ou null si non trouvée
 */
export const getActiveLicense = async (userId?: string): Promise<License | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        logger.error("User not authenticated", sessionError, { component: 'licenseService', action: 'getActiveLicense' });
        return null;
      }
      finalUserId = session.user.id;
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching active license", error, { 
        component: 'licenseService', 
        action: 'getActiveLicense',
        userId: finalUserId 
      });
      return null;
    }

    if (!data) return null;

    return mapLicenseRowToLicense(data as LicenseRow);
  } catch (error) {
    logger.error("Error in getActiveLicense", error, { component: 'licenseService', action: 'getActiveLicense' });
    return null;
  }
};

/**
 * Crée une nouvelle licence pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @param expiresAt - Date d'expiration (ISO string)
 * @param licenseKey - Clé de licence (optionnel, générée automatiquement si non fourni)
 * @param notes - Notes optionnelles
 * @returns Promise résolue avec la licence créée
 */
export const createLicense = async (
  userId: string,
  expiresAt: string,
  licenseKey?: string,
  notes?: string
): Promise<License> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de créer la licence.");
  }

  // Générer une clé de licence si non fournie
  const finalLicenseKey = licenseKey || generateLicenseKey();

  // Si c'est une licence DEMO, calculer automatiquement l'expiration à 24h (ignorer expiresAt fourni)
  let finalExpiresAt = expiresAt;
  if (isDemoLicense(finalLicenseKey)) {
    const now = new Date();
    const expiresIn24h = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h calendaires
    finalExpiresAt = expiresIn24h.toISOString();
    logger.info("DEMO license detected, setting expiration to 24h from now", null, {
      component: 'licenseService',
      action: 'createLicense',
      expiresAt: finalExpiresAt
    });
  }

  try {
    const { data, error } = await supabase
      .from('licenses')
      .insert([
        {
          user_id: userId,
          license_key: finalLicenseKey,
          status: 'active',
          expires_at: finalExpiresAt,
          activated_at: new Date().toISOString(),
          notes: notes || null
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error("Error creating license", error, { 
        component: 'licenseService', 
        action: 'createLicense',
        userId 
      });
      
      if (error.code === '23505') { // Unique violation
        throw new Error("Une licence avec cette clé existe déjà.");
      }
      
      throw error;
    }

    return mapLicenseRowToLicense(data as LicenseRow);
  } catch (error) {
    logger.error("Error in createLicense", error, { component: 'licenseService', action: 'createLicense', userId });
    throw error instanceof Error ? error : new Error("Erreur lors de la création de la licence");
  }
};

/**
 * Met à jour une licence
 * @param licenseId - ID de la licence
 * @param updates - Objet avec les champs à mettre à jour
 * @returns Promise résolue avec la licence mise à jour
 */
export const updateLicense = async (
  licenseId: string,
  updates: LicenseUpdate
): Promise<License | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de mettre à jour la licence.");
  }

  try {
    const { data, error } = await supabase
      .from('licenses')
      .update(updates)
      .eq('id', licenseId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating license", error, { 
        component: 'licenseService', 
        action: 'updateLicense',
        licenseId 
      });
      throw error;
    }

    return data ? mapLicenseRowToLicense(data as LicenseRow) : null;
  } catch (error) {
    logger.error("Error in updateLicense", error, { component: 'licenseService', action: 'updateLicense', licenseId });
    throw error instanceof Error ? error : new Error("Erreur lors de la mise à jour de la licence");
  }
};

/**
 * Récupère toutes les licences (pour l'administration)
 * @returns Promise résolue avec la liste de toutes les licences
 */
export const getAllLicenses = async (): Promise<License[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching all licenses", error, { 
        component: 'licenseService', 
        action: 'getAllLicenses' 
      });
      return [];
    }

    return (data || []).map((row: LicenseRow) => mapLicenseRowToLicense(row));
  } catch (error) {
    logger.error("Error in getAllLicenses", error, { component: 'licenseService', action: 'getAllLicenses' });
    return [];
  }
};

/**
 * Récupère une licence par son ID
 * @param licenseId - ID de la licence
 * @returns Promise résolue avec la licence ou null si non trouvée
 */
export const getLicenseById = async (licenseId: string): Promise<License | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching license by ID", error, { 
        component: 'licenseService', 
        action: 'getLicenseById',
        licenseId 
      });
      return null;
    }

    if (!data) return null;

    return mapLicenseRowToLicense(data as LicenseRow);
  } catch (error) {
    logger.error("Error in getLicenseById", error, { component: 'licenseService', action: 'getLicenseById', licenseId });
    return null;
  }
};

/**
 * Récupère toutes les licences d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec la liste des licences de l'utilisateur
 */
export const getUserLicenses = async (userId: string): Promise<License[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching user licenses", error, { 
        component: 'licenseService', 
        action: 'getUserLicenses',
        userId 
      });
      return [];
    }

    return (data || []).map((row: LicenseRow) => mapLicenseRowToLicense(row));
  } catch (error) {
    logger.error("Error in getUserLicenses", error, { component: 'licenseService', action: 'getUserLicenses', userId });
    return [];
  }
};

/**
 * Supprime une licence
 * @param licenseId - ID de la licence à supprimer
 * @returns Promise résolue si la suppression réussit
 */
export const deleteLicense = async (licenseId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de supprimer la licence.");
  }

  try {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);

    if (error) {
      logger.error("Error deleting license", error, { 
        component: 'licenseService', 
        action: 'deleteLicense',
        licenseId 
      });
      throw error;
    }
  } catch (error) {
    logger.error("Error in deleteLicense", error, { component: 'licenseService', action: 'deleteLicense', licenseId });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de la licence");
  }
};

/**
 * Récupère la liste de tous les utilisateurs avec leurs emails
 * Utilise la fonction RPC get_users_list() qui accède à auth.users
 * @returns Promise résolue avec la liste des utilisateurs (id, email)
 */
export const getUsersList = async (): Promise<Array<{ id: string; email?: string }>> => {
  if (!isSupabaseConfigured()) return [];

  try {
    // Essayer d'abord d'utiliser la fonction RPC si elle existe
    const { data, error } = await supabase
      .rpc('get_users_list');

    if (!error && data) {
      return data.map((row: { id: string; email: string }) => ({
        id: row.id,
        email: row.email
      }));
    }

    // Fallback: Récupérer les utilisateurs depuis event_organizers et events
    // Si la fonction RPC n'existe pas encore
    logger.warn("RPC get_users_list not available, using fallback", null, { 
      component: 'licenseService', 
      action: 'getUsersList' 
    });

    const usersMap = new Map<string, { id: string; email?: string }>();

    // Récupérer depuis event_organizers
    const { data: organizersData } = await supabase
      .from('event_organizers')
      .select('user_id')
      .order('user_id');

    if (organizersData) {
      organizersData.forEach((row: any) => {
        if (row.user_id && !usersMap.has(row.user_id)) {
          usersMap.set(row.user_id, { id: row.user_id });
        }
      });
    }

    // Récupérer aussi les owners depuis events
    const { data: eventsData } = await supabase
      .from('events')
      .select('owner_id')
      .order('owner_id');

    if (eventsData) {
      eventsData.forEach((row: any) => {
        if (row.owner_id && !usersMap.has(row.owner_id)) {
          usersMap.set(row.owner_id, { id: row.owner_id });
        }
      });
    }

    return Array.from(usersMap.values());
  } catch (error) {
    logger.error("Error in getUsersList", error, { component: 'licenseService', action: 'getUsersList' });
    return [];
  }
};

/**
 * Génère une clé de licence unique
 * @returns Clé de licence générée
 */
const generateLicenseKey = (): string => {
  const prefix = 'PW';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Interface pour les licences dans la base Supabase séparée
 * Structure correspondant à la table licenses réelle
 */
export interface ExternalLicense {
  id: string;
  user_id: string;
  license_key: string;
  plan_name: string;
  plan_type: 'event' | 'monthly' | 'lifetime';
  status: 'active' | 'expired' | 'revoked' | 'cancelled';
  purchase_date: string;
  expires_at: string | null;
  features: any[] | null; // JSONB array
  metadata: Record<string, any> | null; // JSONB object
  created_at: string;
  updated_at: string;
}

/**
 * Vérifie une licence par clé dans la base Supabase séparée
 * @param licenseKey - Clé de licence à vérifier
 * @param userEmail - Email de l'utilisateur pour vérifier la correspondance (optionnel)
 * @returns Promise résolue avec les informations de la licence ou null si non trouvée/invalide
 */
export const verifyLicenseByKey = async (
  licenseKey: string,
  userEmail?: string
): Promise<ExternalLicense | null> => {
  if (!isLicenseSupabaseConfigured() || !licenseSupabase) {
    logger.warn("License Supabase not configured, cannot verify license", null, { 
      component: 'licenseService', 
      action: 'verifyLicenseByKey' 
    });
    return null;
  }

  if (!licenseKey || !licenseKey.trim()) {
    logger.warn("Empty license key provided", null, { 
      component: 'licenseService', 
      action: 'verifyLicenseByKey' 
    });
    return null;
  }

  try {
    // Rechercher la licence par clé dans la base de données externe
    // Cette vérification se fait dans la base Supabase séparée (licenses)
    logger.info("Verifying license in external database", null, {
      component: 'licenseService',
      action: 'verifyLicenseByKey',
      licenseKey: licenseKey.substring(0, 10) + '...'
    });

    const { data, error } = await licenseSupabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      logger.error("Error verifying license by key in external database", error, { 
        component: 'licenseService', 
        action: 'verifyLicenseByKey',
        licenseKey: licenseKey.substring(0, 10) + '...',
        errorCode: error.code,
        errorMessage: error.message
      });
      return null;
    }

    if (!data) {
      logger.warn("License not found in external database", null, { 
        component: 'licenseService', 
        action: 'verifyLicenseByKey',
        licenseKey: licenseKey.substring(0, 10) + '...'
      });
      return null;
    }

    logger.info("License found in external database", null, {
      component: 'licenseService',
      action: 'verifyLicenseByKey',
      licenseId: data.id,
      status: data.status,
      planName: data.plan_name
    });

    // Vérifier que la licence est active
    if (data.status !== 'active') {
      logger.warn("License is not active", null, { 
        component: 'licenseService', 
        action: 'verifyLicenseByKey',
        status: data.status,
        licenseKey: licenseKey.substring(0, 10) + '...'
      });
      return null;
    }

    // Si c'est une licence DEMO et qu'aucune expiration n'est définie, calculer automatiquement à 24h
    let finalExpiresAt = data.expires_at;
    if (isDemoLicense(data.license_key) && !data.expires_at) {
      const now = new Date();
      const expiresIn24h = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h calendaires
      finalExpiresAt = expiresIn24h.toISOString();
      logger.info("DEMO license detected without expiration, setting expiration to 24h from now", null, {
        component: 'licenseService',
        action: 'verifyLicenseByKey',
        expiresAt: finalExpiresAt
      });
    }

    // Vérifier que la licence n'est pas expirée (si expires_at est défini)
    if (finalExpiresAt) {
      const expiresAt = new Date(finalExpiresAt);
      const now = new Date();
      if (expiresAt < now) {
        logger.warn("License has expired", null, { 
          component: 'licenseService', 
          action: 'verifyLicenseByKey',
          expiresAt: finalExpiresAt,
          licenseKey: licenseKey.substring(0, 10) + '...'
        });
        return null;
      }
    }

    // Note: L'email n'est pas stocké directement dans la table licenses
    // Il faudrait faire une jointure avec la table profiles via user_id si nécessaire
    // Pour l'instant, on ne vérifie pas l'email car il n'est pas dans la table licenses

    // Retourner les informations de la licence
    return {
      id: data.id,
      user_id: data.user_id,
      license_key: data.license_key,
      plan_name: data.plan_name,
      plan_type: data.plan_type,
      status: data.status,
      purchase_date: data.purchase_date,
      expires_at: finalExpiresAt,
      features: data.features || null,
      metadata: data.metadata || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    logger.error("Error in verifyLicenseByKey", error, { 
      component: 'licenseService', 
      action: 'verifyLicenseByKey' 
    });
    return null;
  }
};

/**
 * Révoque une licence par clé dans la base Supabase séparée
 * @param licenseKey - Clé de licence à révoquer
 * @returns Promise résolue avec true si la révocation réussit, false sinon
 */
export const revokeLicenseByKey = async (licenseKey: string): Promise<boolean> => {
  if (!isLicenseSupabaseConfigured() || !licenseSupabase) {
    logger.warn("License Supabase not configured, cannot revoke license", null, { 
      component: 'licenseService', 
      action: 'revokeLicenseByKey' 
    });
    return false;
  }

  if (!licenseKey || !licenseKey.trim()) {
    logger.warn("Empty license key provided", null, { 
      component: 'licenseService', 
      action: 'revokeLicenseByKey' 
    });
    return false;
  }

  try {
    // Mettre à jour le statut de la licence à 'revoked'
    const { data, error } = await licenseSupabase
      .from('licenses')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('license_key', licenseKey.trim().toUpperCase())
      .select()
      .maybeSingle();

    if (error) {
      logger.error("Error revoking license by key", error, { 
        component: 'licenseService', 
        action: 'revokeLicenseByKey',
        licenseKey: licenseKey.substring(0, 10) + '...'
      });
      return false;
    }

    if (!data) {
      logger.warn("License not found for revocation", null, { 
        component: 'licenseService', 
        action: 'revokeLicenseByKey',
        licenseKey: licenseKey.substring(0, 10) + '...'
      });
      return false;
    }

    logger.info("License revoked successfully", null, {
      component: 'licenseService',
      action: 'revokeLicenseByKey',
      licenseKey: licenseKey.substring(0, 10) + '...'
    });

    return true;
  } catch (error) {
    logger.error("Error in revokeLicenseByKey", error, { 
      component: 'licenseService', 
      action: 'revokeLicenseByKey' 
    });
    return false;
  }
};

/**
 * Fonction helper pour mapper LicenseRow vers License
 */
const mapLicenseRowToLicense = (row: LicenseRow): License => ({
  id: row.id,
  user_id: row.user_id,
  license_key: row.license_key,
  status: row.status,
  expires_at: row.expires_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  activated_at: row.activated_at,
  last_check_at: row.last_check_at,
  notes: row.notes
});

