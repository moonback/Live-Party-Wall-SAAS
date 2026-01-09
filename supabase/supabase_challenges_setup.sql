-- ==========================================
-- GESTION DES CHALLENGES ET DÉFIS PHOTO
-- ==========================================
-- Ce script crée les tables pour gérer les défis photo
-- Défis horaires : "Meilleure photo de groupe dans les 30 prochaines minutes"
-- Thèmes imposés : "Photo la plus créative avec le thème 'Anniversaire'"
-- Vote communautaire : Les invités votent pour le gagnant du défi
-- Récompenses : Badges spéciaux pour les gagnants

-- Créer la table des challenges
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'theme', -- 'time_based' (défi horaire) ou 'theme' (thème imposé)
    theme TEXT, -- Thème du défi (ex: 'Anniversaire', 'Groupe', 'Danse')
    start_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    end_at TIMESTAMPTZ NOT NULL, -- Date de fin du défi
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'voting', 'finished', 'cancelled'
    winner_photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL, -- Photo gagnante (null si pas encore déterminée)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (type IN ('time_based', 'theme')),
    CHECK (status IN ('active', 'voting', 'finished', 'cancelled')),
    CHECK (end_at > start_at)
);

-- Créer la table des soumissions (photos soumises au défi)
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    submitted_by TEXT NOT NULL, -- Nom de l'auteur qui a soumis la photo
    submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    votes_count INTEGER NOT NULL DEFAULT 0, -- Compteur de votes pour cette soumission
    UNIQUE(challenge_id, photo_id) -- Une photo ne peut être soumise qu'une fois par défi
);

-- Créer la table des votes pour les challenges
CREATE TABLE IF NOT EXISTS public.challenge_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    submission_id UUID REFERENCES public.challenge_submissions(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL, -- ID unique généré côté client (localStorage)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(challenge_id, user_identifier) -- Un utilisateur ne peut voter qu'une fois par challenge
);

-- Activer RLS pour challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Politiques pour challenges
DROP POLICY IF EXISTS "Public Read Challenges" ON public.challenges;
CREATE POLICY "Public Read Challenges"
ON public.challenges FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Challenges" ON public.challenges;
CREATE POLICY "Public Insert Challenges"
ON public.challenges FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Challenges" ON public.challenges;
CREATE POLICY "Public Update Challenges"
ON public.challenges FOR UPDATE
TO anon, authenticated
USING (true);

-- Activer RLS pour challenge_submissions
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour challenge_submissions
DROP POLICY IF EXISTS "Public Read Challenge Submissions" ON public.challenge_submissions;
CREATE POLICY "Public Read Challenge Submissions"
ON public.challenge_submissions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Challenge Submissions" ON public.challenge_submissions;
CREATE POLICY "Public Insert Challenge Submissions"
ON public.challenge_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Challenge Submissions" ON public.challenge_submissions;
CREATE POLICY "Public Update Challenge Submissions"
ON public.challenge_submissions FOR UPDATE
TO anon, authenticated
USING (true);

-- Activer RLS pour challenge_votes
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

-- Politiques pour challenge_votes
DROP POLICY IF EXISTS "Public Read Challenge Votes" ON public.challenge_votes;
CREATE POLICY "Public Read Challenge Votes"
ON public.challenge_votes FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public Insert Challenge Votes" ON public.challenge_votes;
CREATE POLICY "Public Insert Challenge Votes"
ON public.challenge_votes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Trigger pour mettre à jour les compteurs de votes automatiquement
CREATE OR REPLACE FUNCTION update_challenge_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF tg_op = 'INSERT' THEN
        -- Incrémenter le compteur de votes pour la soumission
        UPDATE public.challenge_submissions
        SET votes_count = votes_count + 1
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF tg_op = 'DELETE' THEN
        -- Décrémenter le compteur de votes pour la soumission
        UPDATE public.challenge_submissions
        SET votes_count = GREATEST(0, votes_count - 1)
        WHERE id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS challenge_votes_count_trigger ON public.challenge_votes;
CREATE TRIGGER challenge_votes_count_trigger
AFTER INSERT OR DELETE ON public.challenge_votes
FOR EACH ROW
EXECUTE FUNCTION update_challenge_votes_count();

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS challenges_updated_at_trigger ON public.challenges;
CREATE TRIGGER challenges_updated_at_trigger
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION update_challenges_updated_at();

-- Fonction pour terminer automatiquement un challenge et déterminer le gagnant
-- Cette fonction est appelable via RPC depuis le client
CREATE OR REPLACE FUNCTION public.finish_challenge_if_expired()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    challenge_record RECORD;
    winner_submission RECORD;
BEGIN
    -- Trouver les challenges actifs qui sont expirés
    FOR challenge_record IN
        SELECT id, status
        FROM public.challenges
        WHERE status IN ('active', 'voting')
        AND end_at < now()
    LOOP
        -- Trouver la soumission avec le plus de votes
        SELECT * INTO winner_submission
        FROM public.challenge_submissions
        WHERE challenge_id = challenge_record.id
        ORDER BY votes_count DESC, submitted_at ASC
        LIMIT 1;
        
        -- Mettre à jour le challenge
        UPDATE public.challenges
        SET 
            status = 'finished',
            winner_photo_id = CASE
                WHEN winner_submission IS NOT NULL THEN winner_submission.photo_id
                ELSE NULL
            END,
            updated_at = now()
        WHERE id = challenge_record.id;
    END LOOP;
END;
$$;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_challenges_event_id ON public.challenges(event_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON public.challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_start_at ON public.challenges(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_end_at ON public.challenges(end_at) WHERE end_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_photo_id ON public.challenge_submissions(photo_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_votes_count ON public.challenge_submissions(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge_id ON public.challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_submission_id ON public.challenge_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_user_identifier ON public.challenge_votes(user_identifier);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge_user ON public.challenge_votes(challenge_id, user_identifier);

-- Activer Realtime pour les mises à jour de challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_votes;

