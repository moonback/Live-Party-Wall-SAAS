import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trash2, Download, Image as ImageIcon, RefreshCw, Power, ExternalLink, Globe, X, Crown, User } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminProfile from '../AdminProfile';
import { Photo } from '../../types';
import { isElectron } from '../../utils/electronPaths';
import { useEvent } from '../../context/EventContext';
import { getBaseUrl } from '../../utils/urlUtils';
import { logger } from '../../utils/logger';
import { SidebarHamburgerButton } from './AdminTabsNavigation';
import { useLicenseFeatures } from '../../hooks/useLicenseFeatures';

interface AdminDashboardHeaderProps {
  onBack: () => void;
  onLogout: () => void;
  onDeleteAll: () => void;
  onExport: () => void;
  onExportWithMetadata: () => void;
  photos: Photo[];
  isExporting: boolean;
  isExportingWithMetadata: boolean;
  exportProgress: { processed: number; total: number; message?: string } | null;
  currentEventName?: string;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

type ConfirmAction = 'delete' | 'export' | 'exportPng' | null;

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  onBack, onLogout, onDeleteAll, onExport, onExportWithMetadata,
  photos, isExporting, isExportingWithMetadata, exportProgress, currentEventName,
  isMobileMenuOpen = false, onMobileMenuToggle
}) => {
  const { currentEvent } = useEvent();
  const { isProLicense, isPartLicense } = useLicenseFeatures();
  const [showEventLink, setShowEventLink] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleCloseApp = async () => {
    if (isElectron() && window.electronAPI) {
      try {
        await window.electronAPI.closeApp();
      } catch (error) {
        logger.error('Erreur lors de la fermeture de l\'application', error, { component: 'AdminDashboardHeader', action: 'closeApp' });
      }
    }
  };

  const getEventUrl = (): string => {
    if (!currentEvent?.slug) return '';
    return `${getBaseUrl()}?event=${currentEvent.slug}`;
  };

  const handleOpenEventLink = async () => {
    const url = getEventUrl();
    if (!url) return;
    
    // Dans Electron, utiliser l'API pour ouvrir avec la même session
    if (isElectron() && window.electronAPI) {
      try {
        await window.electronAPI.openWindow(url);
      } catch (error) {
        logger.error('Erreur lors de l\'ouverture de la fenêtre', error, { component: 'AdminDashboardHeader', action: 'openEventLink' });
        // Fallback vers window.open si l'API échoue
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // En web, utiliser window.open normalement
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'delete') {
      onDeleteAll();
      setConfirmAction(null);
    } else if (confirmAction === 'export') {
      onExport();
      setConfirmAction(null);
    } else if (confirmAction === 'exportPng') {
      onExportWithMetadata();
      setConfirmAction(null);
    }
  };

  const confirmConfig = {
    delete: { 
      title: 'Vider toutes les photos', 
      message: `Êtes-vous sûr de vouloir supprimer toutes les ${photos.length} photos ? Cette action est irréversible.`,
      icon: Trash2,
      color: 'red'
    },
    export: { 
      title: 'Exporter en ZIP', 
      message: `Télécharger toutes les ${photos.length} photos dans un fichier ZIP ?`,
      icon: Download,
      color: 'indigo'
    },
    exportPng: { 
      title: 'Exporter en PNG', 
      message: `Exporter toutes les ${photos.length} photos avec métadonnées en PNG ? Cette opération peut prendre du temps.`,
      icon: ImageIcon,
      color: 'teal'
    }
  };

  const btnBase = "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all min-h-[40px] sm:min-h-[44px]";
  const btnVariants = {
    teal: "bg-teal-600/20 hover:bg-teal-600/30 border-teal-500/30 hover:border-teal-500/50 text-teal-300 hover:text-teal-200",
    blue: "bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 hover:border-blue-500/50 text-blue-300 hover:text-blue-200",
    red: "bg-red-600/20 hover:bg-red-600/30 border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200",
    redLight: "bg-red-600/10 hover:bg-red-600/20 border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300",
    indigo: "bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200",
    disabled: "bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-wait"
  };

  return (
    <header className="mb-4">
      <div className="relative overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-xl shadow-xl">
        {!prefersReducedMotion && (
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"></div>
          </div>
        )}

        <div className="relative px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 flex-wrap">
            {/* Branding Compact avec bouton hamburger */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 w-full sm:w-auto">
              {/* Bouton hamburger mobile */}
              {onMobileMenuToggle && (
                <SidebarHamburgerButton 
                  isMobileMenuOpen={isMobileMenuOpen}
                  onMobileMenuToggle={onMobileMenuToggle}
                />
              )}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                <div className="relative p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-sm">
                  <img
                    src="/icon.png"
                    alt="Logo Partywall"
                    className="w-5 h-5 sm:w-8 sm:h-8 object-contain"
                    draggable={false}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100">
                  
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mx-1">Party</span>
                  <span>Wall</span>
                </h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-xs text-slate-400">
                    <span className="hidden sm:inline">En </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-[10px] sm:text-xs">live</span>
                  </span>
                  {currentEventName && (
                    <>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        <div className="w-1 h-1 bg-teal-400 rounded-full"></div>
                        <span className="text-[10px] sm:text-xs font-semibold text-indigo-200 truncate max-w-[100px] sm:max-w-[160px]" title={currentEventName}>
                          {currentEventName}
                        </span>
                      </div>
                    </>
                  )}
                  {/* Badge de licence */}
                  {(isProLicense || isPartLicense) && (
                    <>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-semibold ${
                        isProLicense 
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300' 
                          : 'bg-slate-700/30 border-slate-600/40 text-slate-400'
                      }`}>
                        {isProLicense ? (
                          <>
                            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">PRO</span>
                            <span className="sm:hidden">PRO</span>
                          </>
                        ) : (
                          <>
                            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">PART</span>
                            <span className="sm:hidden">PART</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Profil visible sur mobile uniquement */}
              <div className="ml-auto sm:hidden"><AdminProfile onLogout={onLogout} /></div>
            </div>

            {/* Tous les boutons sur une seule ligne */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
              {/* Actions Electron */}
              {isElectron() && currentEvent?.slug && (
                <>
                  <button onClick={handleOpenEventLink} className={`${btnBase} ${btnVariants.teal}`} aria-label="Ouvrir">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">Ouvrir</span>
                  </button>
                  <button onClick={() => setShowEventLink(!showEventLink)} className={`${btnBase} ${btnVariants.blue}`} aria-label="QR Code">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">QR</span>
                  </button>
                  <button onClick={handleCloseApp} className={`${btnBase} ${btnVariants.red}`} aria-label="Fermer">
                    <Power className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">Fermer</span>
                  </button>
                </>
              )}

              {/* Bouton Retour Web */}
              {!isElectron() && currentEventName && (
                <button onClick={onBack} className={`${btnBase} ${btnVariants.teal}`} aria-label="Retour">
                  <Home className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium hidden sm:inline">App</span>
                </button>
              )}

              {/* Actions Export/Delete */}
              {photos.length > 0 && (
                <>
                  <button onClick={() => setConfirmAction('delete')} className={`${btnBase} ${btnVariants.redLight}`} title="Vider">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">Vider</span>
                  </button>
                  <button onClick={() => setConfirmAction('export')} disabled={isExporting} className={`${btnBase} ${isExporting ? btnVariants.disabled : btnVariants.indigo}`} title="ZIP">
                    {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span className="text-xs font-medium hidden sm:inline">ZIP</span>
                  </button>
                  <div className="relative">
                    <button onClick={() => setConfirmAction('exportPng')} disabled={isExportingWithMetadata} className={`${btnBase} ${isExportingWithMetadata ? btnVariants.disabled : btnVariants.teal}`} title="PNG">
                      {isExportingWithMetadata ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium hidden sm:inline">PNG</span>
                    </button>
                    {isExportingWithMetadata && exportProgress && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] font-bold flex items-center justify-center border border-slate-900">
                        {exportProgress.processed}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Profil visible sur desktop uniquement */}
              <div className="hidden sm:block"><AdminProfile onLogout={onLogout} /></div>
            </div>
          </div>

          {/* Progress Bar Compact */}
          {isExportingWithMetadata && exportProgress && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 pt-3 border-t border-slate-800/50">
              <div className="bg-slate-800/30 rounded-lg p-2.5 border border-teal-500/20">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-teal-200 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="truncate">{exportProgress.message || 'Traitement...'}</span>
                  </span>
                  <span className="text-xs font-bold text-teal-100 tabular-nums bg-teal-500/20 px-1.5 py-0.5 rounded border border-teal-500/30">
                    {exportProgress.processed}/{exportProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%` }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal Confirmation */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 p-5 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  confirmAction === 'delete' ? 'bg-red-500/20 border border-red-500/30' :
                  confirmAction === 'export' ? 'bg-indigo-500/20 border border-indigo-500/30' :
                  'bg-teal-500/20 border border-teal-500/30'
                }`}>
                  {React.createElement(confirmConfig[confirmAction].icon, { 
                    className: `w-5 h-5 ${
                      confirmAction === 'delete' ? 'text-red-400' :
                      confirmAction === 'export' ? 'text-indigo-400' :
                      'text-teal-400'
                    }` 
                  })}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 mb-1">{confirmConfig[confirmAction].title}</h3>
                  <p className="text-sm text-slate-400">{confirmConfig[confirmAction].message}</p>
                </div>
                <button onClick={() => setConfirmAction(null)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors min-h-[44px] ${
                    confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    confirmAction === 'export' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                    'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold transition-colors min-h-[44px]"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal QR Code */}
      <AnimatePresence>
        {showEventLink && isElectron() && currentEvent?.slug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowEventLink(false)}
          >
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 p-5 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-100">Lien de l'événement</h3>
                <button onClick={() => setShowEventLink(false)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center" aria-label="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mb-5 flex justify-center">
                <div className="relative group">
                  {!prefersReducedMotion && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                  )}
                  <div className="relative bg-white p-3 rounded-xl shadow-2xl border-2 border-white/50">
                    <div className="bg-white p-2.5 rounded-lg relative">
                      <QRCodeCanvas value={getEventUrl()} size={180} level="H" bgColor="#ffffff" fgColor="#000000" includeMargin={false} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-gray-200/30">
                          <ExternalLink className="w-5 h-5 text-gray-800" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-slate-900 font-bold text-[10px] uppercase tracking-wider mb-0.5">Scannez pour accéder</p>
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold text-xs">à l'événement</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleOpenEventLink} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors min-h-[44px]">
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir
                </button>
                <button onClick={() => setShowEventLink(false)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold transition-colors min-h-[44px]">
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
