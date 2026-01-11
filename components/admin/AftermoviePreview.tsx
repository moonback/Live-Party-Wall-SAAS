import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../../types';

interface AftermoviePreviewProps {
  previewBlob: Blob | null;
  photos: Photo[];
  onClose: () => void;
}

/**
 * Composant de prévisualisation de l'aftermovie avant génération complète
 * Affiche un aperçu des premières secondes
 */
export const AftermoviePreview: React.FC<AftermoviePreviewProps> = ({
  previewBlob,
  photos,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [previewBlob]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!previewBlob || !previewUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          ref={containerRef}
          className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Vidéo */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              loop
            />

            {/* Overlay avec contrôles */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end">
              {/* Contrôles */}
              <div className="p-4 space-y-3">
                {/* Barre de progression */}
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{
                      width: videoRef.current
                        ? `${(videoRef.current.currentTime / videoRef.current.duration) * 100}%`
                        : '0%'
                    }}
                  />
                </div>

                {/* Boutons de contrôle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="p-4 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Aperçu de l'aftermovie</h3>
                <p className="text-sm text-slate-400">
                  {photos.length} photo{photos.length > 1 ? 's' : ''} sélectionnée{photos.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};



