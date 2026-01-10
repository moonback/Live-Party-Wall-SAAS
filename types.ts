import React from 'react';

export type MediaType = 'photo' | 'video';

// Types de réactions disponibles
export type ReactionType = 'heart' | 'laugh' | 'cry' | 'fire' | 'wow' | 'thumbsup';

// Configuration des réactions avec emojis
export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

// Compteur de réactions par type
export interface ReactionCounts {
  heart?: number;
  laugh?: number;
  cry?: number;
  fire?: number;
  wow?: number;
  thumbsup?: number;
}

export interface Photo {
  id: string;
  url: string; // Base64 data URL ou URL Supabase Storage
  caption: string;
  author: string;
  timestamp: number;
  likes_count: number;
  type: MediaType; // 'photo' ou 'video'
  duration?: number; // Durée en secondes (pour les vidéos)
  orientation?: 'portrait' | 'landscape' | 'square' | 'unknown'; // ⚡ Précalculé pour performance
  reactions?: ReactionCounts; // Compteurs de réactions par type
  tags?: string[]; // Tags suggérés par l'IA (ex: ['sourire', 'groupe', 'danse', 'fête'])
  user_description?: string; // Description saisie par l'utilisateur lors de l'upload
}

export type ViewMode = 'landing' | 'guest' | 'wall' | 'admin' | 'gallery' | 'projection' | 'collage' | 'help' | 'onboarding' | 'stats' | 'stats-display' | 'mobile-control' | 'findme' | 'battle-results' | 'guest-profile';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// Gamification Types
export type BadgeType = 
  | 'photographer' // Plus de photos
  | 'star' // Photo la plus likée
  | 'early_bird' // Première photo
  | 'popular' // Plus de likes totaux
  | 'consistent' // Photos régulières
  | 'quality' // Meilleure moyenne de likes
  | 'social_butterfly' // Plus de réactions reçues
  | 'trending' // Photo en hausse
  | 'viral' // Photo avec beaucoup de réactions
  | 'dedicated' // Beaucoup de photos en peu de temps
  | 'influencer' // Meilleur ratio likes/photos
  | 'reaction_master'; // Plus de réactions variées

export interface Badge {
  type: BadgeType;
  label: string;
  emoji: string;
  description: string;
  color: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'; // Rareté du badge
}

export interface AuthorStats {
  author: string;
  photoCount: number;
  totalLikes: number;
  averageLikes: number;
  totalReactions: number; // Total de toutes les réactions reçues
  reactionVariety: number; // Nombre de types de réactions différents reçus
  badges: Badge[];
  score: number; // Score total de gamification
  firstPhotoTimestamp?: number; // Timestamp de la première photo
  lastPhotoTimestamp?: number; // Timestamp de la dernière photo
}

export interface LeaderboardEntry {
  rank: number;
  author: string;
  photoCount: number;
  totalLikes: number;
  totalReactions: number;
  badges: Badge[];
  score: number; // Score pour le classement
}

export interface PhotoBadge {
  photoId: string;
  badge: Badge;
  reason: string;
}

// Gallery Types
export type SortOption = 'recent' | 'popular';
export type MediaFilter = MediaType | 'all';

export interface FilterOptions {
  sortBy: SortOption;
  searchQuery: string;
  mediaFilter: MediaFilter;
  selectedAuthors: string[]; // Filtre par auteur(s) - tableau vide = tous les auteurs
}

export interface GuestPhotoCardProps {
  photo: Photo;
  isLiked: boolean;
  onLike: (id: string) => void;
  onDownload: (photo: Photo) => void;
  allPhotos: Photo[];
  index?: number;
  userReaction?: ReactionType | null; // Réaction actuelle de l'utilisateur
  onReaction?: (photoId: string, reactionType: ReactionType | null) => void; // Callback pour ajouter/changer/supprimer une réaction
}

