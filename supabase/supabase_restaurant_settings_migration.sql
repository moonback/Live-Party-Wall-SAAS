-- ==========================================
-- MIGRATION : EVENT_SETTINGS - MODE RESTAURATEUR
-- ==========================================
-- Ajoute les colonnes pour le mode restaurateur
-- dans la table event_settings
-- Date: 2026-01-15
-- ==========================================

-- Mode restaurateur
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS restaurant_mode_enabled BOOLEAN DEFAULT false;

-- Mode écran ambiant
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS ambient_display_enabled BOOLEAN DEFAULT false;

-- Vitesse d'affichage ambiant
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS ambient_display_speed TEXT DEFAULT 'very_slow';

-- Contrainte pour ambient_display_speed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_settings_ambient_display_speed_check' 
    AND conrelid = 'public.event_settings'::regclass
  ) THEN
    ALTER TABLE public.event_settings
      ADD CONSTRAINT event_settings_ambient_display_speed_check 
      CHECK (ambient_display_speed IN ('very_slow', 'slow', 'normal'));
  END IF;
END $$;

-- Pause automatique si aucune photo
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS auto_pause_when_empty BOOLEAN DEFAULT true;

-- Partage social
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS social_sharing_enabled BOOLEAN DEFAULT false;

-- Watermark sur partage social
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS social_watermark_enabled BOOLEAN DEFAULT true;

-- Prompt d'avis (reviews)
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS review_prompt_enabled BOOLEAN DEFAULT false;

-- Mettre à jour les settings existants avec les valeurs par défaut
UPDATE public.event_settings
SET 
  restaurant_mode_enabled = COALESCE(restaurant_mode_enabled, false),
  ambient_display_enabled = COALESCE(ambient_display_enabled, false),
  ambient_display_speed = COALESCE(ambient_display_speed, 'very_slow'),
  auto_pause_when_empty = COALESCE(auto_pause_when_empty, true),
  social_sharing_enabled = COALESCE(social_sharing_enabled, false),
  social_watermark_enabled = COALESCE(social_watermark_enabled, true),
  review_prompt_enabled = COALESCE(review_prompt_enabled, false)
WHERE restaurant_mode_enabled IS NULL
   OR ambient_display_enabled IS NULL
   OR ambient_display_speed IS NULL
   OR auto_pause_when_empty IS NULL
   OR social_sharing_enabled IS NULL
   OR social_watermark_enabled IS NULL
   OR review_prompt_enabled IS NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.event_settings.restaurant_mode_enabled IS 'Active le mode restaurateur avec interface simplifiée';
COMMENT ON COLUMN public.event_settings.ambient_display_enabled IS 'Active le mode écran ambiant (affichage lent en boucle)';
COMMENT ON COLUMN public.event_settings.ambient_display_speed IS 'Vitesse d''affichage ambiant : very_slow, slow, normal';
COMMENT ON COLUMN public.event_settings.auto_pause_when_empty IS 'Pause automatique l''affichage ambiant si aucune photo';
COMMENT ON COLUMN public.event_settings.social_sharing_enabled IS 'Active les options de partage social (Instagram Story/Reel, WhatsApp)';
COMMENT ON COLUMN public.event_settings.social_watermark_enabled IS 'Ajoute un watermark discret du restaurant sur les images partagées';
COMMENT ON COLUMN public.event_settings.review_prompt_enabled IS 'Affiche un prompt pour demander un avis (Google Maps, TripAdvisor) après upload';

