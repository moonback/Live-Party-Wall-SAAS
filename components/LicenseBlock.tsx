import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Shield, LogOut, RefreshCw, ExternalLink } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { useAuth } from '../context/AuthContext';
import { isElectron } from '../utils/electronPaths';

/**
 * Fonction utilitaire pour nettoyer le storage (extraite pour éviter la duplication)
 */
const cleanStorage = (storage: Storage): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => storage.removeItem(key));
};

/**
 * Composant qui bloque l'application si la licence est expirée ou invalide
 * Design optimisé et amélioré pour une meilleure expérience utilisateur.
 */
const LicenseBlock: React.FC = () => {
  const { licenseValidity, loading } = useLicense();
  const { isAuthenticated, signOut } = useAuth();

  // Mémoriser les valeurs calculées pour éviter les recalculs
  const status = useMemo(() => licenseValidity?.status ?? 'expired', [licenseValidity?.status]);
  const daysRemaining = useMemo(() => licenseValidity?.days_remaining ?? 0, [licenseValidity?.days_remaining]);
  const expiresAt = useMemo(() => 
    licenseValidity?.expires_at ? new Date(licenseValidity.expires_at) : null,
    [licenseValidity?.expires_at]
  );
  const isLicenseRequired = useMemo(() => 
    licenseValidity?.status === null || !licenseValidity,
    [licenseValidity]
  );

  // Formater la date d'expiration (mémorisé)
  const formattedDate = useMemo(() => {
    if (!expiresAt) return 'Non disponible';
    return expiresAt.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [expiresAt]);

  // Handlers mémorisés
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      cleanStorage(localStorage);
      cleanStorage(sessionStorage);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isElectron()) {
        window.location.reload();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      try {
        cleanStorage(localStorage);
        cleanStorage(sessionStorage);
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }
      window.location.reload();
    }
  }, [signOut]);

  const handleContactSupport = useCallback(() => {
    window.location.href = 'mailto:support@partywall.fr';
  }, []);

  // Loader optimisé
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-pink-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse"></div>
          </div>
          <p className="text-pink-300 text-lg font-medium">
            Vérification de la licence...
          </p>
        </motion.div>
      </div>
    );
  }

  // Si la licence est valide, on ne bloque pas
  if (licenseValidity?.is_valid) {
    return null;
  }


  // Variants d'animation pour optimiser les performances
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  const iconVariants = {
    hidden: { scale: 0.5, rotate: -15, opacity: 0 },
    visible: { 
      scale: 1, 
      rotate: 0, 
      opacity: 1,
      transition: { 
        type: 'spring' as const, 
        stiffness: 200, 
        damping: 15,
        delay: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-pink-500/20 shadow-2xl backdrop-blur-sm">
          {/* Effet de brillance animé en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-indigo-500/5 pointer-events-none" />
          
          {/* Motif décoratif en arrière-plan */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          </div>
          
          {/* Header avec logo et titre */}
          <div className="relative px-6 pt-8 pb-6">
            {/* Logo Partywall */}
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="relative mx-auto mb-6 flex justify-center items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-indigo-500/30 rounded-full blur-2xl scale-150"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 border-2 border-pink-500/30 flex items-center justify-center shadow-2xl backdrop-blur-sm p-3">
                <img
                  src="/icon.png"
                  alt="Partywall Logo"
                  className="w-full h-full object-contain drop-shadow-lg"
                  draggable={false}
                />
              </div>
            </motion.div>

            {/* Titre avec icône d'alerte */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {isLicenseRequired ? 'Licence requise' : 'Licence expirée'}
              </h1>
            </motion.div>

            {/* Message principal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center space-y-3"
            >
              <p className="text-slate-300 text-base leading-relaxed">
                {isLicenseRequired ? (
                  <>
                    Aucune licence n'a été attribuée automatiquement lors de l'inscription.
                  </>
                ) : (
                  <>
                    Votre licence d'utilisation a expiré ou n'est plus valide.
                    <span className="block mt-2 text-pink-300 font-semibold">
                      Veuillez renouveler votre licence pour continuer.
                    </span>
                  </>
                )}
              </p>
              
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-pink-300" />
                  </div>
                  <div>
                    <p className="text-sm text-pink-200 font-medium leading-relaxed">
                      Si vous venez d'acheter une licence, l'activation peut prendre jusqu'à 6 heures maximum.
                      <br />
                      <span className="text-xs text-pink-300/80 mt-1 block">
                        Merci de vérifier votre email et de patienter.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {isLicenseRequired && (
                <motion.a
                  href="https://partywall.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-200 border border-pink-400/30"
                >
                  <span>Commander une licence</span>
                  <ExternalLink className="w-5 h-5" />
                </motion.a>
              )}
            </motion.div>
          </div>

          {/* Informations de la licence */}
          <div className="px-6 pb-6 space-y-3">
            {status === 'expired' && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 backdrop-blur-sm"
                style={{ transitionDelay: '0.4s' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-pink-400 font-semibold mb-1 uppercase tracking-wider">
                    Date d'expiration
                  </div>
                  <div className="text-slate-200 font-medium text-sm sm:text-base">
                    {formattedDate}
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'suspended' && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm"
                style={{ transitionDelay: '0.4s' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wider">
                    Statut
                  </div>
                  <div className="text-slate-200 font-medium">
                    Votre licence a été suspendue
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'cancelled' && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-slate-700/30 backdrop-blur-sm"
                style={{ transitionDelay: '0.4s' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700/40 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">
                    Statut
                  </div>
                  <div className="text-slate-300 font-medium">
                    Votre licence a été annulée
                  </div>
                </div>
              </motion.div>
            )}

            {daysRemaining > 0 && daysRemaining <= 7 && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 backdrop-blur-sm"
                style={{ transitionDelay: '0.5s' }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-wider">
                    Avertissement
                  </div>
                  <div className="text-slate-200 font-medium">
                    Votre licence expire dans{' '}
                    <span className="font-bold text-indigo-300">
                      {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <motion.button
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
              style={{ transitionDelay: '0.6s' }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer</span>
            </motion.button>

            {isAuthenticated && (
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600/80 via-purple-600/80 to-indigo-600/80 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all duration-200 border border-pink-500/30 shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 backdrop-blur-sm"
                style={{ transitionDelay: '0.7s' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </motion.button>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 border-t border-slate-800/50">
            <p className="text-xs text-slate-500 text-center">
              Si vous pensez qu'il s'agit d'une erreur,{' '}
              <button
                onClick={handleContactSupport}
                className="underline underline-offset-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                contactez le support technique
              </button>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LicenseBlock;
