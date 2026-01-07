import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  // Charger l'événement depuis l'URL au montage
  useEffect(() => {
    const loadEventFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const eventSlug = params.get('event');

      if (eventSlug) {
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
    };

    loadEventFromUrl();
  }, []);

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

  // Charger un événement par slug
  const loadEventBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const event = await getEventBySlug(slug);
      if (!event) {
        throw new Error(`Événement "${slug}" introuvable.`);
      }

      setCurrentEvent(event);
      
      // Mettre à jour l'URL sans recharger la page
      const url = new URL(window.location.href);
      url.searchParams.set('event', slug);
      window.history.pushState({}, '', url.toString());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement de l\'événement');
      setError(error);
      logger.error('Failed to load event by slug', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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

