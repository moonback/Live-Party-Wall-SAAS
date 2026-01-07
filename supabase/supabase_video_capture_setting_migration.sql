-- Migration pour ajouter le paramètre video_capture_enabled
-- ==========================================

-- Ajouter la colonne 'video_capture_enabled' avec valeur par défaut true pour rétrocompatibilité
alter table public.event_settings 
add column if not exists video_capture_enabled boolean default true not null;

-- Mettre à jour les enregistrements existants pour avoir video_capture_enabled = true
update public.event_settings 
set video_capture_enabled = true 
where video_capture_enabled is null;

-- Commentaire pour documentation
comment on column public.event_settings.video_capture_enabled is 'Active ou désactive la fonctionnalité de capture vidéo pour les utilisateurs';

