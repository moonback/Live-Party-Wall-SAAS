-- ==========================================
-- MIGRATION: Ajout du bucket party-frames + policies complètes
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-frames', 'party-frames', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes policies (pour éviter les conflits)
DROP POLICY IF EXISTS "Public Access Frames Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Frames Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Frames Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Frames Bucket" ON storage.objects;

-- 3. Créer les nouvelles policies

-- Lecture publique (tout le monde peut voir les cadres)
CREATE POLICY "Public Access Frames Bucket"
ON storage.objects FOR SELECT
USING ( bucket_id = 'party-frames' );

-- Upload réservé aux utilisateurs authentifiés (admin)
CREATE POLICY "Admin Upload Frames Bucket"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'party-frames' 
  AND auth.role() = 'authenticated'
);

-- Update pour upsert (quand le fichier existe déjà)
CREATE POLICY "Admin Update Frames Bucket"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'party-frames' 
  AND auth.role() = 'authenticated'
)
WITH CHECK ( 
  bucket_id = 'party-frames' 
  AND auth.role() = 'authenticated'
);

-- Delete pour supprimer les cadres
CREATE POLICY "Admin Delete Frames Bucket"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'party-frames' 
  AND auth.role() = 'authenticated'
);

-- 4. Vérifier que la table event_settings a les bonnes colonnes
ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS decorative_frame_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS decorative_frame_url TEXT;

-- 5. Mettre à jour la ligne de config par défaut si elle existe
UPDATE event_settings 
SET 
  decorative_frame_enabled = COALESCE(decorative_frame_enabled, false),
  decorative_frame_url = COALESCE(decorative_frame_url, null)
WHERE id = 1;

-- Si pas de ligne, en créer une
INSERT INTO event_settings (id, event_title, event_subtitle, scroll_speed, slide_transition, decorative_frame_enabled, decorative_frame_url)
SELECT 1, 'Party Wall', 'Live', 'normal', 'fade', false, null
WHERE NOT EXISTS (SELECT 1 FROM event_settings WHERE id = 1);

