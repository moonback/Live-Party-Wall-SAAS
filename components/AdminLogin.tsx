import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-pink-700 text-white p-4">
      {/* Halo de flou décoratif */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-24 -left-28 w-96 h-96 bg-pink-500/30 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-24 -right-28 w-96 h-96 bg-purple-500/20 blur-3xl rounded-full"></div>
      </div>
      <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-gray-700 z-10 relative">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-pink-600 via-pink-500 to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg mb-5 border-4 border-white/10">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black">Espace Administration</h2>
          <p className="text-gray-400 mt-2 text-center text-base font-medium">
            {isSignUp ? (
              'Créer un compte administrateur'
            ) : (
              <>
                Accès <span className="text-pink-400 underline underline-offset-4">restreint</span> aux modérateurs
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-gray-700 hover:border-pink-500/80 rounded-xl focus:ring-2 focus:ring-pink-500/60 focus:border-pink-500/80 text-white outline-none transition-all shadow-sm placeholder:text-gray-400"
              placeholder="admin@example.com"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-gray-700 hover:border-pink-500/80 rounded-xl focus:ring-2 focus:ring-pink-500/60 focus:border-pink-500/80 text-white outline-none transition-all shadow-sm placeholder:text-gray-400 pr-12"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPassword(prev => !prev)}
                tabIndex={-1}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-pink-400 transition-all"
                style={{ outline: 'none' }}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9-4.03-9-7 0-1.164.397-2.244 1.081-3.192m1.59-1.637A9.964 9.964 0 0 1 12 5c5 0 9 4.03 9 7 0 1.25-.438 2.456-1.264 3.584m-1.526 1.63A4 4 0 0 1 8.47 8.47m7.06 7.06A4 4 0 0 1 6.94 6.94" /><line x1="4.21" y1="4.21" x2="19.79" y2="19.79" stroke="currentColor" strokeWidth={2} /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-gray-700 hover:border-pink-500/80 rounded-xl focus:ring-2 focus:ring-pink-500/60 focus:border-pink-500/80 text-white outline-none transition-all shadow-sm placeholder:text-gray-400"
                placeholder="••••••••"
                required={isSignUp}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-tr from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg tracking-wide
            disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">{isSignUp ? 'Inscription...' : 'Connexion...'}</span>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-2 my-7">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          <span className="text-gray-500 text-xs font-medium uppercase">ou</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-600 to-transparent" />
        </div>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setPassword('');
            setConfirmPassword('');
          }}
          className="w-full text-gray-300 bg-gray-700/60 hover:bg-gray-700/90 rounded-xl py-2 text-base font-bold transition-all flex items-center justify-center gap-2
            border-2 border-gray-700 hover:border-pink-400 shadow-sm hover:text-pink-400"
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
        </button>

        <button
          onClick={onBack}
          className="w-full group text-gray-300 bg-gray-700/60 hover:bg-gray-700/90 rounded-xl py-2 text-base font-bold transition-all flex items-center justify-center gap-2
            border-2 border-gray-700 hover:border-pink-400 shadow-sm hover:text-pink-400"
        >
          <svg className="w-5 h-5 mr-1 stroke-current group-hover:stroke-pink-400" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;

