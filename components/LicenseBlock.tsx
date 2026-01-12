import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Shield, Mail, LogOut } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { useAuth } from '../context/AuthContext';
import { isElectron } from '../utils/electronPaths';

/**
 * Composant qui bloque l'application si la licence est expirée ou invalide
 * Design amélioré pour plus de clarté et d'impact visuel.
 */
const LicenseBlock: React.FC = () => {
  const { licenseValidity, loading } = useLicense();
  const { isAuthenticated, signOut } = useAuth();

  // Loader design amélioré
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6"
          >
            <span className="relative flex h-16 w-16">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent border-b-transparent animate-spin"></span>
            </span>
          </motion.div>
          <p className="text-indigo-300 text-lg font-medium animate-pulse">
            Vérification de la licence...
          </p>
        </div>
      </div>
    );
  }

  // Si la licence est valide, on ne bloque pas
  if (licenseValidity?.is_valid) {
    return null;
  }

  // Calculer les jours restants ou le statut
  const daysRemaining = licenseValidity?.days_remaining ?? 0;
  const expiresAt = licenseValidity?.expires_at
    ? new Date(licenseValidity.expires_at)
    : null;
  const status = licenseValidity?.status ?? 'expired';

  // Formater la date d'expiration
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Non disponible';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.13 }}
        className="max-w-xl w-full shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-900/80 border border-red-600/30"
      >
        <div className="px-0 pt-0 bg-gradient-to-tr from-red-500/10 via-fuchsia-700/10 to-purple-900/10 pb-6 rounded-b-3xl shadow-inner">
          {/* Icône d'alerte améliorée */}
          <motion.div
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 250, damping: 16 }}
            className="w-24 h-24 mx-auto -mt-8 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/20 border-4 border-red-600/30 flex items-center justify-center shadow-xl ring-2 ring-red-500/20"
          >
            <AlertTriangle className="w-12 h-12 text-rose-400 animate-bounce-slow" />
          </motion.div>
          {/* Titre */}
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-red-400 via-rose-400 to-orange-400 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            {licenseValidity?.status === null || !licenseValidity ? 'Licence requise' : 'Licence expirée'}
          </h1>
          {/* Message principal stylisé */}
          <p className="text-lg text-slate-300 text-center mb-8 leading-relaxed px-3 font-medium">
            {licenseValidity?.status === null || !licenseValidity ? (
              <>
                Aucune licence n'est créée automatiquement lors de l'inscription.<br />
                <span className="text-rose-200 font-semibold">
                  Chaque organisateur doit saisir sa propre clé de licence
                </span>{" "}
                reçue par email pour accéder à l'application.
              </>
            ) : (
              <>
                Votre licence d'utilisation a expiré ou n'est plus valide.<br />
                <span className="text-rose-200 font-semibold">
                  Veuillez renouveler votre licence
                </span>{" "}
                pour continuer à utiliser l'application.
              </>
            )}
          </p>
        </div>

        <div className="space-y-5 px-7 mt-1 mb-10">
          {/* Informations de la licence */}
          {status === 'expired' && (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-5 px-5 py-3 rounded-xl bg-gradient-to-r from-red-700/30 via-red-900/10 to-red-800/40 border border-red-400/30 shadow"
            >
              <Clock className="w-7 h-7 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-red-400 font-bold mb-1 uppercase tracking-wide">Date d'expiration</div>
                <div className="text-slate-200 font-semibold text-lg">{formatDate(expiresAt)}</div>
              </div>
            </motion.div>
          )}

          {status === 'suspended' && (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-900/30 via-amber-600/10 to-yellow-900/40 border border-amber-500/30 shadow"
            >
              <Shield className="w-7 h-7 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-400 mb-1 uppercase tracking-wider">Statut</div>
                <div className="text-slate-100 font-semibold">Votre licence a été suspendue</div>
              </div>
            </motion.div>
          )}

          {status === 'cancelled' && (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-5 px-5 py-3 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-900/80 border border-slate-700/50 shadow"
            >
              <Shield className="w-7 h-7 text-slate-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">Statut</div>
                <div className="text-slate-200 font-semibold">Votre licence a été annulée</div>
              </div>
            </motion.div>
          )}

          {daysRemaining > 0 && daysRemaining <= 7 && (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-5 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-700/10 to-yellow-900/10 border border-amber-500/30 shadow"
            >
              <Clock className="w-7 h-7 text-amber-400 flex-shrink-0 animate-pulse" />
              <div>
                <div className="text-sm font-bold text-amber-400 mb-1 uppercase tracking-wider">Avertissement</div>
                <div className="text-slate-100 font-medium">
                  Votre licence expire dans <span className="font-bold">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
         {/* Actions améliorées */}
         <div className="flex flex-col gap-3 px-7 pb-7">
           <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
             <motion.button
               whileHover={{ scale: 1.03, y: -1 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => {
                 // Ouvrir le client email avec un message pré-rempli
                 const subject = encodeURIComponent('Renouvellement de licence - Partywall');
                 const body = encodeURIComponent(
                   `Bonjour,\n\nJe souhaite renouveler ma licence pour l'application Partywall.\n\n` +
                   `Informations de licence:\n` +
                   `- Date d'expiration: ${formatDate(expiresAt)}\n` +
                   `- Statut: ${status}\n\n` +
                   `Merci de me contacter pour le renouvellement.\n\nCordialement`
                 );
                 window.location.href = `mailto:support@partywall.fr?subject=${subject}&body=${body}`;
               }}
               className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-fuchsia-700 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-fuchsia-800/20 hover:shadow-xl hover:shadow-fuchsia-600/30 border-2 border-indigo-400/20 text-base"
             >
               <Mail className="w-5 h-5" />
               <span>Contacter le support</span>
             </motion.button>

             <motion.button
               whileHover={{ scale: 1.02, y: -1 }}
               whileTap={{ scale: 0.96 }}
               onClick={() => {
                 // Rafraîchir la page pour réessayer
                 window.location.reload();
               }}
               className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 hover:from-slate-700 hover:to-slate-700 text-slate-300 rounded-lg font-semibold transition-all duration-200 border-2 border-slate-700/60 text-base"
             >
               <span>Réessayer</span>
             </motion.button>
           </div>

           {isAuthenticated && (
             <motion.button
               whileHover={{ scale: 1.02, y: -1 }}
               whileTap={{ scale: 0.96 }}
               onClick={async () => {
                 try {
                   // Déconnexion
                   await signOut();
                   
                   // Nettoyer le localStorage et sessionStorage pour s'assurer que la session est bien supprimée
                   // Supprimer les clés Supabase qui pourraient être en cache
                   const cleanStorage = (storage: Storage) => {
                     const keysToRemove: string[] = [];
                     for (let i = 0; i < storage.length; i++) {
                       const key = storage.key(i);
                       if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                         keysToRemove.push(key);
                       }
                     }
                     keysToRemove.forEach(key => storage.removeItem(key));
                   };
                   
                   cleanStorage(localStorage);
                   cleanStorage(sessionStorage);
                   
                   // Attendre un peu pour s'assurer que tout est bien nettoyé
                   await new Promise(resolve => setTimeout(resolve, 500));
                   
                   // Sur Electron, recharger la page pour réinitialiser l'application
                   // Cela permet de revenir à l'écran de login (mode=admin par défaut dans Electron)
                   if (isElectron()) {
                     window.location.reload();
                   } else {
                     // En web, rediriger vers la page d'accueil
                     window.location.href = '/';
                   }
                 } catch (error) {
                   console.error('Erreur lors de la déconnexion:', error);
                   // En cas d'erreur, nettoyer quand même et forcer le rechargement
                   try {
                     const cleanStorage = (storage: Storage) => {
                       const keysToRemove: string[] = [];
                       for (let i = 0; i < storage.length; i++) {
                         const key = storage.key(i);
                         if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                           keysToRemove.push(key);
                         }
                       }
                       keysToRemove.forEach(key => storage.removeItem(key));
                     };
                     cleanStorage(localStorage);
                     cleanStorage(sessionStorage);
                   } catch (e) {
                     // Ignorer les erreurs de nettoyage
                   }
                   window.location.reload();
                 }
               }}
               className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-800/80 via-red-900/80 to-rose-900/80 hover:from-red-700 hover:to-rose-700 text-white rounded-lg font-semibold transition-all duration-200 border-2 border-red-600/30 shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-800/30 text-base"
             >
               <LogOut className="w-5 h-5" />
               <span>Se déconnecter</span>
             </motion.button>
           )}
         </div>
        <div className="px-7 pb-5">
          {/* Footer amélioré */}
          <p className="text-xs text-slate-500 text-center mt-3 italic">
            Si vous pensez qu'il s'agit d'une erreur, veuillez&nbsp;
            <span className="underline underline-offset-2 cursor-pointer text-indigo-400 hover:text-indigo-300"
              onClick={() => {
                window.location.href = "mailto:support@partywall.fr";
              }}
            >
              contacter le support technique
            </span>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LicenseBlock;
