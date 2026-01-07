import React from 'react';
import { Sparkles, Camera, Zap, Shield, Users, Trophy, ArrowRight, QrCode, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventSelector from './EventSelector';

interface NoEventScreenProps {
  onAdminClick: () => void;
  onEventSelected?: () => void;
}

/**
 * Composant affiché quand aucun événement n'est sélectionné
 * Page d'accueil complète avec présentation du produit
 */
const NoEventScreen: React.FC<NoEventScreenProps> = ({ onAdminClick, onEventSelected }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          {/* Header avec logo et titre */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <img
                  src="/icon.png"
                  alt="Live Party Wall Logo"
                  className="w-15 h-15 sm:w-20 sm:h-20 md:w-22 md:h-22 mx-auto drop-shadow-2xl animate-fade-in"
                />
                
              </div>
            </div>
            
            <h1 className="relative font-handwriting text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] leading-tight">
              <span className="bg-gradient-to-b from-white via-pink-50 to-pink-200 bg-clip-text text-transparent filter drop-shadow-sm">
                Live Party Wall
              </span>
              <span className="text-pink-400 ml-1 inline-block animate-pulse">.</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-pink-100 font-medium mb-2 max-w-3xl mx-auto">
              Le photowall d'événement <span className="text-pink-400 font-black">instantané</span> & interactif avec IA
            </p>
            
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Partagez, affichez, modérez et sublimez <span className="font-semibold text-white">toutes vos photos d'événement</span> en direct avec vos invités.
              <br />
              <span className="inline-block mt-2 text-pink-300 font-medium">
                Expérience photobooth nouvelle génération avec modération IA intégrée.
              </span>
            </p>
          </div>

          {/* Fonctionnalités principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Photobooth Interactif</h3>
              <p className="text-sm sm:text-base text-gray-300">Capturez et partagez vos moments en temps réel</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Temps Réel</h3>
              <p className="text-sm sm:text-base text-gray-300">Affichage instantané sur grand écran</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Modération IA</h3>
              <p className="text-sm sm:text-base text-gray-300">Filtrage automatique par Google Gemini</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Gamification</h3>
              <p className="text-sm sm:text-base text-gray-300">Battles, badges et classements</p>
            </div>
          </div>

          {/* Actions principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-12">
            <button
              onClick={onAdminClick}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-xl shadow-lg hover:shadow-xl text-white text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Users className="w-5 h-5" />
              <span>Espace organisateur</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a
              href="https://docs.livepartywall.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto px-8 py-4 bg-black/40 hover:bg-black/70 transition-all duration-300 font-medium rounded-xl border border-pink-800/40 hover:border-pink-500/60 text-pink-100 hover:text-white text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-5 h-5" />
              <span>Documentation</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Badges de fonctionnalités */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-8 sm:mb-12 text-sm sm:text-base">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
              <Sparkles className="w-4 h-4" />
              Photobooth interactif
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
              <Zap className="w-4 h-4" />
              Temps réel
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
              <Shield className="w-4 h-4" />
              Modération IA
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
              <Camera className="w-4 h-4" />
              Collage & Wall
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
              <Trophy className="w-4 h-4" />
              Battles photos
            </span>
          </div>

          {/* Message pour les invités */}
          <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 sm:p-8 mb-8 sm:mb-12 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Vous êtes un invité ?</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                  Scannez le QR code de votre événement ou demandez le lien à votre organisateur pour rejoindre le mur interactif et partager vos photos en temps réel.
                </p>
              </div>
            </div>
          </div>

          {/* Sélecteur d'événements pour les admins connectés */}
          {isAuthenticated && (
            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">Mes événements</h3>
              <EventSelector
                onEventSelected={onEventSelected}
                onBack={onAdminClick}
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 sm:mt-16 text-center">
            <p className="text-xs sm:text-sm text-pink-200/50">
              Live Party Wall - Transformez vos événements en expériences mémorables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoEventScreen;

