-- ==========================================
-- MIGRATION: Table print_requests
-- ==========================================
-- Table pour gérer les demandes d'impression des invités
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. TABLE PRINT_REQUESTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.print_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    requested_by TEXT NOT NULL, -- Nom de l'invité qui a fait la demande
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'printed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    printed_at TIMESTAMPTZ, -- Date d'impression
    printed_by TEXT -- Nom de l'organisateur qui a imprimé
);

-- Contrainte pour le statut
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'print_requests_status_check' 
        AND conrelid = 'public.print_requests'::regclass
    ) THEN
        ALTER TABLE public.print_requests
            ADD CONSTRAINT print_requests_status_check 
            CHECK (status IN ('pending', 'printed', 'cancelled'));
    END IF;
END $$;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_print_requests_event_id ON public.print_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_photo_id ON public.print_requests(photo_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_status ON public.print_requests(status);
CREATE INDEX IF NOT EXISTS idx_print_requests_created_at ON public.print_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_requests_event_status ON public.print_requests(event_id, status);

-- Activer RLS
ALTER TABLE public.print_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. POLITIQUES RLS
-- ==========================================

-- Lecture : Tous peuvent lire les demandes d'impression des événements actifs
DROP POLICY IF EXISTS "Public Read Print Requests" ON public.print_requests;
CREATE POLICY "Public Read Print Requests"
ON public.print_requests FOR SELECT
TO anon, authenticated
USING (
    event_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = print_requests.event_id 
        AND events.is_active = true
    )
);

-- Insertion : Tous peuvent créer une demande d'impression
DROP POLICY IF EXISTS "Public Insert Print Requests" ON public.print_requests;
CREATE POLICY "Public Insert Print Requests"
ON public.print_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
    event_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = print_requests.event_id 
        AND events.is_active = true
    )
);

-- Mise à jour : Seuls les organisateurs peuvent mettre à jour (changer le statut)
DROP POLICY IF EXISTS "Organizer Update Print Requests" ON public.print_requests;
CREATE POLICY "Organizer Update Print Requests"
ON public.print_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_organizers eo
        WHERE eo.event_id = print_requests.event_id
        AND eo.user_id = auth.uid()
        AND eo.role IN ('owner', 'organizer')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_organizers eo
        WHERE eo.event_id = print_requests.event_id
        AND eo.user_id = auth.uid()
        AND eo.role IN ('owner', 'organizer')
    )
);

-- Suppression : Seuls les organisateurs peuvent supprimer
DROP POLICY IF EXISTS "Organizer Delete Print Requests" ON public.print_requests;
CREATE POLICY "Organizer Delete Print Requests"
ON public.print_requests FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_organizers eo
        WHERE eo.event_id = print_requests.event_id
        AND eo.user_id = auth.uid()
        AND eo.role IN ('owner', 'organizer')
    )
);

-- ==========================================
-- 3. ACTIVATION REALTIME
-- ==========================================

-- Activer Realtime pour les demandes d'impression
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_requests;

