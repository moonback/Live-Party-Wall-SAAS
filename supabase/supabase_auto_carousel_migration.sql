-- Migration pour ajouter la colonne auto_carousel_enabled
-- Permet d'activer/désactiver le carrousel automatique après inactivité

ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS auto_carousel_enabled BOOLEAN NOT NULL DEFAULT true;

-- Commentaire pour documentation
COMMENT ON COLUMN event_settings.auto_carousel_enabled IS 'Active ou désactive le carrousel automatique des photos après 1 minute d''inactivité';

