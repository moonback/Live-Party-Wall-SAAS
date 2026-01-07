import React, { useMemo, useState, useEffect } from 'react';
import { Photo, ReactionCounts } from '../types';
import { BarChart3, TrendingUp, Users, Heart, Camera, Video, Clock, Zap, Award, Activity, Download } from 'lucide-react';
import { getPhotoReactions } from '../services/photoService';
import { REACTIONS, REACTION_TYPES } from '../constants';

interface AnalyticsViewProps {
  photos: Photo[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ photos }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day'>('hour');
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());

  // Charger les réactions pour toutes les photos
  useEffect(() => {
    const loadReactions = async () => {
      const reactionsMap = new Map<string, ReactionCounts>();
      await Promise.all(
        photos.map(async (photo) => {
          const reactions = await getPhotoReactions(photo.id);
          if (Object.keys(reactions).length > 0) {
            reactionsMap.set(photo.id, reactions);
          }
        })
      );
      setPhotosReactions(reactionsMap);
    };
    
    if (photos.length > 0) {
      loadReactions();
    }
  }, [photos.length]);

  const stats = useMemo(() => {
    const totalPhotos = photos.length;
    const totalLikes = photos.reduce((acc, p) => acc + (p.likes_count || 0), 0);
    const uniqueAuthors = new Set(photos.map(p => p.author)).size;
    
    // Calculer le total des réactions
    let totalReactions = 0;
    const reactionsByType: Record<string, number> = {};
    photosReactions.forEach((reactions) => {
      Object.entries(reactions).forEach(([type, count]) => {
        totalReactions += count || 0;
        reactionsByType[type] = (reactionsByType[type] || 0) + (count || 0);
      });
    });
    
    // Photos vs Vidéos
    const photosCount = photos.filter(p => p.type === 'photo').length;
    const videosCount = photos.filter(p => p.type === 'video').length;
    
    // Top auteurs avec likes et réactions
    const authorStats: Record<string, { count: number; likes: number; reactions: number }> = {};
    photos.forEach(p => {
      if (!authorStats[p.author]) {
        authorStats[p.author] = { count: 0, likes: 0, reactions: 0 };
      }
      authorStats[p.author].count += 1;
      authorStats[p.author].likes += p.likes_count || 0;
      
      // Ajouter les réactions de cette photo
      const photoReactions = photosReactions.get(p.id);
      if (photoReactions) {
        Object.values(photoReactions).forEach(count => {
          authorStats[p.author].reactions += count || 0;
        });
      }
    });
    
    const topAuthors = Object.entries(authorStats)
      .map(([name, stats]) => ({ name, count: stats.count, likes: stats.likes, reactions: stats.reactions }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activité par heure
    const hoursActivity: Record<string, number> = {};
    photos.forEach(p => {
      const hour = new Date(p.timestamp).getHours();
      const label = `${hour}h`;
      hoursActivity[label] = (hoursActivity[label] || 0) + 1;
    });

    // Activité par jour (derniers 7 jours)
    const daysActivity: Record<string, number> = {};
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    photos.forEach(p => {
      if (p.timestamp >= sevenDaysAgo) {
        const date = new Date(p.timestamp);
        const dayLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        daysActivity[dayLabel] = (daysActivity[dayLabel] || 0) + 1;
      }
    });

    const sortedHours = Object.entries(hoursActivity)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    const sortedDays = Object.entries(daysActivity)
      .sort((a, b) => {
        const dateA = new Date(a[0].split(' ')[1] + ' ' + new Date().getFullYear());
        const dateB = new Date(b[0].split(' ')[1] + ' ' + new Date().getFullYear());
        return dateA.getTime() - dateB.getTime();
      });

    // Photo la plus likée
    const mostLikedPhoto = photos.reduce((max, p) => 
      (p.likes_count || 0) > (max?.likes_count || 0) ? p : max, 
      photos[0] || null
    );

    // Temps moyen entre les photos (en minutes)
    const timeDiffs: number[] = [];
    const sortedByTime = [...photos].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < sortedByTime.length; i++) {
      timeDiffs.push((sortedByTime[i].timestamp - sortedByTime[i-1].timestamp) / (1000 * 60));
    }
    const avgTimeBetween = timeDiffs.length > 0 
      ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length 
      : 0;

    // Pic d'activité (heure avec le plus de photos)
    const peakHour = sortedHours.length > 0
      ? sortedHours.reduce((max, [hour, count]) => 
          count > max.count ? { hour, count } : max, 
          { hour: sortedHours[0][0], count: sortedHours[0][1] }
        )
      : null;

    return { 
      totalPhotos, 
      totalLikes,
      totalReactions,
      reactionsByType,
      uniqueAuthors, 
      topAuthors, 
      sortedHours,
      sortedDays,
      photosCount,
      videosCount,
      mostLikedPhoto,
      avgTimeBetween,
      peakHour,
      avgLikesPerPhoto: totalPhotos > 0 ? (totalLikes / totalPhotos).toFixed(1) : '0',
      avgReactionsPerPhoto: totalPhotos > 0 ? (totalReactions / totalPhotos).toFixed(1) : '0'
    };
  }, [photos, photosReactions]);

  // Calcul pour le graphique (hauteur relative)
  const currentData = selectedTimeframe === 'hour' ? stats.sortedHours : stats.sortedDays;
  const maxActivity = Math.max(...currentData.map(([, c]) => c), 1);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      {/* KPI Cards - Design moderne avec gradients */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl">
              <Camera className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Total Médias</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stats.totalPhotos}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {stats.photosCount}
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {stats.videosCount}
            </span>
          </div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-xl">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-400 fill-red-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Total Likes</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stats.totalLikes}</p>
          <p className="text-xs text-slate-400">
            <span className="text-pink-400 font-bold">{stats.avgLikesPerPhoto}</span> likes/média
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl">
              <span className="text-lg md:text-xl">💬</span>
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Total Réactions</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stats.totalReactions}</p>
          <p className="text-xs text-slate-400">
            <span className="text-yellow-400 font-bold">{stats.avgReactionsPerPhoto}</span> réactions/média
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Participants</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stats.uniqueAuthors}</p>
          <p className="text-xs text-slate-400">
            {stats.totalPhotos > 0 
              ? `${(stats.totalPhotos / stats.uniqueAuthors).toFixed(1)} médias/personne`
              : '0 médias/personne'}
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-xl">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Pic d'Activité</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">
            {stats.peakHour ? `${stats.peakHour.hour}` : '--'}
          </p>
          <p className="text-xs text-slate-400">
            {stats.peakHour ? `${stats.peakHour.count} médias` : 'Aucune donnée'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Graphique Activité */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-500" />
              Activité
            </h3>
            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setSelectedTimeframe('hour')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedTimeframe === 'hour'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Par heure
              </button>
              <button
                onClick={() => setSelectedTimeframe('day')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedTimeframe === 'day'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Par jour
              </button>
            </div>
          </div>
          
          <div className="h-48 md:h-64 flex items-end gap-1 md:gap-2">
            {currentData.length > 0 ? (
                currentData.map(([label, count], idx) => (
                <div key={`${label}-${idx}`} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                        className="w-full bg-gradient-to-t from-pink-500 via-purple-500 to-indigo-500 rounded-t-lg transition-all relative group-hover:scale-y-110 origin-bottom shadow-lg hover:shadow-pink-500/50"
                        style={{ 
                          height: `${(count / maxActivity) * 100}%`, 
                          minHeight: '4px',
                          animationDelay: `${idx * 50}ms`
                        }}
                    >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/20 shadow-xl z-10">
                            <div className="font-bold">{count} média{count > 1 ? 's' : ''}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/20 rotate-45 -mb-1"></div>
                        </div>
                    </div>
                    <span className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">{label}</span>
                </div>
                ))
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm italic">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Pas encore de données d'activité</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Top Auteurs */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Contributeurs
          </h3>
          
          <div className="space-y-3">
            {stats.topAuthors.length > 0 ? (
                stats.topAuthors.map((author, idx) => (
                <div 
                  key={author.name} 
                  className="group flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`relative w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm shadow-lg ${
                            idx === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 text-yellow-300 border-2 border-yellow-500/50' : 
                            idx === 1 ? 'bg-gradient-to-br from-slate-400/30 to-slate-500/30 text-slate-300 border-2 border-slate-400/50' : 
                            'bg-gradient-to-br from-orange-600/30 to-orange-700/30 text-orange-300 border-2 border-orange-600/50'
                        }`}>
                            {idx === 0 && <span className="absolute -top-1 -right-1 text-lg">🥇</span>}
                            {idx === 1 && <span className="absolute -top-1 -right-1 text-lg">🥈</span>}
                            {idx === 2 && <span className="absolute -top-1 -right-1 text-lg">🥉</span>}
                            {idx > 2 && <span>{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{author.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                              <span>{author.likes}</span>
                            </div>
                            {author.reactions > 0 && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <span>💬</span>
                                <span>{author.reactions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm md:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                          {author.count}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">médias</div>
                      </div>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center text-slate-500 py-12">
                  <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="italic">Le podium est vide pour le moment...</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Photo la plus likée */}
        {stats.mostLikedPhoto && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Star du Mur
            </h4>
            <div className="space-y-2">
              <p className="text-white font-bold truncate">{stats.mostLikedPhoto.author}</p>
              <p className="text-xs text-slate-400 line-clamp-2">{stats.mostLikedPhoto.caption}</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                  <span className="text-lg font-extrabold text-pink-400">{stats.mostLikedPhoto.likes_count}</span>
                  <span className="text-xs text-slate-400">likes</span>
                </div>
                {photosReactions.get(stats.mostLikedPhoto.id) && Object.entries(photosReactions.get(stats.mostLikedPhoto.id)!).map(([type, count]) => {
                  if (count === 0) return null;
                  const reaction = REACTIONS[type as keyof typeof REACTIONS];
                  if (!reaction) return null;
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="text-base">{reaction.emoji}</span>
                      <span className="text-sm font-extrabold text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Temps moyen entre médias */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            Rythme
          </h4>
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-extrabold text-white">
              {stats.avgTimeBetween > 0 
                ? stats.avgTimeBetween < 60
                  ? `${Math.round(stats.avgTimeBetween)}min`
                  : `${(stats.avgTimeBetween / 60).toFixed(1)}h`
                : '--'}
            </p>
            <p className="text-xs text-slate-400">Temps moyen entre médias</p>
          </div>
        </div>

        {/* Répartition Photos/Vidéos */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            Répartition
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Photos
                </span>
                <span className="text-xs font-bold text-white">{stats.photosCount}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalPhotos > 0 ? (stats.photosCount / stats.totalPhotos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Vidéos
                </span>
                <span className="text-xs font-bold text-white">{stats.videosCount}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalPhotos > 0 ? (stats.videosCount / stats.totalPhotos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Réactions par Type */}
        {stats.totalReactions > 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">💬</span>
              Réactions par Type
            </h4>
            <div className="space-y-2">
              {REACTION_TYPES.map((type) => {
                const count = stats.reactionsByType[type] || 0;
                if (count === 0) return null;
                const reaction = REACTIONS[type];
                const percentage = stats.totalReactions > 0 ? (count / stats.totalReactions) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="text-base">{reaction.emoji}</span>
                        <span>{reaction.label}</span>
                      </span>
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;

