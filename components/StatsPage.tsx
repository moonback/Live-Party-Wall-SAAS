import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Photo, ReactionCounts, PhotoBattle } from '../types';
import { generateLeaderboard, getStarPhoto, getTopPhotographer } from '../services/gamificationService';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import { getBaseUrl } from '../utils/urlUtils';
import { getPhotoReactions, getPhotos } from '../services/photoService';
import { usePhotos } from '../context/PhotosContext';
import { useEvent } from '../context/EventContext';
import { getFinishedBattles } from '../services/battleService';
import { getAllGuests } from '../services/guestService';
import { StatsTopBar } from './stats/StatsTopBar';
import { StatsCards } from './stats/StatsCards';
import { PodiumDisplay } from './stats/PodiumDisplay';
import { PodiumNormal } from './stats/PodiumNormal';
import { LeaderboardDisplay } from './stats/LeaderboardDisplay';
import { LeaderboardNormal } from './stats/LeaderboardNormal';
import { StarPhotoCard } from './stats/StarPhotoCard';
import { TopPhotographerCard } from './stats/TopPhotographerCard';
import { PhotoBattlesResults } from './stats/PhotoBattlesResults';
import { StarPhotoModal } from './stats/StarPhotoModal';
import { BattleDetailsModal } from './stats/BattleDetailsModal';

interface StatsPageProps {
  photos: Photo[];
  onBack?: () => void;
  isDisplayMode?: boolean; // Mode écran dédié (sans bouton retour, plein écran)
  onPhotosUpdate?: (photos: Photo[]) => void; // Callback pour mettre à jour les photos depuis le parent
}

