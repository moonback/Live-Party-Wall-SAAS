import React from 'react';
import { Shield, Lock, CheckCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface Badge {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  description?: string;
}

const badges: Badge[] = [
  {
    icon: Shield,
    text: 'Sécurisé SSL',
    description: 'Connexion cryptée',
  },
  {
    icon: Lock,
    text: 'Données protégées',
    description: 'RGPD conforme',
  },
  {
    icon: CheckCircle,
    text: 'Satisfait ou remboursé',
    description: 'Garantie 30 jours',
  },
  {
    icon: Award,
    text: 'Support réactif',
    description: '7j/7 disponible',
  },
];

/**
 * Section de badges de confiance
 */
export const TrustBadges: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-pink-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white mb-0.5">
                    {badge.text}
                  </p>
                  {badge.description && (
                    <p className="text-xs text-gray-400">{badge.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

