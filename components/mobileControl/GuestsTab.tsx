import React, { useState } from 'react';
import { Users, RefreshCw, Trash2, Camera, Check, X } from 'lucide-react';
import { Guest } from '../../types';

interface GuestStats {
  photosCount: number;
  totalLikes: number;
  totalReactions: number;
}

interface GuestsTabProps {
  guests: Guest[];
  guestStats: Map<string, GuestStats>;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onDeleteGuest: (guestId: string, guestName: string) => Promise<void>;
}

const GuestsTab: React.FC<GuestsTabProps> = ({
  guests,
  guestStats,
  isLoading,
  onRefresh,
  onDeleteGuest,
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (guestId: string, guestName: string) => {
    setIsDeleting(guestId);
    try {
      await onDeleteGuest(guestId, guestName);
      setShowDeleteConfirm(null);
    } finally {
      setIsDeleting(null);
    }
  };

  const totalPhotos = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.photosCount, 0);
  const totalLikes = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.totalLikes, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
          Invités connectés
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50 touch-manipulation"
          aria-label="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-sm text-center md:hover:bg-white/15 transition-colors">
          <div className="text-2xl md:text-3xl font-bold text-white">{guests.length}</div>
          <div className="text-xs md:text-sm text-white/70 mt-1">Total</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-sm text-center md:hover:bg-white/15 transition-colors">
          <div className="text-2xl md:text-3xl font-bold text-pink-400">{totalPhotos}</div>
          <div className="text-xs md:text-sm text-white/70 mt-1">Photos</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-sm text-center md:hover:bg-white/15 transition-colors">
          <div className="text-2xl md:text-3xl font-bold text-purple-400">{totalLikes}</div>
          <div className="text-xs md:text-sm text-white/70 mt-1">Likes</div>
        </div>
      </div>

      {/* Liste des invités */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <div className="text-white/60">Chargement des invités...</div>
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-8 text-white/50 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-2">Aucun invité connecté</p>
          <p className="text-sm">Les invités apparaîtront ici lorsqu'ils créeront un profil</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {guests.map((guest) => {
            const stats = guestStats.get(guest.id) || { photosCount: 0, totalLikes: 0, totalReactions: 0 };
            const joinDate = new Date(guest.createdAt);
            
            return (
              <div
                key={guest.id}
                className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm border border-white/20 md:hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={guest.avatarUrl}
                      alt={guest.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-cyan-500/30"
                    />
                    {stats.photosCount > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-1 border-2 border-gray-900">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white truncate">{guest.name}</h3>
                        <p className="text-xs text-white/60">
                          Inscrit le {joinDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(guest.id)}
                        disabled={isDeleting === guest.id}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 transition-colors disabled:opacity-50 flex-shrink-0 touch-manipulation"
                        title="Supprimer l'invité"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-white">{stats.photosCount}</div>
                        <div className="text-[10px] text-white/60 mt-0.5">Photos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-pink-400">{stats.totalLikes}</div>
                        <div className="text-[10px] text-white/60 mt-0.5">Likes</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-purple-400">{stats.totalReactions}</div>
                        <div className="text-[10px] text-white/60 mt-0.5">Réactions</div>
                      </div>
                    </div>

                    {/* Badge actif */}
                    {stats.photosCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-cyan-400 bg-cyan-500/10 rounded-lg px-2 py-1 border border-cyan-500/20 w-fit">
                        <Check className="w-3 h-3" />
                        <span>Actif</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmation de suppression */}
                {showDeleteConfirm === guest.id && (
                  <div className="mt-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                    <div className="text-sm mb-2">Supprimer {guest.name} ?</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(guest.id, guest.name)}
                        disabled={isDeleting === guest.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-sm disabled:opacity-50 touch-manipulation"
                      >
                        <Check className="w-4 h-4" />
                        {isDeleting === guest.id ? 'Suppression...' : 'Confirmer'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-sm touch-manipulation"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
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

export default GuestsTab;

