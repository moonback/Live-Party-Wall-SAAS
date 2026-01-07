# 📸 Live Party Wall

> **L'expérience photobooth interactive et intelligente pour vos événements.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=google)](https://deepmind.google/technologies/gemini/)

**Version actuelle** : 1.0.1

---

## 🎯 Vue d'Ensemble

**Live Party Wall** est une application web SaaS en temps réel qui transforme chaque invité d'un événement en créateur de contenu. Les photos et vidéos partagées apparaissent instantanément sur grand écran, enrichies par l'intelligence artificielle (Google Gemini) qui modère, améliore et légende automatiquement chaque média.

### 💡 Proposition de Valeur

- **Zéro installation** : 100% web, aucune application à télécharger
- **Temps réel** : Affichage instantané sur grand écran via WebSockets (Supabase Realtime)
- **IA intégrée** : Modération automatique, amélioration d'images et légendes contextuelles personnalisées
- **Engagement maximal** : Gamification, battles photos, réactions emoji, reconnaissance faciale
- **Aftermovie automatique** : Génération de vidéos timelapse en fin d'événement avec effets visuels
- **Multi-événements** : Architecture SaaS permettant de gérer plusieurs événements simultanés

### 🎬 Cas d'Usage

- **Mariages** : Mur de souvenirs partagés avec légendes personnalisées et cadres élégants
- **Événements d'entreprise** : Team building et animations interactives pour séminaires
- **Anniversaires & Fêtes** : Engagement collectif et création de souvenirs mémorables
- **Soirées étudiantes** : Battles photos et gamification pour maximiser l'interaction
- **Événements culturels** : Partage instantané et galerie collaborative pour festivals

---

## ✨ Fonctionnalités Principales

### 📱 Expérience Invité

