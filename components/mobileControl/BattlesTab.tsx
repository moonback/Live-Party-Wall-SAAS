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
  onRefresh: () => Promise<void>;
  onBattleFinished: () => Promise<void>;
}

const BattlesTab: React.FC<BattlesTabProps> = ({
  photos,
  battles,
  isLoading,
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
    setIsCreating(true);
    try {
      const battle = await createRandomBattle(battleDuration);
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
    setIsCreating(true);
    try {
      const battle = await createBattle(selectedPhoto1.id, selectedPhoto2.id, battleDuration);
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
    <div className="space-y-4 md:space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Sword className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
          Battles actives
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 active:bg-pink-500/40 transition-colors text-sm touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50 touch-manipulation"
            aria-label="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <div className="text-white/60">Chargement des battles...</div>
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-8 text-white/50 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <Sword className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-2">Aucune battle active</p>
          <p className="text-sm">Créez une battle pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {battles.map((battle) => {
            const totalVotes = battle.votes1Count + battle.votes2Count;
            const photo1Percentage = totalVotes > 0 ? (battle.votes1Count / totalVotes) * 100 : 50;
            const photo2Percentage = totalVotes > 0 ? (battle.votes2Count / totalVotes) * 100 : 50;
            const timeRemaining = battle.expiresAt ? Math.max(0, battle.expiresAt - Date.now()) : 0;
            const minutesRemaining = Math.floor(timeRemaining / 60000);
            const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

            return (
              <div
                key={battle.id}
                className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm border border-white/20 md:hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">Battle #{battle.id.slice(0, 8)}</span>
                  </div>
                  {battle.expiresAt && (
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <Clock className="w-3 h-3" />
                      <span>
                        {minutesRemaining}:{String(secondsRemaining).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                      <img
                        src={battle.photo1.url}
                        alt={battle.photo1.caption}
                        className="w-full h-full object-cover"
                      />
                      {battle.winnerId === battle.photo1.id && (
                        <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-white/70 truncate">
                      {battle.photo1.author}
                    </div>
                    <div className="text-xs font-bold text-pink-400">
                      {battle.votes1Count} votes ({photo1Percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="relative">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                      <img
                        src={battle.photo2.url}
                        alt={battle.photo2.caption}
                        className="w-full h-full object-cover"
                      />
                      {battle.winnerId === battle.photo2.id && (
                        <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-white/70 truncate">
                      {battle.photo2.author}
                    </div>
                    <div className="text-xs font-bold text-cyan-400">
                      {battle.votes2Count} votes ({photo2Percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                {/* Barres de progression */}
                <div className="flex gap-1 mb-3">
                  <div
                    className="h-2 bg-pink-500 rounded-l-full transition-all"
                    style={{ width: `${photo1Percentage}%` }}
                  />
                  <div
                    className="h-2 bg-cyan-500 rounded-r-full transition-all"
                    style={{ width: `${photo2Percentage}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFinish(battle.id)}
                    disabled={isFinishing === battle.id || battle.status !== 'active'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 active:bg-orange-500/40 transition-colors disabled:opacity-50 text-sm touch-manipulation"
                  >
                    <Square className="w-4 h-4" />
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

