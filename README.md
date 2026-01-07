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
cp .env.example .env  # Si un fichier exemple existe
# Sinon, créez manuellement le fichier .env
```

Remplissez les variables d'environnement (voir section [Variables d'environnement](#-variables-denvironnement)).

### 4. Initialiser la base de données Supabase

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Ouvrez l'**éditeur SQL** de votre projet
3. Exécutez les scripts SQL dans l'ordre suivant :

```sql
-- 1. Setup de base
supabase/supabase_setup.sql

-- 2. Configuration admin
supabase/supabase_admin_setup.sql

-- 3. Système de likes
supabase/supabase_likes_setup.sql

-- 4. Paramètres d'événement
supabase/supabase_settings_setup.sql

-- 5. Migration multi-événements
supabase/supabase_events_migration.sql

-- 6. Setup complet (optionnel, regroupe tout)
supabase/supabase_complete_setup.sql
```

4. **Activer Realtime** :
   - Allez dans **Database > Replication**
   - Activez la réplication pour les tables : `photos`, `likes`, `event_settings`, `guests`

5. **Créer un compte administrateur** :
   - Allez dans **Authentication > Users**
   - Cliquez sur **"Add user"** ou **"Invite user"**
   - Créez un compte avec email et mot de passe

### 5. Télécharger les modèles Face API (optionnel)

Si vous utilisez la fonctionnalité de reconnaissance faciale :

```bash
npm run download:face-models
```

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

### Mode développement (Electron)

```bash
npm run electron:dev
```

### Build de production

```bash
# Build web
npm run build

# Build Electron
npm run electron:build

# Package Electron (créer les installateurs)
npm run electron:pack
```

### Prévisualisation du build

```bash
npm run preview
```

---

## 📁 Structure du projet

```
Live-Party-Wall-SAAS/
├── components/              # Composants React
│   ├── landing/            # Composants de la landing page
│   ├── gallery/            # Composants de galerie
│   ├── projection/         # Composants de projection
│   ├── wall/               # Composants du mur
│   ├── stats/              # Composants de statistiques
│   └── ...
├── context/                # Contextes React (état global)
│   ├── AuthContext.tsx     # Authentification
│   ├── EventContext.tsx    # Gestion des événements
│   ├── PhotosContext.tsx   # Gestion des photos
│   ├── SettingsContext.tsx # Paramètres d'événement
│   └── ToastContext.tsx    # Notifications toast
├── services/               # Services métier
│   ├── supabaseClient.ts   # Client Supabase
│   ├── photoService.ts     # Gestion des photos
│   ├── geminiService.ts    # Intégration Google Gemini
│   ├── eventService.ts     # Gestion des événements
│   └── ...
├── utils/                  # Utilitaires
│   ├── validation.ts       # Validation de données
│   ├── imageFilters.ts     # Filtres d'image
│   ├── imageOverlay.ts     # Overlays et cadres
│   └── ...
├── hooks/                  # Hooks React personnalisés
│   ├── useIsMobile.ts      # Détection mobile
│   ├── useImageCompression.ts # Compression d'images
│   └── ...
├── supabase/               # Scripts SQL Supabase
│   ├── supabase_setup.sql  # Setup de base
│   ├── supabase_complete_setup.sql # Setup complet
│   └── ...
├── electron/               # Code Electron (desktop)
│   ├── main.ts            # Processus principal
│   └── preload.ts         # Script preload
├── types.ts                # Types TypeScript partagés
├── constants.ts            # Constantes globales
├── App.tsx                 # Composant racine
├── index.tsx               # Point d'entrée
├── vite.config.ts          # Configuration Vite
├── tsconfig.json           # Configuration TypeScript
└── package.json            # Dépendances et scripts
```

---

## 🔐 Variables d'environnement

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (publique) Supabase | ✅ Oui | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui | `AIzaSy...` |

**⚠️ Important** : Le fichier `.env` ne doit jamais être versionné dans Git. Il est déjà dans `.gitignore`.

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

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

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

