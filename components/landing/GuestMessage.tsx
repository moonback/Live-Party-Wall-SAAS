import React from 'react';
import { QrCode, Smartphone } from 'lucide-react';

/**
 * Section message pour les invités
 */
export const GuestMessage: React.FC = () => {
  return (
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
  );
};

