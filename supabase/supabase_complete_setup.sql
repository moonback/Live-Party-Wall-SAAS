-- ==========================================
-- LIVE PARTY WALL - SETUP COMPLET SUPABASE
-- ==========================================
-- Ce fichier contient toutes les migrations nécessaires
-- pour initialiser complètement la base de données Supabase
-- pour l'application Live Party Wall.
--
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABLE PHOTOS (Base)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    caption TEXT,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    type TEXT DEFAULT 'photo' NOT NULL,
    duration NUMERIC,
    likes_count INTEGER DEFAULT 0
);

-- Contrainte pour le type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'photos_type_check' 
        AND conrelid = 'public.photos'::regclass
    ) THEN
        ALTER TABLE public.photos
            ADD CONSTRAINT photos_type_check 
            CHECK (type IN ('photo', 'video'));
    END IF;
END $$;

-- Activer RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour photos
DROP POLICY IF EXISTS "Public Read Photos" ON public.photos;
CREATE POLICY "Public Read Photos"
ON public.photos FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Photos" ON public.photos;
CREATE POLICY "Public Insert Photos"
ON public.photos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Delete Photos" ON public.photos;
CREATE POLICY "Admin Delete Photos"
ON public.photos FOR DELETE
TO authenticated
USING (true);

-- Index pour photos
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_type ON public.photos(type);
CREATE INDEX IF NOT EXISTS idx_photos_author ON public.photos(author);

-- ==========================================
-- 3. STORAGE BUCKETS
-- ==========================================

-- Bucket party-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-photos', 'party-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket party-frames
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-frames', 'party-frames', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket party-avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-avatars', 'party-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques Storage pour party-photos
DROP POLICY IF EXISTS "Public Access Bucket" ON storage.objects;
CREATE POLICY "Public Access Bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'party-photos');

DROP POLICY IF EXISTS "Public Upload Bucket" ON storage.objects;
CREATE POLICY "Public Upload Bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'party-photos');

DROP POLICY IF EXISTS "Admin Delete Storage" ON storage.objects;
CREATE POLICY "Admin Delete Storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'party-photos');

-- Politiques Storage pour party-frames
DROP POLICY IF EXISTS "Public Access Frames Bucket" ON storage.objects;
CREATE POLICY "Public Access Frames Bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'party-frames');

DROP POLICY IF EXISTS "Admin Upload Frames Bucket" ON storage.objects;
CREATE POLICY "Admin Upload Frames Bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'party-frames' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Update Frames Bucket" ON storage.objects;
CREATE POLICY "Admin Update Frames Bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'party-frames' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'party-frames' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Delete Frames Bucket" ON storage.objects;
CREATE POLICY "Admin Delete Frames Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'party-frames' AND auth.role() = 'authenticated');

-- Politiques Storage pour party-avatars
DROP POLICY IF EXISTS "Public Access Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Access Avatars Bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'party-avatars');

DROP POLICY IF EXISTS "Public Upload Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Upload Avatars Bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'party-avatars');

DROP POLICY IF EXISTS "Public Update Avatars Bucket" ON storage.objects;
CREATE POLICY "Public Update Avatars Bucket"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'party-avatars')
WITH CHECK (bucket_id = 'party-avatars');

DROP POLICY IF EXISTS "Authenticated Delete Avatars Bucket" ON storage.objects;
CREATE POLICY "Authenticated Delete Avatars Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'party-avatars');

