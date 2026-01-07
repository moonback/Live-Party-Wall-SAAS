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
  const { isEventOwner, canEdit } = useEvent();
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
      if (onEventDeleted) {
        onEventDeleted();
      }
      onBack();
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
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition"
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
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organisateurs
              </h2>
              <button
                onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>

            {showAddOrganizer && (
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <input
                    type="email"
                    value={newOrganizerEmail}
                    onChange={(e) => setNewOrganizerEmail(e.target.value)}
                    placeholder="Email de l'utilisateur"
                    className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
                  />
                  <select
                    value={newOrganizerRole}
                    onChange={(e) => setNewOrganizerRole(e.target.value as 'organizer' | 'viewer')}
                    className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="organizer">Organisateur (peut modifier)</option>
                    <option value="viewer">Visualiseur (lecture seule)</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddOrganizer}
                      disabled={addingOrganizer}
                      className="flex-1 px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setShowAddOrganizer(false);
                        setNewOrganizerEmail('');
                      }}
                      className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
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
              <div className="space-y-2">
                {organizers.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{org.user_id}</p>
                      <p className="text-sm text-gray-400">
                        {org.role === 'owner' ? 'Propriétaire' : org.role === 'organizer' ? 'Organisateur' : 'Visualiseur'}
                      </p>
                    </div>
                    {org.role !== 'owner' && isEventOwner && (
                      <button
                        onClick={() => handleRemoveOrganizer(org.id, org.user_id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
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

