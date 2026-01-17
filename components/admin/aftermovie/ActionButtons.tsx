import React from 'react';
import { Share2, Upload } from 'lucide-react';

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
        <button
          type="button"
          onClick={onGenerate}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          disabled={isGenerating || photosLoading}
        >
          {isGenerating ? 'Génération…' : 'Générer & Télécharger'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isGenerating}
        >
          Annuler
        </button>
      </div>

      {/* Bouton Upload & Partage */}
      {hasGeneratedBlob && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onUploadAndShare}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            disabled={isUploading || !hasCurrentEvent}
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 animate-pulse" />
                Upload en cours…
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Uploader & Partager
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

