import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { updateEvent, deleteEvent, getEventOrganizers, addOrganizer, removeOrganizer } from '../services/eventService';
import { Event, EventOrganizer } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Trash2, Users, UserPlus, X, 
  Loader2, AlertTriangle, Shield, Info,
  CheckCircle2, LayoutDashboard, Globe,
  Type, Tag, Settings, Mail
} from 'lucide-react';

interface EventManagerProps {
  event: Event;
  onBack: () => void;
  onEventUpdated?: (event: Event) => void;
  onEventDeleted?: () => void;
}

const EventManager: React.FC<EventManagerProps> = ({ event, onBack, onEventUpdated, onEventDeleted }) => {
  const { user } = useAuth();
  const { isEventOwner, canEdit, clearEvent, currentEvent } = useEvent();
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
      
      // Si l'événement est actuellement sélectionné, le déconnecter d'abord
      if (currentEvent?.id === event.id) {
        clearEvent();
      }
      
      await deleteEvent(event.id);
      addToast('Événement supprimé avec succès', 'success');
      
      // Revenir à la sélection des événements
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
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden selection:bg-pink-500/30">
      {/* Arrière-plan animé ultra-cohérent */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 relative z-10">
        {/* Header Section - Style cohérent avec Paramètres du Mur */}
        <div className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden mb-8">
          {/* Gradient decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  clearEvent();
                  onBack();
                }}
                className="p-2 bg-white/5 rounded-xl border border-white/10 transition-all text-gray-400 hover:text-white flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-xl border border-pink-500/40 shadow-md flex-shrink-0">
                  <Settings className="w-6 h-6 text-pink-300" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-0.5">
                    {event.name}
                  </h1>
                  <p className="text-xs text-slate-400">
                    Configurer l'événement &amp; accès
                  </p>
                </div>
              </div>
            </div>

            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 rounded-xl transition-all font-semibold text-sm sm:text-base disabled:opacity-50 shadow-xl"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-7 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              {/* Gradient decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <header className="relative flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-2xl border border-pink-600/30 shadow-md shadow-pink-900/20">
                  <Info className="w-7 h-7 text-pink-300" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-0.5 tracking-tight">Informations Générales</h2>
                  <p className="text-sm md:text-base text-slate-300">Configurez les détails de votre événement</p>
                </div>
              </header>

              <div className="relative space-y-7">
                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                  <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <Type className="w-5 h-5 text-pink-400" />
                    Nom de l'événement
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    Nom affiché sur le mur et dans les exports
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                  <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-pink-400" />
                    Slug (URL)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">/</span>
                    <input
                      type="text"
                      value={editedSlug}
                      onChange={(e) => setEditedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      disabled={!canEdit}
                      className="w-full pl-8 pr-4 bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all font-mono disabled:opacity-50"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    Lien direct : party-wall.com/?event={editedSlug}
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                  <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-pink-400" />
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value.substring(0, 100))}
                    disabled={!canEdit}
                    className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-normal placeholder:text-slate-500 focus:border-pink-500/20 focus:ring-2 focus:ring-pink-600/10 outline-none transition-all resize-none h-32 disabled:opacity-50"
                    placeholder="Un petit mot pour vos invités..."
                  />
                  <p className="text-xs text-slate-400 mt-1.5 text-right">{editedDescription.length}/100</p>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                  <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-pink-400" />
                    Statut de l'événement
                  </label>
                  <label className="flex items-center gap-4 group cursor-pointer w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedIsActive}
                        onChange={(e) => setEditedIsActive(e.target.checked)}
                        disabled={!canEdit}
                        className="sr-only"
                      />
                      <div className={`w-14 h-7 rounded-full transition-colors duration-300 ${editedIsActive ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                      <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${editedIsActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`font-semibold text-base ${editedIsActive ? 'text-green-400' : 'text-slate-400'}`}>
                      {editedIsActive ? 'Événement Actif' : 'Événement Archivé'}
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    {editedIsActive ? 'L\'événement est visible et actif' : 'L\'événement est archivé et masqué'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Danger Zone */}
            {isEventOwner && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-red-950/20 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-red-500/20 shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Zone de Danger</h3>
                    <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                      La suppression de l'événement est irréversible. Toutes les photos, paramètres et données des invités seront définitivement effacés.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-8 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      >
                        Supprimer cet événement
                      </motion.button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-black text-red-400 uppercase tracking-widest">Confirmer la suppression ?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            OUI, SUPPRIMER
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-white/10"
                          >
                            ANNULER
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
            )}
            
          </div>

          {/* Sidebar - Organizers */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-7 md:p-10 border border-white/10 shadow-2xl relative h-fit"
            >
              <header className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-2xl border border-purple-600/30 shadow-md shadow-purple-900/20">
                  <Users className="w-7 h-7 text-purple-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-0.5 tracking-tight">Accès</h2>
                  <p className="text-sm md:text-base text-slate-300">Gérez les permissions d'accès à l'événement</p>
                </div>
                {canEdit && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                    className="p-2 bg-white/5 rounded-xl text-purple-400 hover:text-white transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                  </motion.button>
                )}
              </header>

              <AnimatePresence>
                {showAddOrganizer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-purple-400/10 flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-purple-400" />
                          Email Invitée
                        </label>
                        <input
                          type="email"
                          value={newOrganizerEmail}
                          onChange={(e) => setNewOrganizerEmail(e.target.value)}
                          placeholder="admin@exemple.com"
                          className="w-full bg-slate-900/50 border border-purple-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-600/15 transition-all"
                        />
                      </div>
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-purple-400/10 flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          Rôle
                        </label>
                        <select
                          value={newOrganizerRole}
                          onChange={(e) => setNewOrganizerRole(e.target.value as 'organizer' | 'viewer')}
                          className="w-full bg-slate-900/50 border border-purple-400/10 rounded-xl px-4 py-3 text-base text-white font-medium outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-600/15 transition-all appearance-none cursor-pointer"
                        >
                          <option value="organizer">Organisateur</option>
                          <option value="viewer">Observateur</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleAddOrganizer}
                          disabled={addingOrganizer || !newOrganizerEmail.trim()}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => setShowAddOrganizer(false)}
                          className="p-3 bg-slate-900/50 hover:bg-slate-800/50 rounded-xl transition-colors border border-white/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {loadingOrganizers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : organizers.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center font-bold uppercase tracking-widest py-4">Seul vous avez accès</p>
                ) : (
                  organizers.map((org) => {
                    const isOwner = org.role === 'owner';
                    const isCurrentUser = user?.id === org.user_id;
                    const userIdShort = org.user_id.substring(0, 8) + '...';
                    
                    return (
                      <div
                        key={org.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isOwner 
                            ? 'bg-pink-500/5 border-pink-500/20' 
                            : 'bg-slate-950/60 border-slate-700/30 hover:border-purple-500/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOwner ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-gray-800'
                        }`}>
                          <Users className={`w-5 h-5 ${isOwner ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {organizerEmails.get(org.user_id) || userIdShort}
                            {isCurrentUser && <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full uppercase">Moi</span>}
                          </p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isOwner ? 'text-pink-400' : 'text-gray-500'}`}>
                            {isOwner ? 'Propriétaire' : org.role === 'organizer' ? 'Admin' : 'Observateur'}
                          </p>
                        </div>
                        {!isOwner && isEventOwner && (
                          <button
                            onClick={() => handleRemoveOrganizer(org.id, org.user_id)}
                            className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Quick Stats Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-7 md:p-10 border border-white/10 shadow-2xl relative h-fit"
            >
              <header className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500/40 to-blue-500/40 rounded-2xl border border-cyan-600/30 shadow-md shadow-cyan-900/20">
                  <LayoutDashboard className="w-7 h-7 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 mb-0.5 tracking-tight">Statut</h2>
                  <p className="text-sm md:text-base text-slate-300">Informations sur l'événement</p>
                </div>
              </header>
              <div className="space-y-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/30 flex justify-between items-center">
                  <span className="text-base font-semibold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-pink-400" />
                    Visibilité
                  </span>
                  <span className="text-sm font-semibold text-pink-400">Publique</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/30 flex justify-between items-center">
                  <span className="text-base font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Sécurité
                  </span>
                  <span className="text-sm font-semibold text-green-400">IA Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default EventManager;

