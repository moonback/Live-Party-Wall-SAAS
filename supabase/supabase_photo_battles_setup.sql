-- ==========================================
-- GESTION DES PHOTO BATTLES
-- ==========================================
-- Ce script crée les tables pour gérer les battles entre photos
-- Deux photos s'affrontent, les invités votent, la gagnante reste

-- Créer la table des battles
create table if not exists public.photo_battles (
    id uuid default gen_random_uuid() primary key,
    photo1_id uuid references public.photos(id) on delete cascade not null,
    photo2_id uuid references public.photos(id) on delete cascade not null,
    status text not null default 'active', -- 'active', 'finished', 'cancelled'
    winner_id uuid references public.photos(id) on delete set null, -- Photo gagnante (null si pas encore terminée)
    votes1_count integer not null default 0, -- Compteur de votes pour photo1 (NOT NULL pour garantir 0)
    votes2_count integer not null default 0, -- Compteur de votes pour photo2 (NOT NULL pour garantir 0)
    created_at timestamptz default now(),
    finished_at timestamptz, -- Date de fin de la battle
    expires_at timestamptz, -- Date d'expiration (battle se termine automatiquement)
    check (photo1_id != photo2_id), -- Les deux photos doivent être différentes
    check (status in ('active', 'finished', 'cancelled'))
);

-- S'assurer que les colonnes existantes sont NOT NULL (si la table existe déjà)
alter table public.photo_battles 
  alter column votes1_count set default 0,
  alter column votes2_count set default 0;

-- Mettre à jour les valeurs NULL existantes à 0
update public.photo_battles 
set votes1_count = 0 
where votes1_count is null;

update public.photo_battles 
set votes2_count = 0 
where votes2_count is null;

-- Créer la table des votes pour les battles
create table if not exists public.battle_votes (
    id uuid default gen_random_uuid() primary key,
    battle_id uuid references public.photo_battles(id) on delete cascade not null,
    user_identifier text not null, -- ID unique généré côté client (localStorage)
    voted_for_photo_id uuid references public.photos(id) on delete cascade not null, -- Photo pour laquelle l'utilisateur a voté
    created_at timestamptz default now(),
    unique(battle_id, user_identifier) -- Un utilisateur ne peut voter qu'une fois par battle
);

-- Activer RLS pour photo_battles
alter table public.photo_battles enable row level security;

-- Politiques pour photo_battles
create policy "Public Read Battles"
on public.photo_battles for select
to anon, authenticated
using (true);

create policy "Public Insert Battles"
on public.photo_battles for insert
to anon, authenticated
with check (true);

create policy "Public Update Battles"
on public.photo_battles for update
to anon, authenticated
using (true);

-- Activer RLS pour battle_votes
alter table public.battle_votes enable row level security;

-- Politiques pour battle_votes
create policy "Public Read Battle Votes"
on public.battle_votes for select
to anon, authenticated
using (true);

create policy "Public Insert Battle Votes"
on public.battle_votes for insert
to anon, authenticated
with check (true);

-- Trigger pour mettre à jour les compteurs de votes automatiquement
create or replace function update_battle_votes_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        -- Incrémenter le compteur pour la photo votée
        if new.voted_for_photo_id = (
            select photo1_id from public.photo_battles where id = new.battle_id
        ) then
            update public.photo_battles
            set votes1_count = votes1_count + 1
            where id = new.battle_id;
        elsif new.voted_for_photo_id = (
            select photo2_id from public.photo_battles where id = new.battle_id
        ) then
            update public.photo_battles
            set votes2_count = votes2_count + 1
            where id = new.battle_id;
        end if;
        return new;
    elsif tg_op = 'DELETE' then
        -- Décrémenter le compteur pour la photo votée
        if old.voted_for_photo_id = (
            select photo1_id from public.photo_battles where id = old.battle_id
        ) then
            update public.photo_battles
            set votes1_count = greatest(0, votes1_count - 1)
            where id = old.battle_id;
        elsif old.voted_for_photo_id = (
            select photo2_id from public.photo_battles where id = old.battle_id
        ) then
            update public.photo_battles
            set votes2_count = greatest(0, votes2_count - 1)
            where id = old.battle_id;
        end if;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

create trigger battle_votes_count_trigger
after insert or delete on public.battle_votes
for each row
execute function update_battle_votes_count();

-- Fonction pour terminer automatiquement une battle et déterminer le gagnant
create or replace function finish_battle_if_expired()
returns void as $$
begin
    update public.photo_battles
    set 
        status = 'finished',
        winner_id = case
            when votes1_count > votes2_count then photo1_id
            when votes2_count > votes1_count then photo2_id
            else null -- Égalité, pas de gagnant
        end,
        finished_at = now()
    where 
        status = 'active'
        and expires_at is not null
        and expires_at < now();
end;
$$ language plpgsql;

-- Index pour optimiser les requêtes
create index if not exists idx_battles_status on public.photo_battles(status);
create index if not exists idx_battles_created_at on public.photo_battles(created_at desc);
create index if not exists idx_battles_expires_at on public.photo_battles(expires_at) where expires_at is not null;
create index if not exists idx_battle_votes_battle_id on public.battle_votes(battle_id);
create index if not exists idx_battle_votes_user_identifier on public.battle_votes(user_identifier);
create index if not exists idx_battle_votes_battle_user on public.battle_votes(battle_id, user_identifier);

-- Activer Realtime pour les mises à jour de battles
alter publication supabase_realtime add table public.photo_battles;
alter publication supabase_realtime add table public.battle_votes;

