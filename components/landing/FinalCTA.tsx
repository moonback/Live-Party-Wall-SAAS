import React from 'react';
import { Users, ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onAdminClick: () => void;
}

/**
 * Section CTA final
 */
export const FinalCTA: React.FC<FinalCTAProps> = ({ onAdminClick }) => {
  return (
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
  );
};

