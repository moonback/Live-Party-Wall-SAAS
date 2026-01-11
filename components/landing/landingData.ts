import { 
  Camera, Sparkles, Monitor, Zap, Shield, Trophy, Palette, Video, 
  Search, Download, CheckCircle, Clock, Lock, TrendingUp, Settings, 
  Award, Heart, Users, QrCode, Globe, Smartphone, Share2, PartyPopper, 
  Smile, Upload, Layers, Image, BarChart3, UserCog, Eye, Swords, 
  FileVideo, Share, FileDown, Cookie
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean; // Pour mettre en avant certaines features dans le design
  category?: 'guest' | 'organizer'; // Catégorie de la fonctionnalité
}

export interface Advantage {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const STEPS: Step[] = [
  {
    number: 1,
    icon: QrCode,
    title: "Créez votre événement",
    description: "En moins de 2 minutes, votre mur photo est prêt. Partagez le QR code avec vos invités.",
  },
  {
    number: 2,
    icon: Share2,
    title: "Partagez le QR code",
    description: "Vos invités scannent et accèdent instantanément. Aucune app à télécharger, ça fonctionne sur tous les smartphones."
  },
  {
    number: 3,
    icon: Camera,
    title: "Les invités envoient leurs photos",
    description: "Selfies, photos de groupe, moments volés... Vos invités partagent leurs meilleurs clichés en direct."
  },
  {
    number: 4,
    icon: Monitor,
    title: "Les photos s'affichent en direct",
    description: "Chaque photo apparaît instantanément sur le mur. L'IA les sublime automatiquement, l'ambiance monte en puissance."
  }
];

// Fonctionnalités pour les invités
export const GUEST_FEATURES: Feature[] = [
  {
    icon: Upload,
    title: "Upload instantané",
    description: "Photo/vidéo avec compression automatique. Partagez vos meilleurs moments en quelques secondes, même avec une connexion limitée.",
    category: 'guest',
    highlight: true
  },
  {
    icon: Layers,
    title: "Mode collage",
    description: "Assemblez jusqu'à 4 photos dans un seul cliché. Créez des compositions créatives et partagez vos souvenirs groupés.",
    category: 'guest'
  },
  {
    icon: Camera,
    title: "Photobooth interactif",
    description: "Filtres et cadres en temps réel. Transformez vos selfies avec des effets professionnels et des cadres élégants.",
    category: 'guest',
    highlight: true
  },
  {
    icon: Heart,
    title: "Likes & réactions",
    description: "6 types d'émojis disponibles (❤️ 😂 😢 🔥 😮 👍). Exprimez vos émotions et interagissez avec les photos de la soirée.",
    category: 'guest'
  },
  {
    icon: Search,
    title: "Recherche IA 'Retrouve-moi'",
    description: "Reconnaissance faciale pour retrouver toutes vos photos sur le mur. Retrouvez-vous instantanément dans les centaines de clichés partagés.",
    category: 'guest'
  },
  {
    icon: Download,
    title: "Téléchargement",
    description: "Export individuel ou ZIP groupé. Récupérez vos photos en haute définition, une par une ou toutes ensemble après l'événement.",
    category: 'guest'
  },
  {
    icon: Trophy,
    title: "Gamification avancée",
    description: "12 badges, système de points, milestones et classements dynamiques. Transformez-vous en star de la soirée et montez dans le classement.",
    category: 'guest',
    highlight: true
  },
  {
    icon: Shield,
    title: "Conformité RGPD",
    description: "Gestion des cookies, politique de confidentialité, droits des utilisateurs. Vos données sont protégées et vous gardez le contrôle.",
    category: 'guest'
  }
];

// Fonctionnalités pour les organisateurs
export const ORGANIZER_FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: "Dashboard temps réel",
    description: "Statistiques live de votre événement. Suivez l'engagement, les photos partagées et l'activité en direct.",
    category: 'organizer',
    highlight: true
  },
  {
    icon: Users,
    title: "Multi-événements",
    description: "Architecture SaaS complète. Gérez plusieurs événements en parallèle depuis une interface unique. Idéal pour les agences.",
    category: 'organizer',
    highlight: true
  },
  {
    icon: Shield,
    title: "Modération IA",
    description: "Filtrage automatique du contenu inapproprié. L'IA veille au grain pour une diffusion sereine, même en contexte professionnel.",
    category: 'organizer'
  },
  {
    icon: Settings,
    title: "Personnalisation",
    description: "Paramètres granulaires pour personnaliser votre événement. Cadres, notifications, modération, tout est configurable.",
    category: 'organizer'
  },
  {
    icon: Monitor,
    title: "Mode projection",
    description: "Optimisé pour grand écran. Affichez le mur sur votre TV ou écran de projection avec une interface adaptée et fluide.",
    category: 'organizer'
  },
  {
    icon: Swords,
    title: "Battles photos",
    description: "Créez des duels votés en direct. Organisez des compétitions amusantes et engagez vos invités avec des défis photos.",
    category: 'organizer'
  },
  {
    icon: FileVideo,
    title: "Aftermovie avancé",
    description: "Génération de timelapse avec presets (HD, Full HD, Story 9:16). Recevez vos vidéos souvenirs dans le format de votre choix.",
    category: 'organizer'
  },
  {
    icon: Share,
    title: "Partage direct",
    description: "Upload automatique, QR code et lien de téléchargement. Partagez facilement vos aftermovies et galeries avec vos invités.",
    category: 'organizer'
  },
  {
    icon: BarChart3,
    title: "Statistiques téléchargements",
    description: "Compteur de téléchargements par aftermovie. Suivez l'engagement et la popularité de vos contenus générés.",
    category: 'organizer'
  },
  {
    icon: UserCog,
    title: "Gestion d'équipe",
    description: "Rôles et permissions. Collaborez avec votre équipe en définissant des rôles (Owner, Organizer, Viewer) pour chaque événement.",
    category: 'organizer'
  }
];

