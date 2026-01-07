import React from 'react';
import { ADVANTAGES } from './landingData';
import { AdvantageCard } from './AdvantageCard';

/**
 * Section des avantages
 */
export const Advantages: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Pourquoi Live Party Wall ?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mt-4">
            Simple, rapide, viral. <strong className="text-pink-400">TV/PC + téléphones.</strong> Engagement garanti.
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

