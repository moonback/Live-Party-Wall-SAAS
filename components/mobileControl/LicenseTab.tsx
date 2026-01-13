import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Clock, 
  AlertTriangle, Copy,
  Ban, Loader2
} from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { revokeLicenseByKey, getActiveLicense } from '../../services/licenseService';
import { isProLicense, isPartLicense } from '../../utils/licenseUtils';
import { License } from '../../types';
import { Crown, User, Sparkles, Tag, Video, UserSearch, Film, ArrowRight } from 'lucide-react';

const LicenseTab: React.FC = () => {
  const { licenseValidity, loading, refreshLicense } = useLicense();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [activeLicense, setActiveLicense] = useState<License | null>(null);

  // Charger la licence active depuis la base de données
  useEffect(() => {
    const loadActiveLicense = async () => {
      if (!user) return;
      
      try {
        const license = await getActiveLicense(user.id);
        setActiveLicense(license);
      } catch (error) {
        console.error('Error loading active license:', error);
      }
    };

    loadActiveLicense();
  }, [user, licenseValidity?.license_id]);

  // Formater la date
  const formatDate = (date: string | null): string => {
    if (!date) return 'Non disponible';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copier la clé de licence
  const handleCopyKey = (key: string | null) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    addToast('Clé de licence copiée', 'success');
  };

  // Révoquer la licence
  const handleRevokeLicense = async () => {
    const storedLicenseKey = localStorage.getItem('partywall_license_key');
    if (!storedLicenseKey) {
      addToast('Aucune clé de licence trouvée à révoquer', 'error');
      return;
    }

    try {
      setRevoking(true);
      const success = await revokeLicenseByKey(storedLicenseKey);
      
      if (success) {
        // Supprimer la clé du localStorage
        localStorage.removeItem('partywall_license_key');
        addToast('Licence révoquée avec succès', 'success');
        setShowRevokeConfirm(false);
        
        // Rafraîchir le contexte pour bloquer l'application
        await refreshLicense();
      } else {
        addToast('Erreur lors de la révocation de la licence', 'error');
      }
    } catch (error: any) {
      console.error('Error revoking license:', error);
      addToast(error.message || 'Erreur lors de la révocation de la licence', 'error');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-12 h-12 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-3 border-pink-500/30 border-t-pink-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <p className="text-white/70 text-sm font-medium">Chargement des informations de licence...</p>
        </motion.div>
      </div>
    );
  }

  const isValid = licenseValidity?.is_valid ?? false;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header avec statut */}
      

     

      {/* Informations du compte et Passer à Pro en 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr] gap-4">
        {/* Informations utilisateur - Colonne gauche */}
        <AnimatePresence>
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-5 border border-white/10 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-lg bg-pink-500/20">
                  <Key className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Informations du compte</h3>
              </div>
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium text-xs md:text-sm">Email</span>
                    <span className="text-white font-mono text-xs font-semibold">{user.email}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium text-xs md:text-sm">ID Utilisateur</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono text-white/90 bg-black/40 px-2 py-1 rounded border border-white/10">
                        {user.id.substring(0, 8)}...
                      </code>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCopyKey(user.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                        title="Copier l'ID"
                      >
                        <Copy className="w-3.5 h-3.5 text-white/70" />
                      </motion.button>
                    </div>
                  </div>
                </div>
                {/* Type de licence */}
                {activeLicense?.license_key && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium text-xs md:text-sm">Type de licence</span>
                      <div className="flex items-center gap-1.5">
                        {isProLicense(activeLicense.license_key) ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40">
                            <Crown className="w-3 h-3 text-amber-300" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">PRO</span>
                          </div>
                        ) : isPartLicense(activeLicense.license_key) ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/30 border border-slate-600/40">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PART</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
                {/* Numéro de licence */}
                {activeLicense?.license_key && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium text-xs md:text-sm">Numéro de licence</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-white/90 bg-black/40 px-2 py-1 rounded border border-white/10">
                          {activeLicense.license_key.length > 12 
                            ? `${activeLicense.license_key.substring(0, 8)}...${activeLicense.license_key.slice(-4)}`
                            : activeLicense.license_key
                          }
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopyKey(activeLicense.license_key)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                          title="Copier le numéro"
                        >
                          <Copy className="w-3.5 h-3.5 text-white/70" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Date d'expiration */}
                {licenseValidity?.expires_at && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium text-xs md:text-sm">Date d'expiration</span>
                      <span className="text-white font-semibold text-xs md:text-sm">
                        {formatDate(licenseValidity.expires_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Passer à Pro pour les licences PART - Colonne droite */}
        <AnimatePresence>
          {activeLicense?.license_key && isPartLicense(activeLicense.license_key) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-yellow-900/20 to-amber-900/20 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-amber-500/30 shadow-xl"
            >
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 opacity-50" />
            
            {/* Header */}
            <div className="relative flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-400/40 shadow-lg shadow-amber-500/20"
              >
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl bg-amber-400/20 blur-md"
                />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-white mb-0.5">Passer à Pro</h3>
                <p className="text-xs text-amber-200/80">Débloquez toutes les fonctionnalités premium</p>
              </div>
            </div>

            {/* Liste des fonctionnalités en 2 colonnes */}
            <div className="relative grid grid-cols-2 gap-2.5 mb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/20 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold text-xs">Génération de légende IA</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Légendes automatiques</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/20 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <Tag className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold text-xs">Génération de tags IA</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tags automatiques</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/20 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <Video className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold text-xs">Capture vidéo</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enregistrez des vidéos</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/20 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <UserSearch className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold text-xs">Retrouve-moi</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reconnaissance faciale</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 }}
                className="p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/20 backdrop-blur-sm col-span-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <Film className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-semibold text-xs">Aftermovies dans la galerie</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vidéos timelapse automatiques</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Avantages supplémentaires */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Avantages supplémentaires</p>
                  <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                    <li>Jusqu'à 50 événements (au lieu de 1)</li>
                    <li>Support prioritaire</li>
                    <li>Mises à jour en avant-première</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Bouton d'action */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-white rounded-lg font-bold transition-all duration-300 shadow-lg shadow-amber-500/30 border border-amber-400/40 text-sm md:text-base"
              onClick={() => window.open('https://partywall.fr', '_blank', 'noopener')}
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              <span>Passer à Pro</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Message si pas de licence */}
      <AnimatePresence>
        {!licenseValidity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-8 border border-white/10 shadow-sm text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="inline-flex p-2.5 rounded-lg bg-white/5 border border-white/10 mb-3"
            >
              <Key className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
            </motion.div>
            <h3 className="text-base md:text-lg font-bold text-white mb-1.5">Aucune licence trouvée</h3>
            <p className="text-white/70 text-xs leading-relaxed max-w-sm mx-auto">
              Aucune licence active n'a été trouvée pour votre compte.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="space-y-2.5">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={refreshLicense}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all duration-300 shadow-md shadow-pink-500/25 border border-pink-400/30 text-sm"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Clock className="w-4 h-4" />
          </motion.div>
          <span>Actualiser</span>
        </motion.button>

        {/* Bouton de révocation */}
        {isValid && localStorage.getItem('partywall_license_key') && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowRevokeConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:via-rose-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all duration-300 shadow-md shadow-red-500/25 border border-red-400/30 text-sm"
          >
            <Ban className="w-4 h-4" />
            <span>Révoquer la licence</span>
          </motion.button>
        )}
      </div>

      {/* Confirmation de révocation */}
      <AnimatePresence>
        {showRevokeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !revoking && setShowRevokeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-lg p-4 md:p-5 border border-red-500/30 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-400/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white mb-0.5">Révoquer la licence</h3>
                  <p className="text-xs text-white/60">Cette action est irréversible</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-white/90 text-xs leading-relaxed">
                  Êtes-vous sûr de vouloir révoquer votre licence ? Cette action :
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-white/70 list-disc list-inside">
                  <li>Rendra votre licence immédiatement invalide</li>
                  <li>Bloquera l'accès à l'application</li>
                  <li>Nécessitera une nouvelle licence pour continuer</li>
                </ul>
              </div>

              <div className="flex gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowRevokeConfirm(false)}
                  disabled={revoking}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleRevokeLicense}
                  disabled={revoking}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-red-600/50 disabled:to-rose-600/50 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 disabled:shadow-none disabled:cursor-not-allowed text-sm"
                >
                  {revoking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Révocation...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirmer</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LicenseTab;

