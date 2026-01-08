import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { getUserEvents, createEvent, deleteEvent } from '../services/eventService';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, Search, Loader2, Sparkles, Clock, 
  ExternalLink, X, Trash2, AlertTriangle, Copy, 
  Check, Filter, SortAsc, SortDesc,
  ArrowRight, LayoutDashboard, Settings as SettingsIcon,
  Type, Tag, Globe, Info
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Arrière-plan décoratif */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] p-10 max-w-md w-full text-center border border-white/10 shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg transform rotate-12">
            <Calendar className="w-10 h-10 text-white -rotate-12" />
          </div>
          <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Connexion requise
          </h2>
          <p className="text-gray-400 mb-8 font-medium">Vous devez être connecté pour accéder à votre tableau de bord d'événements.</p>
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-lg shadow-pink-500/20 font-bold text-lg"
            >
              Retour à l'accueil
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 lg:p-1 relative overflow-hidden text-white">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-1">
            <div className="flex-1"></div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all font-bold text-lg group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nouvel événement</span>
            </motion.button>
          </div>

        {/* Create Form Section */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Gradient decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-2xl border border-pink-500/40 shadow-lg shadow-pink-900/20 flex-shrink-0">
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-pink-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-1">
                        Configuration de l'événement
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Créez un nouvel événement pour votre Party Wall
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                      <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                        <Type className="w-5 h-5 text-pink-400" />
                        Nom public
                      </label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all"
                        placeholder="Ex: Mariage de Sophie & Marc"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-slate-500" />
                        Nom affiché sur le mur et dans les exports
                      </p>
                    </div>
                    <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                      <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-pink-400" />
                        URL personnalisée
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">/</span>
                        <input
                          type="text"
                          value={newEventSlug}
                          onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          className="w-full pl-8 pr-4 bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all font-mono"
                          placeholder="mariage-sophie-marc"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-slate-500" />
                        L'URL sera : party-wall.com/?event={newEventSlug || '...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                      <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-pink-400" />
                        Description courte
                      </label>
                      <textarea
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value.substring(0, 100))}
                        className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-normal placeholder:text-slate-500 focus:border-pink-500/20 focus:ring-2 focus:ring-pink-600/10 outline-none transition-all resize-none h-[124px]"
                        placeholder="Un petit mot pour vos invités..."
                      />
                      <p className="text-xs text-slate-400 mt-1.5 text-right">{newEventDescription.length}/100</p>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={creating}
                      className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                    >
                      {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      {creating ? 'Création en cours...' : 'Lancer mon Party Wall'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher parmi vos événements..."
              className="w-full pl-16 pr-6 py-4 bg-slate-900/50 border border-pink-400/10 rounded-xl focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 text-white outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-6 py-4 bg-slate-900/50 border border-pink-400/10 rounded-xl hover:border-pink-500/30 transition-all flex items-center gap-2"
              title="Changer l'ordre de tri"
            >
              {sortOrder === 'desc' ? <SortDesc className="w-5 h-5 text-pink-400" /> : <SortAsc className="w-5 h-5 text-pink-400" />}
              <span className="hidden sm:inline font-semibold text-sm">{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
            </button>
            
            <div className="relative group/sort">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name')}
                className="appearance-none pl-6 pr-12 py-4 bg-slate-900/50 border border-pink-400/10 rounded-xl hover:border-pink-500/30 transition-all outline-none font-semibold text-sm cursor-pointer"
              >
                <option value="created_at" className="bg-slate-900">Par date</option>
                <option value="name" className="bg-slate-900">Par nom</option>
              </select>
              <Filter className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] animate-pulse">Chargement de votre collection...</p>
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-[3rem] p-20 text-center border border-white/5 shadow-2xl"
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-gray-800 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-3xl font-black mb-4">Aucun résultat trouvé</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
              {searchQuery ? `Nous n'avons trouvé aucun événement correspondant à "${searchQuery}"` : "Commencez l'aventure en créant votre premier événement."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-10 py-5 bg-white text-black font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
              >
                Créer un événement maintenant
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-500 flex flex-col shadow-2xl ${
                      isSelected ? 'border-pink-500/50 shadow-[0_0_40px_rgba(236,72,153,0.15)]' : 'border-white/10 hover:border-pink-500/30'
                    }`}
                  >
                    {/* Event Status & Actions */}
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        event.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${event.is_active ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-400'}`}></div>
                        {event.is_active ? 'Direct' : 'Archivé'}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => copyEventLink(event.slug, event.id, e)}
                          className={`p-2 rounded-xl transition-colors ${isCopied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                          title="Copier le lien"
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.button>
                        
                        {!isSelected && (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(showConfirm ? null : event.id);
                            }}
                            className={`p-2 rounded-xl transition-colors ${showConfirm ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 text-gray-400 hover:text-red-400'}`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
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
                          className="absolute inset-0 z-20 bg-gray-950/90 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center"
                        >
                          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                          </div>
                          <h4 className="text-xl font-black mb-2 text-white">Supprimer l'événement ?</h4>
                          <p className="text-gray-400 text-sm mb-6">Cette action est irréversible et supprimera toutes les photos associées.</p>
                          <div className="flex gap-4 w-full">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10"
                            >
                              Annuler
                            </button>
                            <button 
                              onClick={(e) => handleDeleteEvent(event, e)}
                              disabled={isDeleting}
                              className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white transition-all flex items-center justify-center"
                            >
                              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Supprimer'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Event Content */}
                    <div className="flex-1">
                      <h3 className={`text-2xl font-black mb-3 tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-gray-100 group-hover:text-white'}`}>
                        {event.name}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-6 font-medium">
                        {event.description || "Aucune description fournie pour cet événement."}
                      </p>
                      
                      <div className="flex items-center gap-3 text-gray-500 text-xs font-mono bg-white/5 py-3 px-4 rounded-2xl border border-white/5 w-fit">
                        <ExternalLink className="w-3.5 h-3.5 text-pink-500" />
                        <span>?event={event.slug}</span>
                      </div>
                    </div>

                    {/* Footer Info & Select Button */}
                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(event.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 text-pink-400">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Sélectionné</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectEvent(event)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                            isSelected 
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30 cursor-default' 
                              : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700'
                          }`}
                        >
                          {isSelected ? 'Tableau de bord' : 'Ouvrir'}
                          {!isSelected && <ArrowRight className="w-4 h-4" />}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSettingsClick) {
                              onSettingsClick(event);
                            }
                          }}
                          className="p-3 bg-slate-900/50 hover:bg-slate-800/50 rounded-xl border border-white/10 hover:border-pink-500/30 transition-colors"
                          title="Paramètres de l'événement"
                        >
                          <SettingsIcon className="w-5 h-5 text-slate-400 hover:text-pink-400" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EventSelector;

