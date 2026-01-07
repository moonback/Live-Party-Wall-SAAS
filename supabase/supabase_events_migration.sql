-- ==========================================
-- MIGRATION : TRANSFORMATION EN SAAS MULTI-ÉVÉNEMENTS
-- ==========================================
-- Ce script transforme l'application mono-événement en SaaS multi-événements
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. CRÉATION DE LA TABLE EVENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- Identifiant unique pour l'URL (ex: "mariage-sophie-marc")
    name TEXT NOT NULL, -- Nom de l'événement
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Organisateur principal
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Index pour events
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);

-- Activer RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CRÉATION DE LA TABLE EVENT_ORGANIZERS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.event_organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'organizer', -- 'owner', 'organizer', 'viewer'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id),
    CHECK (role IN ('owner', 'organizer', 'viewer'))
);

-- Index pour event_organizers
CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON public.event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_user_id ON public.event_organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_role ON public.event_organizers(role);

-- Activer RLS
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. AJOUT DE EVENT_ID À TOUTES LES TABLES
-- ==========================================

-- Table photos
ALTER TABLE public.photos
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);

-- Table event_settings (transformation de singleton à table normale)
ALTER TABLE public.event_settings
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Supprimer la contrainte d'unicité sur id si elle existe (on ne veut plus que ce soit un singleton)
-- On garde id comme PRIMARY KEY mais on permet plusieurs lignes
ALTER TABLE public.event_settings
    DROP CONSTRAINT IF EXISTS event_settings_id_key;

CREATE INDEX IF NOT EXISTS idx_event_settings_event_id ON public.event_settings(event_id);

-- Table guests
ALTER TABLE public.guests
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON public.guests(event_id);

-- Table blocked_guests
ALTER TABLE public.blocked_guests
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_blocked_guests_event_id ON public.blocked_guests(event_id);

-- Table photo_battles
ALTER TABLE public.photo_battles
    ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_photo_battles_event_id ON public.photo_battles(event_id);

-- ==========================================
-- 4. CRÉATION D'UN ÉVÉNEMENT PAR DÉFAUT
-- ==========================================

-- Créer un événement par défaut pour migrer les données existantes
-- Note: owner_id sera NULL pour l'événement par défaut (sera mis à jour lors de la migration des données)
DO $$
DECLARE
    default_event_id UUID;
BEGIN
    -- Créer l'événement par défaut s'il n'existe pas
    INSERT INTO public.events (slug, name, description, is_active)
    VALUES ('default', 'Événement par défaut', 'Événement créé automatiquement lors de la migration', true)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO default_event_id;

    -- Si l'événement existe déjà, récupérer son ID
    IF default_event_id IS NULL THEN
        SELECT id INTO default_event_id FROM public.events WHERE slug = 'default';
    END IF;

    -- Mettre à jour toutes les tables existantes avec l'event_id par défaut
    -- (seulement si event_id est NULL pour éviter d'écraser des données déjà migrées)
    
    UPDATE public.photos
    SET event_id = default_event_id
    WHERE event_id IS NULL;

    UPDATE public.event_settings
    SET event_id = default_event_id
    WHERE event_id IS NULL;

    UPDATE public.guests
    SET event_id = default_event_id
    WHERE event_id IS NULL;

    UPDATE public.blocked_guests
    SET event_id = default_event_id
    WHERE event_id IS NULL;

    UPDATE public.photo_battles
    SET event_id = default_event_id
    WHERE event_id IS NULL;
END $$;

-- ==========================================
-- 5. RENDRE EVENT_ID OBLIGATOIRE (après migration)
-- ==========================================

-- Une fois les données migrées, on peut rendre event_id NOT NULL
-- (On le fait dans une étape séparée pour éviter les erreurs si des données existent)

-- Note: Ces ALTER TABLE seront exécutés seulement si toutes les données ont été migrées
-- Décommentez ces lignes après avoir vérifié que toutes les données ont event_id

-- ALTER TABLE public.photos
--     ALTER COLUMN event_id SET NOT NULL;

-- ALTER TABLE public.event_settings
--     ALTER COLUMN event_id SET NOT NULL;

-- ALTER TABLE public.guests
--     ALTER COLUMN event_id SET NOT NULL;

-- ALTER TABLE public.blocked_guests
--     ALTER COLUMN event_id SET NOT NULL;

-- ALTER TABLE public.photo_battles
--     ALTER COLUMN event_id SET NOT NULL;

-- ==========================================
-- 6. POLITIQUES RLS POUR EVENTS
-- ==========================================

-- Les invités peuvent lire les événements actifs
DROP POLICY IF EXISTS "Public Read Active Events" ON public.events;
CREATE POLICY "Public Read Active Events"
ON public.events FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Les organisateurs peuvent créer des événements
DROP POLICY IF EXISTS "Authenticated Create Events" ON public.events;
CREATE POLICY "Authenticated Create Events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Les organisateurs peuvent modifier leurs événements
DROP POLICY IF EXISTS "Organizers Update Events" ON public.events;
CREATE POLICY "Organizers Update Events"
ON public.events FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.event_organizers 
        WHERE event_id = events.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'organizer')
    )
);

