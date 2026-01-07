import React from 'react';
import { useAuth } from '../context/AuthContext';
import Hero from './landing/Hero';
import { LandingBackground } from './landing/LandingBackground';
import { LandingHeader } from './landing/LandingHeader';
import { HowItWorks } from './landing/HowItWorks';
import { Features } from './landing/Features';
import { Advantages } from './landing/Advantages';
import { UseCases } from './landing/UseCases';
import { GuestMessage } from './landing/GuestMessage';
import { EventSelectorSection } from './landing/EventSelectorSection';
import { FinalCTA } from './landing/FinalCTA';
import { LandingFooter } from './landing/LandingFooter';

interface AccueilProps {
  onAdminClick: () => void;
  onEventSelected?: () => void;
}

/**
 * Landing page complète pour Live Party Wall SaaS
 * Page d'accueil détaillée avec présentation complète du produit
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick, onEventSelected }) => {
  const { isAuthenticated } = useAuth();

  // Fonction pour scroller vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden">
      <LandingBackground />
      <LandingHeader 
        isAuthenticated={isAuthenticated}
        onAdminClick={onAdminClick}
        onScrollToSection={scrollToSection}
      />

      <div className="relative z-10 pt-16 sm:pt-20">
        <Hero onAdminClick={onAdminClick} />
        <HowItWorks />
        <Features />
        <Advantages />
        <UseCases />
        <GuestMessage />
        {isAuthenticated && (
          <EventSelectorSection 
            onEventSelected={onEventSelected}
            onBack={onAdminClick}
          />
        )}
        <FinalCTA onAdminClick={onAdminClick} />
        <LandingFooter />
      </div>
    </div>
  );
};

export default Accueil;

