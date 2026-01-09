-- ==========================================
-- ROLLBACK: SUPPRESSION DE LA TABLE REMOTE_COMMANDS ET OBJETS ASSOCIÉS
-- ==========================================

-- Supprimer la publication Realtime pour la table (ignorer l'erreur si pas présente)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.remote_commands;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'La table remote_commands n''était pas présente dans la publication.';
  WHEN others THEN
    RAISE NOTICE 'Suppression de la table remote_commands de la publication ignorée (autre erreur).';
END $$;

-- Suppression des politiques RLS
DROP POLICY IF EXISTS "Public insert remote commands" ON public.remote_commands;
DROP POLICY IF EXISTS "Public select remote commands" ON public.remote_commands;
DROP POLICY IF EXISTS "Public update remote commands" ON public.remote_commands;

-- Désactivation du RLS (par sécurité avant drop)
ALTER TABLE IF EXISTS public.remote_commands DISABLE ROW LEVEL SECURITY;

-- Suppression des indexes (optionnel, supprime aussi avec DROP TABLE mais explicite)
DROP INDEX IF EXISTS idx_remote_commands_event_id;
DROP INDEX IF EXISTS idx_remote_commands_processed;
DROP INDEX IF EXISTS idx_remote_commands_event_processed;
DROP INDEX IF EXISTS idx_remote_commands_created_at;

-- Suppression de la table
DROP TABLE IF EXISTS public.remote_commands;

