# 📸 Live Party Wall

> **L'expérience photobooth interactive et intelligente pour vos événements.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=google)](https://deepmind.google/technologies/gemini/)

---

## 🎯 Vue d'Ensemble

**Live Party Wall** est une application web en temps réel qui transforme chaque invité d'un événement en créateur de contenu. Les photos et vidéos partagées apparaissent instantanément sur grand écran, enrichies par l'intelligence artificielle (Google Gemini) qui modère, améliore et légende automatiquement chaque média.

### 💡 Proposition de Valeur

- **Zéro installation** : 100% web, aucune application à télécharger
- **Temps réel** : Affichage instantané sur grand écran via WebSockets
- **IA intégrée** : Modération automatique, amélioration d'images et légendes contextuelles
- **Engagement maximal** : Gamification, battles photos, réactions emoji, reconnaissance faciale
- **Aftermovie automatique** : Génération de vidéos timelapse en fin d'événement

### 🎬 Cas d'Usage

- **Mariages** : Mur de souvenirs partagés avec légendes personnalisées
- **Événements d'entreprise** : Team building et animations interactives
- **Anniversaires & Fêtes** : Engagement collectif et création de souvenirs
- **Soirées étudiantes** : Battles photos et gamification
- **Événements culturels** : Partage instantané et galerie collaborative

---

## ✨ Fonctionnalités Principales

### 📱 Expérience Invité

#### Upload & Capture
- **Prise de photo/vidéo directe** via caméra mobile ou galerie
- **Support vidéo** : Enregistrement de vidéos courtes (max 20s)
- **Mode collage** : Création de collages en assemblant 2 à 4 photos avec templates prédéfinis
- **Zoom avancé** : Pinch-to-zoom et zoom à la molette pour cadrage précis
- **Résolution adaptative** : Détection automatique de la meilleure résolution disponible
- **Compression intelligente** : Optimisation automatique avec Web Workers

#### Intelligence Artificielle
- **Modération automatique** : Détection de contenu inapproprié avant publication
- **Amélioration d'images** : Filtres automatiques et optimisation de qualité
- **Légendes contextuelles** : Génération automatique de légendes personnalisées selon le type d'événement
- **Personnalisation** : Adaptation du vocabulaire et du ton (mariage, anniversaire, entreprise, etc.)

#### Engagement & Interactivité
- **Galerie interactive** : Visualisation de toutes les photos/vidéos avec système de likes
- **Réactions emoji** : 6 types de réactions (❤️ Cœur, 😂 Rire, 😢 Pleure, 🔥 Feu, 😮 Surprise, 👍 Thumbs up)
- **Mode Battle** : Système de battles entre photos avec votes en temps réel
- **Gamification** : Badges, classements et leaderboard en temps réel
- **Reconnaissance faciale** : Retrouvez toutes vos photos dans l'événement (FindMe)
- **Cadres décoratifs** : Application automatique de cadres personnalisés (Polaroid, Or, etc.)

### 🖥️ Affichage Grand Écran

#### Modes d'Affichage
- **Mode Masonry** : Grille dynamique esthétique avec virtualisation pour performances optimales
- **Mode Projection** : Diaporama automatique plein écran avec transitions fluides
- **Auto-scroll intelligent** : Défilement automatique infini pour animation continue
- **Photo Battles** : Affichage des battles actives en mode compact avec mises à jour temps réel
- **Projection des résultats** : Mode dédié pour afficher les résultats de battles terminées
- **Alerte modérateur** : Affichage de messages d'alerte centrés au-dessus des photos pour communiquer avec les invités

#### Personnalisation
- **QR Code dynamique** : Génération automatique pour rejoindre l'événement
- **Configuration live** : Personnalisation du titre, vitesse de défilement et transitions
- **Effets visuels** : Particules animées et transitions avancées pour expérience immersive
- **Mode kiosque** : Affichage des statistiques en mode présentation

### 🛡️ Administration

#### Modération & Contrôle
- **Dashboard de modération** : Suppression des photos/vidéos indésirables en temps réel
- **Contrôle mobile** : Interface d'administration optimisée pour smartphone
- **Alerte pour les invités** : Affichage de messages d'alerte en grand au centre de l'écran sur le mur
  - Saisie de texte d'alerte (max 200 caractères)
  - Mise à jour en temps réel sur tous les murs connectés
  - Affichage centré avec animations fluides
  - Suppression instantanée de l'alerte
- **Authentification sécurisée** : Accès réservé aux administrateurs via Supabase Auth

