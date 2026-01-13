import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lock, LogIn, Mail, Eye, EyeOff, ArrowLeft, Shield, CheckCircle, AlertCircle, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isElectron, getStaticAssetPath } from '../utils/electronPaths';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

// Composant de particule flottante optimisé
const FloatingParticle: React.FC<{ delay: number; duration: number; x: number; y: number }> = ({ delay, duration, x, y }) => {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-30"
      style={{ willChange: 'transform, opacity' }}
      initial={{ x, y, scale: 0, opacity: 0 }}
      animate={{
        x: [x, x + Math.random() * 150 - 75],
        y: [y, y + Math.random() * 150 - 75],
        scale: [0, 1, 0],
        opacity: [0, 0.4, 0],
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

// Composant de forme géométrique flottante optimisé
const FloatingShape: React.FC<{ delay: number; size: number; color: string; initialX: number; initialY: number }> = ({ delay, size, color, initialX, initialY }) => {
  return (
    <motion.div
      className={`absolute ${color} opacity-15 blur-2xl`}
      style={{
        width: size,
        height: size,
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        willChange: 'transform',
        x: initialX,
        y: initialY,
      }}
      animate={{
        x: [initialX, initialX + 100, initialX - 50, initialX],
        y: [initialY, initialY + 80, initialY - 60, initialY],
        rotate: [0, 180, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        x: { duration: 15 + delay * 3, repeat: Infinity, ease: 'easeInOut' },
        y: { duration: 18 + delay * 3, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 25 + delay * 5, repeat: Infinity, ease: 'linear' },
        scale: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
};

// Types pour la force du mot de passe
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [emailError, setEmailError] = useState<string>('');
  const isElectronApp = isElectron();

  // Validation d'email améliorée
  const validateEmail = useCallback((emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Format d\'email invalide');
      return false;
    }
    if (emailValue.length > 254) {
      setEmailError('Email trop long (max 254 caractères)');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  // Calcul de la force du mot de passe
  const passwordRequirements = useMemo((): PasswordRequirements => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo((): PasswordStrength => {
    const requirements = passwordRequirements;
    const metCount = Object.values(requirements).filter(Boolean).length;
    
    if (password.length === 0) return 'weak';
    if (metCount <= 2) return 'weak';
    if (metCount === 3) return 'fair';
    if (metCount === 4) return 'good';
    return 'strong';
  }, [password, passwordRequirements]);

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

  // Vérifier le lockout
  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      if (minutes > 0 || seconds > 0) {
        // Le lockout est toujours actif
        return;
      }
    }
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier le lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      addToast(`Trop de tentatives. Réessayez dans ${minutes > 0 ? `${minutes}min ` : ''}${seconds}s`, 'error');
      return;
    }

    // Validation email
    if (!validateEmail(email)) {
      return;
    }

    // Validation mot de passe pour inscription
    if (isSignUp) {
      if (password !== confirmPassword) {
        addToast('Les mots de passe ne correspondent pas', 'error');
        return;
      }
      if (password.length < 8) {
        addToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
        return;
      }
      if (passwordStrength === 'weak' || passwordStrength === 'fair') {
        addToast('Le mot de passe est trop faible. Utilisez des majuscules, chiffres et caractères spéciaux.', 'error');
        return;
      }
      // Vérifier au moins 3 critères sur 5
      const metCount = Object.values(passwordRequirements).filter(Boolean).length;
      if (metCount < 3) {
        addToast('Le mot de passe ne respecte pas les critères de sécurité minimum', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSignUpSuccess(true);
        setSignUpEmail(email);
        setFailedAttempts(0);
        addToast('Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.', 'success');
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        setFailedAttempts(0);
        addToast('Connexion réussie', 'success');
        onLoginSuccess();
      }
    } catch (error: unknown) {
      // Gestion sécurisée des erreurs (ne pas révéler si l'email existe)
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Messages d'erreur génériques pour la sécurité
      let userMessage = isSignUp ? 'Erreur lors de l\'inscription' : 'Email ou mot de passe incorrect';
      
      // Messages spécifiques pour certains cas
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        userMessage = isSignUp ? 'Cet email est déjà utilisé' : 'Email ou mot de passe incorrect';
      } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
        userMessage = 'Email ou mot de passe incorrect';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        userMessage = 'Trop de tentatives. Veuillez patienter quelques instants.';
      }

      addToast(userMessage, 'error');
      
      // Rate limiting : après 3 échecs, lockout de 30 secondes, puis 1 min, puis 5 min
      if (!isSignUp) {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (newFailedAttempts >= 5) {
          setLockoutUntil(Date.now() + 5 * 60 * 1000); // 5 minutes
          addToast('Trop de tentatives échouées. Compte verrouillé pendant 5 minutes.', 'error');
        } else if (newFailedAttempts >= 3) {
          setLockoutUntil(Date.now() + 60 * 1000); // 1 minute
          addToast('Trop de tentatives. Veuillez patienter 1 minute.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser les tentatives après succès
  useEffect(() => {
    if (signUpSuccess) {
      setFailedAttempts(0);
      setLockoutUntil(null);
    }
  }, [signUpSuccess]);

  // Générer des particules optimisées (réduit de 30 à 8)
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 4 + Math.random() * 3,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
  })), []);

  // Générer des formes flottantes optimisées (réduit de 8 à 3)
  const floatingShapes = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      delay: i * 0.8,
      size: 250 + Math.random() * 200,
      color: i % 2 === 0 ? 'bg-pink-500' : 'bg-purple-500',
      initialX: Math.random() * width * 0.8,
      initialY: Math.random() * height * 0.8,
    }));
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden text-white font-sans">
      {/* Arrière-plan avec formes géométriques animées optimisées */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ willChange: 'contents' }}>
        {floatingShapes.map(shape => (
          <FloatingShape
            key={shape.id}
            delay={shape.delay}
            size={shape.size}
            color={shape.color}
            initialX={shape.initialX}
            initialY={shape.initialY}
          />
        ))}
      </div>

      {/* Grille statique optimisée */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(236, 72, 153, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Particules flottantes optimisées */}
      <div className="absolute inset-0 z-0" style={{ willChange: 'contents' }}>
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
            {/* Effet de lueur derrière la carte optimisé */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-40"
              style={{ willChange: 'opacity' }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Carte principale */}
            <motion.div
              className="relative bg-black/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 lg:p-10 border border-white/10 shadow-2xl"
              whileHover={{ borderColor: 'rgba(236, 72, 153, 0.3)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Header animé */}
              <motion.div
                className="flex flex-col items-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Logo */}
                <motion.div
                  className="relative mb-4"
                  style={{ willChange: 'transform' }}
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-40 scale-110"></div>
                  <motion.div
                    className="relative w-24 h-24 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={getStaticAssetPath('logo-accueil.png')}
                      alt="Partywall Logo"
                      className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(236,72,153,0.5)]"
                    />
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value) validateEmail(e.target.value);
                      }}
                      onBlur={() => validateEmail(email)}
                      className={`relative w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm ${
                        emailError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10'
                      }`}
                      placeholder="admin@party-wall.com"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                    {emailError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </motion.div>
                    )}
                  </div>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {emailError}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-pink-400 ml-1 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Mot de passe
                    </label>
                    {isSignUp && password && (
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
                      className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="relative w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                      minLength={isSignUp ? 8 : 6}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-400 transition-colors p-1"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Indicateur de force du mot de passe (inscription uniquement) */}
                  {isSignUp && password && (
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
                          className={`relative w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600 backdrop-blur-sm ${
                            confirmPassword && password !== confirmPassword
                              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                              : confirmPassword && password === confirmPassword
                              ? 'border-green-500/50 focus:border-green-500/50'
                              : 'border-white/10'
                          }`}
                          placeholder="••••••••"
                          required={isSignUp}
                          minLength={8}
                          autoComplete="new-password"
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
                        {confirmPassword && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            {password === confirmPassword ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </motion.div>
                        )}
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-red-400 flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Les mots de passe ne correspondent pas
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avertissement de lockout */}
                {lockoutUntil && Date.now() < lockoutUntil && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Compte temporairement verrouillé. Réessayez dans{' '}
                        {Math.ceil((lockoutUntil - Date.now()) / 1000)}s
                      </span>
                    </div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: lockoutUntil && Date.now() < lockoutUntil ? 1 : 1.02 }}
                  whileTap={{ scale: lockoutUntil && Date.now() < lockoutUntil ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading || (lockoutUntil !== null && Date.now() < lockoutUntil)}
                  className="relative w-full overflow-hidden bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ willChange: 'transform' }}
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  {loading ? (
                    <div className="relative flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
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

              {/* Badge de sécurité et informations */}
              {!signUpSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 space-y-2"
              >
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Connexion sécurisée SSL</span>
                </div>
                {failedAttempts > 0 && failedAttempts < 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{failedAttempts} tentative{failedAttempts > 1 ? 's' : ''} échouée{failedAttempts > 1 ? 's' : ''}</span>
                  </motion.div>
                )}
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

