-- ==========================================
-- TABLE REMOTE_COMMANDS - Télécommande ESP32
-- ==========================================
-- Table pour stocker les commandes envoyées par l'ESP32
-- et les recevoir en temps réel via Supabase Realtime
-- ==========================================

CREATE TABLE IF NOT EXISTS public.remote_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    command_type TEXT NOT NULL,
    command_value TEXT,
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (command_type IN ('TOGGLE_AUTO_SCROLL', 'TRIGGER_AR_EFFECT', 'TOGGLE_QR_CODES', 'SHOW_RANDOM_PHOTO', 'CLOSE_RANDOM_PHOTO'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_remote_commands_event_id ON public.remote_commands(event_id);
CREATE INDEX IF NOT EXISTS idx_remote_commands_processed ON public.remote_commands(processed);
CREATE INDEX IF NOT EXISTS idx_remote_commands_event_processed ON public.remote_commands(event_id, processed);
CREATE INDEX IF NOT EXISTS idx_remote_commands_created_at ON public.remote_commands(created_at);

-- Activer RLS
ALTER TABLE public.remote_commands ENABLE ROW LEVEL SECURITY;

-- Politique RLS : INSERT public (pas d'authentification requise)
-- Permet à l'ESP32 d'insérer des commandes sans authentification
DROP POLICY IF EXISTS "Public insert remote commands" ON public.remote_commands;
CREATE POLICY "Public insert remote commands" ON public.remote_commands
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Politique RLS : SELECT pour les utilisateurs authentifiés et anonymes
-- Permet de lire les commandes pour l'application React
DROP POLICY IF EXISTS "Public select remote commands" ON public.remote_commands;
CREATE POLICY "Public select remote commands" ON public.remote_commands
    FOR SELECT
    TO public
    USING (true);

-- Politique RLS : UPDATE pour marquer les commandes comme traitées
DROP POLICY IF EXISTS "Public update remote commands" ON public.remote_commands;
CREATE POLICY "Public update remote commands" ON public.remote_commands
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Activer Realtime pour cette table
-- Note: Cette commande peut échouer si la table est déjà dans la publication, c'est normal
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.remote_commands;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'La table remote_commands est déjà dans la publication Realtime';
END $$;

-- Commentaires pour documentation
COMMENT ON TABLE public.remote_commands IS 'Commandes distantes envoyées par l''ESP32 pour contrôler le mur. Les commandes sont reçues en temps réel via Supabase Realtime.';
COMMENT ON COLUMN public.remote_commands.event_id IS 'ID de l''événement concerné par la commande';
COMMENT ON COLUMN public.remote_commands.command_type IS 'Type de commande : TOGGLE_AUTO_SCROLL, TRIGGER_AR_EFFECT, TOGGLE_QR_CODES, SHOW_RANDOM_PHOTO, CLOSE_RANDOM_PHOTO';
COMMENT ON COLUMN public.remote_commands.command_value IS 'Valeur optionnelle de la commande (peut être null)';
COMMENT ON COLUMN public.remote_commands.processed IS 'Indique si la commande a été traitée par l''application React';

