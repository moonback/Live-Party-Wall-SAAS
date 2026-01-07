-- Migration pour activer Realtime sur event_settings
-- ==========================================

-- Ajouter event_settings à la publication Realtime si ce n'est pas déjà fait
-- Note: Cette commande peut échouer si la table est déjà dans la publication, c'est normal
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
EXCEPTION
    WHEN duplicate_object THEN
        -- La table est déjà dans la publication, on continue
        RAISE NOTICE 'La table event_settings est déjà dans la publication Realtime';
END $$;

-- Commentaire pour documentation
COMMENT ON TABLE public.event_settings IS 'Configuration de l''événement (singleton). Les mises à jour sont diffusées en temps réel via Supabase Realtime pour synchroniser tous les clients.';

