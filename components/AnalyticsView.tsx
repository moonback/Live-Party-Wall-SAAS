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
    <div className="space-y-3 md:space-y-4 animate-fade-in">
      {/* KPI Cards - Design moderne compact */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 md:gap-3">
        <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-pink-500/20 transition-transform duration-300 group-hover:scale-110">
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{stats.totalPhotos.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">Total Médias</div>
              <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-white/40 mt-1">
                <span className="flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5" />
                  {stats.photosCount}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-2.5 h-2.5" />
                  {stats.videosCount}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </div>
        
        <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-red-500/20 transition-transform duration-300 group-hover:scale-110">
                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400 fill-red-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{stats.totalLikes.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">Total Likes</div>
              <div className="text-[9px] md:text-[10px] text-white/40 mt-1">
                <span className="text-pink-400 font-semibold">{stats.avgLikesPerPhoto}</span> likes/média
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </div>

        <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-yellow-500/20 transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{stats.totalReactions.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">Total Réactions</div>
              <div className="text-[9px] md:text-[10px] text-white/40 mt-1">
                <span className="text-yellow-400 font-semibold">{stats.avgReactionsPerPhoto}</span> réactions/média
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </div>

        <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{stats.uniqueAuthors.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">Participants</div>
              <div className="text-[9px] md:text-[10px] text-white/40 mt-1">
                {stats.totalPhotos > 0 
                  ? `${(stats.totalPhotos / stats.uniqueAuthors).toFixed(1)} médias/personne`
                  : '0 médias/personne'}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </div>

        <div className="group relative bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xl md:text-2xl font-bold text-white tabular-nums">
                {stats.peakHour ? stats.peakHour.hour : '--'}
              </div>
              <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">Pic d'Activité</div>
              <div className="text-[9px] md:text-[10px] text-white/40 mt-1">
                {stats.peakHour ? `${stats.peakHour.count} médias` : 'Aucune donnée'}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
        {/* Graphique Activité */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
              <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white">Activité</h3>
            </div>
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setSelectedTimeframe('hour')}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all duration-300 ${
                  selectedTimeframe === 'hour'
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white shadow-md border border-pink-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Par heure
              </button>
              <button
                onClick={() => setSelectedTimeframe('day')}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all duration-300 ${
                  selectedTimeframe === 'day'
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white shadow-md border border-pink-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Par jour
              </button>
            </div>
          </div>
          
          <div className="h-40 md:h-56 flex items-end gap-1 md:gap-1.5">
            {currentData.length > 0 ? (
                currentData.map(([label, count], idx) => (
                <div key={`${label}-${idx}`} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div 
                        className="w-full bg-gradient-to-t from-pink-500 via-purple-500 to-indigo-500 rounded-t-lg transition-all duration-300 relative group-hover:scale-y-110 origin-bottom shadow-md hover:shadow-pink-500/50"
                        style={{ 
                          height: `${(count / maxActivity) * 100}%`, 
                          minHeight: '4px'
                        }}
                    >
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white text-[10px] md:text-xs py-1.5 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/20 shadow-xl z-10">
                            <div className="font-bold">{count} média{count > 1 ? 's' : ''}</div>
                            <div className="text-[9px] text-white/60 mt-0.5">{label}</div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/90 border-r border-b border-white/20 rotate-45 -mb-0.5"></div>
                        </div>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-white/50 font-medium">{label}</span>
                </div>
                ))
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-xs md:text-sm italic">
                    <div className="text-center">
                      <Activity className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-30" />
                      <p>Pas encore de données d'activité</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Top Auteurs */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
            <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white">Top Contributeurs</h3>
          </div>
          
          <div className="space-y-2 md:space-y-2.5">
            {stats.topAuthors.length > 0 ? (
                stats.topAuthors.map((author, idx) => (
                <div 
                  key={author.name} 
                  className="group flex items-center justify-between p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
                >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg font-bold text-xs md:text-sm shadow-md ${
                            idx === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 text-yellow-300 border border-yellow-500/50' : 
                            idx === 1 ? 'bg-gradient-to-br from-slate-400/30 to-slate-500/30 text-slate-300 border border-slate-400/50' : 
                            'bg-gradient-to-br from-orange-600/30 to-orange-700/30 text-orange-300 border border-orange-600/50'
                        }`}>
                            {idx === 0 && <span className="absolute -top-0.5 -right-0.5 text-sm">🥇</span>}
                            {idx === 1 && <span className="absolute -top-0.5 -right-0.5 text-sm">🥈</span>}
                            {idx === 2 && <span className="absolute -top-0.5 -right-0.5 text-sm">🥉</span>}
                            {idx > 2 && <span>{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base text-white truncate">{author.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/50">
                              <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 text-pink-400 fill-pink-400" />
                              <span>{author.likes}</span>
                            </div>
                            {author.reactions > 0 && (
                              <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/50">
                                <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" />
                                <span>{author.reactions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                          {author.count}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-white/50 uppercase">médias</div>
                      </div>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center text-white/40 py-8 md:py-12">
                  <Award className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-xs md:text-sm italic">Le podium est vide pour le moment...</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Photo la plus likée */}
        {stats.mostLikedPhoto && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
              </div>
              <h4 className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wider">Star du Mur</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm md:text-base font-bold text-white truncate">{stats.mostLikedPhoto.author}</p>
              {stats.mostLikedPhoto.caption && (
                <p className="text-[10px] md:text-xs text-white/50 line-clamp-2">{stats.mostLikedPhoto.caption}</p>
              )}
              <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-1 rounded-lg border border-pink-500/20">
                  <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                  <span className="text-sm md:text-base font-bold text-pink-400">{stats.mostLikedPhoto.likes_count}</span>
                </div>
                {photosReactions.get(stats.mostLikedPhoto.id) && Object.entries(photosReactions.get(stats.mostLikedPhoto.id)!).map(([type, count]) => {
                  if (count === 0) return null;
                  const reaction = REACTIONS[type as keyof typeof REACTIONS];
                  if (!reaction) return null;
                  return (
                    <div key={type} className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                      <span className="text-sm">{reaction.emoji}</span>
                      <span className="text-xs md:text-sm font-bold text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Temps moyen entre médias */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
            </div>
            <h4 className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wider">Rythme</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xl md:text-2xl font-bold text-white">
              {stats.avgTimeBetween > 0 
                ? stats.avgTimeBetween < 60
                  ? `${Math.round(stats.avgTimeBetween)}min`
                  : `${(stats.avgTimeBetween / 60).toFixed(1)}h`
                : '--'}
            </p>
            <p className="text-[10px] md:text-xs text-white/50">Temps moyen entre médias</p>
          </div>
        </div>

        {/* Répartition Photos/Vidéos */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
            </div>
            <h4 className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wider">Répartition</h4>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] md:text-xs text-white/60 flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  Photos
                </span>
                <span className="text-xs md:text-sm font-bold text-white">{stats.photosCount}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${stats.totalPhotos > 0 ? (stats.photosCount / stats.totalPhotos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] md:text-xs text-white/60 flex items-center gap-1">
                  <Video className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  Vidéos
                </span>
                <span className="text-xs md:text-sm font-bold text-white">{stats.videosCount}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${stats.totalPhotos > 0 ? (stats.videosCount / stats.totalPhotos) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Réactions par Type */}
        {stats.totalReactions > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
              </div>
              <h4 className="text-xs md:text-sm font-semibold text-white/80 uppercase tracking-wider">Réactions</h4>
            </div>
            <div className="space-y-2">
              {REACTION_TYPES.map((type) => {
                const count = stats.reactionsByType[type] || 0;
                if (count === 0) return null;
                const reaction = REACTIONS[type];
                const percentage = stats.totalReactions > 0 ? (count / stats.totalReactions) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] md:text-xs text-white/60 flex items-center gap-1">
                        <span className="text-xs md:text-sm">{reaction.emoji}</span>
                        <span className="truncate">{reaction.label}</span>
                      </span>
                      <span className="text-xs md:text-sm font-bold text-white">{count}</span>
                    </div>
                    <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500 shadow-sm"
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

