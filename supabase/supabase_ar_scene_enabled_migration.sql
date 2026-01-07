-- =====================================================
-- Migration : Ajout du champ ar_scene_enabled
-- =====================================================
-- Ce script ajoute le champ pour activer/désactiver
-- le mode Scène Augmentée (AR) dans les paramètres.
-- 
-- Date : 2026-01-15
-- =====================================================

-- Ajouter la colonne ar_scene_enabled
ALTER TABLE event_settings
ADD COLUMN IF NOT EXISTS ar_scene_enabled BOOLEAN NOT NULL DEFAULT true;

-- Mettre à jour les valeurs existantes si nécessaire
UPDATE event_settings
SET ar_scene_enabled = true
WHERE ar_scene_enabled IS NULL;

