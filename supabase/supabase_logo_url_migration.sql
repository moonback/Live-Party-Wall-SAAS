-- ==========================================
-- MIGRATION: Ajout de logo_url dans event_settings
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- Ajouter la colonne logo_url dans event_settings
ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN event_settings.logo_url IS 'URL du logo de l''événement (stocké dans party-backgrounds bucket)';

