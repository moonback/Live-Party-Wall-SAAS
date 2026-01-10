import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, MessageCircle, Download, Loader2 } from 'lucide-react';
import { Photo } from '../../types';
import {
  generateInstagramStory,
  generateInstagramReel,
  addWatermark,
  shareToWhatsApp,
  downloadBlob
} from '../../services/socialSharingService';
import { useEvent } from '../../context/EventContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { logger } from '../../utils/logger';

interface SocialSharingModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialSharingModal: React.FC<SocialSharingModalProps> = ({
  photo,
  isOpen,
  onClose
}) => {
  const { currentEvent } = useEvent();
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const restaurantName = currentEvent?.name || 'Restaurant';

  const handleGenerate = async (
    type: 'story' | 'reel' | 'watermark',
    caption?: string
  ) => {
    try {
      setGenerating(type);
      
      let blob: Blob;
      let filename: string;

      if (type === 'story') {
        blob = await generateInstagramStory(photo, restaurantName, caption || photo.caption);
        filename = `instagram-story-${Date.now()}.jpg`;
      } else if (type === 'reel') {
        blob = await generateInstagramReel(photo, restaurantName, caption || photo.caption);
        filename = `instagram-reel-${Date.now()}.jpg`;
      } else {
        // Watermark seulement
        const imageResponse = await fetch(photo.url);
        const imageBlob = await imageResponse.blob();
        blob = await addWatermark(imageBlob, restaurantName);
        filename = `photo-watermark-${Date.now()}.jpg`;
      }

      downloadBlob(blob, filename);
      addToast('Image générée et téléchargée !', 'success');
    } catch (error) {
      logger.error('Error generating social media image', error, {
        component: 'SocialSharingModal',
        action: 'handleGenerate'
      });
      addToast('Erreur lors de la génération', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const handleShareWhatsApp = () => {
    const url = shareToWhatsApp(photo.url, restaurantName, photo.caption);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Partager ma photo</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Instagram Story */}
            <button
              onClick={() => handleGenerate('story')}
              disabled={generating === 'story'}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating === 'story' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Instagram className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {generating === 'story' ? 'Génération...' : 'Instagram Story'}
              </span>
            </button>

            {/* Instagram Reel */}
            <button
              onClick={() => handleGenerate('reel')}
              disabled={generating === 'reel'}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating === 'reel' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Instagram className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {generating === 'reel' ? 'Génération...' : 'Instagram Reel'}
              </span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center gap-3 p-4 bg-green-600 rounded-lg hover:bg-green-700 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Partager sur WhatsApp</span>
            </button>

            {/* Watermark seulement */}
            {settings.social_watermark_enabled && (
              <button
                onClick={() => handleGenerate('watermark')}
                disabled={generating === 'watermark'}
                className="w-full flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === 'watermark' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {generating === 'watermark' ? 'Génération...' : 'Télécharger avec watermark'}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

