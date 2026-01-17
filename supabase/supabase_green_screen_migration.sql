-- Migration pour ajouter les paramètres de fond vert (chroma key)
-- ==========================================

-- Ajouter la colonne 'green_screen_enabled' avec valeur par défaut false
alter table public.event_settings 
add column if not exists green_screen_enabled boolean default false not null;

-- Ajouter la colonne 'green_screen_background_url' (nullable)
alter table public.event_settings 
add column if not exists green_screen_background_url text;

-- Ajouter la colonne 'green_screen_sensitivity' avec valeur par défaut 50
alter table public.event_settings 
add column if not exists green_screen_sensitivity integer default 50 not null;

-- Ajouter la colonne 'green_screen_smoothness' avec valeur par défaut 30
alter table public.event_settings 
add column if not exists green_screen_smoothness integer default 30 not null;

-- Mettre à jour les enregistrements existants avec les valeurs par défaut
update public.event_settings 
set green_screen_enabled = false 
where green_screen_enabled is null;

update public.event_settings 
set green_screen_sensitivity = 50 
where green_screen_sensitivity is null;

update public.event_settings 
set green_screen_smoothness = 30 
where green_screen_smoothness is null;

-- Commentaires pour documentation
comment on column public.event_settings.green_screen_enabled is 'Active ou désactive le fond vert (chroma key) dans le photobooth';
comment on column public.event_settings.green_screen_background_url is 'URL de l''image de fond de remplacement pour le chroma key';
comment on column public.event_settings.green_screen_sensitivity is 'Sensibilité du chroma key (0-100, défaut: 50)';
comment on column public.event_settings.green_screen_smoothness is 'Lissage des bords du chroma key (0-100, défaut: 30)';

