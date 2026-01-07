-- Activation des extensions nécessaires
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLE PHOTOS
-- ==========================================

create table if not exists public.photos (
    id uuid default gen_random_uuid() primary key,
    url text not null,
    caption text,
    author text,
    created_at timestamptz default now()
);

-- Activer la sécurité niveau ligne (RLS)
alter table public.photos enable row level security;

-- Créer les politiques de sécurité (Policies)
-- Tout le monde peut voir les photos (pour le Mur)
create policy "Public Read Photos"
on public.photos for select
to anon, authenticated
using (true);

-- Tout le monde peut poster (Invités)
create policy "Public Insert Photos"
on public.photos for insert
to anon, authenticated
with check (true);

-- ==========================================
-- 2. STORAGE BUCKET
-- ==========================================

-- Création du bucket 'party-photos' s'il n'existe pas
insert into storage.buckets (id, name, public)
values ('party-photos', 'party-photos', true)
on conflict (id) do nothing;

-- Création du bucket 'party-frames' (cadres décoratifs) s'il n'existe pas
insert into storage.buckets (id, name, public)
values ('party-frames', 'party-frames', true)
on conflict (id) do nothing;

-- Politiques pour le Storage
-- Tout le monde peut voir les images
create policy "Public Access Bucket"
on storage.objects for select
to anon, authenticated
using ( bucket_id = 'party-photos' );

-- Tout le monde peut voir les cadres
drop policy if exists "Public Access Frames Bucket" on storage.objects;
create policy "Public Access Frames Bucket"
on storage.objects for select
to anon, authenticated
using ( bucket_id = 'party-frames' );

-- Tout le monde peut uploader des images
create policy "Public Upload Bucket"
on storage.objects for insert
to anon, authenticated
with check ( bucket_id = 'party-photos' );

-- Seuls les utilisateurs authentifiés peuvent uploader des cadres (admin)
drop policy if exists "Admin Upload Frames Bucket" on storage.objects;
create policy "Admin Upload Frames Bucket"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'party-frames' );

-- Policy UPDATE pour upsert (quand fichier existe déjà)
drop policy if exists "Admin Update Frames Bucket" on storage.objects;
create policy "Admin Update Frames Bucket"
on storage.objects for update
to authenticated
using ( bucket_id = 'party-frames' )
with check ( bucket_id = 'party-frames' );

-- Policy DELETE pour supprimer les cadres
drop policy if exists "Admin Delete Frames Bucket" on storage.objects;
create policy "Admin Delete Frames Bucket"
on storage.objects for delete
to authenticated
using ( bucket_id = 'party-frames' );

-- ==========================================
-- 3. REALTIME
-- ==========================================

-- Activer la publication des événements pour le temps réel
alter publication supabase_realtime add table public.photos;
