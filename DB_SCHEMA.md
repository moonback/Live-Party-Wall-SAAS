# 🗄️ Schéma de Base de Données - Live Party Wall

Documentation complète du schéma de base de données Supabase PostgreSQL.

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Tables principales](#-tables-principales)
- [Relations](#-relations)
- [Indexes](#-indexes)
- [Politiques RLS](#-politiques-rls)
- [Storage Buckets](#-storage-buckets)
- [Triggers](#-triggers)

---

## 🎯 Vue d'ensemble

La base de données utilise **PostgreSQL** via Supabase avec :

- ✅ **Row Level Security (RLS)** activé sur toutes les tables
- ✅ **Indexes** pour optimiser les requêtes fréquentes
- ✅ **Triggers** pour maintenir la cohérence des données
- ✅ **Foreign Keys** pour l'intégrité référentielle
- ✅ **Realtime** activé pour synchronisation temps réel

---

## 📊 Tables principales

### `events` - Événements

Table centrale pour le système multi-événements SaaS.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `slug` | TEXT | Identifiant URL unique | UNIQUE, NOT NULL |
| `name` | TEXT | Nom de l'événement | NOT NULL |
| `description` | TEXT | Description de l'événement | NULL |
| `owner_id` | UUID | Propriétaire (organisateur principal) | FK → auth.users, ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now() |
| `is_active` | BOOLEAN | Événement actif ou non | DEFAULT true |

**Exemple** :
```sql
INSERT INTO events (slug, name, description, owner_id)
VALUES ('mariage-sophie-marc', 'Mariage de Sophie et Marc', 'Union de deux âmes...', 'user-uuid');
```

---

### `photos` - Photos

Table principale pour stocker les photos/vidéos partagées.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `url` | TEXT | URL Supabase Storage | NOT NULL |
| `caption` | TEXT | Légende générée par IA | NULL |
| `author` | TEXT | Nom de l'auteur (invité) | NULL |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE |
| `type` | TEXT | Type de média | DEFAULT 'photo', CHECK (type IN ('photo', 'video')) |
| `duration` | NUMERIC | Durée en secondes (vidéos) | NULL |
| `likes_count` | INTEGER | Nombre de likes | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |

**Exemple** :
```sql
INSERT INTO photos (url, caption, author, event_id, type)
VALUES ('https://.../photo.jpg', 'Moment magique ! 💍✨', 'Sophie', 'event-uuid', 'photo');
```

---

### `guests` - Invités

Table pour gérer les invités inscrits à un événement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE |
| `name` | TEXT | Nom de l'invité | NOT NULL |
| `avatar_url` | TEXT | URL de l'avatar | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date d'inscription | DEFAULT now(), NOT NULL |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now(), NOT NULL |

**Exemple** :
```sql
INSERT INTO guests (event_id, name, avatar_url)
VALUES ('event-uuid', 'Sophie', 'https://.../avatar.jpg');
```

---

### `likes` - Likes

Table pour les likes sur les photos.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `photo_id` | UUID | Photo likée | FK → photos, ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur (nom invité) | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date du like | DEFAULT now() |

**Contrainte unique** : `UNIQUE(photo_id, user_identifier)` - Un utilisateur ne peut liker qu'une fois une photo.

**Exemple** :
```sql
INSERT INTO likes (photo_id, user_identifier)
VALUES ('photo-uuid', 'Sophie');
```

---

### `reactions` - Réactions

Table pour les réactions émojis (❤️, 😂, 🔥, etc.) sur les photos.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `photo_id` | UUID | Photo réagie | FK → photos, ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur | NOT NULL |
| `reaction_type` | TEXT | Type de réaction | NOT NULL, CHECK (reaction_type IN ('heart', 'laugh', 'cry', 'fire', 'wow', 'thumbsup')) |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now() |

**Contrainte unique** : `UNIQUE(photo_id, user_identifier)` - Un utilisateur a une seule réaction par photo (mais peut la changer).

---

### `event_settings` - Paramètres d'événement

Table pour les paramètres de configuration de chaque événement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE, UNIQUE |
| `frame_enabled` | BOOLEAN | Activer les cadres décoratifs | DEFAULT false |
| `battle_mode_enabled` | BOOLEAN | Activer le mode battle | DEFAULT false |
| `collage_mode_enabled` | BOOLEAN | Activer le mode collage | DEFAULT false |
| `video_capture_enabled` | BOOLEAN | Activer la capture vidéo | DEFAULT false |
| `stats_enabled` | BOOLEAN | Activer les statistiques | DEFAULT true |
| `ar_scene_enabled` | BOOLEAN | Activer la scène AR | DEFAULT false |
| `event_context` | TEXT | Contexte pour personnaliser les légendes IA | NULL |
| `alert_text` | TEXT | Texte d'alerte affiché sur le mur | NULL |
| ... | ... | Autres paramètres | ... |

**Contrainte unique** : `UNIQUE(event_id)` - Un seul paramètre par événement.

---

### `event_organizers` - Organisateurs

Table pour gérer les organisateurs d'un événement (multi-utilisateurs).

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE, NOT NULL |
| `user_id` | UUID | Utilisateur (organisateur) | FK → auth.users, ON DELETE CASCADE, NOT NULL |
| `role` | TEXT | Rôle de l'organisateur | NOT NULL, DEFAULT 'organizer', CHECK (role IN ('owner', 'organizer', 'viewer')) |
| `created_at` | TIMESTAMPTZ | Date d'ajout | DEFAULT now() |

**Contrainte unique** : `UNIQUE(event_id, user_id)` - Un utilisateur ne peut être organisateur qu'une fois par événement.

**Rôles** :
- `owner` : Propriétaire (peut tout faire, y compris supprimer l'événement)
- `organizer` : Organisateur (peut gérer les paramètres, modérer)
- `viewer` : Observateur (peut voir les statistiques, pas de modification)

---

### `blocked_guests` - Invités bloqués

Table pour bloquer temporairement des invités.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE |
| `name` | TEXT | Nom de l'invité bloqué | NOT NULL |
| `blocked_at` | TIMESTAMPTZ | Date de blocage | DEFAULT now(), NOT NULL |
| `expires_at` | TIMESTAMPTZ | Date d'expiration du blocage | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now(), NOT NULL |

---

### `photo_battles` - Battles photos

Table pour les battles (duels) entre photos.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE |
| `photo_a_id` | UUID | Première photo | FK → photos, ON DELETE CASCADE, NOT NULL |
| `photo_b_id` | UUID | Seconde photo | FK → photos, ON DELETE CASCADE, NOT NULL |
| `votes_a` | INTEGER | Nombre de votes pour photo A | DEFAULT 0 |
| `votes_b` | INTEGER | Nombre de votes pour photo B | DEFAULT 0 |
| `status` | TEXT | Statut de la battle | DEFAULT 'active', CHECK (status IN ('active', 'completed', 'cancelled')) |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `ended_at` | TIMESTAMPTZ | Date de fin | NULL |

---

### `battle_votes` - Votes sur les battles

Table pour enregistrer les votes des utilisateurs sur les battles.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `battle_id` | UUID | Battle associée | FK → photo_battles, ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur (nom invité) | NOT NULL |
| `voted_for_photo_id` | UUID | ID de la photo pour laquelle l'utilisateur a voté | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date du vote | DEFAULT now() |

**Contrainte unique** : `UNIQUE(battle_id, user_identifier)` - Un utilisateur ne peut voter qu'une fois par battle.

---

### `aftermovies` - Vidéos timelapse générées

Table pour stocker les aftermovies (vidéos timelapse) générés à partir des photos d'un événement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | Événement associé | FK → events, ON DELETE CASCADE, NOT NULL |
| `url` | TEXT | URL publique dans Supabase Storage | NOT NULL |
| `storage_path` | TEXT | Chemin dans Supabase Storage | NOT NULL |
| `title` | TEXT | Titre de l'aftermovie | NULL |
| `filename` | TEXT | Nom du fichier vidéo | NOT NULL |
| `file_size` | BIGINT | Taille du fichier en octets | NULL |
| `duration_seconds` | NUMERIC | Durée de la vidéo en secondes | NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `created_by` | TEXT | Nom de l'organisateur qui a créé l'aftermovie | NULL |
| `download_count` | INTEGER | Nombre de téléchargements | DEFAULT 0 |

**Exemple** :
```sql
INSERT INTO aftermovies (event_id, url, storage_path, filename, created_by)
VALUES ('event-uuid', 'https://.../aftermovie.mp4', 'aftermovies/event-uuid/video.mp4', 'aftermovie.mp4', 'Sophie');
```

---

## 🔗 Relations

### Diagramme des relations

```
auth.users
    │
    ├─── events (owner_id)
    │     │
    │     ├─── photos (event_id)
    │     │     │
    │     │     ├─── likes (photo_id)
    │     │     ├─── reactions (photo_id)
    │     │     ├─── photo_battles (photo_a_id, photo_b_id)
    │     │     └─── battle_votes (voted_for_photo_id)
    │     │
    │     ├─── guests (event_id)
    │     ├─── event_settings (event_id) [1-1]
    │     ├─── blocked_guests (event_id)
    │     ├─── aftermovies (event_id)
    │     └─── event_organizers (event_id)
    │           │
    │           └─── auth.users (user_id)
    
photo_battles
    │
    └─── battle_votes (battle_id)
```

### Relations détaillées

1. **events → photos** : 1-N
   - Un événement a plusieurs photos
   - `ON DELETE CASCADE` : Supprimer un événement supprime toutes ses photos

2. **events → guests** : 1-N
   - Un événement a plusieurs invités
   - `ON DELETE CASCADE` : Supprimer un événement supprime tous ses invités

3. **events → event_settings** : 1-1
   - Un événement a un seul paramètre
   - `UNIQUE(event_id)` garantit l'unicité

4. **photos → likes** : 1-N
   - Une photo a plusieurs likes
   - `UNIQUE(photo_id, user_identifier)` : Un utilisateur ne peut liker qu'une fois

5. **photos → reactions** : 1-N
   - Une photo a plusieurs réactions
   - `UNIQUE(photo_id, user_identifier)` : Un utilisateur a une seule réaction (modifiable)

6. **events → event_organizers** : 1-N
   - Un événement a plusieurs organisateurs
   - `UNIQUE(event_id, user_id)` : Un utilisateur ne peut être organisateur qu'une fois par événement

7. **events → aftermovies** : 1-N
   - Un événement a plusieurs aftermovies
   - `ON DELETE CASCADE` : Supprimer un événement supprime tous ses aftermovies

8. **photo_battles → battle_votes** : 1-N
   - Une battle a plusieurs votes
   - `UNIQUE(battle_id, user_identifier)` : Un utilisateur ne peut voter qu'une fois par battle

---

## 📇 Indexes

Indexes créés pour optimiser les requêtes fréquentes :

```sql
-- Events
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_owner_id ON events(owner_id);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Photos
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_type ON photos(type);
CREATE INDEX idx_photos_author ON photos(author);

-- Likes
CREATE INDEX idx_likes_photo_id ON likes(photo_id);
CREATE INDEX idx_likes_user_identifier ON likes(user_identifier);
CREATE INDEX idx_likes_photo_user ON likes(photo_id, user_identifier);

-- Reactions
CREATE INDEX idx_reactions_photo_id ON reactions(photo_id);
CREATE INDEX idx_reactions_user_identifier ON reactions(user_identifier);
CREATE INDEX idx_reactions_photo_user ON reactions(photo_id, user_identifier);

-- Guests
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_name ON guests(name);

-- Event Organizers
CREATE INDEX idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX idx_event_organizers_user_id ON event_organizers(user_id);

-- Photo Battles
CREATE INDEX idx_photo_battles_event_id ON photo_battles(event_id);
CREATE INDEX idx_photo_battles_status ON photo_battles(status);
CREATE INDEX idx_photo_battles_created_at ON photo_battles(created_at DESC);

-- Battle Votes
CREATE INDEX idx_battle_votes_battle_id ON battle_votes(battle_id);
CREATE INDEX idx_battle_votes_user_identifier ON battle_votes(user_identifier);

-- Aftermovies
CREATE INDEX idx_aftermovies_event_id ON aftermovies(event_id);
CREATE INDEX idx_aftermovies_created_at ON aftermovies(created_at DESC);
```

---

## 🔒 Politiques RLS

### Principe général

Toutes les tables ont **Row Level Security (RLS)** activé. Les politiques définissent qui peut lire/écrire/modifier/supprimer les données.

### Exemples de politiques

#### Photos - Lecture publique

```sql
CREATE POLICY "Public Read Photos"
ON photos FOR SELECT
TO anon, authenticated
USING (true);
```

**Signification** : Tout le monde (anonyme ou authentifié) peut lire les photos.

#### Photos - Insertion publique

```sql
CREATE POLICY "Public Insert Photos"
ON photos FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

**Signification** : Tout le monde peut insérer des photos.

#### Photos - Suppression admin uniquement

```sql
CREATE POLICY "Admin Delete Photos"
ON photos FOR DELETE
TO authenticated
USING (true);
```

**Signification** : Seuls les utilisateurs authentifiés (admins) peuvent supprimer des photos.

#### Event Settings - Mise à jour admin uniquement

```sql
CREATE POLICY "Admin update settings"
ON event_settings FOR UPDATE
USING (auth.role() = 'authenticated');
```

**Signification** : Seuls les utilisateurs authentifiés peuvent modifier les paramètres.

---

## 📦 Storage Buckets

### Buckets Supabase Storage

1. **`party-photos`** : Photos des invités
   - **Public** : ✅ Oui
   - **Politiques** :
     - Lecture : Public (anon + authenticated)
     - Upload : Public (anon + authenticated)
     - Suppression : Authenticated uniquement

2. **`party-frames`** : Cadres décoratifs
   - **Public** : ✅ Oui
   - **Politiques** :
     - Lecture : Public (anon + authenticated)
     - Upload : Authenticated uniquement (admins)
     - Suppression : Authenticated uniquement (admins)

3. **`party-avatars`** : Avatars des invités
   - **Public** : ✅ Oui
   - **Politiques** :
     - Lecture : Public (anon + authenticated)
     - Upload : Public (anon + authenticated)
     - Suppression : Authenticated uniquement

### Structure des fichiers

```
party-photos/
  └── {event_id}/
      └── {photo_id}.jpg

party-frames/
  └── {frame_name}.png

party-avatars/
  └── {event_id}/
      └── {guest_name}.jpg
```

---

## ⚙️ Triggers

### Trigger : Mise à jour automatique de `likes_count`

```sql
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photos
    SET likes_count = likes_count + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_photo_likes_count();
```

**Fonction** : Met à jour automatiquement le compteur `likes_count` dans la table `photos` quand un like est ajouté ou supprimé.

---

## 🔄 Realtime

### Tables avec Realtime activé

Les tables suivantes ont la réplication Realtime activée pour la synchronisation temps réel :

- ✅ `photos` : Nouvelles photos apparaissent instantanément
- ✅ `likes` : Mises à jour de likes en temps réel
- ✅ `reactions` : Réactions en temps réel
- ✅ `event_settings` : Changements de paramètres en temps réel
- ✅ `guests` : Nouveaux invités en temps réel
- ✅ `photo_battles` : Nouvelles battles et mises à jour de votes
- ✅ `battle_votes` : Votes en temps réel
- ✅ `aftermovies` : Nouveaux aftermovies disponibles

### Activation Realtime

Dans le Dashboard Supabase :
1. Allez dans **Database > Replication**
2. Activez la réplication pour les tables souhaitées

---

## 📊 Requêtes fréquentes

### Récupérer toutes les photos d'un événement

```sql
SELECT * FROM photos
WHERE event_id = 'event-uuid'
ORDER BY created_at DESC;
```

### Compter les photos par auteur

```sql
SELECT author, COUNT(*) as photo_count
FROM photos
WHERE event_id = 'event-uuid'
GROUP BY author
ORDER BY photo_count DESC;
```

### Récupérer les photos les plus likées

```sql
SELECT * FROM photos
WHERE event_id = 'event-uuid'
ORDER BY likes_count DESC
LIMIT 10;
```

### Vérifier si un utilisateur a déjà liké une photo

```sql
SELECT EXISTS(
  SELECT 1 FROM likes
  WHERE photo_id = 'photo-uuid'
  AND user_identifier = 'Sophie'
);
```

### Récupérer les aftermovies d'un événement

```sql
SELECT * FROM aftermovies
WHERE event_id = 'event-uuid'
ORDER BY created_at DESC;
```

### Compter les votes d'une battle

```sql
SELECT 
  battle_id,
  COUNT(*) FILTER (WHERE voted_for_photo_id = photo_a_id) as votes_a,
  COUNT(*) FILTER (WHERE voted_for_photo_id = photo_b_id) as votes_b
FROM battle_votes
WHERE battle_id = 'battle-uuid'
GROUP BY battle_id;
```

### Récupérer les battles actives d'un événement

```sql
SELECT * FROM photo_battles
WHERE event_id = 'event-uuid'
AND status = 'active'
ORDER BY created_at DESC;
```

---

**Dernière mise à jour** : 2026-01-15

