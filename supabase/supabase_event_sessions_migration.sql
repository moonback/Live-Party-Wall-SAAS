-- ==========================================
-- MIGRATION : TABLE EVENT_SESSIONS
-- ==========================================
-- Crée la table event_sessions pour gérer les sessions (soirées)
-- pour les événements permanents (restaurateurs)
-- Date: 2026-01-15
-- ==========================================

CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  photo_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, date)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON public.event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_date ON public.event_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_event_sessions_event_date ON public.event_sessions(event_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_event_sessions_is_archived ON public.event_sessions(is_archived);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_event_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_sessions_updated_at ON public.event_sessions;
CREATE TRIGGER trigger_update_event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_sessions_updated_at();

-- Trigger pour incrémenter photo_count automatiquement
-- Ce trigger sera déclenché par un trigger sur la table photos
CREATE OR REPLACE FUNCTION increment_session_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    UPDATE public.event_sessions
    SET photo_count = photo_count + 1
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activer RLS
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour event_sessions
-- Lecture publique pour tous
DROP POLICY IF EXISTS "Public Read Event Sessions" ON public.event_sessions;
CREATE POLICY "Public Read Event Sessions"
  ON public.event_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insertion pour utilisateurs authentifiés (via le service)
DROP POLICY IF EXISTS "Authenticated Insert Event Sessions" ON public.event_sessions;
CREATE POLICY "Authenticated Insert Event Sessions"
  ON public.event_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Mise à jour pour utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated Update Event Sessions" ON public.event_sessions;
CREATE POLICY "Authenticated Update Event Sessions"
  ON public.event_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commentaires pour documentation
COMMENT ON TABLE public.event_sessions IS 'Sessions (soirées) pour les événements permanents. Une session = une date pour un événement permanent.';
COMMENT ON COLUMN public.event_sessions.date IS 'Date de la session au format DATE (YYYY-MM-DD)';
COMMENT ON COLUMN public.event_sessions.photo_count IS 'Nombre de photos dans cette session (mis à jour automatiquement)';
COMMENT ON COLUMN public.event_sessions.is_archived IS 'Indique si la session est archivée (soirée terminée)';

