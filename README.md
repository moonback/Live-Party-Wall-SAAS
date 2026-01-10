# Live Party Wall

Application web SaaS de mur photo interactif en temps réel pour événements, enrichie par l'intelligence artificielle.

## Présentation

Live Party Wall est une plateforme SaaS permettant aux organisateurs d'événements de créer un mur photo interactif où les invités peuvent partager instantanément leurs photos sur grand écran. L'application utilise Google Gemini pour modérer automatiquement le contenu, générer des légendes personnalisées et améliorer la qualité des images.

### Vision et objectif

Transformer chaque événement en expérience mémorable en permettant aux invités de devenir des créateurs de contenu. Les photos apparaissent instantanément sur grand écran, enrichies par l'IA, créant une animation collective et engageante.

**Cas d'usage principaux** : Mariages, événements d'entreprise, anniversaires, soirées privées, team building, séminaires, conférences.

## Stack technique

### Frontend

- **React 19.2** : Framework UI avec composants fonctionnels, Hooks, Suspense et Lazy Loading
- **TypeScript 5.8** : Typage strict, configuration avec `noImplicitAny` et `strictNullChecks`
- **Vite 6.2** : Build tool avec Hot Module Replacement (HMR)
- **Tailwind CSS 4.1** : Framework CSS utility-first pour le styling
- **Framer Motion 12.24** : Bibliothèque d'animations fluides et performantes
- **Lucide React 0.562** : Bibliothèque d'icônes moderne

### Backend et infrastructure

- **Supabase** : Backend-as-a-Service complet
  - **PostgreSQL** : Base de données relationnelle avec Row Level Security (RLS)
  - **Storage** : Stockage de fichiers (photos, cadres décoratifs, avatars) avec buckets publics
  - **Realtime** : Synchronisation temps réel via WebSockets pour photos, likes, réactions
  - **Auth** : Authentification JWT avec email/password pour les organisateurs

- **Google Gemini 3 Flash** : Intelligence artificielle pour
  - Modération automatique de contenu
  - Génération de légendes personnalisées selon le contexte d'événement
  - Analyse de qualité d'images
  - Génération de tags sémantiques

### Outils et bibliothèques

- **JSZip 3.10** : Export de fichiers ZIP pour téléchargement groupé
- **File Saver 2.0** : Téléchargement de fichiers côté client
- **QRCode React 4.2** : Génération de QR codes pour téléchargement
- **Face-api.js 0.22** : Reconnaissance faciale pour fonctionnalité "Retrouve-moi"
- **@tanstack/react-virtual 3.13** : Virtualisation pour performances avec grandes listes
- **Zod 4.3** : Validation de schémas TypeScript

### Développement et build

- **Electron 39.2** : Application desktop optionnelle
- **Vite Plugin Electron 0.29** : Intégration Electron avec Vite
- **Cross-env 10.1** : Gestion des variables d'environnement multiplateforme

## Architecture du projet

### Structure des dossiers

