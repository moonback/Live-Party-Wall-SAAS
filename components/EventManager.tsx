import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { updateEvent, deleteEvent, getEventOrganizers, addOrganizer, removeOrganizer } from '../services/eventService';
import { Event, EventOrganizer } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save, Trash2, Users, UserPlus, X, Loader2, AlertTriangle } from 'lucide-react';

interface EventManagerProps {
  event: Event;
  onBack: () => void;
  onEventUpdated?: (event: Event) => void;
  onEventDeleted?: () => void;
}

const EventManager: React.FC<EventManagerProps> = ({ event, onBack, onEventUpdated, onEventDeleted }) => {
  const { user } = useAuth();
  const { isEventOwner, canEdit, clearEvent } = useEvent();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // État local pour l'édition
  const [editedName, setEditedName] = useState(event.name);
  const [editedSlug, setEditedSlug] = useState(event.slug);
  const [editedDescription, setEditedDescription] = useState(event.description || '');
  const [editedIsActive, setEditedIsActive] = useState(event.is_active);
  
  // Gestion des organisateurs
  const [organizers, setOrganizers] = useState<EventOrganizer[]>([]);
  const [organizerEmails, setOrganizerEmails] = useState<Map<string, string>>(new Map());
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [showAddOrganizer, setShowAddOrganizer] = useState(false);
  const [newOrganizerEmail, setNewOrganizerEmail] = useState('');
  const [newOrganizerRole, setNewOrganizerRole] = useState<'organizer' | 'viewer'>('organizer');
  const [addingOrganizer, setAddingOrganizer] = useState(false);

  // Charger les organisateurs
  useEffect(() => {
    const loadOrganizers = async () => {
      if (!canEdit) return;
      
      try {
        setLoadingOrganizers(true);
        const orgs = await getEventOrganizers(event.id);
        setOrganizers(orgs);
        
        // Essayer de récupérer les emails des utilisateurs
        // Note: Cela nécessiterait une fonction RPC dans Supabase pour accéder à auth.users
        // Pour l'instant, on garde juste l'UUID formaté
        const emailsMap = new Map<string, string>();
        // TODO: Implémenter la récupération des emails via RPC Supabase
        setOrganizerEmails(emailsMap);
      } catch (error) {
        console.error('Error loading organizers:', error);
        addToast('Erreur lors du chargement des organisateurs', 'error');
      } finally {
        setLoadingOrganizers(false);
      }
    };

    loadOrganizers();
  }, [event.id, canEdit, addToast]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!canEdit) {
      addToast('Vous n\'avez pas les permissions pour modifier cet événement', 'error');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateEvent(event.id, {
        name: editedName,
        slug: editedSlug,
        description: editedDescription || null,
        is_active: editedIsActive
      });

      if (updated) {
        addToast('Événement mis à jour avec succès', 'success');
        if (onEventUpdated) {
          onEventUpdated(updated);
        }
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      addToast(error.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer l'événement
  const handleDelete = async () => {
    if (!isEventOwner) {
      addToast('Seul le propriétaire peut supprimer l\'événement', 'error');
      return;
    }

    try {
      setDeleting(true);
      await deleteEvent(event.id);
      addToast('Événement supprimé avec succès', 'success');
      
      // Appeler onEventDeleted qui va gérer le retour à la liste
      if (onEventDeleted) {
        onEventDeleted();
      } else {
        // Si onEventDeleted n'est pas défini, utiliser onBack
        onBack();
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      addToast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Ajouter un organisateur
  const handleAddOrganizer = async () => {
    if (!newOrganizerEmail.trim()) {
      addToast('L\'email est requis', 'error');
      return;
    }

    // Note: Dans une vraie application, on devrait chercher l'utilisateur par email
    // Pour l'instant, on suppose que l'utilisateur existe déjà dans Supabase Auth
    addToast('Fonctionnalité à implémenter : recherche d\'utilisateur par email', 'info');
    setShowAddOrganizer(false);
    setNewOrganizerEmail('');
  };

  // Retirer un organisateur
  const handleRemoveOrganizer = async (organizerId: string, userId: string) => {
    try {
      await removeOrganizer(event.id, userId);
      setOrganizers(prev => prev.filter(o => o.id !== organizerId));
      addToast('Organisateur retiré avec succès', 'success');
    } catch (error: any) {
      console.error('Error removing organizer:', error);
      addToast(error.message || 'Erreur lors du retrait', 'error');
    }
  };

  const hasChanges = 
    editedName !== event.name ||
    editedSlug !== event.slug ||
    editedDescription !== (event.description || '') ||
    editedIsActive !== event.is_active;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                clearEvent(); // Déconnecter l'événement
                onBack(); // Retourner à la liste des événements
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Retour à la liste des événements"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold">Gérer l'événement</h1>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Informations de l'événement */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Informations</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom de l'événement</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug (identifiant URL)</label>
              <input
                type="text"
                value={editedSlug}
                onChange={(e) => setEditedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                disabled={!canEdit}
                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none disabled:opacity-50 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">URL : ?event={editedSlug}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none disabled:opacity-50"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={editedIsActive}
                onChange={(e) => setEditedIsActive(e.target.checked)}
                disabled={!canEdit}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="isActive" className="text-sm">
                Événement actif
              </label>
            </div>
          </div>
        </div>

        {/* Organisateurs */}
        {canEdit && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Organisateurs
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Gérez les permissions d'accès à l'événement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/25 font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>

            {showAddOrganizer && (
              <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10 animate-fade-in">
                <h3 className="text-sm font-medium mb-4 text-gray-300">Ajouter un organisateur</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2 text-gray-400">
                      Email de l'utilisateur
                    </label>
                    <input
                      type="email"
                      value={newOrganizerEmail}
                      onChange={(e) => setNewOrganizerEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2 text-gray-400">
                      Rôle
                    </label>
                    <select
                      value={newOrganizerRole}
                      onChange={(e) => setNewOrganizerRole(e.target.value as 'organizer' | 'viewer')}
                      className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
                    >
                      <option value="organizer">Organisateur (peut modifier)</option>
                      <option value="viewer">Visualiseur (lecture seule)</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddOrganizer}
                      disabled={addingOrganizer || !newOrganizerEmail.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-pink-500/25"
                    >
                      {addingOrganizer ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Ajout...
                        </span>
                      ) : (
                        'Ajouter'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddOrganizer(false);
                        setNewOrganizerEmail('');
                      }}
                      className="px-4 py-2.5 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-300 font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loadingOrganizers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : organizers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucun organisateur</p>
            ) : (
              <div className="space-y-3">
                {organizers.map((org) => {
                  const isOwner = org.role === 'owner';
                  const isCurrentUser = user?.id === org.user_id;
                  const userIdShort = org.user_id.substring(0, 8) + '...' + org.user_id.substring(org.user_id.length - 4);
                  
                  return (
                    <div
                      key={org.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isOwner 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOwner 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-slate-700'
                        }`}>
                          <Users className={`w-5 h-5 ${isOwner ? 'text-white' : 'text-gray-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {organizerEmails.get(org.user_id) || userIdShort}
                            </p>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isOwner
                                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                : org.role === 'organizer'
                                ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                                : 'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                            }`}>
                              {isOwner ? 'Propriétaire' : org.role === 'organizer' ? 'Organisateur' : 'Visualiseur'}
                            </span>
                            {!organizerEmails.has(org.user_id) && (
                              <span className="text-xs text-gray-500 font-mono">{userIdShort}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isOwner && isEventOwner && (
                        <button
                          onClick={() => handleRemoveOrganizer(org.id, org.user_id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors ml-2 flex-shrink-0"
                          aria-label="Retirer l'organisateur"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Zone de danger */}
        {isEventOwner && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Zone de danger</h3>
                <p className="text-sm text-gray-300 mb-4">
                  La suppression de l'événement est irréversible. Toutes les photos, paramètres et données associées seront supprimées.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer l'événement</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-400">
                      Êtes-vous sûr de vouloir supprimer cet événement ?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Suppression...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Confirmer la suppression</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManager;

