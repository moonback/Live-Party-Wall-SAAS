import React, { useState, useRef, useEffect } from 'react';
import { Aftermovie } from '../../types';
import { Video, Download, Calendar, Play, Clock, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AftermovieCardProps {
  aftermovie: Aftermovie;
  onDownload: (aftermovie: Aftermovie) => void;
  isDownloading?: boolean;
}

export const AftermovieCard: React.FC<AftermovieCardProps> = ({
  aftermovie,
  onDownload,
  isDownloading = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Essayer de charger une miniature depuis la vidéo
    if (videoRef.current && aftermovie.url) {
      const video = videoRef.current;
      video.currentTime = 1; // Prendre une frame à 1 seconde
      video.addEventListener('loadeddata', () => {
        setThumbnailLoaded(true);
      });
    }
  }, [aftermovie.url]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl hover:border-indigo-500/50 hover:shadow-indigo-500/20 transition-all duration-300"
    >
      {/* Thumbnail avec vidéo en arrière-plan */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 overflow-hidden">
        {/* Vidéo cachée pour générer la miniature */}
        <video
          ref={videoRef}
          src={aftermovie.url}
          className="hidden"
          preload="metadata"
        />

        {/* Thumbnail ou placeholder animé */}
        {thumbnailLoaded && videoRef.current ? (
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <Video className="w-16 h-16 text-indigo-400/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-500/20">
                  <Play className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Badge "Aftermovie" avec animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-3 left-3 z-10"
        >
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-sm border border-white/20">
            <Video className="w-3.5 h-3.5" />
            <span>Aftermovie</span>
          </div>
        </motion.div>

        {/* Durée en haut à droite */}
        {aftermovie.duration_seconds && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(aftermovie.duration_seconds)}</span>
            </div>
          </div>
        )}

        {/* Overlay au hover avec animation */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.button
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                onClick={() => onDownload(aftermovie)}
                disabled={isDownloading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-full font-bold flex items-center gap-2 transition-all transform hover:scale-110 disabled:opacity-50 shadow-2xl border border-white/20"
              >
                {isDownloading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Télécharger</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Effet de brillance au hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={isHovered ? {
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
          } : {}}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Contenu amélioré */}
      <div className="p-5">
        <h3 className="text-lg font-black text-white mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">
          {aftermovie.title || 'Aftermovie'}
        </h3>

        {/* Métadonnées avec icônes améliorées */}
        <div className="space-y-2.5">
          {aftermovie.file_size && (
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <div className="p-1.5 bg-slate-800/50 rounded-lg">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-medium">{formatFileSize(aftermovie.file_size)}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <div className="p-1.5 bg-slate-800/50 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="font-medium">{formatDate(aftermovie.created_at)}</span>
          </div>
        </div>

        {/* Bouton de téléchargement visible sur mobile */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 md:hidden">
          <button
            onClick={() => onDownload(aftermovie)}
            disabled={isDownloading}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Téléchargement...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