-- ==========================================
-- 4. TABLE EVENT_SETTINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.event_settings (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    event_title TEXT NOT NULL DEFAULT 'Party Wall',
    event_subtitle TEXT NOT NULL DEFAULT 'Live',
    scroll_speed TEXT NOT NULL DEFAULT 'normal',
    slide_transition TEXT NOT NULL DEFAULT 'fade',
    decorative_frame_enabled BOOLEAN NOT NULL DEFAULT false,
    decorative_frame_url TEXT,
    caption_generation_enabled BOOLEAN NOT NULL DEFAULT true,
    content_moderation_enabled BOOLEAN NOT NULL DEFAULT true,
    video_capture_enabled BOOLEAN NOT NULL DEFAULT true,
    collage_mode_enabled BOOLEAN NOT NULL DEFAULT true,
    stats_enabled BOOLEAN NOT NULL DEFAULT true,
    find_me_enabled BOOLEAN NOT NULL DEFAULT true,
    ar_scene_enabled BOOLEAN NOT NULL DEFAULT true,
    battle_mode_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_battles_enabled BOOLEAN NOT NULL DEFAULT false,
    event_context TEXT,
    alert_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer qu'il y a au moins une ligne (ID 1)
INSERT INTO public.event_settings (
    id, event_title, event_subtitle, scroll_speed, slide_transition,
    decorative_frame_enabled, decorative_frame_url, caption_generation_enabled,
    content_moderation_enabled, video_capture_enabled, collage_mode_enabled,
    stats_enabled, find_me_enabled, ar_scene_enabled, battle_mode_enabled,
    auto_battles_enabled, event_context, alert_text
)
SELECT 
    1, 'Party Wall', 'Live', 'normal', 'fade',
    false, null, true, true, true, true,
    true, true, true, true, false,
    null, null
WHERE NOT EXISTS (SELECT 1 FROM public.event_settings WHERE id = 1);

-- Activer RLS
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour event_settings
DROP POLICY IF EXISTS "Public settings access" ON public.event_settings;
CREATE POLICY "Public settings access" ON public.event_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update settings" ON public.event_settings;
CREATE POLICY "Admin update settings" ON public.event_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin insert settings" ON public.event_settings;
CREATE POLICY "Admin insert settings" ON public.event_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Commentaires pour documentation
COMMENT ON COLUMN public.event_settings.battle_mode_enabled IS 'Active ou désactive le mode battle (création et affichage des battles entre photos)';
COMMENT ON COLUMN public.event_settings.stats_enabled IS 'Active ou désactive la page de statistiques et le lien d''accès sur la page d''accueil';
COMMENT ON COLUMN public.event_settings.collage_mode_enabled IS 'Active ou désactive la fonctionnalité de mode collage pour les utilisateurs';
COMMENT ON COLUMN public.event_settings.video_capture_enabled IS 'Active ou désactive la fonctionnalité de capture vidéo pour les utilisateurs';
COMMENT ON COLUMN public.event_settings.event_context IS 'Contexte de la soirée/événement utilisé pour personnaliser les légendes générées par IA';
COMMENT ON COLUMN public.event_settings.alert_text IS 'Texte d''alerte affiché en grand au-dessus des photos sur le mur pour signaler quelque chose aux invités';

-- ==========================================
-- 5. TABLE LIKES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(photo_id, user_identifier)
);

-- Activer RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Politiques pour likes
DROP POLICY IF EXISTS "Public Read Likes" ON public.likes;
CREATE POLICY "Public Read Likes"
ON public.likes FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Likes" ON public.likes;
CREATE POLICY "Public Insert Likes"
ON public.likes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Delete Likes" ON public.likes;
CREATE POLICY "Public Delete Likes"
ON public.likes FOR DELETE
TO anon, authenticated
USING (true);

-- Index pour likes
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON public.likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_identifier ON public.likes(user_identifier);
CREATE INDEX IF NOT EXISTS idx_likes_photo_user ON public.likes(photo_id, user_identifier);

-- ==========================================
-- 6. TABLE REACTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(photo_id, user_identifier)
);

-- Activer RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Politiques pour reactions
DROP POLICY IF EXISTS "Public Read Reactions" ON public.reactions;
CREATE POLICY "Public Read Reactions"
ON public.reactions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Reactions" ON public.reactions;
CREATE POLICY "Public Insert Reactions"
ON public.reactions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Reactions" ON public.reactions;
CREATE POLICY "Public Update Reactions"
ON public.reactions FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Delete Reactions" ON public.reactions;
CREATE POLICY "Public Delete Reactions"
ON public.reactions FOR DELETE
TO anon, authenticated
USING (true);

