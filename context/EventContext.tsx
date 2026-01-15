import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Event } from '../types';
import { getEventBySlug, getEventById, isEventOrganizer, canEditEvent } from '../services/eventService';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

interface EventContextType {
  currentEvent: Event | null;
  loading: boolean;
  error: Error | null;
  isEventOwner: boolean;
  canEdit: boolean;
  loadEventBySlug: (slug: string) => Promise<void>;
  loadEventById: (id: string) => Promise<void>;
  clearEvent: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEventOwner, setIsEventOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const { user } = useAuth();
  const loadingRef = useRef<string | null>(null); // Track which slug is currently loading
  const currentEventRef = useRef<Event | null>(null); // Track current event for stable callbacks

  // Charger un événement par slug
  const loadEventBySlug = useCallback(async (slug: string) => {
    // Éviter de recharger si l'événement est déjà chargé avec le même slug
    if (currentEventRef.current?.slug === slug && !loading) {
      return;
    }

    // Éviter de charger si on est déjà en train de charger ce slug
    if (loadingRef.current === slug) {
      return;
    }

    loadingRef.current = slug;
    setLoading(true);
    setError(null);

    try {
      const event = await getEventBySlug(slug);
      if (!event) {
        throw new Error(`Événement "${slug}" introuvable.`);
      }

      // Éviter de mettre à jour si c'est le même événement
      if (currentEventRef.current?.id === event.id) {
        loadingRef.current = null;
        setLoading(false);
        return;
      }

      setCurrentEvent(event);
      currentEventRef.current = event;
      
      // Mettre à jour l'URL sans recharger la page seulement si nécessaire
      const url = new URL(window.location.href);
      const currentSlug = url.searchParams.get('event');
      if (currentSlug !== slug) {
        url.searchParams.set('event', slug);
        window.history.pushState({}, '', url.toString());
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement de l\'événement');
      setError(error);
      logger.error('Failed to load event by slug', err);
      throw error;
    } finally {
      loadingRef.current = null;
      setLoading(false);
    }
  }, []);

  // Mettre à jour la ref quand currentEvent change
  useEffect(() => {
    currentEventRef.current = currentEvent;
  }, [currentEvent]);

  // Charger l'événement depuis l'URL au montage
  useEffect(() => {
    const loadEventFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const eventSlug = params.get('event');

      if (eventSlug) {
        // Ne charger que si l'événement actuel n'a pas le même slug
        if (currentEventRef.current?.slug !== eventSlug) {
          try {
            await loadEventBySlug(eventSlug);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur lors du chargement de l\'événement');
            setError(error);
            logger.error('Failed to load event from URL', err);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadEventFromUrl();
  }, [loadEventBySlug]);

  // Mettre à jour les permissions quand l'événement ou l'utilisateur change
  useEffect(() => {
    const updatePermissions = async () => {
      if (!currentEvent || !user) {
        setIsEventOwner(false);
        setCanEdit(false);
        return;
      }

      try {
        const isOwner = currentEvent.owner_id === user.id;
        const isOrganizer = await isEventOrganizer(currentEvent.id, user.id);
        const canEditEventValue = await canEditEvent(currentEvent.id, user.id);

        setIsEventOwner(isOwner);
        setCanEdit(canEditEventValue);
      } catch (err) {
        logger.error('Error checking event permissions', err);
        setIsEventOwner(false);
        setCanEdit(false);
      }
    };

    updatePermissions();
  }, [currentEvent, user]);

  // Charger un événement par ID
  const loadEventById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const event = await getEventById(id);
      if (!event) {
        throw new Error('Événement introuvable.');
      }

      setCurrentEvent(event);
      
      // Mettre à jour l'URL avec le slug
      const url = new URL(window.location.href);
      url.searchParams.set('event', event.slug);
      window.history.pushState({}, '', url.toString());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement de l\'événement');
      setError(error);
      logger.error('Failed to load event by id', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Effacer l'événement actuel
  const clearEvent = useCallback(() => {
    setCurrentEvent(null);
    setIsEventOwner(false);
    setCanEdit(false);
    
    // Retirer le paramètre event de l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('event');
    window.history.pushState({}, '', url.toString());
  }, []);

  return (
    <EventContext.Provider
      value={{
        currentEvent,
        loading,
        error,
        isEventOwner,
        canEdit,
        loadEventBySlug,
        loadEventById,
        clearEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within EventProvider');
  }
  return context;
};

