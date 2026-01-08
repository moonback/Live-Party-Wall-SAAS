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
}

export type ViewMode = 'landing' | 'guest' | 'wall' | 'admin' | 'gallery' | 'projection' | 'collage' | 'help' | 'onboarding' | 'stats' | 'stats-display' | 'mobile-control' | 'findme' | 'battle-results' | 'guest-profile';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// Gamification Types
export type BadgeType = 'photographer' | 'star';

export interface Badge {
  type: BadgeType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface AuthorStats {
  author: string;
  photoCount: number;
  totalLikes: number;
  averageLikes: number;
  badges: Badge[];
}

export interface LeaderboardEntry {
  rank: number;
  author: string;
  photoCount: number;
  totalLikes: number;
  badges: Badge[];
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
  subscription_id: string | null; // Lien vers l'abonnement utilisé pour créer cet événement
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
  subscription_id: string | null;
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

// Subscription Types
export type SubscriptionPlanType = 
  | 'monthly_pro' 
  | 'monthly_studio' 
  | 'event_starter' 
  | 'event_pro' 
  | 'event_premium' 
  | 'volume_10' 
  | 'volume_50';

export type SubscriptionStatus = 
  | 'active' 
  | 'expired' 
  | 'cancelled' 
  | 'pending_activation';

export interface SubscriptionFeatures {
  frames_enabled?: boolean;
  aftermovie_enabled?: boolean;
  branding_enabled?: boolean;
  advanced_stats_enabled?: boolean;
  white_label_enabled?: boolean;
  api_access_enabled?: boolean;
  multi_screen_enabled?: boolean;
  custom_frames_enabled?: boolean;
  priority_support_enabled?: boolean;
  [key: string]: boolean | undefined;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlanType;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  events_limit: number | null; // null = illimité pour abonnements mensuels
  photos_per_event_limit: number | null; // null = illimité
  features: SubscriptionFeatures;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlanType;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  events_limit: number | null;
  photos_per_event_limit: number | null;
  features: SubscriptionFeatures;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  event_id: string;
  used_at: string;
}

export interface SubscriptionEventRow {
  id: string;
  subscription_id: string;
  event_id: string;
  used_at: string;
}