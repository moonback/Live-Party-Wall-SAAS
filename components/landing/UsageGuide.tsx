import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, User, ChevronRight, CheckCircle, QrCode, Camera, Monitor, Sparkles, Share2, Settings, Download, Heart } from 'lucide-react';

interface UsageGuideProps {
  onAdminClick?: () => void;
}

/**
 * Section "Notice d'utilisation" intégrée
 * Version courte (3 étapes), détaillée (organisateurs) et invité
 */
export const UsageGuide: React.FC<UsageGuideProps> = ({ onAdminClick }) => {
  const [activeTab, setActiveTab] = useState<'short' | 'organizer' | 'guest'>('short');

  const shortSteps = [
    {
      icon: QrCode,
      title: 'Créez votre événement',
      description: 'En moins de 2 minutes, votre mur photo est prêt.'
    },
    {
      icon: Share2,
      title: 'Partagez le QR code',
      description: 'Vos invités scannent et partagent leurs photos instantanément.'
    },
    {
      icon: Monitor,
      title: 'Laissez la magie opérer',
      description: 'Les photos s\'affichent en direct sur le mur, l\'ambiance monte en puissance.'
    }
  ];

  const organizerSteps = [
    {
      icon: QrCode,
      title: 'Créez votre événement',
      description: 'Connectez-vous, créez un nouvel événement en quelques clics. Choisissez un nom, une date, et personnalisez les paramètres si besoin.'
    },
    {
      icon: Share2,
      title: 'Téléchargez ou affichez le QR code',
      description: 'Le QR code est généré automatiquement. Téléchargez-le pour l\'imprimer ou affichez-le sur un écran. Vos invités le scannent avec leur smartphone.'
    },
    {
      icon: Settings,
      title: 'Configurez les paramètres',
      description: 'Activez la modération automatique, choisissez les cadres décoratifs, configurez les notifications. Tout est personnalisable.'
    },
    {
      icon: Monitor,
      title: 'Affichez le mur sur grand écran',
      description: 'Ouvrez le mode projection sur votre TV ou écran. Les photos apparaîtront automatiquement en temps réel.'
    },
    {
      icon: Download,
      title: 'Récupérez les photos après l\'événement',
      description: 'Toutes les photos sont sauvegardées automatiquement. Téléchargez-les en haute définition dans votre galerie après l\'événement.'
    },
    {
      icon: Heart,
      title: 'Activez les réactions et la recherche IA',
      description: 'Permettez à vos invités de réagir avec 6 types d\'émojis et de retrouver leurs photos grâce à la reconnaissance faciale "Retrouve-moi".'
    }
  ];

  const guestSteps = [
    {
      icon: QrCode,
      title: 'Scannez le QR code',
      description: 'Ouvrez l\'appareil photo de votre smartphone et scannez le QR code affiché.'
    },
    {
      icon: User,
      title: 'Choisissez votre nom',
      description: 'Entrez votre prénom ou pseudo. C\'est tout, pas besoin de créer un compte !'
    },
    {
      icon: Camera,
      title: 'Partagez vos photos',
      description: 'Prenez une photo ou choisissez-en une depuis votre galerie. Elle apparaîtra instantanément sur le mur !'
    }
  ];

  return (
    <section id="usage-guide" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-black/60 to-black/40">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* En-tête */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Notice d'utilisation</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Tout ce que vous devez savoir
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Guide rapide pour organisateurs et invités. Tout est expliqué simplement.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('short')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'short'
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            Version courte
          </button>
          <button
            onClick={() => setActiveTab('organizer')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'organizer'
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Organisateurs
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'guest'
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            Invités
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`grid grid-cols-1 gap-6 ${
            activeTab === 'organizer' 
              ? 'md:grid-cols-2 lg:grid-cols-3' 
              : 'md:grid-cols-3'
          }`}
        >
          {(activeTab === 'short' ? shortSteps : activeTab === 'organizer' ? organizerSteps : guestSteps).map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative backdrop-blur-xl bg-white/5 border border-white/10 hover:border-pink-500/30 rounded-2xl p-6 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors shrink-0">
                    <Icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-pink-400">Étape {index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        {activeTab === 'organizer' && onAdminClick && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <button
              onClick={onAdminClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
            >
              Créer mon événement maintenant
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

