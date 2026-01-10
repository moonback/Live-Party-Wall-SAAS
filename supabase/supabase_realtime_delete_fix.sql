-- ==========================================
-- FIX: REPLICA IDENTITY pour DELETE events
-- ==========================================
-- 
-- Par défaut, PostgreSQL n'inclut que la clé primaire dans payload.old lors d'un DELETE.
-- Pour que Supabase Realtime transmette toutes les colonnes (y compris event_id),
-- on doit configurer REPLICA IDENTITY FULL sur la table photos.
--
-- ⚠️ NOTE: Cela peut avoir un léger impact sur les performances lors des DELETE,
-- mais c'est nécessaire pour filtrer correctement les suppressions par event_id.

-- Configurer REPLICA IDENTITY FULL pour la table photos
-- Cela permet à payload.old de contenir toutes les colonnes lors d'un DELETE
ALTER TABLE public.photos REPLICA IDENTITY FULL;

-- Vérifier la configuration
-- SELECT relreplident, relname 
-- FROM pg_class 
-- WHERE relname = 'photos';
-- Résultat attendu: 'f' (FULL) au lieu de 'd' (DEFAULT)

