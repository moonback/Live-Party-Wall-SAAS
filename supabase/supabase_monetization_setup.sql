-- Migration : Monetization Setup
-- Description: Ajout des tables pour les plans, abonnements et paiements.

-- 1. Table des plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('starter', 'pro', 'premium', 'studio')),
    price_cents INTEGER NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('event', 'month', 'year')),
    features JSONB NOT NULL DEFAULT '[]',
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertion des plans par défaut
INSERT INTO plans (name, type, price_cents, interval, features)
VALUES 
('Starter', 'starter', 4900, 'event', '["Mur de photos en temps réel", "Upload illimité de photos", "Galerie HD complète", "Modération automatique par IA", "Support par email"]'),
('Pro', 'pro', 9900, 'event', '["Tout Starter inclus", "Aftermovie automatique", "Branding personnalisé", "Statistiques avancées", "Support prioritaire", "Export ZIP HD"]'),
('Premium', 'premium', 19900, 'event', '["Tout Pro inclus", "Cadres personnalisés", "API et intégrations", "Gestion multi-événements", "Support dédié 24/7", "Formation personnalisée"]'),
('Pro Mensuel', 'pro', 2900, 'month', '["Usage récurrent pour pros", "Tout Pro inclus"]'),
('Studio Mensuel', 'studio', 9900, 'month', '["Solution complète agences", "Tout Premium inclus"]');

-- 2. Table des abonnements (subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id) -- Un seul abonnement actif par utilisateur
);

-- 3. Table des paiements par événement (event_payments)
CREATE TABLE IF NOT EXISTS event_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Mise à jour de la table events
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);

-- 6. RLS Policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

-- Plans : Lecture publique
CREATE POLICY "Public Read Plans" ON plans FOR SELECT USING (true);

-- Subscriptions : Lecture propre utilisateur, Admin seulement en modif
CREATE POLICY "User Read Own Subscription" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Event Payments : Lecture proprio événement
CREATE POLICY "Owner Read Event Payments" ON event_payments FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND owner_id = auth.uid()));

-- 7. Realtime activation
ALTER publication supabase_realtime ADD TABLE subscriptions;
ALTER publication supabase_realtime ADD TABLE event_payments;

