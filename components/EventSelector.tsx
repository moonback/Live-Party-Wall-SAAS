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
  ArrowRight, LayoutDashboard, Settings as SettingsIcon,
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-10 max-w-md w-full text-center border border-slate-800/50 relative z-10 shadow-2xl shadow-black/20"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-lg"
          >
            <Calendar className="w-10 h-10 text-slate-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-3 text-slate-100 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Connexion requise
          </h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">Vous devez être connecté pour accéder à votre tableau de bord d'événements.</p>
          {onBack && !isElectron() && (
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-sm text-white transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Retour à l'accueil
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 lg:p-12 relative text-slate-100 overflow-x-hidden">
      {/* Arrière-plan amélioré avec effets de profondeur */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/2 blur-[140px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section - Design premium */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
            >
              <Calendar className="w-6 h-6 text-indigo-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-1 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Mes événements
              </h1>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Gérez vos Party Walls
              </p>
            </div>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-sm text-white transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvel événement</span>
          </motion.button>
        </motion.div>

        {/* Create Form Section */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-800/50 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-100 mb-1">
                        Créer un nouvel événement
                      </h2>
                      <p className="text-sm text-slate-400">
                        Configurez votre Party Wall
                      </p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateForm(false)} 
                    className="p-2.5 rounded-xl border border-slate-700/50 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-all duration-200 shadow-lg shadow-black/10"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <span>Nom public</span>
                        <span className="text-xs font-normal text-slate-500">(requis)</span>
                      </label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all duration-200 shadow-inner"
                        placeholder="Ex: Mariage de Sophie & Marc"
                        required
                      />
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        Nom affiché sur le mur et dans les exports
                      </p>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <span>URL personnalisée</span>
                        <span className="text-xs font-normal text-slate-500">(unique)</span>
                      </label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm group-focus-within:text-indigo-400 transition-colors">/</span>
                        <input
                          type="text"
                          value={newEventSlug}
                          onChange={(e) => setNewEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          className="w-full pl-8 bg-slate-950/80 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all duration-200 shadow-inner"
                          placeholder="mariage-sophie-marc"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        L'URL sera : <span className="font-mono text-indigo-400">livepartywall.com/?event={newEventSlug || '...'}</span>
                      </p>
                    </motion.div>
                  </div>
                  
                  <div className="space-y-6 flex flex-col justify-between">
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-semibold text-slate-300">
                        Description courte
                      </label>
                      <textarea
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value.substring(0, 100))}
                        rows={3}
                        className="w-full bg-slate-950/80 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 focus:bg-slate-950 outline-none transition-all duration-200 resize-none shadow-inner"
                        placeholder="Un petit mot pour vos invités..."
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          Description optionnelle
                        </p>
                        <span className={`text-xs font-medium ${newEventDescription.length >= 90 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {newEventDescription.length}/100
                        </span>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={creating}
                      className="w-full px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:shadow-none"
                    >
                      {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      {creating ? 'Création...' : 'Créer l\'événement'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher parmi vos événements..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-800/50 rounded-xl focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 shadow-inner"
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-800/50 rounded-xl hover:border-slate-700/50 transition-all duration-200 flex items-center gap-2 text-sm font-medium text-slate-300 shadow-lg shadow-black/10"
              title="Changer l'ordre de tri"
            >
              {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
            </motion.button>
            
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name')}
                className="appearance-none pl-4 pr-10 py-3 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-800/50 rounded-xl hover:border-slate-700/50 transition-all duration-200 outline-none text-sm font-medium text-slate-300 cursor-pointer focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 shadow-lg shadow-black/10"
              >
                <option value="created_at" className="bg-slate-900">Par date</option>
                <option value="name" className="bg-slate-900">Par nom</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"></div>
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Chargement de vos événements...</p>
          </motion.div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-800/50 shadow-2xl shadow-black/20"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-lg"
            >
              <Calendar className="w-10 h-10 text-slate-400" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-3 text-slate-100">Aucun résultat trouvé</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              {searchQuery ? `Aucun événement correspondant à "${searchQuery}"` : "Commencez en créant votre premier événement."}
            </p>
            {!searchQuery && (
              <motion.button 
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
              >
                Créer un événement
              </motion.button>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`group relative bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-200 flex flex-col shadow-lg ${
                      isSelected 
                        ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/20' 
                        : 'border-slate-800/50 hover:border-slate-700/50 hover:shadow-xl hover:shadow-black/20'
                    }`}
                  >
                    {/* Event Status & Actions */}
                    <div className="flex justify-between items-start mb-5">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg ${
                          event.is_active 
                            ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-400 border border-teal-500/30' 
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full shadow-sm ${event.is_active ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'}`}></div>
                        {event.is_active ? 'Actif' : 'Archivé'}
                      </motion.div>
                      
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => copyEventLink(event.slug, event.id, e)}
                          className={`p-2 rounded-xl transition-all duration-200 shadow-lg ${
                            isCopied 
                              ? 'bg-gradient-to-r from-teal-500/30 to-emerald-500/30 text-teal-400 border border-teal-500/40' 
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 hover:border-slate-600/50'
                          }`}
                          title="Copier le lien"
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.button>
                        
                        {!isSelected && (
                          <motion.button 
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(showConfirm ? null : event.id);
                            }}
                            className={`p-2 rounded-xl transition-all duration-200 shadow-lg ${
                              showConfirm 
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-500/40' 
                                : 'bg-slate-800/80 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30'
                            }`}
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
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                        >
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-xl flex items-center justify-center mb-4 border border-red-500/40 shadow-lg shadow-red-500/20"
                          >
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                          </motion.div>
                          <h4 className="text-lg font-bold mb-2 text-slate-100">Supprimer l'événement ?</h4>
                          <p className="text-slate-400 text-sm mb-6 leading-relaxed">Cette action est <span className="font-semibold text-red-400">irréversible</span> et supprimera toutes les photos associées.</p>
                          <div className="flex gap-3 w-full">
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="flex-1 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl font-semibold text-sm text-slate-300 transition-all duration-200 border border-slate-700/50 shadow-lg"
                            >
                              Annuler
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => handleDeleteEvent(event, e)}
                              disabled={isDeleting}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-red-600/50 disabled:to-rose-600/50 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:shadow-none"
                            >
                              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Event Content */}
                    <div className="flex-1 mb-5">
                      <h3 className={`text-xl font-bold mb-3 transition-colors ${isSelected ? 'text-slate-100' : 'text-slate-200'}`}>
                        {event.name}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {event.description || "Aucune description fournie pour cet événement."}
                      </p>
                      
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono bg-slate-950/80 py-2.5 px-4 rounded-xl border border-slate-800/50 w-fit shadow-inner">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-indigo-400">?event={event.slug}</span>
                      </div>
                    </div>

                    {/* Footer Info & Select Button */}
                    <div className="pt-5 border-t border-slate-800/50 flex flex-col gap-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{new Date(event.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 text-indigo-400 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-xs font-semibold">Sélectionné</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectEvent(event)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 cursor-default shadow-lg shadow-indigo-500/10' 
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
                          }`}
                        >
                          {isSelected ? 'Tableau de bord' : 'Ouvrir'}
                          {!isSelected && <ArrowRight className="w-4 h-4" />}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSettingsClick) {
                              onSettingsClick(event);
                            }
                          }}
                          className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-all duration-200 shadow-lg shadow-black/10"
                          title="Paramètres de l'événement"
                        >
                          <SettingsIcon className="w-5 h-5" />
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
    </div>
  );
};

export default EventSelector;

