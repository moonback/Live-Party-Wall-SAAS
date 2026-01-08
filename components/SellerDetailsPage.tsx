import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, CheckCircle2, Zap, TrendingUp, Users, 
  Image, Sparkles, Shield, Clock, DollarSign, 
  Target, BarChart3, Star, ArrowLeft
} from 'lucide-react';

interface SellerDetailsPageProps {
  onSignUp: () => void;
  onBack: () => void;
}

/**
 * Page de détails vendeur - Résumé des principaux points de vente
 * Affiche les offres, avantages, ROI et mène à l'inscription
 */
const SellerDetailsPage: React.FC<SellerDetailsPageProps> = ({ onSignUp, onBack }) => {
  const offers = [
    {
      name: 'Starter',
      price: '149€',
      period: 'par événement',
      target: 'Petits événements',
      features: [
        '1 événement (24h d\'accès)',
        '100 photos maximum',
        'Mur live + IA',
        'Galerie interactive',
        'Support email'
      ],
      gradient: 'from-pink-500 to-rose-500',
      popular: false,
    },
    {
      name: 'Premium',
      price: '249€',
      period: 'par événement',
      target: 'Best-seller',
      badge: '⭐ Le plus populaire',
      features: [
        'Photos illimitées',
        'Cadres décoratifs',
        'Effets visuels avancés',
        'Classement & badges',
        'Galerie privée 7 jours',
        'Export ZIP HD',
        'Support prioritaire'
      ],
      gradient: 'from-purple-500 to-pink-500',
      popular: true,
    },
    {
      name: 'Prestige',
      price: '399€',
      period: 'par événement',
      target: 'Expérience ultime',
      features: [
        'Tout Premium inclus',
        'Branding personnalisé',
        'Diaporama cinématique',
        'Accès 14 jours',
        'Statistiques détaillées',
        'Support téléphonique'
      ],
      gradient: 'from-indigo-500 to-purple-500',
      popular: false,
    },
  ];

  const volumePacks = [
    {
      name: 'Pack 10 événements',
      price: '2 900€',
      pricePerEvent: '290€/événement',
      savings: 'Économie de 1 900€',
      roi: 'ROI : 4 000-6 000€ CA potentiel',
      margin: 'Marge : 200-300€/événement',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Pack 50 événements',
      price: '9 900€',
      pricePerEvent: '198€/événement',
      savings: 'Économie de 14 900€',
      roi: 'ROI : 20 000-30 000€ CA potentiel',
      margin: 'Marge : 200-400€/événement',
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const advantages = [
    {
      icon: Clock,
      title: 'Installation en 5 minutes',
      description: 'vs 2h pour un photobooth classique',
    },
    {
      icon: Zap,
      title: 'Zéro matériel à transporter',
      description: 'Fonctionne sur n\'importe quel écran',
    },
    {
      icon: Shield,
      title: 'IA intégrée',
      description: 'Modération automatique, pas besoin de modérateur',
    },
    {
      icon: TrendingUp,
      title: 'Engagement 10x supérieur',
      description: '100% des invités participent activement',
    },
  ];

  const includedFeatures = [
    'Accès Live Party Wall (1 événement)',
    'QR Code unique personnalisé',
    'Mur photo temps réel (TV/vidéoprojecteur)',
    'IA Google Gemini (modération + amélioration + légendes)',
    'Galerie interactive avec likes',
    'Mode diaporama automatique',
    'Support setup 15 min à distance',
    'Export photos haute qualité',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 text-center">
            Offre <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Commerciale</span>
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
            Une animation participative en temps réel qui transforme chaque invité en photographe
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Included Features */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
              ✅ Inclus dans tous les packs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {includedFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-white/90 text-sm">{feature}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Advantages */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
              🔥 Avantages compétitifs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {advantages.map((advantage, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <advantage.icon className="w-8 h-8 text-pink-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">{advantage.title}</h3>
                  <p className="text-gray-400 text-sm">{advantage.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Pricing - Individual Events */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
              💰 Tarification par événement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-gradient-to-br ${offer.gradient} rounded-2xl p-6 ${
                    offer.popular ? 'ring-4 ring-pink-400/50 scale-105' : ''
                  }`}
                >
                  {offer.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                      {offer.badge}
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{offer.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">{offer.price}</span>
                      <span className="text-white/70 text-sm">{offer.period}</span>
                    </div>
                    <p className="text-white/80 text-sm mt-2">{offer.target}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {offer.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                        <span className="text-white/90 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Volume Packs */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
              📦 Packs Volume pour Prestataires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {volumePacks.map((pack, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-gradient-to-br ${pack.gradient} rounded-2xl p-8`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">{pack.price}</span>
                    </div>
                    <p className="text-white/80 text-sm">{pack.pricePerEvent}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold text-sm">{pack.savings}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold text-sm">{pack.margin}</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-white font-bold">{pack.roi}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ROI Section */}
          <motion.section variants={itemVariants} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <BarChart3 className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                💰 Valeur pour le Prestataire — ROI
              </h2>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                Vous revendez une animation digitale à <strong className="text-white">forte valeur perçue</strong> (vos clients pensent que ça coûte 1 000€+), 
                avec une <strong className="text-white">marge immédiate de 200-400€ par événement</strong>.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <DollarSign className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">Investissement</h3>
                <p className="text-gray-300">Pack 10 : 2 900€</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">Revente</h3>
                <p className="text-gray-300">400€ x 10 = 4 000€</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 border border-pink-500/30">
                <Target className="w-8 h-8 text-pink-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">Bénéfice net</h3>
                <p className="text-gray-300">1 100€ (38% de marge)</p>
              </div>
            </div>
            <p className="text-center text-pink-400 font-semibold mt-6">
              ROI en 3-4 événements
            </p>
          </motion.section>

          {/* CTA Section */}
          <motion.section variants={itemVariants} className="text-center">
            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-8 sm:p-12">
              <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Rejoignez les prestataires qui se différencient avec une innovation que personne d'autre n'offre.
                Installation en 5 minutes, zéro matériel, engagement garanti.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={onSignUp}
                  className="group relative px-8 py-4 bg-white text-black font-bold rounded-full text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)] transition-all transform hover:-translate-y-1 overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Créer mon compte gratuitement
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={onBack}
                  className="px-8 py-4 bg-white/5 border border-white/20 hover:bg-white/10 text-white font-semibold rounded-full text-lg backdrop-blur-sm transition-all w-full sm:w-auto"
                >
                  Retour à l'accueil
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                Pas de carte bancaire requise • Essai gratuit • Support réactif
              </p>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerDetailsPage;