// Liste combinée pour compatibilité (ancien code)
export const FEATURES: Feature[] = [...GUEST_FEATURES, ...ORGANIZER_FEATURES];

export const ADVANTAGES: Advantage[] = [
  {
    icon: CheckCircle,
    title: "Pas besoin de compte pour les invités",
    description: "Vos invités scannent le QR code et partagent leurs photos immédiatement. Aucune inscription, aucun compte à créer. Simple et rapide."
  },
  {
    icon: Shield,
    title: "Sécurisé et modéré",
    description: "L'IA modère automatiquement les contenus inappropriés. Vous gardez le contrôle total avec une modération manuelle si nécessaire."
  },
  {
    icon: Smartphone,
    title: "Fonctionne sur tous les smartphones",
    description: "iOS, Android, tous les navigateurs. Vos invités utilisent leur téléphone habituel, aucune app spéciale requise."
  },
  {
    icon: Zap,
    title: "Installation en moins de 2 minutes",
    description: "Créez votre événement, partagez le QR code, c'est prêt. Idéal pour les installations de dernière minute ou les événements spontanés."
  },
  {
    icon: Heart,
    title: "Créateur d'ambiance garanti",
    description: "Le mur photo devient le point central de votre événement. Il brise la glace et transforme vos invités en paparazzis enthousiastes."
  },
  {
    icon: Download,
    title: "Téléchargement post-événement",
    description: "Récupérez toutes les photos en haute définition après l'événement. Un album collaboratif créé automatiquement par tous vos invités."
  }
];

export const USE_CASES: UseCase[] = [
  {
    icon: Heart,
    title: "Mariages 💍",
    description: "Remplacez les photobooths classiques. Capturez chaque instant, même ceux que le photographe rate. Vos invités créent un album collaboratif unique."
  },
  {
    icon: PartyPopper,
    title: "Soirées privées 🎉",
    description: "Anniversaires, bar mitzvahs, fêtes entre amis. Transformez vos invités en paparazzis et créez une dynamique visuelle inoubliable."
  },
  {
    icon: Users,
    title: "Événements d'entreprise 🏢",
    description: "Séminaires, fêtes de fin d'année, lancements produits. Renforcez la cohésion d'équipe avec une animation moderne et fédératrice."
  },
  {
    icon: PartyPopper,
    title: "Festivals 🎶",
    description: "Engagez votre public et créez du contenu viral. Les festivaliers partagent leurs meilleurs moments, vous récupérez un album événement unique."
  }
];
