-- =====================================================
-- Optimisation des likes : Trigger PostgreSQL
-- =====================================================
-- Ce script crée un trigger qui met à jour automatiquement
-- le compteur likes_count dans la table photos lors des
-- INSERT/DELETE sur la table likes.
-- 
-- AVANTAGES :
-- - Évite N requêtes pour recalculer les likes (1 par photo)
-- - Mise à jour atomique (pas de race conditions)
-- - Performance optimale même avec beaucoup de likes simultanés
-- 
-- Date : 2026-01-15
-- =====================================================

-- Fonction trigger pour mettre à jour likes_count
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE photos 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur (minimum 0)
    UPDATE photos 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;

-- Créer le trigger
CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_photo_likes_count();

-- =====================================================
-- Index pour optimiser les requêtes de likes
-- =====================================================

-- Index sur photo_id (déjà créé via FK, mais on s'assure qu'il existe)
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON likes(photo_id);

-- Index sur user_identifier pour les requêtes de likes par utilisateur
CREATE INDEX IF NOT EXISTS idx_likes_user_identifier ON likes(user_identifier);

-- Index sur created_at pour les requêtes de tri par date
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- Index sur type pour filtrer photos/vidéos
CREATE INDEX IF NOT EXISTS idx_photos_type ON photos(type);

-- =====================================================
-- Synchronisation initiale du compteur
-- =====================================================
-- Mettre à jour tous les compteurs existants pour être sûr qu'ils sont corrects

UPDATE photos p
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes l 
  WHERE l.photo_id = p.id
);

-- =====================================================
-- Vérification
-- =====================================================
-- Pour vérifier que le trigger fonctionne :
-- 1. Insérer un like : INSERT INTO likes (photo_id, user_identifier) VALUES ('<photo_id>', 'test-user');
-- 2. Vérifier que photos.likes_count a été incrémenté
-- 3. Supprimer le like : DELETE FROM likes WHERE photo_id = '<photo_id>' AND user_identifier = 'test-user';
-- 4. Vérifier que photos.likes_count a été décrémenté

