import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Photo } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { generateImageFromPrompt, isPuterAvailable } from '../../services/imageGenerationService';

interface ImageEditModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (base64Image: string, prompt: string) => Promise<void>;
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  photo,
  isOpen,
  onClose,
  onGenerate
}) => {
  const isMobile = useIsMobile();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Vérifier si Puter.js est disponible
  const puterAvailable = isPuterAvailable();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Veuillez saisir un prompt');
      return;
    }

    if (!puterAvailable) {
      setError('Puter.js n\'est pas disponible. Veuillez rafraîchir la page.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Envoyer l'image originale pour modification
      const base64Image = await generateImageFromPrompt(prompt.trim(), 'gemini-2.5-flash-image-preview', photo.url);
      setGeneratedImage(base64Image);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération de l\'image';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedImage) return;

    setIsPublishing(true);
    try {
      await onGenerate(generatedImage, prompt.trim());
      // Réinitialiser l'état après publication réussie
      setPrompt('');
      setGeneratedImage(null);
      setError(null);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la publication';
      setError(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating && !isPublishing) {
      setPrompt('');
      setGeneratedImage(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full ${isMobile ? 'max-w-full' : 'max-w-2xl'} max-h-[90vh] bg-slate-900 border border-white/10 shadow-2xl ${isMobile ? 'rounded-2xl p-4' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} z-[201] overflow-y-auto flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-pink-500`} />
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-white`}>
              Modifier avec IA
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating || isPublishing}
            className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} text-slate-400 hover:text-white transition-colors touch-manipulation flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-50`}
          >
            <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
          </button>
        </div>

        {/* Avertissement Puter.js */}
        {!puterAvailable && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-400 text-sm">
              ⚠️ Puter.js n'est pas chargé. Veuillez rafraîchir la page.
            </p>
          </div>
        )}

        {/* Photo originale (aperçu) */}
        <div className="mb-4">
          <p className="text-slate-400 text-xs sm:text-sm mb-2">Photo originale :</p>
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <img
              src={photo.url}
              alt={photo.caption || 'Photo originale'}
              className="w-full h-auto max-h-[200px] object-contain"
            />
          </div>
        </div>

        {/* Champ prompt */}
        <div className="mb-4">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Décrivez la modification souhaitée :
          </label>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError(null);
            }}
            placeholder="Ex: Transforme cette photo en style cartoon, ou Ajoute un effet de neige magique..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 resize-none min-h-[120px] text-sm sm:text-base"
            disabled={isGenerating || isPublishing}
            autoFocus
          />
          <p className="text-slate-500 text-xs mt-2">
            💡 Soyez créatif ! Décrivez comment vous voulez transformer votre photo. L'image originale sera utilisée comme référence pour la modification.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Aperçu de l'image générée */}
        {generatedImage && (
          <div className="mb-4">
            <p className="text-slate-300 text-sm font-medium mb-2">Aperçu de l'image générée :</p>
            <div className="relative rounded-xl overflow-hidden border border-pink-500/30">
              <img
                src={generatedImage}
                alt="Image générée"
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleClose}
            disabled={isGenerating || isPublishing}
            className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all touch-manipulation font-medium text-sm sm:text-base disabled:opacity-50`}
          >
            {generatedImage ? 'Annuler' : 'Fermer'}
          </button>
          
          {!generatedImage ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !puterAvailable}
              className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-all touch-manipulation font-bold text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all touch-manipulation font-bold text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publication...</span>
                </>
              ) : (
                'Publier'
              )}
            </button>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