```
components/          # Composants React organisés par fonctionnalité
├── landing/        # Landing page SaaS avec sections marketing
├── gallery/        # Galerie de photos avec filtres et recherche
├── projection/    # Mode projection optimisé grand écran
├── wall/           # Mur interactif avec masonry layout
├── stats/          # Statistiques et analytics
├── admin/          # Dashboard administrateur
├── photobooth/     # Composants photobooth avec caméra
├── arEffects/      # Effets AR (feux d'artifice)
├── mobileControl/  # Interface de contrôle mobile
└── onboarding/     # Onboarding utilisateur

context/            # Contextes React pour état global
├── AuthContext.tsx      # Authentification organisateurs
├── EventContext.tsx     # Gestion événements multi-tenant
├── PhotosContext.tsx    # Gestion photos avec Realtime
├── SettingsContext.tsx  # Paramètres d'événement
└── ToastContext.tsx     # Système de notifications

services/           # Couche service (logique métier isolée)
├── supabaseClient.ts        # Client Supabase configuré
├── photoService.ts           # CRUD photos, likes, réactions
├── eventService.ts           # Gestion événements, organisateurs
├── guestService.ts           # Gestion invités, blocage
├── geminiService.ts          # Intégration Google Gemini
├── settingsService.ts        # Paramètres d'événement
├── battleService.ts          # Battles photos
├── exportService.ts         # Export ZIP
├── aftermovieService.ts      # Génération vidéos timelapse
├── photoboothService.ts      # Upload photobooth avec traitement
├── faceRecognitionService.ts # Reconnaissance faciale
├── frameService.ts           # Gestion cadres décoratifs
└── gamificationService.ts    # Badges, classements

utils/              # Utilitaires réutilisables
├── validation.ts       # Validation de données
├── imageFilters.ts     # Filtres d'image
├── imageOverlay.ts     # Overlays et cadres
├── logger.ts           # Logging structuré
└── ...

hooks/               # Hooks React personnalisés
├── useIsMobile.ts           # Détection mobile
├── useImageCompression.ts   # Compression d'images
├── useDebounce.ts           # Debounce pour recherche
├── useCamera.ts            # Gestion caméra
└── wall/                   # Hooks spécifiques au mur
    ├── useAutoCarousel.ts   # Carrousel automatique
    ├── useWallBattles.ts    # Gestion battles
    └── ...

supabase/            # Scripts SQL Supabase
├── supabase_complete_setup.sql  # Setup complet (recommandé)
├── supabase_events_migration.sql # Migration multi-événements
└── ...                        # Autres migrations

electron/            # Code Electron (desktop)
├── main.ts         # Processus principal
├── preload.ts      # Script preload
└── types.d.ts      # Types Electron

workers/             # Web Workers
└── imageCompression.worker.ts # Compression d'images

public/              # Assets statiques
├── cadres/         # Cadres décoratifs PNG
├── models/         # Modèles IA (face-api)
└── sounds/         # Sons et effets audio
```

### Patterns architecturaux

#### Service Layer Pattern

Toute la logique métier est isolée dans `/services`. Les composants restent "stupides" et délèguent aux services.

```typescript
// services/photoService.ts
export const addPhotoToWall = async (
  eventId: string,
  base64Image: string,
  caption: string,
  author: string
): Promise<Photo> => {
  // Logique métier isolée
};

// components/GuestUpload.tsx
const handleUpload = async () => {
  const photo = await addPhotoToWall(eventId, image, caption, author);
  // ...
};
```

#### Context API pour état global

L'état global est géré via Context API React :
- `EventContext` : Événement actuel, multi-tenant
- `PhotosContext` : Liste des photos avec abonnements Realtime
- `SettingsContext` : Paramètres d'événement
- `AuthContext` : Authentification organisateurs
- `ToastContext` : Notifications utilisateur

#### Lazy Loading

Tous les composants principaux sont lazy-loaded pour optimiser le chargement initial :

```typescript
const WallView = lazy(() => import('./components/WallView'));
const GuestUpload = lazy(() => import('./components/GuestUpload'));
```

#### Routing manuel

Le routing est géré manuellement via paramètres d'URL (`?mode=guest`, `?mode=wall`, etc.) plutôt qu'avec React Router.

## Fonctionnalités détaillées

### Fonctionnalités principales

#### Pour les invités

1. **Upload de photos**
   - Prise de photo directe via caméra
   - Upload depuis galerie
   - Support vidéos courtes (max 20 secondes)
   - Compression automatique avant upload
   - Validation de taille et type MIME

2. **Mode collage**
   - Assemblage de 2 à 4 photos
   - Templates prédéfinis (grille, carré, etc.)
   - Prévisualisation en temps réel
   - Upload du collage comme une seule photo

3. **Photobooth interactif**
   - Capture photo/vidéo avec caméra
   - Filtres d'image en temps réel
   - Cadres décoratifs (Polaroid, néon, or)
   - Mode rafale (burst mode)
   - Compte à rebours pour capture

4. **Galerie interactive**
   - Parcours de toutes les photos de l'événement
   - Filtres par auteur, type (photo/vidéo), popularité
   - Recherche textuelle
   - Tri par date ou popularité
   - Virtualisation pour performances avec grandes listes

