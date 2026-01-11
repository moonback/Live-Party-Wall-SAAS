import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Camera, 
  Images, 
  Wand2, 
  Grid3x3, 
  Video, 
  Heart, 
  Download, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Zap,
  Users,
  Smartphone,
  Trophy,
  User,
  Award,
  TrendingUp,
  Search,
  FileVideo,
  Smile,
  X
} from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  content: React.ReactNode;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Démarrage rapide',
      icon: Zap,
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <p className="text-base leading-relaxed">
            Bienvenue sur <span className="text-pink-400 font-semibold">Partywall</span> ! 
            Cette application vous permet de partager vos meilleurs moments en temps réel avec tous les invités.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Prenez une photo</h4>
                <p className="text-sm">Cliquez sur "Prendre une photo" depuis la page d'accueil</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Personnalisez</h4>
                <p className="text-sm">Ajoutez des filtres, des cadres et votre nom</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Partagez</h4>
                <p className="text-sm">Votre photo apparaît instantanément sur le mur et dans la galerie</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'taking-photos',
      title: 'Prendre une photo',
      icon: Camera,
      gradient: 'from-pink-500 via-rose-500 to-purple-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-400" />
                Utilisation de la caméra
              </h4>
              <ul className="space-y-2 text-sm list-disc list-inside ml-2">
                <li>Autorisez l'accès à votre caméra lorsque demandé</li>
                <li>Utilisez le bouton de capture pour prendre une photo</li>
                <li>Un compte à rebours de 3 secondes s'affiche avant la capture</li>
                <li>Vous pouvez basculer entre caméra avant et arrière</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Mode vidéo (si activé)
              </h4>
              <ul className="space-y-2 text-sm list-disc list-inside ml-2">
                <li>Basculez vers le mode vidéo avec l'icône vidéo</li>
                <li>Appuyez sur le bouton d'enregistrement pour démarrer</li>
                <li>La durée maximale est de 30 secondes</li>
                <li>Un indicateur de temps s'affiche pendant l'enregistrement</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                Upload depuis la galerie
              </h4>
              <ul className="space-y-2 text-sm list-disc list-inside ml-2">
                <li>Cliquez sur l'icône de galerie pour sélectionner une photo existante</li>
                <li>Les formats acceptés : JPEG, PNG, WebP</li>
                <li>Taille maximale : 10 MB pour les photos</li>
                <li>Les photos sont automatiquement redimensionnées si nécessaire</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'filters-frames',
      title: 'Filtres et cadres',
      icon: Wand2,
      gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" />
              Filtres photo
            </h4>
            <p className="text-sm mb-3">
              Après avoir pris ou sélectionné une photo, vous pouvez appliquer différents filtres :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li><span className="text-white font-medium">Aucun</span> : Photo originale</li>
              <li><span className="text-white font-medium">Vintage</span> : Effet rétro avec tons sépia</li>
              <li><span className="text-white font-medium">Noir & Blanc</span> : Conversion en niveaux de gris</li>
              <li><span className="text-white font-medium">Vibrant</span> : Saturation et contraste renforcés</li>
              <li><span className="text-white font-medium">Soft</span> : Adoucissement et luminosité</li>
              <li><span className="text-white font-medium">Dramatic</span> : Contraste élevé et ombres prononcées</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-indigo-400" />
              Cadres décoratifs
            </h4>
            <p className="text-sm mb-3">
              Ajoutez un cadre élégant autour de votre photo :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li><span className="text-white font-medium">Aucun</span> : Pas de cadre</li>
              <li><span className="text-white font-medium">Classic</span> : Cadre simple et élégant</li>
              <li><span className="text-white font-medium">Polaroid</span> : Style photo instantanée</li>
              <li><span className="text-white font-medium">Vintage</span> : Cadre avec effet vieilli</li>
              <li><span className="text-white font-medium">Modern</span> : Cadre minimaliste moderne</li>
            </ul>
            <p className="text-sm mt-3 text-slate-400">
              💡 Astuce : Les cadres peuvent être personnalisés par l'organisateur de l'événement
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'collage-mode',
      title: 'Mode collage',
      icon: Grid3x3,
      gradient: 'from-cyan-500 via-teal-500 to-green-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-cyan-400" />
              Créer un collage
            </h4>
            <p className="text-sm mb-3">
              Le mode collage vous permet de combiner plusieurs photos en une seule image :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Vous pouvez ajouter entre 2 et 4 photos</li>
              <li>Prenez ou sélectionnez chaque photo une par une</li>
              <li>Les photos sont automatiquement arrangées dans une grille</li>
              <li>Vous pouvez réorganiser les photos par glisser-déposer</li>
              <li>Le collage final peut être partagé comme une photo normale</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
            <p className="text-sm text-cyan-300">
              ⚠️ Note : Le mode collage peut être désactivé par l'organisateur de l'événement
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'gallery',
      title: 'Galerie',
      icon: Images,
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Images className="w-5 h-5 text-indigo-400" />
              Explorer la galerie
            </h4>
            <p className="text-sm mb-3">
              La galerie affiche toutes les photos partagées par les invités :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li><span className="text-white font-medium">Tri</span> : Par date (récent) ou par popularité (likes)</li>
              <li><span className="text-white font-medium">Recherche</span> : Recherchez par nom d'auteur</li>
              <li><span className="text-white font-medium">Filtres</span> : Affichez uniquement photos, vidéos ou tout</li>
              <li><span className="text-white font-medium">Likes</span> : Appuyez sur le cœur pour liker une photo</li>
              <li><span className="text-white font-medium">Mode sélection</span> : Sélectionnez plusieurs photos pour téléchargement en ZIP</li>
              <li><span className="text-white font-medium">Téléchargement</span> : Téléchargez vos photos préférées individuellement ou en groupe</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Système de likes
            </h4>
            <p className="text-sm">
              Montrez votre appréciation en likant les photos qui vous plaisent. 
              Les photos les plus likées apparaissent en haut lors du tri par popularité.
              Double-cliquez sur une photo dans la galerie pour liker rapidement.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'reactions',
      title: 'Réactions émojis',
      icon: Smile,
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Smile className="w-5 h-5 text-pink-400" />
              Système de réactions
            </h4>
            <p className="text-sm mb-3">
              En plus des likes, vous pouvez ajouter des réactions émojis pour exprimer vos émotions :
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">❤️</span>
                  <span className="font-semibold text-white text-sm">Cœur</span>
                </div>
                <p className="text-xs text-slate-400">J'adore</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">😂</span>
                  <span className="font-semibold text-white text-sm">Rire</span>
                </div>
                <p className="text-xs text-slate-400">Trop drôle</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">😢</span>
                  <span className="font-semibold text-white text-sm">Je pleure</span>
                </div>
                <p className="text-xs text-slate-400">Émouvant</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔥</span>
                  <span className="font-semibold text-white text-sm">Feu</span>
                </div>
                <p className="text-xs text-slate-400">Incroyable</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">😮</span>
                  <span className="font-semibold text-white text-sm">Wow !</span>
                </div>
                <p className="text-xs text-slate-400">Surprenant</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">👍</span>
                  <span className="font-semibold text-white text-sm">Bravo !</span>
                </div>
                <p className="text-xs text-slate-400">Super</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-400" />
              Comment réagir
            </h4>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Cliquez sur l'icône <span className="text-white font-medium">😊</span> sous une photo</li>
              <li>Choisissez une réaction parmi les 6 disponibles</li>
              <li>Vous pouvez changer votre réaction à tout moment</li>
              <li>Une seule réaction par photo (mais modifiable)</li>
              <li>Les compteurs de réactions sont mis à jour en temps réel</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-pink-500/10 to-red-500/10">
            <p className="text-sm text-pink-300">
              💡 Astuce : Les réactions permettent d'exprimer plus précisément vos émotions qu'un simple like !
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'photo-battle',
      title: 'Photo Battle',
      icon: Trophy,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Qu'est-ce qu'une Photo Battle ?
            </h4>
            <p className="text-sm mb-3">
              Les Photo Battles sont des compétitions amusantes où deux photos s'affrontent. 
              Tous les invités peuvent voter pour leur photo préférée en temps réel !
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Les battles sont créées par l'organisateur de l'événement</li>
              <li>Deux photos sont mises en compétition côte à côte</li>
              <li>Vous pouvez voter en cliquant sur votre photo préférée</li>
              <li>Les votes sont mis à jour en temps réel</li>
              <li>La photo gagnante reste affichée, la perdante disparaît</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Comment voter
            </h4>
            <p className="text-sm mb-3">
              Participer à une battle est très simple :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Dans la galerie, activez le filtre "Battles" pour voir les battles actives</li>
              <li>Cliquez sur la photo que vous préférez pour voter</li>
              <li>Vous ne pouvez voter qu'une seule fois par battle</li>
              <li>Votre vote est indiqué par un badge "Votre vote"</li>
              <li>Les pourcentages de votes s'affichent en temps réel</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-400" />
              Résultats et gagnant
            </h4>
            <p className="text-sm mb-3">
              À la fin d'une battle :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>La photo avec le plus de votes remporte la battle</li>
              <li>Un badge trophée apparaît sur la photo gagnante</li>
              <li>La photo perdante disparaît automatiquement</li>
              <li>Les battles ont une durée limitée (définie par l'organisateur)</li>
              <li>Les résultats sont affichés en temps réel sur le grand écran</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <p className="text-sm text-yellow-300">
              💡 Astuce : Les battles sont une façon amusante d'interagir avec les autres invités et de voir quelles photos sont les plus populaires !
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'find-me',
      title: 'Retrouve-moi',
      icon: User,
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-fuchsia-400" />
              Qu'est-ce que Retrouve-moi ?
            </h4>
            <p className="text-sm mb-3">
              Retrouve-moi est une fonctionnalité de reconnaissance faciale qui vous permet de retrouver 
              toutes vos photos dans l'événement en prenant simplement un selfie.
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Utilise la reconnaissance faciale locale (face-api.js)</li>
              <li>Fonctionne entièrement sur votre appareil (pas d'envoi de données)</li>
              <li>Recherche automatiquement toutes les photos où vous apparaissez</li>
              <li>Affichage des résultats avec score de similarité</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Comment utiliser Retrouve-moi
            </h4>
            <p className="text-sm mb-3">
              Suivez ces étapes pour retrouver vos photos :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Dans la galerie, cliquez sur le bouton "Retrouve-moi"</li>
              <li>Autorisez l'accès à votre caméra frontale</li>
              <li>Prenez un selfie clair avec votre visage bien visible</li>
              <li>L'application détecte automatiquement votre visage</li>
              <li>Les photos correspondantes s'affichent avec leur score de similarité</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Images className="w-5 h-5 text-indigo-400" />
              Résultats de recherche
            </h4>
            <p className="text-sm mb-3">
              Après la recherche, vous verrez :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Toutes les photos où votre visage a été détecté</li>
              <li>Un score de similarité pour chaque photo trouvée</li>
              <li>La possibilité de cliquer sur une photo pour la voir en grand</li>
              <li>Un aperçu rapide de toutes vos photos dans l'événement</li>
              <li>La possibilité de télécharger vos photos préférées</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-fuchsia-400" />
              Conseils pour de meilleurs résultats
            </h4>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Assurez-vous d'avoir un bon éclairage sur votre visage</li>
              <li>Regardez directement la caméra</li>
              <li>Évitez les ombres sur votre visage</li>
              <li>Gardez une expression neutre pour de meilleurs résultats</li>
              <li>Si aucun résultat, essayez avec une autre photo de vous</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10">
            <p className="text-sm text-fuchsia-300">
              🔒 Confidentialité : Toute la reconnaissance faciale se fait localement sur votre appareil. 
              Aucune image de votre visage n'est envoyée à un serveur externe.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'ai-features',
      title: 'Fonctionnalités IA',
      icon: Sparkles,
      gradient: 'from-pink-500 via-rose-500 to-orange-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Légendes automatiques
            </h4>
            <p className="text-sm mb-3">
              L'application utilise l'intelligence artificielle pour générer automatiquement des légendes 
              amusantes et personnalisées pour vos photos :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Les légendes sont créées en quelques secondes</li>
              <li>Elles sont adaptées au contenu de la photo</li>
              <li>Vous pouvez les modifier avant de publier</li>
              <li>Elles sont en français et incluent des emojis</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              Modération automatique
            </h4>
            <p className="text-sm mb-3">
              Toutes les photos sont analysées automatiquement pour garantir un contenu approprié :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Détection de contenu inapproprié</li>
              <li>Respect des règles de l'événement</li>
              <li>Protection de la vie privée</li>
              <li>Les photos non conformes sont automatiquement rejetées</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'downloads-aftermovies',
      title: 'Téléchargements et Aftermovies',
      icon: FileVideo,
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              Téléchargement individuel
            </h4>
            <p className="text-sm mb-3">
              Téléchargez vos photos préférées en haute qualité :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Dans la galerie, cliquez sur l'icône <span className="text-white font-medium">📥</span> sur une photo</li>
              <li>La photo est téléchargée en haute qualité (4K si disponible)</li>
              <li>Les photos sont téléchargées dans le dossier de téléchargements par défaut</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Export ZIP groupé
            </h4>
            <p className="text-sm mb-3">
              Téléchargez plusieurs photos en une fois :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Activez le <span className="text-white font-medium">Mode sélection</span> dans la galerie</li>
              <li>Cochez les photos que vous voulez télécharger</li>
              <li>Cliquez sur <span className="text-white font-medium">"Télécharger"</span> (icône 📥)</li>
              <li>Un fichier ZIP est créé avec toutes les photos sélectionnées</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FileVideo className="w-5 h-5 text-purple-400" />
              Aftermovies (Vidéos souvenirs)
            </h4>
            <p className="text-sm mb-3">
              Les organisateurs peuvent créer des vidéos timelapse à partir des photos de l'événement :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Les aftermovies apparaissent dans la <span className="text-white font-medium">section dédiée</span> de la galerie</li>
              <li><span className="text-white font-medium">3 formats disponibles</span> : HD (720p), Full HD (1080p), Story (9:16 pour Instagram/TikTok)</li>
              <li>Cliquez sur un aftermovie pour voir les détails (qualité, nombre de téléchargements)</li>
              <li>Téléchargez l'aftermovie avec le bouton <span className="text-white font-medium">📥</span></li>
              <li>Partagez facilement via le <span className="text-white font-medium">QR code</span> ou le lien</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <p className="text-sm text-blue-300">
              💡 Astuce : Les aftermovies sont générés automatiquement par l'organisateur. 
              Consultez régulièrement la galerie pour voir les nouveaux aftermovies disponibles !
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      icon: HelpCircle,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Dois-je créer un compte ?</h4>
              <p className="text-sm text-slate-400">
                Non ! Vous pouvez partager des photos sans compte. Cependant, créer un profil vous permet de voir vos statistiques, gagner des badges et apparaître dans les classements.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Puis-je supprimer ma photo après l'avoir publiée ?</h4>
              <p className="text-sm text-slate-400">
                Pour l'instant, les photos ne peuvent pas être supprimées par les invités. Contactez l'organisateur si nécessaire.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Mes photos sont-elles privées ?</h4>
              <p className="text-sm text-slate-400">
                Non, toutes les photos partagées sont visibles par tous les invités de l'événement. Ne partagez que des photos que vous êtes à l'aise de montrer publiquement.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Pourquoi ma photo n'apparaît pas ?</h4>
              <p className="text-sm text-slate-400">
                Plusieurs raisons possibles : la modération automatique l'a rejetée, un problème de connexion, ou le format/taille du fichier n'est pas supporté. Attendez quelques secondes, l'upload peut prendre du temps.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Combien de photos puis-je partager ?</h4>
              <p className="text-sm text-slate-400">
                Il n'y a pas de limite ! Partagez autant de photos que vous voulez. Les photos sont automatiquement compressées pour optimiser l'espace.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Puis-je utiliser l'application hors ligne ?</h4>
              <p className="text-sm text-slate-400">
                Non, une connexion Internet est nécessaire pour partager et voir les photos en temps réel. Cependant, les photos déjà chargées peuvent être consultées en cache.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Comment télécharger une photo ?</h4>
              <p className="text-sm text-slate-400">
                Dans la galerie, cliquez sur l'icône de téléchargement (📥) en bas à droite de chaque photo. Pour plusieurs photos, utilisez le mode sélection.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">L'application fonctionne-t-elle sur tous les appareils ?</h4>
              <p className="text-sm text-slate-400">
                Oui, l'application est compatible avec les smartphones, tablettes et ordinateurs. Pour la meilleure expérience, utilisez un navigateur récent (Chrome, Safari, Firefox, Edge).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Comment fonctionne la recherche "Retrouve-moi" ?</h4>
              <p className="text-sm text-slate-400">
                La recherche utilise la reconnaissance faciale (IA) pour trouver toutes les photos où vous apparaissez. Prenez une photo claire de votre visage pour de meilleurs résultats. Toute la reconnaissance se fait localement sur votre appareil.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Puis-je modifier ma réaction ?</h4>
              <p className="text-sm text-slate-400">
                Oui ! Vous pouvez changer votre réaction à tout moment. Cliquez sur l'icône 😊 sous une photo et choisissez une nouvelle réaction. Vous ne pouvez avoir qu'une seule réaction par photo à la fois.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Les photos sont-elles stockées indéfiniment ?</h4>
              <p className="text-sm text-slate-400">
                Les photos sont stockées tant que l'événement est actif. L'organisateur peut archiver l'événement à tout moment. Téléchargez vos photos préférées pour les conserver.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'gamification',
      title: 'Gamification',
      icon: Trophy,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Système de badges
            </h4>
            <p className="text-sm mb-3">
              Gagnez des badges en participant activement à l'événement ! Les badges sont attribués automatiquement selon vos performances :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📸</span>
                  <span className="font-semibold text-white text-sm">Photographe</span>
                </div>
                <p className="text-xs text-slate-400">Avoir posté le plus de photos</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">⭐</span>
                  <span className="font-semibold text-white text-sm">Star</span>
                </div>
                <p className="text-xs text-slate-400">Avoir la photo la plus likée</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-400/10 to-cyan-500/10 border border-blue-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🐦</span>
                  <span className="font-semibold text-white text-sm">Oiseau matinal</span>
                </div>
                <p className="text-xs text-slate-400">Avoir posté la première photo</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🔥</span>
                  <span className="font-semibold text-white text-sm">Populaire</span>
                </div>
                <p className="text-xs text-slate-400">Avoir reçu le plus de likes</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📅</span>
                  <span className="font-semibold text-white text-sm">Régulier</span>
                </div>
                <p className="text-xs text-slate-400">Avoir posté régulièrement</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">💎</span>
                  <span className="font-semibold text-white text-sm">Qualité</span>
                </div>
                <p className="text-xs text-slate-400">Meilleure moyenne de likes</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-pink-400/10 to-rose-500/10 border border-pink-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🦋</span>
                  <span className="font-semibold text-white text-sm">Papillon social</span>
                </div>
                <p className="text-xs text-slate-400">Avoir reçu le plus de réactions</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🚀</span>
                  <span className="font-semibold text-white text-sm">Viral</span>
                </div>
                <p className="text-xs text-slate-400">Photo avec énormément de réactions</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Système de points
            </h4>
            <p className="text-sm mb-3">
              Chaque action vous rapporte des points pour le classement :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li><span className="text-white font-medium">10 points</span> par photo postée</li>
              <li><span className="text-white font-medium">5 points</span> par like reçu</li>
              <li><span className="text-white font-medium">3 points</span> par réaction reçue</li>
              <li><span className="text-white font-medium">Bonus qualité</span> : points supplémentaires pour une bonne moyenne de likes</li>
              <li><span className="text-white font-medium">Bonus variété</span> : points pour recevoir différents types de réactions</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Milestones et achievements
            </h4>
            <p className="text-sm mb-3">
              Débloquez des achievements en atteignant des objectifs :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Première photo, 5 photos, 10 photos, 25 photos, 50 photos...</li>
              <li>10 likes, 50 likes, 100 likes, 250 likes...</li>
              <li>20 réactions, 50 réactions, 100 réactions...</li>
              <li>100 points, 500 points, 1000 points, 2500 points...</li>
              <li>Moyenne de 5 ou 10 likes par photo (avec minimum de photos requis)</li>
            </ul>
            <p className="text-sm mt-3 text-slate-400">
              💡 Consultez votre profil pour voir vos achievements et votre prochain objectif !
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Classement en direct
            </h4>
            <p className="text-sm mb-3">
              Le classement est mis à jour en temps réel et affiche :
            </p>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Votre rang dans l'événement</li>
              <li>Votre score total de gamification</li>
              <li>Tous vos badges obtenus</li>
              <li>Vos statistiques (photos, likes, réactions)</li>
              <li>Le podium des 3 meilleurs participants</li>
            </ul>
            <p className="text-sm mt-3 text-slate-400">
              💡 Le classement est basé sur le score total, puis le nombre de photos, puis les likes totaux.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <p className="text-sm text-yellow-300">
              🎯 Astuce : Plus vous participez activement, plus vous gagnez de points et de badges ! 
              Interagissez avec les photos des autres (likes, réactions) pour encourager la communauté.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'tips',
      title: 'Astuces et conseils',
      icon: Users,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      content: (
        <div className="space-y-4 text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3">💡 Pour de meilleures photos</h4>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Assurez-vous d'avoir un bon éclairage</li>
              <li>Maintenez votre appareil stable lors de la capture</li>
              <li>Utilisez le compte à rebours pour vous préparer</li>
              <li>Expérimentez avec les différents filtres pour trouver votre style</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3">🎨 Personnalisation</h4>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>Ajoutez votre nom pour que les autres vous reconnaissent</li>
              <li>Les cadres peuvent ajouter une touche professionnelle</li>
              <li>Les filtres peuvent améliorer l'ambiance de vos photos</li>
              <li>N'hésitez pas à modifier la légende générée par l'IA</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-semibold text-white mb-3">📱 Utilisation mobile</h4>
            <ul className="space-y-2 text-sm list-disc list-inside ml-2">
              <li>L'application est optimisée pour les écrans tactiles</li>
              <li>Vous pouvez utiliser l'application en mode paysage ou portrait</li>
              <li>Les gestes de balayage facilitent la navigation</li>
              <li>Activez les notifications pour ne rien manquer</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  // Fonction pour ouvrir automatiquement une section lors de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Trouver les sections correspondantes et les ouvrir
      const matchingSections = helpSections.filter(section => 
        section.title.toLowerCase().includes(query.toLowerCase()) ||
        section.id.toLowerCase().includes(query.toLowerCase())
      );
      if (matchingSections.length > 0) {
        setExpandedSections(prev => {
          const newSet = new Set(prev);
          matchingSections.forEach(section => newSet.add(section.id));
          return newSet;
        });
      }
    } else {
      // Réinitialiser à la section par défaut si la recherche est vide
      setExpandedSections(new Set(['getting-started']));
    }
  };

  // Filtrer les sections selon la recherche
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const query = searchQuery.toLowerCase();
    return helpSections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        <div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-blob animation-delay-2000"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%)',
          }}
        />
      </div>

        {/* Header */}
      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 pt-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-3 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all duration-300 group shadow-lg"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
              Centre d'aide
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tout ce que vous devez savoir pour utiliser Partywall
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setExpandedSections(new Set(['getting-started']));
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>


        {/* Help Sections */}
        <div className="space-y-3 pb-8">
          {filteredSections.length === 0 && searchQuery.trim() ? (
            <div className="p-8 text-center rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg font-semibold mb-2">Aucun résultat trouvé</p>
              <p className="text-slate-400 text-sm">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            const matchesSearch = searchQuery.trim() && (
              section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              section.id.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div
                key={section.id}
                className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 ${
                  matchesSearch ? 'ring-2 ring-pink-500/50' : ''
                }`}
                style={{
                  boxShadow: isExpanded 
                    ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-white/30 rounded-2xl"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/70" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/70" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 animate-fade-in">
                    <div className="pt-4 border-t border-white/10">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-slate-400 text-sm space-y-3">
          <p>
            Besoin d'aide supplémentaire ? Contactez l'organisateur de l'événement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'privacy' });
                window.dispatchEvent(event);
                onBack();
              }}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Politique de confidentialité
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'data-management' });
                window.dispatchEvent(event);
                onBack();
              }}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Gestion de mes données
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Partywall © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HelpPage);

