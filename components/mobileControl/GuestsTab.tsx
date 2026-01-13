import React, { useState, useRef, useEffect } from 'react';
import { Users, RefreshCw, Trash2, Check, X } from 'lucide-react';
import { Guest } from '../../types';

interface GuestsTabProps {
  guests: Guest[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onDeleteGuest: (guestId: string, guestName: string) => Promise<void>;
}

interface SwipeState {
  startX: number;
  currentX: number;
  isSwiping: boolean;
}

const GuestsTab: React.FC<GuestsTabProps> = ({
  guests,
  isLoading,
  onRefresh,
  onDeleteGuest,
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [swipeStates, setSwipeStates] = useState<Map<string, SwipeState>>(new Map());
  const touchStartRef = useRef<{ guestId: string; startX: number; startY: number } | null>(null);
  const swipeElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());

  const handleDelete = async (guestId: string, guestName: string) => {
    setIsDeleting(guestId);
    try {
      await onDeleteGuest(guestId, guestName);
      setShowDeleteConfirm(null);
      // Réinitialiser le swipe
      setSwipeStates(prev => {
        const next = new Map(prev);
        next.delete(guestId);
        return next;
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Nettoyage des listeners lors du démontage
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
      swipeElementRefs.current.clear();
    };
  }, []);

  // Gestion du swipe avec listeners non-passifs
  const setupSwipeListeners = (element: HTMLDivElement | null, guestId: string) => {
    // Nettoyer les anciens listeners pour cet invité
    const existingCleanup = cleanupFunctionsRef.current.get(guestId);
    if (existingCleanup) {
      existingCleanup();
    }

    if (!element) {
      swipeElementRefs.current.delete(guestId);
      cleanupFunctionsRef.current.delete(guestId);
      return;
    }

    swipeElementRefs.current.set(guestId, element);

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        guestId,
        startX: touch.clientX,
        startY: touch.clientY,
      };
      setSwipeStates(prev => {
        const next = new Map(prev);
        next.set(guestId, { startX: touch.clientX, currentX: touch.clientX, isSwiping: false });
        return next;
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || touchStartRef.current.guestId !== guestId) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.startX;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.startY);
      
      // Détecter un swipe horizontal (deltaX > deltaY * 1.5 pour être plus strict)
      // Seulement pour les swipes vers la gauche (deltaX < 0)
      if (deltaX < -10 && Math.abs(deltaX) > deltaY * 1.5) {
        e.preventDefault(); // Empêcher le scroll pendant le swipe
        
        setSwipeStates(prev => {
          const next = new Map(prev);
          const state = next.get(guestId);
          if (state) {
            // Limiter le swipe à -200px maximum
            const limitedX = Math.max(touch.clientX, state.startX - 200);
            next.set(guestId, {
              ...state,
              currentX: limitedX,
              isSwiping: true,
            });
          }
          return next;
        });
      } else if (deltaX > 10 && Math.abs(deltaX) > deltaY * 1.5) {
        // Swipe vers la droite : réinitialiser
        setSwipeStates(prev => {
          const next = new Map(prev);
          next.delete(guestId);
          return next;
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || touchStartRef.current.guestId !== guestId) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.startX;
      
      // Utiliser une fonction de callback pour accéder à l'état actuel
      setSwipeStates(prev => {
        const swipeState = prev.get(guestId);
        
        // Si swipe gauche suffisant (> 80px), afficher la confirmation
        if (swipeState && deltaX < -80) {
          setShowDeleteConfirm(guestId);
        }
        
        // Réinitialiser le swipe
        const next = new Map(prev);
        next.delete(guestId);
        return next;
      });
      
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Stocker la fonction de nettoyage
    const cleanup = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      swipeElementRefs.current.delete(guestId);
      cleanupFunctionsRef.current.delete(guestId);
    };
    
    cleanupFunctionsRef.current.set(guestId, cleanup);
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* En-tête avec actions */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full" />
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Invités connectés</h2>
              <p className="text-[10px] md:text-xs text-white/50">{guests.length} invité{guests.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="group relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all duration-300 disabled:opacity-50 touch-manipulation border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-cyan-500/10"
            aria-label="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-white/70 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/* Liste des invités */}
      {isLoading ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <RefreshCw className="w-10 h-10 md:w-12 md:h-12 animate-spin mx-auto mb-3 text-cyan-400" />
          <div className="text-sm md:text-base text-white/60">Chargement des invités...</div>
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit mx-auto mb-4">
            <Users className="w-10 h-10 md:w-12 md:h-12 text-cyan-400/50" />
          </div>
          <p className="text-base md:text-lg font-semibold text-white mb-2">Aucun invité connecté</p>
          <p className="text-xs md:text-sm text-white/50">Les invités apparaîtront ici lorsqu'ils créeront un profil</p>
        </div>
      ) : (
        <div className="space-y-2.5 md:space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
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
            
            const swipeState = swipeStates.get(guest.id);
            const swipeOffset = swipeState ? swipeState.currentX - swipeState.startX : 0;
            const isSwipingLeft = swipeOffset < 0;
            const swipeDistance = Math.abs(swipeOffset);
            const swipePercentage = Math.min(swipeDistance / 150, 1);
            const isDeleteThreshold = swipeDistance >= 80;
            
            return (
              <div
                key={guest.id}
                ref={(el) => setupSwipeListeners(el, guest.id)}
                className="relative overflow-hidden rounded-xl touch-none md:touch-auto"
              >
                {/* Zone de suppression (visible lors du swipe) */}
                <div 
                  className={`absolute inset-y-0 right-0 flex items-center justify-end pr-3 md:pr-4 transition-all duration-200 ${
                    isDeleteThreshold 
                      ? 'bg-red-500/50' 
                      : 'bg-red-500/30'
                  }`}
                  style={{
                    width: `${swipeDistance}px`,
                    opacity: isSwipingLeft ? Math.max(swipePercentage, 0.3) : 0,
                  }}
                >
                  <Trash2 className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 ${
                    isDeleteThreshold 
                      ? 'text-red-200 scale-110' 
                      : 'text-red-300'
                  }`} />
                </div>
                
                {/* Carte de l'invité */}
                <div
                  className="group bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-0.5 relative"
                  style={{
                    transform: isSwipingLeft ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                    transition: swipeState?.isSwiping ? 'none' : 'transform 0.3s ease-out',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/20 shadow-sm animate-pulse" />
                      <img
                        src={guest.avatarUrl}
                        alt={guest.name}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-cyan-500/30 shadow-md transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-semibold text-white truncate mb-0.5">{guest.name}</h3>
                          <p className="text-[10px] md:text-xs text-white/50 flex items-center gap-1">
                            <span>Inscrit le {formattedDate}</span>
                            <span className="text-white/30">•</span>
                            <span>{formattedTime}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(guest.id)}
                          disabled={isDeleting === guest.id}
                          className="p-1.5 md:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 active:scale-95 transition-all duration-300 disabled:opacity-50 flex-shrink-0 touch-manipulation border border-red-500/20 hover:border-red-500/40 shadow-sm"
                          title="Supprimer l'invité"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation de suppression */}
                  {showDeleteConfirm === guest.id && (
                    <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm">
                      <div className="text-xs md:text-sm font-medium text-white mb-2.5">Supprimer {guest.name} ?</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(guest.id, guest.name)}
                          disabled={isDeleting === guest.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 active:from-red-500/50 active:to-red-600/50 active:scale-95 transition-all duration-300 text-xs md:text-sm disabled:opacity-50 touch-manipulation border border-red-500/30 shadow-md"
                        >
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {isDeleting === guest.id ? 'Suppression...' : 'Confirmer'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all duration-300 text-xs md:text-sm touch-manipulation border border-white/10 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuestsTab;

