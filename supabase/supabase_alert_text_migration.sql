-- Migration pour ajouter le champ alert_text
-- ==========================================

-- Ajouter la colonne 'alert_text' avec valeur par défaut null
alter table public.event_settings 
add column if not exists alert_text text;

-- Commentaire pour documentation
comment on column public.event_settings.alert_text is 'Texte d''alerte affiché en grand au-dessus des photos sur le mur pour signaler quelque chose aux invités';

-- S'assurer que event_settings est dans la publication Realtime pour les mises à jour en temps réel
-- Note: Cette commande peut échouer si la table est déjà dans la publication, c'est normal
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
EXCEPTION
    WHEN duplicate_object THEN
        -- La table est déjà dans la publication, on continue
        RAISE NOTICE 'La table event_settings est déjà dans la publication Realtime';
END $$;

