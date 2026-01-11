import { useMemo } from 'react';
import { defaultSettings } from '../../services/settingsService';
import { AUTO_SCROLL_SPEED, KiosqueTransitionType } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

/**
 * ⚡ OPTIMISATION : Hook simplifié qui utilise uniquement le context Settings
 * Le SettingsProvider gère déjà le chargement et la souscription Realtime
 */
export const useWallSettings = () => {
  // ⚡ OPTIMISATION : Utiliser uniquement le context, pas d'appels directs au service
  const { settings: globalSettings } = useSettings();

  const isKiosqueMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('kiosque') === 'true' || localStorage.getItem('kiosqueMode') === 'true';
  }, []);

  // ⚡ OPTIMISATION : Calculer uiConfig à partir des settings du context (mémorisé)
  const uiConfig = useMemo(() => {
    let speedValue = AUTO_SCROLL_SPEED;
    if (globalSettings.scroll_speed === 'slow') speedValue = 0.15;
    if (globalSettings.scroll_speed === 'fast') speedValue = 0.6;

    return {
      title: globalSettings.event_title || defaultSettings.event_title,
      subtitle: globalSettings.event_subtitle || defaultSettings.event_subtitle,
      scrollSpeed: speedValue,
      transition: (globalSettings.slide_transition || defaultSettings.slide_transition) as KiosqueTransitionType
    };
  }, [globalSettings.event_title, globalSettings.event_subtitle, globalSettings.scroll_speed, globalSettings.slide_transition]);

  return {
    uiConfig,
    isKiosqueMode,
    settings: globalSettings
  };
};

