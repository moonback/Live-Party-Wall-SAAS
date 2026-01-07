import React from 'react';
import { FEATURES } from './landingData';
import { FeatureCard } from './FeatureCard';

/**
 * Section des fonctionnalités principales
 */
export const Features: React.FC = () => {
  return (
    <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Fonctionnalités puissantes
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour créer une expérience mémorable
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

