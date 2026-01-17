import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Upload, Video, X } from 'lucide-react';

interface ActionButtonsProps {
  isGenerating: boolean;
  photosLoading: boolean;
  hasGeneratedBlob: boolean;
  isUploading: boolean;
  hasCurrentEvent: boolean;
  onGenerate: () => void;
  onCancel: () => void;
  onUploadAndShare: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isGenerating,
  photosLoading,
  hasGeneratedBlob,
  isUploading,
  hasCurrentEvent,
  onGenerate,
  onCancel,
  onUploadAndShare
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          type="button"
          onClick={onGenerate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
          disabled={isGenerating || photosLoading}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Video className="w-4 h-4" />
              </motion.div>
              Génération en cours…
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Générer & Télécharger
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={!isGenerating}
        >
          {isGenerating && <X className="w-4 h-4" />}
          Annuler
        </motion.button>
      </div>

      {/* Bouton Upload & Partage */}
      {hasGeneratedBlob && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <motion.button
            type="button"
            onClick={onUploadAndShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2"
            disabled={isUploading || !hasCurrentEvent}
          >
            {isUploading ? (
              <>
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                >
                  <Upload className="w-4 h-4" />
                </motion.div>
                Upload en cours…
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Uploader & Partager
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

