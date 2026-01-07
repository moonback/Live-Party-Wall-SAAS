-- ==========================================
-- SETUP ADMIN / MODERATION
-- ==========================================

-- 1. Policies pour la suppression (Photos)
-- Seuls les utilisateurs connectés (Admins) peuvent supprimer
create policy "Admin Delete Photos"
on public.photos for delete
to authenticated
using (true);

-- 2. Policies pour le Storage
-- Seuls les utilisateurs connectés peuvent supprimer des fichiers
create policy "Admin Delete Storage"
on storage.objects for delete
to authenticated
using ( bucket_id = 'party-photos' );

-- ==========================================
-- INSTRUCTIONS
-- ==========================================
-- 1. Allez dans le tableau de bord Supabase > Authentication > Users
-- 2. Cliquez sur "Invite user" ou créez un utilisateur manuellement
-- 3. Utilisez ces identifiants pour vous connecter sur /?mode=admin
-- 4. (Optionnel) Désactivez l'inscription publique (Sign Up) dans Authentication > Settings

