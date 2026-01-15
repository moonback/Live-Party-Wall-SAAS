import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Clock, X, Image as ImageIcon, User, CheckCircle2, Sparkles } from 'lucide-react';
import { usePhotosQuery } from '../../hooks/queries/usePhotosQuery';
import { useEvent } from '../../context/EventContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { createBattle, getActiveBattles, finishBattle, subscribeToNewBattles } from '../../services/battleService';
import { Photo, PhotoBattle } from '../../types';
import { BattleGridSkeleton } from './SkeletonLoaders';

interface BattlesTabProps {
  // Props si nécessaire
}

const AUTO_BATTLE_INTERVAL = 30; // Intervalle fixe à 30 minutes

export const BattlesTab: React.FC<BattlesTabProps> = () => {
  const { currentEvent } = useEvent();
  const { settings: config } = useSettings();
  const { addToast } = useToast();
  const { data: allPhotos = [] } = usePhotosQuery(currentEvent?.id);
  
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

  // Note: availablePhotos pourrait être utilisé pour filtrer les photos dans la sélection
  // Actuellement non utilisé mais conservé pour usage futur
  // const availablePhotos = allPhotos.filter(p => 
  //   p.id !== selectedPhoto1?.id && p.id !== selectedPhoto2?.id
  // );

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
      {/* Section Battles Automatiques */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800"
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <span className="truncate">Battles Automatiques</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Activez les battles automatiques pour créer une battle aléatoire à intervalles réguliers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-800">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${autoBattleEnabled ? 'bg-teal-500/20' : 'bg-slate-700/50'}`}>
              <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${autoBattleEnabled ? 'text-teal-400' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1">Battles Automatiques</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                {autoBattleEnabled 
                  ? `Actives - Une battle est créée toutes les ${AUTO_BATTLE_INTERVAL} minutes`
                  : 'Inactives - Les battles doivent être créées manuellement'}
              </p>
              {autoBattleEnabled && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Intervalle fixe : {AUTO_BATTLE_INTERVAL} minutes (non modifiable)</span>
                </p>
              )}
            </div>
          </div>
          <motion.button
            whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            onClick={handleToggleAutoBattles}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors min-h-[44px] flex-shrink-0 ${
              autoBattleEnabled
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30'
            }`}
          >
            {autoBattleEnabled ? 'Désactiver' : 'Activer'}
          </motion.button>
        </div>
      </motion.div>

      {/* Bouton Nouvelle Battle */}
      <AnimatePresence>
        {!showCreateBattleForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800"
          >
            <motion.button
              whileHover={!prefersReducedMotion ? { scale: 1.01 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.99 } : {}}
              onClick={() => setShowCreateBattleForm(true)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/30 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3 min-h-[44px]"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Nouvelle Battle</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Création de Battle */}
      <AnimatePresence>
        {showCreateBattleForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800"
          >
            <div className="mb-4 sm:mb-6 flex items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  </div>
                  <span className="truncate">Créer une Photo Battle</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Sélectionnez deux photos pour créer une battle. Les invités voteront pour leur photo préférée.
                </p>
              </div>
              <motion.button
                whileHover={!prefersReducedMotion ? { scale: 1.1 } : {}}
                whileTap={!prefersReducedMotion ? { scale: 0.9 } : {}}
                onClick={() => {
                  setShowCreateBattleForm(false);
                  setSelectedPhoto1(null);
                  setSelectedPhoto2(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Fermer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>

            {/* Sélection des photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Photo 1 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                Photo 1 {selectedPhoto1 && <span className="text-teal-400">✓</span>}
              </label>
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border-2 border-dashed border-slate-800 min-h-[180px] sm:min-h-[200px] flex items-center justify-center">
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
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                Photo 2 {selectedPhoto2 && <span className="text-teal-400">✓</span>}
              </label>
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border-2 border-dashed border-slate-800 min-h-[180px] sm:min-h-[200px] flex items-center justify-center">
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
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                Durée de la battle (minutes)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={battleDuration}
                  onChange={(e) => setBattleDuration(Number(e.target.value))}
                  className="w-full sm:w-32 bg-slate-800/50 border border-slate-800 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all min-h-[44px]"
                />
                <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">La battle se terminera automatiquement après {battleDuration} minutes</span>
                </div>
              </div>
            </div>

            {/* Bouton Créer */}
            <motion.button
              whileHover={!prefersReducedMotion && (!selectedPhoto1 || !selectedPhoto2 || isCreatingBattle || selectedPhoto1.id === selectedPhoto2.id) ? {} : { scale: 1.01 }}
              whileTap={!prefersReducedMotion && (!selectedPhoto1 || !selectedPhoto2 || isCreatingBattle || selectedPhoto1.id === selectedPhoto2.id) ? {} : { scale: 0.99 }}
              onClick={handleCreateBattle}
              disabled={!selectedPhoto1 || !selectedPhoto2 || isCreatingBattle || selectedPhoto1.id === selectedPhoto2.id}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isCreatingBattle ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm sm:text-base">Création en cours...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Créer la Battle</span>
                </>
              )}
            </motion.button>

            {/* Liste des photos pour sélection */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800 mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-slate-100">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">Sélectionner des photos ({allPhotos.length} disponibles)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battles Actives */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800"
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-slate-100">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />
          <span className="truncate">Battles Actives</span>
          <span className="text-indigo-400 px-2 py-0.5 bg-indigo-400/10 rounded-lg text-xs font-medium ml-2 flex-shrink-0">
            {battles.length}
          </span>
        </h3>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              <BattleGridSkeleton count={2} />
            </motion.div>
          ) : battles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              className="flex flex-col items-center py-8 sm:py-10"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              >
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 mb-2" />
              </motion.div>
              <p className="text-slate-400 text-base sm:text-lg font-medium mb-1">Aucune battle active</p>
              <p className="text-slate-500 text-xs sm:text-sm text-center px-4">Créez une battle pour lancer un duel photo !</p>
            </motion.div>
          ) : (
            <motion.div
              key="battles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
            >
              {battles.map((battle, index) => {
                const totalVotes = battle.votes1Count + battle.votes2Count;
                const photo1Percentage = totalVotes > 0 ? (battle.votes1Count / totalVotes) * 100 : 50;
                const photo2Percentage = totalVotes > 0 ? (battle.votes2Count / totalVotes) * 100 : 50;
                const timeRemaining = battle.expiresAt ? Math.max(0, battle.expiresAt - Date.now()) : null;
                const isEndingSoon = timeRemaining !== null && timeRemaining < 15000;

                return (
                  <motion.div
                    key={battle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      delay: index * 0.1,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={!prefersReducedMotion ? { y: -2, scale: 1.01 } : {}}
                    className="relative bg-slate-950/50 border border-slate-800 rounded-lg p-3 sm:p-4 hover:border-indigo-500/30 transition-colors shadow-md hover:shadow-lg"
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
                    <motion.button
                      whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                      onClick={() => handleFinishBattle(battle.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg text-[10px] transition-colors min-h-[36px]"
                    >
                      <Trophy className="w-3 h-3" />
                      <span className="hidden sm:inline">Terminer</span>
                      <span className="sm:hidden">Fin</span>
                    </motion.button>
                  </div>
                  {/* Info overlay if battle is ending soon */}
                  {isEndingSoon && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 bg-yellow-400/90 text-yellow-950 text-[9px] font-medium px-2 py-1 rounded-lg shadow flex items-center gap-1 animate-pulse"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Fin proche !</span>
                    </motion.div>
                  )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Styles pour scrollbar personnalisée */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </div>
  );
};

