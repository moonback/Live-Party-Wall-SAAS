-- ==========================================
-- OPTIMISATIONS SUPABASE - Partywall
-- ==========================================
-- Ce fichier contient toutes les optimisations de base de données
-- pour améliorer les performances des requêtes Supabase.
--
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. INDEX COMPOSITES
-- ==========================================

-- Photos : requêtes fréquentes par event_id + created_at
CREATE INDEX IF NOT EXISTS idx_photos_event_created 
ON public.photos(event_id, created_at DESC);

-- Photos : requêtes fréquentes par event_id + type
CREATE INDEX IF NOT EXISTS idx_photos_event_type 
ON public.photos(event_id, type) WHERE type = 'photo';

-- Photos : requêtes fréquentes par event_id + author
CREATE INDEX IF NOT EXISTS idx_photos_event_author 
ON public.photos(event_id, author);

-- Likes : requêtes fréquentes par photo_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_likes_photo_user 
ON public.likes(photo_id, user_identifier);

-- Reactions : requêtes fréquentes par photo_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_reactions_photo_user 
ON public.reactions(photo_id, user_identifier);

-- Reactions : requêtes fréquentes par photo_id + reaction_type
CREATE INDEX IF NOT EXISTS idx_reactions_photo_type 
ON public.reactions(photo_id, reaction_type);

-- Battle votes : requêtes fréquentes par battle_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_user 
ON public.battle_votes(battle_id, user_identifier);

-- Blocked guests : requêtes fréquentes par event_id + name + expires_at
CREATE INDEX IF NOT EXISTS idx_blocked_guests_event_name_expires 
ON public.blocked_guests(event_id, name, expires_at);

-- Event organizers : requêtes fréquentes par event_id + user_id
CREATE INDEX IF NOT EXISTS idx_event_organizers_event_user 
ON public.event_organizers(event_id, user_id);

-- Photo battles : requêtes fréquentes par event_id + status
CREATE INDEX IF NOT EXISTS idx_photo_battles_event_status 
ON public.photo_battles(event_id, status);

-- Photo battles : requêtes fréquentes par event_id + status + created_at
CREATE INDEX IF NOT EXISTS idx_photo_battles_event_status_created 
ON public.photo_battles(event_id, status, created_at DESC);

-- ==========================================
-- 2. FONCTION SQL POUR PHOTOS AVEC LIKES
-- ==========================================

-- Fonction pour récupérer les photos avec le nombre de likes calculé
CREATE OR REPLACE FUNCTION get_photos_with_likes(
  event_uuid UUID,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  caption TEXT,
  author TEXT,
  created_at TIMESTAMPTZ,
  type TEXT,
  duration NUMERIC,
  tags JSONB,
  user_description TEXT,
  likes_count BIGINT,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
  total_photos BIGINT;
BEGIN
  -- Calculer l'offset
  offset_val := (page_num - 1) * page_size;

  -- Compter le total
  SELECT COUNT(*) INTO total_photos
  FROM public.photos
  WHERE event_id = event_uuid;

  -- Retourner les photos avec likes
  RETURN QUERY
  SELECT 
    p.id,
    p.url,
    p.caption,
    p.author,
    p.created_at,
    p.type,
    p.duration,
    p.tags,
    p.user_description,
    COALESCE(COUNT(l.id), 0)::BIGINT as likes_count,
    total_photos as total_count
  FROM public.photos p
  LEFT JOIN public.likes l ON p.id = l.photo_id
  WHERE p.event_id = event_uuid
  GROUP BY p.id, p.url, p.caption, p.author, p.created_at, p.type, p.duration, p.tags, p.user_description
  ORDER BY p.created_at ASC
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- Commentaire
COMMENT ON FUNCTION get_photos_with_likes IS 'Récupère les photos d''un événement avec le nombre de likes calculé, avec pagination';

-- ==========================================
-- 3. FONCTION SQL POUR PHOTOS PAR AUTEUR
-- ==========================================

CREATE OR REPLACE FUNCTION get_photos_by_author(
  event_uuid UUID,
  author_name TEXT
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  caption TEXT,
  author TEXT,
  created_at TIMESTAMPTZ,
  type TEXT,
  duration NUMERIC,
  likes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.url,
    p.caption,
    p.author,
    p.created_at,
    p.type,
    p.duration,
    COALESCE(COUNT(l.id), 0)::BIGINT as likes_count
  FROM public.photos p
  LEFT JOIN public.likes l ON p.id = l.photo_id
  WHERE p.event_id = event_uuid
    AND p.author = author_name
  GROUP BY p.id, p.url, p.caption, p.author, p.created_at, p.type, p.duration
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_photos_by_author IS 'Récupère toutes les photos d''un auteur pour un événement avec le nombre de likes';

-- ==========================================
-- 4. VUE MATÉRIALISÉE POUR LES STATS DE PHOTOS
-- ==========================================

-- Créer la vue matérialisée
CREATE MATERIALIZED VIEW IF NOT EXISTS photo_stats AS
SELECT 
  p.id as photo_id,
  p.event_id,
  p.author,
  p.created_at,
  p.type,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT r.id) as reactions_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'heart' THEN r.id END) as heart_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'laugh' THEN r.id END) as laugh_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'cry' THEN r.id END) as cry_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'fire' THEN r.id END) as fire_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'clap' THEN r.id END) as clap_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'party' THEN r.id END) as party_count,
  MAX(l.created_at) as last_like_at,
  MAX(r.created_at) as last_reaction_at
