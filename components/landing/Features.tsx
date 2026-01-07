import React from 'react';
import { FEATURES } from './landingData';
import { FeatureCard } from './FeatureCard';

/**
 * Section des fonctionnalités principales
 */
export const Features: React.FC = () => {
  return (
    <section id="features" className="py-10 sm:py-12 md:py-16 lg:py-12 xl:py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3">
            Tout pour une soirée réussie
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-sm xl:text-base text-gray-300 max-w-2xl mx-auto">
            Fonctionnalités qui transforment vos événements en expériences virales
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-3 xl:gap-4">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

