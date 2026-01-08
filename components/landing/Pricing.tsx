import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, Users, Zap, TrendingUp, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPlans, createCheckoutSession } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { Plan } from '../../types';

interface PricingProps {
  onAdminClick: () => void;
}

/**
 * Section de tarification intégrée à la landing page
 */
export const Pricing: React.FC<PricingProps> = ({ onAdminClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const fetchedPlans = await getPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Error loading plans:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const handlePlanSelection = async (plan: Plan) => {
    if (!isAuthenticated) {
      onAdminClick(); // Rediriger vers login si non authentifié
      return;
    }

    try {
      if (user) {
        const session = await createCheckoutSession(plan.id, user.id);
        if (session?.url) {
          window.location.href = session.url;
        }
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
    }
  };

  const offers = plans.filter(p => p.interval === 'event').map(p => ({
    id: p.id,
    name: p.name,
    price: (p.price_cents / 100).toString(),
    period: 'par événement',
    target: p.type === 'starter' ? 'Soirées privées, anniversaires, tests.' : 
            p.type === 'pro' ? 'Cœur de gamme : mariages, événements d\'entreprise.' : 
            'Grands événements, entreprises avec besoin de branding.',
    features: p.features,
    popular: p.type === 'pro',
    plan: p
  }));

  const subscriptions = plans.filter(p => p.interval === 'month').map(p => ({
    id: p.id,
    name: p.name,
    price: (p.price_cents / 100).toString(),
    period: '/mois',
    description: p.type === 'pro' ? 'Pour professionnels et agences à usage récurrent' : 'Solution complète pour agences événementielles',
    plan: p
  }));

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
            Notre structure tarifaire n'est pas un coût, mais un investissement dans une expérience supérieure, accessible et mesurable. Découvrez pourquoi Live Party Wall rend les alternatives traditionnelles irrationnelles d'un point de vue budgétaire.
          </motion.p>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
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
              Choisissez l'offre qui correspond à vos besoins
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {offers.map((offer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  offer.popular
                    ? 'border-pink-500 shadow-2xl shadow-pink-500/20'
                    : 'border-gray-700/50 hover:border-pink-500/50'
                }`}
              >
                {offer.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-sm font-semibold text-white">
                    Le plus populaire
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">{offer.name}</h4>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      {offer.price} €
                    </span>
                    <span className="text-gray-400 text-sm">{offer.period}</span>
                  </div>
                  <p className="text-sm text-gray-400 italic">{offer.target}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {offer.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelection(offer.plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    offer.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                      : 'bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600'
                  }`}
                >
                  Choisir {offer.name}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Subscriptions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-4">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Abonnements Professionnels</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Pour les professionnels et agences à usage récurrent
              </h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Transformez Live Party Wall en un outil de travail stratégique avec nos abonnements mensuels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {subscriptions.map((sub, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handlePlanSelection(sub.plan)}
                  className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 cursor-pointer hover:border-pink-500/50 transition-all"
                >
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-2">{sub.name}</h4>
                    <div className="flex items-baseline justify-center gap-2 mb-3">
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {sub.price} €
                      </span>
                      <span className="text-gray-400">{sub.period}</span>
                    </div>
                    <p className="text-sm text-gray-400">{sub.description}</p>
                  </div>
                </motion.div>
              ))}
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
              Live Party Wall n'est pas un produit de plus sur le marché ; c'est une réponse pertinente et puissante aux besoins actuels de digitalisation, d'engagement et de simplicité dans l'événementiel.
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
                    Ne listez pas les fonctionnalités. Identifiez le "pain point" principal du client (coût, logistique, engagement) et positionnez Live Party Wall comme la solution évidente.
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



