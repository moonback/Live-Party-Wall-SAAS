import { 
  Camera, Sparkles, Monitor, Zap, Shield, Trophy, Palette, Video, 
  Search, Download, CheckCircle, Clock, Lock, TrendingUp, Settings, 
  Award, Heart, Users
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
    icon: Camera,
    title: "Partagez votre moment",
    description: "Les invités prennent une photo, choisissent une image dans leur galerie ou créent un collage original avec des modèles prédéfinis."
  },
  {
    number: 2,
    icon: Sparkles,
    title: "La magie de l'IA opère",
    description: "Google Gemini analyse, modère, améliore la qualité, applique un cadre décoratif et génère une légende personnalisée."
  },
  {
    number: 3,
    icon: Monitor,
    title: "Affichage sur grand écran",
    description: "En quelques secondes, la photo sublimée apparaît sur le mur interactif où tous peuvent la voir et interagir."
  }
];

export const FEATURES: Feature[] = [
  {
    icon: Camera,
    title: "Photobooth Interactif",
    description: "Capturez et partagez vos moments en temps réel avec prise de photo, galerie et collage"
  },
  {
    icon: Zap,
    title: "Temps Réel",
    description: "Affichage instantané sur grand écran via WebSockets, compatible TV et vidéoprojecteur"
  },
  {
    icon: Shield,
    title: "Modération IA",
    description: "Filtrage automatique par Google Gemini pour garantir un contenu approprié"
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Battles photos, badges, classements et système de likes pour maximiser l'engagement"
  },
  {
    icon: Palette,
    title: "Cadres & Filtres",
    description: "Cadres décoratifs (Polaroid, néon, or) et effets visuels pour sublimer chaque photo"
  },
  {
    icon: Video,
    title: "Aftermovie Auto",
    description: "Génération automatique de vidéos timelapse en fin d'événement avec effets visuels"
  },
  {
    icon: Search,
    title: "Recherche IA",
    description: "Retrouvez vos photos avec l'IA grâce à la reconnaissance faciale et la recherche sémantique"
  },
  {
    icon: Download,
    title: "Export HD",
    description: "Téléchargez toutes vos photos en haute qualité ou exportez en ZIP pour archivage"
  }
];

export const ADVANTAGES: Advantage[] = [
  {
    icon: CheckCircle,
    title: "Zéro installation",
    description: "100% web, aucune application à télécharger. Vos invités accèdent directement via QR code ou lien. Compatible avec tous les appareils (smartphone, tablette, ordinateur)."
  },
  {
    icon: Clock,
    title: "Configuration en 15 minutes",
    description: "Support setup à distance avant votre événement. Aucun matériel spécifique requis, juste un écran (TV, vidéoprojecteur) et une connexion internet."
  },
  {
    icon: Lock,
    title: "Sécurité & Modération",
    description: "Modération automatique par IA pour garantir un contenu approprié. Contrôle total pour les organisateurs avec possibilité de modération manuelle."
  },
  {
    icon: TrendingUp,
    title: "Engagement maximal",
    description: "Transformez les spectateurs passifs en créateurs actifs. Gamification, battles photos et interactions en temps réel pour maintenir l'énergie tout au long de l'événement."
  },
  {
    icon: Settings,
    title: "Multi-événements",
    description: "Architecture SaaS permettant de gérer plusieurs événements simultanément. Parfait pour les agences événementielles et organisateurs professionnels."
  },
  {
    icon: Award,
    title: "Qualité professionnelle",
    description: "Amélioration automatique des photos par IA, cadres élégants et légendes personnalisées. Résultat digne d'un photographe professionnel, sans le coût."
  }
];

export const USE_CASES: UseCase[] = [
  {
    icon: Heart,
    title: "Mariages",
    description: "Mur de souvenirs partagés avec légendes personnalisées, cadres élégants et galerie privée post-événement pour les mariés."
  },
  {
    icon: Users,
    title: "Événements d'entreprise",
    description: "Team building, séminaires, lancements produits. Animation interactive pour renforcer la cohésion d'équipe et l'engagement."
  },
  {
    icon: Trophy,
    title: "Soirées & Fêtes",
    description: "Anniversaires, fêtes de famille, soirées privées. Créez une animation collective qui transforme chaque invité en photographe."
  }
];

