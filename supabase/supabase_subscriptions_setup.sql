-- ==========================================
-- MIGRATION : SYSTÈME D'ABONNEMENTS
-- ==========================================
-- Ce script crée les tables pour gérer les abonnements des organisateurs
-- Date: 2026-01-15
-- ==========================================

-- ==========================================
-- 1. CRÉATION DE LA TABLE SUBSCRIPTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN (
        'monthly_pro', 
        'monthly_studio', 
        'event_starter', 
        'event_pro', 
        'event_premium', 
        'volume_10', 
        'volume_50'
    )),
    status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN (
        'active', 
        'expired', 
        'cancelled', 
        'pending_activation'
    )),
    start_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    end_date TIMESTAMPTZ, -- Nullable pour abonnements mensuels récurrents
    events_limit INTEGER, -- Nombre d'événements autorisés (null = illimité pour abonnements mensuels)
    photos_per_event_limit INTEGER, -- Limite de photos par événement (null = illimité)
    features JSONB DEFAULT '{}'::jsonb, -- Fonctionnalités activées selon le plan
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_start_date ON public.subscriptions(start_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Activer RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CRÉATION DE LA TABLE SUBSCRIPTION_EVENTS
-- ==========================================
-- Pour tracker les événements utilisés dans les packs volume

CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    used_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(subscription_id, event_id) -- Un événement ne peut être lié qu'une fois à un abonnement
);

-- Index pour subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_id ON public.subscription_events(event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_used_at ON public.subscription_events(used_at);

-- Activer RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. MODIFICATION DE LA TABLE EVENTS
-- ==========================================
-- Ajouter la colonne subscription_id pour lier les événements aux abonnements

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_events_subscription_id ON public.events(subscription_id);

-- ==========================================
-- 4. FONCTION HELPER POUR VÉRIFIER SI UN UTILISATEUR EST ADMIN
-- ==========================================
-- Cette fonction sera utilisée dans les politiques RLS pour permettre aux admins
-- de gérer tous les abonnements

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Pour l'instant, on peut définir une liste d'emails admin
    -- Ou utiliser une table dédiée aux admins
    -- Ici, on retourne false par défaut, à adapter selon votre système
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. POLITIQUES RLS POUR SUBSCRIPTIONS
-- ==========================================

-- Lecture : Les utilisateurs peuvent lire leurs propres abonnements
CREATE POLICY "Users Read Own Subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Création : Les utilisateurs peuvent créer leurs propres abonnements (pour pending_activation)
CREATE POLICY "Users Create Own Subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Mise à jour : Les utilisateurs peuvent mettre à jour leurs propres abonnements
-- (mais pas changer le status de pending_activation à active - réservé aux admins)
CREATE POLICY "Users Update Own Subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid() AND
    -- Empêcher les utilisateurs de changer le status de pending_activation à active
    (OLD.status = 'pending_activation' AND NEW.status = 'pending_activation' OR
     OLD.status != 'pending_activation')
);

-- Suppression : Les utilisateurs peuvent supprimer leurs propres abonnements
CREATE POLICY "Users Delete Own Subscriptions"
ON public.subscriptions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ==========================================
-- 6. POLITIQUES RLS POUR SUBSCRIPTION_EVENTS
-- ==========================================

-- Lecture : Les utilisateurs peuvent lire les événements de leurs abonnements
CREATE POLICY "Users Read Own Subscription Events"
ON public.subscription_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE subscriptions.id = subscription_events.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
);

-- Création : Les utilisateurs peuvent créer des liens pour leurs propres abonnements
CREATE POLICY "Users Create Own Subscription Events"
ON public.subscription_events FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE subscriptions.id = subscription_events.subscription_id
        AND subscriptions.user_id = auth.uid()
        AND subscriptions.status = 'active'
    )
);

-- Suppression : Les utilisateurs peuvent supprimer les liens de leurs abonnements
CREATE POLICY "Users Delete Own Subscription Events"
ON public.subscription_events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE subscriptions.id = subscription_events.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
);

-- ==========================================
-- 7. TRIGGER POUR METTRE À JOUR updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- ==========================================
-- 8. FONCTION HELPER POUR RÉCUPÉRER L'ABONNEMENT ACTIF D'UN UTILISATEUR
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_id UUID)
RETURNS TABLE (
    id UUID,
    plan_type TEXT,
    status TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    events_limit INTEGER,
    photos_per_event_limit INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_type,
        s.status,
        s.start_date,
        s.end_date,
        s.events_limit,
        s.photos_per_event_limit,
        s.features
    FROM public.subscriptions s
    WHERE s.user_id = get_user_active_subscription.user_id
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. COMMENTAIRES POUR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE public.subscriptions IS 'Gère les abonnements des organisateurs (mensuels, événements ponctuels, packs volume)';
COMMENT ON TABLE public.subscription_events IS 'Lie les événements aux abonnements pour les packs volume';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type de plan: monthly_pro, monthly_studio, event_starter, event_pro, event_premium, volume_10, volume_50';
COMMENT ON COLUMN public.subscriptions.status IS 'Statut: active, expired, cancelled, pending_activation';
COMMENT ON COLUMN public.subscriptions.events_limit IS 'Nombre d''événements autorisés (null = illimité pour abonnements mensuels)';
COMMENT ON COLUMN public.subscriptions.photos_per_event_limit IS 'Limite de photos par événement (null = illimité)';
COMMENT ON COLUMN public.subscriptions.features IS 'Fonctionnalités activées selon le plan (JSONB)';
COMMENT ON COLUMN public.events.subscription_id IS 'Lien vers l''abonnement utilisé pour créer cet événement';

