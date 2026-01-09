import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, ChallengeSubmission, Photo } from '../../types';
import { 
  voteForSubmission, 
  submitPhotoToChallenge,
  getChallengeById 
} from '../../services/challengeService';
import { useToast } from '../../context/ToastContext';
import { Trophy, Clock, Users, Award, Upload, CheckCircle2, XCircle, Sparkles, ChevronRight, Timer } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface ChallengeViewProps {
  challenge: Challenge;
  userIdentifier: string;
  userName: string;
  photos?: Photo[]; // Photos disponibles pour soumission
  onChallengeFinished?: (challengeId: string, winnerPhotoId: string | null) => void;
  onPhotoClick?: (photo: Photo) => void;
  onPhotoSubmit?: (photoId: string) => void; // Callback après soumission d'une photo
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  challenge,
  userIdentifier,
  userName,
  photos = [],
  onChallengeFinished,
  onPhotoClick,
  onPhotoSubmit,
}) => {
  const { addToast } = useToast();
  const isMobile = useIsMobile();
  const [localChallenge, setLocalChallenge] = useState<Challenge>(challenge);
  const [isVoting, setIsVoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // Calculer le temps restant
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, localChallenge.endAt - now);
      setTimeRemaining(remaining);

      // Si le challenge est expiré et toujours actif, le terminer
      if (remaining === 0 && (localChallenge.status === 'active' || localChallenge.status === 'voting')) {
        // La mise à jour sera gérée par le service
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [localChallenge.endAt, localChallenge.status]);

  // Rafraîchir le challenge périodiquement
  useEffect(() => {
    const refreshChallenge = async () => {
      try {
        const updated = await getChallengeById(localChallenge.id, userIdentifier);
        if (updated) {
          setLocalChallenge(updated);
          
          // Si le challenge vient de se terminer
          if (
            updated.status === 'finished' &&
            (localChallenge.status === 'active' || localChallenge.status === 'voting') &&
            onChallengeFinished
          ) {
            onChallengeFinished(updated.id, updated.winnerPhotoId);
          }
        }
      } catch (error) {
        console.error('Error refreshing challenge:', error);
      }
    };

    const interval = setInterval(refreshChallenge, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [localChallenge.id, localChallenge.status, userIdentifier, onChallengeFinished]);

  const handleVote = useCallback(
    async (submissionId: string) => {
      if (isVoting || localChallenge.status !== 'voting') return;

      if (localChallenge.userVote === submissionId) {
        addToast('Vous avez déjà voté pour cette photo !', 'info');
        return;
      }

      setIsVoting(true);

      try {
        await voteForSubmission(localChallenge.id, submissionId, userIdentifier);
        
        // Rafraîchir le challenge
        const updated = await getChallengeById(localChallenge.id, userIdentifier);
        if (updated) {
          setLocalChallenge(updated);
        }

        addToast('Vote enregistré ! 🎉', 'success');
      } catch (error) {
        console.error('Error voting:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du vote';
        addToast(errorMessage, 'error');
      } finally {
        setIsVoting(false);
      }
    },
    [localChallenge, userIdentifier, isVoting, addToast]
  );

  const handleSubmitPhoto = useCallback(
    async (photoId: string) => {
      if (isSubmitting || localChallenge.status !== 'active') return;

      setIsSubmitting(true);

      try {
        await submitPhotoToChallenge(localChallenge.id, photoId, userName);
        
        // Rafraîchir le challenge
        const updated = await getChallengeById(localChallenge.id, userIdentifier);
        if (updated) {
          setLocalChallenge(updated);
        }

        addToast('Photo soumise au challenge ! 📸', 'success');
        
        if (onPhotoSubmit) {
          onPhotoSubmit(photoId);
        }
      } catch (error) {
        console.error('Error submitting photo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la soumission';
        addToast(errorMessage, 'error');
      } finally {
        setIsSubmitting(false);
        setSelectedPhotoId(null);
      }
    },
    [localChallenge, userName, userIdentifier, isSubmitting, addToast, onPhotoSubmit]
  );

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  const submissions = localChallenge.submissions || [];
  const totalVotes = submissions.reduce((sum, s) => sum + s.votesCount, 0);
  const hasUserVoted = !!localChallenge.userVote;
  const userHasSubmitted = submissions.some(s => s.submittedBy === userName);
  const availablePhotos = photos.filter(p => 
    !submissions.some(s => s.photo.id === p.id)
  );

  const isActive = localChallenge.status === 'active';
  const isVotingPhase = localChallenge.status === 'voting';
  const isFinished = localChallenge.status === 'finished';

  // Trouver la soumission gagnante
  const winnerSubmission = isFinished && submissions.length > 0
    ? submissions.reduce((prev, current) => 
        current.votesCount > prev.votesCount ? current : prev
      )
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-1 ${isMobile ? 'w-full' : 'max-w-4xl mx-auto'}`}
    >
      {/* Glow Effect Background */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 ${
        isActive 
          ? 'from-purple-600/40 via-blue-600/40 to-indigo-600/40' 
          : isVotingPhase 
            ? 'from-blue-600/40 via-cyan-600/40 to-indigo-600/40'
            : 'from-gray-800/60 via-gray-900/60 to-slate-900/60'
      } blur-xl`} />

      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[22px] p-5 md:p-8 border border-white/10 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full -ml-16 -mb-16 blur-2xl" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${
                isActive ? 'bg-purple-500/20 text-purple-400' : 
                isVotingPhase ? 'bg-blue-500/20 text-blue-400' : 
                'bg-gray-500/20 text-gray-400'
              }`}>
                {localChallenge.type === 'time_based' ? <Clock className="w-6 h-6" /> : <Award className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight">
                  {localChallenge.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-green-500/20 text-green-400' : 
                    isVotingPhase ? 'bg-blue-500/20 text-blue-400' : 
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isActive ? 'Phase Active' : isVotingPhase ? 'Votes en cours' : 'Challenge Terminé'}
                  </span>
                  {localChallenge.theme && (
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                      Thème: {localChallenge.theme}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {localChallenge.description && (
              <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                {localChallenge.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {timeRemaining !== null && !isFinished && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
                timeRemaining < 60000 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' 
                  : 'bg-white/5 border-white/10 text-white'
              }`}>
                <Timer className="w-5 h-5" />
                <span className="font-mono text-xl font-bold tabular-nums">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{submissions.length} participants</span>
              </div>
              {totalVotes > 0 && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{totalVotes} votes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {/* Phase Active - Soumission */}
          {isActive && (
            <motion.div
              key="active-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!userHasSubmitted ? (
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-slate-900/50 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-purple-400" />
                        Choisissez votre meilleure photo
                      </h4>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
                        {availablePhotos.length} photos dispos
                      </span>
                    </div>

                    {availablePhotos.length > 0 ? (
                      <div className="flex overflow-x-auto pb-4 gap-4 snap-x scrollbar-hide">
                        {availablePhotos.map((photo) => (
                          <motion.button
                            key={photo.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPhotoId(photo.id)}
                            className={`relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden snap-start border-2 transition-all duration-300 ${
                              selectedPhotoId === photo.id
                                ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt="Vôtre photo"
                              className="w-full h-full object-cover"
                            />
                            {selectedPhotoId === photo.id && (
                              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="bg-purple-500 text-white rounded-full p-1.5">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-slate-500 text-sm">
                          Aucune photo n'est prête pour ce défi.<br/>
                          <span className="text-purple-400 font-semibold mt-2 inline-block">Prenez une photo maintenant !</span>
                        </p>
                      </div>
                    )}

                    {selectedPhotoId && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSubmitPhoto(selectedPhotoId)}
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Envoyer au Challenge</span>
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold text-lg">Photo enregistrée !</h4>
                    <p className="text-green-500/60 text-sm">Attendons maintenant la phase de vote...</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase Voting / Finished */}
          {(isVotingPhase || isFinished) && (
            <motion.div
              key="voting-phase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {submissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submissions.map((submission, idx) => {
                    const votePercentage = totalVotes > 0 
                      ? (submission.votesCount / totalVotes) * 100 
                      : 0;
                    const isWinner = isFinished && winnerSubmission?.id === submission.id;
                    const userVotedForThis = localChallenge.userVote === submission.id;

                    return (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`group relative flex flex-col bg-slate-800/40 rounded-2xl border transition-all duration-500 ${
                          isWinner 
                            ? 'border-yellow-500/50 ring-1 ring-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]' 
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        {/* Photo Container */}
                        <div className="relative aspect-[4/3] rounded-t-2xl overflow-hidden">
                          <img
                            src={submission.photo.url}
                            alt={`Photo de ${submission.submittedBy}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                          
                          {/* Badges on image */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {userVotedForThis && (
                              <div className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Mon Vote
                              </div>
                            )}
                            {isWinner && (
                              <div className="bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> Gagnant
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => onPhotoClick && onPhotoClick(submission.photo)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]"
                          >
                            <div className="bg-white/10 border border-white/20 p-3 rounded-full text-white">
                              <Sparkles className="w-6 h-6" />
                            </div>
                          </button>
                        </div>

                        {/* Info & Action */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-slate-200">
                              {submission.submittedBy}
                            </span>
                            {isVotingPhase && !hasUserVoted && (
                              <button
                                onClick={() => handleVote(submission.id)}
                                disabled={isVoting}
                                className="px-4 py-2 bg-white text-slate-950 text-xs font-black uppercase tracking-tighter rounded-xl hover:bg-blue-400 hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
                              >
                                Voter
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                              <span className="text-slate-400">
                                {submission.votesCount} {submission.votesCount <= 1 ? 'vote' : 'votes'}
                              </span>
                              <span className={isWinner ? 'text-yellow-400' : 'text-blue-400'}>
                                {votePercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${votePercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  isWinner 
                                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
                  <XCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg">Aucune participation...</p>
                </div>
              )}

              {/* Status messages */}
              {isVotingPhase && hasUserVoted && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <p className="text-blue-400 font-medium">Votre vote a bien été pris en compte !</p>
                </motion.div>
              )}

              {isFinished && winnerSubmission && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative p-0.5 rounded-3xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 animate-gradient" />
                  <div className="relative bg-slate-900 rounded-[22px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-10 h-10 text-yellow-500" />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">Félicitations {winnerSubmission.submittedBy} !</h4>
                      <p className="text-slate-400 text-lg">
                        Grand vainqueur avec <span className="text-yellow-500 font-bold">{winnerSubmission.votesCount} votes</span>.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

