import React from 'react';
import { RefreshCw, Users, Camera, Heart, Trash2, CheckCircle2 } from 'lucide-react';
import { Guest } from '../../types';
import { Card, Button, Badge, SectionHeader, StatCard, LoadingSpinner } from './ui';

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
      <Card variant="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <SectionHeader
            icon={Users}
            title="Invités connectés"
            description="Gérez tous les invités qui ont créé un profil"
          />
          <Button
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            isLoading={loading}
            icon={RefreshCw}
          >
            Actualiser
          </Button>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            value={guests.length}
            label="Total invités"
            iconColor="teal"
          />
          <StatCard
            icon={Camera}
            value={totalPhotos}
            label="Photos totales"
            iconColor="indigo"
          />
          <StatCard
            icon={Heart}
            value={totalLikes}
            label="Likes total"
            iconColor="pink"
          />
        </div>
      </Card>

      {/* Liste des invités */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="md" />
        </div>
      ) : guests.length === 0 ? (
        <Card variant="default" className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Aucun invité</h3>
          <p className="text-slate-400 text-sm">Aucun invité n'a encore créé de profil.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guests.map(guest => {
            const stats = guestStats.get(guest.id) || { photosCount: 0, totalLikes: 0, totalReactions: 0 };
            const joinDate = new Date(guest.createdAt);
            
            return (
              <Card
                key={guest.id}
                variant="default"
                className="hover:border-slate-700 transition-all"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(guest)}
                    icon={Trash2}
                    className="hover:text-red-400 hover:bg-red-500/10"
                    title="Supprimer l'invité"
                  />
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
                  <Badge variant="success" className="flex items-center gap-2 w-full justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Actif sur le mur</span>
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

