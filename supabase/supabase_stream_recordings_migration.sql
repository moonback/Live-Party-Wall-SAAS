-- Migration pour ajouter le support des enregistrements de streams
-- Table pour stocker les enregistrements de streams live pour replay

-- Table stream_recordings
CREATE TABLE IF NOT EXISTS stream_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL, -- URL publique dans Supabase Storage
  storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  title TEXT, -- Titre de l'enregistrement (peut être différent du stream)
  filename TEXT NOT NULL, -- Nom du fichier vidéo
  file_size BIGINT, -- Taille du fichier en octets
  duration_seconds NUMERIC, -- Durée de l'enregistrement en secondes
  started_at TIMESTAMPTZ NOT NULL, -- Début de l'enregistrement
  ended_at TIMESTAMPTZ NOT NULL, -- Fin de l'enregistrement
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  view_count INTEGER DEFAULT 0 -- Nombre de vues du replay
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stream_recordings_stream_id ON stream_recordings(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_event_id ON stream_recordings(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_created_at ON stream_recordings(created_at DESC);

-- RLS Policies pour stream_recordings
ALTER TABLE stream_recordings ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tout le monde peut voir les enregistrements)
CREATE POLICY "Public Read Stream Recordings"
ON stream_recordings FOR SELECT
TO anon, authenticated
USING (true);

-- Insertion réservée aux utilisateurs authentifiés (organisateurs)
CREATE POLICY "Authenticated Insert Stream Recordings"
ON stream_recordings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Mise à jour réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Update Stream Recordings"
ON stream_recordings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Delete Stream Recordings"
ON stream_recordings FOR DELETE
TO authenticated
USING (true);

-- Activer Realtime pour stream_recordings
-- Note: À activer manuellement dans le Dashboard Supabase > Database > Replication

-- Commentaire sur la table
COMMENT ON TABLE stream_recordings IS 'Table pour stocker les enregistrements de streams live pour replay';
COMMENT ON COLUMN stream_recordings.view_count IS 'Nombre de fois que le replay a été visionné';

