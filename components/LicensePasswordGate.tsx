import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { LICENSE_MANAGER_PASSWORD } from '../constants';
import LicenseManager from './LicenseManager';

interface LicensePasswordGateProps {
  onBack: () => void;
}

const SESSION_STORAGE_KEY = 'license_manager_authenticated';

const LicensePasswordGate: React.FC<LicensePasswordGateProps> = ({ onBack }) => {
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà authentifié
  useEffect(() => {
    const authenticated = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Vérifier le mot de passe
      if (password === LICENSE_MANAGER_PASSWORD) {
        // Stocker l'authentification dans sessionStorage
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
        addToast('Accès autorisé', 'success');
      } else {
        setError('Mot de passe incorrect');
        addToast('Mot de passe incorrect', 'error');
        setPassword('');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
      addToast('Erreur lors de la vérification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  // Si authentifié, afficher LicenseManager
  if (isAuthenticated) {
    return (
      <div className="relative">
        <LicenseManager onBack={onBack} />
        {/* Bouton de déconnexion discret en haut à droite */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-all backdrop-blur-sm"
          title="Se déconnecter"
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Déconnexion
        </motion.button>
      </div>
    );
  }

  // Sinon, afficher le formulaire de mot de passe
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Particules animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-pink-500/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Forme géométrique flottante */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Accès Protégé
            </h1>
            <p className="text-gray-400 text-sm">
              Gestionnaire de licences
            </p>
          </motion.div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 ml-1 flex items-center gap-2 mb-2">
                <Lock className="w-3 h-3" />
                Mot de passe
              </label>
              <div className="relative group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="relative w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                  placeholder="Entrez le mot de passe"
                  required
                  autoFocus
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Message d'erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton de soumission */}
            <motion.button
              type="submit"
              disabled={loading || !password}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Accéder</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Bouton retour */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onBack}
            className="mt-6 w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </motion.button>

          {/* Badge de sécurité */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500"
          >
            <Shield className="w-4 h-4" />
            <span>Accès sécurisé</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LicensePasswordGate;

