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
    description: "Google Gemini modère le contenu, améliore la qualité, applique un cadre élégant et génère une légende personnalisée en quelques secondes."
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
    title: "Matériel minimal : TV/PC + téléphones",
    description: "C'est la clé de la simplicité : une TV ou vidéoprojecteur + un simple PC. Vos invités utilisent leur téléphone. Plus besoin de cabine photo coûteuse ou de matériel dédié. Fonctionne avec ce que vous avez déjà."
  },
  {
    icon: Camera,
    title: "Photobooth 2.0 Interactif",
    description: "Le nouveau standard des soirées : capturez, partagez et affichez vos photos instantanément. Plus besoin de cabine photo traditionnelle."
  },
  {
    icon: Zap,
    title: "Temps Réel Instantané",
    description: "Affichage en direct sur grand écran (TV, vidéoprojecteur). Vos invités voient leurs photos apparaître en quelques secondes."
  },
  {
    icon: Shield,
    title: "Modération Automatique IA",
    description: "Google Gemini filtre automatiquement le contenu inapproprié. Vos soirées restent professionnelles sans intervention manuelle."
  },
  {
    icon: Trophy,
    title: "Gamification & Engagement",
    description: "Battles photos, classements, badges et likes. Transformez vos invités en créateurs actifs et maintenez l'énergie toute la soirée."
  },
  {
    icon: Palette,
    title: "Cadres Premium & Filtres",
    description: "Cadres élégants (Polaroid, néon, or, personnalisés) et effets visuels pour sublimer chaque photo. Qualité professionnelle garantie."
  },
  {
    icon: Video,
    title: "Aftermovie Automatique",
    description: "Génération automatique d'une vidéo timelapse en fin d'événement avec effets visuels. Parfait pour les réseaux sociaux et souvenirs."
  },
  {
    icon: Search,
    title: "Recherche Intelligente IA",
    description: "Retrouvez vos photos facilement grâce à la reconnaissance faciale et la recherche sémantique. Plus besoin de scroller des heures."
  },
  {
    icon: Download,
    title: "Export HD Professionnel",
    description: "Téléchargez toutes vos photos en haute qualité ou exportez en ZIP pour archivage. Idéal pour créer des albums souvenirs."
  }
];

export const ADVANTAGES: Advantage[] = [
  {
    icon: CheckCircle,
    title: "C'est la clé : matériel minimal requis",
    description: "C'est tout ce dont vous avez besoin : une TV ou un vidéoprojecteur + un simple PC. Vos invités utilisent leur téléphone (aucune app à télécharger). Pas de matériel photo coûteux, pas de cabine dédiée. Accès instantané via QR code, compatible avec tous les smartphones."
  },
  {
    icon: Clock,
    title: "Prêt en 15 minutes",
    description: "Configuration ultra-rapide : branchez votre PC à la TV ou vidéoprojecteur, c'est tout ! Support à distance si besoin. Idéal pour les événements de dernière minute. Aucun matériel spécifique ou coûteux requis."
  },
  {
    icon: Lock,
    title: "Sécurité & Modération IA",
    description: "Modération automatique par Google Gemini pour garantir un contenu approprié. Contrôle total pour les organisateurs avec modération manuelle si besoin. Vos soirées restent professionnelles même en mode fête."
  },
  {
    icon: TrendingUp,
    title: "Engagement viral garanti",
    description: "Transformez vos invités en créateurs actifs. Gamification, battles photos et interactions en temps réel maintiennent l'énergie toute la soirée. Vos événements deviennent mémorables et partageables sur les réseaux sociaux."
  },
  {
    icon: Settings,
    title: "Multi-événements pour agences",
    description: "Architecture SaaS permettant de gérer plusieurs événements simultanément. Parfait pour les agences événementielles qui veulent proposer un concept innovant à leurs clients. Facturation par événement ou abonnement."
  },
  {
    icon: Award,
    title: "Qualité professionnelle automatique",
    description: "Amélioration automatique des photos par IA, cadres élégants et légendes personnalisées. Résultat digne d'un photographe professionnel, sans le coût ni la logistique. Vos invités repartent avec des photos de qualité."
  }
];

export const USE_CASES: UseCase[] = [
  {
    icon: Heart,
    title: "Mariages & Cérémonies",
    description: "Le nouveau concept qui remplace le photobooth traditionnel. Vos invités créent un mur de souvenirs en temps réel avec légendes personnalisées par IA. Galerie privée post-événement pour les mariés. Parfait pour les mariages modernes qui cherchent une expérience unique."
  },
  {
    icon: Users,
    title: "Événements d'entreprise & Pros",
    description: "Team building, séminaires, lancements produits, soirées d'entreprise. Animation interactive qui renforce la cohésion d'équipe et crée du contenu partageable. Idéal pour les entreprises qui veulent se démarquer avec un concept innovant."
  },
  {
    icon: Trophy,
    title: "Soirées privées & Agences",
    description: "Anniversaires, fêtes de famille, soirées privées, événements clients. Le concept viral qui transforme chaque invité en photographe. Parfait pour les agences événementielles qui cherchent à proposer une nouvelle expérience à leurs clients. Engagement garanti."
  }
];

