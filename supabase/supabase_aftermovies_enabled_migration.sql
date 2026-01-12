-- ==========================================
-- Migration pour ajouter le paramètre aftermovies_enabled
-- ==========================================
-- Date: 2026-01-15
-- ==========================================

-- Ajouter la colonne 'aftermovies_enabled' avec valeur par défaut false
ALTER TABLE public.event_settings
ADD COLUMN IF NOT EXISTS aftermovies_enabled BOOLEAN NOT NULL DEFAULT false;

-- Mettre à jour les enregistrements existants pour avoir aftermovies_enabled = false
UPDATE public.event_settings
SET aftermovies_enabled = false 
WHERE aftermovies_enabled IS NULL;

-- Commentaire
COMMENT ON COLUMN public.event_settings.aftermovies_enabled IS 'Active ou désactive l''affichage des aftermovies dans la galerie';

