import { useState, useEffect } from 'react';
import { applyImageFilter, enhanceImageQuality, FilterType, FrameType } from '../utils/imageFilters';
import { MAX_IMAGE_WIDTH, IMAGE_QUALITY } from '../constants';
import { useImageCompression } from './useImageCompression';
import { logger } from '../utils/logger';

export const useImageProcessing = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [activeFrame, setActiveFrame] = useState<FrameType>('none');
  const { compressImage } = useImageCompression();

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

  const resizeImage = async (file: File): Promise<string> => {
    try {
      const result = await compressImage(file, {
        maxWidth: MAX_IMAGE_WIDTH,
        quality: IMAGE_QUALITY
      });
      return result.dataUrl;
    } catch (error) {
      logger.warn('Web Worker compression failed, using fallback', { component: 'useImageProcessing', action: 'resizeImage' }, error);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = MAX_IMAGE_WIDTH / img.width;
          
          if (scaleSize < 1) {
            canvas.width = MAX_IMAGE_WIDTH;
            canvas.height = img.height * scaleSize;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        };
        img.onerror = reject;
      });
    }
  };

  const loadImage = async (file: File) => {
    const resized = await resizeImage(file);
    setOriginalImage(resized);
    setPreview(resized);
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

