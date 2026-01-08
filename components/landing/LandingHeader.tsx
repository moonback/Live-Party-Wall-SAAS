import React, { useState, useEffect } from 'react';
import { ArrowRight, Users, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNavigation } from './StickyNavigation';

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onAdminClick: () => void;
  onScrollToSection: (sectionId: string) => void;
}

/**
 * Header de la landing page avec navigation et menu mobile amélioré
 */
export const LandingHeader: React.FC<LandingHeaderProps> = ({
  isAuthenticated,
  onAdminClick,
  onScrollToSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleScrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    
    // Petit délai pour laisser le menu se fermer proprement
    setTimeout(() => {
      onScrollToSection(sectionId);
    }, 300);
  };

  const handleNavigateToHome = () => {
    window.location.href = window.location.pathname;
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'features', label: 'Fonctionnalités' },
    { id: 'how-it-works', label: 'Comment ça marche' },
    { id: 'use-cases', label: "Cas d'usage" },
    { id: 'pricing', label: 'Tarification' },
    { id: 'photobooth-comparison', label: 'Comparaison' },
    
  ];

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <button
              onClick={handleNavigateToHome}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <img
                  src="/icon.png"
                  alt="Live Party Wall"
                  className="relative w-8 h-8 sm:w-9 sm:h-9 z-10"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Party</span> Wall
              </span>
            </button>

            {/* Navigation Desktop avec indicateur de section active */}
            <StickyNavigation 
              links={navLinks} 
              onScrollToSection={handleScrollToSection} 
            />

            {/* CTA Button Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={onAdminClick}
                className="group relative px-5 py-2.5 bg-white text-black font-semibold rounded-full text-sm flex items-center gap-2 overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  {isAuthenticated ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Dashboard</span>
                    </>
                  ) : (
                    <>
                      <span>Commencer</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Menu Mobile Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors relative z-50"
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Menu Mobile Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl md:hidden pt-24 px-6 flex flex-col"
          >
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/20 rounded-full blur-[80px] pointer-events-none" />

            <nav className="flex flex-col gap-2 relative z-10">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  onClick={() => handleScrollToSection(link.id)}
                  className="text-left text-2xl font-bold text-gray-300 hover:text-white hover:pl-2 transition-all py-4 border-b border-white/5 flex items-center justify-between group"
                >
                  {link.label}
                  {link.id === 'pricing' ? (
                    <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-yellow-500" />
                  ) : (
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-pink-500" />
                  )}
                </motion.button>
              ))}
            </nav>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-auto mb-10"
            >
              <button
                onClick={() => {
                  onAdminClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-bold rounded-xl text-white text-lg flex items-center justify-center gap-3 shadow-lg shadow-purple-900/20"
              >
                {isAuthenticated ? (
                  <>
                    <Users className="w-5 h-5" />
                    <span>Accéder au Dashboard</span>
                  </>
                ) : (
                  <>
                    <span>Commencer gratuitement</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <p className="text-center text-gray-500 text-sm mt-6">
                © 2026 Live Party Wall. Tous droits réservés.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
