import React, { useState, useEffect } from 'react';
import { Lock, LogIn, Mail, Eye, EyeOff, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isElectron } from '../utils/electronPaths';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

// Composant de particule flottante
const FloatingParticle: React.FC<{ delay: number; duration: number; x: number; y: number }> = ({ delay, duration, x, y }) => {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-40"
      initial={{ x, y, scale: 0 }}
      animate={{
        x: [x, x + Math.random() * 200 - 100],
        y: [y, y + Math.random() * 200 - 100],
        scale: [0, 1, 0],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Composant de ligne animée
const AnimatedLine: React.FC<{ delay: number; path: string }> = ({ delay, path }) => {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <motion.path
        d={path}
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

// Composant de forme géométrique flottante
const FloatingShape: React.FC<{ delay: number; size: number; color: string }> = ({ delay, size, color }) => {
  const x = useMotionValue(Math.random() * window.innerWidth);
  const y = useMotionValue(Math.random() * window.innerHeight);
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const interval = setInterval(() => {
      x.set(Math.random() * window.innerWidth);
      y.set(Math.random() * window.innerHeight);
    }, 5000 + delay * 1000);

    return () => clearInterval(interval);
  }, [x, y, delay]);

  return (
    <motion.div
      className={`absolute ${color} opacity-20 blur-xl`}
      style={{
        width: size,
        height: size,
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        x: springX,
        y: springY,
      }}
      animate={{
        rotate: [0, 360],
        scale: [1, 1.2, 1],
      }}
      transition={{
        rotate: { duration: 20 + delay * 5, repeat: Infinity, ease: 'linear' },
        scale: { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
};

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const { addToast } = useToast();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const isElectronApp = isElectron();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        addToast('Les mots de passe ne correspondent pas', 'error');
        return;
      }
      if (password.length < 6) {
        addToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSignUpSuccess(true);
        setSignUpEmail(email);
        addToast('Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.', 'success');
        // Réinitialiser le formulaire
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        addToast('Connexion réussie', 'success');
        onLoginSuccess();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : (isSignUp ? 'Erreur lors de l\'inscription' : 'Erreur de connexion');
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Générer des particules
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 4,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
  }));

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden text-white font-sans">
      {/* Arrière-plan avec formes géométriques animées */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <FloatingShape
            key={i}
            delay={i * 0.5}
            size={200 + Math.random() * 300}
            color={i % 2 === 0 ? 'bg-pink-500' : 'bg-purple-500'}
          />
        ))}
      </div>

      {/* Grille animée */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0 0', '50px 50px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 z-0">
        {particles.map(particle => (
          <FloatingParticle
            key={particle.id}
            delay={particle.delay}
            duration={particle.duration}
            x={particle.x}
            y={particle.y}
          />
        ))}
      </div>

      {/* Lignes animées */}
      <div className="absolute inset-0 z-0">
        <AnimatedLine delay={0} path="M0,100 Q250,50 500,100 T1000,100" />
        <AnimatedLine delay={1} path="M0,300 Q250,250 500,300 T1000,300" />
        <AnimatedLine delay={2} path="M0,500 Q250,450 500,500 T1000,500" />
      </div>

      {/* Contenu principal centré */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Carte de connexion avec effet glassmorphism */}
          <div className="relative">
            {/* Effet de lueur derrière la carte */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Carte principale */}
            <motion.div
              className="relative bg-gray-900/80 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 border border-white/10 shadow-2xl"
              whileHover={{ borderColor: 'rgba(236, 72, 153, 0.5)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Header animé */}
              <motion.div
                className="flex flex-col items-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="relative mb-6"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-lg opacity-50"></div>
                  <motion.div
                    className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Lock className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>

                <motion.h2
                  className="text-3xl lg:text-4xl font-black text-center mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
                    {isSignUp ? 'Créer un compte' : 'Connexion '}
                  </span>
                </motion.h2>
                <motion.p
                  className="text-gray-400 text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {isSignUp ? 'Rejoignez la communauté' : 'Accès sécurisé à votre espace de gestion des Mur '}
                </motion.p>
              </motion.div>

              {/* Message de confirmation après inscription */}
              <AnimatePresence>
                {signUpSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="mb-6 p-6 bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-green-900/40 backdrop-blur-xl rounded-2xl border-2 border-green-500/50 shadow-xl shadow-green-500/20"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="p-4 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-400/50"
                      >
                        <CheckCircle className="w-12 h-12 text-green-300" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-green-300 mb-2">
                          Inscription réussie !
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          Un email de confirmation a été envoyé à
                        </p>
                        <p className="text-green-300 font-semibold mt-1 break-all">
                          {signUpEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/10">
                        <Mail className="w-6 h-6 text-green-400 flex-shrink-0" />
                        <p className="text-white/90 text-sm text-left">
                          <span className="font-semibold text-green-300">Vérifiez votre boîte mail</span> pour confirmer votre compte et activer votre accès.
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSignUpSuccess(false);
                          setIsSignUp(false);
                          setEmail('');
                          setPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg"
                      >
                        Retour à la connexion
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulaire */}
              {!signUpSuccess && (
                <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-400 ml-1 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  <div className="relative group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="relative w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                      placeholder="admin@party-wall.com"
                      required
                      autoFocus
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-400 ml-1 flex items-center gap-2">
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
                      onChange={e => setPassword(e.target.value)}
                      className="relative w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-bold uppercase tracking-wider text-pink-400 ml-1 flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Confirmer le mot de passe
                      </label>
                      <div className="relative group">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="relative w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                          placeholder="••••••••"
                          required={isSignUp}
                          minLength={6}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    <span className="relative flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                    </span>
                  )}
                </motion.button>
              </form>
              )}

              {/* Footer avec options */}
              {!signUpSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 space-y-3"
              >
                {/* Bouton d'inscription */}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-sm font-medium text-gray-400 hover:text-pink-400 transition-colors py-2 flex items-center justify-center gap-2 group"
                >
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-block"
                  >
                    {isSignUp ? '←' : '→'}
                  </motion.span>
                  {isSignUp ? 'Déjà membre ? Connectez-vous' : 'Pas encore de compte ? Inscrivez-vous'}
                </button>

                {!isElectronApp && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full text-sm font-medium text-gray-500 hover:text-pink-400 transition-colors py-2 flex items-center justify-center gap-2 group"
                  >
                    <motion.span
                      whileHover={{ x: -5 }}
                      className="inline-block"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </motion.span>
                    Retour à l'accueil
                  </button>
                )}
              </motion.div>
              )}

              {/* Badge de sécurité */}
              {!signUpSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500"
              >
                <Shield className="w-4 h-4" />
                <span>Connexion sécurisée SSL</span>
              </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;

