import React from 'react';
import { Aftermovie } from '../../types';
import { Video, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all duration-300"
    >
      {/* Thumbnail avec overlay */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-900/20 to-purple-900/20 overflow-hidden">
        {/* Placeholder vidéo avec icône */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Video className="w-20 h-20 text-indigo-400/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Video className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Badge "Aftermovie" */}
        <div className="absolute top-4 left-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <Video className="w-3 h-3" />
            Aftermovie
          </div>
        </div>

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => onDownload(aftermovie)}
            disabled={isDownloading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Télécharger
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <h3 className="text-xl font-black text-white mb-2 line-clamp-2">
          {aftermovie.title || 'Aftermovie'}
        </h3>

        {/* Métadonnées */}
        <div className="space-y-2 text-sm text-slate-400">
          {aftermovie.duration_seconds && (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>{formatDuration(aftermovie.duration_seconds)}</span>
            </div>
          )}
          
          {aftermovie.file_size && (
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>{formatFileSize(aftermovie.file_size)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(aftermovie.created_at)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

