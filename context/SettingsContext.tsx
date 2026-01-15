import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSettings, subscribeToSettings, updateSettings as updateSettingsService, EventSettings, defaultSettings } from '../services/settingsService';
import { logger } from '../utils/logger';
import { useEvent } from './EventContext';

interface SettingsContextType {
  settings: EventSettings;
  loading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<EventSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<EventSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentEvent } = useEvent();

  // Load settings from Supabase for the current event
  const refresh = useCallback(async () => {
    if (!currentEvent) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSettings(currentEvent.id);
      setSettings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement des paramètres');
      setError(error);
      logger.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<EventSettings>) => {
    if (!currentEvent) {
      throw new Error('Aucun événement sélectionné');
    }

    try {
      // Normaliser alert_text avant l'envoi
      const alertText = newSettings.alert_text && newSettings.alert_text.trim() ? newSettings.alert_text.trim() : null;
      const settingsToUpdate = {
        ...newSettings,
        alert_text: alertText,
        content_moderation_enabled: true
      };
      
      logger.info('Updating settings from context', { 
        component: 'SettingsContext', 
        action: 'updateSettings',
        eventId: currentEvent.id,
        alert_text: alertText,
        has_alert: !!alertText
      });
      
      const updated = await updateSettingsService(currentEvent.id, settingsToUpdate);
      if (updated) {
        // Mettre à jour immédiatement pour feedback instantané
        // La mise à jour Realtime viendra ensuite et synchronisera tous les clients
        setSettings(prev => {
          const newState = { 
            ...defaultSettings,
            ...prev, 
            ...updated, 
            alert_text: alertText,
            content_moderation_enabled: true 
          };
          logger.info('Settings updated locally', { 
            component: 'SettingsContext', 
            action: 'updateSettings', 
            alert_text: newState.alert_text,
            has_alert: !!newState.alert_text
          });
          return newState;
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour des paramètres');
      setError(error);
      logger.error('Failed to update settings', err);
      throw error;
    }
  }, [currentEvent]);

  // Initial load and subscription
  useEffect(() => {
    if (!currentEvent) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const eventId = currentEvent.id;

    // Load settings
    refresh();

    // Subscribe to settings updates for this event
    // Forcer la modération à toujours être activée lors des mises à jour
    const subscription = subscribeToSettings(eventId, (newSettings) => {
      if (!isMounted) return;
      
      // Normaliser alert_text (null si vide ou seulement espaces)
      const alertText = newSettings.alert_text && newSettings.alert_text.trim() ? newSettings.alert_text.trim() : null;
      const normalizedSettings = { 
        ...defaultSettings,
        ...newSettings, 
        alert_text: alertText,
        content_moderation_enabled: true 
      };
      
      logger.info('Settings updated in context via Realtime', { 
        component: 'SettingsContext', 
        action: 'subscribeToSettings', 
        eventId,
        alert_text: alertText,
        has_alert: !!alertText,
        timestamp: Date.now()
      });
      
      // Toujours créer une nouvelle référence pour forcer React à détecter le changement
      setSettings(() => normalizedSettings);
    });

    // Polling de secours toutes les 5 secondes si Realtime ne fonctionne pas
    // Cela garantit que les mises à jour sont détectées même sans Realtime
    const pollingInterval = setInterval(async () => {
      if (!isMounted || !currentEvent || currentEvent.id !== eventId) return;
      
      try {
        const latestSettings = await getSettings(eventId);
        if (!isMounted || currentEvent.id !== eventId) return;
        
        setSettings(prev => {
          const prevAlert = prev.alert_text && prev.alert_text.trim() ? prev.alert_text.trim() : null;
          const latestAlert = latestSettings.alert_text && latestSettings.alert_text.trim() ? latestSettings.alert_text.trim() : null;
          
          // Vérifier si alert_text a changé
          if (prevAlert !== latestAlert) {
            logger.info('Settings changed detected via polling', { 
              component: 'SettingsContext', 
              action: 'polling', 
              eventId,
              prev_alert: prevAlert,
              latest_alert: latestAlert
            });
            return { ...defaultSettings, ...latestSettings, content_moderation_enabled: true };
          }
          return prev;
        });
      } catch (error) {
        logger.error('Error polling settings', error, { component: 'SettingsContext', action: 'polling' });
      }
    }, 5000); // Poll toutes les 5 secondes

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      clearInterval(pollingInterval);
    };
  }, [currentEvent?.id, refresh]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        refresh,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

