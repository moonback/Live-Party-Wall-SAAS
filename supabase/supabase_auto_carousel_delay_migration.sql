-- Migration pour ajouter la colonne auto_carousel_delay
-- Permet de configurer le délai d'inactivité avant activation du carrousel automatique (en secondes)

ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS auto_carousel_delay INTEGER NOT NULL DEFAULT 20;

-- Commentaire pour documentation
COMMENT ON COLUMN event_settings.auto_carousel_delay IS 'Délai d''inactivité en secondes avant activation du carrousel automatique (défaut: 20 secondes)';

