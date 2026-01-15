-- Rollback : Suppression des colonnes pour les filtres artistiques générés par IA
-- Date : 2026-01-15
-- Description : Supprime les colonnes et index ajoutés par supabase_photos_ai_filters.sql

-- Supprimer les index d'abord (nécessaire avant de supprimer les colonnes)
DROP INDEX IF EXISTS idx_photos_suggested_artistic_style;
DROP INDEX IF EXISTS idx_photos_ai_filter_params;
DROP INDEX IF EXISTS idx_photos_applied_filter;

-- Supprimer les colonnes de la table photos
ALTER TABLE photos
DROP COLUMN IF EXISTS suggested_artistic_style,
DROP COLUMN IF EXISTS ai_filter_params,
DROP COLUMN IF EXISTS applied_filter;

-- Vérifier que les colonnes ont été supprimées
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'applied_filter'
  ) THEN
    RAISE EXCEPTION 'La colonne applied_filter n''a pas été supprimée';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'ai_filter_params'
  ) THEN
    RAISE EXCEPTION 'La colonne ai_filter_params n''a pas été supprimée';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'suggested_artistic_style'
  ) THEN
    RAISE EXCEPTION 'La colonne suggested_artistic_style n''a pas été supprimée';
  END IF;
  
  RAISE NOTICE 'Rollback réussi : colonnes de filtres IA supprimées de la table photos';
END $$;

