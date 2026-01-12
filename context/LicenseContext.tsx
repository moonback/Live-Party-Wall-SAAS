import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { checkLicenseValidity, updateLicenseLastCheck, verifyLicenseByKey } from '../services/licenseService';
import { LicenseValidity } from '../types';
import { logger } from '../utils/logger';
import { isElectron } from '../utils/electronPaths';

const STORED_LICENSE_KEY = 'partywall_license_key';

interface LicenseContextType {
  licenseValidity: LicenseValidity | null;
  loading: boolean;
  isValid: boolean;
  refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [licenseValidity, setLicenseValidity] = useState<LicenseValidity | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Vérifie la validité de la licence
   */
  const checkLicense = useCallback(async () => {
    if (!isAuthenticated || !user) {
      // Si l'utilisateur n'est pas authentifié, on considère que la licence est valide
      // (pour permettre l'accès aux pages publiques comme guest upload)
      setLicenseValidity({
        is_valid: true,
        license_id: null,
        expires_at: null,
        status: null,
        days_remaining: null
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // D'abord, essayer de vérifier dans la base principale
      let validity = await checkLicenseValidity(user.id);
      
      // Si la licence n'est pas valide dans la base principale, vérifier dans la base séparée
      if (!validity.is_valid) {
        const storedLicenseKey = localStorage.getItem(STORED_LICENSE_KEY);
        if (storedLicenseKey) {
          try {
            const externalLicense = await verifyLicenseByKey(storedLicenseKey, user.email);
            if (externalLicense) {
              // Calculer les jours restants
              let daysRemaining: number | null = null;
              if (externalLicense.expires_at) {
                const expiresAt = new Date(externalLicense.expires_at);
                const now = new Date();
                const diff = expiresAt.getTime() - now.getTime();
                daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
              }
              
              // Créer un objet LicenseValidity à partir de la licence externe
              validity = {
                is_valid: true,
                license_id: externalLicense.id,
                expires_at: externalLicense.expires_at,
                status: externalLicense.status,
                days_remaining: daysRemaining
              };
              
              logger.info("License validated from external database", null, {
                component: 'LicenseContext',
                action: 'checkLicense',
                licenseKey: storedLicenseKey.substring(0, 10) + '...'
              });
            } else {
              // La clé stockée n'est plus valide, la supprimer
              localStorage.removeItem(STORED_LICENSE_KEY);
              logger.warn("Stored license key is no longer valid, removed from storage", null, {
                component: 'LicenseContext',
                action: 'checkLicense'
              });
            }
          } catch (error) {
            logger.error("Error verifying external license", error, {
              component: 'LicenseContext',
              action: 'checkLicense'
            });
            // En cas d'erreur, on garde le résultat de la base principale
          }
        }
      }
      
      setLicenseValidity(validity);

      // Mettre à jour la date de dernière vérification si la licence est valide
      if (validity.is_valid && validity.license_id) {
        await updateLicenseLastCheck(validity.license_id);
      }
    } catch (error) {
      logger.error("Error checking license", error, { component: 'LicenseContext', action: 'checkLicense' });
      // En cas d'erreur, on bloque l'accès par sécurité
      setLicenseValidity({
        is_valid: false,
        license_id: null,
        expires_at: null,
        status: null,
        days_remaining: null
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  /**
   * Rafraîchit la vérification de la licence
   */
  const refreshLicense = useCallback(async () => {
    await checkLicense();
  }, [checkLicense]);

  // Vérifier la licence au chargement et quand l'utilisateur change
  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  // Vérifier périodiquement la licence (toutes les 5 minutes)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      checkLicense();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkLicense, isAuthenticated, user]);

  // Calculer si la licence est valide
  // IMPORTANT : Chaque utilisateur authentifié DOIT avoir sa propre licence valide
  // Seuls les utilisateurs non authentifiés (invités) peuvent accéder aux pages publiques sans licence
  const isValid = React.useMemo(() => {
    // Si l'utilisateur n'est pas authentifié, permettre l'accès (pages publiques pour invités)
    // Les invités peuvent uploader des photos sans licence
    if (!isAuthenticated || !user) {
      return true;
    }

    // Pour les utilisateurs authentifiés (organisateurs), la licence est OBLIGATOIRE
    // Si on est en train de charger, on bloque l'accès jusqu'à ce que la vérification soit terminée
    if (loading) {
      return false;
    }

    // RÈGLE STRICTE : Un utilisateur authentifié DOIT avoir une licence valide
    // Pas de licence = pas d'accès (même en mode web)
    // Si licenseValidity est null après le chargement, cela signifie qu'il n'y a pas de licence
    // Dans ce cas, on bloque l'accès
    const hasValidLicense = licenseValidity?.is_valid === true;
    
    if (!hasValidLicense) {
      logger.warn("Authenticated user without valid license, blocking access", null, {
        component: 'LicenseContext',
        action: 'isValid',
        userId: user.id,
        hasLicenseValidity: !!licenseValidity,
        licenseStatus: licenseValidity?.status
      });
    }
    
    return hasValidLicense;
  }, [isAuthenticated, user, loading, licenseValidity]);

  return (
    <LicenseContext.Provider
      value={{
        licenseValidity,
        loading,
        isValid,
        refreshLicense
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within LicenseProvider');
  }
  return context;
};

