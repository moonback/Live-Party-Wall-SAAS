import React, { useState } from 'react';
import { Users, RefreshCw, Trash2, Check, X } from 'lucide-react';
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-white">
          <div className="p-1.5 rounded-lg bg-white/10">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
          </div>
          Invités connectés
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all disabled:opacity-50 touch-manipulation border border-white/20 shadow-sm"
          aria-label="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
            const joinDate = new Date(guest.createdAt);
            const formattedDate = joinDate.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            });
            const formattedTime = joinDate.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return (
              <div
                key={guest.id}
                className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm border border-white/20 md:hover:bg-white/15 md:hover:border-white/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={guest.avatarUrl}
                      alt={guest.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-cyan-500/30"
                    />
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white truncate mb-1">{guest.name}</h3>
                        <p className="text-xs text-white/60">
                          Inscrit le {formattedDate} à {formattedTime}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(guest.id)}
                        disabled={isDeleting === guest.id}
                        className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0 touch-manipulation border border-red-500/30 shadow-sm ml-2"
                        title="Supprimer l'invité"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
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
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-95 transition-all text-sm disabled:opacity-50 touch-manipulation shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        {isDeleting === guest.id ? 'Suppression...' : 'Confirmer'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm touch-manipulation border border-white/20 shadow-sm"
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

