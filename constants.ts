export const APP_NAME = "Partywall";

// ============================================================================
// RÉ-EXPORTS DEPUIS LA CONFIGURATION GEMINI (RÉTROCOMPATIBILITÉ)
// ============================================================================
// Les prompts et fonctions sont maintenant centralisés dans config/geminiConfig.ts
// Ces exports sont maintenus pour la rétrocompatibilité avec le code existant

export { CAPTION_PROMPT_BASE as CAPTION_PROMPT, buildPersonalizedCaptionPrompt } from './config/geminiConfig';

// Maximum number of photos to keep in memory to prevent crash
export const MAX_PHOTOS_HISTORY = 150;

// ⚡ Minimum number of photos to display (optimisé pour 200+ photos)
export const MIN_PHOTOS_DISPLAYED = 200;

// Placeholder for simulated data
export const PLACEHOLDER_AVATAR = "https://picsum.photos/50/50";

// Image processing constants
export const MAX_IMAGE_WIDTH = 1000; // Non utilisé (conservé pour compatibilité)
export const IMAGE_QUALITY = 0.9; // Non utilisé (conservé pour compatibilité)
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (augmenté pour supporter HD/Full HD)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
// Résolutions HD minimales
export const MIN_HD_WIDTH = 1280;
export const MIN_HD_HEIGHT = 720;
export const MIN_FULL_HD_WIDTH = 1920;
export const MIN_FULL_HD_HEIGHT = 1080;

// Video processing constants
export const MAX_VIDEO_DURATION = 20; // 20 secondes max
export const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

// Aftermovie (timelapse) presets
export const AFTERMOVIE_PRESETS = {
  '720p': {
    label: 'HD (720p)',
    width: 1280,
    height: 720,
    fps: 30,
    videoBitsPerSecond: 6_000_000
  },
  '1080p': {
    label: 'Full HD (1080p)',
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitsPerSecond: 12_000_000
  },
  'story': {
    label: 'Story (9:16)',
    width: 1080,
    height: 1920,
    fps: 30,
    videoBitsPerSecond: 10_000_000
  }
} as const;

export type AftermoviePresetKey = keyof typeof AFTERMOVIE_PRESETS;

export const AFTERMOVIE_DEFAULT_TARGET_SECONDS = 60;
export const AFTERMOVIE_MIN_MS_PER_PHOTO = 50;
export const AFTERMOVIE_MAX_MS_PER_PHOTO = 5000;
export const AFTERMOVIE_DEFAULT_TRANSITION_DURATION = 1500; // 1500ms par défaut
export const AFTERMOVIE_MIN_TRANSITION_DURATION = 100;
export const AFTERMOVIE_MAX_TRANSITION_DURATION = 5000;

// Limites de performance pour prévenir les crashes
export const AFTERMOVIE_MAX_PHOTOS_RECOMMENDED = 200; // Nombre recommandé de photos max
export const AFTERMOVIE_MAX_PHOTOS_HARD_LIMIT = 500; // Limite absolue (avertissement fort)
export const AFTERMOVIE_WARNING_PHOTOS_THRESHOLD = 100; // Seuil d'avertissement (performance peut être lente)

// Camera constants - Configuration HD/Full HD
export const CAMERA_VIDEO_CONSTRAINTS = {
  facingMode: 'user' as const,
  width: { ideal: 1920, min: 1280 }, // Full HD idéal, HD minimum
  height: { ideal: 1080, min: 720 }   // Full HD idéal, HD minimum
};

// Auto-scroll constants
export const AUTO_SCROLL_SPEED = 0.3; // pixels per frame
export const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

// Kiosque mode constants
export const KIOSQUE_DEFAULT_INTERVAL = 5000; // 5 seconds par défaut
export const KIOSQUE_TRANSITION_DURATION = 1000; // 1 seconde pour les transitions
export const KIOSQUE_TRANSITION_TYPES = ['fade', 'slide', 'zoom'] as const;
export type KiosqueTransitionType = typeof KIOSQUE_TRANSITION_TYPES[number];

// Author name constants
export const MAX_AUTHOR_NAME_LENGTH = 50;
export const MIN_AUTHOR_NAME_LENGTH = 1;

// User description constants
export const MAX_USER_DESCRIPTION_LENGTH = 500;

// Collage mode constants
export const MIN_COLLAGE_PHOTOS = 2;
export const MAX_COLLAGE_PHOTOS = 4;
export const COLLAGE_GAP = 10; // Espacement entre les images en pixels

// Burst mode constants
export const BURST_MIN_PHOTOS = 3;
export const BURST_MAX_PHOTOS = 5;
export const BURST_DEFAULT_PHOTOS = 3;
export const BURST_CAPTURE_INTERVAL = 2000; // Intervalle entre chaque capture en ms (2 secondes)

// Wall View Layout Modes
export const WALL_LAYOUT_MODES = ['masonry', 'grid'] as const;
export type WallLayoutMode = typeof WALL_LAYOUT_MODES[number];

// AR Scene (Scène Augmentée) constants
export const AR_DEFAULT_LIKES_THRESHOLD = 5; // Seuil de likes pour déclencher un effet

// Réactions avec emojis
export const REACTIONS: Record<import('./types').ReactionType, import('./types').ReactionConfig> = {
  heart: {
    type: 'heart',
    emoji: '❤️',
    label: 'Cœur',
    color: 'text-red-500'
  },
  laugh: {
    type: 'laugh',
    emoji: '😂',
    label: 'Rire',
    color: 'text-yellow-500'
  },
  cry: {
    type: 'cry',
    emoji: '😢',
    label: 'Je pleure',
    color: 'text-blue-500'
  },
  fire: {
    type: 'fire',
    emoji: '🔥',
    label: 'Feu',
    color: 'text-orange-500'
  },
  wow: {
    type: 'wow',
    emoji: '😮',
    label: 'Wow !',
    color: 'text-purple-500'
  },
  thumbsup: {
    type: 'thumbsup',
    emoji: '👍',
    label: 'Bravo !',
    color: 'text-green-500'
  }
};

// Liste des réactions disponibles (pour itération)
export const REACTION_TYPES = Object.keys(REACTIONS) as import('./types').ReactionType[];
export const AR_DEFAULT_TIME_WINDOW = 15; // Fenêtre de temps en minutes pour ouverture/fermeture
export const AR_APPLAUSE_THRESHOLD = 0.6; // Seuil de détection d'applaudissements (0-1)
export const AR_EFFECT_DURATION = {
  fireworks: 15000
} as const;
