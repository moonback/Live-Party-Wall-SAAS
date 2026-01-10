-- ==========================================
-- MIGRATION : Ajout des tags IA aux photos
-- ==========================================
-- Ajoute une colonne tags (JSONB) pour stocker les tags suggérés par l'IA
-- Date: 2026-01-15
-- ==========================================

-- Ajouter la colonne tags si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'photos' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.photos
            ADD COLUMN tags JSONB DEFAULT NULL;
        
        -- Commentaire pour documentation
        COMMENT ON COLUMN public.photos.tags IS 'Tags suggérés par l''IA (tableau JSON de strings, ex: ["sourire", "groupe", "danse", "fête"])';
    END IF;
END $$;

-- Créer un index GIN pour les recherches sur les tags (optionnel mais recommandé)
CREATE INDEX IF NOT EXISTS idx_photos_tags_gin ON public.photos USING GIN (tags);

-- Note: Les tags sont stockés comme JSONB pour permettre des requêtes efficaces
-- Exemple de requête : SELECT * FROM photos WHERE tags @> '["danse"]'::jsonb;




