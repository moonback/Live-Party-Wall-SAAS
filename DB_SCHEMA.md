# 🗄️ Schéma de Base de Données - Live Party Wall

Ce document décrit la structure complète de la base de données Supabase PostgreSQL utilisée par Live Party Wall.

---

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Tables](#tables)
  - [photos](#table-photos)
  - [likes](#table-likes)
  - [reactions](#table-reactions)
  - [event_settings](#table-event_settings)
- [Storage Buckets](#storage-buckets)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Relations](#relations)
- [Indexes](#indexes)
- [Realtime](#realtime)

---

## 🎯 Vue d'Ensemble

La base de données utilise **PostgreSQL** via Supabase avec :

- **4 tables principales** : `photos`, `likes`, `reactions`, `event_settings`
- **2 buckets de stockage** : `party-photos`, `party-frames`
- **Row Level Security (RLS)** activé sur toutes les tables
- **Realtime** activé pour les mises à jour en temps réel

---

## 📊 Tables

### Table `photos`

Stocke les métadonnées de toutes les photos uploadées.

#### Structure

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identifiant unique de la photo |
| `url` | `TEXT` | NOT NULL | URL publique de l'image dans Supabase Storage |
| `caption` | `TEXT` | NULLABLE | Légende générée par IA ou saisie manuellement |
| `author` | `TEXT` | NULLABLE | Nom de l'auteur de la photo |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Date et heure de création |
| `likes_count` | `INTEGER` | DEFAULT `0` | Compteur de likes (mis à jour via trigger ou application) |
| `type` | `TEXT` | NOT NULL, DEFAULT `'photo'` | Type de média : `'photo'` ou `'video'` |
| `duration` | `NUMERIC` | NULLABLE | Durée en secondes (pour les vidéos uniquement) |

#### Exemple de Données

```sql
id: 123e4567-e89b-12d3-a456-426614174000
url: https://xxx.supabase.co/storage/v1/object/public/party-photos/1705320000-abc123.jpg
caption: Super soirée entre amis ! 🎉✨
author: Alice
created_at: 2026-01-15 20:30:00+00
likes_count: 5
```

#### Script de Création

```sql
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    caption TEXT,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    likes_count INTEGER DEFAULT 0
);
```

---

### Table `likes`

Table de jointure pour gérer les likes des utilisateurs (évite les doublons).

#### Structure

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identifiant unique du like |
| `photo_id` | `UUID` | NOT NULL, FK → `photos.id` ON DELETE CASCADE | Référence à la photo likée |
| `user_identifier` | `TEXT` | NOT NULL | Identifiant unique client (généré côté client, stocké en localStorage) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Date et heure du like |
| **UNIQUE** | `(photo_id, user_identifier)` | - | Un utilisateur ne peut liker qu'une fois une photo |

#### Exemple de Données

```sql
id: 456e7890-e89b-12d3-a456-426614174001
photo_id: 123e4567-e89b-12d3-a456-426614174000
user_identifier: user-abc-123-xyz
created_at: 2026-01-15 20:35:00+00
```

#### Script de Création

```sql
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(photo_id, user_identifier)
);
```

**Note** : La contrainte `UNIQUE(photo_id, user_identifier)` garantit qu'un utilisateur ne peut liker qu'une fois une photo.

---

### Table `reactions`

Table de jointure pour gérer les réactions emoji des utilisateurs (évite les doublons et permet de changer de réaction).

#### Structure

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identifiant unique de la réaction |
| `photo_id` | `UUID` | NOT NULL, FK → `photos.id` ON DELETE CASCADE | Référence à la photo réagie |
| `user_identifier` | `TEXT` | NOT NULL | Identifiant unique client (généré côté client, stocké en localStorage) |
| `reaction_type` | `TEXT` | NOT NULL | Type de réaction : `'heart'`, `'laugh'`, `'cry'`, `'fire'`, `'wow'`, `'thumbsup'` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Date et heure de la réaction |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Date et heure de la dernière mise à jour |
| **UNIQUE** | `(photo_id, user_identifier)` | - | Un utilisateur ne peut avoir qu'une réaction par photo (mais peut la changer) |

#### Exemple de Données

```sql
id: 789e0123-e89b-12d3-a456-426614174002
photo_id: 123e4567-e89b-12d3-a456-426614174000
user_identifier: user-abc-123-xyz
reaction_type: laugh
created_at: 2026-01-15 20:40:00+00
updated_at: 2026-01-15 20:40:00+00
```

#### Script de Création

```sql
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_identifier TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(photo_id, user_identifier)
);
```

**Note** : 
- La contrainte `UNIQUE(photo_id, user_identifier)` garantit qu'un utilisateur ne peut avoir qu'une réaction par photo, mais peut la changer en mettant à jour `reaction_type`.
- Un trigger automatique met à jour `updated_at` lors des modifications.

---

### Table `event_settings`

Configuration de l'événement (singleton, toujours ID = 1).

#### Structure

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | `BIGINT` | PRIMARY KEY, GENERATED BY DEFAULT AS IDENTITY | Toujours = 1 (singleton) |
| `event_title` | `TEXT` | NOT NULL, DEFAULT `'Party Wall'` | Titre de l'événement affiché sur le mur |
| `event_subtitle` | `TEXT` | NOT NULL, DEFAULT `'Live'` | Sous-titre de l'événement |
| `scroll_speed` | `TEXT` | NOT NULL, DEFAULT `'normal'` | Vitesse de défilement : `'slow'`, `'normal'`, `'fast'` |
| `slide_transition` | `TEXT` | NOT NULL, DEFAULT `'fade'` | Type de transition : `'fade'`, `'slide'`, `'zoom'` |
| `decorative_frame_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `false` | Active/désactive l'affichage des cadres décoratifs |
| `decorative_frame_url` | `TEXT` | NULLABLE | URL du cadre décoratif actif (dans bucket `party-frames`) |
| `caption_generation_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `true` | Active/désactive la génération automatique de légendes par IA |
| `content_moderation_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `true` | Active/désactive la modération automatique par IA |
| `video_capture_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `true` | Active/désactive la capture vidéo pour les invités |
| `collage_mode_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `true` | Active/désactive le mode collage |
| `stats_enabled` | `BOOLEAN` | NOT NULL, DEFAULT `true` | Active/désactive l'affichage des statistiques |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `timezone('utc'::text, now())` | Date de création |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `timezone('utc'::text, now())` | Date de dernière mise à jour |

#### Exemple de Données

```sql
id: 1
event_title: Anniversaire Marie
event_subtitle: Live
scroll_speed: fast
slide_transition: fade
decorative_frame_enabled: true
decorative_frame_url: https://xxx.supabase.co/storage/v1/object/public/party-frames/frames/elegant-gold.png
created_at: 2026-01-15 10:00:00+00
updated_at: 2026-01-15 18:30:00+00
```

#### Script de Création

```sql
CREATE TABLE IF NOT EXISTS event_settings (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  event_title TEXT NOT NULL DEFAULT 'Party Wall',
  event_subtitle TEXT NOT NULL DEFAULT 'Live',
  scroll_speed TEXT NOT NULL DEFAULT 'normal',
  slide_transition TEXT NOT NULL DEFAULT 'fade',
  decorative_frame_enabled BOOLEAN NOT NULL DEFAULT false,
  decorative_frame_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer qu'il y a au moins une ligne (ID 1)
INSERT INTO event_settings (id, event_title, event_subtitle, scroll_speed, slide_transition, decorative_frame_enabled, decorative_frame_url)
SELECT 1, 'Party Wall', 'Live', 'normal', 'fade', false, null
WHERE NOT EXISTS (SELECT 1 FROM event_settings);
```

---

## 🗂️ Storage Buckets

### Bucket `party-photos`

Stockage des photos uploadées par les invités.

**Configuration** :
- **Public** : ✅ Oui (lecture publique)
- **Taille max par fichier** : 50MB (limite Supabase)
- **Types acceptés** : JPEG, PNG, WebP

**Structure** :
```
party-photos/
├── 1705320000-abc123.jpg
├── 1705320100-def456.jpg
└── ...
```

**Politiques** :
- ✅ **SELECT** : Public (anon + authenticated)
- ✅ **INSERT** : Public (anon + authenticated)
- ❌ **DELETE** : Authenticated uniquement (admin)

---

### Bucket `party-frames`

Stockage des cadres décoratifs (PNG avec transparence).

**Configuration** :
- **Public** : ✅ Oui (lecture publique)
- **Taille max par fichier** : 10MB (recommandé)
- **Types acceptés** : PNG uniquement

**Structure** :
```
party-frames/
└── frames/
    ├── elegant-gold.png
    ├── polaroid-frame.png
    └── ...
```

**Politiques** :
- ✅ **SELECT** : Public (anon + authenticated)
- ❌ **INSERT/UPDATE/DELETE** : Authenticated uniquement (admin)

---

## 🔒 Row Level Security (RLS)

Toutes les tables sont protégées par **Row Level Security (RLS)** pour garantir la sécurité au niveau des données.

### Table `photos`

#### Politique : `Public Read Photos`
```sql
CREATE POLICY "Public Read Photos"
ON public.photos FOR SELECT
TO anon, authenticated
USING (true);
```
**Effet** : Tout le monde peut lire les photos (pour le mur et la galerie).

#### Politique : `Public Insert Photos`
```sql
CREATE POLICY "Public Insert Photos"
ON public.photos FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```
**Effet** : Tout le monde peut uploader des photos (invités anonymes).

#### Politique : `Admin Delete Photos`
```sql
CREATE POLICY "Admin Delete Photos"
ON public.photos FOR DELETE
TO authenticated
USING (true);
```
**Effet** : Seuls les utilisateurs authentifiés (admins) peuvent supprimer des photos.

---

### Table `likes`

#### Politique : `Public Read Likes`
```sql
CREATE POLICY "Public Read Likes"
ON public.likes FOR SELECT
TO anon, authenticated
USING (true);
```

#### Politique : `Public Insert Likes`
```sql
CREATE POLICY "Public Insert Likes"
ON public.likes FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

#### Politique : `Public Delete Likes`
```sql
CREATE POLICY "Public Delete Likes"
ON public.likes FOR DELETE
TO anon, authenticated
USING (true);
```
**Effet** : Tout le monde peut liker/unliker (géré par l'application pour éviter les doublons).

---

### Table `reactions`

#### Politique : `Public Read Reactions`
```sql
CREATE POLICY "Public Read Reactions"
ON public.reactions FOR SELECT
TO anon, authenticated
USING (true);
```

#### Politique : `Public Insert Reactions`
```sql
CREATE POLICY "Public Insert Reactions"
ON public.reactions FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

#### Politique : `Public Update Reactions`
```sql
CREATE POLICY "Public Update Reactions"
ON public.reactions FOR UPDATE
TO anon, authenticated
USING (true);
```

#### Politique : `Public Delete Reactions`
```sql
CREATE POLICY "Public Delete Reactions"
ON public.reactions FOR DELETE
TO anon, authenticated
USING (true);
```
**Effet** : Tout le monde peut réagir, modifier ou supprimer ses réactions (géré par l'application pour éviter les doublons).

---

### Table `event_settings`

#### Politique : `Public settings access`
```sql
CREATE POLICY "Public settings access" ON event_settings
  FOR SELECT USING (true);
```
**Effet** : Tout le monde peut lire la configuration (pour afficher le titre, etc.).

#### Politique : `Admin update settings`
```sql
CREATE POLICY "Admin update settings" ON event_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
```

#### Politique : `Admin insert settings`
```sql
CREATE POLICY "Admin insert settings" ON event_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```
**Effet** : Seuls les admins peuvent modifier la configuration.

---

## 🔗 Relations

### Diagramme ER (Simplifié)

```
┌─────────────┐         ┌─────────────┐
│   photos    │◄────────│    likes    │
│             │         │             │
│ id (PK)     │         │ photo_id (FK)│
│ url         │         │ user_id     │
│ caption     │         │ created_at │
│ author      │         └─────────────┘
│ created_at  │
│ likes_count │
└─────────────┘

┌─────────────┐
│event_settings│
│             │
│ id (PK) = 1 │
│ event_title │
│ ...         │
└─────────────┘
```

### Relations Détaillées

1. **`likes.photo_id` → `photos.id`**
   - **Type** : Foreign Key avec `ON DELETE CASCADE`
   - **Effet** : Si une photo est supprimée, tous ses likes sont automatiquement supprimés

2. **`reactions.photo_id` → `photos.id`**
   - **Type** : Foreign Key avec `ON DELETE CASCADE`
   - **Effet** : Si une photo est supprimée, toutes ses réactions sont automatiquement supprimées

---

## 📈 Indexes

### Indexes Implicites

- ✅ **Primary Keys** : Index automatique sur `photos.id`, `likes.id`, `event_settings.id`
- ✅ **Foreign Keys** : Index automatique sur `likes.photo_id`

### Indexes Recommandés (À Ajouter)

Pour optimiser les performances, considérez d'ajouter :

```sql
-- Index pour les requêtes de tri par date
CREATE INDEX IF NOT EXISTS idx_photos_created_at 
ON public.photos(created_at DESC);

-- Index pour les requêtes de likes par photo
CREATE INDEX IF NOT EXISTS idx_likes_photo_id 
ON public.likes(photo_id);

-- Index pour les requêtes de likes par utilisateur
CREATE INDEX IF NOT EXISTS idx_likes_user_identifier 
ON public.likes(user_identifier);

-- Index pour filtrer par type de média (photo/video)
CREATE INDEX IF NOT EXISTS idx_photos_type 
ON public.photos(type);
```

**Note** : L'index `idx_photos_type` est déjà créé automatiquement par le script `supabase_videos_migration.sql`.

---

## 🔄 Realtime

Supabase Realtime est activé pour les tables suivantes :

### Table `photos`

**Événements écoutés** :
- ✅ `INSERT` : Nouvelle photo uploadée

**Usage** :
```typescript
supabase
  .channel('public:photos')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'photos' },
    (payload) => {
      // Nouvelle photo reçue
    }
  )
  .subscribe();
```

### Table `likes`

**Événements écoutés** :
- ✅ `INSERT` : Nouveau like
- ✅ `DELETE` : Like retiré

**Usage** : Mise à jour automatique des compteurs de likes en temps réel.

### Table `event_settings`

**Événements écoutés** :
- ✅ `UPDATE` : Configuration modifiée

**Usage** : Mise à jour automatique de l'affichage du mur quand la config change.

---

## 🔧 Maintenance

### Nettoyage des Photos Anciennes

Pour supprimer les photos de plus de X jours :

```sql
-- Exemple : Supprimer les photos de plus de 30 jours
DELETE FROM public.photos
WHERE created_at < NOW() - INTERVAL '30 days';
```

**⚠️ Attention** : Cette requête supprime aussi les fichiers du Storage (via CASCADE sur `likes`), mais **pas les fichiers du bucket**. Il faudra les supprimer manuellement ou via un script.

### Statistiques

Requêtes utiles pour les analytics :

```sql
-- Nombre total de photos
SELECT COUNT(*) FROM public.photos;

-- Photos par jour
SELECT DATE(created_at) as date, COUNT(*) as count
FROM public.photos
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top 10 photos les plus likées
SELECT id, author, caption, likes_count
FROM public.photos
ORDER BY likes_count DESC
LIMIT 10;

-- Nombre de likes par utilisateur
SELECT user_identifier, COUNT(*) as likes_count
FROM public.likes
GROUP BY user_identifier
ORDER BY likes_count DESC;
```

---

## 📝 Notes Importantes

1. **CASCADE** : La suppression d'une photo supprime automatiquement tous ses likes (grâce à `ON DELETE CASCADE`).

2. **Singleton** : `event_settings` est conçue comme une table singleton (toujours ID = 1). Utilisez `UPSERT` pour les mises à jour.

3. **User Identifier** : Le champ `user_identifier` dans `likes` est généré côté client (UUID stocké en localStorage). Il n'est **pas** lié à Supabase Auth.

4. **Storage URLs** : Les URLs dans `photos.url` sont des URLs publiques Supabase Storage. Elles sont permanentes tant que le fichier existe.

5. **Realtime** : Assurez-vous d'activer Realtime dans les paramètres Supabase (Database > Replication) pour les tables concernées.

6. **Support Vidéo** : Les vidéos sont stockées dans le même bucket `party-photos` que les photos. Le champ `type` permet de distinguer les médias. Les vidéos ont une durée maximale de 30 secondes (définie dans `constants.ts`).

7. **Settings Singleton** : La table `event_settings` est conçue comme un singleton (toujours ID = 1). Utilisez `UPSERT` pour les mises à jour plutôt que `INSERT`/`UPDATE` séparés.

---

## 🚀 Scripts de Migration

Tous les scripts SQL sont disponibles dans le repository :

- `supabase_setup.sql` : Création initiale (photos, buckets, RLS)
- `supabase_admin_setup.sql` : Configuration admin (delete policies)
- `supabase_likes_setup.sql` : Système de likes
- `supabase_settings_setup.sql` : Table event_settings
- `supabase_migration_frames.sql` : Bucket et policies pour les cadres
- `supabase_videos_migration.sql` : Support des vidéos (colonnes type, duration)
- `supabase_video_capture_setting_migration.sql` : Paramètre video_capture_enabled
- `supabase_collage_mode_setting_migration.sql` : Paramètre collage_mode_enabled
- `supabase_stats_enabled_setting_migration.sql` : Paramètre stats_enabled

**Ordre d'exécution recommandé** :
1. `supabase_setup.sql`
2. `supabase_admin_setup.sql`
3. `supabase_likes_setup.sql`
4. `supabase_settings_setup.sql`
5. `supabase_migration_frames.sql`
6. `supabase_videos_migration.sql`
7. `supabase_video_capture_setting_migration.sql`
8. `supabase_collage_mode_setting_migration.sql`
9. `supabase_stats_enabled_setting_migration.sql`

---

**Dernière mise à jour** : 2026-01-15

