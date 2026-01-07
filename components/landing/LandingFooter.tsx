import React from 'react';

/**
 * Footer de la landing page
 */
export const LandingFooter: React.FC = () => {
  return (
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
  );
};
