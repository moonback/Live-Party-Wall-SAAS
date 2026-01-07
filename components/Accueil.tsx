import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Camera, Zap, Shield, Users, Trophy, ArrowRight, QrCode, BookOpen,
  CheckCircle, Heart, Video, Search, Download, Settings, 
  Globe, Smartphone, Monitor, TrendingUp, Award, Clock, Lock, Palette, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventSelector from './EventSelector';

interface AccueilProps {
  onAdminClick: () => void;
  onEventSelected?: () => void;
}

/**
 * Landing page complète pour Live Party Wall SaaS
 * Page d'accueil détaillée avec présentation complète du produit
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick, onEventSelected }) => {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Détecter le scroll pour changer le style du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour scroller vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/80 backdrop-blur-xl border-b border-pink-500/20 shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="Live Party Wall"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Live Party Wall
              </span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
              >
                Comment ça marche
              </button>
              <button
                onClick={() => scrollToSection('use-cases')}
                className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
              >
                Cas d'usage
              </button>
              <a
                href="https://docs.livepartywall.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-400 transition-colors font-medium flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </a>
            </nav>

            {/* CTA Button Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={onAdminClick}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-lg text-white flex items-center gap-2 hover:scale-105"
                >
                  <Users className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={onAdminClick}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-lg text-white flex items-center gap-2 hover:scale-105"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Commencer</span>
                </button>
              )}
            </div>

            {/* Menu Mobile Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-pink-400 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-pink-500/20 mt-2 pt-4">
              <nav className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2"
                >
                  Comment ça marche
                </button>
                <button
                  onClick={() => scrollToSection('use-cases')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2"
                >
                  Cas d'usage
                </button>
                <a
                  href="https://docs.livepartywall.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Documentation
                </a>
                <button
                  onClick={onAdminClick}
                  className="mt-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-lg text-white flex items-center justify-center gap-2"
                >
                  {isAuthenticated ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Dashboard</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Commencer</span>
                    </>
                  )}
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 pt-16 sm:pt-20">
        {/* Hero Section */}
        <section className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <img
                  src="/icon.png"
                  alt="Live Party Wall Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto drop-shadow-2xl animate-fade-in"
                />
              </div>
            </div>
            
            <h1 className="relative font-handwriting text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] leading-tight mb-6">
              <span className="bg-gradient-to-b from-white via-pink-50 to-pink-200 bg-clip-text text-transparent filter drop-shadow-sm">
                Live Party Wall
              </span>
              <span className="text-pink-400 ml-1 inline-block animate-pulse">.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-pink-100 font-medium mb-4 max-w-4xl mx-auto">
              Le photowall d'événement <span className="text-pink-400 font-black">instantané</span> & interactif avec IA
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Transformez chaque invité en créateur de contenu. Partagez, affichez, modérez et sublimez 
              <span className="font-semibold text-white"> toutes vos photos d'événement</span> en direct avec une expérience photobooth nouvelle génération.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onAdminClick}
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-xl shadow-lg hover:shadow-xl text-white text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Users className="w-5 h-5" />
                <span>Commencer gratuitement</span>
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

            {/* Key Features Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:text-base">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
                <Zap className="w-4 h-4" />
                Temps réel
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
                <Shield className="w-4 h-4" />
                Modération IA
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
                <Globe className="w-4 h-4" />
                100% Web
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-sm bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-300">
                <CheckCircle className="w-4 h-4" />
                Zéro installation
              </span>
            </div>
          </div>
        </section>

        {/* Comment ça marche - 3 étapes */}
        <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Une expérience simple en 3 étapes pour transformer votre événement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Étape 1 */}
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group text-center">
                <div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all mx-auto">
                  <Camera className="w-8 h-8 text-pink-400" />
                </div>
                <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-500/20 rounded-full mb-4 text-pink-400 font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Partagez votre moment</h3>
                <p className="text-gray-300 leading-relaxed">
                  Les invités prennent une photo, choisissent une image dans leur galerie ou créent un collage original avec des modèles prédéfinis.
                </p>
              </div>

              {/* Étape 2 */}
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group text-center">
                <div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all mx-auto">
                  <Sparkles className="w-8 h-8 text-pink-400" />
                </div>
                <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-500/20 rounded-full mb-4 text-pink-400 font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">La magie de l'IA opère</h3>
                <p className="text-gray-300 leading-relaxed">
                  Google Gemini analyse, modère, améliore la qualité, applique un cadre décoratif et génère une légende personnalisée.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group text-center">
                <div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all mx-auto">
                  <Monitor className="w-8 h-8 text-pink-400" />
                </div>
                <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-500/20 rounded-full mb-4 text-pink-400 font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Affichage sur grand écran</h3>
                <p className="text-gray-300 leading-relaxed">
                  En quelques secondes, la photo sublimée apparaît sur le mur interactif où tous peuvent la voir et interagir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fonctionnalités principales */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Fonctionnalités puissantes
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour créer une expérience mémorable
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Camera className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Photobooth Interactif</h3>
                <p className="text-sm text-gray-300">Capturez et partagez vos moments en temps réel avec prise de photo, galerie et collage</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Zap className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Temps Réel</h3>
                <p className="text-sm text-gray-300">Affichage instantané sur grand écran via WebSockets, compatible TV et vidéoprojecteur</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Shield className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Modération IA</h3>
                <p className="text-sm text-gray-300">Filtrage automatique par Google Gemini pour garantir un contenu approprié</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Trophy className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gamification</h3>
                <p className="text-sm text-gray-300">Battles photos, badges, classements et système de likes pour maximiser l'engagement</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Palette className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cadres & Filtres</h3>
                <p className="text-sm text-gray-300">Cadres décoratifs (Polaroid, néon, or) et effets visuels pour sublimer chaque photo</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Video className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aftermovie Auto</h3>
                <p className="text-sm text-gray-300">Génération automatique de vidéos timelapse en fin d'événement avec effets visuels</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Search className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Recherche IA</h3>
                <p className="text-sm text-gray-300">Retrouvez vos photos avec l'IA grâce à la reconnaissance faciale et la recherche sémantique</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                  <Download className="w-7 h-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Export HD</h3>
                <p className="text-sm text-gray-300">Téléchargez toutes vos photos en haute qualité ou exportez en ZIP pour archivage</p>
              </div>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Pourquoi choisir Live Party Wall ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Zéro installation</h3>
                    <p className="text-gray-300 leading-relaxed">
                      100% web, aucune application à télécharger. Vos invités accèdent directement via QR code ou lien. 
                      Compatible avec tous les appareils (smartphone, tablette, ordinateur).
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuration en 15 minutes</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Support setup à distance avant votre événement. Aucun matériel spécifique requis, 
                      juste un écran (TV, vidéoprojecteur) et une connexion internet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <Lock className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Sécurité & Modération</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Modération automatique par IA pour garantir un contenu approprié. 
                      Contrôle total pour les organisateurs avec possibilité de modération manuelle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Engagement maximal</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Transformez les spectateurs passifs en créateurs actifs. Gamification, battles photos 
                      et interactions en temps réel pour maintenir l'énergie tout au long de l'événement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <Settings className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Multi-événements</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Architecture SaaS permettant de gérer plusieurs événements simultanément. 
                      Parfait pour les agences événementielles et organisateurs professionnels.
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <Award className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Qualité professionnelle</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Amélioration automatique des photos par IA, cadres élégants et légendes personnalisées. 
                      Résultat digne d'un photographe professionnel, sans le coût.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cas d'usage */}
        <section id="use-cases" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Parfait pour tous vos événements
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Des mariages aux événements d'entreprise, créez des souvenirs inoubliables
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <Heart className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Mariages</h3>
                <p className="text-gray-300 text-sm">
                  Mur de souvenirs partagés avec légendes personnalisées, cadres élégants et galerie privée post-événement pour les mariés.
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <Users className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Événements d'entreprise</h3>
                <p className="text-gray-300 text-sm">
                  Team building, séminaires, lancements produits. Animation interactive pour renforcer la cohésion d'équipe et l'engagement.
                </p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <Trophy className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Soirées & Fêtes</h3>
                <p className="text-gray-300 text-sm">
                  Anniversaires, fêtes de famille, soirées privées. Créez une animation collective qui transforme chaque invité en photographe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Message pour les invités */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8 sm:p-10">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <QrCode className="w-12 h-12 sm:w-14 sm:h-14 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Vous êtes un invité ?</h3>
                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-4">
                    Scannez le QR code de votre événement ou demandez le lien à votre organisateur pour rejoindre le mur interactif. 
                    Partagez vos photos en temps réel et participez à l'animation collective de l'événement.
                  </p>
                  <div className="flex items-center gap-2 text-pink-300">
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm">Aucune application à télécharger - 100% web</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sélecteur d'événements pour les admins connectés */}
        {isAuthenticated && (
          <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
            <div className="max-w-6xl mx-auto">
              <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Mes événements</h3>
                <EventSelector
                  onEventSelected={onEventSelected}
                  onBack={onAdminClick}
                />
              </div>
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à transformer votre événement ?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Rejoignez les organisateurs qui créent des expériences mémorables avec Live Party Wall
            </p>
            <button
              onClick={onAdminClick}
              className="group relative px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-xl shadow-lg hover:shadow-xl text-white text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 mx-auto"
            >
              <Users className="w-6 h-6" />
              <span>Commencer maintenant</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-pink-500/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img
                  src="/icon.png"
                  alt="Live Party Wall"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Live Party Wall
                </span>
              </div>
              <p className="text-sm text-pink-200/50 mb-4">
                Transformez vos événements en expériences mémorables
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <a href="https://docs.livepartywall.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                  Documentation
                </a>
                <span>•</span>
                <span>© 2024 Live Party Wall</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Accueil;

