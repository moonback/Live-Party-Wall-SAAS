import React from 'react';
import { motion } from 'framer-motion';
import { 
  Key, Calendar, Clock, CheckCircle, XCircle, 
  AlertTriangle, Shield, Copy, ExternalLink
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

  // Ouvrir le gestionnaire de licences
  const handleOpenLicenseManager = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'license-management');
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Chargement des informations de licence...</p>
        </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${
            isValid 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
              : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30'
          }`}>
            {isValid ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">Licence</h2>
            <p className={`text-sm font-semibold ${
              isValid ? 'text-green-400' : 'text-red-400'
            }`}>
              {isValid ? 'Licence active' : 'Licence expirée ou invalide'}
            </p>
          </div>
        </div>
      </div>

      {/* Informations de la licence */}
      {licenseValidity && (
        <div className="space-y-4">
          {/* Statut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Statut</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Statut de la licence</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isValid 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {licenseValidity.status || 'N/A'}
                </span>
              </div>
              
              {licenseValidity.license_id && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">ID de la licence</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-white/80 bg-black/40 px-2 py-1 rounded">
                      {licenseValidity.license_id.substring(0, 8)}...
                    </code>
                    <button
                      onClick={() => handleCopyKey(licenseValidity.license_id || null)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Copier l'ID"
                    >
                      <Copy className="w-4 h-4 text-white/60" />
                    </button>
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
              transition={{ delay: 0.1 }}
              className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-semibold text-white">Date d'expiration</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Expire le</span>
                  <span className="text-white font-semibold">
                    {formatDate(licenseValidity.expires_at)}
                  </span>
                </div>
                
                {daysRemaining !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Jours restants</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isExpired
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isExpiringSoon
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {isExpired 
                        ? 'Expirée' 
                        : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Avertissement si expiration proche */}
          {isExpiringSoon && !isExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm rounded-xl p-5 border border-amber-500/30"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-amber-400 font-semibold mb-1">Avertissement</h4>
                  <p className="text-white/90 text-sm">
                    Votre licence expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}. 
                    Veuillez renouveler votre licence pour continuer à utiliser l'application.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Message si expirée */}
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-900/30 to-rose-900/30 backdrop-blur-sm rounded-xl p-5 border border-red-500/30"
            >
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-400 font-semibold mb-1">Licence expirée</h4>
                  <p className="text-white/90 text-sm">
                    Votre licence a expiré. Veuillez renouveler votre licence pour continuer à utiliser l'application.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Message si pas de licence */}
      {!licenseValidity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center"
        >
          <Key className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune licence trouvée</h3>
          <p className="text-white/70 text-sm mb-4">
            Aucune licence active n'a été trouvée pour votre compte.
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={refreshLicense}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-pink-500/30"
        >
          <Clock className="w-5 h-5" />
          <span>Actualiser</span>
        </motion.button>

        
      </div>

      {/* Informations utilisateur */}
      {user && (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Compte</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Email</span>
              <span className="text-white font-mono text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">ID Utilisateur</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-white/80 bg-black/40 px-2 py-1 rounded">
                  {user.id.substring(0, 8)}...
                </code>
                <button
                  onClick={() => handleCopyKey(user.id)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="Copier l'ID"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseTab;