-- Index pour reactions
CREATE INDEX IF NOT EXISTS idx_reactions_photo_id ON public.reactions(photo_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_identifier ON public.reactions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_reactions_photo_user ON public.reactions(photo_id, user_identifier);

-- ==========================================
-- 7. TABLE GUESTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activer RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Politiques pour guests
DROP POLICY IF EXISTS "Public Read Guests" ON public.guests;
CREATE POLICY "Public Read Guests"
ON public.guests FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Guests" ON public.guests;
CREATE POLICY "Public Insert Guests"
ON public.guests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Guests" ON public.guests;
CREATE POLICY "Authenticated Update Guests"
ON public.guests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Delete Guests" ON public.guests;
CREATE POLICY "Authenticated Delete Guests"
ON public.guests FOR DELETE
TO authenticated
USING (true);

-- Index pour guests
CREATE INDEX IF NOT EXISTS idx_guests_name ON public.guests(name);
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON public.guests(created_at);

-- ==========================================
-- 8. TABLE BLOCKED_GUESTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.blocked_guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    blocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activer RLS
ALTER TABLE public.blocked_guests ENABLE ROW LEVEL SECURITY;

-- Politiques pour blocked_guests
DROP POLICY IF EXISTS "Public Read Blocked Guests" ON public.blocked_guests;
CREATE POLICY "Public Read Blocked Guests"
ON public.blocked_guests FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Blocked Guests" ON public.blocked_guests;
CREATE POLICY "Authenticated Insert Blocked Guests"
ON public.blocked_guests FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Delete Blocked Guests" ON public.blocked_guests;
CREATE POLICY "Authenticated Delete Blocked Guests"
ON public.blocked_guests FOR DELETE
TO authenticated
USING (true);

-- Index pour blocked_guests
CREATE INDEX IF NOT EXISTS idx_blocked_guests_name ON public.blocked_guests(name);
CREATE INDEX IF NOT EXISTS idx_blocked_guests_expires_at ON public.blocked_guests(expires_at);

-- ==========================================
-- 9. TABLE PHOTO_BATTLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.photo_battles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo1_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    photo2_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    winner_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
    votes1_count INTEGER NOT NULL DEFAULT 0,
    votes2_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    CHECK (photo1_id != photo2_id),
    CHECK (status IN ('active', 'finished', 'cancelled'))
);

-- Table battle_votes
CREATE TABLE IF NOT EXISTS public.battle_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id UUID REFERENCES public.photo_battles(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL,
    voted_for_photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(battle_id, user_identifier)
);

-- Activer RLS
ALTER TABLE public.photo_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;

-- Politiques pour photo_battles
DROP POLICY IF EXISTS "Public Read Battles" ON public.photo_battles;
CREATE POLICY "Public Read Battles"
ON public.photo_battles FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Battles" ON public.photo_battles;
CREATE POLICY "Public Insert Battles"
ON public.photo_battles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Battles" ON public.photo_battles;
CREATE POLICY "Public Update Battles"
ON public.photo_battles FOR UPDATE
TO anon, authenticated
USING (true);

-- Politiques pour battle_votes
DROP POLICY IF EXISTS "Public Read Battle Votes" ON public.battle_votes;
CREATE POLICY "Public Read Battle Votes"
ON public.battle_votes FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Battle Votes" ON public.battle_votes;
CREATE POLICY "Public Insert Battle Votes"
ON public.battle_votes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Index pour battles
CREATE INDEX IF NOT EXISTS idx_battles_status ON public.photo_battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON public.photo_battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_expires_at ON public.photo_battles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_id ON public.battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_user_identifier ON public.battle_votes(user_identifier);
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_user ON public.battle_votes(battle_id, user_identifier);

-- ==========================================
-- 10. TRIGGERS ET FONCTIONS
-- ==========================================

