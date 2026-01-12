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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Arrière-plan amélioré avec effets de profondeur */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-500/4 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/4 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-5 relative z-10">
        {/* Header Section - Design compact et moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-slate-800/50 mb-5 shadow-xl shadow-black/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 3 }}
                className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/25"
              >
                <Settings className="w-5 h-5 text-indigo-400" />
              </motion.div>
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 flex items-center gap-2.5 flex-wrap">
                  <span className="truncate max-w-[240px] sm:max-w-[360px] lg:max-w-none bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                    {event.name}
                  </span>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white border border-indigo-400/30"
                  >
                    {event.slug}
                  </motion.span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                    Configuration de l'événement
                  </span>
                  {event.is_active ? (
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-green-600/20 text-green-400 text-xs font-semibold border border-green-500/25"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Actif
                    </motion.span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800/50 text-slate-400 text-xs border border-slate-700/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                      Inactif
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02, x: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  clearEvent();
                  onBack();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 text-slate-200 hover:text-white font-medium text-sm"
                aria-label="Retour aux événements"
              >
                <span className="flex items-center justify-center w-4 h-4 bg-red-500/20 rounded-full">
                  <X className="w-3 h-3 text-red-400" />
                </span>
                <span className="hidden sm:inline">Retour</span>
                <span className="inline sm:hidden">×</span>
              </motion.button>

              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg font-semibold text-sm text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 transition-all duration-200 disabled:shadow-none"
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 backdrop-blur-xl rounded-xl p-5 sm:p-6 border border-slate-800/50 shadow-xl shadow-black/20"
            >
              <header className="mb-5 pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-0.5 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-100">Informations générales</h2>
                </div>
                <p className="text-xs text-slate-500 ml-3">Configurez les détails de votre événement</p>
              </header>

              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <span>Nom de l'événement</span>
                    <span className="text-xs font-normal text-slate-500">(requis)</span>
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-950/80 border border-slate-800/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    Nom affiché sur le mur et dans les exports
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <span>Slug (URL)</span>
                    <span className="text-xs font-normal text-slate-500">(unique)</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs group-focus-within:text-indigo-400 transition-colors">/</span>
                    <input
                      type="text"
                      value={editedSlug}
                      onChange={(e) => setEditedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      disabled={!canEdit}
                      className="w-full pl-7 bg-slate-950/80 border border-slate-800/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span className="font-mono text-indigo-400 text-xs">?event={editedSlug}</span>
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value.substring(0, 100))}
                    disabled={!canEdit}
                    rows={3}
                    className="w-full bg-slate-950/80 border border-slate-800/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-950 outline-none transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Un petit mot pour vos invités..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Optionnel
                    </p>
                    <span className={`text-xs font-medium ${editedDescription.length >= 90 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {editedDescription.length}/100
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Danger Zone */}
            {isEventOwner && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bg-gradient-to-br from-red-950/15 via-slate-900/60 to-slate-900/60 backdrop-blur-xl rounded-xl p-5 sm:p-6 border border-red-500/25 shadow-xl shadow-red-500/10"
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 flex-shrink-0"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-0.5 h-4 bg-gradient-to-b from-red-500 to-rose-500 rounded-full"></div>
                      <h3 className="text-base font-bold text-red-400">Zone de danger</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      La suppression de l'événement est <span className="font-semibold text-red-400">irréversible</span>. Toutes les photos, paramètres et données des invités seront définitivement effacés.
                    </p>
                    
                    <AnimatePresence mode="wait">
                      {!showDeleteConfirm ? (
                        <motion.button
                          key="delete-button"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ scale: 1.01, x: 1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 rounded-lg font-semibold text-sm transition-all duration-200"
                        >
                          Supprimer cet événement
                        </motion.button>
                      ) : (
                        <motion.div 
                          key="confirm-buttons"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3"
                        >
                          <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Confirmer la suppression ?
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={handleDelete}
                              disabled={deleting}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-red-600/50 disabled:to-rose-600/50 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 disabled:shadow-none"
                            >
                              {deleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg font-semibold text-sm transition-all duration-200 border border-slate-700/50"
                            >
                              Annuler
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
            
          </div>

          {/* Sidebar - Organizers */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 backdrop-blur-xl rounded-xl p-5 sm:p-6 border border-slate-800/50 h-fit shadow-xl shadow-black/20"
            >
              <header className="mb-4 pb-4 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-0.5 h-5 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-100">Accès</h2>
                  </div>
                  <p className="text-xs text-slate-500 ml-3">Gérez les permissions d'accès</p>
                </div>
                {canEdit && (
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                    className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-all duration-200"
                    title="Ajouter un organisateur"
                  >
                    <UserPlus className="w-4 h-4" />
                  </motion.button>
                )}
              </header>

              <AnimatePresence>
                {showAddOrganizer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="mb-4 bg-gradient-to-br from-slate-950/80 to-slate-900/80 rounded-lg p-4 border border-indigo-500/25 overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-300">
                          Email de l'invité
                        </label>
                        <input
                          type="email"
                          value={newOrganizerEmail}
                          onChange={(e) => setNewOrganizerEmail(e.target.value)}
                          placeholder="admin@exemple.com"
                          className="w-full bg-slate-950/80 border border-slate-800/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-300">
                          Rôle
                        </label>
                        <select
                          value={newOrganizerRole}
                          onChange={(e) => setNewOrganizerRole(e.target.value as 'organizer' | 'viewer')}
                          className="w-full bg-slate-950/80 border border-slate-800/50 rounded-lg px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="organizer">Organisateur</option>
                          <option value="viewer">Observateur</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleAddOrganizer}
                          disabled={!newOrganizerEmail.trim()}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 disabled:shadow-none"
                        >
                          Ajouter
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, rotate: 90 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddOrganizer(false)}
                          className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-all duration-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
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
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-slate-800/50 border border-slate-700/40 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500">Seul vous avez accès</p>
                  </div>
                ) : (
                  organizers.map((org, index) => {
                    const isOwner = org.role === 'owner';
                    const isCurrentUser = user?.id === org.user_id;
                    const userIdShort = org.user_id.substring(0, 8) + '...';
                    
                    return (
                      <motion.div
                        key={org.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.01, x: 2 }}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-200 ${
                          isOwner 
                            ? 'bg-indigo-500/10 border-indigo-500/25' 
                            : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700/50 hover:bg-slate-950/80'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isOwner 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                            : 'bg-slate-800/60'
                        }`}>
                          <Users className={`w-4 h-4 ${isOwner ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
                            <span>{organizerEmails.get(org.user_id) || userIdShort}</span>
                            {isCurrentUser && (
                              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md border border-indigo-500/25 font-medium">
                                Moi
                              </span>
                            )}
                          </p>
                          <p className={`text-xs font-medium mt-0.5 ${
                            isOwner 
                              ? 'text-indigo-400' 
                              : org.role === 'organizer' 
                                ? 'text-teal-400' 
                                : 'text-slate-500'
                          }`}>
                            {isOwner ? 'Propriétaire' : org.role === 'organizer' ? 'Organisateur' : 'Observateur'}
                          </p>
                        </div>
                        {!isOwner && isEventOwner && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveOrganizer(org.id, org.user_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title="Retirer l'organisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Quick Stats Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/70 backdrop-blur-xl rounded-xl p-5 sm:p-6 border border-slate-800/50 h-fit shadow-xl shadow-black/20"
            >
              <header className="mb-4 pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-0.5 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-100">Statut</h2>
                </div>
                <p className="text-xs text-slate-500 ml-3">Informations sur l'événement</p>
              </header>
              <div className="space-y-2">
                <motion.div 
                  whileHover={{ scale: 1.01, x: 1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Visibilité</span>
                  </div>
                  <span className="text-xs font-bold text-slate-100 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/40">
                    Publique
                  </span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.01, x: 1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/50 hover:border-teal-500/25 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-500/15 border border-teal-500/25">
                      <Shield className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Sécurité</span>
                  </div>
                  <span className="text-xs font-bold text-teal-400 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/25">
                    IA active
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManager;

