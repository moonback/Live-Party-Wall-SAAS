import React from 'react';
import EventSelector from '../EventSelector';

interface EventSelectorSectionProps {
  onEventSelected?: () => void;
  onBack: () => void;
}

/**
 * Section sélecteur d'événements pour les admins connectés
 */
export const EventSelectorSection: React.FC<EventSelectorSectionProps> = ({
  onEventSelected,
  onBack,
}) => {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Mes événements</h3>
          <EventSelector
            onEventSelected={onEventSelected}
            onBack={onBack}
          />
        </div>
      </div>
    </section>
  );
};