-- Seuls les owners peuvent supprimer
DROP POLICY IF EXISTS "Owners Delete Events" ON public.events;
CREATE POLICY "Owners Delete Events"
ON public.events FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ==========================================
-- 7. POLITIQUES RLS POUR EVENT_ORGANIZERS
-- ==========================================

-- Les organisateurs peuvent lire les organisateurs de leurs événements
DROP POLICY IF EXISTS "Organizers Read Event Organizers" ON public.event_organizers;
CREATE POLICY "Organizers Read Event Organizers"
ON public.event_organizers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_organizers.event_id
        AND (events.owner_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.event_organizers eo
            WHERE eo.event_id = events.id
            AND eo.user_id = auth.uid()
        ))
    )
);

-- Les owners peuvent ajouter des organisateurs
DROP POLICY IF EXISTS "Owners Insert Event Organizers" ON public.event_organizers;
CREATE POLICY "Owners Insert Event Organizers"
ON public.event_organizers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_organizers.event_id
        AND events.owner_id = auth.uid()
    )
);

-- Les owners peuvent modifier les organisateurs
DROP POLICY IF EXISTS "Owners Update Event Organizers" ON public.event_organizers;
CREATE POLICY "Owners Update Event Organizers"
ON public.event_organizers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_organizers.event_id
        AND events.owner_id = auth.uid()
    )
);

-- Les owners peuvent supprimer des organisateurs
DROP POLICY IF EXISTS "Owners Delete Event Organizers" ON public.event_organizers;
CREATE POLICY "Owners Delete Event Organizers"
ON public.event_organizers FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_organizers.event_id
        AND events.owner_id = auth.uid()
    )
);

-- ==========================================
-- 8. MISE À JOUR DES POLITIQUES RLS EXISTANTES
-- ==========================================

-- Les politiques existantes doivent être mises à jour pour filtrer par event_id
-- On va créer de nouvelles politiques qui remplacent les anciennes

-- Photos : Lecture publique mais filtrée par événement
DROP POLICY IF EXISTS "Public Read Photos By Event" ON public.photos;
CREATE POLICY "Public Read Photos By Event"
ON public.photos FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.is_active = true)
);

-- Photos : Insertion publique mais avec event_id
DROP POLICY IF EXISTS "Public Insert Photos By Event" ON public.photos;
CREATE POLICY "Public Insert Photos By Event"
ON public.photos FOR INSERT
TO anon, authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.is_active = true)
);

-- Photos : Suppression par organisateurs seulement
DROP POLICY IF EXISTS "Organizers Delete Photos" ON public.photos;
CREATE POLICY "Organizers Delete Photos"
ON public.photos FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = photos.event_id
        AND (
            events.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.event_organizers
                WHERE event_organizers.event_id = events.id
                AND event_organizers.user_id = auth.uid()
                AND event_organizers.role IN ('owner', 'organizer')
            )
        )
    )
);

-- Event Settings : Lecture publique mais filtrée par événement
DROP POLICY IF EXISTS "Public Read Settings By Event" ON public.event_settings;
CREATE POLICY "Public Read Settings By Event"
ON public.event_settings FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_settings.event_id AND events.is_active = true)
);

