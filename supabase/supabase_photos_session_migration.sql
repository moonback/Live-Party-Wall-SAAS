-- ==========================================
-- MIGRATION : PHOTOS - AJOUT SESSION_ID
-- ==========================================
-- Ajoute la colonne session_id à la table photos
-- pour lier les photos aux sessions (soirées)
-- Date: 2026-01-15
-- ==========================================

-- Ajouter session_id avec ON DELETE SET NULL pour préserver les photos si session supprimée
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.event_sessions(id) ON DELETE SET NULL;

-- Index pour optimiser les requêtes par session
CREATE INDEX IF NOT EXISTS idx_photos_session_id ON public.photos(session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_session ON public.photos(event_id, session_id);

-- Trigger pour incrémenter le compteur de photos dans la session
CREATE OR REPLACE FUNCTION increment_session_photo_count_on_insert()
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

DROP TRIGGER IF EXISTS trigger_increment_session_photo_count ON public.photos;
CREATE TRIGGER trigger_increment_session_photo_count
  AFTER INSERT ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_photo_count_on_insert();

-- Trigger pour décrémenter le compteur si photo supprimée
CREATE OR REPLACE FUNCTION decrement_session_photo_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.session_id IS NOT NULL THEN
    UPDATE public.event_sessions
    SET photo_count = GREATEST(photo_count - 1, 0)
    WHERE id = OLD.session_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_session_photo_count ON public.photos;
CREATE TRIGGER trigger_decrement_session_photo_count
  AFTER DELETE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION decrement_session_photo_count_on_delete();

-- Commentaire pour documentation
COMMENT ON COLUMN public.photos.session_id IS 'ID de la session (soirée) associée. NULL pour les événements non-permanents ou photos sans session.';

