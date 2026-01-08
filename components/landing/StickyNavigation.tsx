import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavLink {
  id: string;
  label: string;
}

interface StickyNavigationProps {
  links: NavLink[];
  onScrollToSection: (sectionId: string) => void;
}

/**
 * Navigation sticky avec indicateur de section active
 */
export const StickyNavigation: React.FC<StickyNavigationProps> = ({
  links,
  onScrollToSection,
}) => {
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observer toutes les sections
    links.forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [links]);

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const isActive = activeSection === link.id;
        return (
          <button
            key={link.id}
            onClick={() => onScrollToSection(link.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative group ${
              isActive
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
            <motion.span
              className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isActive ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            {!isActive && (
              <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-pink-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

