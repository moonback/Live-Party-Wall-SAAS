# 🗄️ Schéma de Base de Données - Partywall

Ce document décrit le schéma complet de la base de données PostgreSQL utilisée par Partywall via Supabase.

---

## 📊 Vue d'ensemble

La base de données utilise une architecture **multi-tenant SaaS** avec la table `events` comme table centrale. Toutes les autres tables sont liées à un événement via `event_id`.

### Diagramme ER simplifié

```
events (table centrale)
  ├── photos (1-N)
  │     ├── likes (1-N)
  │     ├── reactions (1-N)
  │     └── photo_battles (N-M via photo1_id/photo2_id)
  ├── guests (1-N)
  ├── event_settings (1-1)
  ├── event_organizers (1-N)
  ├── photo_battles (1-N)
  │     └── battle_votes (1-N)
  ├── aftermovies (1-N)
  └── blocked_guests (1-N)
```

---

## 📋 Tables

### `events`

Table centrale pour l'architecture multi-tenant SaaS.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `slug` | TEXT | Identifiant unique pour l'URL (ex: "mariage-sophie-marc") | UNIQUE, NOT NULL |
| `name` | TEXT | Nom de l'événement | NOT NULL |
| `description` | TEXT | Description de l'événement | NULL |
| `owner_id` | UUID | ID du propriétaire (référence auth.users) | REFERENCES auth.users(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now() |
| `is_active` | BOOLEAN | Événement actif ou non | DEFAULT true |

**Indexes** :
- `idx_events_slug` sur `slug`
- `idx_events_owner_id` sur `owner_id`
- `idx_events_is_active` sur `is_active`

**RLS** : Activé
- **SELECT** : Public (lecture pour tous)
- **INSERT** : Authenticated uniquement
- **UPDATE** : Owner/Organizer uniquement
- **DELETE** : Owner uniquement

---

### `photos`

Stocke les photos et vidéos partagées par les invités.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `url` | TEXT | URL de la photo (Supabase Storage) | NOT NULL |
| `caption` | TEXT | Légende de la photo (générée par IA ou manuelle) | NULL |
| `author` | TEXT | Nom de l'auteur | NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `type` | TEXT | Type de média ('photo' ou 'video') | DEFAULT 'photo', CHECK (type IN ('photo', 'video')) |
| `duration` | NUMERIC | Durée en secondes (pour vidéos) | NULL |
| `likes_count` | INTEGER | Nombre de likes (mis à jour via trigger) | DEFAULT 0 |
| `tags` | TEXT[] | Tags suggérés par l'IA (tableau JSON) | NULL |
| `user_description` | TEXT | Description saisie par l'utilisateur | NULL |

**Indexes** :
- `idx_photos_event_id` sur `event_id`
- `idx_photos_created_at` sur `created_at DESC`
- `idx_photos_type` sur `type`
- `idx_photos_author` sur `author`

**RLS** : Activé
- **SELECT** : Public (lecture pour tous)
- **INSERT** : Public (invités peuvent uploader)
- **UPDATE** : Authenticated uniquement
- **DELETE** : Authenticated uniquement (admin)

**Triggers** :
- `likes_count_trigger` : Met à jour `likes_count` automatiquement lors d'ajout/suppression de likes

---

### `likes`

Stocke les likes sur les photos.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `photo_id` | UUID | ID de la photo | REFERENCES photos(id) ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur (nom ou ID) | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |

**Contraintes** :
- `UNIQUE(photo_id, user_identifier)` : Un utilisateur ne peut liker qu'une fois par photo

**Indexes** :
- `idx_likes_photo_id` sur `photo_id`
- `idx_likes_user_identifier` sur `user_identifier`
- `idx_likes_photo_user` sur `(photo_id, user_identifier)`

**RLS** : Activé
- **SELECT** : Public
- **INSERT** : Public
- **DELETE** : Public (pour unlike)

---

### `reactions`

Stocke les réactions émojis sur les photos (6 types : heart, laugh, cry, fire, wow, thumbsup).

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `photo_id` | UUID | ID de la photo | REFERENCES photos(id) ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur | NOT NULL |
| `reaction_type` | TEXT | Type de réaction | NOT NULL, CHECK (reaction_type IN ('heart', 'laugh', 'cry', 'fire', 'wow', 'thumbsup')) |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now() |

**Contraintes** :
- `UNIQUE(photo_id, user_identifier)` : Un utilisateur ne peut avoir qu'une réaction par photo (modifiable)

**Indexes** :
- `idx_reactions_photo_id` sur `photo_id`
- `idx_reactions_user_identifier` sur `user_identifier`
- `idx_reactions_photo_user` sur `(photo_id, user_identifier)`

**RLS** : Activé
- **SELECT** : Public
- **INSERT** : Public
- **UPDATE** : Public (pour changer de réaction)
- **DELETE** : Public (pour retirer la réaction)

**Triggers** :
- `reactions_updated_at_trigger` : Met à jour `updated_at` automatiquement

---

### `guests`

Stocke les invités inscrits pour un événement.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `name` | TEXT | Nom de l'invité | NOT NULL |
| `avatar_url` | TEXT | URL de l'avatar (Supabase Storage) | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now(), NOT NULL |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now(), NOT NULL |

**Indexes** :
- `idx_guests_event_id` sur `event_id`
- `idx_guests_name` sur `name`
- `idx_guests_created_at` sur `created_at`

**RLS** : Activé
- **SELECT** : Public
- **INSERT** : Public (inscription invités)
- **UPDATE** : Authenticated uniquement
- **DELETE** : Authenticated uniquement (admin)

---

### `blocked_guests`

Stocke les invités temporairement bloqués.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `name` | TEXT | Nom de l'invité bloqué | NOT NULL |
| `blocked_at` | TIMESTAMPTZ | Date de blocage | DEFAULT now(), NOT NULL |
| `expires_at` | TIMESTAMPTZ | Date d'expiration du blocage | NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now(), NOT NULL |

**Indexes** :
- `idx_blocked_guests_event_id` sur `event_id`
- `idx_blocked_guests_name` sur `name`
- `idx_blocked_guests_expires_at` sur `expires_at`

**RLS** : Activé
- **SELECT** : Public (vérification si bloqué)
- **INSERT** : Authenticated uniquement (admin)
- **DELETE** : Authenticated uniquement (admin)

**Fonction** :
- `cleanup_expired_blocks()` : Nettoie automatiquement les blocages expirés

---

### `event_settings`

Stocke les paramètres de configuration pour chaque événement (relation 1-1 avec events).

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | BIGINT | Identifiant unique | PRIMARY KEY, GENERATED BY DEFAULT AS IDENTITY |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, UNIQUE, NOT NULL |
| `event_title` | TEXT | Titre de l'événement | DEFAULT 'Party Wall', NOT NULL |
| `event_subtitle` | TEXT | Sous-titre | DEFAULT 'Live', NOT NULL |
| `scroll_speed` | TEXT | Vitesse de défilement | DEFAULT 'normal', NOT NULL |
| `slide_transition` | TEXT | Type de transition | DEFAULT 'fade', NOT NULL |
| `decorative_frame_enabled` | BOOLEAN | Cadre décoratif activé | DEFAULT false, NOT NULL |
| `decorative_frame_url` | TEXT | URL du cadre décoratif | NULL |
| `caption_generation_enabled` | BOOLEAN | Génération légendes IA activée | DEFAULT true, NOT NULL |
| `content_moderation_enabled` | BOOLEAN | Modération IA activée | DEFAULT true, NOT NULL |
| `video_capture_enabled` | BOOLEAN | Capture vidéo activée | DEFAULT true, NOT NULL |
| `collage_mode_enabled` | BOOLEAN | Mode collage activé | DEFAULT true, NOT NULL |
| `stats_enabled` | BOOLEAN | Statistiques activées | DEFAULT true, NOT NULL |
| `find_me_enabled` | BOOLEAN | Recherche "Retrouve-moi" activée | DEFAULT true, NOT NULL |
| `ar_scene_enabled` | BOOLEAN | Scène AR activée | DEFAULT true, NOT NULL |
| `battle_mode_enabled` | BOOLEAN | Mode battle activé | DEFAULT true, NOT NULL |
| `auto_battles_enabled` | BOOLEAN | Battles automatiques activées | DEFAULT false, NOT NULL |
| `event_context` | TEXT | Contexte de l'événement (pour personnalisation IA) | NULL |
| `alert_text` | TEXT | Texte d'alerte affiché sur le mur | NULL |
| `caption_language` | TEXT | Langue des légendes IA | DEFAULT 'fr', NULL |
| `logo_url` | TEXT | URL du logo personnalisé | NULL |
| `logo_watermark_enabled` | BOOLEAN | Watermark logo activé | DEFAULT false, NOT NULL |
| `background_desktop_url` | TEXT | URL de l'image de fond desktop | NULL |
| `background_mobile_url` | TEXT | URL de l'image de fond mobile | NULL |
| `auto_carousel_enabled` | BOOLEAN | Carrousel automatique activé | DEFAULT false, NOT NULL |
| `auto_carousel_delay` | INTEGER | Délai carrousel en secondes (5-240) | DEFAULT 10, NULL |
| `aftermovies_enabled` | BOOLEAN | Aftermovies activés | DEFAULT true, NOT NULL |
| `tags_generation_enabled` | BOOLEAN | Génération tags IA activée | DEFAULT true, NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now(), NOT NULL |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now(), NOT NULL |

**Contraintes** :
- `UNIQUE(event_id)` : Un seul paramètre par événement

**Indexes** :
- `idx_event_settings_event_id` sur `event_id`

**RLS** : Activé
- **SELECT** : Public (lecture pour tous)
- **INSERT** : Authenticated uniquement
- **UPDATE** : Authenticated uniquement (admin)

---

### `event_organizers`

Stocke les organisateurs d'un événement avec leurs rôles.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `user_id` | UUID | ID de l'utilisateur (référence auth.users) | REFERENCES auth.users(id) ON DELETE CASCADE, NOT NULL |
| `role` | TEXT | Rôle ('owner', 'organizer', 'viewer') | DEFAULT 'organizer', NOT NULL, CHECK (role IN ('owner', 'organizer', 'viewer')) |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |

**Contraintes** :
- `UNIQUE(event_id, user_id)` : Un utilisateur ne peut avoir qu'un rôle par événement

**Indexes** :
- `idx_event_organizers_event_id` sur `event_id`
- `idx_event_organizers_user_id` sur `user_id`
- `idx_event_organizers_role` sur `role`

**RLS** : Activé
- **SELECT** : Authenticated uniquement (voir ses événements)
- **INSERT** : Owner uniquement (ajouter organisateurs)
- **UPDATE** : Owner uniquement (changer rôles)
- **DELETE** : Owner uniquement (retirer organisateurs)

**Rôles** :
- **owner** : Propriétaire, tous les droits
- **organizer** : Organisateur, peut gérer l'événement (sauf suppression)
- **viewer** : Visualiseur, lecture seule

---

### `photo_battles`

Stocke les battles (duels) entre photos.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `photo1_id` | UUID | ID de la première photo | REFERENCES photos(id) ON DELETE CASCADE, NOT NULL |
| `photo2_id` | UUID | ID de la deuxième photo | REFERENCES photos(id) ON DELETE CASCADE, NOT NULL |
| `status` | TEXT | Statut ('active', 'finished', 'cancelled') | DEFAULT 'active', NOT NULL, CHECK (status IN ('active', 'finished', 'cancelled')) |
| `winner_id` | UUID | ID de la photo gagnante | REFERENCES photos(id) ON DELETE SET NULL, NULL |
| `votes1_count` | INTEGER | Nombre de votes pour photo1 | DEFAULT 0, NOT NULL |
| `votes2_count` | INTEGER | Nombre de votes pour photo2 | DEFAULT 0, NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `finished_at` | TIMESTAMPTZ | Date de fin | NULL |
| `expires_at` | TIMESTAMPTZ | Date d'expiration (auto-finish) | NULL |

**Contraintes** :
- `CHECK (photo1_id != photo2_id)` : Les deux photos doivent être différentes

**Indexes** :
- `idx_photo_battles_event_id` sur `event_id`
- `idx_photo_battles_status` sur `status`
- `idx_photo_battles_created_at` sur `created_at DESC`
- `idx_photo_battles_expires_at` sur `expires_at` WHERE `expires_at IS NOT NULL`

**RLS** : Activé
- **SELECT** : Public
- **INSERT** : Public (création de battles)
- **UPDATE** : Public (mise à jour votes, statut)

**Fonction** :
- `finish_battle_if_expired()` : Termine automatiquement les battles expirées

---

### `battle_votes`

Stocke les votes sur les battles.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `battle_id` | UUID | ID de la battle | REFERENCES photo_battles(id) ON DELETE CASCADE, NOT NULL |
| `user_identifier` | TEXT | Identifiant utilisateur | NOT NULL |
| `voted_for_photo_id` | UUID | ID de la photo pour laquelle l'utilisateur a voté | REFERENCES photos(id) ON DELETE CASCADE, NOT NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |

**Contraintes** :
- `UNIQUE(battle_id, user_identifier)` : Un utilisateur ne peut voter qu'une fois par battle

**Indexes** :
- `idx_battle_votes_battle_id` sur `battle_id`
- `idx_battle_votes_user_identifier` sur `user_identifier`
- `idx_battle_votes_battle_user` sur `(battle_id, user_identifier)`

**RLS** : Activé
- **SELECT** : Public
- **INSERT** : Public (voter)

**Triggers** :
- `battle_votes_count_trigger` : Met à jour `votes1_count` ou `votes2_count` automatiquement

---

### `aftermovies`

Stocke les aftermovies (vidéos timelapse) générés.

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | UUID | ID de l'événement | REFERENCES events(id) ON DELETE CASCADE, NOT NULL |
| `url` | TEXT | URL publique de l'aftermovie (Supabase Storage) | NOT NULL |
| `storage_path` | TEXT | Chemin dans le bucket Supabase Storage | NOT NULL |
| `title` | TEXT | Titre de l'aftermovie | NULL |
| `filename` | TEXT | Nom du fichier | NOT NULL |
| `file_size` | BIGINT | Taille du fichier en octets | NULL |
| `duration_seconds` | NUMERIC | Durée de la vidéo en secondes | NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now(), NOT NULL |
| `created_by` | TEXT | Nom de l'organisateur/admin qui a créé l'aftermovie | NULL |
| `download_count` | INTEGER | Nombre de téléchargements | DEFAULT 0, NULL |

**Indexes** :
- `idx_aftermovies_event_id` sur `event_id`
- `idx_aftermovies_created_at` sur `created_at DESC`

**RLS** : Activé
- **SELECT** : Public (lecture pour tous)
- **INSERT** : Authenticated uniquement (admin)
- **UPDATE** : Authenticated uniquement (admin)
- **DELETE** : Authenticated uniquement (admin)

---

## 🗂️ Storage Buckets

### `party-photos`

Stocke les photos des invités et les aftermovies.

- **Politique lecture** : Public (tous peuvent lire)
- **Politique upload** : Public pour photos invités, Authenticated pour aftermovies
- **Politique suppression** : Authenticated uniquement (admin)

### `party-frames`

Stocke les cadres décoratifs.

- **Politique lecture** : Public
- **Politique upload** : Authenticated uniquement (admin)
- **Politique suppression** : Authenticated uniquement (admin)

### `party-avatars`

Stocke les avatars des invités.

- **Politique lecture** : Public
- **Politique upload** : Public (invités peuvent uploader)
- **Politique suppression** : Authenticated uniquement

### `party-backgrounds`

Stocke les images de fond et logos.

- **Politique lecture** : Public
- **Politique upload** : Authenticated uniquement (admin)
- **Politique suppression** : Authenticated uniquement (admin)

---

## 🔄 Triggers et Fonctions

### `update_photo_likes_count()`

Met à jour automatiquement `likes_count` dans la table `photos` lors d'ajout/suppression de likes.

**Déclenché par** : INSERT/DELETE sur `likes`

### `update_battle_votes_count()`

Met à jour automatiquement `votes1_count` ou `votes2_count` dans la table `photo_battles` lors d'ajout/suppression de votes.

**Déclenché par** : INSERT/DELETE sur `battle_votes`

### `update_reactions_updated_at()`

Met à jour automatiquement `updated_at` dans la table `reactions` lors de modification.

**Déclenché par** : UPDATE sur `reactions`

### `finish_battle_if_expired()`

Termine automatiquement les battles expirées (statut 'active' → 'finished').

**Appel manuel** : Via cron job ou appel périodique

### `cleanup_expired_blocks()`

Nettoie automatiquement les blocages expirés dans `blocked_guests`.

**Appel manuel** : Via cron job ou appel périodique

### `get_photo_reactions(photo_uuid)`

Fonction SQL qui retourne les compteurs de réactions par type pour une photo.

**Retour** : `JSONB` avec structure `{ reaction_type: count }`

---

## 🔒 Sécurité (RLS)

Toutes les tables ont **Row Level Security (RLS) activé** avec des politiques granulaires :

- **Lecture publique** : Photos, événements actifs, guests (pour invités)
- **Insertion publique** : Photos, likes, réactions (pour invités)
- **Modification authentifiée** : Suppression photos, gestion événements (admin uniquement)
- **Isolation multi-tenant** : Toutes les requêtes filtrent par `event_id`

---

## 📊 Indexes

Les indexes sont optimisés pour :
- **Recherches par événement** : `event_id` sur toutes les tables
- **Tri chronologique** : `created_at DESC` sur photos, battles, aftermovies
- **Recherches par utilisateur** : `user_identifier` sur likes, reactions, battle_votes
- **Unicité** : Indexes composites pour contraintes UNIQUE

---

## 🔄 Realtime

Les tables suivantes sont publiées dans Supabase Realtime pour synchronisation automatique :

- `photos` : Nouvelles photos, suppressions
- `likes` : Ajout/suppression de likes
- `reactions` : Ajout/modification/suppression de réactions
- `event_settings` : Changements de paramètres
- `guests` : Nouveaux invités
- `photo_battles` : Création, votes, résultats
- `battle_votes` : Nouveaux votes
- `aftermovies` : Nouveaux aftermovies générés

---

## 📚 Migration

Le schéma est créé via le script `supabase/supabase_complete_setup.sql`.

Pour appliquer les migrations :
1. Ouvrir Supabase Dashboard > SQL Editor
2. Exécuter `supabase/supabase_complete_setup.sql`
3. Activer Realtime pour les tables nécessaires (Database > Replication)

---

**Dernière mise à jour** : 2026-01-15

