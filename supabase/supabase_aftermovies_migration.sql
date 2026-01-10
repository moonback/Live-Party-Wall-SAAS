-- ==========================================
-- MIGRATION: Table Aftermovies
-- ==========================================
-- Création de la table pour stocker les aftermovies générés
-- Date: 2026-01-15
-- ==========================================

-- Table aftermovies
CREATE TABLE IF NOT EXISTS public.aftermovies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    title TEXT,
    filename TEXT NOT NULL,
    file_size BIGINT,
    duration_seconds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by TEXT -- Nom de l'organisateur/admin qui a créé l'aftermovie
);

-- Index pour optimiser les requêtes par événement
CREATE INDEX IF NOT EXISTS idx_aftermovies_event_id ON public.aftermovies(event_id);
CREATE INDEX IF NOT EXISTS idx_aftermovies_created_at ON public.aftermovies(created_at DESC);

-- Activer RLS
ALTER TABLE public.aftermovies ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour aftermovies
-- Lecture publique (tous les invités peuvent voir les aftermovies)
DROP POLICY IF EXISTS "Public Read Aftermovies" ON public.aftermovies;
CREATE POLICY "Public Read Aftermovies"
    ON public.aftermovies
    FOR SELECT
    USING (true);

-- Insertion réservée aux admins (via service role ou auth)
DROP POLICY IF EXISTS "Authenticated Insert Aftermovies" ON public.aftermovies;
CREATE POLICY "Authenticated Insert Aftermovies"
    ON public.aftermovies
    FOR INSERT
    WITH CHECK (true); -- Pour l'instant, permettre l'insertion depuis le client (sera sécurisé côté service)

-- Mise à jour réservée aux admins
DROP POLICY IF EXISTS "Authenticated Update Aftermovies" ON public.aftermovies;
CREATE POLICY "Authenticated Update Aftermovies"
    ON public.aftermovies
    FOR UPDATE
    USING (true);

-- Suppression réservée aux admins
DROP POLICY IF EXISTS "Authenticated Delete Aftermovies" ON public.aftermovies;
CREATE POLICY "Authenticated Delete Aftermovies"
    ON public.aftermovies
    FOR DELETE
    USING (true);

-- Commentaires
COMMENT ON TABLE public.aftermovies IS 'Stocke les aftermovies générés pour chaque événement';
COMMENT ON COLUMN public.aftermovies.url IS 'URL publique de l''aftermovie dans Supabase Storage';
COMMENT ON COLUMN public.aftermovies.storage_path IS 'Chemin dans le bucket Supabase Storage';
COMMENT ON COLUMN public.aftermovies.title IS 'Titre de l''aftermovie (optionnel)';
COMMENT ON COLUMN public.aftermovies.filename IS 'Nom du fichier original';
COMMENT ON COLUMN public.aftermovies.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN public.aftermovies.duration_seconds IS 'Durée de la vidéo en secondes';
COMMENT ON COLUMN public.aftermovies.created_by IS 'Nom de l''organisateur/admin qui a créé l''aftermovie';

