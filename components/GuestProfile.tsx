import React, { useState, useEffect } from 'react';
import { X, User, Camera, Heart, Award, Smile, ChevronRight } from 'lucide-react';
import { getCurrentUserName, getCurrentUserAvatar } from '../utils/userAvatar';
import { getPhotosByAuthor, getPhotosReactions } from '../services/photoService';
import { Photo, ReactionCounts } from '../types';
import { REACTIONS } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEvent } from '../context/EventContext';

interface GuestProfileProps {
  onBack: () => void;
  key?: string | number; // Pour forcer le rafraîchissement
}

/**
 * Composant pour afficher le profil de l'invité
 */
const GuestProfile: React.FC<GuestProfileProps> = ({ onBack }) => {
  const { currentEvent } = useEvent();
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

  if (!userName) {
    return (
      <div className="h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pointer-events-none"></div>
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>

        <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full text-center" style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}>
          <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Aucun profil trouvé</h2>
          <p className="text-slate-400 mb-6">Vous devez créer un profil pour voir vos statistiques</p>
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

      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 relative p-2.5 sm:p-3 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 text-white transition-all duration-300 hover:scale-105 active:scale-95 group shadow-lg"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        aria-label="Retour"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100 blur-sm" />
        <X className="w-5 h-5 relative z-10" />
      </button>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl" style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}>
          {/* Header avec avatar */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-pink-500/50 shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-pink-500/50 shadow-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-2 shadow-lg">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {userName}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Votre profil</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-2 text-pink-400" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                {loading ? '...' : userPhotos.length}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">
                {userPhotos.length === 1 ? 'Photo' : 'Photos'}
              </div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-2 text-pink-400 fill-pink-400" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                {loading ? '...' : totalLikes}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">
                {totalLikes === 1 ? 'Like' : 'Likes'}
              </div>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
              <Smile className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                {loading ? '...' : totalReactions}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">
                {totalReactions === 1 ? 'Réaction' : 'Réactions'}
              </div>
            </div>
          </div>

          {/* Liste des photos */}
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-4 text-sm">Chargement de vos photos...</p>
            </div>
          ) : userPhotos.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-400" />
                  Vos photos
                </h2>
                {userPhotos.length > 3 && (
                  <button
                    onClick={() => setShowAllPhotosModal(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 group"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                    title="Voir l'album complet"
                    aria-label="Voir l'album complet"
                  >
                    <span className="hidden sm:inline">Album</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {userPhotos.slice(0, 3).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium truncate mb-1.5 drop-shadow-lg">
                          {photo.caption || 'Sans légende'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Likes - Toujours afficher */}
                          <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                            <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                            <span className="text-white text-xs font-bold">{photo.likes_count ?? 0}</span>
                          </div>
                          {/* Réactions */}
                          {photosReactions.get(photo.id) && Object.entries(photosReactions.get(photo.id)!).map(([type, count]) => {
                            if (!count || count === 0) return null;
                            const reaction = REACTIONS[type as keyof typeof REACTIONS];
                            if (!reaction) return null;
                            return (
                              <div key={type} className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                <span className="text-xs">{reaction.emoji}</span>
                                <span className="text-white text-xs font-bold">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {userPhotos.length > 3 && (
                <button
                  onClick={() => setShowAllPhotosModal(true)}
                  className="w-full mt-3 sm:mt-4 px-4 py-2.5 sm:py-3 backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span>Voir toutes les photos ({userPhotos.length})</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
              <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-50" />
              <p className="text-slate-400 text-sm sm:text-base">Vous n'avez pas encore partagé de photos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal toutes les photos */}
      {showAllPhotosModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-fade-in"
            onClick={() => setShowAllPhotosModal(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className={`fixed inset-0 z-[100] flex ${isMobile ? 'items-start pt-4' : 'items-center'} justify-center p-2 sm:p-4 pointer-events-none overflow-y-auto`}
          >
            <div
              className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-full min-h-[calc(100vh-2rem)]' : 'max-w-6xl max-h-[90vh]'} pointer-events-auto animate-scale-in overflow-hidden flex flex-col`}
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 flex-shrink-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                  Toutes vos photos ({userPhotos.length})
                </h2>
                <button
                  onClick={() => setShowAllPhotosModal(false)}
                  className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 text-white transition-all duration-300 hover:scale-105 active:scale-95 group"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                  aria-label="Fermer"
                >
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100 blur-sm" />
                  <X className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                </button>
              </div>

              {/* Content - Grille de photos avec scroll */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {userPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs sm:text-sm font-medium truncate mb-1.5 drop-shadow-lg">
                            {photo.caption || 'Sans légende'}
                          </p>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {/* Likes */}
                            <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400 fill-pink-400" />
                              <span className="text-white text-xs sm:text-sm font-bold">{photo.likes_count ?? 0}</span>
                            </div>
                            {/* Réactions */}
                            {photosReactions.get(photo.id) && Object.entries(photosReactions.get(photo.id)!).map(([type, count]) => {
                              if (!count || count === 0) return null;
                              const reaction = REACTIONS[type as keyof typeof REACTIONS];
                              if (!reaction) return null;
                              return (
                                <div key={type} className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                  <span className="text-xs sm:text-sm">{reaction.emoji}</span>
                                  <span className="text-white text-xs sm:text-sm font-bold">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GuestProfile;

