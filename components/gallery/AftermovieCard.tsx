import React, { useState, useRef, useEffect } from 'react';
import { Aftermovie } from '../../types';
import { Video, Download, Calendar, Play, Clock, HardDrive, TrendingUp, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVideoThumbnail } from '../../utils/videoThumbnailGenerator';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../context/ToastContext';
import { shareAftermovie, copyToClipboard } from '../../services/socialShareService';

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
  const isMobile = useIsMobile();
  const { addToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Générer une vraie miniature depuis la vidéo
    let cancelled = false;
    
    const loadThumbnail = async () => {
      if (!aftermovie.url) return;
      
      setThumbnailLoading(true);
      try {
        // Essayer de générer une miniature à 1 seconde
        const thumbnail = await generateVideoThumbnail(aftermovie.url, 1, 0.85);
        if (!cancelled) {
          setThumbnailUrl(thumbnail);
          setThumbnailLoading(false);
        }
      } catch (error) {
        console.warn('Erreur génération miniature:', error);
        if (!cancelled) {
          setThumbnailLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      cancelled = true;
      if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
        // Nettoyer si nécessaire (les data URLs sont automatiquement nettoyées)
      }
    };
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

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const success = await shareAftermovie(
        aftermovie.url,
        aftermovie.title || 'Aftermovie',
        `Regardez notre aftermovie ! ${aftermovie.title ? `- ${aftermovie.title}` : ''}`
      );
      
      if (success) {
        addToast('Partage réussi !', 'success');
      } else {
        // Fallback: copier le lien dans le presse-papier
        const copied = await copyToClipboard(aftermovie.url);
        if (copied) {
          addToast('Lien copié dans le presse-papier !', 'success');
        } else {
          addToast('Impossible de partager ou copier le lien', 'error');
        }
      }
    } catch (error) {
      addToast('Erreur lors du partage', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-md ${isMobile ? 'rounded-xl' : 'rounded-lg sm:rounded-xl'} overflow-hidden border border-slate-700/50 shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/30 transition-all duration-500`}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 rounded-xl blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100"
        animate={isHovered ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Thumbnail avec vraie miniature vidéo */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 overflow-hidden">
        {/* Vraie miniature vidéo */}
        {thumbnailUrl ? (
          <motion.img
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={thumbnailUrl}
            alt="Miniature aftermovie"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : thumbnailLoading ? (
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
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
            <Video className="w-16 h-16 text-indigo-400/40" />
          </div>
        )}

        {/* Overlay gradient pour meilleure lisibilité des badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Badge "Aftermovie" avec animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="absolute top-2 left-2 z-10"
        >
          <motion.div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm border border-white/20 relative overflow-hidden"
            animate={{
              boxShadow: [
                '0 10px 30px rgba(99, 102, 241, 0.3)',
                '0 10px 40px rgba(168, 85, 247, 0.4)',
                '0 10px 30px rgba(236, 72, 153, 0.3)',
                '0 10px 30px rgba(99, 102, 241, 0.3)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative z-10"
            >
              <Video className="w-3 h-3" />
            </motion.div>
            <span className="relative z-10">Aftermovie</span>
          </motion.div>
        </motion.div>

        {/* Durée en haut à droite */}
        {aftermovie.duration_seconds && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10">
              <Clock className="w-2.5 h-2.5" />
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
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50 backdrop-blur-sm flex items-center justify-center gap-3"
            >
              {/* Bouton Partager */}
              <motion.button
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={isSharing}
                className={`${isMobile ? 'px-5 py-2.5 min-h-[48px] text-sm' : 'px-4 py-2 text-xs'} bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl border border-white/20 touch-manipulation relative overflow-hidden group`}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
                {isSharing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} border-2 border-white border-t-transparent rounded-full relative z-10`}
                    />
                    <span className="relative z-10">Partage...</span>
                  </>
                ) : (
                  <>
                    <Share2 className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} relative z-10`} />
                    <span className="relative z-10">Partager</span>
                  </>
                )}
              </motion.button>

              {/* Bouton Télécharger */}
              <motion.button
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDownload(aftermovie)}
                disabled={isDownloading}
                className={`${isMobile ? 'px-6 py-3 min-h-[48px] text-base' : 'px-5 py-2.5 text-sm'} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl border border-white/20 touch-manipulation relative overflow-hidden group`}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
                {isDownloading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full relative z-10`}
                    />
                    <span className="relative z-10">Téléchargement...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ 
                        y: [0, -3, 0],
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="relative z-10"
                    >
                      <Download className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </motion.div>
                    <span className="relative z-10">Télécharger</span>
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
            background: [
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              'linear-gradient(225deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            ],
            backgroundSize: '200% 200%',
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Contenu compact */}
      <div className={`${isMobile ? 'p-3' : 'p-2.5 sm:p-3'}`}>
        <h3 className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-bold text-white ${isMobile ? 'mb-2' : 'mb-1.5 sm:mb-2'} line-clamp-1 group-hover:text-indigo-300 transition-colors`}>
          {aftermovie.title || 'Aftermovie'}
        </h3>

        {/* Métadonnées compactes */}
        <div className={`${isMobile ? 'space-y-1.5' : 'space-y-1 sm:space-y-1.5'}`}>
          {aftermovie.file_size && (
            <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-[10px]'} text-slate-400`}>
              <HardDrive className={`${isMobile ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-indigo-400`} />
              <span>{formatFileSize(aftermovie.file_size)}</span>
            </div>
          )}

          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-[10px]'} text-slate-400`}>
            <Calendar className={`${isMobile ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-purple-400`} />
            <span>{formatDate(aftermovie.created_at)}</span>
          </div>

          {/* Nombre de téléchargements */}
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-[10px]'} text-slate-400`}>
            <TrendingUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-green-400`} />
            <span>
              {aftermovie.download_count !== undefined && aftermovie.download_count > 0
                ? `${aftermovie.download_count} téléchargement${aftermovie.download_count > 1 ? 's' : ''}`
                : 'Aucun téléchargement'}
            </span>
          </div>
        </div>

        {/* Boutons d'action visibles sur mobile */}
        <div className={`${isMobile ? 'mt-3 pt-3' : 'mt-2 sm:mt-3 pt-2 sm:pt-3'} border-t border-slate-700/50 md:hidden`}>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`flex-1 ${isMobile ? 'px-4 py-3 min-h-[48px] rounded-xl text-sm' : 'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs'} bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-1.5 sm:gap-2'} transition-all disabled:opacity-50 touch-manipulation`}
            >
              {isSharing ? (
                <>
                  <div className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
                  <span>Partage...</span>
                </>
              ) : (
                <>
                  <Share2 className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'}`} />
                  <span>Partager</span>
                </>
              )}
            </button>
            <button
              onClick={() => onDownload(aftermovie)}
              disabled={isDownloading}
              className={`flex-1 ${isMobile ? 'px-4 py-3 min-h-[48px] rounded-xl text-sm' : 'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs'} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-1.5 sm:gap-2'} transition-all disabled:opacity-50 touch-manipulation`}
            >
              {isDownloading ? (
                <>
                  <div className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'}`} />
                  <span>Télécharger</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

