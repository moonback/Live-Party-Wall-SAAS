import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, Image as ImageIcon, Calendar, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Subscription, SubscriptionPlanType, SubscriptionStatus } from '../types';
import { getUserActiveSubscription, getUserSubscriptions, getRemainingEvents } from '../services/subscriptionService';
import { useToast } from '../context/ToastContext';

interface UserSubscriptionStatusProps {
  // Props si nécessaire
}

const PLAN_LABELS: Record<SubscriptionPlanType, string> = {
  monthly_pro: 'Pro Mensuel',
  monthly_studio: 'Studio Mensuel',
  event_starter: 'Starter',
  event_pro: 'Pro Événement',
  event_premium: 'Premium Événement',
  volume_10: 'Pack 10 événements',
  volume_50: 'Pack 50 événements',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Annulé',
  pending_activation: 'En attente d\'activation',
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'text-green-400',
  expired: 'text-gray-400',
  cancelled: 'text-red-400',
  pending_activation: 'text-yellow-400',
};

export const UserSubscriptionStatus: React.FC<UserSubscriptionStatusProps> = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingEvents, setRemainingEvents] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [active, all] = await Promise.all([
        getUserActiveSubscription(user.id),
        getUserSubscriptions(user.id),
      ]);
      
      setActiveSubscription(active);
      setAllSubscriptions(all);

      // Charger les événements restants si c'est un pack volume
      if (active && active.events_limit !== null) {
        const remaining = await getRemainingEvents(active.id);
        setRemainingEvents(remaining);
      } else {
        setRemainingEvents(null);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      addToast('Erreur lors du chargement de vos abonnements', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!activeSubscription) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Abonnement</h3>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium mb-1">Aucun abonnement actif</p>
              <p className="text-gray-300 text-sm">
                Vous devez souscrire à un abonnement pour créer des événements et uploader des photos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Mon Abonnement</h3>
        </div>
        <span className={`text-sm font-medium ${STATUS_COLORS[activeSubscription.status]}`}>
          {STATUS_LABELS[activeSubscription.status]}
        </span>
      </div>

      <div className="space-y-4">
        {/* Plan actif */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">{PLAN_LABELS[activeSubscription.plan_type]}</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Événements:</span>
              <p className="text-white font-medium">
                {activeSubscription.events_limit === null 
                  ? 'Illimité' 
                  : remainingEvents !== null 
                    ? `${remainingEvents} restant(s) / ${activeSubscription.events_limit}`
                    : `${activeSubscription.events_limit} max`}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Photos/événement:</span>
              <p className="text-white font-medium">
                {activeSubscription.photos_per_event_limit === null 
                  ? 'Illimité' 
                  : `${activeSubscription.photos_per_event_limit} max`}
              </p>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <span className="text-gray-400 text-sm mb-2 block">Fonctionnalités activées:</span>
            <div className="flex flex-wrap gap-2">
              {activeSubscription.features.frames_enabled && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Cadres</span>
              )}
              {activeSubscription.features.aftermovie_enabled && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Aftermovie</span>
              )}
              {activeSubscription.features.branding_enabled && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Branding</span>
              )}
              {activeSubscription.features.advanced_stats_enabled && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Stats avancées</span>
              )}
              {activeSubscription.features.priority_support_enabled && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Support prioritaire</span>
              )}
            </div>
          </div>
        </div>

        {/* Historique */}
        {allSubscriptions.length > 1 && (
          <div>
            <h4 className="text-white font-semibold mb-2 text-sm">Historique des abonnements</h4>
            <div className="space-y-2">
              {allSubscriptions
                .filter(sub => sub.id !== activeSubscription.id)
                .slice(0, 3)
                .map(sub => (
                  <div
                    key={sub.id}
                    className="bg-gray-900/30 rounded p-3 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="text-white">{PLAN_LABELS[sub.plan_type]}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={STATUS_COLORS[sub.status]}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