#### Upload & Capture
- **Prise de photo/vidéo directe** via caméra mobile ou galerie
- **Support vidéo complet** : Enregistrement de vidéos courtes (max 20s, 50MB)
- **Mode collage** : Création de collages en assemblant 2 à 4 photos avec 6 templates prédéfinis
- **Zoom avancé** : Pinch-to-zoom et zoom à la molette pour cadrage précis
- **Résolution adaptative** : Détection automatique de la meilleure résolution disponible (jusqu'à 1920x1080)
- **Compression intelligente** : Optimisation automatique avec Web Workers pour performances optimales
- **Orientation automatique** : Détection et correction de l'orientation des photos

#### Intelligence Artificielle
- **Modération automatique** : Détection de contenu inapproprié avant publication (Gemini 3 Flash)
- **Amélioration d'images** : Filtres automatiques et optimisation de qualité
- **Légendes contextuelles** : Génération automatique de légendes personnalisées selon le type d'événement
- **Personnalisation avancée** : Adaptation du vocabulaire et du ton selon le contexte (mariage, anniversaire, entreprise, etc.)
- **Service combiné optimisé** : Modération + légende en 1 seul appel API (réduction de 50% des coûts)
- **Cache intelligent** : Évite les appels API redondants pour optimiser les performances

#### Engagement & Interactivité
- **Galerie interactive** : Visualisation de toutes les photos/vidéos avec système de likes et réactions
- **Réactions emoji** : 6 types de réactions (❤️ Cœur, 😂 Rire, 😢 Pleure, 🔥 Feu, 😮 Surprise, 👍 Thumbs up)
- **Mode Battle** : Système de battles entre photos avec votes en temps réel et résultats animés
- **Gamification complète** : Badges (Photographe, Star), classements et leaderboard en temps réel
- **Reconnaissance faciale** : Retrouvez toutes vos photos dans l'événement avec FindMe (face-api.js)
- **Cadres décoratifs** : Application automatique de cadres personnalisés (Polaroid, Or, etc.)
- **Profil invité** : Création de profil personnalisé avec nom et avatar
- **Onboarding intuitif** : Processus d'inscription simplifié pour nouveaux utilisateurs

### 🖥️ Affichage Grand Écran

#### Modes d'Affichage
- **Mode Masonry** : Grille dynamique esthétique avec virtualisation (@tanstack/react-virtual) pour performances optimales
- **Mode Projection** : Diaporama automatique plein écran avec transitions fluides personnalisables
- **Auto-scroll intelligent** : Défilement automatique infini pour animation continue
- **Photo Battles** : Affichage des battles actives en mode compact avec mises à jour temps réel
- **Projection des résultats** : Mode dédié pour afficher les résultats de battles terminées avec animations
- **Alerte modérateur** : Affichage de messages d'alerte centrés au-dessus des photos pour communiquer avec les invités
- **Mode Stats Display** : Affichage des statistiques et leaderboard en mode présentation (kiosque)

#### Personnalisation
- **QR Code dynamique** : Génération automatique pour rejoindre l'événement (qrcode.react)
- **Configuration live** : Personnalisation du titre, sous-titre, vitesse de défilement et transitions
- **Effets visuels avancés** : Particules animées, transitions avancées et effets AR pour expérience immersive
- **Scènes AR** : Effets de réalité augmentée déclenchés par applaudissements (détection audio)
- **Fond personnalisable** : Images de fond adaptatives (desktop/mobile)
- **Transitions personnalisables** : Fade, slide, zoom, cross-fade, wipe avec durées configurables

### 🛡️ Administration

#### Modération & Contrôle
- **Dashboard de modération** : Suppression des photos/vidéos indésirables en temps réel
- **Contrôle mobile** : Interface d'administration optimisée pour smartphone avec onglets (Modération, Battles, Invités, Paramètres)
- **Gestion des invités** : Visualisation, recherche et blocage des invités problématiques
- **Alerte pour les invités** : Affichage de messages d'alerte en grand au centre de l'écran sur le mur
  - Saisie de texte d'alerte (max 200 caractères)
  - Mise à jour en temps réel sur tous les murs connectés
  - Affichage centré avec animations fluides
  - Suppression instantanée de l'alerte
- **Authentification sécurisée** : Accès réservé aux administrateurs via Supabase Auth
- **Gestion multi-événements** : Sélection et gestion de plusieurs événements (architecture SaaS)

#### Configuration
- **Personnalisation d'événement** : Titre, sous-titre, vitesse de défilement, contexte personnalisé
- **Gestion des fonctionnalités** : Activation/désactivation des modes (collage, vidéo, battle, stats, AR, FindMe)
- **Personnalisation IA** : Configuration du contexte pour légendes adaptées au type d'événement
- **Gestion des cadres** : Upload et gestion de cadres décoratifs personnalisés (Supabase Storage)
- **Cadres locaux** : Support de cadres stockés localement dans `/public/cadres/`
- **Paramètres de projection** : Configuration de la durée d'affichage, transitions et effets

#### Analytics & Export
- **Statistiques en temps réel** : Nombre de photos, pics d'activité, classements, top photographes
- **Gamification** : Visualisation des badges, leaderboard et podium
- **Export ZIP** : Téléchargement de toutes les photos avec métadonnées (JSZip + File Saver)
- **Génération Aftermovie** : Création automatique de vidéos timelapse avec :
  - 3 presets (Rapide 720p, Standard 1080p, Qualité 1080p)
  - Sélection de plage temporelle
  - Effets visuels (Ken Burns, transitions, intro/outro)
  - Ajout de musique avec boucle et contrôle du volume
  - Génération côté client avec MediaRecorder API
- **Page Analytics** : Vue détaillée des statistiques avec graphiques et métriques

#### Gestion des Battles
- **Création de battles** : Sélection manuelle de 2 photos pour créer une battle
- **Battles automatiques** : Génération automatique de battles basées sur les photos récentes
- **Modération des battles** : Annulation et gestion des battles actives
- **Affichage des résultats** : Projection dédiée des résultats avec animations

---

## 🛠 Stack Technique

### Frontend
- **React 19.2** : Framework UI avec Hooks, Suspense et Lazy Loading
- **TypeScript 5.8** : Typage statique strict pour robustesse et maintenabilité
- **Vite 6.2** : Build tool ultra-rapide avec Hot Module Replacement
- **Tailwind CSS 4.1** : Framework CSS utility-first pour design moderne
- **Lucide React** : Bibliothèque d'icônes moderne et cohérente
- **Framer Motion** : Animations et transitions fluides
- **@tanstack/react-virtual** : Virtualisation pour performances optimales avec grandes listes

### Backend & Infrastructure
- **Supabase** : Backend-as-a-Service complet
  - **PostgreSQL** : Base de données relationnelle performante avec RLS
  - **Storage** : Stockage d'images et vidéos (buckets `party-photos` et `party-frames`)
  - **Realtime** : WebSockets pour mises à jour instantanées (subscriptions)
  - **Auth** : Authentification et gestion des sessions admin
  - **Row Level Security (RLS)** : Sécurité au niveau des données
  - **Multi-événements** : Architecture SaaS avec isolation des données par événement

### Intelligence Artificielle
- **Google Gemini 3 Flash** : Modèle multimodal pour :
  - Génération de légendes contextuelles personnalisées
  - Modération automatique de contenu
  - Analyse d'images (détection de visages, qualité, filtres)
  - Service combiné optimisé : modération + légende en 1 seul appel API (réduction de 50% des coûts)
  - Cache intelligent : évite les appels API redondants

### Outils & Bibliothèques
- **JSZip** : Génération d'archives ZIP pour l'export
- **File Saver** : Téléchargement de fichiers côté client
- **QRCode React** : Génération de QR codes dynamiques
- **face-api.js** : Reconnaissance faciale pour fonctionnalité "Retrouve-moi"
- **Zod** : Validation de schémas TypeScript
- **Electron** : Support application desktop (Windows, macOS, Linux)
- **Web Workers** : Compression d'images en arrière-plan sans bloquer l'interface
- **MediaRecorder API** : Génération de vidéos WebM côté client (aftermovie)

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** (v18 ou supérieur) et npm
- Un compte **Supabase** (gratuit) : [https://supabase.com](https://supabase.com)
- Une clé API **Google AI Studio** (Gemini) : [https://aistudio.google.com](https://aistudio.google.com)
- **Git** (pour cloner le repository)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-user/live-party-wall.git
cd live-party-wall
npm install
```

2. **Configuration de l'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Google Gemini API
GEMINI_API_KEY=votre_cle_api_google_gemini
```

> **Note** : Les variables d'environnement doivent commencer par `VITE_` pour être accessibles dans le code client avec Vite.

3. **Configuration de la Base de Données**

Rendez-vous dans l'éditeur SQL de votre projet Supabase (Dashboard > SQL Editor) et exécutez les scripts dans l'ordre suivant :

**Scripts principaux (ordre d'exécution) :**
1. `supabase/supabase_setup.sql` - Tables principales et buckets
2. `supabase/supabase_admin_setup.sql` - Droits d'accès admin
3. `supabase/supabase_likes_setup.sql` - Système de likes
4. `supabase/supabase_settings_setup.sql` - Configuration d'événement
5. `supabase/supabase_migration_frames.sql` - Politiques de stockage cadres
6. `supabase/supabase_videos_migration.sql` - Support vidéos
7. `supabase/supabase_video_capture_setting_migration.sql` - Paramètre vidéo
8. `supabase/supabase_collage_mode_setting_migration.sql` - Paramètre collage
9. `supabase/supabase_stats_enabled_setting_migration.sql` - Paramètre stats
10. `supabase/supabase_event_context_migration.sql` - Contexte d'événement
11. `supabase/supabase_photo_battles_setup.sql` - Système de battles
12. `supabase/supabase_battle_mode_enabled_migration.sql` - Paramètre battle
13. `supabase/supabase_reactions_setup.sql` - Système de réactions
14. `supabase/supabase_guests_migration.sql` - Gestion des profils invités
15. `supabase/supabase_blocked_guests_migration.sql` - Système de blocage des invités
16. `supabase/supabase_ar_scene_enabled_migration.sql` - Paramètre AR
17. `supabase/supabase_alert_text_migration.sql` - Système d'alerte pour les invités
18. `supabase/supabase_likes_trigger_optimization.sql` - Optimisation triggers
19. `supabase/supabase_events_migration.sql` - Système multi-événements (SaaS)

> **Alternative** : Utilisez `supabase/supabase_complete_setup.sql` pour une installation complète en une seule fois (si disponible).

> **Important** : 
> - Activez "Realtime" pour les tables `photos`, `likes`, `reactions`, `event_settings` et `photo_battles` dans les paramètres de réplication de Supabase (Database > Replication)
> - Vérifiez que les buckets `party-photos` et `party-frames` sont bien créés et publics (Storage > Buckets)
> - La migration `supabase_alert_text_migration.sql` ajoute automatiquement `event_settings` à la publication Realtime

4. **Configuration de l'Authentification Admin**

1. Allez dans **Supabase Dashboard > Authentication > Users**
2. Cliquez sur **"Add user"** ou **"Invite user"** pour créer un compte admin
3. Notez l'email et le mot de passe
4. (Optionnel) Désactivez l'inscription publique dans **Authentication > Settings > Auth Providers**

5. **Téléchargement des modèles de reconnaissance faciale**

```bash
npm run download:face-models
```

Cette commande télécharge les modèles nécessaires pour la fonctionnalité FindMe dans le dossier `build/models/face-api/`.

6. **Lancement en Développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000` (port configuré dans vite.config.ts).

### Build pour la Production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

Pour prévisualiser la version de production localement :

```bash
npm run preview
```

---

## 📁 Structure du Projet

```
live-party-wall/
├── components/              # Composants React UI
│   ├── AdminDashboard.tsx  # Dashboard admin complet
│   ├── AdminLogin.tsx      # Authentification admin
│   ├── AdminProfile.tsx    # Profil administrateur
│   ├── MobileControl.tsx   # Contrôle mobile (modération, battles, invités, alertes)
│   ├── GuestUpload.tsx     # Interface d'upload pour invités
│   ├── GuestGallery.tsx    # Galerie photos interactive
│   ├── GuestProfile.tsx    # Profil invité
│   ├── WallView.tsx        # Vue mur (affichage grand écran)
│   ├── ProjectionWall.tsx  # Mode projection murale
│   ├── PhotoBattle.tsx     # Système de battles
│   ├── BattleResultsProjection.tsx # Projection des résultats
│   ├── CollageMode.tsx     # Mode collage
│   ├── FindMe.tsx          # Reconnaissance faciale
│   ├── StatsPage.tsx       # Page de statistiques
│   ├── AnalyticsView.tsx   # Vue analytics détaillée
│   ├── Leaderboard.tsx     # Classement des photographes
│   ├── EventSelector.tsx   # Sélection d'événements (multi-tenant)
│   ├── EventManager.tsx    # Gestion des événements
│   ├── UserOnboarding.tsx   # Onboarding utilisateur
│   ├── HelpPage.tsx        # Page d'aide
│   ├── Landing.tsx         # Page d'accueil
│   ├── arEffects/          # Effets AR (confettis, feux d'artifice, halos)
│   ├── gallery/            # Composants de la galerie
│   ├── projection/         # Composants de projection
│   ├── stats/              # Composants de statistiques
│   ├── wall/               # Composants du mur
│   ├── mobileControl/      # Composants du contrôle mobile
│   └── landing/            # Composants de la landing page
│
├── context/                 # Contextes React (état global)
│   ├── AuthContext.tsx     # Authentification admin
│   ├── EventContext.tsx    # Gestion des événements (multi-tenant)
│   ├── PhotosContext.tsx   # Gestion des photos
│   ├── SettingsContext.tsx # Paramètres d'événement
│   └── ToastContext.tsx    # Notifications toast
│
├── services/                # Services métier et intégrations
│   ├── photoService.ts         # CRUD photos/vidéos
│   ├── aiService.ts            # Service IA combiné (modération + légende)
│   ├── aiModerationService.ts  # Modération IA
│   ├── geminiService.ts        # Service Gemini (légendes)
│   ├── battleService.ts        # Gestion des battles
│   ├── autoBattleService.ts    # Génération automatique de battles
│   ├── aftermovieService.ts    # Génération de vidéos timelapse
│   ├── gamificationService.ts  # Badges et classements
│   ├── exportService.ts        # Export ZIP
│   ├── frameService.ts         # Gestion des cadres
│   ├── localFramesService.ts   # Cadres locaux
│   ├── settingsService.ts      # Paramètres d'événement
│   ├── guestService.ts         # Gestion des invités
│   ├── eventService.ts         # Gestion des événements
│   ├── eventContextService.ts  # Contexte d'événement
│   ├── faceRecognitionService.ts # Reconnaissance faciale
│   ├── applauseDetectionService.ts # Détection d'applaudissements
│   └── supabaseClient.ts       # Client Supabase configuré
│
├── hooks/                   # Hooks React personnalisés
│   ├── useImageCompression.ts  # Compression d'images
│   ├── useCameraZoom.ts        # Gestion du zoom caméra
│   ├── useAdaptiveCameraResolution.ts # Résolution adaptative
│   ├── useImageOrientation.ts  # Détection d'orientation
│   ├── useIsMobile.ts          # Détection mobile
│   ├── useDebounce.ts          # Debounce
│   ├── useSwipe.ts             # Gestes swipe
│   └── wall/                   # Hooks spécifiques au mur
│       ├── useWallData.ts      # Données du mur
│       ├── useWallSettings.ts  # Paramètres du mur
│       ├── useWallBattles.ts   # Battles du mur
│       ├── useAutoScroll.ts    # Auto-scroll
│       └── useReactionFlow.ts  # Flux de réactions
│
├── utils/                   # Utilitaires
│   ├── validation.ts        # Validation des inputs
│   ├── imageFilters.ts      # Filtres d'image
│   ├── photoFilters.ts      # Filtres de photos
│   ├── collageUtils.ts      # Utilitaires pour collages
│   ├── imageOverlay.ts       # Overlays d'images
│   ├── imageHash.ts          # Hachage d'images
│   ├── soundService.ts       # Gestion des sons
│   ├── userAvatar.ts         # Génération d'avatars
│   ├── urlUtils.ts           # Utilitaires URL
│   ├── env.ts                # Variables d'environnement
│   ├── electronPaths.ts      # Chemins Electron
│   ├── debounce.ts           # Debounce
│   ├── subscriptionHelper.ts # Helpers pour subscriptions
│   ├── geminiErrorHandler.ts # Gestion d'erreurs Gemini
│   └── logger.ts             # Logging
│
├── supabase/                # Scripts de migration SQL
│   └── *.sql                # Migrations de base de données
│
├── electron/                 # Code Electron (application desktop)
│   ├── main.ts              # Processus principal
│   ├── preload.ts           # Script preload sécurisé
│   └── types.d.ts           # Types Electron
│
├── workers/                 # Web Workers
│   └── imageCompression.worker.ts # Compression en arrière-plan
│
├── build/                    # Assets de build
│   ├── cadres/              # Cadres décoratifs locaux
│   ├── models/              # Modèles IA (face-api)
│   ├── sounds/              # Sons et effets audio
│   └── *.png, *.ico         # Icônes et images
│
├── scripts/                 # Scripts utilitaires
│   ├── download-face-api-models.js # Téléchargement modèles
│   └── generate-icons.js    # Génération d'icônes
│
├── types.ts                 # Types TypeScript partagés
├── constants.ts             # Constantes globales
├── App.tsx                  # Composant racine
├── index.tsx                # Point d'entrée
├── vite.config.ts          # Configuration Vite
└── package.json            # Dépendances et scripts
```

---

## 🎯 Modes d'Utilisation

L'application supporte plusieurs modes accessibles via les paramètres URL :

| Mode | URL | Description | Accès |
|------|-----|-------------|-------|
| **Landing** | `/?mode=landing` | Page d'accueil avec sélection de mode | Public |
| **Guest Upload** | `/?mode=guest` | Interface d'upload pour invités | Public (nécessite onboarding) |
| **Gallery** | `/?mode=gallery` | Galerie photos/vidéos interactive | Public |
| **Collage** | `/?mode=collage` | Mode collage (2-4 photos) | Public (si activé) |
| **FindMe** | `/?mode=findme` | Reconnaissance faciale | Public (si activé) |
| **Wall View** | `/?mode=wall` | Vue mur masonry (grand écran) | Authentifié uniquement |
| **Projection** | `/?mode=projection` | Mode projection murale (diaporama) | Authentifié uniquement |
| **Battle Results** | `/?mode=battle-results` | Projection des résultats de battles | Public |
| **Stats Display** | `/?mode=stats-display` | Affichage des statistiques (kiosque) | Public |
| **Admin** | `/?mode=admin` | Interface d'administration | Authentifié uniquement |
| **Mobile Control** | `/?mode=mobile-control` | Administration mobile | Authentifié uniquement |
| **Help** | `/?mode=help` | Page d'aide et instructions | Public |

### Paramètres d'URL supplémentaires

- `?event=slug` : Sélection d'un événement spécifique (multi-tenant)
- `?event=event-id` : Sélection par ID d'événement

---

## 🔧 Configuration de la Base de Données

Exécutez les scripts SQL dans l'ordre suivant dans l'éditeur SQL de Supabase :

1. `supabase/supabase_setup.sql` - Tables principales et buckets
2. `supabase/supabase_admin_setup.sql` - Droits d'accès admin
3. `supabase/supabase_likes_setup.sql` - Système de likes
4. `supabase/supabase_settings_setup.sql` - Configuration d'événement
5. `supabase/supabase_migration_frames.sql` - Politiques de stockage cadres
6. `supabase/supabase_videos_migration.sql` - Support vidéos
7. `supabase/supabase_video_capture_setting_migration.sql` - Paramètre vidéo
8. `supabase/supabase_collage_mode_setting_migration.sql` - Paramètre collage
9. `supabase/supabase_stats_enabled_setting_migration.sql` - Paramètre stats
10. `supabase/supabase_event_context_migration.sql` - Contexte d'événement
11. `supabase/supabase_photo_battles_setup.sql` - Système de battles
12. `supabase/supabase_battle_mode_enabled_migration.sql` - Paramètre battle
13. `supabase/supabase_reactions_setup.sql` - Système de réactions
14. `supabase/supabase_guests_migration.sql` - Gestion des profils invités
15. `supabase/supabase_blocked_guests_migration.sql` - Système de blocage des invités
16. `supabase/supabase_ar_scene_enabled_migration.sql` - Paramètre AR
17. `supabase/supabase_alert_text_migration.sql` - Système d'alerte pour les invités
18. `supabase/supabase_likes_trigger_optimization.sql` - Optimisation triggers
19. `supabase/supabase_events_migration.sql` - Système multi-événements (SaaS)

> **Note** : Consultez [DB_SCHEMA.md](./DB_SCHEMA.md) pour le schéma détaillé de la base de données.

---

## 📦 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement Vite avec HMR |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise la version de production localement |
| `npm run download:face-models` | Télécharge les modèles de reconnaissance faciale |
| `npm run generate:icons` | Génère les icônes pour Electron |
| `npm run electron:dev` | Lance l'application en mode développement avec Electron |
| `npm run electron:build` | Compile l'application Electron pour la production |
| `npm run electron:pack` | Crée les installateurs Electron (Windows, macOS, Linux) |
| `npm run electron:dist` | Build et crée les distributables Electron |

---

## 🔐 Sécurité

- **Row Level Security (RLS)** : Toutes les tables Supabase sont protégées par RLS
- **Validation Côté Client** : Validation stricte des fichiers et inputs
- **Modération IA** : Détection automatique de contenu inapproprié
- **Authentification Admin** : Accès admin sécurisé via Supabase Auth
- **Sanitization** : Nettoyage des inputs pour prévenir XSS
- **Limites de Taille** : Photos (10MB max), Vidéos (50MB max, 20s max)
- **Isolation Multi-tenant** : Séparation des données par événement (architecture SaaS)

---

## 📚 Documentation Complémentaire

- [ARCHITECTURE.md](./ARCHITECTURE.md) : Architecture détaillée du système
- [API_DOCS.md](./API_DOCS.md) : Documentation des endpoints et services
- [DB_SCHEMA.md](./DB_SCHEMA.md) : Schéma de la base de données
- [ROADMAP.md](./ROADMAP.md) : Feuille de route du projet
- [CONTRIBUTING.md](./CONTRIBUTING.md) : Guide de contribution
- [GUIDE_CADRES_LOCAUX.md](./GUIDE_CADRES_LOCAUX.md) : Guide pour ajouter des cadres décoratifs
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) : Optimisations de performance
- [MEMORY_MANAGEMENT.md](./MEMORY_MANAGEMENT.md) : Gestion de la mémoire
- [PHOTO_BATTLE_FEATURE.md](./PHOTO_BATTLE_FEATURE.md) : Documentation des battles photos
- [FILE_VALIDATION.md](./FILE_VALIDATION.md) : Validation des fichiers
- [README_ALERT_REALTIME.md](./README_ALERT_REALTIME.md) : Système d'alerte temps réel

---

## 🖥️ Application Desktop (Electron)

Live Party Wall peut être exécuté en tant qu'application desktop grâce à Electron. Cela permet une utilisation en mode kiosque ou sur des écrans dédiés sans navigateur.

### Installation et Utilisation

1. **Développement** : `npm run electron:dev`
2. **Build Production** : `npm run electron:build`
3. **Créer Installateurs** : `npm run electron:pack`

### Icônes Electron

Pour personnaliser les icônes de l'application desktop :

1. Générez vos icônes dans les formats requis :
   - **Windows** : `build/icon.ico` (256x256px recommandé)
   - **macOS** : `build/icon.icns` (512x512px recommandé)
   - **Linux** : `build/icon.png` (512x512px recommandé)

2. Placez les fichiers dans le dossier `build/`

3. Lancez `npm run electron:pack` pour créer les installateurs avec vos icônes

> **Note** : Voir `build/README.md` pour des instructions détaillées sur la génération des icônes.

---

## 🚨 Fonctionnalité : Alerte pour les Invités

### Description

La fonctionnalité d'alerte permet au modérateur d'afficher un message important en grand au centre de l'écran sur le mur pour communiquer avec tous les invités en temps réel.

### Utilisation

1. **Accéder au contrôle** : Ouvrez MobileControl (`/?mode=mobile-control`) ou AdminDashboard
2. **Onglet Paramètres** : Allez dans l'onglet "Paramètres"
3. **Section "Alerte pour les invités"** : 
   - Saisissez votre message d'alerte (max 200 caractères)
   - Le message s'affiche immédiatement sur tous les murs connectés
   - Cliquez sur "Supprimer l'alerte" pour la retirer

### Caractéristiques

- **Mise à jour en temps réel** : L'alerte apparaît/disparaît instantanément sur tous les murs sans actualisation
- **Affichage centré** : Message affiché en grand au centre de l'écran avec animations fluides
- **Design visible** : Fond coloré (jaune/orange/rouge) avec icône d'alerte et effets visuels
- **Responsive** : Adaptation automatique de la taille du texte selon la taille d'écran
- **Polling de secours** : Détection automatique toutes les 5 secondes si Realtime n'est pas disponible

### Configuration

La migration SQL `supabase_alert_text_migration.sql` doit être exécutée pour activer cette fonctionnalité. Elle :
- Ajoute la colonne `alert_text` à la table `event_settings`
- Active Realtime sur `event_settings` pour les mises à jour instantanées

Voir [README_ALERT_REALTIME.md](./README_ALERT_REALTIME.md) pour les instructions détaillées d'activation.

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines détaillées.

1. Forkez le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

---

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour l'infrastructure backend
- [Google Gemini](https://deepmind.google/technologies/gemini/) pour l'IA
- [React](https://react.dev) et [Vite](https://vitejs.dev) pour l'écosystème frontend
- [Tailwind CSS](https://tailwindcss.com) pour le framework CSS
- [Lucide](https://lucide.dev) pour les icônes
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) pour la reconnaissance faciale

---

## 📞 Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/votre-user/live-party-wall/issues) sur GitHub
- Consultez la [documentation](./ARCHITECTURE.md) pour plus de détails techniques

---

**Dernière mise à jour** : 2026-01-15  
**Version** : 1.0.1
