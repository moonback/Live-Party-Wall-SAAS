-- Migration pour ajouter le support des vidéos courtes
-- ==========================================

-- Ajouter la colonne 'type' avec valeur par défaut 'photo' pour rétrocompatibilité
alter table public.photos 
add column if not exists type text default 'photo' not null;

-- Ajouter la colonne 'duration' (optionnelle, en secondes)
alter table public.photos 
add column if not exists duration numeric;

-- Créer une contrainte pour s'assurer que type est soit 'photo' soit 'video'
alter table public.photos 
add constraint photos_type_check 
check (type in ('photo', 'video'));

-- Mettre à jour les enregistrements existants pour avoir type = 'photo'
update public.photos 
set type = 'photo' 
where type is null or type = '';

-- Index pour améliorer les performances des requêtes filtrées par type
create index if not exists idx_photos_type on public.photos(type);

-- Commentaires pour documentation
comment on column public.photos.type is 'Type de média: photo ou video';
comment on column public.photos.duration is 'Durée en secondes (pour les vidéos uniquement)';

