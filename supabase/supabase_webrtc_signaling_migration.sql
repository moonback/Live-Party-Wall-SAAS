-- Migration pour ajouter le support de la signalisation WebRTC
-- Table pour gérer les messages de signalisation WebRTC entre broadcaster et viewers

-- Table webrtc_signaling
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('broadcaster', 'viewer')),
  sender_id TEXT NOT NULL, -- ID unique du sender (session ID)
  message_type TEXT NOT NULL CHECK (message_type IN ('offer', 'answer', 'ice-candidate')),
  message_data JSONB NOT NULL, -- Contenu du message (SDP, ICE candidate, etc.)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_stream_id ON webrtc_signaling(stream_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_event_id ON webrtc_signaling(event_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_created_at ON webrtc_signaling(created_at DESC);

-- RLS Policies pour webrtc_signaling
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tout le monde peut lire les messages de signalisation)
CREATE POLICY "Public Read WebRTC Signaling"
ON webrtc_signaling FOR SELECT
TO anon, authenticated
USING (true);

-- Insertion publique (tout le monde peut envoyer des messages de signalisation)
CREATE POLICY "Public Insert WebRTC Signaling"
ON webrtc_signaling FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Suppression automatique des messages anciens (via trigger ou cron job)
-- Les messages sont supprimés après 1 minute pour éviter l'accumulation

-- Trigger pour nettoyer les messages anciens (optionnel, peut être fait via cron)
CREATE OR REPLACE FUNCTION cleanup_old_webrtc_signaling()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les messages de plus de 1 minute
  DELETE FROM webrtc_signaling
  WHERE created_at < now() - INTERVAL '1 minute';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activer Realtime pour webrtc_signaling
-- Note: À activer manuellement dans le Dashboard Supabase > Database > Replication

-- Commentaire sur la table
COMMENT ON TABLE webrtc_signaling IS 'Table pour gérer les messages de signalisation WebRTC entre broadcaster et viewers';
COMMENT ON COLUMN webrtc_signaling.sender_id IS 'ID unique du sender (session ID généré côté client)';
COMMENT ON COLUMN webrtc_signaling.message_data IS 'Contenu du message WebRTC (SDP offer/answer, ICE candidates, etc.)';

