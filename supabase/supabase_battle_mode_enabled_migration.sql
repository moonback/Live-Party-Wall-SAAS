-- Migration pour ajouter le paramètre battle_mode_enabled
-- ==========================================

-- Ajouter la colonne 'battle_mode_enabled' avec valeur par défaut true pour rétrocompatibilité
alter table public.event_settings 
add column if not exists battle_mode_enabled boolean default true not null;

-- Mettre à jour les enregistrements existants pour avoir battle_mode_enabled = true
update public.event_settings 
set battle_mode_enabled = true 
where battle_mode_enabled is null;

-- Commentaire pour documentation
comment on column public.event_settings.battle_mode_enabled is 'Active ou désactive le mode battle (création et affichage des battles entre photos)';

