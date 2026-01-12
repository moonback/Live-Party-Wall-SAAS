import { useState, useEffect, useMemo } from 'react';
import { getSettings, subscribeToSettings, defaultSettings } from '../../services/settingsService';
import { AUTO_SCROLL_SPEED, KiosqueTransitionType } from '../../constants';
import { useSettings } from '../../context/SettingsContext';
import { useEvent } from '../../context/EventContext';

export const useWallSettings = () => {
  const { settings: globalSettings } = useSettings();
  const { currentEvent } = useEvent();
  const [uiConfig, setUiConfig] = useState({
    title: defaultSettings.event_title,
    subtitle: defaultSettings.event_subtitle,
    scrollSpeed: AUTO_SCROLL_SPEED,
    transition: defaultSettings.slide_transition as KiosqueTransitionType
  });

  const isKiosqueMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('kiosque') === 'true' || localStorage.getItem('kiosqueMode') === 'true';
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      // Si pas d'événement, utiliser les valeurs par défaut
      if (!currentEvent?.id) {
        updateUiConfig(defaultSettings);
        return;
      }

      try {
        const settings = await getSettings(currentEvent.id);
        updateUiConfig(settings);
      } catch (error) {
        // En cas d'erreur, utiliser les valeurs par défaut
        updateUiConfig(defaultSettings);
      }
    };

    const updateUiConfig = (settings: any) => {
       let speedValue = AUTO_SCROLL_SPEED;
       if (settings.scroll_speed === 'slow') speedValue = 0.15;
       if (settings.scroll_speed === 'fast') speedValue = 0.6;

       setUiConfig(prev => ({
         ...prev,
         title: settings.event_title,
         subtitle: settings.event_subtitle,
         scrollSpeed: speedValue,
         transition: settings.slide_transition
       }));
    };

    loadConfig();

    // S'abonner aux changements de settings seulement si un événement est chargé
    if (currentEvent?.id) {
      const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
        updateUiConfig(newSettings);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentEvent?.id]);

  return {
    uiConfig,
    isKiosqueMode,
    settings: globalSettings
  };
};

