import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trash2, Download, Image as ImageIcon, RefreshCw, Power, ExternalLink, Globe } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminProfile from '../AdminProfile';
import { Photo } from '../../types';
import { isElectron } from '../../utils/electronPaths';
import { useEvent } from '../../context/EventContext';
import { getBaseUrl } from '../../utils/urlUtils';
import { logger } from '../../utils/logger';

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
        logger.error('Erreur lors de la fermeture de l\'application', error, { component: 'AdminDashboardHeader', action: 'closeApp' });
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
    <header className="mb-4 sm:mb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border border-slate-700/50 shadow-2xl">
        {/* Effet de brillance animé en arrière-plan */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Bordure lumineuse */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          {/* Section gauche - Branding & Titre */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap w-full lg:w-auto">
            <div className="relative flex flex-col min-w-0 flex-1 lg:flex-initial">
              {/* Logo avec effet glow - Version compacte mobile */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative inline-flex items-center flex-shrink-0">
                  <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-1.5 sm:p-2 lg:p-2.5 rounded-xl sm:rounded-2xl border border-indigo-400/30 backdrop-blur-sm">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-300 drop-shadow-lg" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="flex items-center text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight gap-1.5 sm:gap-2.5">
                    <span className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent drop-shadow-lg whitespace-nowrap">
                      Live
                    </span>
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse whitespace-nowrap">
                      Party
                    </span>
                    <span className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent drop-shadow-lg whitespace-nowrap">
                      Wall
                    </span>
                  </h1>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-wrap mt-0.5 sm:mt-1">
                    <p className="text-xs sm:text-sm lg:text-base text-slate-300 font-medium flex items-center gap-1 sm:gap-1.5">
                      <span className="hidden sm:inline">Gérez vos murs en</span>
                      <span className="sm:hidden">En</span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-md sm:rounded-lg border border-indigo-400/30">
                        <span className="text-indigo-300 font-bold animate-pulse text-xs sm:text-sm">live</span>
                        <span className="hidden sm:inline text-base lg:text-lg">🎉</span>
                      </span>
                    </p>
                    {currentEventName && (
                      <>
                        <span className="text-slate-600 text-sm sm:text-lg hidden sm:inline">•</span>
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-400/40 backdrop-blur-md shadow-lg rounded-full group hover:border-indigo-400/60 transition-all flex-shrink-0"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-teal-400 rounded-full blur-sm opacity-75 animate-pulse"></div>
                            <div className="relative w-2 h-2 sm:w-2.5 sm:h-2.5 bg-teal-400 rounded-full shadow-lg shadow-teal-400/50" aria-label="Événement actif"></div>
                          </div>
                          <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-indigo-200 truncate max-w-[100px] sm:max-w-[160px] lg:max-w-[200px] group-hover:text-indigo-100 transition-colors" title={currentEventName}>
                            {currentEventName}
                          </span>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* {currentEventName && !isElectron() && (
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
            )} */}
            {isElectron() && currentEvent?.slug && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenEventLink}
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl border border-green-400/40 bg-gradient-to-r from-green-600/30 via-emerald-600/30 to-teal-600/30 hover:from-green-500/40 hover:via-emerald-500/40 hover:to-teal-500/40 transition-all duration-200 text-green-200 hover:text-green-100 group shadow-lg shadow-green-500/20 hover:shadow-green-500/30 overflow-hidden"
                  aria-label="Ouvrir l'événement dans le navigateur"
                  title="Ouvrir l'événement dans le navigateur"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold hidden sm:inline uppercase tracking-wide relative z-10">
                    Ouvrir
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEventLink(!showEventLink)}
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-sky-600/30 hover:from-blue-500/40 hover:via-cyan-500/40 hover:to-sky-500/40 transition-all duration-200 text-blue-200 hover:text-blue-100 group shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 overflow-hidden"
                  aria-label="Afficher le QRcode de l'événement"
                  title="Afficher le QRcode de l'événement"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold hidden sm:inline uppercase tracking-wide relative z-10">
                    Qrcode
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseApp}
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl border border-red-400/40 bg-gradient-to-r from-red-600/30 via-rose-600/30 to-pink-600/30 hover:from-red-500/40 hover:via-rose-500/40 hover:to-pink-500/40 transition-all duration-200 text-red-200 hover:text-red-100 group shadow-lg shadow-red-500/20 hover:shadow-red-500/30 overflow-hidden"
                  aria-label="Fermer l'application"
                  title="Fermer l'application"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 relative z-10 transition-transform group-hover:rotate-90" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold hidden sm:inline uppercase tracking-wide relative z-10">
                    Fermer
                  </span>
                </motion.button>
              </div>
            )}
            {!isElectron() && currentEventName && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl border border-green-400/40 bg-gradient-to-r from-green-600/30 via-emerald-600/30 to-teal-600/30 hover:from-green-500/40 hover:via-emerald-500/40 hover:to-teal-500/40 transition-all duration-200 text-green-200 hover:text-green-100 group shadow-lg shadow-green-500/20 hover:shadow-green-500/30 overflow-hidden"
                aria-label="Retour à l'application"
                title="Retour à la sélection d'événements"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 relative z-10 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-bold hidden sm:inline uppercase tracking-wide relative z-10">
                  Application
                </span>
              </motion.button>
            )}
          </div>

          {/* Section droite - Actions & Profil */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto flex-wrap">
            {/* Actions */}
            {photos.length > 0 && (
              <div className="relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 lg:p-2.5 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 rounded-xl sm:rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
                {/* Effet de brillance */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                
                <motion.button
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onDeleteAll}
                  className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 sm:py-2 lg:py-2.5 bg-transparent hover:bg-gradient-to-r hover:from-red-900/30 hover:to-rose-900/30 text-red-400 hover:text-red-300 border border-red-500/40 hover:border-red-400/60 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs lg:text-sm transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-red-500/20 group overflow-hidden"
                  title="Tout vider"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                  <span className="hidden sm:inline relative z-10">Vider</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onExport}
                  disabled={isExporting}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs lg:text-sm text-white border-none shadow-lg transition-all duration-200 overflow-hidden group
                    ${
                      isExporting
                        ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-indigo-400 cursor-wait'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Télécharger en ZIP"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  {isExporting ? (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin relative z-10" />
                  ) : (
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                  )}
                  <span className="hidden sm:inline relative z-10">ZIP</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onExportWithMetadata}
                  disabled={isExportingWithMetadata}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs lg:text-sm text-white border-none shadow-lg transition-all duration-200 overflow-hidden group
                    ${
                      isExportingWithMetadata
                        ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-teal-300 cursor-wait'
                        : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 hover:from-teal-500 hover:via-cyan-500 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-500/30'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Export PNG avec métadonnées"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  {isExportingWithMetadata ? (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin relative z-10" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                  )}
                  {isExportingWithMetadata && exportProgress && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 text-[9px] sm:text-[10px] font-extrabold bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border-2 border-slate-950 shadow-lg shadow-teal-400/50 animate-pulse">
                      {exportProgress.processed}
                    </span>
                  )}
                  <span className="hidden sm:inline relative z-10">PNG</span>
                </motion.button>
              </div>
            )}

            {/* Export PNG Progress Bar */}
            {isExportingWithMetadata && exportProgress && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full lg:w-auto min-w-[200px] sm:min-w-[240px] bg-gradient-to-br from-teal-900/90 via-cyan-900/90 to-slate-900/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-teal-400/40 shadow-2xl backdrop-blur-sm flex flex-col gap-1.5 sm:gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs font-bold text-teal-200 flex items-center gap-1.5 sm:gap-2 truncate">
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin flex-shrink-0" />
                    <span className="truncate">{exportProgress.message || 'Traitement...'}</span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-extrabold text-teal-100 tabular-nums bg-teal-500/20 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border border-teal-400/30 flex-shrink-0">
                    {exportProgress.processed} / {exportProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-slate-800/95 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%`
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 rounded-full shadow-lg shadow-teal-400/50 relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        repeatDelay: 0.5
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Profil administrateur */}
            <div className="ml-auto lg:ml-0 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative">
                <AdminProfile onLogout={onLogout} />
              </div>
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
