-- ==========================================
-- GESTION DES RÉACTIONS EMOJI
-- ==========================================
-- Ce script crée une table pour gérer les réactions avec emojis
-- (rire, pleure, cœur, feu, etc.) au lieu du simple système de likes

-- Créer la table de réactions
create table if not exists public.reactions (
    id uuid default gen_random_uuid() primary key,
    photo_id uuid references public.photos(id) on delete cascade not null,
    user_identifier text not null, -- ID unique généré côté client (localStorage)
    reaction_type text not null, -- 'heart', 'laugh', 'cry', 'fire', 'wow', 'thumbsup'
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(photo_id, user_identifier) -- Un utilisateur ne peut avoir qu'une réaction par photo
);

-- Activer RLS pour reactions
alter table public.reactions enable row level security;

-- Politiques pour reactions
create policy "Public Read Reactions"
on public.reactions for select
to anon, authenticated
using (true);

create policy "Public Insert Reactions"
on public.reactions for insert
to anon, authenticated
with check (true);

create policy "Public Update Reactions"
on public.reactions for update
to anon, authenticated
using (true);

create policy "Public Delete Reactions"
on public.reactions for delete
to anon, authenticated
using (true);

-- Trigger pour mettre à jour updated_at automatiquement
create or replace function update_reactions_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger reactions_updated_at_trigger
before update on public.reactions
for each row
execute function update_reactions_updated_at();

-- Fonction pour compter les réactions par type pour une photo
create or replace function get_photo_reactions(photo_uuid uuid)
returns jsonb as $$
begin
    return (
        select jsonb_object_agg(
            reaction_type,
            count
        )
        from (
            select 
                reaction_type,
                count(*)::int as count
            from public.reactions
            where photo_id = photo_uuid
            group by reaction_type
        ) as counts
    );
end;
$$ language plpgsql;

-- Index pour optimiser les requêtes
create index if not exists idx_reactions_photo_id on public.reactions(photo_id);
create index if not exists idx_reactions_user_identifier on public.reactions(user_identifier);
create index if not exists idx_reactions_photo_user on public.reactions(photo_id, user_identifier);

-- Activer Realtime pour les mises à jour de réactions
alter publication supabase_realtime add table public.reactions;

