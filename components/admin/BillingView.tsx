import React, { useEffect, useState } from 'react';
import { CreditCard, Zap, Calendar, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserSubscription, getPlans, createCheckoutSession } from '../../services/paymentService';
import { Subscription, Plan } from '../../types';

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBillingData = async () => {
      if (!user) return;
      try {
        const [sub, allPlans] = await Promise.all([
          getUserSubscription(user.id),
          getPlans()
        ]);
        setSubscription(sub);
        setPlans(allPlans);
      } catch (error) {
        console.error("Error loading billing data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBillingData();
  }, [user]);

  const currentPlan = plans.find(p => p.id === subscription?.plan_id);

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    try {
      const session = await createCheckoutSession(planId, user.id);
      if (session?.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error("Error upgrading plan:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Facturation & Abonnement</h2>
        <p className="text-gray-400">Gérez votre plan et vos paiements.</p>
      </div>

      {/* État actuel de l'abonnement */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-pink-500/20 rounded-xl">
              <Zap className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Plan Actuel</p>
              <h3 className="text-2xl font-bold text-white">
                {currentPlan ? currentPlan.name : "Gratuit"}
              </h3>
              {subscription && (
                <div className="flex items-center gap-2 mt-1 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Abonnement actif</span>
                </div>
              )}
            </div>
          </div>

          {subscription && (
            <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-gray-800">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Prochain renouvellement</p>
                <p className="text-white font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {!subscription && (
            <button 
              onClick={() => document.getElementById('plans-selection')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all"
            >
              Passer au Premium
            </button>
          )}
        </div>
      </div>

      {/* Sélection de plans si pas d'abo ou pour upgrade */}
      <div id="plans-selection" className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-pink-500" />
          Plans Disponibles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.interval === 'event').map((plan) => (
            <div 
              key={plan.id}
              className={`bg-gray-800/30 border ${plan.id === subscription?.plan_id ? 'border-pink-500 ring-1 ring-pink-500' : 'border-gray-700'} rounded-2xl p-6 flex flex-col`}
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">{plan.price_cents / 100}€</span>
                  <span className="text-gray-400 text-sm">/ événement</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.id === subscription?.plan_id}
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.id === subscription?.plan_id
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {plan.id === subscription?.plan_id ? "Plan Actuel" : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historique ou Aide */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-white mb-1">Besoin d'une facture personnalisée ?</h4>
          <p className="text-gray-400 text-sm">
            Si vous avez besoin d'une facturation spécifique pour votre entreprise ou agence, 
            contactez-nous directement à support@livepartywall.com.
          </p>
        </div>
      </div>
    </div>
  );
};

