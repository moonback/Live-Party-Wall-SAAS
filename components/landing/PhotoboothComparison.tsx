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
        title: '400-900€ par événement',
        description: '+ frais cachés (transport, heures sup, consommables)'
      },
      {
        icon: Truck,
        title: 'Logistique lourde',
        description: 'Livraison, installation 1-2h, désinstallation, transport'
      },
      {
        icon: Users,
        title: 'Capacité limitée',
        description: 'Files d\'attente, seulement quelques invités à la fois'
      },
      {
        icon: AlertCircle,
        title: 'Risques techniques',
        description: 'Pannes, besoin d\'un technicien, espace 3-4m² requis'
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
        title: '6,5x moins cher',
        description: '99€ vs 650€ en moyenne. Tout inclus, zéro surprise.'
      },
      {
        icon: Zap,
        title: 'Prêt en 5 minutes',
        description: 'Branchez, c\'est parti. Pas de livraison, pas d\'installation.'
      },
      {
        icon: Smartphone,
        title: 'Tous vos invités participent',
        description: 'Simultanément, sans file d\'attente. Même à distance.'
      },
      {
        icon: Sparkles,
        title: 'Expérience premium',
        description: 'Mur temps réel + aftermovie + galerie HD + modération IA'
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
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Pourquoi payer <span className="text-red-400">650€</span> quand vous pouvez avoir mieux pour <span className="text-pink-400">99€</span> ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto"
          >
            La comparaison qui change tout. <strong className="text-pink-400">6,5x moins cher</strong>, <strong className="text-pink-400">10x plus simple</strong>, <strong className="text-pink-400">100% plus engageant</strong>.
          </motion.p>
        </div>

        {/* Cost Comparison - Plus impactante */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {/* Photobooth Traditionnel - Coût */}
          <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-red-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-bold text-white">Photobooth Traditionnel</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl sm:text-6xl font-bold text-red-400">
                    {photoboothTraditional.cost.average}€
                  </span>
                </div>
                <p className="text-xs text-gray-400">Moyenne (400-900€) + frais cachés</p>
              </div>
              <div className="space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <X className="w-3 h-3 text-red-400" />
                  <span>Livraison & installation</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-3 h-3 text-red-400" />
                  <span>Consommables (papier, encre)</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-3 h-3 text-red-400" />
                  <span>Heures supplémentaires</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Party Wall - Coût */}
          <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-pink-500/50 shadow-lg shadow-pink-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <h3 className="text-xl font-bold text-white">Live Party Wall</h3>
                </div>
                <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs font-bold text-green-300">
                  BEST VALUE
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {livePartyWall.cost.popular}€
                  </span>
                </div>
                <p className="text-xs text-gray-300">Tout inclus, zéro surprise</p>
              </div>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Installation en 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Tous les invités participent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Aftermovie + galerie HD inclus</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300 font-bold text-center">
                  💰 Économisez {photoboothTraditional.cost.average - livePartyWall.cost.popular}€ par événement
                </p>
              </div>
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
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Package className="w-5 h-5 text-red-400" />
                Photobooth Traditionnel
              </h3>

              {/* Inconvénients - Plus visibles */}
              <div>
                <h4 className="text-base font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Les points bloquants
                </h4>
                <div className="space-y-2.5">
                  {photoboothTraditional.disadvantages.map((disadvantage, index) => (
                    <div key={index} className="flex items-start gap-2.5 p-2.5 bg-red-500/10 rounded-lg border border-red-500/20">
                      <disadvantage.icon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{disadvantage.title}</p>
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Live Party Wall
                </h3>
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-xs font-bold text-green-300">RECOMMANDÉ</span>
                </div>
              </div>

              {/* Avantages - Plus impactants */}
              <div>
                <h4 className="text-base font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Pourquoi choisir Live Party Wall
                </h4>
                <div className="space-y-2.5">
                  {livePartyWall.advantages.map((advantage, index) => (
                    <div key={index} className="flex items-start gap-2.5 p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                      <advantage.icon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{advantage.title}</p>
                        <p className="text-xs text-gray-300">{advantage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Conclusion - Plus percutante */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-pink-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-pink-500/50"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Le choix est évident
              </h3>
              <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                551€ économisés
              </div>
              <p className="text-lg text-gray-300">
                Pour une expérience <strong className="text-pink-400">supérieure</strong> en tous points
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              <div className="px-4 py-3 bg-pink-500/20 border border-pink-500/30 rounded-xl">
                <div className="text-2xl font-bold text-pink-300 mb-1">6,5x</div>
                <div className="text-xs text-gray-300">Moins cher</div>
              </div>
              <div className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                <div className="text-2xl font-bold text-purple-300 mb-1">5min</div>
                <div className="text-xs text-gray-300">Installation</div>
              </div>
              <div className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                <div className="text-2xl font-bold text-green-300 mb-1">100%</div>
                <div className="text-xs text-gray-300">Participation</div>
              </div>
              <div className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <div className="text-2xl font-bold text-blue-300 mb-1">0€</div>
                <div className="text-xs text-gray-300">Frais cachés</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

