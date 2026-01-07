-- ==========================================
-- MIGRATION: Table blocked_guests pour bloquer les invités supprimés
-- À exécuter dans l'éditeur SQL de Supabase
-- ==========================================

-- ==========================================
-- TABLE BLOCKED_GUESTS
-- ==========================================

-- Créer la table blocked_guests pour stocker les invités bloqués temporairement
CREATE TABLE IF NOT EXISTS public.blocked_guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    blocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer un index sur le nom pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_blocked_guests_name ON public.blocked_guests(name);
CREATE INDEX IF NOT EXISTS idx_blocked_guests_expires_at ON public.blocked_guests(expires_at);

-- Activer la sécurité niveau ligne (RLS)
ALTER TABLE public.blocked_guests ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour la table blocked_guests
-- Tout le monde peut vérifier s'il est bloqué (lecture)
CREATE POLICY "Public Read Blocked Guests"
ON public.blocked_guests FOR SELECT
TO anon, authenticated
USING (true);

-- Seuls les utilisateurs authentifiés peuvent bloquer (admin)
CREATE POLICY "Authenticated Insert Blocked Guests"
ON public.blocked_guests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Seuls les utilisateurs authentifiés peuvent supprimer (admin)
CREATE POLICY "Authenticated Delete Blocked Guests"
ON public.blocked_guests FOR DELETE
TO authenticated
USING (true);

-- Fonction pour nettoyer automatiquement les blocages expirés (optionnel)
-- Cette fonction peut être appelée périodiquement ou avant chaque vérification
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS void AS $$
BEGIN
    DELETE FROM public.blocked_guests
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- NOTES
-- ==========================================
-- Les blocages expirent automatiquement après 20 minutes
-- La fonction cleanup_expired_blocks() peut être appelée pour nettoyer les anciens blocages

