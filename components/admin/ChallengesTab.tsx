import React, { useState, useEffect } from 'react';
import { Trophy, Clock, X, Sparkles, Award, Plus, CheckCircle2, Users } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { 
  createChallenge, 
  getActiveChallenges, 
  getFinishedChallenges,
  finishChallenge,
  cancelChallenge,
  Challenge,
  ChallengeType
} from '../../services/challengeService';
import { ChallengeView } from '../challenges/ChallengeView';
import { Photo } from '../../types';
import { usePhotos } from '../../context/PhotosContext';

interface ChallengesTabProps {
  photos?: Photo[];
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({ photos: propPhotos }) => {
  const { currentEvent } = useEvent();
  const { photos: contextPhotos } = usePhotos();
  const { addToast } = useToast();
  
  const photos = propPhotos || contextPhotos;
  
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [finishedChallenges, setFinishedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  
  // Formulaire de création
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('theme');
  const [theme, setTheme] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  // Charger les challenges
  const loadChallenges = async () => {
    if (!currentEvent) {
      setActiveChallenges([]);
      setFinishedChallenges([]);
      return;
    }

    setLoading(true);
    try {
      const [active, finished] = await Promise.all([
        getActiveChallenges(currentEvent.id),
        getFinishedChallenges(currentEvent.id, 10)
      ]);
      setActiveChallenges(active);
      setFinishedChallenges(finished);
    } catch (error) {
      console.error('Error loading challenges:', error);
      addToast('Erreur lors du chargement des challenges', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
    
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadChallenges, 10000);
    return () => clearInterval(interval);
  }, [currentEvent]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    if (!title.trim()) {
      addToast('Le titre est requis', 'error');
      return;
    }

    if (type === 'theme' && !theme.trim()) {
      addToast('Le thème est requis pour un défi thématique', 'error');
      return;
    }

    setIsCreating(true);

    try {
      await createChallenge(
        currentEvent.id,
        title.trim(),
        description.trim(),
        type,
        type === 'theme' ? theme.trim() : null,
        durationMinutes
      );
      
      addToast('Challenge créé avec succès ! 🎉', 'success');
      setShowCreateForm(false);
      setTitle('');
      setDescription('');
      setTheme('');
      setType('theme');
      setDurationMinutes(30);
      await loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du challenge';
      addToast(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinishChallenge = async (challengeId: string) => {
    try {
      await finishChallenge(challengeId);
      addToast('Challenge terminé', 'success');
      await loadChallenges();
    } catch (error) {
      console.error('Error finishing challenge:', error);
      addToast('Erreur lors de la finalisation du challenge', 'error');
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce challenge ?')) {
      return;
    }

    try {
      await cancelChallenge(challengeId);
      addToast('Challenge annulé', 'success');
      await loadChallenges();
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      addToast('Erreur lors de l\'annulation du challenge', 'error');
    }
  };

  const getUserIdentifier = (): string => {
    let storedId = localStorage.getItem('party_user_id');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('party_user_id', storedId);
    }
    return storedId;
  };

  const getUserName = (): string => {
    return localStorage.getItem('party_user_name') || 'Admin';
  };

  if (!currentEvent) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Sélectionnez un événement pour gérer les challenges</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton de création */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Challenges Photo
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Créez des défis pour encourager les invités à partager leurs meilleures photos
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Créer un challenge</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Nouveau Challenge</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Titre du challenge *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Meilleure photo de groupe"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le challenge..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de challenge *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="theme"
                    checked={type === 'theme'}
                    onChange={(e) => setType(e.target.value as ChallengeType)}
                    className="w-4 h-4 text-yellow-500"
                  />
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Thème imposé</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="time_based"
                    checked={type === 'time_based'}
                    onChange={(e) => setType(e.target.value as ChallengeType)}
                    className="w-4 h-4 text-yellow-500"
                  />
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Défi horaire</span>
                </label>
              </div>
            </div>

            {type === 'theme' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Thème *
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Anniversaire, Groupe, Danse..."
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required={type === 'theme'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Durée (en minutes) *
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                min={5}
                max={1440}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Durée recommandée : 30-60 minutes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Création...' : 'Créer le challenge'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle pour afficher les challenges terminés */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFinished(!showFinished)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {showFinished ? 'Masquer' : 'Afficher'} les challenges terminés
          </button>
        </div>
      </div>

      {/* Challenges actifs */}
      {loading && activeChallenges.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Chargement des challenges...</p>
        </div>
      ) : activeChallenges.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Challenges Actifs ({activeChallenges.length})
          </h3>
          {activeChallenges.map((challenge) => (
            <div key={challenge.id} className="relative">
              <ChallengeView
                challenge={challenge}
                userIdentifier={getUserIdentifier()}
                userName={getUserName()}
                photos={photos}
                onChallengeFinished={() => loadChallenges()}
              />
              {/* Actions admin */}
              <div className="absolute top-4 right-4 flex gap-2">
                {challenge.status === 'voting' && (
                  <button
                    onClick={() => handleFinishChallenge(challenge.id)}
                    className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Terminer le challenge maintenant"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Terminer
                  </button>
                )}
                {(challenge.status === 'active' || challenge.status === 'voting') && (
                  <button
                    onClick={() => handleCancelChallenge(challenge.id)}
                    className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Annuler le challenge"
                  >
                    <X className="w-3 h-3" />
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Aucun challenge actif</p>
          <p className="text-slate-500 text-sm mt-2">
            Créez votre premier challenge pour encourager les invités !
          </p>
        </div>
      )}

      {/* Challenges terminés */}
      {showFinished && finishedChallenges.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Challenges Terminés ({finishedChallenges.length})
          </h3>
          {finishedChallenges.map((challenge) => (
            <div key={challenge.id} className="opacity-75">
              <ChallengeView
                challenge={challenge}
                userIdentifier={getUserIdentifier()}
                userName={getUserName()}
                photos={photos}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