FROM public.photos p
LEFT JOIN public.likes l ON p.id = l.photo_id
LEFT JOIN public.reactions r ON p.id = r.photo_id
GROUP BY p.id, p.event_id, p.author, p.created_at, p.type;

-- Index pour la vue matérialisée
CREATE INDEX IF NOT EXISTS idx_photo_stats_photo_id ON photo_stats(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_stats_event_id ON photo_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_stats_author ON photo_stats(author);
CREATE INDEX IF NOT EXISTS idx_photo_stats_event_author ON photo_stats(event_id, author);

-- Fonction pour rafraîchir la vue
CREATE OR REPLACE FUNCTION refresh_photo_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY photo_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_photo_stats IS 'Rafraîchit la vue matérialisée photo_stats';

-- ==========================================
-- 5. FONCTION POUR RÉACTIONS PAR PHOTO (OPTIMISÉE)
-- ==========================================

CREATE OR REPLACE FUNCTION get_photo_reactions_optimized(photo_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(
    reaction_type,
    count
  ) INTO result
  FROM (
    SELECT 
      reaction_type,
      COUNT(*) as count
    FROM public.reactions
    WHERE photo_id = photo_uuid
    GROUP BY reaction_type
  ) subquery;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_photo_reactions_optimized IS 'Retourne les compteurs de réactions pour une photo sous forme JSONB';

-- ==========================================
-- 6. FONCTION POUR RÉACTIONS PAR PLUSIEURS PHOTOS (BATCH)
-- ==========================================

CREATE OR REPLACE FUNCTION get_photos_reactions_batch(photo_ids UUID[])
RETURNS TABLE (
  photo_id UUID,
  reactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.photo_id,
    jsonb_object_agg(
      r.reaction_type,
      sub.count
    ) as reactions
  FROM (
    SELECT 
      photo_id,
      reaction_type,
      COUNT(*) as count
    FROM public.reactions
    WHERE photo_id = ANY(photo_ids)
    GROUP BY photo_id, reaction_type
  ) sub
  JOIN public.reactions r ON r.photo_id = sub.photo_id AND r.reaction_type = sub.reaction_type
  GROUP BY r.photo_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_photos_reactions_batch IS 'Retourne les compteurs de réactions pour plusieurs photos en une seule requête';

-- ==========================================
-- 7. TRIGGER POUR MAINTENIR LA VUE MATÉRIALISÉE
-- ==========================================

-- Fonction trigger pour rafraîchir la vue après modification
CREATE OR REPLACE FUNCTION trigger_refresh_photo_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Rafraîchir la vue de manière asynchrone (via pg_notify ou job queue)
  -- Pour l'instant, on ne rafraîchit pas automatiquement pour éviter les locks
  -- La vue sera rafraîchie périodiquement via un cron job
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: Les triggers sur les vues matérialisées peuvent causer des locks
-- Il est préférable de rafraîchir périodiquement via un cron job Supabase

-- ==========================================
-- 8. INDEX POUR LES RECHERCHES FULL-TEXT (SI NÉCESSAIRE)
-- ==========================================

-- Index GIN pour les tags (déjà créé dans la migration tags)
-- CREATE INDEX IF NOT EXISTS idx_photos_tags_gin ON public.photos USING GIN (tags);

-- Index pour les recherches par caption (si nécessaire)
-- CREATE INDEX IF NOT EXISTS idx_photos_caption_trgm ON public.photos USING gin (caption gin_trgm_ops);
-- Nécessite l'extension pg_trgm: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- 9. ANALYSE DES TABLES POUR OPTIMISER LES PLANS
-- ==========================================

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE public.photos;
ANALYZE public.likes;
ANALYZE public.reactions;
ANALYZE public.photo_battles;
ANALYZE public.battle_votes;
ANALYZE public.guests;
ANALYZE public.blocked_guests;
ANALYZE public.events;
ANALYZE public.event_organizers;
ANALYZE public.event_settings;

-- ==========================================
-- 10. PERMISSIONS POUR LES FONCTIONS
-- ==========================================

-- Donner les permissions d'exécution aux fonctions
GRANT EXECUTE ON FUNCTION get_photos_with_likes(UUID, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_author(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_photo_reactions_optimized(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_photos_reactions_batch(UUID[]) TO anon, authenticated;
GRANT SELECT ON photo_stats TO anon, authenticated;

-- ==========================================
-- NOTES IMPORTANTES
-- ==========================================

-- 1. Les vues matérialisées doivent être rafraîchies périodiquement
--    Créer un cron job Supabase pour appeler refresh_photo_stats() toutes les 5 minutes

-- 2. Les index composites peuvent ralentir les INSERT/UPDATE
--    Monitorer les performances après création

-- 3. Les fonctions SQL sont plus rapides que les requêtes multiples
--    Mais nécessitent de modifier le code TypeScript pour les utiliser

-- 4. Tester chaque optimisation individuellement avant de tout déployer

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================

