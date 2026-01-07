import React from 'react';
import { STEPS } from './landingData';
import { StepCard } from './StepCard';

/**
 * Section "Comment ça marche" avec les 3 étapes
 */
export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Une expérience simple en 3 étapes pour transformer votre événement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

