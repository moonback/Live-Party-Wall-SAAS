import React from 'react';
import { ADVANTAGES } from './landingData';
import { AdvantageCard } from './AdvantageCard';

/**
 * Section des avantages
 */
export const Advantages: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Image de fond décorative */}
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1920"
          alt="Événement festif"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Pourquoi Partywall ?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mt-4">
            Tous les avantages qui font de Partywall la solution idéale pour vos événements. <br/>
            <strong className="text-pink-400">Simple, rapide, sécurisé.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ADVANTAGES.map((advantage, index) => (
            <AdvantageCard
              key={index}
              icon={advantage.icon}
              title={advantage.title}
              description={advantage.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

