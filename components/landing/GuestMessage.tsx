import React from 'react';
import { QrCode, Smartphone, Zap, Camera, Sparkles } from 'lucide-react';

/**
 * Section message pour les invités
 */
export const GuestMessage: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/5 border border-pink-500/20 rounded-2xl p-8 sm:p-10 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <QrCode className="w-12 h-12 sm:w-14 sm:h-14 text-pink-400" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Vous êtes un invité ?
              </h3>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">
                <strong className="text-white">Rejoignez le mur interactif en 2 secondes !</strong> Scannez le QR code de votre événement ou demandez le lien à votre organisateur. 
                Partagez vos meilleurs moments et voyez-les apparaître instantanément sur grand écran, sublimés par l'IA.
              </p>
              
              {/* Avantages pour les invités */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-pink-400" />
                  </div>
                  <span>Scannez le QR code</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-purple-400" />
                  </div>
                  <span>Partagez vos photos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span>Affichage instantané</span>
                </div>
              </div>

              {/* Badge simplicité */}
              <div className="flex items-center gap-2 text-pink-300 bg-pink-500/10 rounded-lg px-4 py-2 inline-flex">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-medium">Aucune application à télécharger - 100% web, compatible avec tous les téléphones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

