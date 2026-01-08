import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trash2, Download, Image as ImageIcon, RefreshCw, Power, ExternalLink, Globe } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminProfile from '../AdminProfile';
import { Photo } from '../../types';
import { isElectron } from '../../utils/electronPaths';
import { useEvent } from '../../context/EventContext';
import { getBaseUrl } from '../../utils/urlUtils';

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
}

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  onBack,
  onLogout,
  onDeleteAll,
  onExport,
  onExportWithMetadata,
  photos,
  isExporting,
  isExportingWithMetadata,
  exportProgress,
  currentEventName
}) => {
  const { currentEvent } = useEvent();
  const [showEventLink, setShowEventLink] = useState(false);

  const handleCloseApp = async () => {
    if (isElectron() && window.electronAPI) {
      try {
        await window.electronAPI.closeApp();
      } catch (error) {
        console.error('Erreur lors de la fermeture de l\'application:', error);
      }
    }
  };

  const getEventUrl = (): string => {
    if (!currentEvent?.slug) return '';
    const baseUrl = getBaseUrl();
    return `${baseUrl}?event=${currentEvent.slug}`;
  };

  const handleOpenEventLink = () => {
    const eventUrl = getEventUrl();
    if (eventUrl) {
      // Dans Electron, ouvrir dans le navigateur par défaut
      if (isElectron() && window.electronAPI) {
        // Utiliser shell.openExternal via l'API Electron si disponible
        window.open(eventUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(eventUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };


  return (
    <header className="mb-6">
      <div className="bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-800/90 backdrop-blur-2xl rounded-2xl px-8 py-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Section gauche - Branding & Titre */}
          <div className="flex items-center gap-4">
            <div className="relative flex flex-col">
              <h1 className="flex items-center text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight gap-2">
                <span>
                  <span className="inline-block align-middle">
                    <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 drop-shadow" />
                  </span>
                </span>
                <span>
                  Live <span className="text-indigo-400">Party</span>  Wall
                </span>
              </h1>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <p className="text-base text-slate-400 font-medium flex items-center gap-1">
                  <span>Gérez vos murs en</span>
                  <span className="inline-block text-indigo-400 font-bold animate-pulse">live</span>
                  <span className="hidden sm:inline">🎉</span>
                </p>
                {currentEventName && (
                  <>
                    <span className="text-slate-600 text-xs">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-700/10 border border-indigo-400/20 backdrop-blur-[2px] shadow-inner rounded-full">
                      <div className="w-[8px] h-[8px] bg-teal-400 animate-pulse rounded-full shadow" aria-label="Événement actif"></div>
                      <span className="text-xs font-semibold text-indigo-200 truncate max-w-[140px]" title={currentEventName}>
                        {currentEventName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {currentEventName && !isElectron() && (
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-green-400/30 bg-gradient-to-r from-green-800/30 to-green-700/20 hover:bg-green-600/25 transition-all duration-150 text-green-300 hover:text-green-100 group shadow"
                aria-label="Retour à l'application"
                title="Retour à la sélection d'événements"
              >
                <Home className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-bold hidden sm:inline uppercase tracking-wide">
                  Application
                </span>
              </motion.button>
            )}
            {isElectron() && currentEvent?.slug && (
              <>
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenEventLink}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-green-400/30 bg-gradient-to-r from-green-800/30 to-green-700/20 hover:bg-green-600/25 transition-all duration-150 text-green-300 hover:text-green-100 group shadow"
                  aria-label="Ouvrir l'événement dans le navigateur"
                  title="Ouvrir l'événement dans le navigateur"
                >
                  <Globe className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-bold hidden sm:inline uppercase tracking-wide">
                    Ouvrir
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEventLink(!showEventLink)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-800/30 to-blue-700/20 hover:bg-blue-600/25 transition-all duration-150 text-blue-300 hover:text-blue-100 group shadow"
                  aria-label="Afficher le QRcode de l'événement"
                  title="Afficher le QRcode de l'événement"
                >
                  <ExternalLink className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-bold hidden sm:inline uppercase tracking-wide">
                    Qrcode
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseApp}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-400/30 bg-gradient-to-r from-red-800/30 to-red-700/20 hover:bg-red-600/25 transition-all duration-150 text-red-300 hover:text-red-100 group shadow"
                  aria-label="Fermer l'application"
                  title="Fermer l'application"
                >
                  <Power className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  <span className="text-sm font-bold hidden sm:inline uppercase tracking-wide">
                    Fermer
                  </span>
                </motion.button>
              </>
            )}
            {!isElectron() && currentEventName && (
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-green-400/30 bg-gradient-to-r from-green-800/30 to-green-700/20 hover:bg-green-600/25 transition-all duration-150 text-green-300 hover:text-green-100 group shadow"
                aria-label="Retour à l'application"
                title="Retour à la sélection d'événements"
              >
                <Home className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-bold hidden sm:inline uppercase tracking-wide">
                  Application
                </span>
              </motion.button>
            )}
          </div>

          {/* Section droite - Actions & Profil */}
          <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto flex-wrap">
            {/* Actions */}
            {photos.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800 shadow-lg">
                <motion.button
                  whileHover={{ scale: 1.10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onDeleteAll}
                  className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-red-900/20 text-red-400 border border-red-500/30 rounded-lg font-semibold text-sm transition-all duration-150 shadow-sm disabled:opacity-60"
                  title="Tout vider"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Vider</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onExport}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg font-semibold text-sm text-white border-none shadow-sm transition-all duration-150 
                    ${
                      isExporting
                        ? 'bg-slate-800 text-indigo-400 cursor-wait'
                        : ''
                    } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}
                  title="Télécharger en ZIP"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">ZIP</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onExportWithMetadata}
                  disabled={isExportingWithMetadata}
                  className={`flex items-center gap-2 px-3 py-2 bg-teal-700 hover:bg-teal-800 rounded-lg font-semibold text-sm text-white relative shadow-sm border-none transition-all duration-150 
                    ${
                      isExportingWithMetadata
                        ? 'bg-slate-800 text-teal-300 cursor-wait'
                        : ''
                    } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}
                  title="Export PNG avec métadonnées"
                >
                  {isExportingWithMetadata ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  {isExportingWithMetadata && exportProgress && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] font-extrabold bg-teal-400 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-950 shadow">
                      {exportProgress.processed}
                    </span>
                  )}
                  <span className="hidden sm:inline">PNG</span>
                </motion.button>
              </div>
            )}

            {/* Export PNG Progress Bar */}
            {isExportingWithMetadata && exportProgress && (
              <div className="w-full lg:w-auto min-w-[200px] bg-gradient-to-r from-teal-900/80 via-teal-800/90 to-slate-900/80 rounded-xl p-3 border border-teal-500/30 shadow flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-300">
                    {exportProgress.message || 'Traitement en cours...'}
                  </span>
                  <span className="text-xs font-bold text-teal-200 tabular-nums">
                    {exportProgress.processed} / {exportProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/95 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Profil administrateur */}
            <div className="ml-auto lg:ml-0">
              <AdminProfile onLogout={onLogout} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour afficher le lien de l'événement (Electron uniquement) */}
      <AnimatePresence>
        {showEventLink && isElectron() && currentEvent?.slug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEventLink(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-100">Lien de l'événement</h3>
                <button
                  onClick={() => setShowEventLink(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Fermer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* QR Code */}
              <div className="mb-6 flex justify-center">
                <div className="relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                  
                  {/* QR Code Container */}
                  <div className="relative bg-gradient-to-br from-white via-white to-gray-50 p-4 rounded-2xl shadow-2xl border-2 border-white/50">
                    <div className="bg-white p-3 rounded-xl shadow-inner">
                      <QRCodeCanvas
                        value={getEventUrl()}
                        size={200}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                        includeMargin={false}
                      />
                      {/* Logo overlay center */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200/30">
                          <ExternalLink className="w-6 h-6 text-gray-800" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Text */}
                    <div className="text-center mt-3">
                      <p className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-1">
                        Scannez pour accéder
                      </p>
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold text-sm">
                        à l'événement
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenEventLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir dans le navigateur
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEventLink(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold transition-colors"
                >
                  Fermer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
