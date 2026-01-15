-- Migration pour ajouter le paramètre gallery_enabled
-- ==========================================

-- Ajouter la colonne 'gallery_enabled' avec valeur par défaut true pour rétrocompatibilité
alter table public.event_settings 
add column if not exists gallery_enabled boolean default true not null;

-- Mettre à jour les enregistrements existants pour avoir gallery_enabled = true
update public.event_settings 
set gallery_enabled = true 
where gallery_enabled is null;

-- Commentaire pour documentation
comment on column public.event_settings.gallery_enabled is 'Active ou désactive la galerie interactive (vue mobile avec likes, réactions et filtres)';