export interface VirtualColumnProps {
  data: Photo[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  likedPhotoIds: Set<string>;
  onLike: (id: string) => void;
  onDownload: (photo: Photo) => void;
  allPhotos: Photo[];
}

// Aftermovie (timelapse) Types
export type AftermovieStage = 'idle' | 'loading' | 'rendering' | 'encoding' | 'done';

export interface AftermovieProgress {
  stage: AftermovieStage;
  processed: number;
  total: number;
  message?: string;
}

export interface AftermovieOptions {
  width: number;
  height: number;
  fps: number;
  /**
   * Durée d’affichage par photo, en millisecondes.
   * La durée totale finale vaut: photos.length * msPerPhoto.
   */
  msPerPhoto: number;
  /**
   * Bitrate vidéo cible (bps). Exemple: 12_000_000 pour ~12 Mbps.
   */
  videoBitsPerSecond: number;
  /**
   * Ajoute un titre (texte) en overlay.
   */
  includeTitle: boolean;
  titleText?: string;
  /**
   * Ajoute le cadre décoratif (PNG) par dessus chaque frame, si fourni.
   */
  includeDecorativeFrame: boolean;
  decorativeFrameUrl?: string | null;
  /**
   * Couleur de fond (utile si l’image ne remplit pas).
   */
  backgroundColor?: string;
  /**
   * MimeType forcé pour MediaRecorder. Si absent, on choisit le meilleur supporté.
   */
  mimeType?: string;
  
  // Améliorations visuelles
  enableKenBurns?: boolean;
  enableSmartDuration?: boolean;
  enableIntroOutro?: boolean;
  enableComicsStyle?: boolean;
  
  // Transitions entre photos
  transitionType?: TransitionType;
  transitionDuration?: number; // Durée de la transition en ms
  randomTransitions?: boolean; // Si true, utilise des transitions aléatoires
}

export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom-in' | 'zoom-out' | 'cross-fade' | 'wipe-left' | 'wipe-right';

export interface AftermovieAudioOptions {
  file: File;
  loop: boolean;
  volume: number; // 0..1
}

export interface AftermovieResult {
  blob: Blob;
  mimeType: string;
  filename: string;
  durationSeconds: number;
}

// Types pour les données Supabase (raw database rows)
export interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  author: string | null;
  created_at: string;
  likes_count: number;
  type: 'photo' | 'video';
  duration: number | null;
  tags: string[] | null; // Tags suggérés par l'IA (tableau JSON)
  user_description: string | null; // Description saisie par l'utilisateur
}

export interface LikeRow {
  id: string;
  photo_id: string;
  user_identifier: string;
  created_at: string;
}

export interface ReactionRow {
  id: string;
  photo_id: string;
  user_identifier: string;
  reaction_type: ReactionType;
  created_at: string;
  updated_at: string;
}

// Photo Battle Types
export type BattleStatus = 'active' | 'finished' | 'cancelled';

export interface PhotoBattle {
  id: string;
  photo1: Photo;
  photo2: Photo;
  status: BattleStatus;
  winnerId: string | null;
  votes1Count: number;
  votes2Count: number;
  createdAt: number;
  finishedAt: number | null;
  expiresAt: number | null;
  userVote?: string | null; // ID de la photo pour laquelle l'utilisateur a voté (null si pas voté)
}

export interface BattleRow {
  id: string;
  photo1_id: string;
  photo2_id: string;
  status: BattleStatus;
  winner_id: string | null;
  votes1_count: number;
  votes2_count: number;
  created_at: string;
  finished_at: string | null;
  expires_at: string | null;
}

export interface BattleVoteRow {
  id: string;
  battle_id: string;
  user_identifier: string;
  voted_for_photo_id: string;
  created_at: string;
}

// Guest Types
export interface Guest {
  id: string;
  name: string;
  avatarUrl: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuestRow {
  id: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedGuest {
  id: string;
  name: string;
  blockedAt: number;
  expiresAt: number;
  createdAt: number;
}

export interface BlockedGuestRow {
  id: string;
  name: string;
  blocked_at: string;
  expires_at: string;
  created_at: string;
}

// Event Types (Multi-tenant SaaS)
export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EventRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EventOrganizer {
  id: string;
  event_id: string;
  user_id: string;
  role: 'owner' | 'organizer' | 'viewer';
  created_at: string;
}

export interface EventOrganizerRow {
  id: string;
  event_id: string;
  user_id: string;
  role: 'owner' | 'organizer' | 'viewer';
  created_at: string;
}