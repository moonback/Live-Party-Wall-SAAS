import React from 'react';
import { motion } from 'framer-motion';
import { Home, Trash2, Download, Image as ImageIcon, RefreshCw, Power } from 'lucide-react';
import AdminProfile from '../AdminProfile';
import { Photo } from '../../types';
import { isElectron } from '../../utils/electronPaths';

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
  const handleCloseApp = async () => {
    if (isElectron() && window.electronAPI) {
      try {
        await window.electronAPI.closeApp();
      } catch (error) {
        console.error('Erreur lors de la fermeture de l\'application:', error);
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
            {currentEventName && (
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
            {isElectron() && (
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
    </header>
  );
};
