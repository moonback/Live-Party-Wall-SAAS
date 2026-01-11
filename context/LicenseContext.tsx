import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { checkLicenseValidity, updateLicenseLastCheck } from '../services/licenseService';
import { LicenseValidity } from '../types';
import { logger } from '../utils/logger';

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
      const validity = await checkLicenseValidity(user.id);
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

  const isValid = licenseValidity?.is_valid ?? true; // Par défaut, on permet l'accès si pas de licence (pour développement)

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

