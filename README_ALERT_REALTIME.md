# Activation de la mise à jour en temps réel pour l'alerte

## Problème
Si l'alerte ne se met pas à jour automatiquement sur le mur, c'est probablement parce que la table `event_settings` n'est pas dans la publication Realtime de Supabase.

## Solution

### 1. Exécuter la migration SQL

Exécutez le fichier `supabase/supabase_alert_text_migration.sql` dans l'éditeur SQL de Supabase.

Cette migration :
- Ajoute la colonne `alert_text` à la table `event_settings`
- Ajoute `event_settings` à la publication Realtime pour les mises à jour en temps réel

### 2. Vérifier que Realtime est activé

Dans Supabase Dashboard :
1. Allez dans **Database** > **Replication**
2. Vérifiez que `event_settings` est dans la liste des tables publiées
3. Si elle n'y est pas, exécutez manuellement :
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.event_settings;
   ```

### 3. Vérifier les logs

Ouvrez la console du navigateur (F12) et vérifiez les logs :
- `Subscribed to event_settings Realtime updates` : La souscription fonctionne
- `Settings updated via Realtime` : Les mises à jour sont reçues
- `Settings updated in context via Realtime` : Le contexte est mis à jour
- `WallView: alert_text changed` : Le mur détecte le changement

### 4. Test

1. Ouvrez MobileControl dans un onglet
2. Ouvrez le mur (WallView) dans un autre onglet
3. Ajoutez une alerte dans MobileControl
4. L'alerte devrait apparaître immédiatement sur le mur sans actualisation

## Dépannage

Si ça ne fonctionne toujours pas :
1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez les logs de la console pour les erreurs
3. Vérifiez que RLS est activé sur `event_settings`
4. Vérifiez que les politiques RLS permettent la lecture publique

