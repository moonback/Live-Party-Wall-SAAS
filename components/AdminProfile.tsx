import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminProfileProps {
  onLogout: () => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Fermer le menu avec Échap
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  if (!user) {
    return null;
  }

  // Extraire l'initiale de l'email
  const getInitial = (email: string): string => {
    return email.charAt(0).toUpperCase();
  };

  // Extraire le nom d'utilisateur de l'email (partie avant @)
  const getUsername = (email: string): string => {
    return email.split('@')[0];
  };

  const initial = getInitial(user.email || 'A');
  const username = getUsername(user.email || 'admin@example.com');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 min-h-[36px] touch-manipulation bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20 group"
        aria-label="Profil administrateur"
        aria-expanded={isMenuOpen}
      >
        {/* Avatar avec initiale */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/20 flex-shrink-0">
          {initial}
        </div>
        
        {/* Nom d'utilisateur - masqué sur mobile */}
        <span className="hidden sm:block text-sm font-medium text-white truncate max-w-[120px]">
          {username}
        </span>
        
        {/* Icône chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu déroulant */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-fade-in animate-slide-in-bottom">
          {/* En-tête du menu */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {username}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du profil */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span>Administrateur</span>
            </div>
            {user.created_at && (
              <div className="text-xs text-gray-500">
                Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Action de déconnexion */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onLogout();
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;

