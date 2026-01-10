-- ==========================================
-- MIGRATION: Ajout de la colonne user_description à la table photos
-- ==========================================
-- Cette migration ajoute la colonne user_description pour permettre
-- aux utilisateurs de saisir une description personnalisée lors de l'upload
-- Date: 2026-01-15
-- ==========================================

-- Ajouter la colonne user_description si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'photos' 
        AND column_name = 'user_description'
    ) THEN
        ALTER TABLE public.photos
            ADD COLUMN user_description TEXT;
        
        COMMENT ON COLUMN public.photos.user_description IS 'Description saisie par l''utilisateur lors de l''upload (distincte de la légende générée par IA)';
    END IF;
END $$;




