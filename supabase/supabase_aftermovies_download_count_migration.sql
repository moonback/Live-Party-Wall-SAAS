-- ==========================================
-- MIGRATION: Ajout du compteur de téléchargements
-- ==========================================
-- Ajoute la colonne download_count à la table aftermovies
-- Date: 2026-01-15
-- ==========================================

-- Ajouter la colonne download_count si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'aftermovies' 
        AND column_name = 'download_count'
    ) THEN
        ALTER TABLE public.aftermovies 
        ADD COLUMN download_count INTEGER DEFAULT 0 NOT NULL;
        
        COMMENT ON COLUMN public.aftermovies.download_count IS 'Nombre de téléchargements de l''aftermovie';
    END IF;
END $$;

-- Créer une fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_aftermovie_download_count(aftermovie_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.aftermovies
    SET download_count = download_count + 1
    WHERE id = aftermovie_id
    RETURNING download_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire sur la fonction
COMMENT ON FUNCTION increment_aftermovie_download_count(UUID) IS 'Incrémente le compteur de téléchargements d''un aftermovie';

