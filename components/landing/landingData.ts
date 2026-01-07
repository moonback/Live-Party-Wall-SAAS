import { 
  Camera, Sparkles, Monitor, Zap, Shield, Trophy, Palette, Video, 
  Search, Download, CheckCircle, Clock, Lock, TrendingUp, Settings, 
  Award, Heart, Users, QrCode
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
    title: "Scannez le QR code",
    description: "Vos invités scannent le QR code avec leur smartphone. Accès instantané en 2 secondes, aucune application à télécharger. Compatible avec tous les téléphones."
  },
  {
    number: 2,
    icon: Camera,
    title: "Capturez vos meilleurs moments",
    description: "Prenez une photo en direct, choisissez dans votre galerie ou créez un collage. Chaque instant devient une œuvre partagée instantanément."
  },
  {
    number: 3,
    icon: Sparkles,
    title: "L'IA sublime automatiquement",
    description: "IA  modère le contenu, améliore la qualité, applique un cadre élégant et génère une légende personnalisée en quelques secondes."
  },
  {
    number: 4,
    icon: Monitor,
    title: "Affichage en temps réel sur grand écran",
    description: "Votre photo apparaît instantanément sur le mur interactif projeté sur votre TV ou vidéoprojecteur (connecté à un simple PC). Tous les invités voient le résultat en direct. C'est tout le matériel dont vous avez besoin !"
  }
];

export const FEATURES: Feature[] = [
  {
    icon: Monitor,
    title: "TV/PC + Téléphones",
    description: "C'est tout. TV ou vidéoprojecteur + PC. Vos invités utilisent leur téléphone. Zéro matériel coûteux."
  },
  {
    icon: Camera,
    title: "Photobooth 2.0",
    description: "Capturez, partagez, affichez instantanément. Le nouveau standard qui remplace la cabine photo traditionnelle."
  },
  {
    icon: Zap,
    title: "Temps Réel",
    description: "Affichage instantané sur grand écran. Vos invités voient leurs photos en quelques secondes."
  },
  {
    icon: Shield,
    title: "Modération IA",
    description: "IA  filtre automatiquement. Soirées professionnelles garanties, sans intervention."
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Battles, classements, badges. Transformez vos invités en créateurs actifs. Énergie garantie."
  },
  {
    icon: Palette,
    title: "Cadres Premium",
    description: "Cadres élégants (Polaroid, néon, or) et effets visuels. Qualité professionnelle automatique."
  },
  {
    icon: Video,
    title: "Aftermovie Auto",
    description: "Vidéo timelapse générée automatiquement en fin d'événement. Parfait pour réseaux sociaux."
  },
  {
    icon: Download,
    title: "Export HD",
    description: "Téléchargez toutes vos photos en haute qualité ou exportez en ZIP. Albums souvenirs garantis."
  }
];

export const ADVANTAGES: Advantage[] = [
  {
    icon: CheckCircle,
    title: "Matériel minimal : TV/PC + téléphones",
    description: "C'est tout. TV ou vidéoprojecteur + PC. Vos invités utilisent leur téléphone. Pas d'app, pas de matériel coûteux. QR code = accès instantané."
  },
  {
    icon: Clock,
    title: "Prêt en 15 minutes",
    description: "Branchez PC → TV, c'est tout. Support à distance inclus. Parfait pour événements de dernière minute. Zéro matériel spécifique."
  },
  {
    icon: Lock,
    title: "Modération IA automatique",
    description: "IA  filtre le contenu. Contrôle total organisateur. Soirées professionnelles garanties, même en mode fête."
  },
  {
    icon: TrendingUp,
    title: "Engagement viral garanti",
    description: "Invités = créateurs actifs. Battles, gamification, temps réel. Événements mémorables et partageables sur réseaux sociaux."
  },
  {
    icon: Settings,
    title: "Multi-événements (agences)",
    description: "SaaS pour gérer plusieurs événements simultanément. Le nouveau service à proposer à vos clients. Facturation flexible."
  },
  {
    icon: Award,
    title: "Qualité pro automatique",
    description: "IA améliore photos, cadres élégants, légendes personnalisées. Résultat photographe pro, sans le coût. Photos HD pour vos invités."
  }
];

export const USE_CASES: UseCase[] = [
  {
    icon: Heart,
    title: "Mariages & Cérémonies",
    description: "Remplace le photobooth traditionnel. Mur de souvenirs en temps réel avec IA. Galerie privée post-événement. L'expérience unique que vos invités n'oublieront pas."
  },
  {
    icon: Users,
    title: "Événements d'entreprise",
    description: "Team building, séminaires, lancements. Renforce la cohésion d'équipe et crée du contenu partageable. Le concept innovant qui vous démarque."
  },
  {
    icon: Trophy,
    title: "Soirées privées & Agences",
    description: "Anniversaires, fêtes, événements clients. Transforme chaque invité en photographe. Le nouveau service à proposer à vos clients. Engagement viral garanti."
  }
];

