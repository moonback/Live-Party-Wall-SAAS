-- Migration: Ajout du contexte de la soirée pour personnaliser les légendes IA
-- Date: 2026-01-15

-- Ajouter la colonne event_context à la table event_settings
ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS event_context TEXT;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN event_settings.event_context IS 'Contexte de la soirée/événement utilisé pour personnaliser les légendes générées par IA (ex: "Anniversaire 30 ans", "Mariage", "Soirée entreprise")';



