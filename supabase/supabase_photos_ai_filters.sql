-- Migration : Ajout des colonnes pour les filtres artistiques générés par IA
-- Date : 2026-01-15
-- Description : Ajoute les colonnes pour stocker les filtres appliqués et les paramètres générés par IA

-- Ajouter les colonnes à la table photos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS applied_filter TEXT,
ADD COLUMN IF NOT EXISTS ai_filter_params JSONB,
ADD COLUMN IF NOT EXISTS suggested_artistic_style TEXT;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN photos.applied_filter IS 'Filtre appliqué à la photo (FilterType ou "ai-custom")';
COMMENT ON COLUMN photos.ai_filter_params IS 'Paramètres de filtre générés par IA (JSONB avec brightness, contrast, saturation, hue, vignette, grain, blur, colorMatrix)';
COMMENT ON COLUMN photos.suggested_artistic_style IS 'Style artistique suggéré par l''IA (impressionist, popart, cinematic, vibrant, dreamy, dramatic, retro, neon)';

-- Créer un index sur applied_filter pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_photos_applied_filter ON photos(applied_filter);

-- Créer un index GIN sur ai_filter_params pour les requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_photos_ai_filter_params ON photos USING GIN (ai_filter_params);

-- Créer un index sur suggested_artistic_style pour les requêtes de suggestion
CREATE INDEX IF NOT EXISTS idx_photos_suggested_artistic_style ON photos(suggested_artistic_style);

-- Mettre à jour les politiques RLS si nécessaire (les colonnes héritent des politiques existantes)
-- Les politiques RLS existantes sur photos s'appliquent automatiquement aux nouvelles colonnes

-- Vérifier que les colonnes ont été créées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'applied_filter'
  ) THEN
    RAISE EXCEPTION 'La colonne applied_filter n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'ai_filter_params'
  ) THEN
    RAISE EXCEPTION 'La colonne ai_filter_params n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'suggested_artistic_style'
  ) THEN
    RAISE EXCEPTION 'La colonne suggested_artistic_style n''a pas été créée';
  END IF;
  
  RAISE NOTICE 'Migration réussie : colonnes de filtres IA ajoutées à la table photos';
END $$;

