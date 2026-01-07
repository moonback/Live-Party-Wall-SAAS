import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getUserEvents, createEvent } from '../services/eventService';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Plus, Calendar, Search, Loader2 } from 'lucide-react';

interface EventSelectorProps {
  onEventSelected?: (event: Event) => void;
  onBack?: () => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelected, onBack }) => {
  const { user } = useAuth();
  const { loadEventBySlug } = useEvent();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEventSlug, setNewEventSlug] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  // Charger les événements de l'utilisateur
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userEvents = await getUserEvents(user.id);
        setEvents(userEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        addToast('Erreur lors du chargement des événements', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user, addToast]);

  // Filtrer les événements selon la recherche
  const filteredEvents = events.filter(event => {
    const query = searchQuery.toLowerCase();
    return (
      event.name.toLowerCase().includes(query) ||
      event.slug.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query))
    );
  });

  // Sélectionner un événement
  const handleSelectEvent = async (event: Event) => {
    try {
      await loadEventBySlug(event.slug);
      if (onEventSelected) {
        onEventSelected(event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      addToast('Erreur lors du chargement de l\'événement', 'error');
    }
  };

  // Créer un nouvel événement
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addToast('Vous devez être connecté pour créer un événement', 'error');
      return;
    }

    if (!newEventSlug.trim() || !newEventName.trim()) {
      addToast('Le slug et le nom sont requis', 'error');
      return;
    }

    try {
      setCreating(true);
      const newEvent = await createEvent(
        newEventSlug.trim().toLowerCase(),
        newEventName.trim(),
        newEventDescription.trim() || null,
        user.id
      );

      setEvents(prev => [newEvent, ...prev]);
      setShowCreateForm(false);
      setNewEventSlug('');
      setNewEventName('');
      setNewEventDescription('');
      addToast('Événement créé avec succès', 'success');
      
      // Sélectionner automatiquement le nouvel événement
      await handleSelectEvent(newEvent);
    } catch (error: any) {
      console.error('Error creating event:', error);
      addToast(error.message || 'Erreur lors de la création de l\'événement', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Générer un slug depuis le nom
  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début/fin
  };

  // Auto-générer le slug depuis le nom
  useEffect(() => {
    if (newEventName && !newEventSlug) {
      setNewEventSlug(generateSlugFromName(newEventName));
    }
  }, [newEventName]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
          <p className="text-gray-300 mb-6">Vous devez être connecté pour gérer vos événements.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-3xl font-bold">Mes Événements</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvel événement</span>
          </button>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Créer un nouvel événement</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l'événement *</label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
                  placeholder="Ex: Mariage de Sophie et Marc"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug (identifiant URL) *</label>
                <input
                  type="text"
                  value={newEventSlug}
                  onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
                  placeholder="mariage-sophie-marc"
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Utilisé dans l'URL : ?event=mariage-sophie-marc</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
                  placeholder="Description de l'événement..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Créer</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewEventSlug('');
                    setNewEventName('');
                    setNewEventDescription('');
                  }}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un événement..."
            className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-lg rounded-lg border border-white/20 focus:border-pink-500 focus:outline-none"
          />
        </div>

        {/* Liste des événements */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? 'Aucun événement trouvé' : 'Aucun événement'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Essayez avec d\'autres mots-clés'
                : 'Créez votre premier événement pour commencer'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                Créer un événement
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className="bg-black/40 backdrop-blur-lg rounded-xl p-6 hover:bg-black/60 transition text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold group-hover:text-pink-400 transition">
                    {event.name}
                  </h3>
                  {!event.is_active && (
                    <span className="px-2 py-1 text-xs bg-gray-500 rounded">Inactif</span>
                  )}
                </div>
                {event.description && (
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-mono">?event={event.slug}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                  Créé le {new Date(event.created_at).toLocaleDateString('fr-FR')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSelector;

