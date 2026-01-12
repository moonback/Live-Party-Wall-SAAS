import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Guest, Photo } from '../../types';
import { Users, X, Camera, Video, Heart } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGuests } from '../../services/guestService';
import { getPhotosByAuthor } from '../../services/photoService';
import { getUserAvatar } from '../../utils/userAvatar';
import { useEvent } from '../../context/EventContext';
import { logger } from '../../utils/logger';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestAvatars?: Map<string, string>;
}

interface ParticipantWithPhotos extends Guest {
  photos: Photo[];
  photosCount: number;
  totalLikes: number;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  guestAvatars
}) => {
  const isMobile = useIsMobile();
  const { currentEvent } = useEvent();
  const [participants, setParticipants] = useState<ParticipantWithPhotos[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les participants avec leurs photos
  useEffect(() => {
    if (!isOpen || !currentEvent?.id) {
      setParticipants([]);
      return;
    }

    const loadParticipants = async () => {
      setLoading(true);
      try {
        const allGuests = await getAllGuests(currentEvent.id);
        
        // Charger les photos pour chaque participant
        const participantsWithPhotos = await Promise.all(
          allGuests.map(async (guest) => {
            try {
              const photos = await getPhotosByAuthor(currentEvent.id, guest.name);
              const photosCount = photos.length;
              const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
              
              return {
                ...guest,
                photos,
                photosCount,
                totalLikes
              };
            } catch (error) {
              logger.error('Error loading photos for participant', error, { guestName: guest.name });
              return {
                ...guest,
                photos: [],
                photosCount: 0,
                totalLikes: 0
              };
            }
          })
        );

        // Trier par nombre de photos (décroissant)
        participantsWithPhotos.sort((a, b) => b.photosCount - a.photosCount);
        setParticipants(participantsWithPhotos);
      } catch (error) {
        logger.error('Error loading participants', error, { component: 'ParticipantsModal' });
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [isOpen, currentEvent?.id]);

  // Filtrer les participants selon la recherche
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter(p => 
      p.name.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  // Participant sélectionné avec ses photos
  const selectedParticipantData = useMemo(() => {
    if (!selectedParticipant) return null;
    return participants.find(p => p.id === selectedParticipant);
  }, [participants, selectedParticipant]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    return undefined;
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedParticipant) {
          setSelectedParticipant(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedParticipant]);

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div 
            className={`fixed inset-0 z-[101] pointer-events-none ${
              isMobile 
                ? 'flex items-end justify-center' 
                : 'flex items-center justify-center p-4 md:p-6'
            }`}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-full bg-slate-900 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                isMobile 
                  ? 'max-w-full rounded-t-3xl sm:rounded-t-[2.5rem] max-h-[90vh]' 
                  : 'max-w-4xl rounded-[2.5rem] max-h-[85vh] my-auto'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3 sm:p-4 md:p-8'} border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  {selectedParticipant && (
                    <button
                      onClick={() => setSelectedParticipant(null)}
                      className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 touch-manipulation flex items-center justify-center`}
                    >
                      <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                    </button>
                  )}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className={`${isMobile ? 'p-2.5' : 'p-2 sm:p-2.5'} rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30`}
                  >
                    <Users className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} text-indigo-400`} />
                  </motion.div>
                  <div>
                    <h2 className={`${isMobile ? 'text-xl' : 'text-lg sm:text-xl md:text-3xl'} font-black text-white`}>
                      {selectedParticipant ? selectedParticipantData?.name || 'Participant' : 'Participants'}
                    </h2>
                    <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-[10px] md:text-xs'} font-bold uppercase tracking-widest ${isMobile ? 'mt-1' : 'mt-0.5 md:mt-1'} ${isMobile ? 'block' : 'hidden md:block'}`}>
                      {selectedParticipant ? 'Photos du participant' : `${participants.length} participant${participants.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`${isMobile ? 'p-3 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-3 rounded-xl sm:rounded-2xl'} bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 touch-manipulation flex items-center justify-center`}
                >
                  <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                </button>
              </div>

              {/* Body */}
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-4 sm:p-6 md:p-8'}`}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : selectedParticipant && selectedParticipantData ? (
                  // Vue détaillée d'un participant avec ses photos
                  <div>
                    {selectedParticipantData.photos.length === 0 ? (
                      <div className="text-center py-12">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-500" />
                        <p className="text-lg font-medium text-white mb-2">Aucune photo</p>
                        <p className="text-sm text-slate-500">Ce participant n'a pas encore publié de photo</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {selectedParticipantData.photos.map((photo, index) => (
                          <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative aspect-square rounded-xl overflow-hidden bg-slate-800/50 group cursor-pointer"
                          >
                            {photo.type === 'video' ? (
                              <video
                                src={photo.url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={photo.url}
                                alt={photo.caption || ''}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-white text-xs">
                                {photo.type === 'video' && <Video className="w-3 h-3" />}
                                {photo.likes_count > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-current" />
                                    <span>{photo.likes_count}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Liste des participants
                  <>
                    {/* Barre de recherche */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher un participant..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full ${isMobile ? 'pl-10 pr-4 py-2.5 min-h-[44px] text-sm' : 'pl-10 pr-4 py-2 text-sm'} bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30`}
                        />
                        <X 
                          className={`absolute ${isMobile ? 'right-3 top-1/2 -translate-y-1/2 w-4 h-4' : 'right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5'} text-slate-400 ${searchQuery ? 'cursor-pointer hover:text-white' : 'pointer-events-none'}`}
                          onClick={() => setSearchQuery('')}
                        />
                      </div>
                    </div>

                    {filteredParticipants.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-500" />
                        <p className="text-lg font-medium text-white mb-2">
                          {searchQuery ? 'Aucun participant trouvé' : 'Aucun participant'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {searchQuery ? 'Essayez une autre recherche' : 'Les participants apparaîtront ici'}
                        </p>
                      </div>
                    ) : (
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 sm:gap-4`}>
                        {filteredParticipants.map((participant, index) => {
                          const avatar = guestAvatars?.get(participant.name) || participant.avatarUrl || getUserAvatar(participant.name);
                          const firstPhoto = participant.photos[0];
                          
                          return (
                            <motion.button
                              key={participant.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedParticipant(participant.id)}
                              className="text-left bg-slate-800/50 hover:bg-slate-800/70 border border-white/5 hover:border-indigo-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all group"
                            >
                              <div className="flex items-center gap-3 sm:gap-4">
                                {/* Avatar avec photo en arrière-plan */}
                                <div className="relative flex-shrink-0">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={participant.name}
                                      className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full object-cover border-2 border-white/10 shadow-lg`}
                                    />
                                  ) : (
                                    <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/10`}>
                                      {participant.name[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  {firstPhoto && (
                                    <div className={`absolute -bottom-1 -right-1 ${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-full overflow-hidden border-2 border-slate-900 shadow-lg`}>
                                      {firstPhoto.type === 'video' ? (
                                        <video
                                          src={firstPhoto.url}
                                          className="w-full h-full object-cover"
                                          muted
                                          playsInline
                                        />
                                      ) : (
                                        <img
                                          src={firstPhoto.url}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Infos */}
                                <div className="flex-1 min-w-0">
                                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white truncate mb-1`}>
                                    {participant.name}
                                  </h3>
                                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Camera className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                                      <span className="font-semibold">{participant.photosCount}</span>
                                    </div>
                                    {participant.totalLikes > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Heart className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-current text-red-400`} />
                                        <span className="font-semibold">{participant.totalLikes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Flèche */}
                                <div className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                                  <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