#### Configuration
- **Personnalisation d'événement** : Titre, sous-titre, vitesse de défilement, contexte
- **Gestion des fonctionnalités** : Activation/désactivation des modes (collage, vidéo, battle, etc.)
- **Personnalisation IA** : Configuration du contexte pour légendes adaptées
- **Gestion des cadres** : Upload et gestion de cadres décoratifs personnalisés
- **Alerte pour les invités** : Configuration de messages d'alerte affichés sur le mur

#### Analytics & Export
- **Statistiques en temps réel** : Nombre de photos, pics d'activité, classements
- **Gamification** : Visualisation des badges et leaderboard
- **Export ZIP** : Téléchargement de toutes les photos avec métadonnées
- **Génération Aftermovie** : Création automatique de vidéos timelapse avec :
  - 3 presets (Rapide 720p, Standard 1080p, Qualité 1080p)
  - Sélection de plage temporelle
  - Effets visuels (Ken Burns, transitions, intro/outro)
  - Ajout de musique avec boucle et contrôle du volume

---

## 🛠 Stack Technique

### Frontend
- **React 19.2** : Framework UI avec Hooks, Suspense et Lazy Loading
- **TypeScript 5.8** : Typage statique pour robustesse et maintenabilité
- **Vite 6.2** : Build tool ultra-rapide avec Hot Module Replacement
- **Tailwind CSS 4.1** : Framework CSS utility-first pour design moderne
- **Lucide React** : Bibliothèque d'icônes moderne et cohérente

### Backend & Infrastructure
- **Supabase** : Backend-as-a-Service complet
  - **PostgreSQL** : Base de données relationnelle performante
  - **Storage** : Stockage d'images et vidéos (buckets `party-photos` et `party-frames`)
  - **Realtime** : WebSockets pour mises à jour instantanées
  - **Auth** : Authentification et gestion des sessions admin
  - **Row Level Security (RLS)** : Sécurité au niveau des données

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
- **@tanstack/react-virtual** : Virtualisation pour performances optimales
- **MediaRecorder API** : Génération de vidéos WebM côté client (aftermovie)
- **face-api.js** : Reconnaissance faciale pour fonctionnalité "Retrouve-moi"
- **Electron** : Support application desktop (Windows, macOS, Linux)
- **Web Workers** : Compression d'images en arrière-plan sans bloquer l'interface

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

