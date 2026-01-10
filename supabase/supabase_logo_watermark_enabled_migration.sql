-- ==========================================
-- MIGRATION: Ajout de logo_watermark_enabled dans event_settings
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- Ajouter la colonne logo_watermark_enabled dans event_settings
ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS logo_watermark_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN event_settings.logo_watermark_enabled IS 'Active ou désactive l''affichage du logo en filigrane sur les photos';

