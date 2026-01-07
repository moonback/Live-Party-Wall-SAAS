# 🔧 Résolution de l'erreur 403 lors de la création d'événements

## Problème

Lors de la création d'un événement, vous obtenez une erreur **403 (Forbidden)** avec le message :
```
Failed to load resource: the server responded with a status of 403
Error creating event: Erreur lors de la création de l'événement
```

## Cause

Cette erreur est causée par les **politiques RLS (Row Level Security)** de Supabase qui bloquent l'insertion dans la table `events`. La politique vérifie que `auth.uid() = owner_id`, mais il peut y avoir un décalage entre l'ID utilisateur du contexte React et l'ID authentifié dans Supabase.

## Solutions

### Solution 1 : Exécuter le script SQL de correction (Recommandé)

1. **Ouvrez Supabase Dashboard** > SQL Editor
2. **Exécutez le script** `supabase/supabase_events_rls_fix.sql`
3. Ce script :
   - Corrige les politiques RLS pour la table `events`
   - S'assure que la fonction helper `is_event_organizer` existe
   - Ajoute les permissions nécessaires

### Solution 2 : Vérifier l'authentification

Assurez-vous que l'utilisateur est bien authentifié :

1. **Vérifiez la session** dans la console du navigateur :
   ```javascript
   // Dans la console du navigateur
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   console.log('User ID:', session?.user?.id);
   ```

2. **Vérifiez que `auth.uid()` correspond** à `user.id` :
   - Dans Supabase SQL Editor, exécutez :
   ```sql
   SELECT auth.uid() as current_user_id;
   ```
   - Comparez avec l'ID de l'utilisateur dans votre contexte React

### Solution 3 : Modifications apportées au code

Le code a été mis à jour pour :

1. **Utiliser directement `auth.uid()`** depuis la session Supabase au lieu de se fier à `user.id` du contexte React
2. **Vérifier l'authentification** avant de créer l'événement
3. **Améliorer les messages d'erreur** pour identifier le problème exact

Les fichiers modifiés :
- `services/eventService.ts` : Utilise maintenant `auth.uid()` directement
- `components/EventSelector.tsx` : Ne passe plus `ownerId` (optionnel maintenant)

## Vérification

Après avoir appliqué les corrections :

1. **Rechargez l'application** (Ctrl+F5 ou Cmd+Shift+R)
2. **Connectez-vous** en tant qu'administrateur
3. **Essayez de créer un événement**
4. **Vérifiez les logs** dans la console pour voir si l'erreur persiste

## Debug

Si l'erreur persiste, vérifiez :

### 1. Les politiques RLS sont bien appliquées

```sql
-- Vérifier les politiques sur events
SELECT * FROM pg_policies WHERE tablename = 'events';
```

### 2. La fonction helper existe

```sql
-- Vérifier que la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'is_event_organizer';
```

### 3. L'utilisateur est bien authentifié

```sql
-- Dans Supabase SQL Editor (en tant qu'admin)
SELECT auth.uid() as current_user_id;
```

### 4. Les permissions sont correctes

```sql
-- Vérifier les permissions sur la table events
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'events';
```

## Messages d'erreur améliorés

Le service affiche maintenant des messages d'erreur plus précis :

- **"Vous devez être connecté"** : L'utilisateur n'est pas authentifié
- **"Permissions insuffisantes"** : Problème de politique RLS (code 42501)
- **"Erreur de permissions RLS"** : Violation de politique RLS (code PGRST301)
- **"Un événement avec ce slug existe déjà"** : Slug déjà utilisé (code 23505)

## Notes importantes

1. **`auth.uid()`** est la fonction Supabase qui retourne l'UUID de l'utilisateur authentifié
2. **`user.id`** du contexte React doit correspondre à `auth.uid()` pour que les politiques RLS fonctionnent
3. **Les politiques RLS** sont évaluées côté serveur, donc `auth.uid()` doit être disponible dans le contexte de la requête

## Support

Si le problème persiste après avoir appliqué toutes les solutions :

1. Vérifiez les logs Supabase (Dashboard > Logs)
2. Vérifiez les logs du navigateur (Console)
3. Ouvrez une issue sur GitHub avec :
   - Le message d'erreur complet
   - Les logs de la console
   - La version de Supabase utilisée

---

**Dernière mise à jour** : 2026-01-15

