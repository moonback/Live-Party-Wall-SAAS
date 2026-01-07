import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getUserEvents, createEvent } from '../services/eventService';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Plus, Calendar, Search, Loader2, Sparkles, Clock, ExternalLink, X } from 'lucide-react';

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
      // ownerId est optionnel, le service utilisera auth.uid() automatiquement
      const newEvent = await createEvent(
        newEventSlug.trim().toLowerCase(),
        newEventName.trim(),
        newEventDescription.trim() || null
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Connexion requise
          </h2>
          <p className="text-gray-300 mb-6">Vous devez être connecté pour gérer vos événements.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/25 font-medium"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* {onBack && (
                <button
                  onClick={onBack}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )} */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Mes Événements
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Gérez et créez vos événements en un clic
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 font-medium group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nouvel événement</span>
            </button>
          </div>

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-6 border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Créer un nouvel événement
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewEventSlug('');
                    setNewEventName('');
                    setNewEventDescription('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Nom de l'événement *
                  </label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
                    placeholder="Ex: Mariage de Sophie et Marc"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Slug (identifiant URL) *
                  </label>
                  <input
                    type="text"
                    value={newEventSlug}
                    onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300 font-mono text-sm"
                    placeholder="mariage-sophie-marc"
                    pattern="[a-z0-9\-]+"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Utilisé dans l'URL : ?event={newEventSlug || 'mariage-sophie-marc'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300 resize-none"
                    placeholder="Décrivez votre événement..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-pink-500/25 disabled:shadow-none"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Créer l'événement</span>
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
                    className="px-5 py-3 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-300 font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 focus:border-pink-500/50 focus:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300 placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Liste des événements */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                <p className="text-gray-400">Chargement des événements...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-12 md:p-16 text-center border border-white/10 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {searchQuery ? 'Aucun événement trouvé' : 'Aucun événement'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? 'Essayez avec d\'autres mots-clés ou créez un nouvel événement'
                  : 'Créez votre premier événement pour commencer à partager vos moments'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/25 font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer un événement</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="group relative bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 hover:bg-slate-900/80 transition-all duration-300 text-left border border-white/10 hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1"
                >
                  {/* Badge de statut */}
                  <div className="absolute top-4 right-4">
                    {event.is_active ? (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full border border-green-500/30 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        Actif
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                        Inactif
                      </span>
                    )}
                  </div>

                  {/* Icône décorative */}
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-pink-400" />
                  </div>

                  {/* Titre */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300 pr-16">
                    {event.name}
                  </h3>

                  {/* Description */}
                  {event.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 group-hover:text-gray-200 transition-colors">
                      {event.description}
                    </p>
                  )}

                  {/* Slug */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 group-hover:text-pink-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-mono text-xs">?event={event.slug}</span>
                  </div>

                  {/* Date de création */}
                  <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Créé le {new Date(event.created_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>

                  {/* Effet hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSelector;

