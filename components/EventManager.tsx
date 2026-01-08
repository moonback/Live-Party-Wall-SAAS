import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { updateEvent, deleteEvent, getEventOrganizers, removeOrganizer } from '../services/eventService';
import { Event, EventOrganizer } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Trash2, Users, UserPlus, X, 
  Loader2, AlertTriangle, Shield, Globe,
  Settings,
  Home
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      {/* Arrière-plan sobre */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/3 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/3 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Section - Design sobre */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <Settings className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2">
                    <span className="truncate max-w-[320px] sm:max-w-[420px]">{event.name}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/80 text-white/90">
                      Event ID: {event.slug}
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    <span>Configuration de l’événement</span>
                    {event.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs">
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                        Inactif
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.07, boxShadow: '0 2px 20px #ef444433' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  clearEvent();
                  onBack();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-gradient-to-r from-slate-900/70 to-slate-900/30 hover:from-slate-800/60 hover:to-slate-800/20 transition-all duration-200 text-slate-200 hover:text-white font-semibold shadow-sm hover:shadow-[0_2px_16px_rgba(239,68,68,0.13)] focus:outline-none focus:ring-2 focus:ring-red-400/40 active:scale-95"
                aria-label="Retour aux événements"
              >
                <span className="flex items-center justify-center w-6 h-6 bg-red-500/10 rounded-full mr-1">
                  <X className="w-4 h-4 text-red-400" />
                </span>
                <span className="hidden sm:inline">Retour aux événements</span>
                <span className="inline sm:hidden">Mes Événements</span>
              </motion.button>
            </div>

            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-sm text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800"
            >
              <header className="mb-6 pb-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100 mb-1">Informations générales</h2>
                <p className="text-sm text-slate-400">Configurez les détails de votre événement</p>
              </header>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Nom de l'événement
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500">
                    Nom affiché sur le mur et dans les exports
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Slug (URL)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">/</span>
                    <input
                      type="text"
                      value={editedSlug}
                      onChange={(e) => setEditedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      disabled={!canEdit}
                      className="w-full pl-8 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Lien direct : party-wall.com/?event={editedSlug}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value.substring(0, 100))}
                    disabled={!canEdit}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Un petit mot pour vos invités..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Description courte pour vos invités
                    </p>
                    <p className="text-xs text-slate-500">{editedDescription.length}/100</p>
                  </div>
                </div>

                
              </div>
            </motion.div>

            {/* Danger Zone */}
            {isEventOwner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-red-400 mb-1">Zone de danger</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      La suppression de l'événement est irréversible. Toutes les photos, paramètres et données des invités seront définitivement effacés.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-lg font-medium text-sm transition-colors"
                      >
                        Supprimer cet événement
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-red-400">Confirmer la suppression ?</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Supprimer
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors border border-slate-700"
                          >
                            Annuler
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
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800 h-fit"
            >
              <header className="mb-6 pb-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100 mb-1">Accès</h2>
                  <p className="text-sm text-slate-400">Gérez les permissions d'accès</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Ajouter un organisateur"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </header>

              <AnimatePresence>
                {showAddOrganizer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 bg-slate-950/50 rounded-lg p-4 border border-slate-800 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Email de l'invité
                        </label>
                        <input
                          type="email"
                          value={newOrganizerEmail}
                          onChange={(e) => setNewOrganizerEmail(e.target.value)}
                          placeholder="admin@exemple.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Rôle
                        </label>
                        <select
                          value={newOrganizerRole}
                          onChange={(e) => setNewOrganizerRole(e.target.value as 'organizer' | 'viewer')}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                        >
                          <option value="organizer">Organisateur</option>
                          <option value="viewer">Observateur</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleAddOrganizer}
                          disabled={!newOrganizerEmail.trim()}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => setShowAddOrganizer(false)}
                          className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {loadingOrganizers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : organizers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Seul vous avez accès</p>
                ) : (
                  organizers.map((org) => {
                    const isOwner = org.role === 'owner';
                    const isCurrentUser = user?.id === org.user_id;
                    const userIdShort = org.user_id.substring(0, 8) + '...';
                    
                    return (
                      <div
                        key={org.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isOwner 
                            ? 'bg-indigo-500/5 border-indigo-500/20' 
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOwner ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}>
                          <Users className={`w-4 h-4 ${isOwner ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {organizerEmails.get(org.user_id) || userIdShort}
                            {isCurrentUser && <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Moi</span>}
                          </p>
                          <p className={`text-xs ${isOwner ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {isOwner ? 'Propriétaire' : org.role === 'organizer' ? 'Organisateur' : 'Observateur'}
                          </p>
                        </div>
                        {!isOwner && isEventOwner && (
                          <button
                            onClick={() => handleRemoveOrganizer(org.id, org.user_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Retirer l'organisateur"
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
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800 h-fit"
            >
              <header className="mb-6 pb-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-100 mb-1">Statut</h2>
                <p className="text-sm text-slate-400">Informations sur l'événement</p>
              </header>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Visibilité</span>
                  </div>
                  <span className="text-sm font-medium text-slate-100">Publique</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-medium text-slate-300">Sécurité</span>
                  </div>
                  <span className="text-sm font-medium text-teal-400">IA active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManager;

