import React, { useState } from 'react';
import { Sword, Plus, RefreshCw, Clock, Trophy, Square } from 'lucide-react';
import { PhotoBattle, Photo } from '../../types';
import CreateBattleForm from './CreateBattleForm';
import { useToast } from '../../context/ToastContext';
import { getActiveBattles, createBattle, createRandomBattle, finishBattle } from '../../services/battleService';
import { logger } from '../../utils/logger';

interface BattlesTabProps {
  photos: Photo[];
  battles: PhotoBattle[];
  isLoading: boolean;
  eventId: string;
  onRefresh: () => Promise<void>;
  onBattleFinished: () => Promise<void>;
}

const BattlesTab: React.FC<BattlesTabProps> = ({
  photos,
  battles,
  isLoading,
  eventId,
  onRefresh,
  onBattleFinished,
}) => {
  const { addToast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPhoto1, setSelectedPhoto1] = useState<Photo | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<Photo | null>(null);
  const [battleDuration, setBattleDuration] = useState<number>(30);
  const [isCreating, setIsCreating] = useState(false);
  const [isFinishing, setIsFinishing] = useState<string | null>(null);

  const handleCreateRandom = async () => {
    if (photos.length < 2) {
      addToast('Il faut au moins 2 photos pour créer une battle', 'error');
      return;
    }
    if (!eventId) {
      addToast('Erreur : événement non trouvé', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const battle = await createRandomBattle(eventId, battleDuration);
      if (battle) {
        addToast('Battle créée avec succès !', 'success');
        setShowCreateForm(false);
        await onRefresh();
      }
    } catch (error) {
      addToast('Erreur lors de la création de la battle', 'error');
      logger.error('Error creating random battle', error, { component: 'BattlesTab', action: 'createRandomBattle' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPhoto1 || !selectedPhoto2) {
      addToast('Sélectionnez deux photos différentes', 'error');
      return;
    }
    if (selectedPhoto1.id === selectedPhoto2.id) {
      addToast('Les deux photos doivent être différentes', 'error');
      return;
    }
    if (!eventId) {
      addToast('Erreur : événement non trouvé', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const battle = await createBattle(eventId, selectedPhoto1.id, selectedPhoto2.id, battleDuration);
      if (battle) {
        addToast('Battle créée avec succès !', 'success');
        setShowCreateForm(false);
        setSelectedPhoto1(null);
        setSelectedPhoto2(null);
        await onRefresh();
      }
    } catch (error) {
      addToast('Erreur lors de la création de la battle', 'error');
      logger.error('Error creating battle', error, { component: 'BattlesTab', action: 'createBattle' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinish = async (battleId: string) => {
    setIsFinishing(battleId);
    try {
      await finishBattle(battleId);
      addToast('Battle terminée', 'success');
      await onBattleFinished();
    } catch (error) {
      addToast('Erreur lors de la fin de la battle', 'error');
      logger.error('Error finishing battle', error, { component: 'BattlesTab', action: 'finishBattle', battleId });
    } finally {
      setIsFinishing(null);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* En-tête avec actions */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Sword className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Battles actives</h2>
              <p className="text-[10px] md:text-xs text-white/50">{battles.length} battle{battles.length > 1 ? 's' : ''} active{battles.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="group relative flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 active:from-pink-500/40 active:to-purple-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm touch-manipulation border border-pink-500/30 shadow-md hover:shadow-lg"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-semibold">Créer</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="group relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all duration-300 disabled:opacity-50 touch-manipulation border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-pink-500/10"
              aria-label="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-white/70 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <CreateBattleForm
          photos={photos}
          selectedPhoto1={selectedPhoto1}
          selectedPhoto2={selectedPhoto2}
          battleDuration={battleDuration}
          isCreating={isCreating}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedPhoto1(null);
            setSelectedPhoto2(null);
          }}
          onSelectPhoto1={setSelectedPhoto1}
          onSelectPhoto2={setSelectedPhoto2}
          onClearPhoto1={() => setSelectedPhoto1(null)}
          onClearPhoto2={() => setSelectedPhoto2(null)}
          onDurationChange={setBattleDuration}
          onCreateRandom={handleCreateRandom}
          onCreate={handleCreate}
        />
      )}

      {/* Liste des battles */}
      {isLoading ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <RefreshCw className="w-10 h-10 md:w-12 md:h-12 animate-spin mx-auto mb-3 text-pink-400" />
          <div className="text-sm md:text-base text-white/60">Chargement des battles...</div>
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="p-3 rounded-full bg-pink-500/10 border border-pink-500/20 w-fit mx-auto mb-4">
            <Sword className="w-10 h-10 md:w-12 md:h-12 text-pink-400/50" />
          </div>
          <p className="text-base md:text-lg font-semibold text-white mb-2">Aucune battle active</p>
          <p className="text-xs md:text-sm text-white/50">Créez une battle pour commencer</p>
        </div>
      ) : (
        <div className="space-y-2.5 md:space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {battles.map((battle) => {
            const totalVotes = battle.votes1Count + battle.votes2Count;
            const photo1Percentage = totalVotes > 0 ? (battle.votes1Count / totalVotes) * 100 : 50;
            const photo2Percentage = totalVotes > 0 ? (battle.votes2Count / totalVotes) * 100 : 50;
            const timeRemaining = battle.expiresAt ? Math.max(0, battle.expiresAt - Date.now()) : 0;
            const minutesRemaining = Math.floor(timeRemaining / 60000);
            const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
            const isWinner1 = battle.winnerId === battle.photo1.id;
            const isWinner2 = battle.winnerId === battle.photo2.id;

            return (
              <div
                key={battle.id}
                className="group bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-pink-500/10 hover:-translate-y-0.5"
              >
                {/* En-tête de la battle */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-white">#{battle.id.slice(0, 8)}</span>
                  </div>
                  {battle.expiresAt && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <Clock className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] md:text-xs font-mono font-semibold text-orange-400">
                        {minutesRemaining}:{String(secondsRemaining).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div className="relative">
                    <div className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      isWinner1 ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/10'
                    }`}>
                      <img
                        src={battle.photo1.url}
                        alt={battle.photo1.caption || 'Photo 1'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isWinner1 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 flex items-center justify-center">
                          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-pink-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-pink-400/30">
                        {battle.votes1Count}
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="text-[10px] md:text-xs text-white/80 truncate font-medium">
                        {battle.photo1.author || 'Anonyme'}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold text-pink-400">
                        {photo1Percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      isWinner2 ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/10'
                    }`}>
                      <img
                        src={battle.photo2.url}
                        alt={battle.photo2.caption || 'Photo 2'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isWinner2 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 flex items-center justify-center">
                          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute top-1 right-1 bg-cyan-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-cyan-400/30">
                        {battle.votes2Count}
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="text-[10px] md:text-xs text-white/80 truncate font-medium">
                        {battle.photo2.author || 'Anonyme'}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold text-cyan-400">
                        {photo2Percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barres de progression */}
                <div className="flex gap-1 mb-3 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-l-full transition-all duration-500 shadow-sm"
                    style={{ width: `${photo1Percentage}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-r-full transition-all duration-500 shadow-sm"
                    style={{ width: `${photo2Percentage}%` }}
                  />
                </div>

                {/* Total votes */}
                <div className="flex items-center justify-center mb-3">
                  <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] md:text-xs text-white/60">
                      <span className="font-semibold text-white">{totalVotes}</span> vote{totalVotes > 1 ? 's' : ''} total
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFinish(battle.id)}
                    disabled={isFinishing === battle.id || battle.status !== 'active'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 active:from-orange-500/40 active:to-amber-500/40 active:scale-95 transition-all duration-300 disabled:opacity-50 text-xs md:text-sm touch-manipulation border border-orange-500/30 shadow-sm"
                  >
                    <Square className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {isFinishing === battle.id ? 'Terminaison...' : 'Terminer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BattlesTab;

