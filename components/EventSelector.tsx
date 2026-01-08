import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getUserEvents, createEvent, deleteEvent } from '../services/eventService';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isElectron } from '../utils/electronPaths';
import { 
  Plus, Calendar, Search, Loader2, Clock, 
  ExternalLink, X, Trash2, AlertTriangle, Copy, 
  Check, Filter, SortAsc, SortDesc,
  ArrowRight, LayoutDashboard, Settings as SettingsIcon
} from 'lucide-react';

interface EventSelectorProps {
  onEventSelected?: (event: Event) => void;
  onSettingsClick?: (event: Event) => void;
  onBack?: () => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelected, onSettingsClick, onBack }) => {
  const { user } = useAuth();
  const { loadEventBySlug, currentEvent } = useEvent();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEventSlug, setNewEventSlug] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

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

  // Copier le lien de l'événement
  const copyEventLink = (slug: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?event=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast('Lien copié dans le presse-papier !', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrer et trier les événements
  const filteredAndSortedEvents = events
    .filter(event => {
      const query = searchQuery.toLowerCase();
      return (
        event.name.toLowerCase().includes(query) ||
        event.slug.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' 
          ? b.name.localeCompare(a.name) 
          : a.name.localeCompare(b.name);
      }
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

  // Supprimer un événement
  const handleDeleteEvent = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection de l'événement
    
    // Empêcher la suppression de l'événement actuellement sélectionné
    if (currentEvent?.id === event.id) {
      addToast('Impossible de supprimer l\'événement actuellement sélectionné. Veuillez d\'abord sélectionner un autre événement.', 'error');
      return;
    }

    // Si pas encore confirmé, afficher la confirmation
    if (confirmDeleteId !== event.id) {
      setConfirmDeleteId(event.id);
      return;
    }

    try {
      setDeletingEventId(event.id);
      await deleteEvent(event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      addToast('Événement supprimé avec succès', 'success');
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      addToast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeletingEventId(null);
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-10 max-w-md w-full text-center border border-slate-800 relative z-10"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-slate-100">
            Connexion requise
          </h2>
          <p className="text-slate-400 mb-8 text-sm">Vous devez être connecté pour accéder à votre tableau de bord d'événements.</p>
          {onBack && !isElectron() && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm text-white transition-colors"
            >
              Retour à l'accueil
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 lg:p-12 relative text-slate-100">
      {/* Arrière-plan sobre */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/3 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/3 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 mb-1">Mes événements</h1>
            <p className="text-sm text-slate-400">Gérez vos Party Walls</p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel événement</span>
          </motion.button>
        </div>

        {/* Create Form Section */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">
                      Créer un nouvel événement
                    </h2>
                    <p className="text-sm text-slate-400">
                      Configurez votre Party Wall
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCreateForm(false)} 
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Nom public
                      </label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        placeholder="Ex: Mariage de Sophie & Marc"
                        required
                      />
                      <p className="text-xs text-slate-500">
                        Nom affiché sur le mur et dans les exports
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        URL personnalisée
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">/</span>
                        <input
                          type="text"
                          value={newEventSlug}
                          onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          className="w-full pl-8 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          placeholder="mariage-sophie-marc"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        L'URL sera : party-wall.com/?event={newEventSlug || '...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300">
                        Description courte
                      </label>
                      <textarea
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value.substring(0, 100))}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                        placeholder="Un petit mot pour vos invités..."
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Description optionnelle</p>
                        <p className="text-xs text-slate-500">{newEventDescription.length}/100</p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={creating}
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {creating ? 'Création...' : 'Créer l\'événement'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher parmi vos événements..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-2 text-sm text-slate-300"
              title="Changer l'ordre de tri"
            >
              {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
            </button>
            
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name')}
                className="appearance-none pl-3 pr-10 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors outline-none text-sm text-slate-300 cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="created_at" className="bg-slate-900">Par date</option>
                <option value="name" className="bg-slate-900">Par nom</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-slate-500 text-sm">Chargement de vos événements...</p>
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-12 text-center border border-slate-800"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Aucun résultat trouvé</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
              {searchQuery ? `Aucun événement correspondant à "${searchQuery}"` : "Commencez en créant votre premier événement."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Créer un événement
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedEvents.map((event, index) => {
                const isSelected = currentEvent?.id === event.id;
                const isDeleting = deletingEventId === event.id;
                const showConfirm = confirmDeleteId === event.id;
                const isCopied = copiedId === event.id;
                
                return (
                  <motion.div
                    layout
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group relative bg-slate-900/50 backdrop-blur-sm rounded-xl p-5 border transition-all flex flex-col ${
                      isSelected ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Event Status & Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                        event.is_active ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${event.is_active ? 'bg-teal-400' : 'bg-slate-500'}`}></div>
                        {event.is_active ? 'Actif' : 'Archivé'}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => copyEventLink(event.slug, event.id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${isCopied ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                          title="Copier le lien"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        
                        {!isSelected && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(showConfirm ? null : event.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${showConfirm ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-red-400'}`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    <AnimatePresence>
                      {showConfirm && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center"
                        >
                          <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4 border border-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <h4 className="text-base font-semibold mb-2 text-slate-100">Supprimer l'événement ?</h4>
                          <p className="text-slate-400 text-sm mb-6">Cette action est irréversible et supprimera toutes les photos associées.</p>
                          <div className="flex gap-3 w-full">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-sm text-slate-300 transition-colors border border-slate-700"
                            >
                              Annuler
                            </button>
                            <button 
                              onClick={(e) => handleDeleteEvent(event, e)}
                              disabled={isDeleting}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg font-medium text-sm text-white transition-colors flex items-center justify-center gap-2"
                            >
                              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Event Content */}
                    <div className="flex-1 mb-4">
                      <h3 className={`text-lg font-semibold mb-2 transition-colors ${isSelected ? 'text-slate-100' : 'text-slate-200'}`}>
                        {event.name}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {event.description || "Aucune description fournie pour cet événement."}
                      </p>
                      
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono bg-slate-950/50 py-2 px-3 rounded-lg border border-slate-800 w-fit">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>?event={event.slug}</span>
                      </div>
                    </div>

                    {/* Footer Info & Select Button */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(event.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 text-indigo-400">
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Sélectionné</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSelectEvent(event)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${
                            isSelected 
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 cursor-default' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isSelected ? 'Tableau de bord' : 'Ouvrir'}
                          {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                        </motion.button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSettingsClick) {
                              onSettingsClick(event);
                            }
                          }}
                          className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Paramètres de l'événement"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSelector;

