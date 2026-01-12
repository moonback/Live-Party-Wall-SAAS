# 🚀 Optimisations des Requêtes Supabase - Partywall

## 📊 Analyse Complète

Ce document identifie toutes les opportunités d'optimisation des requêtes Supabase dans l'application Partywall.

---

## 🔴 Problèmes Critiques Identifiés

### 1. **Requêtes avec `select('*')` - Surcharge Inutile**

**Problème** : De nombreuses requêtes récupèrent toutes les colonnes alors qu'elles n'en ont besoin que de quelques-unes.

**Impact** : 
- Transfert de données inutile (bande passante)
- Temps de réponse plus long
- Coût Supabase plus élevé

**Exemples trouvés** :
- `photoService.ts:329` : `select('*')` pour récupérer les photos
- `eventService.ts:130` : `select('*')` pour récupérer un événement
- `battleService.ts:51` : `select('*')` pour récupérer une photo
- `guestService.ts:30` : `select('*')` pour vérifier un blocage

**Solution** : Utiliser `select()` avec uniquement les colonnes nécessaires.

---

### 2. **Comptage des Likes - Requêtes Multiples**

**Problème** : Dans `getPhotos()`, on fait une requête séparée pour compter les likes de chaque photo au lieu d'utiliser des agrégations SQL.

**Code actuel** :
```typescript
// 1. Récupérer toutes les photos
const { data: photosData } = await supabase.from('photos').select('*')...

// 2. Récupérer tous les likes en une requête
const { data: likesData } = await supabase.from('likes').select('photo_id').in('photo_id', photoIds)

// 3. Compter côté client
const likesCountMap = new Map<string, number>();
likesData.forEach(like => {
  const count = likesCountMap.get(like.photo_id) || 0;
  likesCountMap.set(like.photo_id, count + 1);
});
```

**Impact** : 
- 2 requêtes au lieu d'1
- Traitement côté client au lieu du serveur
- Non scalable avec beaucoup de photos

**Solution** : Utiliser une agrégation SQL avec `count()` ou une vue matérialisée.

---

### 3. **Pagination Non Systématique**

**Problème** : Certaines fonctions récupèrent toutes les données sans pagination.

**Exemples** :
- `getPhotos()` : Option `all=true` récupère toutes les photos
- `getAllGuests()` : Récupère tous les invités sans limite
- `getUserEvents()` : Récupère tous les événements

**Impact** : 
- Problèmes de performance avec beaucoup de données
- Risque de timeout
- Consommation mémoire élevée

**Solution** : Implémenter la pagination partout avec des limites par défaut.

---

### 4. **Requêtes N+1 dans BattleService**

**Problème** : Dans `getActiveBattles()`, on récupère les photos une par une via `getPhotoById()` au lieu de les récupérer en batch.

**Code actuel** :
```typescript
const [photo1, photo2] = await Promise.all([
  getPhotoById(battleRow.photo1_id),
  getPhotoById(battleRow.photo2_id),
]);
```

**Impact** : 
- Si on a 10 battles, on fait 20 requêtes au lieu de 1
- Latence multipliée

**Solution** : Utiliser `getPhotosByIds()` qui existe déjà mais n'est pas toujours utilisé.

---

### 5. **Manque d'Index Composites**

**Problème** : Les requêtes fréquentes filtrent par plusieurs colonnes mais n'ont pas d'index composite.

**Exemples** :
- `photos` : Filtres fréquents sur `(event_id, created_at)` ou `(event_id, type)`
- `likes` : Filtres fréquents sur `(photo_id, user_identifier)`
- `reactions` : Filtres fréquents sur `(photo_id, user_identifier)`

**Impact** : 
- Scans de table complets
- Requêtes lentes

**Solution** : Créer des index composites pour les patterns de requêtes fréquents.

---

### 6. **Compteurs Non Optimisés**

**Problème** : Les compteurs (likes_count, votes_count) sont mis à jour manuellement au lieu d'utiliser des triggers SQL ou des vues matérialisées.

**Impact** : 
- Requêtes supplémentaires pour mettre à jour les compteurs
- Risque d'incohérence
- Performance dégradée

**Solution** : Utiliser des triggers SQL (déjà partiellement implémenté) ou des vues matérialisées.

---

## ✅ Optimisations Recommandées

### **Optimisation 1 : Sélection de Colonnes Ciblée**

**Avant** :
```typescript
const { data } = await supabase
  .from('photos')
  .select('*')
  .eq('event_id', eventId);
```

**Après** :
```typescript
const { data } = await supabase
  .from('photos')
  .select('id, url, caption, author, created_at, type, duration, event_id')
  .eq('event_id', eventId);
```

**Gain estimé** : 30-50% de réduction du transfert de données

---

