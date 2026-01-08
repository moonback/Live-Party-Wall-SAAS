import React from 'react';
import { RefreshCw, Users, Camera, Heart, Trash2, CheckCircle2 } from 'lucide-react';
import { Guest } from '../../types';

interface GuestStats {
  photosCount: number;
  totalLikes: number;
  totalReactions: number;
}

interface GuestsTabProps {
  guests: Guest[];
  loading: boolean;
  guestStats: Map<string, GuestStats>;
  onRefresh: () => void;
  onDelete: (guest: Guest) => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({
  guests,
  loading,
  guestStats,
  onRefresh,
  onDelete
}) => {
  const totalPhotos = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.photosCount, 0);
  const totalLikes = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.totalLikes, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              Invités connectés
            </h2>
            <p className="text-sm text-slate-400">
              Gérez tous les invités qui ont créé un profil
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors text-sm text-slate-300 border border-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-100">{guests.length}</p>
                <p className="text-xs text-slate-400">Total invités</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Camera className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-100">{totalPhotos}</p>
                <p className="text-xs text-slate-400">Photos totales</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-100">{totalLikes}</p>
                <p className="text-xs text-slate-400">Likes total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des invités */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent"></div>
        </div>
      ) : guests.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-12 border border-slate-800 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Aucun invité</h3>
          <p className="text-slate-400 text-sm">Aucun invité n'a encore créé de profil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guests.map(guest => {
            const stats = guestStats.get(guest.id) || { photosCount: 0, totalLikes: 0, totalReactions: 0 };
            const joinDate = new Date(guest.createdAt);
            
            return (
              <div
                key={guest.id}
                className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {/* Header avec avatar et nom */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={guest.avatarUrl}
                      alt={guest.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/30"
                    />
                    {stats.photosCount > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-slate-900">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-100 truncate mb-1">
                      {guest.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Inscrit le {joinDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(guest)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400 flex-shrink-0"
                    title="Supprimer l'invité"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                    <p className="text-lg font-semibold text-slate-100">{stats.photosCount}</p>
                    <p className="text-xs text-slate-400 mt-1">Photos</p>
                  </div>
                  <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                    <p className="text-lg font-semibold text-pink-400">{stats.totalLikes}</p>
                    <p className="text-xs text-slate-400 mt-1">Likes</p>
                  </div>
                  <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                    <p className="text-lg font-semibold text-purple-400">{stats.totalReactions}</p>
                    <p className="text-xs text-slate-400 mt-1">Réactions</p>
                  </div>
                </div>

                {/* Badge si actif */}
                {stats.photosCount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 rounded-lg px-3 py-2 border border-teal-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Actif sur le mur</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

