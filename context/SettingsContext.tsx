import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSettings, subscribeToSettings, updateSettings as updateSettingsService, EventSettings, defaultSettings } from '../services/settingsService';
import { logger } from '../utils/logger';

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

  // Load settings from Supabase
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement des paramètres');
      setError(error);
      logger.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<EventSettings>) => {
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
        alert_text: alertText,
        has_alert: !!alertText
      });
      
      const updated = await updateSettingsService(settingsToUpdate);
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
  }, []);

  // Initial load and subscription
  useEffect(() => {
    refresh();

    // Subscribe to settings updates
    // Forcer la modération à toujours être activée lors des mises à jour
    const subscription = subscribeToSettings((newSettings) => {
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
      try {
        const latestSettings = await getSettings();
        setSettings(prev => {
          const prevAlert = prev.alert_text && prev.alert_text.trim() ? prev.alert_text.trim() : null;
          const latestAlert = latestSettings.alert_text && latestSettings.alert_text.trim() ? latestSettings.alert_text.trim() : null;
          
          // Vérifier si alert_text a changé
          if (prevAlert !== latestAlert) {
            logger.info('Settings changed detected via polling', { 
              component: 'SettingsContext', 
              action: 'polling', 
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
      subscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [refresh]);

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

