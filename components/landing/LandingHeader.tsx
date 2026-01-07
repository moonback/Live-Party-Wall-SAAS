import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, Users, Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onAdminClick: () => void;
  onScrollToSection: (sectionId: string) => void;
}

/**
 * Header de la landing page avec navigation et menu mobile
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
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    onScrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
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
              onClick={() => handleScrollToSection('features')}
              className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => handleScrollToSection('how-it-works')}
              className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
            >
              Comment ça marche
            </button>
            <button
              onClick={() => handleScrollToSection('use-cases')}
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
            <button
              onClick={onAdminClick}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-lg text-white flex items-center gap-2 hover:scale-105"
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
                onClick={() => handleScrollToSection('features')}
                className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => handleScrollToSection('how-it-works')}
                className="text-left text-gray-300 hover:text-pink-400 transition-colors font-medium py-2"
              >
                Comment ça marche
              </button>
              <button
                onClick={() => handleScrollToSection('use-cases')}
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
  );
};
