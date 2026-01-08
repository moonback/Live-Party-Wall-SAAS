import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, XCircle, Clock, Users, 
  Calendar, Image as ImageIcon, Settings, Search,
  ArrowRight, RefreshCw, Edit, Save, X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { 
  Subscription, 
  SubscriptionPlanType, 
  SubscriptionStatus 
} from '../../types';
import { 
  getUserSubscriptions, 
  activateSubscription,
  getRemainingEvents 
} from '../../services/subscriptionService';
import { supabase } from '../../services/supabaseClient';

interface SubscriptionManagementProps {
  // Props si nécessaire
}

const PLAN_LABELS: Record<SubscriptionPlanType, string> = {
  monthly_pro: 'Pro Mensuel (29€/mois)',
  monthly_studio: 'Studio Mensuel (99€/mois)',
  event_starter: 'Starter (49€)',
  event_pro: 'Pro Événement (99€)',
  event_premium: 'Premium Événement (199€)',
  volume_10: 'Pack 10 événements (290€/événement)',
  volume_50: 'Pack 50 événements (198€/événement)',
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

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = () => {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Array<Subscription & { user_email?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [editedStatus, setEditedStatus] = useState<SubscriptionStatus | null>(null);

  // Charger tous les abonnements avec les emails des utilisateurs
  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      // Récupérer tous les abonnements
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Pour chaque abonnement, récupérer l'email de l'utilisateur
      // Note: supabase.auth.admin n'est pas accessible côté client
      // On affichera juste l'ID utilisateur pour l'instant
      // Pour obtenir les emails, il faudrait créer une fonction Edge ou utiliser le dashboard Supabase
      const subscriptionsWithEmails = (subsData || []).map((sub: Subscription) => ({
        ...sub,
        user_email: `User ID: ${sub.user_id.substring(0, 8)}...`, // Afficher un aperçu de l'ID
      }));

      setSubscriptions(subscriptionsWithEmails);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      addToast('Erreur lors du chargement des abonnements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleActivateSubscription = async (subscriptionId: string) => {
    try {
      await activateSubscription(subscriptionId);
      addToast('Abonnement activé avec succès', 'success');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error activating subscription:', error);
      addToast('Erreur lors de l\'activation de l\'abonnement', 'error');
    }
  };

  const handleEditStatus = (subscription: Subscription) => {
    setEditingSubscriptionId(subscription.id);
    setEditedStatus(subscription.status);
  };

  const handleSaveStatus = async (subscriptionId: string) => {
    if (!editedStatus) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: editedStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      addToast('Statut mis à jour avec succès', 'success');
      setEditingSubscriptionId(null);
      setEditedStatus(null);
      await loadSubscriptions();
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingSubscriptionId(null);
    setEditedStatus(null);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.user_email?.toLowerCase().includes(query) ||
      PLAN_LABELS[sub.plan_type].toLowerCase().includes(query) ||
      STATUS_LABELS[sub.status].toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Gestion des Abonnements
          </h2>
          <p className="text-gray-400 mt-1">
            Gérez les abonnements des organisateurs et activez-les après paiement
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par email, plan ou statut..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucun abonnement trouvé
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {PLAN_LABELS[subscription.plan_type]}
                    </h3>
                    <span className={`text-sm font-medium ${STATUS_COLORS[subscription.status]}`}>
                      {STATUS_LABELS[subscription.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-400">Utilisateur:</span>
                      <p className="text-white font-medium">{subscription.user_email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Événements:</span>
                      <p className="text-white font-medium">
                        {subscription.events_limit === null 
                          ? 'Illimité' 
                          : `${subscription.events_limit} max`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Photos/événement:</span>
                      <p className="text-white font-medium">
                        {subscription.photos_per_event_limit === null 
                          ? 'Illimité' 
                          : `${subscription.photos_per_event_limit} max`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Créé le:</span>
                      <p className="text-white font-medium">
                        {new Date(subscription.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Remaining events for volume packs */}
                  {subscription.events_limit !== null && subscription.status === 'active' && (
                    <div className="mt-4">
                      <RemainingEventsDisplay subscriptionId={subscription.id} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {subscription.status === 'pending_activation' && (
                    <button
                      onClick={() => handleActivateSubscription(subscription.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Activer
                    </button>
                  )}
                  
                  {editingSubscriptionId === subscription.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editedStatus || subscription.status}
                        onChange={(e) => setEditedStatus(e.target.value as SubscriptionStatus)}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveStatus(subscription.id)}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStatus(subscription)}
                      className="p-2 text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Composant pour afficher les événements restants
const RemainingEventsDisplay: React.FC<{ subscriptionId: string }> = ({ subscriptionId }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRemaining = async () => {
      try {
        const count = await getRemainingEvents(subscriptionId);
        setRemaining(count);
      } catch (error) {
        console.error('Error loading remaining events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRemaining();
  }, [subscriptionId]);

  if (loading) return <span className="text-gray-400 text-sm">Chargement...</span>;
  if (remaining === -1) return <span className="text-green-400 text-sm">Illimité</span>;
  
  return (
    <span className="text-sm">
      <span className="text-gray-400">Événements restants: </span>
      <span className={`font-semibold ${remaining === 0 ? 'text-red-400' : 'text-green-400'}`}>
        {remaining}
      </span>
    </span>
  );
};

