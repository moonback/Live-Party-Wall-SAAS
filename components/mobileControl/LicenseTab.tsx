import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Calendar, Clock, CheckCircle, XCircle, 
  AlertTriangle, Shield, Copy, Sparkles, TrendingUp
} from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LicenseTab: React.FC = () => {
  const { licenseValidity, loading, refreshLicense } = useLicense();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Calculer les jours restants
  const getDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 border-4 border-pink-500/30 border-t-pink-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <p className="text-white/70 font-medium">Chargement des informations de licence...</p>
        </motion.div>
      </div>
    );
  }

  const daysRemaining = licenseValidity?.expires_at 
    ? getDaysRemaining(licenseValidity.expires_at) 
    : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;
  const isValid = licenseValidity?.is_valid ?? false;

  return (
    <div className="space-y-5">
      {/* Header avec effet glow */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden bg-gradient-to-br ${
          isValid
            ? 'from-green-900/20 via-emerald-900/20 to-green-900/20'
            : 'from-red-900/20 via-rose-900/20 to-red-900/20'
        } backdrop-blur-xl rounded-2xl p-6 border ${
          isValid
            ? 'border-green-500/30 shadow-lg shadow-green-500/20'
            : 'border-red-500/30 shadow-lg shadow-red-500/20'
        }`}
      >
        {/* Effet de particules animées */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                isValid ? 'bg-green-400/40' : 'bg-red-400/40'
              }`}
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                scale: 0,
              }}
              animate={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-4 rounded-2xl ${
              isValid 
                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-400/50 shadow-lg shadow-green-500/30' 
                : 'bg-gradient-to-br from-red-500/30 to-rose-500/30 border-2 border-red-400/50 shadow-lg shadow-red-500/30'
            }`}
          >
            {isValid ? (
              <CheckCircle className="w-7 h-7 text-green-300 drop-shadow-lg" />
            ) : (
              <XCircle className="w-7 h-7 text-red-300 drop-shadow-lg" />
            )}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">Licence</h2>
              {isValid && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </div>
            <p className={`text-sm font-semibold flex items-center gap-2 ${
              isValid ? 'text-green-300' : 'text-red-300'
            }`}>
              {isValid ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Licence active
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  Licence expirée ou invalide
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Informations de la licence */}
      <AnimatePresence>
        {licenseValidity && (
          <div className="space-y-4">
            {/* Statut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative bg-gradient-to-br from-black/50 via-purple-900/20 to-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
            >
              {/* Effet de glow subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 rounded-2xl pointer-events-none" />
              
              <div className="relative flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                  <Shield className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-lg font-bold text-white">Statut de la licence</h3>
              </div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/80 font-medium">Statut</span>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      isValid 
                        ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/50 shadow-lg shadow-green-500/20' 
                        : 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-400/50 shadow-lg shadow-red-500/20'
                    }`}
                  >
                    {licenseValidity.status || 'N/A'}
                  </motion.span>
                </div>
                
                {licenseValidity.license_id && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/80 font-medium">ID de la licence</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                        {licenseValidity.license_id.substring(0, 8)}...
                      </code>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCopyKey(licenseValidity.license_id || null)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                        title="Copier l'ID"
                      >
                        <Copy className="w-4 h-4 text-white/70" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          {/* Date d'expiration */}
          {licenseValidity.expires_at && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-black/50 via-pink-900/20 to-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
            >
              {/* Effet de glow subtil */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none" />
              
              <div className="relative flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30">
                  <Calendar className="w-5 h-5 text-pink-300" />
                </div>
                <h3 className="text-lg font-bold text-white">Date d'expiration</h3>
              </div>
              <div className="relative space-y-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm">Expire le</span>
                  </div>
                  <span className="text-white font-bold text-lg">
                    {formatDate(licenseValidity.expires_at)}
                  </span>
                </div>
                
                {daysRemaining !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Jours restants
                      </span>
                      <motion.span
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          isExpired
                            ? 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-400/50 shadow-lg shadow-red-500/20'
                            : isExpiringSoon
                            ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-500/20'
                            : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/50 shadow-lg shadow-green-500/20'
                        }`}
                      >
                        {isExpired 
                          ? 'Expirée' 
                          : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                        }
                      </motion.span>
                    </div>
                    
                    {/* Barre de progression visuelle */}
                    {!isExpired && daysRemaining !== null && (
                      <div className="space-y-2">
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, Math.max(0, (daysRemaining / 365) * 100))}%` 
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isExpiringSoon
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            } shadow-lg`}
                          />
                        </div>
                        <p className="text-xs text-white/60 text-center">
                          {daysRemaining > 365 
                            ? `Plus de ${Math.floor(daysRemaining / 365)} an${Math.floor(daysRemaining / 365) > 1 ? 's' : ''} restants`
                            : daysRemaining > 30
                            ? `Environ ${Math.floor(daysRemaining / 30)} mois restants`
                            : ''
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Avertissement si expiration proche */}
          <AnimatePresence>
            {isExpiringSoon && !isExpired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="relative overflow-hidden bg-gradient-to-r from-amber-900/40 via-yellow-900/40 to-amber-900/40 backdrop-blur-xl rounded-2xl p-5 border-2 border-amber-500/50 shadow-xl shadow-amber-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 animate-pulse" />
                <div className="relative flex items-start gap-4">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 flex-shrink-0"
                  >
                    <AlertTriangle className="w-6 h-6 text-amber-300" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-amber-300 font-bold mb-2 text-lg">Avertissement</h4>
                    <p className="text-white/95 text-sm leading-relaxed">
                      Votre licence expire dans <span className="font-bold text-amber-300">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>. 
                      Veuillez renouveler votre licence pour continuer à utiliser l'application.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Message si expirée */}
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="relative overflow-hidden bg-gradient-to-r from-red-900/40 via-rose-900/40 to-red-900/40 backdrop-blur-xl rounded-2xl p-5 border-2 border-red-500/50 shadow-xl shadow-red-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 animate-pulse" />
                <div className="relative flex items-start gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-2 rounded-xl bg-red-500/20 border border-red-400/30 flex-shrink-0"
                  >
                    <XCircle className="w-6 h-6 text-red-300" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-red-300 font-bold mb-2 text-lg">Licence expirée</h4>
                    <p className="text-white/95 text-sm leading-relaxed">
                      Votre licence a expiré. Veuillez renouveler votre licence pour continuer à utiliser l'application.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* Message si pas de licence */}
      <AnimatePresence>
        {!licenseValidity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden bg-gradient-to-br from-black/50 via-gray-900/30 to-black/50 backdrop-blur-xl rounded-2xl p-10 border border-white/10 shadow-xl text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 mb-6"
            >
              <Key className="w-12 h-12 text-white/40" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-3">Aucune licence trouvée</h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
              Aucune licence active n'a été trouvée pour votre compte.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)' }}
        whileTap={{ scale: 0.98 }}
        onClick={refreshLicense}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all duration-300 shadow-xl shadow-pink-500/40 border border-pink-400/30"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="w-5 h-5" />
        </motion.div>
        <span>Actualiser</span>
      </motion.button>

      {/* Informations utilisateur */}
      <AnimatePresence>
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-black/50 via-indigo-900/20 to-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
          >
            {/* Effet de glow subtil */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl pointer-events-none" />
            
            <div className="relative flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
                <Key className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-white">Informations du compte</h3>
            </div>
            <div className="relative space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium">Email</span>
                  <span className="text-white font-mono text-sm font-semibold">{user.email}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium">ID Utilisateur</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                      {user.id.substring(0, 8)}...
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopyKey(user.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                      title="Copier l'ID"
                    >
                      <Copy className="w-4 h-4 text-white/70" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LicenseTab;

