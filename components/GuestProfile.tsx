import React, { useState, useEffect } from 'react';
import { X, User, Camera, Heart, Award, Smile, ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUserName, getCurrentUserAvatar, disconnectUser } from '../utils/userAvatar';
import { getPhotosByAuthor, getPhotosReactions } from '../services/photoService';
import { Photo, ReactionCounts } from '../types';
import { REACTIONS } from '../constants';
import { getAuthorStats, getAuthorBadges, getAuthorMilestones, getNextMilestone } from '../services/gamificationService';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';

interface GuestProfileProps {
  onBack: () => void;
  key?: string | number; // Pour forcer le rafraîchissement
}

/**
 * Composant pour afficher le profil de l'invité
 */
const GuestProfile: React.FC<GuestProfileProps> = ({ onBack }) => {
  const { currentEvent } = useEvent();
  const { addToast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());
  const [totalReactions, setTotalReactions] = useState(0);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const isMobile = useIsMobile();

  // Rafraîchir les données à chaque montage du composant (ouverture du profil)
  useEffect(() => {
    const name = getCurrentUserName();
    const avatar = getCurrentUserAvatar();
    
    setUserName(name);
    setAvatarUrl(avatar);

    if (name && currentEvent?.id) {
      // Réinitialiser l'état de chargement et recharger les données
      setLoading(true);
      setUserPhotos([]);
      setPhotosReactions(new Map());
      setTotalLikes(0);
      setTotalReactions(0);
      
      // Charger les données fraîches
      loadUserPhotos(name);
    } else {
      setLoading(false);
    }
  }, [currentEvent?.id]); // Se déclenche à chaque montage du composant ou changement d'événement

  const loadUserPhotos = async (authorName: string) => {
    // Vérifier que l'événement est chargé
    if (!currentEvent?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Passer eventId comme premier paramètre
      const photos = await getPhotosByAuthor(currentEvent.id, authorName);
      setUserPhotos(photos);
      
      // Calculer le total des likes
      const likes = photos.reduce((sum, photo) => {
        return sum + (photo.likes_count || 0);
      }, 0);
      setTotalLikes(likes);

      // Charger les réactions pour toutes les photos
      if (photos.length > 0) {
        const photoIds = photos.map(p => p.id);
        const reactionsMap = await getPhotosReactions(photoIds);
        setPhotosReactions(reactionsMap);

        // Calculer le total des réactions
        let total = 0;
        reactionsMap.forEach((reactions) => {
          Object.values(reactions).forEach((count) => {
            total += count || 0;
          });
        });
        setTotalReactions(total);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const handleDisconnect = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter de votre profil invité ?')) {
      disconnectUser();
      addToast('Vous avez été déconnecté de votre profil invité', 'info');
      // Rediriger vers la landing page de l'événement
      onBack();
    }
  };

  if (!userName) {
    return (
      <div className="h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pointer-events-none"></div>
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>

        <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full text-center" style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}>
          <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Aucun profil invité trouvé</h2>
          <p className="text-slate-400 mb-6">Vous devez créer un profil invité pour voir vos statistiques</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl text-white font-medium transition-all duration-300"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>

      {/* Boutons d'action */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center gap-2"
      >
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 sm:p-2.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all duration-300 group shadow-lg overflow-hidden"
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
            className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          <X className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
        </motion.button>
        
        <motion.button
          onClick={handleDisconnect}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 sm:p-2.5 rounded-xl backdrop-blur-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-white transition-all duration-300 group shadow-lg overflow-hidden"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(239, 68, 68, 0.3)',
          }}
          onHoverStart={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            if (target) {
              target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.4)';
            }
          }}
          onHoverEnd={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            if (target) {
              target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(239, 68, 68, 0.3)';
            }
          }}
          aria-label="Se déconnecter"
          title="Se déconnecter du profil invité"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-500/20 to-red-500/20 rounded-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
        </motion.button>
      </motion.div>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 shadow-2xl relative overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Gradient background animé */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'linear',
            }}
          />

          {/* Header avec avatar */}
          <div className="text-center mb-4 sm:mb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-2 sm:mb-3"
            >
              <span className="inline-block px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-pink-300 backdrop-blur-sm">
                Profil invité
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
              className="relative inline-block mb-3 sm:mb-4"
            >
              {avatarUrl ? (
                <motion.img
                  src={avatarUrl}
                  alt={userName}
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-pink-500/50 shadow-lg object-cover relative z-10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
              ) : (
                <motion.div
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-pink-500/50 shadow-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center relative z-10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <User className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
                </motion.div>
              )}
              <motion.div
                className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-1.5 sm:p-2 shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Award className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-pink-500/30"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            >
              {userName}
            </motion.h1>
            <p className="text-slate-400 text-xs sm:text-sm">Profil invité</p>
          </div>

          {/* Statistiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10"
          >
            {[
              { icon: Camera, value: userPhotos.length, label: userPhotos.length === 1 ? 'Photo' : 'Photos', color: 'text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20' },
              { icon: Heart, value: totalLikes, label: totalLikes === 1 ? 'Like' : 'Likes', color: 'text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20', fill: true },
              { icon: Smile, value: totalReactions, label: totalReactions === 1 ? 'Réaction' : 'Réactions', color: 'text-purple-400', gradient: 'from-purple-500/20 to-violet-500/20' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center relative overflow-hidden group cursor-pointer"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  animate={{ opacity: [0, 0.1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-6 md:w-7 md:h-8 mx-auto mb-1 sm:mb-2 ${stat.color} ${stat.fill ? 'fill-pink-400' : ''} relative z-10`} />
                <motion.div
                  className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 relative z-10"
                  animate={loading ? {} : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {loading ? '...' : stat.value}
                </motion.div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 relative z-10">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Badges et Milestones */}
          {!loading && userPhotos.length > 0 && (() => {
            // Récupérer toutes les photos de l'événement pour le calcul des badges
            // Note: On utilise seulement les photos de l'utilisateur pour les milestones
            const allPhotos = userPhotos; // Pour les badges, on a besoin de toutes les photos de l'événement
            // Pour l'instant, on utilise les photos de l'utilisateur seulement
            const authorBadges = getAuthorBadges(userName!, allPhotos, photosReactions);
            const milestones = getAuthorMilestones(userName!, allPhotos, photosReactions);
            const nextMilestone = getNextMilestone(userName!, allPhotos, photosReactions);
            const stats = getAuthorStats(userName!, allPhotos, photosReactions);

            return (
              <>
                {/* Badges */}
                {authorBadges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="mb-4 sm:mb-6 relative z-10"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-2 sm:mb-3">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      Mes badges
                    </h2>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {authorBadges.map((badge, index) => (
                        <motion.div
                          key={badge.type}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r ${badge.color} border border-white/20 shadow-lg relative overflow-hidden group cursor-pointer`}
                          title={badge.description}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="text-base sm:text-lg relative z-10">{badge.emoji}</span>
                          <span className="text-xs sm:text-sm font-bold text-white relative z-10">{badge.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Milestones */}
                {milestones.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="mb-4 sm:mb-6 relative z-10"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-2 sm:mb-3">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      Mes achievements
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                      {milestones.slice(0, 6).map((milestone, index) => (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3 text-center relative overflow-hidden group cursor-pointer"
                          title={milestone.description}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            animate={{ opacity: [0, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <motion.div
                            className="text-xl sm:text-2xl md:text-3xl mb-1 relative z-10"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            {milestone.emoji}
                          </motion.div>
                          <div className="text-[10px] sm:text-xs font-bold text-white mb-0.5 relative z-10">{milestone.label}</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400 truncate relative z-10">{milestone.description}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Prochain milestone */}
                {nextMilestone && stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="mb-4 sm:mb-6 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-3 sm:p-4 relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                    />
                    <div className="relative z-10">
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1.5 sm:mb-2 flex items-center gap-2">
                        <motion.span
                          className="text-base sm:text-lg"
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {nextMilestone.emoji}
                        </motion.span>
                        Prochain objectif
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-300 mb-2">{nextMilestone.description}</p>
                      <div className="w-full bg-gray-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden relative">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, ((() => {
                              let value = 0;
                              switch (nextMilestone.type) {
                                case 'photos': value = stats.photoCount; break;
                                case 'likes': value = stats.totalLikes; break;
                                case 'reactions': value = stats.totalReactions; break;
                                case 'score': value = stats.score; break;
                                case 'average': value = stats.averageLikes; break;
                              }
                              return (value / nextMilestone.threshold) * 100;
                            })()))}%`
                          }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                        </motion.div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 text-right">
                        {(() => {
                          let value = 0;
                          switch (nextMilestone.type) {
                            case 'photos': value = stats.photoCount; break;
                            case 'likes': value = stats.totalLikes; break;
                            case 'reactions': value = stats.totalReactions; break;
                            case 'score': value = stats.score; break;
                            case 'average': value = stats.averageLikes; break;
                          }
                          return `${Math.round(value)} / ${nextMilestone.threshold}`;
                        })()}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Score */}
                {stats && stats.score > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.9, type: 'spring' }}
                    className="mb-4 sm:mb-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                    />
                    <motion.div
                      className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1 relative z-10"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {Math.round(stats.score)} points
                    </motion.div>
                    <div className="text-[10px] sm:text-xs text-slate-400 relative z-10">Score de gamification</div>
                  </motion.div>
                )}
              </>
            );
          })()}

          {/* Liste des photos */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 sm:py-8 relative z-10"
            >
              <motion.div
                className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-pink-500/30 border-t-pink-500 rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-slate-400 mt-3 sm:mt-4 text-xs sm:text-sm"
              >
                Chargement de vos photos...
              </motion.p>
            </motion.div>
          ) : userPhotos.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="relative z-10"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                  </motion.div>
                  Mes photos
                </h2>
                {userPhotos.length > 3 && (
                  <motion.button
                    onClick={() => setShowAllPhotosModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium transition-all duration-300 group relative overflow-hidden"
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
                    title="Voir l'album complet"
                    aria-label="Voir l'album complet"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <span className="hidden sm:inline relative z-10">Album</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {userPhotos.slice(0, 3).map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05, z: 10 }}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <motion.img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium truncate mb-1.5 drop-shadow-lg">
                          {photo.caption || 'Sans légende'}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {/* Likes - Toujours afficher */}
                          <motion.div
                            initial={{ scale: 0 }}
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full"
                          >
                            <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                            <span className="text-white text-xs font-bold">{photo.likes_count ?? 0}</span>
                          </motion.div>
                          {/* Réactions */}
                          {photosReactions.get(photo.id) && Object.entries(photosReactions.get(photo.id)!).map(([type, count]) => {
                            if (!count || count === 0) return null;
                            const reaction = REACTIONS[type as keyof typeof REACTIONS];
                            if (!reaction) return null;
                            return (
                              <motion.div
                                key={type}
                                initial={{ scale: 0 }}
                                whileHover={{ scale: 1.1 }}
                                className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full"
                              >
                                <span className="text-xs">{reaction.emoji}</span>
                                <span className="text-white text-xs font-bold">{count}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              {userPhotos.length > 3 && (
                <motion.button
                  onClick={() => setShowAllPhotosModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 sm:mt-4 px-4 py-2.5 sm:py-3 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-medium transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
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
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                  <span className="relative z-10">Voir toutes les photos ({userPhotos.length})</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center py-6 sm:py-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl relative z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Camera className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-400" />
              </motion.div>
              <p className="text-slate-400 text-xs sm:text-sm">Vous n'avez pas encore partagé de photos</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Modal toutes les photos */}
      <AnimatePresence>
        {showAllPhotosModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              onClick={() => setShowAllPhotosModal(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <div
              className={`fixed inset-0 z-[100] flex ${isMobile ? 'items-start pt-4' : 'items-center'} justify-center p-2 sm:p-4 pointer-events-none overflow-y-auto`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-full min-h-[calc(100vh-2rem)]' : 'max-w-6xl max-h-[90vh]'} pointer-events-auto overflow-hidden flex flex-col relative`}
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Gradient background animé */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                />
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-white/10 flex-shrink-0 relative z-10">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-pink-400" />
                    Toutes mes photos ({userPhotos.length})
                  </h2>
                  <motion.button
                    onClick={() => setShowAllPhotosModal(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white transition-all duration-300 group overflow-hidden"
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
                    aria-label="Fermer"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10" />
                  </motion.button>
                </div>

                {/* Content - Grille de photos avec scroll */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-2 sm:p-3 md:p-4 relative z-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {userPhotos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, z: 10 }}
                        className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer"
                      >
                        <motion.img
                          src={photo.url}
                          alt={photo.caption || 'Photo'}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs sm:text-sm font-medium truncate mb-1.5 drop-shadow-lg">
                              {photo.caption || 'Sans légende'}
                            </p>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              {/* Likes */}
                              <motion.div
                                initial={{ scale: 0 }}
                                whileHover={{ scale: 1.1 }}
                                className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full"
                              >
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400 fill-pink-400" />
                                <span className="text-white text-xs sm:text-sm font-bold">{photo.likes_count ?? 0}</span>
                              </motion.div>
                              {/* Réactions */}
                              {photosReactions.get(photo.id) && Object.entries(photosReactions.get(photo.id)!).map(([type, count]) => {
                                if (!count || count === 0) return null;
                                const reaction = REACTIONS[type as keyof typeof REACTIONS];
                                if (!reaction) return null;
                                return (
                                  <motion.div
                                    key={type}
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full"
                                  >
                                    <span className="text-xs sm:text-sm">{reaction.emoji}</span>
                                    <span className="text-white text-xs sm:text-sm font-bold">{count}</span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuestProfile;

