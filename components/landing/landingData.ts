import { 
  Camera, Sparkles, Monitor, Zap, Shield, Trophy, Palette, Video, 
  Search, Download, CheckCircle, Clock, Lock, TrendingUp, Settings, 
  Award, Heart, Users, QrCode, Globe, Smartphone, Share2, PartyPopper
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
    title: "Scan & Go",
    description: "Un simple QR code. Pas d'app à installer, pas de compte – chaque invité choisit juste son prénom ou pseudo avant d'envoyer sa première photo.",
  },
  {
    number: 2,
    icon: Camera,
    title: "Capturez l'Instant",
    description: "Selfies, photos de groupe ou moments volés : vos invités immortalisent l'événement directement depuis leur propre smartphone."
  },
  {
    number: 3,
    icon: Sparkles,
    title: "Magie de l'IA",
    description: "Chaque photo est instantanément sublimée : qualité améliorée, modération automatique et génération de légendes amusantes par IA."
  },
  {
    number: 4,
    icon: Monitor,
    title: "Gloire sur Grand Écran",
    description: "La photo s'affiche en temps réel sur le mur projeté. L'animation se crée d'elle-même, déclenchant rires et partages immédiats."
  }
];

export const FEATURES: Feature[] = [
  {
    icon: Smartphone,
    title: "Zéro Matériel Requis",
    description: "Oubliez les bornes coûteuses. Une simple connexion TV/PC suffit. Les smartphones de vos invités font tout le travail.",
    highlight: true
  },
  {
    icon: Shield,
    title: "Modération Intelligente",
    description: "Notre IA veille au grain. Contenus inappropriés filtrés automatiquement pour une diffusion sereine, même en contexte pro.",
    highlight: true
  },
  {
    icon: Zap,
    title: "Live Feed Instantané",
    description: "Latence minimale. L'effet de surprise est immédiat lorsque la photo apparaît sur l'écran géant quelques secondes après le clic.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Boostez l'engagement avec des défis photos, des classements et des badges pour les contributeurs les plus actifs.",
  },
  {
    icon: Globe,
    title: "Inclusion Totale",
    description: "Même à distance, les absents peuvent participer via un lien dédié et voir leurs sourires s'afficher sur le mur.",
  },
  {
    icon: Palette,
    title: "Design Premium",
    description: "Des cadres élégants et personnalisables (Polaroid, Néon, Corporate) pour sublimer chaque cliché automatiquement.",
  },
  {
    icon: Video,
    title: "Souvenir Vidéo",
    description: "Recevez automatiquement un aftermovie timelapse dynamique retraçant les meilleurs moments de votre événement.",
  },
  {
    icon: Download,
    title: "Galerie HD",
    description: "Récupérez l'intégralité des photos en haute définition. Un album collaboratif créé sans effort par tous vos invités.",
  }
];

export const ADVANTAGES: Advantage[] = [
  {
    icon: CheckCircle,
    title: "Installation Éclair",
    description: "Branchez, projetez, c'est prêt. En moins de 5 minutes, votre mur photo est opérationnel. Idéal pour les installations de dernière minute."
  },
  {
    icon: Heart,
    title: "Créateur d'Ambiance",
    description: "Le mur photo devient le point central de l'animation. Il brise la glace et incite les invités à interagir et à s'amuser ensemble."
  },
  {
    icon: Lock,
    title: "Sécurité & Privacité",
    description: "Vos données et photos sont sécurisées. Modération IA active + contrôle manuel total pour l'organisateur si nécessaire."
  },
  {
    icon: TrendingUp,
    title: "Viralité Garanties",
    description: "Transformez vos invités en ambassadeurs. L'aspect ludique et interactif booste naturellement le partage sur les réseaux sociaux."
  },
  {
    icon: Settings,
    title: "Gestion Multi-Events",
    description: "Agences, gérez plusieurs événements en parallèle depuis une interface unique. Une nouvelle offre innovante pour vos clients."
  },
  {
    icon: Award,
    title: "Qualité Studio",
    description: "L'IA ne fait pas que modérer, elle embellit. Correction de l'éclairage et cadrage optimisé pour un rendu toujours professionnel."
  }
];

export const USE_CASES: UseCase[] = [
  {
    icon: Heart,
    title: "Mariages Inoubliables",
    description: "Remplacez les jetables et photobooths classiques. Offrez une animation moderne qui capture chaque instant, même ceux que le photographe rate."
  },
  {
    icon: Users,
    title: "Corporate & Team Building",
    description: "Renforcez la cohésion d'équipe. Idéal pour les séminaires, fêtes de fin d'année ou lancements de produits. Moderne et fédérateur."
  },
  {
    icon: PartyPopper,
    title: "Soirées Privées & Clubs",
    description: "Anniversaires, bar mitzvahs ou soirées en club. Transformez la foule en paparazzis et créez une dynamique visuelle unique."
  }
];
