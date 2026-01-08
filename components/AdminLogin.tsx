import React, { useState } from 'react';
import { Lock, LogIn, Shield, Zap, BarChart3, Users, Image, Settings, Sparkles, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
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
        addToast('Inscription réussie ! Vous êtes maintenant connecté.', 'success');
        onLoginSuccess();
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

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white font-sans">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Layout deux colonnes */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        
        {/* Colonne gauche - Formulaire */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12"
        >
          <div className="w-full max-w-md">
            <motion.div 
              className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 lg:p-12 border border-white/10 relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(236, 72, 153, 0.3)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Effet de reflet sur le formulaire */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>

              <div className="flex flex-col items-center mb-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_10px_30px_rgba(236,72,153,0.4)] mb-6 transform rotate-12"
                >
                  <Lock className="w-12 h-12 text-white -rotate-12" />
                </motion.div>
                
                <h2 className="text-4xl font-black tracking-tight text-center bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                  {isSignUp ? 'Créer un compte' : 'Connexion'}
                </h2>
                <p className="text-gray-400 mt-3 text-center font-medium">
                  {isSignUp ? 'Rejoignez l\'aventure Party Wall' : 'Accès réservé aux administrateurs'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-pink-500 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600"
                      placeholder="admin@party-wall.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-pink-500 ml-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isSignUp && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-bold uppercase tracking-widest text-pink-500 ml-1">Confirmer</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 text-white outline-none transition-all placeholder:text-gray-600"
                          placeholder="••••••••"
                          required={isSignUp}
                          minLength={6}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-3 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      {isSignUp ? 'Créer mon compte' : 'Se connecter maintenant'}
                    </>
                  )}
                </motion.button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                  <span className="bg-transparent px-4 text-gray-500 font-bold">Options</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-sm font-bold text-gray-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-2"
                >
                  {isSignUp ? 'Déjà membre ? Connectez-vous' : 'Pas encore de compte ? Inscrivez-vous'}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full text-sm font-bold text-gray-500 hover:text-pink-400 transition-colors py-2 flex items-center justify-center gap-2 group"
                >
                  <motion.span whileHover={{ x: -3 }} className="inline-block">←</motion.span>
                  Retour à l'accueil
                </button>
              </div>
            </motion.div>

            {/* Preuve sociale discrète */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex items-center justify-center gap-4 text-gray-500"
            >
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover grayscale opacity-50" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium">+500 organisateurs nous font confiance</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Colonne droite - Contenu marketing premium */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-sm border-l border-white/5"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-black uppercase tracking-widest text-pink-400">Administration SaaS Pro</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
              Propulsez votre <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 animate-gradient-x">
                Événement
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 leading-relaxed font-medium">
              Pilotez votre mur de photos avec une précision chirurgicale. Modération IA, statistiques et personnalisation totale.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Shield />, title: "Modération IA", desc: "Propulsé par Google Gemini", color: "pink" },
                { icon: <Zap />, title: "Temps Réel", desc: "Zéro latence garantie", color: "purple" },
                { icon: <BarChart3 />, title: "Analytics", desc: "Rapports détaillés", color: "fuchsia" },
                { icon: <Settings />, title: "Customisation", desc: "Cadres & filtres illimités", color: "pink" },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  className="p-6 rounded-[2rem] border border-white/5 bg-white/2 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center mb-4 text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                    {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Footer marketing */}
            <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">IA Ready</p>
                  <p className="text-gray-500 text-xs text-nowrap">Intégration Gemini 3.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">Multi-tenant</p>
                  <p className="text-gray-500 text-xs text-nowrap">Gestion multi-événements</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;