-- Event Settings : Mise à jour par organisateurs
DROP POLICY IF EXISTS "Organizers Update Settings By Event" ON public.event_settings;
CREATE POLICY "Organizers Update Settings By Event"
ON public.event_settings FOR UPDATE
TO authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_settings.event_id
        AND (
            events.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.event_organizers
                WHERE event_organizers.event_id = events.id
                AND event_organizers.user_id = auth.uid()
                AND event_organizers.role IN ('owner', 'organizer')
            )
        )
    )
);

-- Event Settings : Insertion par organisateurs
DROP POLICY IF EXISTS "Organizers Insert Settings By Event" ON public.event_settings;
CREATE POLICY "Organizers Insert Settings By Event"
ON public.event_settings FOR INSERT
TO authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_settings.event_id
        AND (
            events.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.event_organizers
                WHERE event_organizers.event_id = events.id
                AND event_organizers.user_id = auth.uid()
                AND event_organizers.role IN ('owner', 'organizer')
            )
        )
    )
);

-- Guests : Lecture publique mais filtrée par événement
DROP POLICY IF EXISTS "Public Read Guests By Event" ON public.guests;
CREATE POLICY "Public Read Guests By Event"
ON public.guests FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.is_active = true)
);

-- Guests : Insertion publique mais avec event_id
DROP POLICY IF EXISTS "Public Insert Guests By Event" ON public.guests;
CREATE POLICY "Public Insert Guests By Event"
ON public.guests FOR INSERT
TO anon, authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.is_active = true)
);

-- Blocked Guests : Lecture publique mais filtrée par événement
DROP POLICY IF EXISTS "Public Read Blocked Guests By Event" ON public.blocked_guests;
CREATE POLICY "Public Read Blocked Guests By Event"
ON public.blocked_guests FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = blocked_guests.event_id AND events.is_active = true)
);

-- Blocked Guests : Insertion par organisateurs
DROP POLICY IF EXISTS "Organizers Insert Blocked Guests By Event" ON public.blocked_guests;
CREATE POLICY "Organizers Insert Blocked Guests By Event"
ON public.blocked_guests FOR INSERT
TO authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = blocked_guests.event_id
        AND (
            events.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.event_organizers
                WHERE event_organizers.event_id = events.id
                AND event_organizers.user_id = auth.uid()
                AND event_organizers.role IN ('owner', 'organizer')
            )
        )
    )
);

-- Photo Battles : Lecture publique mais filtrée par événement
DROP POLICY IF EXISTS "Public Read Battles By Event" ON public.photo_battles;
CREATE POLICY "Public Read Battles By Event"
ON public.photo_battles FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = photo_battles.event_id AND events.is_active = true)
);

-- Photo Battles : Insertion publique mais avec event_id
DROP POLICY IF EXISTS "Public Insert Battles By Event" ON public.photo_battles;
CREATE POLICY "Public Insert Battles By Event"
ON public.photo_battles FOR INSERT
TO anon, authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.events WHERE events.id = photo_battles.event_id AND events.is_active = true)
);

-- ==========================================
-- 9. REALTIME POUR EVENTS
-- ==========================================

-- Activer Realtime pour events
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Activer Realtime pour event_organizers
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_organizers;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 10. FONCTION HELPER POUR VÉRIFIER LES PERMISSIONS
-- ==========================================

-- Fonction pour vérifier si un utilisateur est organisateur d'un événement
CREATE OR REPLACE FUNCTION is_event_organizer(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_uuid
        AND (
            events.owner_id = user_uuid OR
            EXISTS (
                SELECT 1 FROM public.event_organizers
                WHERE event_organizers.event_id = events.id
                AND event_organizers.user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FIN DE LA MIGRATION
-- ==========================================
-- 
-- Cette migration transforme l'application en SaaS multi-événements.
-- 
-- Prochaines étapes :
-- 1. Vérifier que toutes les données ont été migrées (event_id non NULL)
-- 2. Décommenter les ALTER TABLE pour rendre event_id NOT NULL
-- 3. Mettre à jour les services TypeScript pour utiliser event_id
-- 4. Mettre à jour les contextes React pour gérer l'événement actuel
-- 
-- ==========================================

