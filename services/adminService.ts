import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

/**
 * Interface pour un admin de la plateforme
 */
export interface PlatformAdmin {
  id: string;
  user_id: string;
  created_at: string;
  created_by: string | null;
  is_active: boolean;
}

/**
 * Vérifie si un utilisateur est admin de la plateforme
 * @param userId - ID de l'utilisateur (optionnel, utilise auth.uid() si non fourni)
 * @returns Promise résolue avec true si admin, false sinon
 */
export const isPlatformAdmin = async (userId?: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    // Si userId n'est pas fourni, récupérer depuis la session
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return false;
      }
      targetUserId = session.user.id;
    }

    const { data, error } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error checking platform admin", error, { 
        component: 'adminService', 
        action: 'isPlatformAdmin', 
        userId: targetUserId 
      });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error("Error in isPlatformAdmin", error, { 
      component: 'adminService', 
      action: 'isPlatformAdmin', 
      userId 
    });
    return false;
  }
};

/**
 * Récupère tous les admins de la plateforme (admin uniquement)
 * @returns Promise résolue avec la liste des admins
 */
export const getAllPlatformAdmins = async (): Promise<PlatformAdmin[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  // Vérifier que l'utilisateur est admin
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error("Accès refusé : seuls les admins peuvent voir la liste des admins");
  }

  try {
    const { data, error } = await supabase
      .from('platform_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching platform admins", error, { 
        component: 'adminService', 
        action: 'getAllPlatformAdmins' 
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error("Error in getAllPlatformAdmins", error, { 
      component: 'adminService', 
      action: 'getAllPlatformAdmins' 
    });
    throw error;
  }
};

/**
 * Ajoute un utilisateur comme admin de la plateforme (admin uniquement)
 * @param userId - ID de l'utilisateur à promouvoir
 * @returns Promise résolue avec l'admin créé
 */
export const addPlatformAdmin = async (userId: string): Promise<PlatformAdmin> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  // Vérifier que l'utilisateur actuel est admin
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error("Accès refusé : seuls les admins peuvent ajouter d'autres admins");
  }

  try {
    // Récupérer l'ID de l'admin actuel pour created_by
    const { data: { session } } = await supabase.auth.getSession();
    const createdBy = session?.user?.id || null;

    const { data, error } = await supabase
      .from('platform_admins')
      .insert({
        user_id: userId,
        created_by: createdBy,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      logger.error("Error adding platform admin", error, { 
        component: 'adminService', 
        action: 'addPlatformAdmin', 
        userId 
      });
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Error in addPlatformAdmin", error, { 
      component: 'adminService', 
      action: 'addPlatformAdmin', 
      userId 
    });
    throw error;
  }
};

/**
 * Désactive un admin de la plateforme (admin uniquement)
 * @param adminId - ID de l'admin à désactiver
 * @returns Promise résolue
 */
export const deactivatePlatformAdmin = async (adminId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  // Vérifier que l'utilisateur actuel est admin
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error("Accès refusé : seuls les admins peuvent désactiver d'autres admins");
  }

  try {
    const { error } = await supabase
      .from('platform_admins')
      .update({ is_active: false })
      .eq('id', adminId);

    if (error) {
      logger.error("Error deactivating platform admin", error, { 
        component: 'adminService', 
        action: 'deactivatePlatformAdmin', 
        adminId 
      });
      throw error;
    }
  } catch (error) {
    logger.error("Error in deactivatePlatformAdmin", error, { 
      component: 'adminService', 
      action: 'deactivatePlatformAdmin', 
      adminId 
    });
    throw error;
  }
};

/**
 * Réactive un admin de la plateforme (admin uniquement)
 * @param adminId - ID de l'admin à réactiver
 * @returns Promise résolue
 */
export const reactivatePlatformAdmin = async (adminId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  // Vérifier que l'utilisateur actuel est admin
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error("Accès refusé : seuls les admins peuvent réactiver d'autres admins");
  }

  try {
    const { error } = await supabase
      .from('platform_admins')
      .update({ is_active: true })
      .eq('id', adminId);

    if (error) {
      logger.error("Error reactivating platform admin", error, { 
        component: 'adminService', 
        action: 'reactivatePlatformAdmin', 
        adminId 
      });
      throw error;
    }
  } catch (error) {
    logger.error("Error in reactivatePlatformAdmin", error, { 
      component: 'adminService', 
      action: 'reactivatePlatformAdmin', 
      adminId 
    });
    throw error;
  }
};