### **Optimisation 2 : Agrégation SQL pour les Likes**

**Avant** :
```typescript
// 2 requêtes séparées
const photos = await supabase.from('photos').select('*')...
const likes = await supabase.from('likes').select('photo_id').in('photo_id', photoIds)...
// Comptage côté client
```

**Après** : Utiliser une fonction SQL ou une vue :

```sql
-- Fonction SQL
CREATE OR REPLACE FUNCTION get_photos_with_likes(event_uuid UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  caption TEXT,
  author TEXT,
  created_at TIMESTAMPTZ,
  type TEXT,
  likes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.url,
    p.caption,
    p.author,
    p.created_at,
    p.type,
    COALESCE(COUNT(l.id), 0)::BIGINT as likes_count
  FROM photos p
  LEFT JOIN likes l ON p.id = l.photo_id
  WHERE p.event_id = event_uuid
  GROUP BY p.id, p.url, p.caption, p.author, p.created_at, p.type
  ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

**Gain estimé** : 50-70% de réduction du temps de réponse

---

### **Optimisation 3 : Index Composites**

**Créer ces index** :

```sql
-- Photos : requêtes fréquentes par event_id + created_at
CREATE INDEX IF NOT EXISTS idx_photos_event_created 
ON photos(event_id, created_at DESC);

-- Photos : requêtes fréquentes par event_id + type
CREATE INDEX IF NOT EXISTS idx_photos_event_type 
ON photos(event_id, type) WHERE type = 'photo';

-- Likes : requêtes fréquentes par photo_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_likes_photo_user 
ON likes(photo_id, user_identifier);

-- Reactions : requêtes fréquentes par photo_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_reactions_photo_user 
ON reactions(photo_id, user_identifier);

-- Battle votes : requêtes fréquentes par battle_id + user_identifier
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_user 
ON battle_votes(battle_id, user_identifier);

-- Blocked guests : requêtes fréquentes par event_id + name + expires_at
CREATE INDEX IF NOT EXISTS idx_blocked_guests_event_name_expires 
ON blocked_guests(event_id, name, expires_at);
```

**Gain estimé** : 60-80% d'amélioration pour les requêtes filtrées

---

### **Optimisation 4 : Pagination Systématique**

**Modifier toutes les fonctions pour accepter des options de pagination** :

```typescript
interface PaginationOptions {
  page?: number;
  pageSize?: number;
  maxResults?: number; // Limite absolue
}

export const getAllGuests = async (
  eventId: string,
  options: PaginationOptions = {}
): Promise<{ guests: Guest[]; total: number; hasMore: boolean }> => {
  const { page = 1, pageSize = 50, maxResults = 1000 } = options;
  const from = (page - 1) * pageSize;
  const to = Math.min(from + pageSize - 1, maxResults - 1);

  const { data, count, error } = await supabase
    .from('guests')
    .select('id, name, avatar_url, created_at, updated_at', { count: 'exact' })
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .range(from, to);

  return {
    guests: data || [],
    total: count || 0,
    hasMore: to < (count || 0) - 1
  };
};
```

**Gain estimé** : Évite les timeouts et réduit la consommation mémoire

---

### **Optimisation 5 : Batch Queries pour les Photos**

**Modifier `battleService.ts` pour toujours utiliser `getPhotosByIds()`** :

```typescript
// Au lieu de :
const [photo1, photo2] = await Promise.all([
  getPhotoById(battleRow.photo1_id),
  getPhotoById(battleRow.photo2_id),
]);

// Utiliser :
const allPhotoIds = battles.flatMap(b => [b.photo1_id, b.photo2_id]);
const photosMap = await getPhotosByIds(allPhotoIds);
const photo1 = photosMap.get(battleRow.photo1_id);
const photo2 = photosMap.get(battleRow.photo2_id);
```

**Gain estimé** : Réduction de 90% du nombre de requêtes pour les battles

---

### **Optimisation 6 : Vue Matérialisée pour les Statistiques**

**Créer une vue matérialisée pour les stats de photos** :

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS photo_stats AS
SELECT 
  p.id as photo_id,
  p.event_id,
  p.author,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT r.id) as reactions_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'heart' THEN r.id END) as heart_count,
  COUNT(DISTINCT CASE WHEN r.reaction_type = 'laugh' THEN r.id END) as laugh_count,
  -- ... autres types de réactions
  MAX(l.created_at) as last_like_at,
  MAX(r.created_at) as last_reaction_at
FROM photos p
LEFT JOIN likes l ON p.id = l.photo_id
LEFT JOIN reactions r ON p.id = r.photo_id
GROUP BY p.id, p.event_id, p.author;

-- Index pour la vue
CREATE INDEX IF NOT EXISTS idx_photo_stats_photo_id ON photo_stats(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_stats_event_id ON photo_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_stats_author ON photo_stats(author);

-- Rafraîchir périodiquement (via cron ou trigger)
CREATE OR REPLACE FUNCTION refresh_photo_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY photo_stats;
END;
$$ LANGUAGE plpgsql;
```

