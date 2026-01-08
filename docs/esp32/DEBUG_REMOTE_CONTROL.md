# 🔍 Guide de Débogage - Télécommande ESP32

Si les commandes sont envoyées à la base de données mais rien ne se passe à l'écran, suivez ce guide de débogage.

## ✅ Vérifications à faire

### 1. Vérifier que la migration SQL a été exécutée

Dans Supabase Dashboard → SQL Editor, exécutez :

```sql
-- Vérifier que la table existe
SELECT * FROM remote_commands LIMIT 1;

-- Vérifier que Realtime est activé
SELECT * FROM pg_publication_tables WHERE tablename = 'remote_commands';
```

Si la table n'existe pas, exécutez le fichier `supabase/supabase_remote_commands_setup.sql`.

### 2. Vérifier que les commandes arrivent dans la base de données

Dans Supabase Dashboard → Table Editor → `remote_commands`, vérifiez que :
- Les nouvelles commandes apparaissent avec `processed = false`
- Le `event_id` correspond bien à votre événement
- Le `command_type` est valide (TOGGLE_AUTO_SCROLL, etc.)

### 3. Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et cherchez les logs :
- `✅ Subscribed to remote_commands Realtime updates` → La subscription fonctionne
- `✅ Remote command received and validated` → Une commande a été reçue
- `✅ Executing remote command` → La commande est en cours d'exécution

### 4. Vérifier que l'event_id correspond

Dans la console du navigateur, vérifiez que :
- L'`event_id` utilisé dans l'ESP32 correspond à celui de l'événement actuel
- Le log `Setting up remote control subscription` affiche le bon `event_id`

### 5. Mécanisme de secours (Polling)

Même si Realtime ne fonctionne pas, un mécanisme de polling vérifie toutes les 2 secondes les nouvelles commandes. Vous devriez voir dans les logs :
- `📡 Command found via polling (Realtime may not be working)`

## 🐛 Problèmes courants

### Problème : Les commandes arrivent mais ne sont pas exécutées

**Solution** :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que `currentEvent?.id` n'est pas `null` dans WallView
3. Vérifiez que les logs montrent `Executing remote command`

### Problème : SHOW_RANDOM_PHOTO n'affiche rien

**Explication** :
- La commande `SHOW_RANDOM_PHOTO` ouvre le lightbox avec une photo aléatoire
- Si aucune photo n'est disponible, le lightbox ne s'ouvre pas

**Solutions** :
1. Vérifiez qu'il y a des photos dans `displayedPhotos`
2. Vérifiez les logs pour voir si une photo a été sélectionnée
3. Le lightbox se ferme avec la touche Escape ou en cliquant en dehors

### Problème : Realtime ne fonctionne pas

**Solution** :
- Le mécanisme de polling de secours devrait quand même fonctionner
- Vérifiez dans Supabase Dashboard → Database → Replication que la table `remote_commands` est activée
- Vérifiez que la publication `supabase_realtime` contient la table

### Problème : Les commandes sont marquées comme `processed = true` mais rien ne se passe

**Solution** :
- Vérifiez que le callback `onCommand` est bien appelé (logs dans la console)
- Vérifiez que les actions dans le `switch` sont bien exécutées
- Vérifiez que les états (`isPaused`, `showQrCodes`, etc.) sont bien mis à jour

## 🔧 Commandes de test

Pour tester manuellement, insérez une commande directement dans Supabase :

```sql
INSERT INTO remote_commands (event_id, command_type, processed)
VALUES ('votre-event-id', 'SHOW_RANDOM_PHOTO', false);
```

Remplacez `'votre-event-id'` par l'UUID de votre événement.

## 📊 Logs à surveiller

Dans la console du navigateur, vous devriez voir :

1. **Au démarrage** :
   ```
   Setting up remote control subscription
   Subscribing to remote commands
   ✅ Subscribed to remote_commands Realtime updates
   ```

2. **Quand une commande arrive** :
   ```
   Realtime payload received
   ✅ Remote command received and validated
   ✅ Executing remote command
   Toggled auto-scroll via remote command
   ```

3. **Si Realtime ne fonctionne pas** :
   ```
   📡 Command found via polling (Realtime may not be working)
   ✅ Executing remote command
   ```

Si vous ne voyez pas ces logs, il y a un problème de configuration.

