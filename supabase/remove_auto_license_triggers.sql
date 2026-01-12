-- ==========================================
-- SUPPRESSION DES TRIGGERS D'ATTRIBUTION AUTOMATIQUE DE LICENCES
-- ==========================================
-- Ce script supprime tous les triggers qui pourraient attribuer
-- automatiquement une licence lors de l'inscription d'un utilisateur.
--
-- IMPORTANT : Aucune licence ne doit être créée automatiquement.
-- Chaque utilisateur doit saisir manuellement sa clé de licence.
-- ==========================================

-- Supprimer tous les triggers sur auth.users qui pourraient créer des licences
DROP TRIGGER IF EXISTS assign_license_on_signup ON auth.users;
DROP TRIGGER IF EXISTS create_license_on_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_assign_license ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_license ON auth.users;

-- Supprimer les fonctions associées si elles existent
DROP FUNCTION IF EXISTS assign_license_on_signup() CASCADE;
DROP FUNCTION IF EXISTS create_license_on_user_created() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_license() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_license() CASCADE;

-- Supprimer les triggers sur la table licenses qui pourraient réassigner des licences
DROP TRIGGER IF EXISTS assign_last_license ON public.licenses;
DROP TRIGGER IF EXISTS auto_assign_unassigned_license ON public.licenses;

-- Supprimer les fonctions associées
DROP FUNCTION IF EXISTS assign_last_license() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_unassigned_license() CASCADE;

-- ==========================================
-- VÉRIFICATION
-- ==========================================
-- Pour vérifier qu'il n'y a plus de triggers sur auth.users :
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'users' 
--   AND event_object_schema = 'auth';

-- Pour vérifier qu'il n'y a plus de triggers sur licenses :
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'licenses' 
--   AND event_object_schema = 'public';

-- ==========================================
-- NOTE IMPORTANTE
-- ==========================================
-- Si vous avez créé des triggers directement dans le Dashboard Supabase,
-- vous devez les supprimer manuellement :
-- 1. Allez dans Supabase Dashboard > Database > Database Functions
-- 2. Recherchez les fonctions qui pourraient attribuer des licences
-- 3. Supprimez-les
-- 4. Allez dans Database > Triggers
-- 5. Recherchez les triggers sur auth.users ou public.licenses
-- 6. Supprimez-les