-- Fonction pour mettre à jour updated_at sur reactions
CREATE OR REPLACE FUNCTION update_reactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reactions_updated_at_trigger ON public.reactions;
CREATE TRIGGER reactions_updated_at_trigger
BEFORE UPDATE ON public.reactions
FOR EACH ROW
EXECUTE FUNCTION update_reactions_updated_at();

-- Fonction pour compter les réactions par type
CREATE OR REPLACE FUNCTION get_photo_reactions(photo_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_object_agg(
            reaction_type,
            count
        )
        FROM (
            SELECT 
                reaction_type,
                count(*)::int AS count
            FROM public.reactions
            WHERE photo_id = photo_uuid
            GROUP BY reaction_type
        ) AS counts
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour mettre à jour likes_count
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.photos 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.photos 
        SET likes_count = GREATEST(0, likes_count - 1) 
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS likes_count_trigger ON public.likes;
CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION update_photo_likes_count();

-- Fonction trigger pour mettre à jour battle votes count
CREATE OR REPLACE FUNCTION update_battle_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.voted_for_photo_id = (
            SELECT photo1_id FROM public.photo_battles WHERE id = NEW.battle_id
        ) THEN
            UPDATE public.photo_battles
            SET votes1_count = votes1_count + 1
            WHERE id = NEW.battle_id;
        ELSIF NEW.voted_for_photo_id = (
            SELECT photo2_id FROM public.photo_battles WHERE id = NEW.battle_id
        ) THEN
            UPDATE public.photo_battles
            SET votes2_count = votes2_count + 1
            WHERE id = NEW.battle_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.voted_for_photo_id = (
            SELECT photo1_id FROM public.photo_battles WHERE id = OLD.battle_id
        ) THEN
            UPDATE public.photo_battles
            SET votes1_count = GREATEST(0, votes1_count - 1)
            WHERE id = OLD.battle_id;
        ELSIF OLD.voted_for_photo_id = (
            SELECT photo2_id FROM public.photo_battles WHERE id = OLD.battle_id
        ) THEN
            UPDATE public.photo_battles
            SET votes2_count = GREATEST(0, votes2_count - 1)
            WHERE id = OLD.battle_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS battle_votes_count_trigger ON public.battle_votes;
CREATE TRIGGER battle_votes_count_trigger
AFTER INSERT OR DELETE ON public.battle_votes
FOR EACH ROW
EXECUTE FUNCTION update_battle_votes_count();

-- Fonction pour terminer automatiquement une battle expirée
CREATE OR REPLACE FUNCTION finish_battle_if_expired()
RETURNS void AS $$
BEGIN
    UPDATE public.photo_battles
    SET 
        status = 'finished',
        winner_id = CASE
            WHEN votes1_count > votes2_count THEN photo1_id
            WHEN votes2_count > votes1_count THEN photo2_id
            ELSE NULL
        END,
        finished_at = now()
    WHERE 
        status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les blocages expirés
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS void AS $$
BEGIN
    DELETE FROM public.blocked_guests
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Synchronisation initiale du compteur likes_count
UPDATE public.photos p
SET likes_count = (
    SELECT COUNT(*) 
    FROM public.likes l 
    WHERE l.photo_id = p.id
);

-- ==========================================
-- 11. REALTIME PUBLICATIONS
-- ==========================================

-- Activer Realtime pour toutes les tables nécessaires
DO $$
BEGIN
    -- Photos
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Likes
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Reactions
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Guests
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Photo Battles
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_battles;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Battle Votes
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_votes;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Event Settings
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ==========================================
-- FIN DU SETUP
-- ==========================================
-- 
-- Le setup est maintenant complet. Toutes les tables,
-- politiques, triggers et fonctions sont en place.
--
-- Pour créer un utilisateur admin :
-- 1. Allez dans Supabase Dashboard > Authentication > Users
-- 2. Cliquez sur "Invite user" ou créez un utilisateur manuellement
-- 3. Utilisez ces identifiants pour vous connecter sur /?mode=admin
-- 4. (Optionnel) Désactivez l'inscription publique dans Authentication > Settings
--
-- ==========================================