5. **Système de likes et réactions**
   - Like simple (coeur)
   - Réactions émojis multiples (coeur, rire, pleurs, feu, wow, pouce)
   - Une réaction par utilisateur (modifiable)
   - Compteurs en temps réel via Realtime

6. **Profil utilisateur**
   - Création de profil avec nom et avatar
   - Statistiques personnelles (nombre de photos, likes reçus)
   - Badges de gamification
   - Historique des photos uploadées

7. **Recherche IA "Retrouve-moi"**
   - Reconnaissance faciale via face-api.js
   - Recherche de photos contenant l'utilisateur
   - Filtrage intelligent par visage

8. **Téléchargement**
   - Téléchargement individuel de photos
   - Export ZIP de toutes les photos
   - QR code pour téléchargement rapide

#### Pour les organisateurs

1. **Dashboard administrateur**
   - Vue d'ensemble de l'événement
   - Statistiques en temps réel (photos, likes, invités)
   - Gestion des événements multiples (SaaS)

2. **Gestion d'événements**
   - Création, modification, suppression d'événements
   - Slug unique par événement pour URLs partageables
   - Description et métadonnées
   - Statut actif/inactif

3. **Gestion d'équipe**
   - Ajout d'organisateurs avec rôles (owner, organizer, viewer)
   - Permissions granulaires par rôle
   - Multi-utilisateurs par événement

4. **Modération**
   - Liste de toutes les photos uploadées
   - Suppression de photos inappropriées
   - Blocage temporaire d'invités
   - Historique des actions de modération

5. **Paramètres d'événement**
   - Activation/désactivation de fonctionnalités
   - Configuration du contexte pour légendes IA
   - Messages d'alerte affichés sur le mur
   - Images de fond personnalisées (desktop/mobile)
   - Vitesse de défilement
   - Délai d'activation du carrousel automatique (5-240 secondes)

6. **Mode projection**
   - Affichage optimisé pour grand écran
   - Transitions automatiques entre photos
   - Contrôles de lecture (pause, vitesse)
   - Mode plein écran
   - Carrousel automatique après inactivité

7. **Statistiques et analytics**
   - Nombre total de photos
   - Nombre de likes et réactions
   - Nombre d'invités inscrits
   - Top photographes (classement)
   - Photos les plus likées
   - Badges attribués
   - Résultats des battles

8. **Battles photos**
   - Création manuelle de battles (duels entre 2 photos)
   - Battles automatiques basées sur critères
   - Système de votes en temps réel
   - Affichage des résultats
   - Projection des résultats sur grand écran

9. **Export et aftermovie**
   - Export ZIP de toutes les photos HD
   - Génération automatique de vidéos timelapse (aftermovie)
   - Options de personnalisation (fps, transitions, cadres)
   - Téléchargement des vidéos générées

10. **Contrôle mobile**
    - Interface optimisée mobile pour organisateurs
    - Gestion rapide des photos
    - Modération simplifiée
    - Statistiques en temps réel
    - Création de battles

### Fonctionnalités secondaires

1. **Gamification**
   - Badges automatiques (photographe, star photo)
   - Classements par nombre de photos, likes
   - Podium des meilleurs photographes
   - Système de points implicite

2. **Effets AR (Réalité augmentée)**
   - Feux d'artifice déclenchés automatiquement
   - Seuils configurables (nombre de likes)
   - Fenêtres temporelles (ouverture/fermeture événement)

3. **Cadres décoratifs**
   - Bibliothèque de cadres (Polaroid, néon, or, etc.)
   - Upload de cadres personnalisés
   - Application automatique sur photos
   - Catégories de cadres

4. **Système d'alertes**
   - Messages d'alerte affichés sur le mur
   - Messages rapides prédéfinis
   - Personnalisation complète

5. **Onboarding utilisateur**
   - Création de profil simplifiée
   - Upload d'avatar
   - Validation de nom

6. **Page d'aide**
   - Documentation utilisateur
   - FAQ
   - Guide d'utilisation

