import { useState, useEffect } from 'react';
import { applyImageFilter, enhanceImageQuality, FilterType, FrameType } from '../utils/imageFilters';
import { logger } from '../utils/logger';

export const useImageProcessing = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [activeFrame, setActiveFrame] = useState<FrameType>('none');

  // Appliquer les filtres quand activeFilter ou activeFrame change
  useEffect(() => {
    if (!originalImage) return;

    const processImage = async () => {
      try {
        const processed = await applyImageFilter(originalImage, activeFilter, activeFrame);
        setPreview(processed);
      } catch (err) {
        logger.error("Erreur filtre", err, { component: 'useImageProcessing', action: 'applyFilters' });
      }
    };
    processImage();
  }, [activeFilter, activeFrame, originalImage]);

  const loadImage = async (file: File) => {
    // Convertir le fichier en dataUrl sans compression ni redimensionnement
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setOriginalImage(dataUrl);
        setPreview(dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const reset = () => {
    setOriginalImage(null);
    setPreview(null);
    setActiveFilter('none');
    setActiveFrame('none');
  };

  return {
    originalImage,
    preview,
    activeFilter,
    activeFrame,
    setActiveFilter,
    setActiveFrame,
    setPreview,
    loadImage,
    reset
  };
};

