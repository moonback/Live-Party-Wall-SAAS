/**
 * Utilitaires pour créer des collages à partir de plusieurs images
 */

export type CollageTemplate = '2x2' | '1+3' | '3+1' | '2+2' | '1+2' | '2+1';

export interface CollageLayout {
  template: CollageTemplate;
  slots: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Définit les layouts pour chaque template de collage
 */
const COLLAGE_LAYOUTS: Record<CollageTemplate, CollageLayout> = {
  '2x2': {
    template: '2x2',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 }, // Top-left
      { x: 0.5, y: 0, width: 0.5, height: 0.5 }, // Top-right
      { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-left
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-right
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
  '1+3': {
    template: '1+3',
    slots: [
      { x: 0, y: 0, width: 1, height: 0.6 }, // Top (large)
      { x: 0, y: 0.6, width: 0.333, height: 0.4 }, // Bottom-left
      { x: 0.333, y: 0.6, width: 0.333, height: 0.4 }, // Bottom-center
      { x: 0.666, y: 0.6, width: 0.334, height: 0.4 }, // Bottom-right
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
  '3+1': {
    template: '3+1',
    slots: [
      { x: 0, y: 0, width: 0.333, height: 0.4 }, // Top-left
      { x: 0.333, y: 0, width: 0.333, height: 0.4 }, // Top-center
      { x: 0.666, y: 0, width: 0.334, height: 0.4 }, // Top-right
      { x: 0, y: 0.4, width: 1, height: 0.6 }, // Bottom (large)
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
  '2+2': {
    template: '2+2',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 }, // Top-left
      { x: 0.5, y: 0, width: 0.5, height: 0.5 }, // Top-right
      { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-left
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-right
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
  '1+2': {
    template: '1+2',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 1 }, // Left (large)
      { x: 0.5, y: 0, width: 0.5, height: 0.5 }, // Top-right
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-right
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
  '2+1': {
    template: '2+1',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5 }, // Top-left
      { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // Bottom-left
      { x: 0.5, y: 0, width: 0.5, height: 1 }, // Right (large)
    ],
    canvasWidth: 2000,
    canvasHeight: 2000,
  },
};

/**
 * Charge une image depuis une data URL
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Redimensionne et recadre une image pour remplir un slot
 */
const fitImageInSlot = (
  img: HTMLImageElement,
  slotWidth: number,
  slotHeight: number
): { sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number } => {
  const imgAspect = img.width / img.height;
  const slotAspect = slotWidth / slotHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  if (imgAspect > slotAspect) {
    // Image plus large que le slot : recadrer la largeur
    sourceWidth = img.height * slotAspect;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    // Image plus haute que le slot : recadrer la hauteur
    sourceHeight = img.width / slotAspect;
    sourceY = (img.height - sourceHeight) / 2;
  }

  return { sourceX, sourceY, sourceWidth, sourceHeight };
};

/**
 * Crée un collage à partir de plusieurs images selon un template
 * @param images - Array de data URLs (2-4 images)
 * @param template - Template de collage à utiliser
 * @param gap - Espacement entre les images en pixels (défaut: 10)
 * @returns Promise résolue avec la data URL du collage
 */
export const createCollage = async (
  images: string[],
  template: CollageTemplate,
  gap: number = 10
): Promise<string> => {
  if (images.length < 2 || images.length > 4) {
    throw new Error('Le collage nécessite entre 2 et 4 images');
  }

  const layout = COLLAGE_LAYOUTS[template];
  const numSlots = layout.slots.length;
  const numImages = images.length;

  // Si on a moins d'images que de slots, on utilise seulement les premiers slots
  const slotsToUse = layout.slots.slice(0, numImages);

  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas');
  }

  // Fond blanc
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Charger toutes les images
  const loadedImages = await Promise.all(images.map(loadImage));

  // Dessiner chaque image dans son slot
  for (let i = 0; i < loadedImages.length && i < slotsToUse.length; i++) {
    const slot = slotsToUse[i];
    const img = loadedImages[i];

    // Calculer les dimensions du slot avec gap
    const slotX = slot.x * canvas.width + gap;
    const slotY = slot.y * canvas.height + gap;
    const slotWidth = slot.width * canvas.width - gap * 2;
    const slotHeight = slot.height * canvas.height - gap * 2;

    // Calculer le recadrage pour remplir le slot
    const { sourceX, sourceY, sourceWidth, sourceHeight } = fitImageInSlot(
      img,
      slotWidth,
      slotHeight
    );

    // Dessiner l'image dans le slot
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      slotX,
      slotY,
      slotWidth,
      slotHeight
    );
  }

  // Qualité maximale HD pour les collages
  return canvas.toDataURL('image/jpeg', 1.0);
};

/**
 * Obtient le nombre d'images requis pour un template
 */
export const getRequiredImagesForTemplate = (template: CollageTemplate): number => {
  return COLLAGE_LAYOUTS[template].slots.length;
};

/**
 * Obtient tous les templates disponibles
 */
export const getAvailableTemplates = (): CollageTemplate[] => {
  return Object.keys(COLLAGE_LAYOUTS) as CollageTemplate[];
};

/**
 * Obtient les templates compatibles avec un nombre d'images donné
 */
export const getTemplatesForImageCount = (imageCount: number): CollageTemplate[] => {
  return getAvailableTemplates().filter(
    (template) => getRequiredImagesForTemplate(template) <= imageCount
  );
};

