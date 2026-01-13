import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Info, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface PasswordChangeTabProps {
  // Aucune prop nécessaire pour l'instant
}

// Types pour la force du mot de passe
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const PasswordChangeTab: React.FC<PasswordChangeTabProps> = () => {
  const { updatePassword, user } = useAuth();
  const { addToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calcul de la force du mot de passe
  const passwordRequirements = useMemo((): PasswordRequirements => {
    return {
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  const passwordStrength = useMemo((): PasswordStrength => {
    const requirements = passwordRequirements;
    const metCount = Object.values(requirements).filter(Boolean).length;
    
    if (newPassword.length === 0) return 'weak';
    if (metCount <= 2) return 'weak';
    if (metCount === 3) return 'fair';
    if (metCount === 4) return 'good';
    return 'strong';
  }, [newPassword, passwordRequirements]);

  const getPasswordStrengthColor = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak': return 'from-red-500 to-red-600';
      case 'fair': return 'from-orange-500 to-orange-600';
      case 'good': return 'from-yellow-500 to-yellow-600';
      case 'strong': return 'from-green-500 to-green-600';
    }
  };

  const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
    switch (strength) {
      case 'weak': return 'Faible';
      case 'fair': return 'Moyen';
      case 'good': return 'Bon';
      case 'strong': return 'Fort';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword) {
      addToast('Veuillez entrer votre mot de passe actuel', 'error');
      return;
    }

    if (!newPassword) {
      addToast('Veuillez entrer un nouveau mot de passe', 'error');
      return;
    }

    if (newPassword.length < 8) {
      addToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    if (passwordStrength === 'weak' || passwordStrength === 'fair') {
      addToast('Le mot de passe est trop faible. Utilisez des majuscules, chiffres et caractères spéciaux.', 'error');
      return;
    }

    const metCount = Object.values(passwordRequirements).filter(Boolean).length;
    if (metCount < 3) {
      addToast('Le mot de passe ne respecte pas les critères de sécurité minimum', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      addToast('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
      return;
    }

    setLoading(true);

    try {
      // Note: Supabase ne nécessite pas l'ancien mot de passe pour updateUser
      // mais nous le demandons pour une meilleure UX et sécurité
      await updatePassword(newPassword);
      setSuccess(true);
      addToast('Mot de passe modifié avec succès', 'success');
      
      // Réinitialiser le formulaire après 2 secondes
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification du mot de passe';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-xl"></div>
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <Shield className="w-6 h-6 text-indigo-300" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Modification du mot de passe</h2>
              <p className="text-sm text-slate-400 mt-1">Sécurisez votre compte avec un mot de passe fort</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-xl shadow-xl">
        <div className="relative px-6 py-6">
          <AnimatePresence>
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="p-4 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-400/50 mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-300 mb-2">Mot de passe modifié !</h3>
                <p className="text-slate-400">Votre mot de passe a été mis à jour avec succès.</p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Email actuel (lecture seule) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Email du compte
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-4 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Mot de passe actuel */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 ml-1 flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Mot de passe actuel
                  </label>
                  <div className="relative group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                    />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="relative w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors p-1"
                      aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 ml-1 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Nouveau mot de passe
                    </label>
                    {newPassword && (
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${getPasswordStrengthColor(passwordStrength)}`} />
                        <span className={`text-[10px] font-semibold ${
                          passwordStrength === 'weak' ? 'text-red-400' :
                          passwordStrength === 'fair' ? 'text-orange-400' :
                          passwordStrength === 'good' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {getPasswordStrengthLabel(passwordStrength)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                    />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="relative w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors p-1"
                      aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Indicateur de force du mot de passe */}
                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="text-[10px] font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                        <Info className="w-3 h-3" />
                        Critères de sécurité :
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: 'minLength', label: 'Au moins 8 caractères', met: passwordRequirements.minLength },
                          { key: 'hasUpperCase', label: 'Une majuscule', met: passwordRequirements.hasUpperCase },
                          { key: 'hasLowerCase', label: 'Une minuscule', met: passwordRequirements.hasLowerCase },
                          { key: 'hasNumber', label: 'Un chiffre', met: passwordRequirements.hasNumber },
                          { key: 'hasSpecialChar', label: 'Un caractère spécial', met: passwordRequirements.hasSpecialChar },
                        ].map(({ key, label, met }) => (
                          <div key={key} className="flex items-center gap-2 text-[10px]">
                            {met ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-400/50" />
                            )}
                            <span className={met ? 'text-green-400' : 'text-white/40'}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirmation du nouveau mot de passe */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 ml-1 flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`relative w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                          : confirmPassword && newPassword === confirmPassword
                          ? 'border-green-500/50 focus:border-green-500/50'
                          : 'border-white/10'
                      }`}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    {confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {newPassword === confirmPassword ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </motion.div>
                    )}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Les mots de passe ne correspondent pas
                    </motion.p>
                  )}
                </div>

                {/* Bouton de soumission */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="relative w-full overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  {loading ? (
                    <div className="relative flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Modification...</span>
                    </div>
                  ) : (
                    <span className="relative flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Modifier le mot de passe
                    </span>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

