-- Migration pour ajouter le paramètre stats_enabled
-- ==========================================

-- Ajouter la colonne 'stats_enabled' avec valeur par défaut true pour rétrocompatibilité
alter table public.event_settings 
add column if not exists stats_enabled boolean default true not null;

-- Mettre à jour les enregistrements existants pour avoir stats_enabled = true
update public.event_settings 
set stats_enabled = true 
where stats_enabled is null;

-- Commentaire pour documentation
comment on column public.event_settings.stats_enabled is 'Active ou désactive la page de statistiques et le lien d''accès sur la page d''accueil';

