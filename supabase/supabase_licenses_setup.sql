-- ==========================================
-- LIVE PARTY WALL - SETUP LICENSES TABLE
-- ==========================================
-- Ce fichier crée la table licenses pour gérer
-- les licences d'utilisation de l'application SaaS.
--
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- TABLE LICENSES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    license_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    activated_at TIMESTAMPTZ,
    last_check_at TIMESTAMPTZ,
    notes TEXT,
    CHECK (status IN ('active', 'expired', 'suspended', 'cancelled'))
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON public.licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_user_status ON public.licenses(user_id, status);

-- Activer RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLITIQUES RLS
-- ==========================================

-- Lecture : L'utilisateur peut lire sa propre licence
DROP POLICY IF EXISTS "Users can read own license" ON public.licenses;
CREATE POLICY "Users can read own license"
ON public.licenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Lecture : Les admins peuvent lire toutes les licences
-- Note: Vous devrez créer une fonction pour vérifier si un utilisateur est admin
-- ou utiliser une table de rôles. Pour l'instant, on permet la lecture à tous les authenticated
-- pour simplifier. Vous pouvez restreindre plus tard.

-- Insertion : Seuls les admins peuvent créer des licences
-- Pour l'instant, on permet aux utilisateurs authentifiés de créer leur propre licence
-- (utile pour les tests). En production, vous devriez restreindre cela.
DROP POLICY IF EXISTS "Users can create own license" ON public.licenses;
CREATE POLICY "Users can create own license"
ON public.licenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Mise à jour : L'utilisateur peut mettre à jour sa propre licence (pour last_check_at)
DROP POLICY IF EXISTS "Users can update own license" ON public.licenses;
CREATE POLICY "Users can update own license"
ON public.licenses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Suppression : Seuls les admins peuvent supprimer des licences
-- Pour l'instant, on ne permet pas la suppression par les utilisateurs
-- (vous pouvez créer une fonction admin plus tard)

-- ==========================================
-- FONCTION POUR VÉRIFIER LA VALIDITÉ D'UNE LICENCE
-- ==========================================

CREATE OR REPLACE FUNCTION public.check_license_validity(user_uuid UUID)
RETURNS TABLE (
    is_valid BOOLEAN,
    license_id UUID,
    expires_at TIMESTAMPTZ,
    status TEXT,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN l.status = 'active' AND l.expires_at > now() THEN true
            ELSE false
        END as is_valid,
        l.id as license_id,
        l.expires_at,
        l.status,
        CASE 
            WHEN l.expires_at > now() THEN EXTRACT(DAY FROM (l.expires_at - now()))::INTEGER
            ELSE 0
        END as days_remaining
    FROM public.licenses l
    WHERE l.user_id = user_uuid
        AND l.status = 'active'
    ORDER BY l.expires_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FONCTION POUR METTRE À JOUR LE STATUT DES LICENCES EXPIRÉES
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_expired_licenses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.licenses
    SET 
        status = 'expired',
        updated_at = now()
    WHERE status = 'active'
        AND expires_at <= now();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER POUR METTRE À JOUR updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_licenses_updated_at ON public.licenses;
CREATE TRIGGER trigger_update_licenses_updated_at
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_licenses_updated_at();

-- ==========================================
-- FONCTION POUR RÉCUPÉRER LA LISTE DES UTILISATEURS
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (
    id UUID,
    email TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id::UUID,
        COALESCE(u.email::TEXT, '')::TEXT as email
    FROM auth.users u
    WHERE u.email IS NOT NULL
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMMENTAIRES
-- ==========================================

COMMENT ON TABLE public.licenses IS 'Gère les licences d''utilisation de l''application SaaS';
COMMENT ON COLUMN public.licenses.license_key IS 'Clé unique de la licence (générée automatiquement ou fournie)';
COMMENT ON COLUMN public.licenses.status IS 'Statut de la licence: active, expired, suspended, cancelled';
COMMENT ON COLUMN public.licenses.expires_at IS 'Date d''expiration de la licence';
COMMENT ON COLUMN public.licenses.last_check_at IS 'Dernière vérification de la licence par l''application';
COMMENT ON FUNCTION public.get_users_list() IS 'Récupère la liste de tous les utilisateurs avec leurs emails';

