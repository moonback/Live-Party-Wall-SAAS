# Correction : Attribution Automatique de Licences

## Problème
La dernière licence est automatiquement attribuée aux nouveaux utilisateurs lors de l'inscription, alors qu'aucune licence ne devrait être créée automatiquement.

## Solution

### 1. Exécuter le Script SQL

Exécutez le script `supabase/remove_auto_license_triggers.sql` dans votre base de données Supabase principale :

```sql
-- Ce script supprime tous les triggers qui pourraient attribuer
-- automatiquement une licence lors de l'inscription d'un utilisateur.
```

**Comment exécuter :**
1. Allez dans Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu de `supabase/remove_auto_license_triggers.sql`
3. Exécutez le script

### 2. Vérifier les Triggers dans Supabase Dashboard

#### A. Vérifier les Triggers sur `auth.users`

1. Allez dans **Supabase Dashboard > Database > Triggers**
2. Recherchez les triggers sur la table `auth.users`
3. Si vous trouvez des triggers comme :
   - `assign_license_on_signup`
   - `create_license_on_user_created`
   - `auto_assign_license`
   - `handle_new_user_license`
   - Ou tout autre trigger qui pourrait créer/attribuer des licences
4. **Supprimez-les**

#### B. Vérifier les Triggers sur `public.licenses`

1. Toujours dans **Database > Triggers**
2. Recherchez les triggers sur la table `public.licenses`
3. Si vous trouvez des triggers comme :
   - `assign_last_license`
   - `auto_assign_unassigned_license`
   - Ou tout autre trigger qui pourrait réassigner des licences
4. **Supprimez-les**

#### C. Vérifier les Fonctions Database

1. Allez dans **Supabase Dashboard > Database > Database Functions**
2. Recherchez les fonctions qui pourraient :
   - Créer des licences automatiquement
   - Attribuer des licences aux nouveaux utilisateurs
   - Récupérer la dernière licence disponible
3. **Supprimez ces fonctions**

### 3. Vérifier la Base de Données Externe (Licenses)

Si vous utilisez une base Supabase séparée pour les licences :

1. Connectez-vous à cette base de données
2. Répétez les étapes 2A, 2B et 2C pour cette base
3. Vérifiez qu'il n'y a pas de triggers qui attribuent automatiquement des licences

### 4. Vérification SQL

Pour vérifier qu'il n'y a plus de triggers problématiques, exécutez ces requêtes :

```sql
-- Vérifier les triggers sur auth.users
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Vérifier les triggers sur public.licenses
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'licenses' 
  AND event_object_schema = 'public';

-- Vérifier les fonctions qui pourraient créer/attribuer des licences
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%license%' 
    OR routine_definition ILIKE '%licence%'
  )
  AND (
    routine_definition ILIKE '%INSERT INTO%licenses%'
    OR routine_definition ILIKE '%UPDATE%licenses%'
    OR routine_definition ILIKE '%user_id%'
  );
```

### 5. Comportement Attendu Après Correction

Après avoir supprimé tous les triggers :

- ✅ **Aucune licence n'est créée automatiquement** lors de l'inscription
- ✅ **Les nouveaux utilisateurs sont bloqués** jusqu'à ce qu'ils saisissent leur clé de licence
- ✅ **Chaque utilisateur doit saisir manuellement** sa clé de licence reçue par email
- ✅ **Le système vérifie la licence** uniquement quand l'utilisateur la saisit

### 6. Test

Pour tester que la correction fonctionne :

1. Créez un nouveau compte utilisateur
2. Vérifiez dans la base de données qu'**aucune licence n'a été créée** pour cet utilisateur
3. L'utilisateur devrait voir l'écran `LicenseBlock` avec le message "Licence requise"
4. L'utilisateur doit saisir manuellement sa clé de licence pour accéder à l'application

## Notes Importantes

- ⚠️ **Ne créez jamais de triggers** qui attribuent automatiquement des licences
- ⚠️ **Chaque utilisateur doit avoir sa propre licence** saisie manuellement
- ⚠️ **Les licences sont vérifiées uniquement** quand l'utilisateur les saisit via `verifyLicenseByKey`
- ⚠️ **Les licences sont stockées dans `localStorage`** après vérification réussie, pas dans la base principale

## Support

Si le problème persiste après avoir suivi ces étapes, vérifiez :
1. Les logs Supabase pour voir quels triggers/fonctions s'exécutent
2. Les logs de l'application pour voir si `createLicense` est appelé automatiquement
3. Les webhooks Supabase qui pourraient déclencher des actions automatiques