### Fonctionnalités temps réel

Toutes les fonctionnalités suivantes utilisent Supabase Realtime (WebSockets) :

1. **Nouvelles photos** : Apparition instantanée sur le mur et la galerie
2. **Likes** : Mise à jour en temps réel des compteurs
3. **Réactions** : Synchronisation immédiate des réactions émojis
4. **Paramètres** : Changements de configuration propagés instantanément
5. **Battles** : Votes et résultats en temps réel
6. **Invités** : Nouveaux inscrits visibles immédiatement
7. **Statistiques** : Mise à jour automatique des compteurs

### Fonctionnalités IA

1. **Modération automatique**
   - Analyse de contenu via Google Gemini
   - Détection de contenu inapproprié
   - Rejet automatique avec message explicatif
   - Toujours activée (non désactivable)

2. **Génération de légendes**
   - Légendes personnalisées selon type d'événement
   - Analyse du contenu visible de la photo
   - Adaptation au contexte (mariage, anniversaire, etc.)
   - Style électrique, drôle, chaleureux
   - Maximum 12 mots, en français uniquement

3. **Génération de tags**
   - Tags sémantiques automatiques
   - Amélioration de la recherche
   - Catégorisation intelligente

4. **Amélioration de qualité**
   - Analyse de qualité d'image
   - Amélioration automatique si qualité faible
   - Optimisation pour affichage

5. **Contexte d'événement**
   - Suggestion de contexte par IA
   - Personnalisation des légendes selon contexte
   - Détection automatique du type d'événement

## Schéma logique de la base de données

### Tables principales

**events** : Table centrale pour architecture SaaS multi-événements
- `id` (UUID, PK) : Identifiant unique
- `slug` (TEXT, UNIQUE) : Identifiant URL (ex: "mariage-sophie-marc")
- `name` (TEXT) : Nom de l'événement
- `description` (TEXT) : Description optionnelle
- `owner_id` (UUID, FK → auth.users) : Propriétaire principal
- `created_at`, `updated_at` (TIMESTAMPTZ) : Métadonnées
- `is_active` (BOOLEAN) : Statut actif/inactif

**photos** : Photos et vidéos partagées
- `id` (UUID, PK)
- `url` (TEXT) : URL Supabase Storage
- `caption` (TEXT) : Légende générée par IA
- `author` (TEXT) : Nom de l'invité
- `event_id` (UUID, FK → events, ON DELETE CASCADE)
- `type` (TEXT) : 'photo' ou 'video'
- `duration` (NUMERIC) : Durée en secondes (vidéos)
- `likes_count` (INTEGER) : Compteur de likes (maintenu par trigger)
- `tags` (TEXT[]) : Tags générés par IA (tableau JSON)
- `created_at` (TIMESTAMPTZ)

**guests** : Invités inscrits à un événement
- `id` (UUID, PK)
- `event_id` (UUID, FK → events, ON DELETE CASCADE)
- `name` (TEXT, NOT NULL) : Nom de l'invité
- `avatar_url` (TEXT, NOT NULL) : URL de l'avatar
- `created_at`, `updated_at` (TIMESTAMPTZ)

**likes** : Likes sur les photos
- `id` (UUID, PK)
- `photo_id` (UUID, FK → photos, ON DELETE CASCADE)
- `user_identifier` (TEXT) : Nom de l'invité
- `created_at` (TIMESTAMPTZ)
- Contrainte UNIQUE(photo_id, user_identifier)

**reactions** : Réactions émojis sur les photos
- `id` (UUID, PK)
- `photo_id` (UUID, FK → photos, ON DELETE CASCADE)
- `user_identifier` (TEXT) : Nom de l'invité
- `reaction_type` (TEXT) : 'heart', 'laugh', 'cry', 'fire', 'wow', 'thumbsup'
- `created_at`, `updated_at` (TIMESTAMPTZ)
- Contrainte UNIQUE(photo_id, user_identifier)

