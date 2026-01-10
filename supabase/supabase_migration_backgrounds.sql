-- ==========================================
-- MIGRATION: Ajout du bucket party-backgrounds + policies complètes
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-backgrounds', 'party-backgrounds', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes policies (pour éviter les conflits)
DROP POLICY IF EXISTS "Public Access Backgrounds Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Backgrounds Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Backgrounds Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Backgrounds Bucket" ON storage.objects;

-- 3. Créer les nouvelles policies

-- Lecture publique (tout le monde peut voir les images de fond)
CREATE POLICY "Public Access Backgrounds Bucket"
ON storage.objects FOR SELECT
USING ( bucket_id = 'party-backgrounds' );

-- Upload réservé aux utilisateurs authentifiés (admin)
CREATE POLICY "Admin Upload Backgrounds Bucket"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'party-backgrounds' 
  AND auth.role() = 'authenticated'
);

-- Update pour upsert (quand le fichier existe déjà)
CREATE POLICY "Admin Update Backgrounds Bucket"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'party-backgrounds' 
  AND auth.role() = 'authenticated'
)
WITH CHECK ( 
  bucket_id = 'party-backgrounds' 
  AND auth.role() = 'authenticated'
);

-- Delete pour supprimer les images de fond
CREATE POLICY "Admin Delete Backgrounds Bucket"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'party-backgrounds' 
  AND auth.role() = 'authenticated'
);

-- 4. Vérifier que la table event_settings a les bonnes colonnes
ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS background_desktop_url TEXT;

ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS background_mobile_url TEXT;



