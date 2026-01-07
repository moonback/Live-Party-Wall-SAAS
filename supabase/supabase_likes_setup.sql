-- ==========================================
-- 4. GESTION DES LIKES
-- ==========================================

-- Ajouter un compteur de likes sur la table photos
alter table public.photos 
add column if not exists likes_count integer default 0;

-- Créer la table de jointure pour les likes (pour éviter les doublons par utilisateur)
create table if not exists public.likes (
    id uuid default gen_random_uuid() primary key,
    photo_id uuid references public.photos(id) on delete cascade not null,
    user_identifier text not null, -- Stockera un ID unique généré côté client (localStorage)
    created_at timestamptz default now(),
    unique(photo_id, user_identifier) -- Un utilisateur ne peut liker qu'une fois une photo
);

-- Activer RLS pour likes
alter table public.likes enable row level security;

-- Politiques pour likes
create policy "Public Read Likes"
on public.likes for select
to anon, authenticated
using (true);

create policy "Public Insert Likes"
on public.likes for insert
to anon, authenticated
with check (true);

create policy "Public Delete Likes"
on public.likes for delete
to anon, authenticated
using (true);

-- Activer Realtime pour les mises à jour de likes sur photos
alter publication supabase_realtime add table public.likes;