**event_settings** : Paramètres de configuration par événement
- `id` (UUID, PK)
- `event_id` (UUID, FK → events, UNIQUE, ON DELETE CASCADE)
- `auto_carousel_enabled` (BOOLEAN) : Carrousel automatique
- `auto_carousel_delay` (INTEGER) : Délai en secondes (5-240)
- `battle_mode_enabled` (BOOLEAN) : Mode battle
- `collage_mode_enabled` (BOOLEAN) : Mode collage
- `video_capture_enabled` (BOOLEAN) : Capture vidéo
- `stats_enabled` (BOOLEAN) : Statistiques
- `find_me_enabled` (BOOLEAN) : Recherche IA
- `ar_scene_enabled` (BOOLEAN) : Effets AR
- `caption_generation_enabled` (BOOLEAN) : Génération légendes
- `tags_generation_enabled` (BOOLEAN) : Génération tags
- `decorative_frame_enabled` (BOOLEAN) : Cadres décoratifs
- `decorative_frame_url` (TEXT) : URL du cadre
- `event_context` (TEXT) : Contexte pour personnalisation IA
- `alert_text` (TEXT) : Message d'alerte
- `background_desktop_url` (TEXT) : Fond desktop
- `background_mobile_url` (TEXT) : Fond mobile
- `scroll_speed` (TEXT) : 'slow', 'normal', 'fast'
- `slide_transition` (TEXT) : 'fade', 'slide', 'zoom'

**event_organizers** : Organisateurs d'un événement (multi-utilisateurs)
- `id` (UUID, PK)
- `event_id` (UUID, FK → events, ON DELETE CASCADE)
- `user_id` (UUID, FK → auth.users, ON DELETE CASCADE)
- `role` (TEXT) : 'owner', 'organizer', 'viewer'
- `created_at` (TIMESTAMPTZ)
- Contrainte UNIQUE(event_id, user_id)

**blocked_guests** : Invités bloqués temporairement
- `id` (UUID, PK)
- `event_id` (UUID, FK → events, ON DELETE CASCADE)
- `name` (TEXT) : Nom de l'invité bloqué
- `blocked_at` (TIMESTAMPTZ) : Date de blocage
- `expires_at` (TIMESTAMPTZ) : Date d'expiration

**photo_battles** : Battles (duels) entre photos
- `id` (UUID, PK)
- `event_id` (UUID, FK → events, ON DELETE CASCADE)
- `photo_a_id` (UUID, FK → photos, ON DELETE CASCADE)
- `photo_b_id` (UUID, FK → photos, ON DELETE CASCADE)
- `votes_a` (INTEGER) : Votes pour photo A
- `votes_b` (INTEGER) : Votes pour photo B
- `status` (TEXT) : 'active', 'completed', 'cancelled'
- `created_at` (TIMESTAMPTZ)
- `ended_at` (TIMESTAMPTZ) : Date de fin

**battle_votes** : Votes sur les battles
- `id` (UUID, PK)
- `battle_id` (UUID, FK → photo_battles, ON DELETE CASCADE)
- `user_identifier` (TEXT) : Nom de l'invité
- `voted_for_photo_id` (UUID) : Photo votée
- `created_at` (TIMESTAMPTZ)
- Contrainte UNIQUE(battle_id, user_identifier)

### Relations

- **events → photos** : 1-N (un événement a plusieurs photos)
- **events → guests** : 1-N (un événement a plusieurs invités)
- **events → event_settings** : 1-1 (un événement a un seul paramètre)
- **events → event_organizers** : 1-N (un événement a plusieurs organisateurs)
- **photos → likes** : 1-N (une photo a plusieurs likes)
- **photos → reactions** : 1-N (une photo a plusieurs réactions)
- **photos → photo_battles** : 1-N (une photo peut participer à plusieurs battles)
- **auth.users → events** : 1-N (un utilisateur peut créer plusieurs événements)
- **auth.users → event_organizers** : 1-N (un utilisateur peut être organisateur de plusieurs événements)

### Indexes