**Gain estimé** : 80-90% de réduction du temps pour les requêtes de stats

---

### **Optimisation 7 : Cache des Requêtes Fréquentes**

**Implémenter un cache Redis ou mémoire pour** :
- Settings d'événement (rarement modifiés)
- Liste des événements d'un utilisateur
- Stats de photos (rafraîchies périodiquement)

**Exemple** :
```typescript
const settingsCache = new Map<string, { settings: EventSettings; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export const getSettings = async (eventId: string): Promise<EventSettings> => {
  const cached = settingsCache.get(eventId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.settings;
  }

  const settings = await fetchSettingsFromDB(eventId);
  settingsCache.set(eventId, { settings, timestamp: Date.now() });
  return settings;
};
```

**Gain estimé** : 90%+ de réduction pour les requêtes en cache

---

### **Optimisation 8 : Requêtes Conditionnelles Optimisées**

**Éviter les requêtes inutiles** :

```typescript
// Avant
const { data: existingLike } = await supabase
  .from('likes')
  .select('id')
  .eq('photo_id', photoId)
  .eq('user_identifier', userIdentifier)
  .maybeSingle();

if (existingLike) {
  // DELETE
} else {
  // INSERT
}

// Après : Utiliser upsert avec onConflict
const { data, error } = await supabase
  .from('likes')
  .upsert(
    { photo_id: photoId, user_identifier: userIdentifier },
    { onConflict: 'photo_id,user_identifier' }
  )
  .select('id')
  .single();
```

**Gain estimé** : 1 requête au lieu de 2-3

---

### **Optimisation 9 : Utiliser `head: true` pour les Counts**

**Quand on a juste besoin du count** :

```typescript
// Avant
const { data, count } = await supabase
  .from('photos')
  .select('*', { count: 'exact' })
  .eq('event_id', eventId);

// Après
const { count } = await supabase
  .from('photos')
  .select('*', { count: 'exact', head: true })
  .eq('event_id', eventId);
```

**Gain estimé** : Pas de transfert de données, juste le count

---

### **Optimisation 10 : Filtres SQL au lieu de Filtres Client**

**Déplacer les filtres côté serveur** :

```typescript
// Avant : Récupérer toutes les photos puis filtrer côté client
const { data: allPhotos } = await supabase.from('photos').select('*');
const filtered = allPhotos.filter(p => p.type === 'photo' && p.author === 'John');

// Après : Filtrer côté serveur
const { data: filtered } = await supabase
  .from('photos')
  .select('id, url, caption, author')
  .eq('type', 'photo')
  .eq('author', 'John');
```

**Gain estimé** : Réduction massive du transfert de données

---

## 📋 Plan d'Implémentation

### **Phase 1 : Quick Wins (1-2 jours)**
1. ✅ Remplacer tous les `select('*')` par des sélections ciblées
2. ✅ Ajouter `head: true` pour les counts
3. ✅ Utiliser `getPhotosByIds()` partout dans battleService
4. ✅ Implémenter la pagination dans `getAllGuests()`

### **Phase 2 : Index et Structure (2-3 jours)**
1. ✅ Créer les index composites identifiés
2. ✅ Créer la fonction SQL `get_photos_with_likes()`
3. ✅ Optimiser les requêtes de comptage

### **Phase 3 : Cache et Vues (3-4 jours)**
1. ✅ Implémenter le cache pour les settings
2. ✅ Créer la vue matérialisée `photo_stats`
3. ✅ Mettre en place le rafraîchissement automatique

### **Phase 4 : Monitoring (1 jour)**
1. ✅ Ajouter des métriques de performance
2. ✅ Logger les requêtes lentes
3. ✅ Dashboard de monitoring

---

## 📊 Métriques de Succès

**Objectifs** :
- ⚡ Réduction de 50% du temps de réponse moyen
- 📉 Réduction de 60% du transfert de données
- 💰 Réduction de 40% des coûts Supabase
- 🚀 Support de 10x plus d'utilisateurs simultanés

---

## 🔍 Requêtes à Monitorer

**Ajouter du logging pour** :
- Temps d'exécution > 500ms
- Requêtes avec `select('*')`
- Requêtes sans pagination sur grandes tables
- Requêtes N+1 détectées

---

## 📝 Notes Importantes

1. **Tester chaque optimisation** avant de déployer
2. **Monitorer les performances** après chaque changement
3. **Documenter les changements** dans le code
4. **Informer l'équipe** des nouvelles optimisations disponibles

---

**Dernière mise à jour** : 2026-01-15

