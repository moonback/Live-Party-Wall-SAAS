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
import { Button, Card, Modal } from './ui';

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


  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <header className="mb-6">
      <Card variant="elevated" className="relative overflow-hidden">
        {/* Effet de brillance simplifié - seulement si pas de reduced motion */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>
        )}
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          {/* Section gauche - Branding & Titre */}
          <div className="flex items-center gap-3 lg:gap-4 flex-wrap w-full lg:w-auto">
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
                  <h1 className="flex items-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight gap-2">
                    <span className="text-slate-100 whitespace-nowrap">Live</span>
                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                      Party
                    </span>
                    <span className="text-slate-100 whitespace-nowrap">Wall</span>
                  </h1>
                  
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1">
                    <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-1.5">
                      <span className="hidden sm:inline">Gérez vos murs en</span>
                      <span className="sm:hidden">En</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                        <span className="text-indigo-300 font-semibold text-xs sm:text-sm">live</span>
                        <span className="hidden sm:inline">🎉</span>
                      </span>
                    </p>
                    {currentEventName && (
                      <>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-400/30 backdrop-blur-sm rounded-full flex-shrink-0">
                          <div className="w-2 h-2 bg-teal-400 rounded-full shadow-lg shadow-teal-400/50" aria-label="Événement actif"></div>
                          <span className="text-xs sm:text-sm font-semibold text-indigo-200 truncate max-w-[100px] sm:max-w-[160px] lg:max-w-[200px]" title={currentEventName}>
                            {currentEventName}
                          </span>
                        </div>
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleOpenEventLink}
                  icon={Globe}
                  className="hidden sm:flex"
                  aria-label="Ouvrir l'événement dans le navigateur"
                  title="Ouvrir l'événement dans le navigateur"
                >
                  <span className="hidden md:inline">Ouvrir</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEventLink(!showEventLink)}
                  icon={ExternalLink}
                  className="hidden sm:flex"
                  aria-label="Afficher le QRcode de l'événement"
                  title="Afficher le QRcode de l'événement"
                >
                  <span className="hidden md:inline">Qrcode</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCloseApp}
                  icon={Power}
                  className="hidden sm:flex"
                  aria-label="Fermer l'application"
                  title="Fermer l'application"
                >
                  <span className="hidden md:inline">Fermer</span>
                </Button>
              </div>
            )}
            {!isElectron() && currentEventName && (
              <Button
                variant="success"
                size="sm"
                onClick={onBack}
                icon={Home}
                className="hidden sm:flex"
                aria-label="Retour à l'application"
                title="Retour à la sélection d'événements"
              >
                <span className="hidden md:inline">Application</span>
              </Button>
            )}
          </div>

          {/* Section droite - Actions & Profil */}
          <div className="flex items-center gap-3 lg:gap-4 w-full lg:w-auto flex-wrap">
            {/* Actions */}
            {photos.length > 0 && (
              <Card variant="default" className="p-2 flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDeleteAll}
                  icon={Trash2}
                  title="Tout vider"
                >
                  <span className="hidden sm:inline">Vider</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={onExport}
                  disabled={isExporting}
                  isLoading={isExporting}
                  icon={isExporting ? RefreshCw : Download}
                  title="Télécharger en ZIP"
                >
                  <span className="hidden sm:inline">ZIP</span>
                </Button>

                <div className="relative">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onExportWithMetadata}
                    disabled={isExportingWithMetadata}
                    isLoading={isExportingWithMetadata}
                    icon={isExportingWithMetadata ? RefreshCw : ImageIcon}
                    title="Export PNG avec métadonnées"
                  >
                    <span className="hidden sm:inline">PNG</span>
                  </Button>
                  {isExportingWithMetadata && exportProgress && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] sm:text-[10px] font-extrabold bg-teal-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border-2 border-slate-950 shadow-lg">
                      {exportProgress.processed}
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* Export PNG Progress Bar */}
            {isExportingWithMetadata && exportProgress && (
              <Card variant="default" className="w-full lg:w-auto min-w-[200px] sm:min-w-[240px] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-200 flex items-center gap-2 truncate">
                    <RefreshCw className="w-3 h-3 animate-spin flex-shrink-0" />
                    <span className="truncate">{exportProgress.message || 'Traitement...'}</span>
                  </span>
                  <span className="text-xs font-extrabold text-teal-100 tabular-nums bg-teal-500/20 px-2 py-0.5 rounded-lg border border-teal-400/30 flex-shrink-0">
                    {exportProgress.processed} / {exportProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/95 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%`
                    }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 rounded-full shadow-lg shadow-teal-400/50"
                  />
                </div>
              </Card>
            )}

            {/* Profil administrateur */}
            <div className="ml-auto lg:ml-0">
              <AdminProfile onLogout={onLogout} />
            </div>
          </div>
        </div>
      </Card>

      {/* Modal pour afficher le lien de l'événement (Electron uniquement) */}
      <Modal
        isOpen={showEventLink && isElectron() && !!currentEvent?.slug}
        onClose={() => setShowEventLink(false)}
        title="Lien de l'événement"
        size="md"
      >
        {/* QR Code */}
        <div className="mb-6 flex justify-center">
          <div className="relative group">
            {/* Glow effect */}
            {!prefersReducedMotion && (
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            )}
            
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
          <Button
            variant="primary"
            fullWidth
            onClick={handleOpenEventLink}
            icon={ExternalLink}
          >
            Ouvrir dans le navigateur
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowEventLink(false)}
          >
            Fermer
          </Button>
        </div>
      </Modal>
    </header>
  );
};
