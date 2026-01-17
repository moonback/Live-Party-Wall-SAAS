import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, CheckCircle, X, RefreshCw, Image as ImageIcon, Clock, User } from 'lucide-react';
import { PrintRequest, Photo } from '../../types';
import { getPrintRequests, updatePrintRequestStatus, deletePrintRequest } from '../../services/printService';
import { useToast } from '../../context/ToastContext';
import { logger } from '../../utils/logger';

interface PrintRequestsTabProps {
  eventId: string;
  photos: Photo[];
}

export const PrintRequestsTab: React.FC<PrintRequestsTabProps> = ({
  eventId,
  photos
}) => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'printed'>('all');
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Créer un Map pour accéder rapidement aux photos par ID
  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>();
    photos.forEach(photo => map.set(photo.id, photo));
    return map;
  }, [photos]);

  const loadRequests = async () => {
    if (!eventId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allRequests = await getPrintRequests(eventId);
      setRequests(allRequests);
    } catch (error) {
      logger.error('Error loading print requests', error);
      addToast('Erreur lors du chargement des demandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [eventId]);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  }, [requests, filter]);

  const handlePrint = async (request: PrintRequest) => {
    const photo = photosMap.get(request.photo_id);
    if (!photo) {
      addToast('Photo introuvable', 'error');
      return;
    }

    setPrintingId(request.id);
    try {
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addToast('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloquées.', 'error');
        setPrintingId(null);
        return;
      }

      // Charger l'image et créer le HTML pour l'impression
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Impression - ${photo.author}</title>
              <style>
                @media print {
                  @page {
                    margin: 0;
                    size: auto;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                }
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  background: white;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
                .caption {
                  margin-top: 20px;
                  text-align: center;
                  font-family: Arial, sans-serif;
                  color: #333;
                }
                .author {
                  font-weight: bold;
                  font-size: 18px;
                }
                .text {
                  margin-top: 10px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <img src="${photo.url}" alt="${photo.caption || 'Photo'}" />
              ${photo.caption || photo.author ? `
                <div class="caption">
                  ${photo.author ? `<div class="author">${photo.author}</div>` : ''}
                  ${photo.caption ? `<div class="text">${photo.caption}</div>` : ''}
                </div>
              ` : ''}
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Attendre que l'image soit chargée avant d'imprimer
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Marquer la demande comme imprimée
            updatePrintRequestStatus(request.id, 'printed', 'Organisateur')
              .then(() => {
                loadRequests();
                addToast('Impression lancée', 'success');
              })
              .catch((error) => {
                logger.error('Error updating print request status', error);
                addToast('Impression lancée mais erreur lors de la mise à jour', 'error');
              })
              .finally(() => {
                setPrintingId(null);
              });
          }, 500);
        };
      };

      img.onerror = () => {
        addToast('Erreur lors du chargement de l\'image', 'error');
        setPrintingId(null);
        printWindow.close();
      };

      img.src = photo.url;
    } catch (error) {
      logger.error('Error printing photo', error);
      addToast('Erreur lors de l\'impression', 'error');
      setPrintingId(null);
    }
  };

  const handleMarkAsPrinted = async (requestId: string) => {
    try {
      await updatePrintRequestStatus(requestId, 'printed', 'Organisateur');
      await loadRequests();
      addToast('Demande marquée comme imprimée', 'success');
    } catch (error) {
      logger.error('Error marking request as printed', error);
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;

    try {
      await deletePrintRequest(requestId);
      await loadRequests();
      addToast('Demande annulée', 'success');
    } catch (error) {
      logger.error('Error cancelling request', error);
      addToast('Erreur lors de l\'annulation', 'error');
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const printedCount = requests.filter(r => r.status === 'printed').length;

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-1">
            Demandes d'impression
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Gérez les demandes d'impression des invités
          </p>
        </div>
        <motion.button 
          whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors text-sm text-slate-300 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          title="Rafraîchir la liste"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
          <span className="sm:hidden">Rafraîchir</span>
        </motion.button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
            filter === 'all'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-700/50'
          }`}
        >
          Toutes ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
            filter === 'pending'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-700/50'
          }`}
        >
          En attente ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('printed')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
            filter === 'printed'
              ? 'bg-green-500/20 text-green-300 border border-green-500/40'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-700/50'
          }`}
        >
          Imprimées ({printedCount})
        </button>
      </div>

      {/* Liste des demandes */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          </motion.div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50"
          >
            <Printer className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base sm:text-lg font-medium mb-2">
              {filter === 'all' ? 'Aucune demande d\'impression' : `Aucune demande ${filter === 'pending' ? 'en attente' : 'imprimée'}`}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 text-center px-4">
              Les demandes d'impression des invités apparaîtront ici
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="requests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredRequests.map((request, index) => {
              const photo = photosMap.get(request.photo_id);
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/50 transition-all"
                >
                  <div className="flex gap-4">
                    {/* Miniature de la photo */}
                    {photo ? (
                      <div className="flex-shrink-0">
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Photo'}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      </div>
                    )}

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {request.requested_by}
                            </span>
                          </div>
                          {photo && (
                            <p className="text-xs text-slate-400 truncate">
                              {photo.caption || 'Sans légende'}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">
                              {new Date(request.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-green-500/20 text-green-300 border border-green-500/40'
                        }`}>
                          {request.status === 'pending' ? 'En attente' : 'Imprimée'}
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <motion.button
                            whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                            onClick={() => handlePrint(request)}
                            disabled={printingId === request.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                          >
                            <Printer className="w-4 h-4" />
                            {printingId === request.id ? 'Impression...' : 'Imprimer'}
                          </motion.button>
                          <motion.button
                            whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                            onClick={() => handleMarkAsPrinted(request.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors border border-green-500/40 min-h-[36px]"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marquer comme imprimée
                          </motion.button>
                          <motion.button
                            whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                            onClick={() => handleCancel(request.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/40 min-h-[36px]"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

