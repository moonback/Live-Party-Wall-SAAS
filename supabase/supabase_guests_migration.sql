-- ==========================================
-- MIGRATION: Ajout du bucket party-avatars + table guests
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- ==========================================
-- 1. TABLE GUESTS
-- ==========================================

-- Créer la table guests pour stocker les informations des invités
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer un index sur le nom pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_guests_name ON public.guests(name);
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON public.guests(created_at);

-- Activer la sécurité niveau ligne (RLS)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour la table guests
-- Tout le monde peut voir les invités (pour afficher les avatars)
CREATE POLICY "Public Read Guests"
ON public.guests FOR SELECT
TO anon, authenticated
USING (true);

-- Tout le monde peut créer un invité (inscription)
CREATE POLICY "Public Insert Guests"
ON public.guests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Seuls les utilisateurs authentifiés peuvent mettre à jour (admin)
CREATE POLICY "Authenticated Update Guests"
ON public.guests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Seuls les utilisateurs authentifiés peuvent supprimer (admin)
CREATE POLICY "Authenticated Delete Guests"
ON public.guests FOR DELETE
TO authenticated
USING (true);

-- ==========================================
-- 2. STORAGE BUCKET party-avatars
-- ==========================================

-- Créer le bucket 'party-avatars' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-avatars', 'party-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques pour le Storage bucket party-avatars
-- Tout le monde peut voir les avatars
DROP POLICY IF EXISTS "Public Access Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Access Avatars Bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'party-avatars' );

-- Tout le monde peut uploader des avatars (inscription)
DROP POLICY IF EXISTS "Public Upload Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Upload Avatars Bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK ( bucket_id = 'party-avatars' );

-- Policy UPDATE pour upsert (quand fichier existe déjà)
DROP POLICY IF EXISTS "Public Update Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Update Avatars Bucket"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING ( bucket_id = 'party-avatars' )
WITH CHECK ( bucket_id = 'party-avatars' );

-- Seuls les utilisateurs authentifiés peuvent supprimer les avatars (admin)
DROP POLICY IF EXISTS "Authenticated Delete Avatars Bucket" ON storage.objects;
CREATE POLICY "Authenticated Delete Avatars Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'party-avatars' );

-- ==========================================
-- 3. REALTIME (optionnel, pour les mises à jour en temps réel)
-- ==========================================

-- Activer la publication des événements pour le temps réel (optionnel)
-- Note: Cette commande peut échouer si la table est déjà dans la publication, c'est normal
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
EXCEPTION
    WHEN duplicate_object THEN
        -- La table est déjà dans la publication, on continue
        NULL;
END $$;