Indexes créés pour optimiser les requêtes fréquentes :
- `idx_events_slug` : Recherche par slug
- `idx_events_owner_id` : Filtrage par propriétaire
- `idx_photos_event_id` : Filtrage par événement
- `idx_photos_created_at` : Tri par date
- `idx_photos_author` : Filtrage par auteur
- `idx_likes_photo_id` : Jointures likes
- `idx_likes_photo_user` : Vérification like existant
- `idx_reactions_photo_id` : Jointures réactions
- `idx_guests_event_id` : Filtrage invités par événement

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec politiques spécifiques :

- **Lecture publique** : Photos, événements actifs, invités (pour affichage)
- **Insertion publique** : Photos, likes, réactions (pour invités)
- **Modification authentifiée** : Paramètres, événements (pour organisateurs)
- **Suppression authentifiée** : Photos, événements (pour organisateurs)

### Storage Buckets

Trois buckets Supabase Storage :

1. **party-photos** : Photos des invités
   - Public en lecture
   - Upload public (invités)
   - Suppression authentifiée uniquement
   - Structure : `{event_id}/{photo_id}.jpg`

2. **party-frames** : Cadres décoratifs
   - Public en lecture
   - Upload authentifié uniquement (organisateurs)
   - Suppression authentifiée uniquement
   - Structure : `{frame_name}.png`

3. **party-avatars** : Avatars des invités
   - Public en lecture
   - Upload public (invités)
   - Suppression authentifiée uniquement
   - Structure : `{event_id}/{guest_name}.jpg`

## Installation locale

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- Compte **Supabase** avec projet créé
- Clé API **Google Gemini**

### Étapes d'installation

#### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/Live-Party-Wall-SAAS.git
cd Live-Party-Wall-SAAS
```

#### 2. Installer les dépendances

```bash
npm install
```

#### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
GEMINI_API_KEY=votre_cle_api_gemini
```

**Où trouver ces valeurs** :

- **Supabase** : Dashboard Supabase > Settings > API
  - Project URL → `VITE_SUPABASE_URL`
  - anon/public key → `VITE_SUPABASE_ANON_KEY`

