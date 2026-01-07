import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, X, Truck, Clock, Users, DollarSign, 
  AlertCircle, Zap, Smartphone, TrendingDown, 
  Package, Wifi, Shield, Sparkles
} from 'lucide-react';

/**
 * Section de comparaison entre location de photobooth traditionnel et Live Party Wall
 */
export const PhotoboothComparison: React.FC = () => {
  const photoboothTraditional = {
    cost: {
      min: 400,
      max: 900,
      average: 650,
      description: 'par événement (location + livraison + installation)'
    },
    advantages: [
      {
        icon: Package,
        title: 'Matériel physique',
        description: 'Cabine physique avec imprimante intégrée pour photos instantanées'
      },
      {
        icon: Users,
        title: 'Expérience tactile',
        description: 'Les invités peuvent tenir les photos imprimées dans leurs mains'
      },
      {
        icon: Shield,
        title: 'Pas de connexion internet requise',
        description: 'Fonctionne de manière autonome sans dépendance réseau'
      }
    ],
    disadvantages: [
      {
        icon: DollarSign,
        title: 'Coût élevé',
        description: 'Entre 400€ et 900€ par événement, souvent avec frais supplémentaires (kilométrage, heures supplémentaires)'
      },
      {
        icon: Truck,
        title: 'Logistique complexe',
        description: 'Livraison, installation, désinstallation, transport du matériel lourd et encombrant'
      },
      {
        icon: Clock,
        title: 'Temps de setup',
        description: 'Installation et configuration nécessitent 1 à 2 heures avant l\'événement'
      },
      {
        icon: Users,
        title: 'Capacité limitée',
        description: 'Seulement quelques invités peuvent l\'utiliser simultanément, files d\'attente fréquentes'
      },
      {
        icon: AlertCircle,
        title: 'Risques techniques',
        description: 'Pannes matérielles, problèmes d\'impression, nécessité d\'un technicien sur place'
      },
      {
        icon: DollarSign,
        title: 'Coûts cachés',
        description: 'Papier photo, encres, maintenance, frais de déplacement, heures supplémentaires'
      },
      {
        icon: Package,
        title: 'Espace requis',
        description: 'Nécessite un espace dédié important (minimum 3-4 m²) dans la salle'
      },
      {
        icon: Clock,
        title: 'Pas de participation à distance',
        description: 'Les invités absents ne peuvent pas participer à l\'expérience'
      }
    ]
  };

  const livePartyWall = {
    cost: {
      min: 49,
      max: 199,
      popular: 99,
      description: 'par événement (tout inclus, sans frais cachés)'
    },
    advantages: [
      {
        icon: TrendingDown,
        title: '4 à 9 fois moins cher',
        description: 'De 49€ à 199€ selon l\'offre, contre 400-900€ pour un photobooth traditionnel'
      },
      {
        icon: Zap,
        title: 'Installation en 5 minutes',
        description: 'Branchez votre TV/PC, c\'est prêt. Aucune logistique de transport ou d\'installation'
      },
      {
        icon: Smartphone,
        title: 'Participation illimitée',
        description: 'Tous les invités participent simultanément depuis leur smartphone, pas de file d\'attente'
      },
      {
        icon: Sparkles,
        title: 'Expérience enrichie',
        description: 'Mur de photos en temps réel, aftermovie automatique, galerie HD, modération IA'
      },
      {
        icon: Wifi,
        title: 'Participation à distance',
        description: 'Les invités absents peuvent participer via un lien dédié'
      },
      {
        icon: DollarSign,
        title: 'Pas de frais cachés',
        description: 'Prix fixe, tout inclus : pas de frais de transport, de maintenance ou de consommables'
      },
      {
        icon: Package,
        title: 'Zéro encombrement',
        description: 'Aucun matériel physique à transporter ou installer, juste votre équipement existant'
      },
      {
        icon: Shield,
        title: 'Fiabilité maximale',
        description: 'Pas de risque de panne matérielle, solution cloud avec support technique inclus'
      }
    ]
  };

  return (
    <section id="photobooth-comparison" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full mb-6"
          >
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Comparaison Transparente</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Photobooth en Location vs Live Party Wall
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Une comparaison honnête pour vous aider à faire le meilleur choix pour votre événement
          </motion.p>
        </div>

        {/* Cost Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {/* Photobooth Traditionnel - Coût */}
          <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-red-400" />
              <h3 className="text-2xl font-bold text-white">Photobooth Traditionnel</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold text-red-400">
                  {photoboothTraditional.cost.min}€ - {photoboothTraditional.cost.max}€
                </span>
              </div>
              <p className="text-sm text-gray-400 italic">{photoboothTraditional.cost.description}</p>
              <p className="text-sm text-gray-300 mt-2">
                <strong className="text-red-400">Moyenne : {photoboothTraditional.cost.average}€</strong> + frais supplémentaires possibles
              </p>
            </div>
          </div>

          {/* Live Party Wall - Coût */}
          <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-pink-500/50 shadow-lg shadow-pink-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <h3 className="text-2xl font-bold text-white">Live Party Wall</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {livePartyWall.cost.min}€ - {livePartyWall.cost.max}€
                </span>
              </div>
              <p className="text-sm text-gray-400 italic">{livePartyWall.cost.description}</p>
              <p className="text-sm text-gray-300 mt-2">
                <strong className="text-pink-400">Offre populaire : {livePartyWall.cost.popular}€</strong> - Tout inclus, sans surprise
              </p>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-300 font-semibold">
                💰 Économie de {Math.round((1 - livePartyWall.cost.popular / photoboothTraditional.cost.average) * 100)}% par rapport à la moyenne
              </p>
            </div>
          </div>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photobooth Traditionnel - Colonne */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Image du photobooth traditionnel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative h-48 rounded-2xl overflow-hidden border-2 border-red-500/30"
            >
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800"
                alt="Photobooth traditionnel"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-semibold text-sm">Photobooth traditionnel</p>
                <p className="text-gray-300 text-xs">Matériel lourd et encombrant</p>
              </div>
            </motion.div>

            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Package className="w-6 h-6 text-red-400" />
                Photobooth Traditionnel
              </h3>

              {/* Avantages */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Avantages
                </h4>
                <div className="space-y-4">
                  {photoboothTraditional.advantages.map((advantage, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <advantage.icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{advantage.title}</p>
                        <p className="text-xs text-gray-400">{advantage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inconvénients */}
              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Inconvénients
                </h4>
                <div className="space-y-3">
                  {photoboothTraditional.disadvantages.map((disadvantage, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <disadvantage.icon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{disadvantage.title}</p>
                        <p className="text-xs text-gray-400">{disadvantage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live Party Wall - Colonne */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Image de Live Party Wall */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative h-48 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-lg shadow-pink-500/20"
            >
              <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800"
                alt="Live Party Wall - Mur de photos interactif"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 via-purple-900/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-semibold text-sm">Live Party Wall</p>
                <p className="text-gray-200 text-xs">Solution moderne et interactive</p>
              </div>
            </motion.div>

            <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-pink-500/50 shadow-lg shadow-pink-500/20">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-pink-400" />
                Live Party Wall
              </h3>

              {/* Avantages */}
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Avantages
                </h4>
                <div className="space-y-3">
                  {livePartyWall.advantages.map((advantage, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <advantage.icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{advantage.title}</p>
                        <p className="text-xs text-gray-400">{advantage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-pink-500/50"
        >
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Le Verdict
            </h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed mb-6">
              Si vous cherchez une <strong className="text-pink-400">solution moderne, économique et engageante</strong> qui maximise la participation de tous vos invités, 
              Live Party Wall est le choix évident. Pour <strong className="text-pink-400">4 à 9 fois moins cher</strong>, vous obtenez une expérience supérieure 
              sans les contraintes logistiques et techniques d'un photobooth traditionnel.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-300">
                💰 Économie significative
              </div>
              <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300">
                ⚡ Installation instantanée
              </div>
              <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300">
                👥 Participation illimitée
              </div>
              <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                🎯 Zéro contrainte logistique
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

