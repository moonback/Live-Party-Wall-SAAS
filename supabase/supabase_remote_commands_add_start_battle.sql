-- ==========================================
-- MIGRATION : Ajouter START_BATTLE à remote_commands
-- ==========================================
-- Ajoute le type de commande START_BATTLE pour lancer une battle automatique de 10 minutes
-- ==========================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.remote_commands
DROP CONSTRAINT IF EXISTS remote_commands_command_type_check;

-- Ajouter la nouvelle contrainte avec START_BATTLE
ALTER TABLE public.remote_commands
ADD CONSTRAINT remote_commands_command_type_check 
CHECK (command_type IN (
  'TOGGLE_AUTO_SCROLL', 
  'TRIGGER_AR_EFFECT', 
  'TOGGLE_QR_CODES', 
  'SHOW_RANDOM_PHOTO',
  'CLOSE_RANDOM_PHOTO',
  'START_BATTLE'
));

-- Mettre à jour le commentaire
COMMENT ON COLUMN public.remote_commands.command_type IS 'Type de commande : TOGGLE_AUTO_SCROLL, TRIGGER_AR_EFFECT, TOGGLE_QR_CODES, SHOW_RANDOM_PHOTO, CLOSE_RANDOM_PHOTO, START_BATTLE';