- `supabase/supabase_setup.sql` : Tables principales et buckets
- `supabase/supabase_admin_setup.sql` : Droits d'accès admin
- `supabase/supabase_likes_setup.sql` : Système de likes
- `supabase/supabase_settings_setup.sql` : Configuration d'événement
- `supabase/supabase_migration_frames.sql` : Politiques de stockage cadres
- `supabase/supabase_videos_migration.sql` : Support vidéos
- `supabase/supabase_photo_battles_setup.sql` : Système de battles
- `supabase/supabase_reactions_setup.sql` : Système de réactions
- `supabase/supabase_guests_migration.sql` : Gestion des profils invités
- `supabase/supabase_blocked_guests_migration.sql` : Système de blocage des invités supprimés
- *(Voir la liste complète dans la section [Configuration de la Base de Données](#configuration-de-la-base-de-données))*

> **Important** : 
> - Activez "Realtime" pour les tables `photos`, `likes` et `event_settings` dans les paramètres de réplication de Supabase (Database > Replication)
> - Vérifiez que les buckets `party-photos` et `party-frames` sont bien créés et publics (Storage > Buckets)
> - La migration `supabase_alert_text_migration.sql` ajoute automatiquement `event_settings` à la publication Realtime

4. **Configuration de l'Authentification Admin**

1. Allez dans **Supabase Dashboard > Authentication > Users**
2. Cliquez sur **"Add user"** ou **"Invite user"** pour créer un compte admin
3. Notez l'email et le mot de passe
4. (Optionnel) Désactivez l'inscription publique dans **Authentication > Settings > Auth Providers**

5. **Lancement en Développement**

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
│   ├── MobileControl.tsx   # Contrôle mobile (modération, battles, invités, alertes)
│   ├── GuestUpload.tsx     # Interface d'upload pour invités
│   ├── GuestGallery.tsx    # Galerie photos interactive
│   ├── WallView.tsx        # Vue mur (affichage grand écran)
│   ├── ProjectionWall.tsx  # Mode projection murale
│   ├── PhotoBattle.tsx     # Système de battles
│   ├── CollageMode.tsx     # Mode collage
│   ├── FindMe.tsx          # Reconnaissance faciale
│   ├── arEffects/          # Effets AR (confettis, feux d'artifice)
│   ├── gallery/            # Composants de la galerie
│   ├── projection/         # Composants de projection
│   └── stats/              # Composants de statistiques
│
├── context/                 # Contextes React (état global)
│   ├── AuthContext.tsx     # Authentification admin
│   ├── PhotosContext.tsx   # Gestion des photos
│   ├── SettingsContext.tsx # Paramètres d'événement
│   └── ToastContext.tsx    # Notifications toast
│
├── services/                # Services métier et intégrations
│   ├── photoService.ts         # CRUD photos/vidéos
│   ├── aiService.ts            # Service IA combiné (modération + légende)
│   ├── battleService.ts        # Gestion des battles
│   ├── aftermovieService.ts    # Génération de vidéos timelapse
│   ├── gamificationService.ts  # Badges et classements
│   └── supabaseClient.ts       # Client Supabase configuré
│
├── hooks/                   # Hooks React personnalisés
│   ├── useImageCompression.ts  # Compression d'images
│   ├── useCameraZoom.ts        # Gestion du zoom caméra
│   └── useAdaptiveCameraResolution.ts # Résolution adaptative
│
├── utils/                   # Utilitaires
│   ├── validation.ts        # Validation des inputs
│   ├── imageFilters.ts      # Filtres d'image
│   └── collageUtils.ts     # Utilitaires pour collages
│
├── supabase/                # Scripts de migration SQL
│   └── *.sql               # Migrations de base de données
│
├── electron/                # Code Electron (application desktop)
│   ├── main.ts             # Processus principal
│   └── preload.ts          # Script preload sécurisé
│
└── workers/                 # Web Workers
    └── imageCompression.worker.ts # Compression en arrière-plan
```

---

## 🎯 Modes d'Utilisation

L'application supporte plusieurs modes accessibles via les paramètres URL :

| Mode | URL | Description | Accès |
|------|-----|-------------|-------|
| **Landing** | `/?mode=landing` | Page d'accueil avec sélection de mode | Public |
| **Guest Upload** | `/?mode=guest` | Interface d'upload pour invités | Public (nécessite onboarding) |
| **Gallery** | `/?mode=gallery` | Galerie photos/vidéos interactive | Public |
| **Wall View** | `/?mode=wall` | Vue mur masonry (grand écran) | Authentifié uniquement |
| **Projection** | `/?mode=projection` | Mode projection murale (diaporama) | Authentifié uniquement |
| **Admin** | `/?mode=admin` | Interface d'administration | Authentifié uniquement |
| **Mobile Control** | `/?mode=mobile-control` | Administration mobile | Authentifié uniquement |
| **Battle Results** | `/?mode=battle-results` | Projection des résultats de battles | Public |

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
15. `supabase/supabase_ar_scene_enabled_migration.sql` - Paramètre AR
16. `supabase/supabase_alert_text_migration.sql` - Système d'alerte pour les invités
17. `supabase/supabase_likes_trigger_optimization.sql` - Optimisation triggers

---

## 📦 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement Vite avec HMR |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise la version de production localement |
| `npm run download:face-models` | Télécharge les modèles de reconnaissance faciale |
| `npm run electron:dev` | Lance l'application en mode développement avec Electron |
| `npm run electron:build` | Compile l'application Electron pour la production |
| `npm run electron:pack` | Crée les installateurs Electron (Windows, macOS, Linux) |

---

## 🔐 Sécurité

- **Row Level Security (RLS)** : Toutes les tables Supabase sont protégées par RLS
- **Validation Côté Client** : Validation stricte des fichiers et inputs
- **Modération IA** : Détection automatique de contenu inapproprié
- **Authentification Admin** : Accès admin sécurisé via Supabase Auth
- **Sanitization** : Nettoyage des inputs pour prévenir XSS
- **Limites de Taille** : Photos (10MB max), Vidéos (50MB max, 20s max)

---

## 📚 Documentation Complémentaire

- [ARCHITECTURE.md](./ARCHITECTURE.md) : Architecture détaillée du système
- [API_DOCS.md](./API_DOCS.md) : Documentation des endpoints et services
- [DB_SCHEMA.md](./DB_SCHEMA.md) : Schéma de la base de données
- [ROADMAP.md](./ROADMAP.md) : Feuille de route du projet
- [CONTRIBUTING.md](./CONTRIBUTING.md) : Guide de contribution
- [GUIDE_CADRES_LOCAUX.md](./GUIDE_CADRES_LOCAUX.md) : Guide pour ajouter des cadres décoratifs

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

---

## 📞 Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/votre-user/live-party-wall/issues) sur GitHub
- Consultez la [documentation](./ARCHITECTURE.md) pour plus de détails techniques

---

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

**Dernière mise à jour** : 2026-01-15
