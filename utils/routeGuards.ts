import { redirect } from '@tanstack/react-router';
import { getCurrentUserName } from './userAvatar';

/**
 * Guard pour vérifier l'authentification admin
 * Redirige vers /admin (login) si non authentifié
 */
export const requireAdminAuth = (isAuthenticated: boolean) => {
  if (!isAuthenticated) {
    throw redirect({
      to: '/admin',
    });
  }
};

/**
 * Guard pour vérifier l'inscription utilisateur
 * Redirige vers /onboarding si non inscrit
 */
export const requireUserRegistration = () => {
  const userName = getCurrentUserName();
  if (!userName) {
    throw redirect({
      to: '/onboarding',
    });
  }
};

/**
 * Guard pour vérifier qu'une fonctionnalité est activée
 * Redirige vers la route de fallback si désactivée
 */
export const requireFeatureEnabled = (
  featureEnabled: boolean,
  fallbackRoute: string
) => {
  if (!featureEnabled) {
    throw redirect({
      to: fallbackRoute as any,
    });
  }
};

/**
 * Guard combiné : inscription utilisateur + fonctionnalité activée
 */
export const requireUserRegistrationAndFeature = (
  featureEnabled: boolean,
  fallbackRoute: string
) => {
  requireUserRegistration();
  requireFeatureEnabled(featureEnabled, fallbackRoute);
};

