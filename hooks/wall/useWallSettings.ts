import { useState, useEffect, useMemo } from 'react';
import { getSettings, subscribeToSettings, defaultSettings } from '../../services/settingsService';
import { AUTO_SCROLL_SPEED, KiosqueTransitionType } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

export const useWallSettings = () => {
  const { settings: globalSettings } = useSettings();
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
      const settings = await getSettings();
      updateUiConfig(settings);
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

    const subscription = subscribeToSettings((newSettings) => {
        updateUiConfig(newSettings);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    uiConfig,
    isKiosqueMode,
    settings: globalSettings
  };
};

