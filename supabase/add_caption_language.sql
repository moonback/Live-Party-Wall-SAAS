-- Ajout du champ caption_language à la table event_settings
-- Support multilingue pour les légendes générées par l'IA

-- Ajouter la colonne caption_language si elle n'existe pas
ALTER TABLE public.event_settings
  ADD COLUMN IF NOT EXISTS caption_language TEXT NOT NULL DEFAULT 'fr';

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN public.event_settings.caption_language IS 'Code langue ISO 639-1 pour la traduction des légendes (ex: fr, en, es, de, it, pt). Par défaut: fr (français)';

-- Mettre à jour les enregistrements existants pour avoir 'fr' par défaut
UPDATE public.event_settings
SET caption_language = 'fr'
WHERE caption_language IS NULL OR caption_language = '';

