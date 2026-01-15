-- ==========================================
-- FIX : CORRECTION DES POLITIQUES RLS POUR UPDATE EVENTS
-- ==========================================
-- Ce script corrige les politiques RLS pour permettre la mise à jour d'événements
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. S'ASSURER QUE LA FONCTION HELPER EXISTE
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_event_organizer(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Vérifier si l'utilisateur est owner de l'événement
    IF EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_uuid
        AND events.owner_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;

    -- Vérifier si l'utilisateur est dans event_organizers
    IF EXISTS (
        SELECT 1 FROM public.event_organizers
        WHERE event_organizers.event_id = event_uuid
        AND event_organizers.user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- ==========================================
-- 2. GRANT PERMISSIONS SUR LA FONCTION
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID, UUID) TO anon;

-- ==========================================
-- 3. AJOUTER UNE POLITIQUE POUR LIRE TOUS LES ÉVÉNEMENTS (POUR LES ORGANISATEURS)
-- ==========================================
-- Cette politique permet aux organisateurs de lire leurs événements même s'ils sont inactifs
-- Cela est nécessaire pour que la fonction is_event_organizer fonctionne correctement

DROP POLICY IF EXISTS "Organizers Read Own Events" ON public.events;
CREATE POLICY "Organizers Read Own Events"
ON public.events FOR SELECT
TO authenticated
USING (
    -- L'utilisateur peut lire s'il est le propriétaire
    owner_id = auth.uid()
    OR
    -- Ou s'il est un organisateur (via la fonction helper)
    public.is_event_organizer(id, auth.uid())
);

-- ==========================================
-- 4. RECRÉER LA POLITIQUE UPDATE AVEC UNE VERSION SIMPLIFIÉE
-- ==========================================

DROP POLICY IF EXISTS "Organizers Update Events" ON public.events;

-- Version simplifiée qui fonctionne mieux avec RLS
CREATE POLICY "Organizers Update Events"
ON public.events FOR UPDATE
TO authenticated
USING (
    -- L'utilisateur est le propriétaire
    owner_id = auth.uid()
    OR
    -- Ou l'utilisateur est un organisateur
    public.is_event_organizer(id, auth.uid())
)
WITH CHECK (
    -- Après la mise à jour, l'utilisateur doit toujours être propriétaire ou organisateur
    owner_id = auth.uid()
    OR
    public.is_event_organizer(id, auth.uid())
);

-- ==========================================
-- 5. S'ASSURER QUE LES PERMISSIONS GRANT SONT CORRECTES
-- ==========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_organizers TO authenticated;

-- ==========================================
-- 6. VÉRIFICATIONS (OPTIONNEL - PEUT ÊTRE COMMENTÉ)
-- ==========================================

-- Pour tester si la fonction fonctionne (remplacer les UUIDs par de vrais IDs)
-- SELECT public.is_event_organizer('event-uuid-here'::UUID, 'user-uuid-here'::UUID);

-- Pour vérifier les politiques RLS actives
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'events';

-- ==========================================
-- NOTES IMPORTANTES
-- ==========================================
-- 
-- 1. La politique "Organizers Read Own Events" permet aux organisateurs de lire
--    leurs événements même s'ils sont inactifs. Cela est nécessaire pour que
--    la fonction is_event_organizer puisse vérifier les permissions.
-- 
-- 2. La politique "Public Read Active Events" reste active et permet aux invités
--    de lire uniquement les événements actifs.
-- 
-- 3. Si vous obtenez toujours une erreur 403 après avoir exécuté ce script :
--    - Vérifiez que l'utilisateur est bien authentifié (auth.uid() n'est pas NULL)
--    - Vérifiez que l'utilisateur est bien le propriétaire ou un organisateur de l'événement
--    - Vérifiez que la session Supabase est active et valide
-- 
-- 4. Pour déboguer, exécutez dans Supabase SQL Editor :
--    SELECT auth.uid() as current_user_id;
--    SELECT * FROM public.events WHERE id = 'event-id-here';
--    SELECT public.is_event_organizer('event-id-here'::UUID, auth.uid());
-- 
-- ==========================================

