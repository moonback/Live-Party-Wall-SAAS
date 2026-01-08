# 🎉 Live Party Wall

**Transformez vos événements en expériences mémorables avec un mur photo interactif en temps réel, enrichi par l'intelligence artificielle.**

Live Party Wall est une application web SaaS qui permet aux invités d'un événement de partager instantanément leurs photos sur grand écran. L'application utilise Google Gemini pour modérer, améliorer et légender automatiquement chaque photo, créant une animation collective et engageante.

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Stack technique](#-stack-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Variables d'environnement](#-variables-denvironnement)
- [Documentation](#-documentation)
- [Contribution](#-contribution)
- [License](#-license)

---

## 🎯 Présentation

Live Party Wall transforme chaque invité en créateur de contenu. En quelques secondes, leurs photos apparaissent sur le grand écran, enrichies par l'IA qui :

- ✅ **Modère automatiquement** le contenu pour garantir un environnement approprié
- ✅ **Améliore la qualité** visuelle des photos
- ✅ **Génère des légendes** personnalisées et contextuelles
- ✅ **Applique des cadres** décoratifs (Polaroid, néon, or, etc.)
- ✅ **Affiche en temps réel** sur grand écran via WebSockets

**Parfait pour** : Mariages, événements d'entreprise, anniversaires, soirées privées, team building, séminaires.

---

## ✨ Fonctionnalités principales

### Pour les invités
- 📸 **Upload simplifié** : Prise de photo directe, galerie ou collage
- 🎨 **Cadres décoratifs** : Polaroid, néon, or et effets visuels
- ❤️ **Système de likes** : Interagir avec les photos des autres
- 🔍 **Galerie interactive** : Parcourir toutes les photos de l'événement
- 👤 **Profil personnalisé** : Avatar et statistiques
- 🎮 **Gamification** : Badges, classements et battles photos
- 🔎 **Recherche IA** : Reconnaissance faciale et recherche sémantique

### Pour les organisateurs
- 🎛️ **Dashboard complet** : Gestion d'événements, statistiques, modération
- 📊 **Analytics en temps réel** : Nombre de photos, likes, participants
- 🎬 **Mode projection** : Affichage optimisé pour grand écran
- 📥 **Export HD** : Téléchargement individuel ou ZIP
- 🎞️ **Aftermovie automatique** : Génération de vidéos timelapse
- 🔐 **Multi-événements** : Architecture SaaS pour gérer plusieurs événements
- 👥 **Gestion d'équipe** : Ajouter des organisateurs avec différents rôles

---

## 🛠 Stack technique

### Frontend
- **React 19.2** : Framework UI avec Hooks et Suspense
- **TypeScript 5.8** : Typage strict pour la sécurité du code
- **Vite 6.2** : Build tool ultra-rapide avec HMR
- **Tailwind CSS 4.1** : Framework CSS utility-first
- **Framer Motion 12.24** : Animations fluides et performantes
- **Lucide React** : Bibliothèque d'icônes moderne

### Backend & Infrastructure
- **Supabase** : Backend-as-a-Service
  - PostgreSQL : Base de données relationnelle
  - Storage : Stockage de fichiers (photos, cadres, avatars)
  - Realtime : Synchronisation temps réel via WebSockets
  - Auth : Authentification et gestion des utilisateurs
- **Google Gemini 3 Flash** : Intelligence artificielle pour modération et légendes

### Outils & Bibliothèques
- **JSZip** : Export de fichiers ZIP
- **File Saver** : Téléchargement de fichiers côté client
- **QRCode React** : Génération de QR codes
- **Face-api.js** : Reconnaissance faciale
- **@tanstack/react-virtual** : Virtualisation pour performances

### Développement
- **Electron 39.2** : Application desktop (optionnel)
- **Vite Plugin Electron** : Intégration Electron avec Vite
- **TypeScript** : Compilateur et vérification de types

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.0.0 ([Télécharger](https://nodejs.org/))
- **npm** >= 9.0.0 (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))

### Services externes requis

1. **Compte Supabase** ([Créer un compte](https://supabase.com))
   - Projet Supabase avec base de données PostgreSQL
   - Buckets de stockage configurés

2. **Clé API Google Gemini** ([Obtenir une clé](https://ai.google.dev/))
   - Compte Google Cloud Platform
   - API Gemini activée

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/Live-Party-Wall-SAAS.git
cd Live-Party-Wall-SAAS
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Créez le fichier .env manuellement
touch .env
```

Remplissez les variables d'environnement (voir section [Variables d'environnement](#-variables-denvironnement)).

### 4. Initialiser la base de données Supabase

#### Option A : Setup complet (recommandé)

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Ouvrez l'**éditeur SQL** de votre projet
3. Exécutez le script de setup complet :

```sql
-- Exécutez ce fichier dans l'éditeur SQL Supabase
-- Il regroupe tous les scripts nécessaires
supabase/supabase_complete_setup.sql
```

#### Option B : Setup manuel (si vous avez besoin de plus de contrôle)

Exécutez les scripts SQL dans l'ordre suivant :

```sql
-- 1. Setup de base (tables principales)
supabase/supabase_setup.sql

-- 2. Configuration admin et authentification
supabase/supabase_admin_setup.sql

-- 3. Système de likes
supabase/supabase_likes_setup.sql

-- 4. Système de réactions
supabase/supabase_reactions_setup.sql

-- 5. Paramètres d'événement
supabase/supabase_settings_setup.sql

-- 6. Migration multi-événements (SaaS)
supabase/supabase_events_migration.sql

-- 7. Système de battles photos
supabase/supabase_photo_battles_setup.sql

-- 8. Gestion des invités bloqués
supabase/supabase_blocked_guests_migration.sql

-- 9. Support vidéo
supabase/supabase_videos_migration.sql

-- 10. Tags IA
supabase/supabase_photos_tags_migration.sql
```

#### Configuration post-installation

1. **Activer Realtime** :
   - Allez dans **Database > Replication**
   - Activez la réplication pour les tables suivantes :
     - `photos` : Nouvelles photos en temps réel
     - `likes` : Mises à jour de likes
     - `reactions` : Réactions émojis
     - `event_settings` : Changements de paramètres
     - `guests` : Nouveaux invités
     - `photo_battles` : Battles photos

2. **Créer un compte administrateur** :
   - Allez dans **Authentication > Users**
   - Cliquez sur **"Add user"** ou **"Invite user"**
   - Créez un compte avec email et mot de passe
   - Notez l'email et le mot de passe pour vous connecter à l'admin

3. **Configurer les buckets Storage** :
   - Les buckets sont créés automatiquement par les scripts SQL
   - Vérifiez dans **Storage** que les buckets suivants existent :
     - `party-photos` : Public, pour les photos
     - `party-frames` : Public, pour les cadres décoratifs
     - `party-avatars` : Public, pour les avatars

### 5. Télécharger les modèles Face API (optionnel)

Si vous utilisez la fonctionnalité de reconnaissance faciale "Retrouve-moi" :

```bash
npm run download:face-models
```

Les modèles seront téléchargés dans `public/models/face-api/`.

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Google Gemini API
GEMINI_API_KEY=votre_cle_api_gemini
```

#### Où trouver ces valeurs ?

**Supabase** :
1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings > API**
4. Copiez l'**URL** et la **anon/public key**

**Google Gemini** :
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez une nouvelle clé API
3. Copiez la clé générée

### Configuration Supabase Storage

Assurez-vous que les buckets suivants sont créés et configurés :

- `party-photos` : Public, pour les photos des invités
- `party-frames` : Public, pour les cadres décoratifs
- `party-avatars` : Public, pour les avatars des utilisateurs

Les scripts SQL créent automatiquement ces buckets avec les bonnes politiques.

---

## 🏃 Lancement

### Mode développement (Web)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

**Note** : Le serveur de développement écoute sur toutes les interfaces (`0.0.0.0`), vous pouvez donc y accéder depuis d'autres appareils sur le même réseau local.

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

Les fichiers de production seront générés dans le dossier `dist/`.

#### Build Electron

```bash
# Build uniquement (sans packager)
npm run electron:build

# Build + Package (créer les installateurs)
npm run electron:pack
```

Les installateurs seront générés dans le dossier `release/` :
- **Windows** : `Live Party Wall Setup X.X.X.exe`
- **macOS** : `Live Party Wall-X.X.X.dmg`
- **Linux** : `Live Party Wall-X.X.X.AppImage` et `.deb`

### Prévisualisation du build

Pour tester le build de production localement :

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

---

## 📁 Structure du projet

```
Live-Party-Wall-SAAS/
├── components/              # Composants React
│   ├── landing/            # Landing page SaaS
│   ├── gallery/            # Galerie de photos
│   ├── projection/         # Mode projection grand écran
│   ├── wall/               # Mur interactif
│   ├── stats/              # Statistiques et analytics
│   ├── admin/              # Dashboard administrateur
│   ├── photobooth/         # Composants photobooth
│   ├── arEffects/          # Effets AR (réalité augmentée)
│   ├── mobileControl/      # Contrôle mobile
│   ├── kiosk/              # Mode kiosque
│   └── ...
├── context/                # Contextes React (état global)
│   ├── AuthContext.tsx     # Authentification
│   ├── EventContext.tsx    # Gestion des événements
│   ├── PhotosContext.tsx   # Gestion des photos
│   ├── SettingsContext.tsx # Paramètres d'événement
│   └── ToastContext.tsx    # Notifications toast
├── services/               # Services métier (logique isolée)
│   ├── supabaseClient.ts   # Client Supabase configuré
│   ├── photoService.ts     # CRUD photos
│   ├── eventService.ts     # Gestion événements
│   ├── guestService.ts     # Gestion invités
│   ├── geminiService.ts    # Intégration Google Gemini (IA)
│   ├── settingsService.ts  # Paramètres événement
│   ├── battleService.ts    # Battles photos
│   ├── exportService.ts    # Export ZIP
│   ├── aftermovieService.ts # Génération aftermovie
│   ├── faceRecognitionService.ts # Reconnaissance faciale
│   └── ...
├── utils/                  # Utilitaires réutilisables
│   ├── validation.ts       # Validation de données
│   ├── imageFilters.ts     # Filtres d'image
│   ├── imageOverlay.ts     # Overlays et cadres
│   ├── logger.ts           # Logging structuré
│   └── ...
├── hooks/                  # Hooks React personnalisés
│   ├── useIsMobile.ts      # Détection mobile
│   ├── useImageCompression.ts # Compression d'images
│   ├── useDebounce.ts      # Debounce pour recherche
│   ├── useCamera.ts        # Gestion caméra
│   └── ...
├── supabase/               # Scripts SQL Supabase
│   ├── supabase_setup.sql  # Setup de base
│   ├── supabase_complete_setup.sql # Setup complet (recommandé)
│   ├── supabase_events_migration.sql # Migration multi-événements
│   └── ...                 # Autres migrations
├── electron/               # Code Electron (desktop)
│   ├── main.ts            # Processus principal
│   ├── preload.ts         # Script preload
│   └── types.d.ts         # Types Electron
├── workers/                # Web Workers
│   └── imageCompression.worker.ts # Compression d'images
├── public/                 # Assets statiques
│   ├── cadres/            # Cadres décoratifs
│   ├── models/            # Modèles IA (face-api)
│   └── sounds/            # Sons et effets
├── scripts/                # Scripts utilitaires
│   ├── generate-icons.js  # Génération d'icônes
│   └── download-face-api-models.js # Téléchargement modèles
├── types.ts                # Types TypeScript partagés
├── constants.ts            # Constantes globales
├── App.tsx                 # Composant racine (routing)
├── index.tsx               # Point d'entrée React
├── vite.config.ts          # Configuration Vite
├── tsconfig.json           # Configuration TypeScript
└── package.json            # Dépendances et scripts
```

### Organisation des fichiers

- **`components/`** : Un composant par fichier, organisés par fonctionnalité
- **`services/`** : Toute la logique métier isolée, pas de logique dans les composants
- **`context/`** : État global partagé via Context API
- **`utils/`** : Fonctions utilitaires pures, réutilisables
- **`hooks/`** : Hooks React personnalisés pour logique réutilisable
- **`supabase/`** : Scripts SQL pour migrations et setup

---

## 🔐 Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Supabase Configuration (requis)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Google Gemini API (requis)
GEMINI_API_KEY=votre_cle_api_gemini
```

### Tableau des variables

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (publique) Supabase | ✅ Oui | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui | `AIzaSy...` |

### Où trouver ces valeurs ?

#### Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings > API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

#### Google Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Copiez la clé générée → `GEMINI_API_KEY`

**⚠️ Important** : 
- Le fichier `.env` ne doit **jamais** être versionné dans Git (déjà dans `.gitignore`)
- Ne partagez jamais vos clés API publiquement
- Pour la production, utilisez les variables d'environnement de votre plateforme de déploiement

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture détaillée du système
- **[API_DOCS.md](./API_DOCS.md)** : Documentation des services et API
- **[DB_SCHEMA.md](./DB_SCHEMA.md)** : Schéma de la base de données
- **[ROADMAP.md](./ROADMAP.md)** : Feuille de route et fonctionnalités futures
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** : Guide de contribution

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez lire le [guide de contribution](./CONTRIBUTING.md) pour plus de détails.

### Workflow de contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Bonnes pratiques

- ✅ Suivre les conventions de code (voir `.cursorrules`)
- ✅ Ajouter des tests si possible
- ✅ Documenter les nouvelles fonctionnalités
- ✅ Vérifier que le code compile sans erreurs TypeScript
- ✅ Tester manuellement avant de soumettre

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE.md](./LICENSE.md) pour plus de détails.

---

## 🆘 Support & Aide

### Documentation complète

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture détaillée du système
- **[API_DOCS.md](./API_DOCS.md)** : Documentation complète des services et API
- **[DB_SCHEMA.md](./DB_SCHEMA.md)** : Schéma de la base de données Supabase
- **[ROADMAP.md](./ROADMAP.md)** : Feuille de route et fonctionnalités futures
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** : Guide de contribution au projet

### Problèmes courants

#### L'application ne se connecte pas à Supabase

1. Vérifiez que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctement définies dans `.env`
2. Vérifiez que le fichier `.env` est à la racine du projet
3. Redémarrez le serveur de développement après modification de `.env`

#### Les photos ne s'affichent pas en temps réel

1. Vérifiez que Realtime est activé dans Supabase (Database > Replication)
2. Vérifiez que les tables `photos`, `likes`, `reactions` ont la réplication activée
3. Vérifiez les politiques RLS dans Supabase

#### Erreur "Gemini API key missing"

1. Vérifiez que `GEMINI_API_KEY` est défini dans `.env`
2. Vérifiez que la clé API est valide sur [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Redémarrez le serveur de développement

### Signaler un bug

Ouvrez une [issue sur GitHub](https://github.com/votre-repo/issues) avec :
- Description du problème
- Étapes pour reproduire
- Comportement attendu vs comportement actuel
- Environnement (OS, navigateur, version Node.js)
- Captures d'écran si applicable

### Proposer une fonctionnalité

Ouvrez une [issue sur GitHub](https://github.com/votre-repo/issues) avec le label `enhancement` :
- Description de la fonctionnalité
- Cas d'usage
- Bénéfices attendus

---

## 🆘 Support

- **Documentation** : Consultez les fichiers de documentation dans le dossier `docs/`
- **Issues** : Ouvrez une issue sur GitHub pour signaler un bug ou proposer une fonctionnalité
- **Email** : [votre-email@example.com]

---

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour le backend-as-a-service
- [Google Gemini](https://ai.google.dev/) pour l'intelligence artificielle
- [React](https://react.dev/) pour le framework UI
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- Tous les contributeurs qui ont participé au projet

---

**Fait avec ❤️ pour transformer vos événements en expériences mémorables**

