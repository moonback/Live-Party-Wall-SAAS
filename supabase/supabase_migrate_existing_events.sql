-- ==========================================
-- MIGRATION : ÉVÉNEMENTS EXISTANTS
-- ==========================================
-- Migre les événements existants vers le nouveau système
-- Tous les événements existants deviennent 'one_shot' par défaut
-- Date: 2026-01-15
-- ==========================================

-- S'assurer que tous les événements existants ont event_type = 'one_shot'
UPDATE public.events
SET event_type = 'one_shot'
WHERE event_type IS NULL OR event_type = '';

-- S'assurer que restaurant_mode_enabled est false pour les événements existants
UPDATE public.events
SET restaurant_mode_enabled = false
WHERE restaurant_mode_enabled IS NULL;

-- S'assurer que tous les event_settings existants ont les valeurs par défaut
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

-- Note: Les photos existantes n'ont pas besoin de session_id
-- car elles appartiennent à des événements 'one_shot' qui n'utilisent pas les sessions

