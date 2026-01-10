import React from 'react';
import { motion } from 'framer-motion';
import EventSelector from '../EventSelector';

interface EventSelectorSectionProps {
  onEventSelected?: () => void;
  onBack: () => void;
}

/**
 * Section sélecteur d'événements pour les admins connectés
 * Wrapper minimaliste qui laisse EventSelector gérer son propre design
 */
export const EventSelectorSection: React.FC<EventSelectorSectionProps> = ({
  onEventSelected,
  onBack,
}) => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen"
    >
      {/* EventSelector gère déjà son propre arrière-plan et design */}
      <EventSelector
        onEventSelected={onEventSelected}
        onBack={onBack}
      />
    </motion.section>
  );
};

