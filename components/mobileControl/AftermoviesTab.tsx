import React, { useState, useEffect } from 'react';
import { Video, Trash2, Download, Calendar, Clock, HardDrive, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { Aftermovie } from '../../types';
import { getAftermovies, deleteAftermovie } from '../../services/aftermovieShareService';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AftermoviesTabProps {
  onRefresh?: () => void;
}

const AftermoviesTab: React.FC<AftermoviesTabProps> = ({ onRefresh }) => {
  const { currentEvent } = useEvent();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const [aftermovies, setAftermovies] = useState<Aftermovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const loadAftermovies = async () => {
    if (!currentEvent?.id) {
      setAftermovies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allAftermovies = await getAftermovies(currentEvent.id);
      setAftermovies(allAftermovies);
    } catch (error) {
      console.error('Error loading aftermovies:', error);
      addToast('Erreur lors du chargement des aftermovies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAftermovies();
  }, [currentEvent?.id]);

  const handleDelete = async (aftermovie: Aftermovie) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'aftermovie "${aftermovie.title || aftermovie.filename}" ?\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingIds(prev => new Set(prev).add(aftermovie.id));

    try {
      await deleteAftermovie(aftermovie.id);
      addToast('Aftermovie supprimé avec succès', 'success');
      await loadAftermovies();
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Erreur lors de la suppression: ${msg}`, 'error');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(aftermovie.id);
        return next;
      });
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Afficher un message informatif si les aftermovies sont désactivés dans les paramètres
  // mais permettre quand même de voir les aftermovies existants
  const aftermoviesDisabled = settings.aftermovies_enabled === false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (aftermovies.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">Aucun aftermovie pour le moment</p>
        <button
          onClick={loadAftermovies}
          className="mt-4 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 rounded-xl text-sm transition-all border border-white/20 shadow-sm touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message informatif si les aftermovies sont désactivés */}
      {aftermoviesDisabled && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-200 font-medium">Aftermovies désactivés</p>
            <p className="text-xs text-yellow-300/80 mt-1">
              Les aftermovies sont désactivés dans les paramètres, mais vous pouvez toujours voir et gérer les aftermovies existants.
            </p>
          </div>
        </div>
      )}

      {/* Header avec bouton refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Aftermovies</h2>
          <p className="text-sm text-white/60">{aftermovies.length} aftermovie{aftermovies.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={loadAftermovies}
          disabled={loading}
          className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 rounded-xl transition-all disabled:opacity-50 border border-white/20 shadow-sm touch-manipulation"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Liste des aftermovies */}
      <div className="space-y-3">
        <AnimatePresence>
          {aftermovies.map((aftermovie) => (
            <motion.div
              key={aftermovie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Titre */}
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <h3 className="font-bold text-white truncate">
                      {aftermovie.title || 'Aftermovie'}
                    </h3>
                  </div>

                  {/* Métadonnées */}
                  <div className="space-y-1.5 text-sm">
                    {aftermovie.file_size && (
                      <div className="flex items-center gap-2 text-white/70">
                        <HardDrive className="w-4 h-4 text-indigo-400" />
                        <span>{formatFileSize(aftermovie.file_size)}</span>
                      </div>
                    )}

                    {aftermovie.duration_seconds && (
                      <div className="flex items-center gap-2 text-white/70">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>{formatDuration(aftermovie.duration_seconds)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span>{formatDate(aftermovie.created_at)}</span>
                    </div>

                    {aftermovie.download_count !== undefined && aftermovie.download_count > 0 && (
                      <div className="flex items-center gap-2 text-white/70">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span>
                          {aftermovie.download_count} téléchargement{aftermovie.download_count > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <a
                    href={aftermovie.url}
                    download={aftermovie.filename}
                    className="p-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 active:bg-indigo-500/40 active:scale-95 rounded-xl transition-all border border-indigo-500/30 shadow-sm touch-manipulation"
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5 text-indigo-400" />
                  </a>
                  <button
                    onClick={() => handleDelete(aftermovie)}
                    disabled={deletingIds.has(aftermovie.id)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 active:scale-95 rounded-xl transition-all disabled:opacity-50 border border-red-500/30 shadow-sm touch-manipulation"
                    title="Supprimer"
                  >
                    {deletingIds.has(aftermovie.id) ? (
                      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AftermoviesTab;

