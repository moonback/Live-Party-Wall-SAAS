import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, Filter, 
  Calendar, Key, User, CheckCircle, XCircle, Clock,
  AlertTriangle, Copy, Save, X, Loader2, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  getAllLicenses, 
  createLicense, 
  updateLicense, 
  deleteLicense,
  getLicenseById,
  getUsersList
} from '../services/licenseService';
import { License, LicenseStatus } from '../types';
import { logger } from '../utils/logger';

interface LicenseManagerProps {
  onBack: () => void;
}

const LicenseManager: React.FC<LicenseManagerProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; email?: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    user_id: '',
    license_key: '',
    expires_at: '',
    status: 'active' as LicenseStatus,
    notes: ''
  });

  // Charger les licences
  useEffect(() => {
    loadLicenses();
  }, []);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const usersList = await getUsersList();
        setUsers(usersList);
      } catch (error) {
        logger.error("Error loading users", error, { component: 'LicenseManager', action: 'loadUsers' });
        addToast('Erreur lors du chargement des utilisateurs', 'error');
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, [addToast]);

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await getAllLicenses();
      setLicenses(data);
    } catch (error) {
      logger.error("Error loading licenses", error, { component: 'LicenseManager', action: 'loadLicenses' });
      addToast('Erreur lors du chargement des licences', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les licences
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = 
      license.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (license.notes && license.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Ouvrir le modal de création
  const handleCreate = () => {
    setFormData({
      user_id: '',
      license_key: '',
      expires_at: '',
      status: 'active',
      notes: ''
    });
    setUserSearchQuery('');
    setShowUserDropdown(false);
    setShowCreateModal(true);
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.id.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  // Sélectionner un utilisateur
  const handleSelectUser = (userId: string) => {
    setFormData({ ...formData, user_id: userId });
    setUserSearchQuery('');
    setShowUserDropdown(false);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setFormData({
      user_id: license.user_id,
      license_key: license.license_key,
      expires_at: license.expires_at.split('T')[0], // Format date pour input
      status: license.status,
      notes: license.notes || ''
    });
    setShowEditModal(true);
  };

  // Créer une licence
  const handleSubmitCreate = async () => {
    if (!formData.user_id || !formData.expires_at) {
      addToast('Veuillez remplir tous les champs requis', 'error');
      return;
    }

    try {
      const expiresAt = new Date(formData.expires_at);
      expiresAt.setHours(23, 59, 59, 999); // Fin de journée
      
      await createLicense(
        formData.user_id,
        expiresAt.toISOString(),
        formData.license_key || undefined,
        formData.notes || undefined
      );
      
      addToast('Licence créée avec succès', 'success');
      setShowCreateModal(false);
      loadLicenses();
    } catch (error: any) {
      logger.error("Error creating license", error, { component: 'LicenseManager', action: 'handleSubmitCreate' });
      addToast(error.message || 'Erreur lors de la création de la licence', 'error');
    }
  };

  // Mettre à jour une licence
  const handleSubmitEdit = async () => {
    if (!selectedLicense) return;

    if (!formData.expires_at) {
      addToast('La date d\'expiration est requise', 'error');
      return;
    }

    try {
      const expiresAt = new Date(formData.expires_at);
      expiresAt.setHours(23, 59, 59, 999);
      
      await updateLicense(selectedLicense.id, {
        status: formData.status,
        expires_at: expiresAt.toISOString(),
        notes: formData.notes || null
      });
      
      addToast('Licence mise à jour avec succès', 'success');
      setShowEditModal(false);
      setSelectedLicense(null);
      loadLicenses();
    } catch (error: any) {
      logger.error("Error updating license", error, { component: 'LicenseManager', action: 'handleSubmitEdit' });
      addToast(error.message || 'Erreur lors de la mise à jour de la licence', 'error');
    }
  };

  // Supprimer une licence
  const handleDelete = async (licenseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette licence ?')) {
      return;
    }

    try {
      setDeletingId(licenseId);
      await deleteLicense(licenseId);
      addToast('Licence supprimée avec succès', 'success');
      loadLicenses();
    } catch (error: any) {
      logger.error("Error deleting license", error, { component: 'LicenseManager', action: 'handleDelete' });
      addToast(error.message || 'Erreur lors de la suppression de la licence', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Copier la clé de licence
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addToast('Clé de licence copiée', 'success');
  };

  // Calculer les jours restants
  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Obtenir le badge de statut
  const getStatusBadge = (license: License) => {
    const daysRemaining = getDaysRemaining(license.expires_at);
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

    if (license.status === 'active' && isExpired) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          Expirée
        </span>
      );
    }

    if (license.status === 'active' && isExpiringSoon) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
        </span>
      );
    }

    const statusConfig = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Active' },
      expired: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Expirée' },
      suspended: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Suspendue' },
      cancelled: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Annulée' }
    };

    const config = statusConfig[license.status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    );
  };

  // Statistiques
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active' && getDaysRemaining(l.expires_at) >= 0).length,
    expired: licenses.filter(l => l.status === 'expired' || getDaysRemaining(l.expires_at) < 0).length,
    suspended: licenses.filter(l => l.status === 'suspended').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Arrière-plan */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-800/50 mb-6 shadow-2xl shadow-black/20"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-xl border border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 hover:from-slate-700/80 hover:to-slate-800/80 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-indigo-400" />
                  Gestion des Licences
                </h1>
                <p className="text-sm text-slate-400 mt-1">Gérez toutes les licences de l'application</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-sm text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvelle licence</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'indigo' },
            { label: 'Actives', value: stats.active, color: 'green' },
            { label: 'Expirées', value: stats.expired, color: 'red' },
            { label: 'Suspendues', value: stats.suspended, color: 'amber' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br from-slate-900/70 to-slate-900/50 backdrop-blur-xl rounded-xl p-4 border border-slate-800/50 shadow-lg`}
            >
              <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/50 backdrop-blur-xl rounded-xl p-4 border border-slate-800/50 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par clé, utilisateur ou notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LicenseStatus | 'all')}
                className="px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="expired">Expirées</option>
                <option value="suspended">Suspendues</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des licences */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/50 backdrop-blur-xl rounded-xl p-12 border border-slate-800/50 text-center">
            <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Aucune licence trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLicenses.map((license, index) => (
              <motion.div
                key={license.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-slate-900/70 to-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-800/50 shadow-lg hover:border-indigo-500/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-400" />
                        <code className="text-sm font-mono text-slate-300 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/50">
                          {license.license_key}
                        </code>
                        <button
                          onClick={() => handleCopyKey(license.license_key)}
                          className="p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                          title="Copier la clé"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      {getStatusBadge(license)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Utilisateur:</span>
                        <span className="text-slate-200 font-mono text-xs">{license.user_id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Expire le:</span>
                        <span className="text-slate-200">
                          {new Date(license.expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Créée le:</span>
                        <span className="text-slate-200">
                          {new Date(license.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {license.notes && (
                      <p className="text-sm text-slate-400 italic">"{license.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(license)}
                      className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/50 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 text-slate-300" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(license.id)}
                      disabled={deletingId === license.id}
                      className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === license.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-slate-300" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      <AnimatePresence>
        {showCreateModal && (
          <LicenseModal
            title="Créer une nouvelle licence"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitCreate}
            onClose={() => {
              setShowCreateModal(false);
              setUserSearchQuery('');
              setShowUserDropdown(false);
            }}
            isEdit={false}
            users={users}
            usersLoading={usersLoading}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            showUserDropdown={showUserDropdown}
            setShowUserDropdown={setShowUserDropdown}
            onSelectUser={handleSelectUser}
            filteredUsers={filteredUsers}
          />
        )}
      </AnimatePresence>

      {/* Modal d'édition */}
      <AnimatePresence>
        {showEditModal && selectedLicense && (
          <LicenseModal
            title="Modifier la licence"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitEdit}
            onClose={() => {
              setShowEditModal(false);
              setSelectedLicense(null);
            }}
            isEdit={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Composant modal réutilisable
interface LicenseModalProps {
  title: string;
  formData: {
    user_id: string;
    license_key: string;
    expires_at: string;
    status: LicenseStatus;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    user_id: string;
    license_key: string;
    expires_at: string;
    status: LicenseStatus;
    notes: string;
  }>>;
  onSubmit: () => void;
  onClose: () => void;
  isEdit: boolean;
  users?: Array<{ id: string; email?: string }>;
  usersLoading?: boolean;
  userSearchQuery?: string;
  setUserSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  showUserDropdown?: boolean;
  setShowUserDropdown?: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectUser?: (userId: string) => void;
  filteredUsers?: Array<{ id: string; email?: string }>;
}

const LicenseModal: React.FC<LicenseModalProps> = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isEdit,
  users = [],
  usersLoading = false,
  userSearchQuery = '',
  setUserSearchQuery,
  showUserDropdown = false,
  setShowUserDropdown,
  onSelectUser,
  filteredUsers = []
}) => {
  // Fermer le dropdown en cliquant en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-dropdown]')) {
        if (setShowUserDropdown) {
          setShowUserDropdown(false);
        }
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown, setShowUserDropdown]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900/95 to-slate-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-800/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {!isEdit && (
            <div className="relative" data-user-dropdown>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                ID Utilisateur <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userSearchQuery || formData.user_id}
                  onChange={(e) => {
                    if (setUserSearchQuery) {
                      setUserSearchQuery(e.target.value);
                    }
                    if (setShowUserDropdown) {
                      setShowUserDropdown(true);
                    }
                    if (!e.target.value) {
                      setFormData({ ...formData, user_id: '' });
                    }
                  }}
                  onFocus={() => {
                    if (setShowUserDropdown) {
                      setShowUserDropdown(true);
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                  placeholder="Rechercher un utilisateur par ID ou email..."
                />
                {formData.user_id && (
                  <button
                    onClick={() => {
                      setFormData({ ...formData, user_id: '' });
                      if (setUserSearchQuery) {
                        setUserSearchQuery('');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              
              {/* Dropdown des utilisateurs */}
              <AnimatePresence>
                {showUserDropdown && !isEdit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
                  >
                    {usersLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mx-auto" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">
                        {userSearchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                      </div>
                    ) : (
                      <div className="py-2">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              if (onSelectUser) {
                                onSelectUser(user.id);
                              }
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-800/50 transition-colors flex items-center gap-3"
                          >
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono text-slate-200 truncate">{user.id}</p>
                              {user.email && (
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                              )}
                            </div>
                            {formData.user_id === user.id && (
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {formData.user_id && (
                <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Utilisateur sélectionné:</p>
                  <p className="text-sm font-mono text-indigo-300">{formData.user_id}</p>
                </div>
              )}
            </div>
          )}
          
          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                ID Utilisateur <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.user_id}
                disabled={true}
                className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 opacity-50 cursor-not-allowed"
                placeholder="UUID de l'utilisateur"
              />
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Clé de licence (optionnel)
              </label>
              <input
                type="text"
                value={formData.license_key}
                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                placeholder="Laissé vide pour génération automatique"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Date d'expiration <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LicenseStatus })}
              className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
            >
              <option value="active">Active</option>
              <option value="expired">Expirée</option>
              <option value="suspended">Suspendue</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/50 rounded-xl text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all resize-none"
              placeholder="Notes sur cette licence..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-sm text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'Enregistrer' : 'Créer'}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl font-semibold text-sm transition-all duration-200 border border-slate-700/50"
          >
            Annuler
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LicenseManager;

