import React, { useState, useEffect, useRef } from 'react';
import { Zap, Trophy, Clock, X, Image as ImageIcon, User, CheckCircle2, Sparkles } from 'lucide-react';
import { usePhotos } from '../../context/PhotosContext';
import { useEvent } from '../../context/EventContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { createBattle, getActiveBattles, finishBattle, subscribeToNewBattles } from '../../services/battleService';
import { Photo, PhotoBattle } from '../../types';

interface BattlesTabProps {
  // Props si nécessaire
}

const AUTO_BATTLE_INTERVAL = 30; // Intervalle fixe à 30 minutes

export const BattlesTab: React.FC<BattlesTabProps> = () => {
  const { photos: allPhotos } = usePhotos();
  const { currentEvent } = useEvent();
  const { settings: config } = useSettings();
  const { addToast } = useToast();
  
  const [battles, setBattles] = useState<PhotoBattle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBattleForm, setShowCreateBattleForm] = useState(false);
  const [selectedPhoto1, setSelectedPhoto1] = useState<Photo | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<Photo | null>(null);
  const [battleDuration, setBattleDuration] = useState<number>(30);
  const [isCreatingBattle, setIsCreatingBattle] = useState(false);
  const [autoBattleEnabled, setAutoBattleEnabled] = useState(config.auto_battles_enabled ?? false);
  const autoBattleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les battles actives
  const loadBattles = async () => {
    if (!currentEvent) {
      setBattles([]);
      return;
    }

    setLoading(true);
    try {
      const activeBattles = await getActiveBattles(currentEvent.id);
      setBattles(activeBattles);
    } catch (error) {
      console.error('Error loading battles:', error);
      addToast('Erreur lors du chargement des battles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBattles();
  }, [currentEvent]);

  // Abonnement aux nouvelles battles en temps réel
  useEffect(() => {
    if (!currentEvent) return;

    const battlesSub = subscribeToNewBattles(currentEvent.id, (newBattle) => {
      setBattles(prev => {
        // Vérifier si la battle existe déjà
        const exists = prev.some(b => b.id === newBattle.id);
        if (exists) return prev;
        return [newBattle, ...prev];
      });
    });

    return () => {
      if (battlesSub && typeof battlesSub.unsubscribe === 'function') {
        battlesSub.unsubscribe();
      }
    };
  }, [currentEvent]);

  // Gérer les battles automatiques
  useEffect(() => {
    if (!currentEvent || !autoBattleEnabled) {
      if (autoBattleIntervalRef.current) {
        clearInterval(autoBattleIntervalRef.current);
        autoBattleIntervalRef.current = null;
      }
      return;
    }

    // Créer une battle immédiatement si activé
    const createAutoBattle = async () => {
      if (allPhotos.length < 2) return;
      
      try {
        // Sélectionner 2 photos aléatoires
        const shuffled = [...allPhotos].sort(() => Math.random() - 0.5);
        const photo1 = shuffled[0];
        const photo2 = shuffled[1];
        
        if (photo1 && photo2 && photo1.id !== photo2.id) {
          await createBattle(currentEvent.id, photo1.id, photo2.id, AUTO_BATTLE_INTERVAL);
          await loadBattles();
        }
      } catch (error) {
        console.error('Error creating auto battle:', error);
      }
    };

    createAutoBattle();

    // Créer une battle toutes les AUTO_BATTLE_INTERVAL minutes
    autoBattleIntervalRef.current = setInterval(createAutoBattle, AUTO_BATTLE_INTERVAL * 60 * 1000);

    return () => {
      if (autoBattleIntervalRef.current) {
        clearInterval(autoBattleIntervalRef.current);
        autoBattleIntervalRef.current = null;
      }
    };
  }, [currentEvent, autoBattleEnabled, allPhotos]);

  const handleToggleAutoBattles = async () => {
    const newValue = !autoBattleEnabled;
    setAutoBattleEnabled(newValue);
    
    // TODO: Sauvegarder dans les settings
    addToast(
      newValue 
        ? `Battles automatiques activées (toutes les ${AUTO_BATTLE_INTERVAL} minutes)`
        : 'Battles automatiques désactivées',
      'success'
    );
  };

  const handleCreateBattle = async () => {
    if (!selectedPhoto1 || !selectedPhoto2 || !currentEvent) return;
    if (selectedPhoto1.id === selectedPhoto2.id) {
      addToast('Les deux photos doivent être différentes', 'error');
      return;
    }

    setIsCreatingBattle(true);
    try {
      await createBattle(currentEvent.id, selectedPhoto1.id, selectedPhoto2.id, battleDuration);
      addToast('Battle créée avec succès !', 'success');
      setShowCreateBattleForm(false);
      setSelectedPhoto1(null);
      setSelectedPhoto2(null);
      await loadBattles();
    } catch (error) {
      console.error('Error creating battle:', error);
      addToast('Erreur lors de la création de la battle', 'error');
    } finally {
      setIsCreatingBattle(false);
    }
  };

  const handleFinishBattle = async (battleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette battle maintenant ?')) return;

    try {
      await finishBattle(battleId);
      addToast('Battle terminée', 'success');
      await loadBattles();
    } catch (error) {
      console.error('Error finishing battle:', error);
      addToast('Erreur lors de la fin de la battle', 'error');
    }
  };

  // Filtrer les photos disponibles (exclure celles déjà sélectionnées)
  const availablePhotos = allPhotos.filter(p => 
    p.id !== selectedPhoto1?.id && p.id !== selectedPhoto2?.id
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Section Battles Automatiques */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            Battles Automatiques
          </h2>
          <p className="text-sm text-slate-400">
            Activez les battles automatiques pour créer une battle aléatoire à intervalles réguliers.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoBattleEnabled ? 'bg-teal-500/20' : 'bg-slate-700/50'}`}>
              <Zap className={`w-5 h-5 ${autoBattleEnabled ? 'text-teal-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Battles Automatiques</h3>
              <p className="text-sm text-slate-400">
                {autoBattleEnabled 
                  ? `Actives - Une battle est créée toutes les ${AUTO_BATTLE_INTERVAL} minutes`
                  : 'Inactives - Les battles doivent être créées manuellement'}
              </p>
              {autoBattleEnabled && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Intervalle fixe : {AUTO_BATTLE_INTERVAL} minutes (non modifiable)
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleAutoBattles}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              autoBattleEnabled
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30'
            }`}
          >
            {autoBattleEnabled ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      {/* Bouton Nouvelle Battle */}
      {!showCreateBattleForm && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
          <button
            onClick={() => setShowCreateBattleForm(true)}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/30 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5" />
            <span>Nouvelle Battle</span>
          </button>
        </div>
      )}

      {/* Section Création de Battle */}
      {showCreateBattleForm && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                Créer une Photo Battle
              </h2>
              <p className="text-sm text-slate-400">
                Sélectionnez deux photos pour créer une battle. Les invités voteront pour leur photo préférée.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateBattleForm(false);
                setSelectedPhoto1(null);
                setSelectedPhoto2(null);
              }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sélection des photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Photo 1 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Photo 1 {selectedPhoto1 && <span className="text-teal-400">✓</span>}
              </label>
              <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-dashed border-slate-800 min-h-[200px] flex items-center justify-center">
                {selectedPhoto1 ? (
                  <div className="relative w-full">
                    <img
                      src={selectedPhoto1.url}
                      alt={selectedPhoto1.caption}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setSelectedPhoto1(null)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="mt-2 text-xs text-slate-400 truncate">
                      {selectedPhoto1.author} - {selectedPhoto1.caption}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Sélectionnez une photo ci-dessous</p>
                )}
              </div>
            </div>

            {/* Photo 2 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Photo 2 {selectedPhoto2 && <span className="text-teal-400">✓</span>}
              </label>
              <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-dashed border-slate-800 min-h-[200px] flex items-center justify-center">
                {selectedPhoto2 ? (
                  <div className="relative w-full">
                    <img
                      src={selectedPhoto2.url}
                      alt={selectedPhoto2.caption}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setSelectedPhoto2(null)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="mt-2 text-xs text-slate-400 truncate">
                      {selectedPhoto2.author} - {selectedPhoto2.caption}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Sélectionnez une photo ci-dessous</p>
                )}
              </div>
            </div>
          </div>

          {/* Durée de la battle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Durée de la battle (minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="5"
                max="120"
                value={battleDuration}
                onChange={(e) => setBattleDuration(Number(e.target.value))}
                className="w-32 bg-slate-800/50 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>La battle se terminera automatiquement après {battleDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Bouton Créer */}
          <button
            onClick={handleCreateBattle}
            disabled={!selectedPhoto1 || !selectedPhoto2 || isCreatingBattle || selectedPhoto1.id === selectedPhoto2.id}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isCreatingBattle ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Créer la Battle</span>
              </>
            )}
          </button>

          {/* Liste des photos pour sélection */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-100">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Sélectionner des photos ({allPhotos.length} disponibles)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
              {allPhotos.map(photo => {
                const isSelected1 = selectedPhoto1?.id === photo.id;
                const isSelected2 = selectedPhoto2?.id === photo.id;
                const isSelected = isSelected1 || isSelected2;
                
                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (!selectedPhoto1) {
                        setSelectedPhoto1(photo);
                      } else if (!selectedPhoto2 && photo.id !== selectedPhoto1.id) {
                        setSelectedPhoto2(photo);
                      } else if (isSelected1) {
                        setSelectedPhoto1(null);
                      } else if (isSelected2) {
                        setSelectedPhoto2(null);
                      }
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'ring-4 ring-indigo-400 scale-105'
                        : 'hover:ring-2 hover:ring-indigo-400/50 hover:scale-105'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-400/20 flex items-center justify-center">
                        <div className="bg-indigo-400 rounded-full p-2">
                          <CheckCircle2 className="w-6 h-6 text-indigo-900" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">{photo.author}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Battles Actives */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-100">
          <Trophy className="w-5 h-5 text-indigo-400" />
          Battles Actives 
          <span className="text-indigo-400 px-2 py-0.5 bg-indigo-400/10 rounded-lg text-xs font-medium ml-2">
            {battles.length}
          </span>
        </h3>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : battles.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Trophy className="w-10 h-10 text-slate-500 mb-2" />
            <p className="text-slate-400 text-lg font-medium">Aucune battle active</p>
            <p className="text-slate-500 text-sm mt-1">Créez une battle pour lancer un duel photo !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {battles.map(battle => {
              const totalVotes = battle.votes1Count + battle.votes2Count;
              const photo1Percentage = totalVotes > 0 ? (battle.votes1Count / totalVotes) * 100 : 50;
              const photo2Percentage = totalVotes > 0 ? (battle.votes2Count / totalVotes) * 100 : 50;
              const timeRemaining = battle.expiresAt ? Math.max(0, battle.expiresAt - Date.now()) : null;
              const isEndingSoon = timeRemaining !== null && timeRemaining < 15000;

              return (
                <div
                  key={battle.id}
                  className="relative bg-slate-950/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Photo 1 */}
                    <div className={`relative bg-slate-900/50 rounded-lg overflow-hidden ${photo1Percentage > photo2Percentage ? 'ring-2 ring-indigo-400/60' : ''}`}>
                      <div className="aspect-square flex items-center justify-center bg-slate-800/30">
                        <img
                          src={battle.photo1.url}
                          alt={battle.photo1.caption}
                          className="w-full h-full object-contain max-h-full"
                        />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-indigo-200 font-medium flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5" /> 
                        <span className="truncate max-w-[60px]">{battle.photo1.author}</span>
                      </div>
                      {/* Votes Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 pt-3 pb-1 bg-gradient-to-t from-indigo-900/40 to-transparent">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="w-full bg-indigo-400/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              style={{ width: `${photo1Percentage}%` }}
                              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-indigo-300 text-[10px] font-medium">{Math.round(photo1Percentage)}%</span>
                            <span className="text-white text-[9px]">{battle.votes1Count} vote{battle.votes1Count > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Photo 2 */}
                    <div className={`relative bg-slate-900/50 rounded-lg overflow-hidden ${photo2Percentage > photo1Percentage ? 'ring-2 ring-teal-400/60' : ''}`}>
                      <div className="aspect-square flex items-center justify-center bg-slate-800/30">
                        <img
                          src={battle.photo2.url}
                          alt={battle.photo2.caption}
                          className="w-full h-full object-contain max-h-full"
                        />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-teal-200 font-medium flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5" /> 
                        <span className="truncate max-w-[60px]">{battle.photo2.author}</span>
                      </div>
                      {/* Votes Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 pt-3 pb-1 bg-gradient-to-t from-teal-900/40 to-transparent">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="w-full bg-teal-400/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              style={{ width: `${photo2Percentage}%` }}
                              className="h-full bg-teal-400 rounded-full transition-all duration-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-teal-300 text-[10px] font-medium">{Math.round(photo2Percentage)}%</span>
                            <span className="text-white text-[9px]">{battle.votes2Count} vote{battle.votes2Count > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium text-slate-100">{totalVotes}</span>
                        <span>vote{totalVotes > 1 ? 's' : ''}</span>
                      </div>
                      {timeRemaining !== null && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isEndingSoon ? 'bg-yellow-500/30 text-yellow-300 animate-pulse' : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor(timeRemaining / 60000)}:
                            {(Math.floor((timeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleFinishBattle(battle.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg text-[10px] transition-colors"
                    >
                      <Trophy className="w-3 h-3" />
                      <span className="hidden sm:inline">Terminer</span>
                      <span className="sm:hidden">Fin</span>
                    </button>
                  </div>
                  {/* Info overlay if battle is ending soon */}
                  {isEndingSoon && (
                    <div className="absolute top-1.5 right-1.5 bg-yellow-400/90 text-yellow-950 text-[9px] font-medium px-2 py-1 rounded-lg shadow flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>Fin proche !</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

