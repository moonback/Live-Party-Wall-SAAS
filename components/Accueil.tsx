import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Hero from './landing/Hero';
import { LandingBackground } from './landing/LandingBackground';
import { LandingHeader } from './landing/LandingHeader';
import { HowItWorks } from './landing/HowItWorks';
import { Features } from './landing/Features';
import { Advantages } from './landing/Advantages';
import { UseCases } from './landing/UseCases';
import { GuestMessage } from './landing/GuestMessage';
import { Pricing } from './landing/Pricing';
import { PhotoboothComparison } from './landing/PhotoboothComparison';
import { FinalCTA } from './landing/FinalCTA';
import { LandingFooter } from './landing/LandingFooter';
import { Testimonials } from './landing/Testimonials';
import { TrustBadges } from './landing/TrustBadges';
import { ScrollToTop } from './landing/ScrollToTop';
import { SkipLinks } from './landing/SkipLinks';
import { UsageGuide } from './landing/UsageGuide';

interface AccueilProps {
  onAdminClick: () => void;
}

/**
 * Landing page complète pour Live Party Wall SaaS
 * Page d'accueil détaillée avec présentation complète du produit
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick }) => {
  const { isAuthenticated } = useAuth();

  // Fonction pour scroller vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toujours démarrer en haut de page (évite de "revenir" sur une ancienne section au refresh)
  useEffect(() => {
    // Nettoyer le hash si présent (ex: #how-it-works) pour éviter un auto-scroll au rechargement
    if (window.location.hash) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden">
      <SkipLinks />
      <LandingBackground />
      <LandingHeader 
        isAuthenticated={isAuthenticated}
        onAdminClick={onAdminClick}
        onScrollToSection={scrollToSection}
      />

      <main id="main-content" className="relative z-10 pt-16 sm:pt-20">
        <Hero onAdminClick={onAdminClick} />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Advantages />
        <UseCases />
        <UsageGuide onAdminClick={onAdminClick} />
        <GuestMessage />
        <Pricing onAdminClick={onAdminClick} />
        <PhotoboothComparison />
        <FinalCTA onAdminClick={onAdminClick} />
        <TrustBadges />
        <LandingFooter />
      </main>

      <ScrollToTop />
    </div>
  );
};

export default Accueil;