const StatsPage: React.FC<StatsPageProps> = ({ photos, onBack, isDisplayMode = false, onPhotosUpdate }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [leaderboardPage, setLeaderboardPage] = useState(0);
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [finishedBattles, setFinishedBattles] = useState<PhotoBattle[]>([]);
  const [selectedBattle, setSelectedBattle] = useState<PhotoBattle | null>(null);
  const [showStarPhotoModal, setShowStarPhotoModal] = useState(false);
  const [guestAvatars, setGuestAvatars] = useState<Map<string, string>>(new Map());
  const { refresh: refreshPhotos } = usePhotos();
  const { currentEvent } = useEvent();

  // Mode plein écran automatique pour l'écran dédié
  useEffect(() => {
    if (isDisplayMode) {
      // Essayer d'activer le plein écran
      const requestFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
          });
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen();
        }
      };
      
      // Attendre un peu avant de demander le plein écran
      const timer = setTimeout(requestFullscreen, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isDisplayMode]);

  // Mettre à jour l'heure toutes les secondes pour les stats en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour charger les réactions
  const loadReactions = useCallback(async (photosToLoad: Photo[]) => {
    const reactionsMap = new Map<string, ReactionCounts>();
    await Promise.all(
      photosToLoad.map(async (photo) => {
        const reactions = await getPhotoReactions(photo.id);
        if (Object.keys(reactions).length > 0) {
          reactionsMap.set(photo.id, reactions);
        }
      })
    );
    setPhotosReactions(reactionsMap);
  }, []);

  // Charger les réactions pour toutes les photos
  useEffect(() => {
    if (photos.length > 0) {
      loadReactions(photos);
    }
  }, [photos.length, loadReactions]);

  // Charger les battles terminées et les avatars des invités
  useEffect(() => {
    // Ne rien faire si l'événement n'est pas chargé
    if (!currentEvent?.id) {
      return;
    }

    const loadFinishedBattles = async () => {
      try {
        // Passer l'ID de l'événement et 10 comme limit
        const battles = await getFinishedBattles(currentEvent.id, 10); // Les 10 dernières battles terminées
        setFinishedBattles(battles);
      } catch (error) {
        console.error('Error loading finished battles:', error);
      }
    };

    const loadGuestAvatars = async () => {
      try {
        // Passer l'ID de l'événement
        const allGuests = await getAllGuests(currentEvent.id);
        // Créer un mapping nom -> avatar_url pour les invités
        // Trier par updatedAt décroissant pour prendre le dernier avatar de chaque invité
        const avatarsMap = new Map<string, string>();
        const sortedGuests = [...allGuests].sort((a, b) => b.updatedAt - a.updatedAt);
        sortedGuests.forEach(guest => {
          // Prendre le premier (dernier mis à jour) avatar pour chaque nom
          if (!avatarsMap.has(guest.name)) {
            avatarsMap.set(guest.name, guest.avatarUrl);
          }
        });
        setGuestAvatars(avatarsMap);
      } catch (error) {
        console.error('Error loading guest avatars:', error);
      }
    };

    loadFinishedBattles();
    loadGuestAvatars();
  }, [currentEvent?.id]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Rafraîchir les photos depuis le contexte
      await refreshPhotos();
      
      // Si onPhotosUpdate est fourni, recharger aussi depuis le service
      if (onPhotosUpdate) {
        const updatedPhotos = await getPhotos();
        onPhotosUpdate(updatedPhotos);
        // Recharger les réactions avec les nouvelles photos
        await loadReactions(updatedPhotos);
      } else {
        // Recharger les réactions avec les photos actuelles
        await loadReactions(photos);
      }
      
      // Recharger les battles terminées
      if (currentEvent?.id) {
        const battles = await getFinishedBattles(currentEvent.id, 10);
        setFinishedBattles(battles);
      }
      
      // Recharger les avatars des invités
      if (currentEvent?.id) {
        const allGuests = await getAllGuests(currentEvent.id);
        const avatarsMap = new Map<string, string>();
        const sortedGuests = [...allGuests].sort((a, b) => b.updatedAt - a.updatedAt);
        sortedGuests.forEach(guest => {
          if (!avatarsMap.has(guest.name)) {
            avatarsMap.set(guest.name, guest.avatarUrl);
          }
        });
        setGuestAvatars(avatarsMap);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPhotos, onPhotosUpdate, loadReactions, photos]);

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const leaderboard = generateLeaderboard(photos);
    const starPhoto = getStarPhoto(photos);
    const topPhotographer = getTopPhotographer(photos);

    // Statistiques globales
    const totalPhotos = photos.length;
    const totalLikes = photos.reduce((sum, p) => sum + p.likes_count, 0);
    const uniqueAuthors = new Set(photos.map(p => p.author)).size;
    const averageLikesPerPhoto = totalPhotos > 0 ? (totalLikes / totalPhotos).toFixed(1) : '0';

    // Calculer le total des réactions
    let totalReactions = 0;
    photosReactions.forEach((reactions) => {
      Object.values(reactions).forEach(count => {
        totalReactions += count || 0;
      });
    });
    const averageReactionsPerPhoto = totalPhotos > 0 ? (totalReactions / totalPhotos).toFixed(1) : '0';

    // Photos par type
    const photoCount = photos.filter(p => p.type === 'photo').length;
    const videoCount = photos.filter(p => p.type === 'video').length;

    // Photos récentes (dernières 5 minutes)
    const recentPhotos = photos.filter(p => {
      const photoTime = p.timestamp;
      const fiveMinutesAgo = currentTime - 5 * 60 * 1000;
      return photoTime >= fiveMinutesAgo;
    }).length;

    // Top 3
    const top3 = leaderboard.slice(0, 3);

    return {
      leaderboard,
      starPhoto,
      topPhotographer,
      totalPhotos,
      totalLikes,
      totalReactions,
      uniqueAuthors,
      averageLikesPerPhoto,
      averageReactionsPerPhoto,
      photoCount,
      videoCount,
      recentPhotos,
      top3,
    };
  }, [photos, currentTime, photosReactions]);

  // Pagination auto du classement sur l'écran dédié (pour éviter le scroll)
  useEffect(() => {
    if (!isDisplayMode) return;

    const RUNNERS_PER_PAGE = 8; // 4..11 environ par page (hors podium)
    const totalRunners = Math.max(0, stats.leaderboard.length - 3);
    const pageCount = Math.max(1, Math.ceil(totalRunners / RUNNERS_PER_PAGE));

    // Reset si le classement change
    setLeaderboardPage((p) => (p >= pageCount ? 0 : p));

    if (pageCount <= 1) return;

    const interval = setInterval(() => {
      setLeaderboardPage((p) => (p + 1) % pageCount);
    }, 10000);

    return () => clearInterval(interval);
  }, [isDisplayMode, stats.leaderboard.length]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScore = (photoCount: number, totalLikes: number) => {
    // Score simple, lisible, “compétition”
    return totalLikes * 10 + photoCount * 5;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/30';
    return 'from-gray-800/30 to-gray-800/30 border-gray-700/20';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Mode écran dédié (grand écran) — NO SCROLL + auto-pagination
  if (isDisplayMode) {
    const uploadUrl = `${getBaseUrl()}?mode=guest`;

    const RUNNERS_PER_PAGE = 8;
    const runners = stats.leaderboard.slice(3); // ranks 4+
    const pageCount = Math.max(1, Math.ceil(runners.length / RUNNERS_PER_PAGE));
    const pageStart = leaderboardPage * RUNNERS_PER_PAGE;
    const pageItems = runners.slice(pageStart, pageStart + RUNNERS_PER_PAGE);

    return (
      <div className="h-screen w-full overflow-hidden bg-gray-950 p-3 md:p-4 lg:p-6 flex flex-col gap-2 md:gap-3 lg:gap-4">
        <StatsTopBar
          currentTime={currentTime}
          totalPhotos={stats.totalPhotos}
          totalLikes={stats.totalLikes}
          recentPhotos={stats.recentPhotos}
          uniqueAuthors={stats.uniqueAuthors}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onBack={onBack}
        />

        {/* Main grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 lg:gap-4">
          {/* Left: Podium + Awards + Battles */}
          <div className="col-span-1 md:col-span-8 min-h-0 flex flex-col gap-2 md:gap-3 lg:gap-4">
            <PodiumDisplay top3={stats.top3} guestAvatars={guestAvatars} />

            {/* Awards row (fixed height) */}
            <div className="shrink-0 h-auto md:h-32 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 lg:gap-4">
              <StarPhotoCard
                starPhoto={stats.starPhoto}
                photosReactions={photosReactions}
                formatTime={formatTime}
                onClick={() => stats.starPhoto && setShowStarPhotoModal(true)}
                variant="display"
              />
              <TopPhotographerCard
                topPhotographer={stats.topPhotographer}
                uploadUrl={uploadUrl}
                variant="display"
              />
            </div>

            {/* Résultats des Photo Battles (sous Photo Star et Top Photographer) */}
            <div className="flex-1 min-h-0">
              <PhotoBattlesResults
                finishedBattles={finishedBattles}
                onBattleClick={setSelectedBattle}
                formatTime={formatTime}
                variant="display"
              />
            </div>
          </div>

          {/* Right: Leaderboard (no scroll, auto pages) */}
          <div className="col-span-1 md:col-span-4">
            <LeaderboardDisplay
              runners={runners}
              leaderboardPage={leaderboardPage}
              pageCount={pageCount}
              pageStart={pageStart}
              pageItems={pageItems}
              photos={photos}
              photosReactions={photosReactions}
              uploadUrl={uploadUrl}
              getScore={getScore}
              guestAvatars={guestAvatars}
            />
          </div>
        </div>

        {/* Modals */}
        {showStarPhotoModal && stats.starPhoto && (
          <StarPhotoModal
            starPhoto={stats.starPhoto}
            photosReactions={photosReactions}
            formatTime={formatTime}
            onClose={() => setShowStarPhotoModal(false)}
          />
        )}

        {selectedBattle && (
          <BattleDetailsModal
            battle={selectedBattle}
            formatTime={formatTime}
            onClose={() => setSelectedBattle(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-3 md:p-4 lg:p-6">
      {/* Header */}
        <div className="max-w-7xl mx-auto mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-5">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white flex items-center gap-1.5 md:gap-2">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" />
                <span className="truncate">Statistiques en Direct</span>
              </h1>
              <p className="text-gray-400 mt-0.5 text-xs md:text-sm">Compétition des invités</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 text-purple-300 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            title="Actualiser les données"
            aria-label="Actualiser"
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs md:text-sm font-medium">Actualiser</span>
          </button>
        </div>

        <StatsCards
          totalPhotos={stats.totalPhotos}
          photoCount={stats.photoCount}
          videoCount={stats.videoCount}
          totalLikes={stats.totalLikes}
          averageLikesPerPhoto={stats.averageLikesPerPhoto}
          totalReactions={stats.totalReactions}
          averageReactionsPerPhoto={stats.averageReactionsPerPhoto}
          uniqueAuthors={stats.uniqueAuthors}
          recentPhotos={stats.recentPhotos}
        />

        <PodiumNormal
          top3={stats.top3}
          photos={photos}
          photosReactions={photosReactions}
          guestAvatars={guestAvatars}
        />

        {/* Photo Star & Top Photographer */}
        {(stats.starPhoto || stats.topPhotographer) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
            {stats.starPhoto && (
              <StarPhotoCard
                starPhoto={stats.starPhoto}
                photosReactions={photosReactions}
                formatTime={formatTime}
                onClick={() => setShowStarPhotoModal(true)}
                variant="normal"
              />
            )}

            {stats.topPhotographer && (
              <TopPhotographerCard
                topPhotographer={stats.topPhotographer}
                uploadUrl={`${getBaseUrl()}?mode=guest`}
                variant="normal"
              />
            )}
          </div>
        )}

        <LeaderboardNormal
          leaderboard={stats.leaderboard}
          photos={photos}
          photosReactions={photosReactions}
          getRankIcon={getRankIcon}
          getRankColor={getRankColor}
          guestAvatars={guestAvatars}
        />

        <PhotoBattlesResults
          finishedBattles={finishedBattles}
          onBattleClick={setSelectedBattle}
          formatTime={formatTime}
          variant="normal"
        />

        {/* Modals */}
        {showStarPhotoModal && stats.starPhoto && (
          <StarPhotoModal
            starPhoto={stats.starPhoto}
            photosReactions={photosReactions}
            formatTime={formatTime}
            onClose={() => setShowStarPhotoModal(false)}
          />
        )}

        {selectedBattle && (
          <BattleDetailsModal
            battle={selectedBattle}
            formatTime={formatTime}
            onClose={() => setSelectedBattle(null)}
          />
        )}
      </div>
    </div>
  );
};

export default StatsPage;

