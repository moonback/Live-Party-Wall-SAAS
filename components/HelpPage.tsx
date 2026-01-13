import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="space-y-3 sm:space-y-4 text-slate-300">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm sm:text-base leading-relaxed"
          >
            Bienvenue sur <span className="text-pink-400 font-semibold">Partywall</span> ! 
            Cette application vous permet de partager vos meilleurs moments en temps réel avec tous les invités.
          </motion.p>
          <div className="space-y-2 sm:space-y-3">
            {[
              { num: 1, title: 'Prenez une photo', desc: 'Cliquez sur "Prendre une photo" depuis la page d\'accueil', gradient: 'from-pink-500 to-purple-500' },
              { num: 2, title: 'Personnalisez', desc: 'Ajoutez des filtres, des cadres et votre nom', gradient: 'from-indigo-500 to-blue-500' },
              { num: 3, title: 'Partagez', desc: 'Votre photo apparaît instantanément sur le mur et dans la galerie', gradient: 'from-cyan-500 to-teal-500' },
            ].map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group cursor-pointer"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  animate={{ opacity: [0, 0.05, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <motion.div
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center relative z-10 shadow-lg`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                >
                  <span className="text-white font-bold text-xs sm:text-sm">{step.num}</span>
                </motion.div>
                <div className="relative z-10">
                  <h4 className="font-semibold text-white mb-0.5 sm:mb-1 text-sm sm:text-base">{step.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-300">{step.desc}</p>
                </div>
              </motion.div>
            ))}
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
        <div className="space-y-3 sm:space-y-4 text-slate-300">
          <div className="space-y-2 sm:space-y-3">
            {[
              { icon: Camera, title: 'Utilisation de la caméra', color: 'text-pink-400', items: ['Autorisez l\'accès à votre caméra lorsque demandé', 'Utilisez le bouton de capture pour prendre une photo', 'Un compte à rebours de 3 secondes s\'affiche avant la capture', 'Vous pouvez basculer entre caméra avant et arrière'] },
              { icon: Video, title: 'Mode vidéo (si activé)', color: 'text-purple-400', items: ['Basculez vers le mode vidéo avec l\'icône vidéo', 'Appuyez sur le bouton d\'enregistrement pour démarrer', 'La durée maximale est de 30 secondes', 'Un indicateur de temps s\'affiche pendant l\'enregistrement'] },
              { icon: Smartphone, title: 'Upload depuis la galerie', color: 'text-blue-400', items: ['Cliquez sur l\'icône de galerie pour sélectionner une photo existante', 'Les formats acceptés : JPEG, PNG, WebP', 'Taille maximale : 10 MB pour les photos', 'Les photos sont automatiquement redimensionnées si nécessaire'] },
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ opacity: [0, 0.05, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2 relative z-10 text-sm sm:text-base">
                  <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                  {card.title}
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm list-disc list-inside ml-2 relative z-10">
                  {card.items.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.3 + index * 0.1 + i * 0.05 }}
                      className="text-slate-300"
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
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
        <div className="space-y-3 sm:space-y-4 text-slate-300">
          {[
            { icon: Wand2, title: 'Filtres photo', color: 'text-purple-400', desc: 'Après avoir pris ou sélectionné une photo, vous pouvez appliquer différents filtres :', items: [
              { name: 'Aucun', desc: 'Photo originale' },
              { name: 'Vintage', desc: 'Effet rétro avec tons sépia' },
              { name: 'Noir & Blanc', desc: 'Conversion en niveaux de gris' },
              { name: 'Vibrant', desc: 'Saturation et contraste renforcés' },
              { name: 'Soft', desc: 'Adoucissement et luminosité' },
              { name: 'Dramatic', desc: 'Contraste élevé et ombres prononcées' },
            ]},
            { icon: Grid3x3, title: 'Cadres décoratifs', color: 'text-indigo-400', desc: 'Ajoutez un cadre élégant autour de votre photo :', items: [
              { name: 'Aucun', desc: 'Pas de cadre' },
              { name: 'Classic', desc: 'Cadre simple et élégant' },
              { name: 'Polaroid', desc: 'Style photo instantanée' },
              { name: 'Vintage', desc: 'Cadre avec effet vieilli' },
              { name: 'Modern', desc: 'Cadre minimaliste moderne' },
            ], tip: '💡 Astuce : Les cadres peuvent être personnalisés par l\'organisateur de l\'événement' },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{ opacity: [0, 0.05, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <h4 className="font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2 relative z-10 text-sm sm:text-base">
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                {card.title}
              </h4>
              <p className="text-xs sm:text-sm mb-2 sm:mb-3 relative z-10">
                {card.desc}
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm list-disc list-inside ml-2 relative z-10">
                {card.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 + index * 0.1 + i * 0.05 }}
                  >
                    <span className="text-white font-medium">{item.name}</span> : {item.desc}
                  </motion.li>
                ))}
              </ul>
              {card.tip && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="text-xs sm:text-sm mt-2 sm:mt-3 text-slate-400 relative z-10"
                >
                  {card.tip}
                </motion.p>
              )}
            </motion.div>
          ))}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
              {[
                { emoji: '❤️', label: 'Cœur', desc: 'J\'adore', gradient: 'from-red-500/10 to-pink-500/10', border: 'border-red-500/20' },
                { emoji: '😂', label: 'Rire', desc: 'Trop drôle', gradient: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/20' },
                { emoji: '😢', label: 'Je pleure', desc: 'Émouvant', gradient: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/20' },
                { emoji: '🔥', label: 'Feu', desc: 'Incroyable', gradient: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/20' },
                { emoji: '😮', label: 'Wow !', desc: 'Surprenant', gradient: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20' },
                { emoji: '👍', label: 'Bravo !', desc: 'Super', gradient: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20' },
              ].map((reaction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-r ${reaction.gradient} border ${reaction.border} relative overflow-hidden group cursor-pointer`}
                >
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${reaction.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 mb-1 relative z-10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
                  >
                    <span className="text-xl sm:text-2xl">{reaction.emoji}</span>
                    <span className="font-semibold text-white text-xs sm:text-sm">{reaction.label}</span>
                  </motion.div>
                  <p className="text-[10px] sm:text-xs text-slate-400 relative z-10">{reaction.desc}</p>
                </motion.div>
              ))}
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
        <div className="space-y-3 sm:space-y-4 text-slate-300">
          <div className="space-y-2 sm:space-y-3">
            {[
              { q: 'Dois-je créer un compte ?', a: 'Non ! Vous pouvez partager des photos sans compte. Cependant, créer un profil vous permet de voir vos statistiques, gagner des badges et apparaître dans les classements.' },
              { q: 'Puis-je supprimer ma photo après l\'avoir publiée ?', a: 'Pour l\'instant, les photos ne peuvent pas être supprimées par les invités. Contactez l\'organisateur si nécessaire.' },
              { q: 'Mes photos sont-elles privées ?', a: 'Non, toutes les photos partagées sont visibles par tous les invités de l\'événement. Ne partagez que des photos que vous êtes à l\'aise de montrer publiquement.' },
              { q: 'Pourquoi ma photo n\'apparaît pas ?', a: 'Plusieurs raisons possibles : la modération automatique l\'a rejetée, un problème de connexion, ou le format/taille du fichier n\'est pas supporté. Attendez quelques secondes, l\'upload peut prendre du temps.' },
              { q: 'Combien de photos puis-je partager ?', a: 'Il n\'y a pas de limite ! Partagez autant de photos que vous voulez. Les photos sont automatiquement compressées pour optimiser l\'espace.' },
              { q: 'Puis-je utiliser l\'application hors ligne ?', a: 'Non, une connexion Internet est nécessaire pour partager et voir les photos en temps réel. Cependant, les photos déjà chargées peuvent être consultées en cache.' },
              { q: 'Comment télécharger une photo ?', a: 'Dans la galerie, cliquez sur l\'icône de téléchargement (📥) en bas à droite de chaque photo. Pour plusieurs photos, utilisez le mode sélection.' },
              { q: 'L\'application fonctionne-t-elle sur tous les appareils ?', a: 'Oui, l\'application est compatible avec les smartphones, tablettes et ordinateurs. Pour la meilleure expérience, utilisez un navigateur récent (Chrome, Safari, Firefox, Edge).' },
              { q: 'Comment fonctionne la recherche "Retrouve-moi" ?', a: 'La recherche utilise la reconnaissance faciale (IA) pour trouver toutes les photos où vous apparaissez. Prenez une photo claire de votre visage pour de meilleurs résultats. Toute la reconnaissance se fait localement sur votre appareil.' },
              { q: 'Puis-je modifier ma réaction ?', a: 'Oui ! Vous pouvez changer votre réaction à tout moment. Cliquez sur l\'icône 😊 sous une photo et choisissez une nouvelle réaction. Vous ne pouvez avoir qu\'une seule réaction par photo à la fois.' },
              { q: 'Les photos sont-elles stockées indéfiniment ?', a: 'Les photos sont stockées tant que l\'événement est actif. L\'organisateur peut archiver l\'événement à tout moment. Téléchargez vos photos préférées pour les conserver.' },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group cursor-pointer"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ opacity: [0, 0.05, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <h4 className="font-semibold text-white mb-1.5 sm:mb-2 text-sm sm:text-base relative z-10">{faq.q}</h4>
                <p className="text-xs sm:text-sm text-slate-400 relative z-10 leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
              {[
                { emoji: '📸', label: 'Photographe', desc: 'Avoir posté le plus de photos', gradient: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/20' },
                { emoji: '⭐', label: 'Star', desc: 'Avoir la photo la plus likée', gradient: 'from-pink-500/10 to-purple-500/10', border: 'border-pink-500/20' },
                { emoji: '🐦', label: 'Oiseau matinal', desc: 'Avoir posté la première photo', gradient: 'from-blue-400/10 to-cyan-500/10', border: 'border-blue-400/20' },
                { emoji: '🔥', label: 'Populaire', desc: 'Avoir reçu le plus de likes', gradient: 'from-red-500/10 to-orange-500/10', border: 'border-red-500/20' },
                { emoji: '📅', label: 'Régulier', desc: 'Avoir posté régulièrement', gradient: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20' },
                { emoji: '💎', label: 'Qualité', desc: 'Meilleure moyenne de likes', gradient: 'from-purple-500/10 to-indigo-500/10', border: 'border-purple-500/20' },
                { emoji: '🦋', label: 'Papillon social', desc: 'Avoir reçu le plus de réactions', gradient: 'from-pink-400/10 to-rose-500/10', border: 'border-pink-400/20' },
                { emoji: '🚀', label: 'Viral', desc: 'Photo avec énormément de réactions', gradient: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/20' },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-r ${badge.gradient} border ${badge.border} relative overflow-hidden group cursor-pointer`}
                >
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${badge.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 mb-1 relative z-10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
                  >
                    <span className="text-lg sm:text-xl">{badge.emoji}</span>
                    <span className="font-semibold text-white text-xs sm:text-sm">{badge.label}</span>
                  </motion.div>
                  <p className="text-[10px] sm:text-xs text-slate-400 relative z-10">{badge.desc}</p>
                </motion.div>
              ))}
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl mx-auto p-3 sm:p-4 pt-6 sm:pt-8"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all duration-300 group shadow-lg relative overflow-hidden"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(236, 72, 153, 0.3)',
            }}
            onHoverStart={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              if (target) {
                target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(236, 72, 153, 0.4)';
              }
            }}
            onHoverEnd={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              if (target) {
                target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(236, 72, 153, 0.3)';
              }
            }}
            aria-label="Retour"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
          </motion.button>
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300"
            >
              Centre d'aide
            </motion.h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Tout ce que vous devez savoir pour utiliser Partywall
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4 sm:mb-6"
        >
          <div className="relative group">
            <motion.div
              className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2"
              animate={{ rotate: searchQuery ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-pink-400 transition-colors" />
            </motion.div>
            <motion.input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              whileFocus={{ scale: 1.01 }}
              className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 relative z-10"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => {
                    setSearchQuery('');
                    setExpandedSections(new Set(['getting-started']));
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors relative z-10"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                </motion.button>
              )}
            </AnimatePresence>
            {searchQuery && (
              <motion.div
                className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        </motion.div>


        {/* Help Sections */}
        <div className="space-y-2 sm:space-y-3 pb-6 sm:pb-8">
          <AnimatePresence mode="wait">
            {filteredSections.length === 0 && searchQuery.trim() ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-6 sm:p-8 text-center rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4 relative z-10" />
                </motion.div>
                <p className="text-slate-300 text-base sm:text-lg font-semibold mb-2 relative z-10">Aucun résultat trouvé</p>
                <p className="text-slate-400 text-xs sm:text-sm relative z-10">Essayez avec d'autres mots-clés</p>
              </motion.div>
            ) : (
              filteredSections.map((section, index) => {
                const Icon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                const matchesSearch = searchQuery.trim() && (
                  section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  section.id.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 relative group ${
                      matchesSearch ? 'ring-2 ring-pink-500/50' : ''
                    }`}
                    style={{
                      boxShadow: isExpanded 
                        ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Gradient background animé */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                      animate={isExpanded ? { opacity: [0.05, 0.15, 0.05] } : {}}
                      transition={{ duration: 2, repeat: isExpanded ? Infinity : 0, ease: 'easeInOut' }}
                    />
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={isExpanded ? { x: '100%' } : { x: '-100%' }}
                      transition={{ duration: 3, repeat: isExpanded ? Infinity : 0, repeatDelay: 2, ease: 'linear' }}
                    />

                    <motion.button
                      onClick={() => toggleSection(section.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl sm:rounded-2xl relative z-10"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <motion.div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden`}
                          animate={isExpanded ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 3, repeat: isExpanded ? Infinity : 0, ease: 'easeInOut' }}
                        >
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-50`}
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />
                        </motion.div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">
                          {section.title}
                        </h2>
                      </div>
                      <motion.div
                        className="flex-shrink-0"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 relative z-10">
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="pt-3 sm:pt-4 border-t border-white/10"
                            >
                              {section.content}
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center py-6 sm:py-8 text-slate-400 text-xs sm:text-sm space-y-2 sm:space-y-3 relative z-10"
        >
          <p>
            Besoin d'aide supplémentaire ? Contactez l'organisateur de l'événement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
            <motion.button
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'privacy' });
                window.dispatchEvent(event);
                onBack();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Politique de confidentialité
            </motion.button>
            <span className="text-slate-600">•</span>
            <motion.button
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'data-management' });
                window.dispatchEvent(event);
                onBack();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Gestion de mes données
            </motion.button>
          </div>
          <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
            Partywall © 2026
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default React.memo(HelpPage);

