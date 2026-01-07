import React from 'react';
import { USE_CASES } from './landingData';
import { UseCaseCard } from './UseCaseCard';

/**
 * Section des cas d'usage
 */
export const UseCases: React.FC = () => {
  return (
    <section id="use-cases" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Parfait pour tous vos événements
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Des mariages aux événements d'entreprise, créez des souvenirs inoubliables
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((useCase, index) => (
            <UseCaseCard
              key={index}
              icon={useCase.icon}
              title={useCase.title}
              description={useCase.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

