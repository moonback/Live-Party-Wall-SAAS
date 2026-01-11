-- Migration pour ajouter le support du comptage de viewers en temps réel
-- Table pour tracker les viewers actifs d'un stream

-- Table stream_viewers
CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL, -- ID unique du viewer (session ID)
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(stream_id, viewer_id) -- Un viewer ne peut être compté qu'une fois par stream
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_event_id ON stream_viewers(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_last_seen_at ON stream_viewers(last_seen_at);

-- RLS Policies pour stream_viewers
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tout le monde peut voir les viewers)
CREATE POLICY "Public Read Stream Viewers"
ON stream_viewers FOR SELECT
TO anon, authenticated
USING (true);

-- Insertion publique (tout le monde peut s'enregistrer comme viewer)
CREATE POLICY "Public Insert Stream Viewers"
ON stream_viewers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Mise à jour publique (pour mettre à jour last_seen_at)
CREATE POLICY "Public Update Stream Viewers"
ON stream_viewers FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Suppression publique (pour permettre aux viewers de se déconnecter)
CREATE POLICY "Public Delete Stream Viewers"
ON stream_viewers FOR DELETE
TO anon, authenticated
USING (true);

-- Trigger pour mettre à jour last_seen_at automatiquement
CREATE OR REPLACE FUNCTION update_stream_viewer_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stream_viewer_last_seen
BEFORE UPDATE ON stream_viewers
FOR EACH ROW
EXECUTE FUNCTION update_stream_viewer_last_seen();

-- Activer Realtime pour stream_viewers
-- Note: À activer manuellement dans le Dashboard Supabase > Database > Replication

-- Commentaire sur la table
COMMENT ON TABLE stream_viewers IS 'Table pour tracker les viewers actifs d un stream en temps réel';
COMMENT ON COLUMN stream_viewers.viewer_id IS 'ID unique du viewer (session ID généré côté client)';
COMMENT ON COLUMN stream_viewers.last_seen_at IS 'Dernière fois que le viewer a été vu (pour détecter les déconnexions)';

