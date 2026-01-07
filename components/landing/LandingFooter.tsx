import React from 'react';
import { Twitter, Instagram, Linkedin, Github, Heart } from 'lucide-react';

/**
 * Footer de la landing page - Design pro
 */
export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl relative overflow-hidden">
      {/* Glow effect bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-white">Live Party Wall</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              La solution interactive qui transforme vos événements en expériences virales. 
              Capturez, sublimez, diffusez.
            </p>
            <div className="flex gap-4 mt-6">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-pink-400 transition-colors">Fonctionnalités</a></li>
              <li><a href="#how-it-works" className="hover:text-pink-400 transition-colors">Comment ça marche</a></li>
              <li><a href="#pricing" className="hover:text-pink-400 transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Démo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-pink-400 transition-colors">Mentions légales</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">CGV</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Live Party Wall. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Fait avec</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>pour vos soirées</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