- **Google Gemini** : [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Créez une nouvelle clé API → `GEMINI_API_KEY`

#### 4. Initialiser la base de données Supabase

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Ouvrez l'éditeur SQL de votre projet
3. Exécutez le script de setup complet :

```sql
-- Copiez et exécutez le contenu de :
supabase/supabase_complete_setup.sql
```

Ce script crée :
- Toutes les tables nécessaires
- Les indexes pour performances
- Les politiques RLS
- Les triggers pour compteurs automatiques
- Les buckets Storage avec politiques

#### 5. Activer Realtime

1. Dans Supabase Dashboard, allez dans **Database > Replication**
2. Activez la réplication pour les tables suivantes :
   - `photos`
   - `likes`
   - `reactions`
   - `event_settings`
   - `guests`
   - `photo_battles`

#### 6. Créer un compte administrateur

1. Dans Supabase Dashboard, allez dans **Authentication > Users**
2. Cliquez sur **"Add user"** ou **"Invite user"**
3. Créez un compte avec email et mot de passe
4. Notez ces identifiants pour vous connecter à l'admin

#### 7. Télécharger les modèles Face API (optionnel)

Si vous utilisez la fonctionnalité "Retrouve-moi" :

```bash
npm run download:face-models
```

Les modèles seront téléchargés dans `public/models/face-api/`.

## Variables d'environnement

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (publique) Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GEMINI_API_KEY` | Clé API Google Gemini | `AIzaSy...` |

### Notes importantes

- Le préfixe `VITE_` est requis pour que les variables soient accessibles côté client
- Le fichier `.env` ne doit jamais être versionné (déjà dans `.gitignore`)
- Pour la production, configurez les variables d'environnement sur votre plateforme de déploiement
- Ne partagez jamais vos clés API publiquement

## Lancement du projet

### Mode développement (Web)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

Le serveur écoute sur toutes les interfaces (`0.0.0.0`), vous pouvez donc y accéder depuis d'autres appareils sur le même réseau local.

### Mode développement (Electron)

Pour lancer l'application en mode desktop :

```bash
npm run electron:dev
```

### Build de production

#### Build web (SPA)

```bash
npm run build
```

Les fichiers de production seront générés dans `dist/`.

#### Build Electron

```bash
# Build uniquement (sans packager)
npm run electron:build

# Build + Package (créer les installateurs)
npm run electron:pack
```

Les installateurs seront générés dans `release/` :
- Windows : `Live Party Wall Setup X.X.X.exe`
- macOS : `Live Party Wall-X.X.X.dmg`
- Linux : `Live Party Wall-X.X.X.AppImage` et `.deb`

### Prévisualisation du build

```bash
npm run preview
```

### Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement web |
| `npm run build` | Build de production web |
| `npm run preview` | Prévisualise le build de production |
| `npm run electron:dev` | Lance Electron en mode développement |
| `npm run electron:build` | Build Electron |
| `npm run electron:pack` | Build + Package Electron |
| `npm run generate:icons` | Génère les icônes pour Electron |
| `npm run download:face-models` | Télécharge les modèles Face API |

## Sécurité et bonnes pratiques

### Sécurité implémentée

1. **Row Level Security (RLS)** : Toutes les tables Supabase ont RLS activé avec politiques granulaires
2. **Validation côté client** : Validation de taille, type MIME, longueur de texte
3. **Modération IA** : Toujours activée, non désactivable
4. **Authentification JWT** : Gestion automatique par Supabase
5. **Variables d'environnement** : Secrets stockés dans `.env`, jamais dans le code
6. **HTTPS** : Toutes les communications avec Supabase en HTTPS
7. **Sanitization** : Nettoyage des inputs utilisateur

### Bonnes pratiques de code

1. **TypeScript strict** : Configuration avec `strict: true` et toutes les options strictes activées
2. **Service Layer** : Logique métier isolée dans services, composants "stupides"
3. **Gestion d'erreurs** : Try/catch avec fallbacks pour services IA
4. **Logging structuré** : Utilisation de `logger` pour traçabilité
5. **Lazy Loading** : Tous les composants principaux lazy-loaded
6. **Virtualisation** : Utilisation de `@tanstack/react-virtual` pour grandes listes
7. **Compression** : Compression automatique des images avant upload

## Scalabilité et évolutions possibles

### Architecture actuelle

- **Frontend** : SPA React, peut être déployé sur CDN (Vercel, Netlify, Cloudflare Pages)
- **Backend** : Supabase (PostgreSQL, Storage, Realtime) - scalable automatiquement
- **IA** : Google Gemini API - quota géré par Google

### Optimisations possibles

1. **Cache** : Mise en cache des résultats Gemini pour éviter appels répétés
2. **CDN** : Utilisation d'un CDN pour assets statiques (cadres, modèles)
3. **Pagination** : Pagination côté serveur pour grandes listes de photos
4. **Compression** : Compression supplémentaire des images côté serveur
5. **Rate limiting** : Limitation de taux pour uploads (déjà partiellement géré par Supabase)

### Évolutions futures

1. **Tests automatisés** : Unit tests (Jest/Vitest), E2E (Playwright)
2. **Monitoring** : Intégration Sentry pour error tracking
3. **Analytics** : Intégration Google Analytics ou Plausible
4. **Notifications push** : Notifications navigateur pour nouvelles photos
5. **Multi-langues** : Internationalisation (i18n)
6. **Thèmes** : Système de thèmes personnalisables
7. **API REST** : Exposition d'une API REST pour intégrations tierces
8. **Webhooks** : Webhooks pour événements (nouvelle photo, battle terminée)

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE.md](./LICENSE.md) pour plus de détails.

## Documentation complémentaire

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture détaillée du système
- **[API_DOCS.md](./API_DOCS.md)** : Documentation complète des services et API
- **[DB_SCHEMA.md](./DB_SCHEMA.md)** : Schéma de la base de données Supabase
- **[ROADMAP.md](./ROADMAP.md)** : Feuille de route et fonctionnalités futures
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** : Guide de contribution au projet
