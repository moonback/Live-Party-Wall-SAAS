-- Migration pour ajouter le paramètre collage_mode_enabled
-- ==========================================

-- Ajouter la colonne 'collage_mode_enabled' avec valeur par défaut true pour rétrocompatibilité
alter table public.event_settings 
add column if not exists collage_mode_enabled boolean default true not null;

-- Mettre à jour les enregistrements existants pour avoir collage_mode_enabled = true
update public.event_settings 
set collage_mode_enabled = true 
where collage_mode_enabled is null;

-- Commentaire pour documentation
comment on column public.event_settings.collage_mode_enabled is 'Active ou désactive la fonctionnalité de mode collage pour les utilisateurs';

