-- ==========================================
-- FIX : CORRECTION DES POLITIQUES RLS POUR EVENTS
-- ==========================================
-- Ce script corrige les politiques RLS pour permettre la création d'événements
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. CRÉER/REMPLACER LA FONCTION HELPER EN PREMIER
-- ==========================================
-- IMPORTANT : La fonction doit être créée AVANT d'être utilisée dans les politiques

-- S'assurer que la fonction is_event_organizer existe et fonctionne correctement
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
-- 2. SUPPRIMER LES ANCIENNES POLITIQUES
-- ==========================================

DROP POLICY IF EXISTS "Authenticated Create Events" ON public.events;
DROP POLICY IF EXISTS "Organizers Update Events" ON public.events;
DROP POLICY IF EXISTS "Owners Delete Events" ON public.events;
DROP POLICY IF EXISTS "Public Read Active Events" ON public.events;

-- ==========================================
-- 3. CRÉER LES NOUVELLES POLITIQUES CORRIGÉES
-- ==========================================

-- Lecture : Les invités peuvent lire les événements actifs
CREATE POLICY "Public Read Active Events"
ON public.events FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Création : Les utilisateurs authentifiés peuvent créer des événements
-- IMPORTANT : La politique vérifie que owner_id = auth.uid() dans WITH CHECK
CREATE POLICY "Authenticated Create Events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
    -- L'utilisateur doit être authentifié et être le propriétaire
    auth.uid() IS NOT NULL AND
    auth.uid() = owner_id
);

-- Mise à jour : Les organisateurs peuvent modifier leurs événements
-- Note : On ne peut pas utiliser OLD dans les politiques RLS, donc on vérifie seulement
-- que l'utilisateur a le droit de modifier (mais on ne peut pas empêcher le changement de owner_id)
-- Pour empêcher le changement de owner_id, il faudrait utiliser un trigger
CREATE POLICY "Organizers Update Events"
ON public.events FOR UPDATE
TO authenticated
USING (
    -- L'utilisateur est le propriétaire
    owner_id = auth.uid()
    OR
    -- Ou l'utilisateur est un organisateur (via la fonction helper)
    public.is_event_organizer(id, auth.uid())
)
WITH CHECK (
    -- L'utilisateur doit toujours être le propriétaire ou un organisateur après la mise à jour
    owner_id = auth.uid()
    OR
    public.is_event_organizer(id, auth.uid())
);

-- Suppression : Seuls les owners peuvent supprimer
CREATE POLICY "Owners Delete Events"
ON public.events FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ==========================================
-- 4. VÉRIFIER QUE LA FONCTION FONCTIONNE
-- ==========================================

-- Test de la fonction (optionnel, peut être commenté)
-- SELECT public.is_event_organizer('00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- ==========================================
-- 5. GRANT PERMISSIONS (si nécessaire)
-- ==========================================

-- S'assurer que les utilisateurs authentifiés ont les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_organizers TO authenticated;

-- S'assurer que la fonction est exécutable par authenticated
GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID, UUID) TO authenticated;

-- ==========================================
-- NOTES IMPORTANTES
-- ==========================================
-- 
-- 1. La politique "Authenticated Create Events" utilise WITH CHECK pour vérifier
--    que auth.uid() = owner_id AVANT l'insertion.
-- 
-- 2. Assurez-vous que dans votre code TypeScript, vous passez bien user.id
--    (qui correspond à auth.uid()) comme owner_id lors de la création.
-- 
-- 3. Si vous obtenez toujours une erreur 403, vérifiez :
--    - Que l'utilisateur est bien authentifié (auth.uid() n'est pas NULL)
--    - Que user.id dans le contexte correspond bien à auth.uid()
--    - Que la session Supabase est active
-- 
-- 4. Pour déboguer, vous pouvez exécuter cette requête dans Supabase SQL Editor :
--    SELECT auth.uid() as current_user_id;
--    (Doit retourner l'UUID de l'utilisateur authentifié)
-- 
-- ==========================================

