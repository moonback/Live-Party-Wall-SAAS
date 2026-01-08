import React from 'react';
import { motion } from 'framer-motion';
import { Home, Trash2, Download, Image as ImageIcon, RefreshCw } from 'lucide-react';
import AdminProfile from '../AdminProfile';
import { Photo } from '../../types';

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
  return (
    <header className="mb-6">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Section gauche - Titre */}
          <div className="flex items-center gap-3">
           
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">
                Administration
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <p className="text-sm text-slate-400">Gérez votre mur</p>
                {currentEventName && (
                  <>
                    <span className="text-slate-600 text-xs">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                      <span className="text-xs font-medium text-indigo-300 truncate max-w-[120px]">
                        {currentEventName}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
            </div>
            {currentEventName && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-200"
                aria-label="Retour à l'accueil"
              >
                <Home className="w-5 h-5 text-green-500" />
                <span className="text-green-500"></span>
              </motion.button>
            )}
          </div>

          {/* Section droite - Actions rapides et profil */}
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto flex-wrap">
            {/* Actions rapides */}
            {photos.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDeleteAll}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20"
                  title="Tout vider"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Vider</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onExport}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onExportWithMetadata}
                  disabled={isExportingWithMetadata}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white relative"
                  title="Export PNG avec métadonnées"
                >
                  {isExportingWithMetadata ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  {isExportingWithMetadata && exportProgress && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900">
                      {exportProgress.processed}
                    </span>
                  )}
                  <span className="hidden sm:inline">PNG</span>
                </motion.button>
              </div>
            )}

            {/* Indicateur de progression pour l'export PNG */}
            {isExportingWithMetadata && exportProgress && (
              <div className="w-full lg:w-auto min-w-[180px] bg-slate-900/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-teal-300">
                    {exportProgress.message || 'Traitement...'}
                  </span>
                  <span className="text-xs font-semibold text-teal-200">
                    {exportProgress.processed} / {exportProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%`
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

