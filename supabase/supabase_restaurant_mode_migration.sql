-- ==========================================
-- MIGRATION : MODE RESTAURATEUR - TABLE EVENTS
-- ==========================================
-- Ajoute les colonnes event_type et restaurant_mode_enabled
-- à la table events pour supporter les événements permanents
-- Date: 2026-01-15
-- ==========================================

-- Ajouter event_type avec valeur par défaut 'one_shot' pour rétrocompatibilité
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'one_shot';

-- Ajouter la contrainte CHECK pour event_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_event_type_check' 
    AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_type_check 
      CHECK (event_type IN ('one_shot', 'recurring', 'permanent'));
  END IF;
END $$;

-- Mettre à jour les événements existants pour avoir 'one_shot' par défaut
UPDATE public.events
SET event_type = 'one_shot'
WHERE event_type IS NULL;

-- Ajouter restaurant_mode_enabled
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS restaurant_mode_enabled BOOLEAN DEFAULT false;

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_restaurant_mode ON public.events(restaurant_mode_enabled);

-- Commentaires pour documentation
COMMENT ON COLUMN public.events.event_type IS 'Type d''événement : one_shot (ponctuel), recurring (récurrent), permanent (permanent pour restaurateurs)';
COMMENT ON COLUMN public.events.restaurant_mode_enabled IS 'Active le mode restaurateur avec interface simplifiée et fonctionnalités adaptées';

