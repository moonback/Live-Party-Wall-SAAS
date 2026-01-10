-- ==========================================
-- MIGRATION : Ajout du setting tags_generation_enabled
-- ==========================================
-- Ajoute une colonne pour activer/désactiver la génération de tags par l'IA
-- Date: 2026-01-15
-- ==========================================

-- Ajouter la colonne tags_generation_enabled si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_settings' 
        AND column_name = 'tags_generation_enabled'
    ) THEN
        ALTER TABLE public.event_settings
            ADD COLUMN tags_generation_enabled BOOLEAN NOT NULL DEFAULT true;
        
        -- Commentaire pour documentation
        COMMENT ON COLUMN public.event_settings.tags_generation_enabled IS 'Active ou désactive la génération de tags par l''IA pour les photos';
    END IF;
END $$;




