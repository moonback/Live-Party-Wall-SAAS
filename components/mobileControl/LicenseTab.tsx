import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Calendar, Clock, XCircle, 
  AlertTriangle, Shield, Copy, TrendingUp,
  Ban, Loader2, Eye, EyeOff, Info
} from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { revokeLicenseByKey, getActiveLicense } from '../../services/licenseService';
import { getLicenseSuffix, isProLicense, isPartLicense } from '../../utils/licenseUtils';
import { License } from '../../types';
import { Crown, User } from 'lucide-react';

const LicenseTab: React.FC = () => {
  const { licenseValidity, loading, refreshLicense } = useLicense();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showFullLicenseId, setShowFullLicenseId] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [activeLicense, setActiveLicense] = useState<License | null>(null);
  const [showLicenseNumber, setShowLicenseNumber] = useState(false);

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

  const daysRemaining = licenseValidity?.expires_at 
    ? getDaysRemaining(licenseValidity.expires_at) 
    : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;
  const isValid = licenseValidity?.is_valid ?? false;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header avec statut */}
      

      {/* Informations de la licence */}
      <AnimatePresence>
        {licenseValidity && (
          <div className="space-y-3">
            {/* Statut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-slate-700/50 shadow-xl"
            >
              {/* Effet de brillance animé */}
              <div className={`absolute inset-0 bg-gradient-to-r ${
                isValid 
                  ? 'from-green-500/5 via-emerald-500/5 to-green-500/5' 
                  : 'from-red-500/5 via-rose-500/5 to-red-500/5'
              } opacity-50`} />
              
              {/* Header amélioré */}
              <div className="relative flex items-center gap-3 mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`relative p-2.5 rounded-xl ${
                    isValid 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 shadow-lg shadow-green-500/10' 
                      : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/30 shadow-lg shadow-red-500/10'
                  }`}
                >
                  <Shield className={`w-5 h-5 md:w-6 md:h-6 ${
                    isValid ? 'text-green-400' : 'text-red-400'
                  }`} />
                  {isValid && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl bg-green-400/20 blur-md"
                    />
                  )}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-0.5">Statut de la licence</h3>
                  <p className="text-xs text-slate-400">Informations détaillées sur votre licence</p>
                </div>
              </div>

              <div className="relative space-y-3">
                {/* Statut avec design amélioré */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm shadow-inner"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${
                      isValid ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'
                    }`} />
                    <span className="text-white/90 font-semibold text-sm md:text-base">Statut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg ${
                        isValid 
                          ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/40 shadow-green-500/20' 
                          : 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-400/40 shadow-red-500/20'
                      }`}
                    >
                      {licenseValidity.status || 'N/A'}
                      {isValid && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-lg bg-green-400/20 blur-sm"
                        />
                      )}
                    </motion.div>
                    {/* Badge type de licence */}
                    {activeLicense?.license_key && (
                      <>
                        {isProLicense(activeLicense.license_key) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/20"
                          >
                            <Crown className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">PRO</span>
                          </motion.div>
                        )}
                        {isPartLicense(activeLicense.license_key) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/30 border border-slate-600/40 text-slate-400 shadow-lg"
                          >
                            <User className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-wider">PART</span>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
                
                {/* ID de la licence avec design amélioré */}
                {licenseValidity.license_id && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative p-3.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="text-white/90 font-semibold text-sm">ID de la licence</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowFullLicenseId(!showFullLicenseId)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                          title={showFullLicenseId ? "Masquer" : "Afficher complet"}
                        >
                          {showFullLicenseId ? (
                            <EyeOff className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-300" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopyKey(licenseValidity.license_id || null)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-400/30"
                          title="Copier l'ID complet"
                        >
                          <Copy className="w-4 h-4 text-indigo-300" />
                        </motion.button>
                      </div>
                    </div>
                    <code className="block text-xs md:text-sm font-mono text-slate-200 bg-slate-950/60 px-3 py-2.5 rounded-lg border border-slate-700/50 break-all shadow-inner">
                      {showFullLicenseId ? licenseValidity.license_id : `${licenseValidity.license_id.substring(0, 16)}...`}
                    </code>
                  </motion.div>
                )}

                {/* Numéro de licence depuis la base de données */}
                {activeLicense?.license_key && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative p-3.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30">
                          <Key className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-white/90 font-semibold text-sm">Numéro de licence</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowLicenseNumber(!showLicenseNumber)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                          title={showLicenseNumber ? "Masquer" : "Afficher"}
                        >
                          {showLicenseNumber ? (
                            <EyeOff className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-300" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopyKey(activeLicense.license_key)}
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-400/30"
                          title="Copier le numéro"
                        >
                          <Copy className="w-4 h-4 text-purple-300" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <code className="block text-xs md:text-sm font-mono text-slate-200 bg-slate-950/60 px-3 py-2.5 rounded-lg border border-slate-700/50 break-all shadow-inner">
                        {showLicenseNumber 
                          ? activeLicense.license_key 
                          : `${activeLicense.license_key.substring(0, activeLicense.license_key.length - 4)}`
                        }
                      </code>
                      {/* {!showLicenseNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Code:</span>
                          <code className="text-xs md:text-sm font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">
                            {getLicenseSuffix(activeLicense.license_key)}
                          </code>
                        </div>
                      )} */}
                    </div>
                  </motion.div>
                )}

                {/* Clé de licence stockée (fallback) */}
                {!activeLicense?.license_key && localStorage.getItem('partywall_license_key') && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="relative p-3.5 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-amber-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span className="text-white/90 font-semibold text-sm">Clé de licence (local)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowLicenseKey(!showLicenseKey)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                          title={showLicenseKey ? "Masquer" : "Afficher"}
                        >
                          {showLicenseKey ? (
                            <EyeOff className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Eye className="w-4 h-4 text-slate-300" />
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopyKey(localStorage.getItem('partywall_license_key'))}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-400/30"
                          title="Copier la clé"
                        >
                          <Copy className="w-4 h-4 text-amber-300" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <code className="block text-xs md:text-sm font-mono text-slate-200 bg-slate-950/60 px-3 py-2.5 rounded-lg border border-slate-700/50 break-all shadow-inner">
                        {showLicenseKey 
                          ? localStorage.getItem('partywall_license_key') 
                          : `${localStorage.getItem('partywall_license_key')?.substring(0, (localStorage.getItem('partywall_license_key')?.length || 0) - 4)}`
                        }
                      </code>
                      {!showLicenseKey && localStorage.getItem('partywall_license_key') && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Code:</span>
                          <code className="text-xs md:text-sm font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">
                            {getLicenseSuffix(localStorage.getItem('partywall_license_key'))}
                          </code>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

          {/* Date d'expiration */}
          {licenseValidity.expires_at && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-slate-700/50 shadow-xl"
            >
              {/* Effet de brillance animé selon le statut */}
              <div className={`absolute inset-0 bg-gradient-to-r ${
                isExpired
                  ? 'from-red-500/5 via-rose-500/5 to-red-500/5'
                  : isExpiringSoon
                  ? 'from-amber-500/5 via-yellow-500/5 to-amber-500/5'
                  : 'from-blue-500/5 via-cyan-500/5 to-blue-500/5'
              } opacity-50`} />
              
              {/* Header amélioré */}
              <div className="relative flex items-center gap-3 mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`relative p-2.5 rounded-xl ${
                    isExpired
                      ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/30 shadow-lg shadow-red-500/10'
                      : isExpiringSoon
                      ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/30 shadow-lg shadow-amber-500/10'
                      : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                  }`}
                >
                  <Calendar className={`w-5 h-5 md:w-6 md:h-6 ${
                    isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-blue-400'
                  }`} />
                  {!isExpired && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 rounded-xl ${
                        isExpiringSoon ? 'bg-amber-400/20' : 'bg-blue-400/20'
                      } blur-md`}
                    />
                  )}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-0.5">Date d'expiration</h3>
                  <p className="text-xs text-slate-400">Informations sur la validité de votre licence</p>
                </div>
              </div>

              <div className="relative space-y-3">
                {/* Date d'expiration avec design amélioré */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="relative p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm shadow-inner"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${
                        isExpired ? 'bg-red-400 animate-pulse' : isExpiringSoon ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'
                      }`} />
                      <span className="text-white/90 font-semibold text-sm md:text-base">Date d'expiration</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="block text-white font-bold text-lg md:text-xl"
                    >
                      {formatDate(licenseValidity.expires_at)}
                    </motion.span>
                    {daysRemaining !== null && !isExpired && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className={`block text-sm font-medium ${
                          isExpiringSoon ? 'text-amber-300' : 'text-blue-300'
                        }`}
                      >
                        {daysRemaining > 0 
                          ? `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                          : 'Aujourd\'hui'
                        }
                      </motion.span>
                    )}
                  </div>
                </motion.div>
                
                {/* Jours restants avec barre de progression améliorée */}
                {daysRemaining !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${
                          isExpired
                            ? 'bg-red-500/20 border border-red-400/30'
                            : isExpiringSoon
                            ? 'bg-amber-500/20 border border-amber-400/30'
                            : 'bg-green-500/20 border border-green-400/30'
                        }`}>
                          <TrendingUp className={`w-4 h-4 ${
                            isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-green-400'
                          }`} />
                        </div>
                        <span className="text-white/90 font-semibold text-sm md:text-base">Jours restants</span>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg ${
                          isExpired
                            ? 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border border-red-400/40 shadow-red-500/20'
                            : isExpiringSoon
                            ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border border-amber-400/40 shadow-amber-500/20'
                            : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/40 shadow-green-500/20'
                        }`}
                      >
                        {isExpired 
                          ? 'Expirée' 
                          : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                        }
                        {!isExpired && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`absolute inset-0 rounded-lg blur-sm ${
                              isExpiringSoon ? 'bg-amber-400/20' : 'bg-green-400/20'
                            }`}
                          />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Barre de progression visuelle améliorée */}
                    {!isExpired && daysRemaining !== null && (
                      <div className="space-y-2.5">
                        <div className="relative h-3 bg-slate-950/60 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, Math.max(0, (daysRemaining / 365) * 100))}%` 
                            }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isExpiringSoon
                                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500'
                                : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'
                            } shadow-lg`}
                          >
                            {!isExpiringSoon && (
                              <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              />
                            )}
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">
                            {daysRemaining > 365 
                              ? `Plus de ${Math.floor(daysRemaining / 365)} an${Math.floor(daysRemaining / 365) > 1 ? 's' : ''} restants`
                              : daysRemaining > 30
                              ? `Environ ${Math.floor(daysRemaining / 30)} mois restants`
                              : daysRemaining > 7
                              ? `${Math.floor(daysRemaining / 7)} semaine${Math.floor(daysRemaining / 7) > 1 ? 's' : ''} restantes`
                              : ''
                            }
                          </span>
                          <span className={`font-bold ${
                            isExpiringSoon ? 'text-amber-300' : 'text-green-300'
                          }`}>
                            {Math.round((daysRemaining / 365) * 100)}% restant
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
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
                transition={{ duration: 0.25 }}
                className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-500/30 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 flex-shrink-0"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-amber-400 font-bold mb-1 text-sm md:text-base">Avertissement</h4>
                    <p className="text-white/90 text-xs leading-relaxed">
                      Votre licence expire dans <span className="font-bold text-amber-400">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>. 
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
                transition={{ duration: 0.25 }}
                className="bg-red-500/10 backdrop-blur-sm rounded-lg p-3 border border-red-500/30 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-1.5 rounded-lg bg-red-500/20 border border-red-400/30 flex-shrink-0"
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-red-400 font-bold mb-1 text-sm md:text-base">Licence expirée</h4>
                    <p className="text-white/90 text-xs leading-relaxed">
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

      {/* Informations utilisateur */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LicenseTab;

