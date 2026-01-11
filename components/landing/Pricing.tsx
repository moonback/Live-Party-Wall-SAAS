import React from 'react';
import { Check, ArrowRight, Users, Zap, TrendingUp, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PricingProps {
  onAdminClick: () => void;
}

/**
 * Section de tarification intégrée à la landing page
 */
export const Pricing: React.FC<PricingProps> = ({ onAdminClick }) => {
  const offers = [
    {
      name: 'Starter',
      price: '49',
      period: 'par événement',
      target: 'Soirées privées, anniversaires, tests.',
      features: [
        'Mur de photos en temps réel',
        'Upload illimité de photos',
        'Galerie HD complète',
        'Modération automatique par IA',
        'Support par email',
      ],
      gradient: 'from-pink-500 to-rose-500',
      popular: false,
    },
    {
      name: 'Pro',
      price: '99',
      period: 'par événement',
      target: 'Cœur de gamme : mariages, événements d\'entreprise.',
      features: [
        'Tout Starter inclus',
        'Aftermovie automatique',
        'Branding personnalisé',
        'Statistiques avancées',
        'Support prioritaire',
        'Export ZIP HD',
      ],
      gradient: 'from-purple-500 to-pink-500',
      popular: true,
    },
    {
      name: 'Premium',
      price: '199',
      period: 'par événement',
      target: 'Grands événements, entreprises avec besoin de branding.',
      features: [
        'Tout Pro inclus',
        'Cadres personnalisés',
        'API et intégrations',
        'Gestion multi-événements',
        'Support dédié 24/7',
        'Formation personnalisée',
      ],
      gradient: 'from-indigo-500 to-purple-500',
      popular: false,
    },
  ];

  const subscriptions = [
    {
      name: 'Pro',
      price: '29',
      period: '/mois',
      description: 'Pour professionnels et agences à usage récurrent',
    },
    {
      name: 'Studio',
      price: '99',
      period: '/mois',
      description: 'Solution complète pour agences événementielles',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section id="pricing" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Tarification Stratégique</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Un investissement, pas un coût
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Notre structure tarifaire n'est pas un coût, mais un investissement dans une expérience supérieure, accessible et mesurable. Découvrez pourquoi Partywall rend les alternatives traditionnelles irrationnelles d'un point de vue budgétaire.
          </motion.p>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Nos Offres : Flexibilité et Accessibilité
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              Une tarification transparente adaptée à la taille de votre événement
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {offers.map((offer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl p-1 border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  offer.popular
                    ? 'border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.15)] z-10 scale-105 md:scale-110'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {offer.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold text-white tracking-wide shadow-lg uppercase">
                    Le plus populaire
                  </div>
                )}
                
                <div className={`h-full rounded-[20px] p-6 sm:p-8 flex flex-col ${offer.popular ? 'bg-gradient-to-b from-white/5 to-transparent' : 'bg-transparent'}`}>
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-2">{offer.name}</h4>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {offer.price}€
                        </span>
                        <span className="text-gray-400 text-sm font-medium">{offer.period}</span>
                      </div>
                      <p className="text-sm text-gray-400 leading-snug min-h-[40px]">{offer.target}</p>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                    <ul className="space-y-4 mb-8 flex-grow">
                      {offer.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${offer.popular ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-gray-300'}`}>
                              <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <span className="text-gray-300 text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={onAdminClick}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl ${
                        offer.popular
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-pink-900/20'
                          : 'bg-white text-black hover:bg-gray-100 shadow-white/5'
                      }`}
                    >
                      Choisir {offer.name}
                    </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Subscriptions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 relative overflow-hidden bg-gradient-to-r from-purple-900/40 to-indigo-900/40 backdrop-blur-2xl rounded-3xl border border-purple-500/30 p-1"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            
            <div className="relative z-10 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-10">
                    <div className="text-center md:text-left max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
                            <Zap className="w-3.5 h-3.5 text-purple-300" />
                            <span className="text-xs font-bold text-purple-200 uppercase tracking-wide">Abonnements Pro & Agences</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            Usage récurrent ? Passez à l'illimité.
                        </h3>
                        <p className="text-gray-300">
                            Transformez Partywall en un outil de travail stratégique avec nos abonnements mensuels sans engagement.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {subscriptions.map((sub, index) => (
                            <div key={index} className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20 min-w-[200px]">
                                <div className="text-center">
                                    <h4 className="text-lg font-bold text-white mb-1">{sub.name}</h4>
                                    <div className="flex items-baseline justify-center gap-1 mb-2">
                                        <span className="text-2xl font-bold text-white">{sub.price}€</span>
                                        <span className="text-gray-400 text-xs">{sub.period}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-tight">{sub.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="text-center">
                     <button 
                        onClick={onAdminClick}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors border border-white/10"
                     >
                        Contacter l'équipe commerciale
                        <ArrowRight className="w-4 h-4" />
                     </button>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ROI Section */}
      <section id="roi" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-6"
            >
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Retour sur Investissement</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              L'Argument Choc : Un ROI Imbattable
            </motion.h2>
          </div>

          <div className="space-y-8">
            {/* Point 1 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-red-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-400">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Le coût d'un photobooth traditionnel
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Pour rappel, un photobooth classique est facturé entre <strong className="text-red-400">400 € et 900 €</strong> pour une seule soirée.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Point 2 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-pink-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-pink-400">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Notre positionnement : 4 à 9 fois moins cher
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed mb-4">
                    Notre offre la plus populaire, la plus complète pour la majorité des besoins, est à <strong className="text-pink-400">99 €</strong>. Pour <strong className="text-pink-400">4 à 9 fois moins cher</strong>, vous n'obtenez pas une simple boîte à photos limitée à quelques invités, mais :
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span>Une expérience interactive pour tous vos participants</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span>Un mur de souvenirs en direct</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span>Un aftermovie automatique</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span>Une galerie HD complète</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Point 3 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-green-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-400">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    La question qui change tout
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    La question pour votre client n'est donc plus <em className="text-gray-400">"Quel est le coût ?"</em> mais <strong className="text-green-400">"Comment justifier de payer 5 à 10 fois plus cher pour une solution logistiquement lourde qui engage moins de monde et génère moins de valeur ?"</strong>
                  </p>
                  <p className="text-xl font-bold text-green-400 mt-4">
                    Nous rendons le choix des alternatives financièrement irrationnel.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6"
            >
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Votre Stratégie pour Gagner</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
            >
              Conclusion : Votre Stratégie pour Gagner
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto mb-8"
            >
              Partywall n'est pas un produit de plus sur le marché ; c'est une réponse pertinente et puissante aux besoins actuels de digitalisation, d'engagement et de simplicité dans l'événementiel.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-blue-500/20 mb-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Vos Prochaines Étapes pour Convaincre
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Menez par la Démo
                  </h4>
                  <p className="text-gray-300">
                    C'est notre outil de closing. En 2 minutes, l'expérience parle d'elle-même et rend notre proposition de valeur tangible.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Diagnostiquez la Douleur, Vendez le Remède
                  </h4>
                  <p className="text-gray-300">
                    Ne listez pas les fonctionnalités. Identifiez le "pain point" principal du client (coût, logistique, engagement) et positionnez Partywall comme la solution évidente.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={onAdminClick}
              className="group relative px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold rounded-xl shadow-lg hover:shadow-xl text-white text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 mx-auto"
            >
              <Users className="w-6 h-6" />
              <span>Commencer maintenant</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
};



