-- ==========================================
-- MISE À JOUR CONTRAINTE CHECK - remote_commands
-- ==========================================
-- Met à jour la contrainte CHECK pour accepter SHOW_RANDOM_PHOTO
-- au lieu de TOGGLE_FULLSCREEN
-- ==========================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.remote_commands
DROP CONSTRAINT IF EXISTS remote_commands_command_type_check;

-- Ajouter la nouvelle contrainte avec SHOW_RANDOM_PHOTO et CLOSE_RANDOM_PHOTO
ALTER TABLE public.remote_commands
ADD CONSTRAINT remote_commands_command_type_check 
CHECK (command_type IN ('TOGGLE_AUTO_SCROLL', 'TRIGGER_AR_EFFECT', 'TOGGLE_QR_CODES', 'SHOW_RANDOM_PHOTO', 'CLOSE_RANDOM_PHOTO'));

-- Mettre à jour le commentaire
COMMENT ON COLUMN public.remote_commands.command_type IS 'Type de commande : TOGGLE_AUTO_SCROLL, TRIGGER_AR_EFFECT, TOGGLE_QR_CODES, SHOW_RANDOM_PHOTO, CLOSE_RANDOM_PHOTO';

