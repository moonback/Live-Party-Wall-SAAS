-- Migration pour ajouter le support des streams live
-- Table pour gérer les streams live actifs

-- Table live_streams
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stream_key TEXT NOT NULL UNIQUE, -- Clé unique pour identifier le stream
  title TEXT, -- Titre optionnel du stream
  is_active BOOLEAN DEFAULT true, -- Stream actif ou non
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ, -- Date de fin du stream
  created_by TEXT, -- Nom de l'organisateur qui a démarré le stream
  viewer_count INTEGER DEFAULT 0, -- Nombre de viewers (optionnel, peut être calculé)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_live_streams_event_id ON live_streams(event_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_key ON live_streams(stream_key);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_live_streams_started_at ON live_streams(started_at DESC);

-- RLS Policies pour live_streams
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tout le monde peut voir les streams actifs)
CREATE POLICY "Public Read Live Streams"
ON live_streams FOR SELECT
TO anon, authenticated
USING (true);

-- Insertion réservée aux utilisateurs authentifiés (organisateurs)
CREATE POLICY "Authenticated Insert Live Streams"
ON live_streams FOR INSERT
TO authenticated
WITH CHECK (true);

-- Mise à jour réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Update Live Streams"
ON live_streams FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated Delete Live Streams"
ON live_streams FOR DELETE
TO authenticated
USING (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_live_streams_updated_at
BEFORE UPDATE ON live_streams
FOR EACH ROW
EXECUTE FUNCTION update_live_streams_updated_at();

-- Activer Realtime pour live_streams
-- Note: À activer manuellement dans le Dashboard Supabase > Database > Replication

-- Commentaire sur la table
COMMENT ON TABLE live_streams IS 'Table pour gérer les streams live actifs pour chaque événement';
COMMENT ON COLUMN live_streams.stream_key IS 'Clé unique pour identifier le stream (générée côté client)';
COMMENT ON COLUMN live_streams.is_active IS 'Indique si le stream est actuellement actif';
COMMENT ON COLUMN live_streams.viewer_count IS 'Nombre de viewers connectés (optionnel, peut être calculé dynamiquement)';

