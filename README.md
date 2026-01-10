<div align="center">

# 🎉 Live Party Wall

### Application SaaS de mur photo interactif en temps réel enrichie par l'IA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE.md)

[🚀 Démo](#) • [📖 Documentation](#documentation-complémentaire) • [🐛 Report Bug](#) • [✨ Request Feature](#)

![Banner](https://live-party-wall-saas.vercel.app/banner.png)

</div>

---

## ✨ Présentation

**Live Party Wall** transforme chaque événement en une expérience mémorable et interactive. Vos invités deviennent créateurs de contenu : leurs photos apparaissent instantanément sur grand écran, enrichies par l'intelligence artificielle.

### 🎯 Cas d'usage

```
💍 Mariages          🎂 Anniversaires       🏢 Événements d'entreprise
🎊 Soirées privées   🤝 Team building       📊 Séminaires & Conférences
```

### 🌟 Vision

Créer une animation collective et engageante où chaque photo devient un moment partagé, amplifié par l'IA pour générer des légendes personnalisées et garantir un contenu approprié.

---

## 🚀 Fonctionnalités principales

<table>
<tr>
<td width="50%">

### 👥 Pour les invités

- 📸 **Upload instantané** - Photo/vidéo avec compression auto
- 🎨 **Mode collage** - Assemblez jusqu'à 4 photos
- 📷 **Photobooth interactif** - Filtres & cadres en temps réel
- ❤️ **Likes & réactions** - 6 types d'émojis disponibles
- 🔍 **Recherche IA "Retrouve-moi"** - Reconnaissance faciale
- 📥 **Téléchargement** - Export individuel ou ZIP groupé
- 🏆 **Gamification** - Badges et classements

</td>
<td width="50%">

### 🎛️ Pour les organisateurs

- 📊 **Dashboard temps réel** - Statistiques live
- 🎪 **Multi-événements** - Architecture SaaS complète
- 👮 **Modération IA** - Filtrage automatique du contenu
- ⚙️ **Personnalisation** - Paramètres granulaires
- 🖼️ **Mode projection** - Optimisé pour grand écran
- ⚔️ **Battles photos** - Créez des duels votés en direct
- 🎬 **Aftermovie** - Génération automatique de timelapse
- 👥 **Gestion d'équipe** - Rôles et permissions

</td>
</tr>
</table>

---

## 🛠️ Stack technique

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.24-FF0080?style=flat-square)](https://www.framer.com/motion/)

### Backend & Infrastructure
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Storage](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Realtime](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Auth](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

### Intelligence Artificielle
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_3_Flash-AI-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)

</div>

<details>
<summary><b>📦 Bibliothèques complètes</b></summary>

| Catégorie | Bibliothèques |
|-----------|---------------|
| **UI & Animation** | Lucide React 0.562, Framer Motion 12.24 |
| **Utilitaires** | JSZip 3.10, File Saver 2.0, QRCode React 4.2 |
| **IA & Reconnaissance** | Face-api.js 0.22, Google Gemini API |
| **Performance** | @tanstack/react-virtual 3.13 |
| **Validation** | Zod 4.3 |
| **Desktop** | Electron 39.2 |

</details>

---

## 🏗️ Architecture

```
📁 Live-Party-Wall-SAAS/
├── 🎨 components/          # Composants React par fonctionnalité
│   ├── landing/           # Landing page SaaS
│   ├── gallery/           # Galerie avec filtres
│   ├── projection/        # Mode grand écran
│   ├── wall/              # Mur interactif
│   ├── stats/             # Analytics
│   ├── admin/             # Dashboard admin
│   └── photobooth/        # Photobooth avec caméra
│
├── 🔧 services/            # Logique métier isolée
│   ├── supabaseClient.ts  # Configuration Supabase
│   ├── photoService.ts    # CRUD photos, likes
│   ├── geminiService.ts   # Intégration IA
│   └── ...
│
├── 🌐 context/             # État global React Context
│   ├── AuthContext.tsx    # Authentification
│   ├── EventContext.tsx   # Multi-tenant
│   ├── PhotosContext.tsx  # Photos avec Realtime
│   └── ...
│
├── 🪝 hooks/               # Hooks personnalisés
│   ├── useIsMobile.ts
│   ├── useCamera.ts
│   └── wall/              # Hooks spécifiques
│
├── 🗄️ supabase/            # Scripts SQL
│   └── supabase_complete_setup.sql
│
└── 🖥️ electron/            # Application desktop
    ├── main.ts
    └── preload.ts
```

### 🎯 Patterns architecturaux

- **Service Layer Pattern** - Logique métier isolée
- **Context API** - État global propre
- **Lazy Loading** - Optimisation du chargement
- **Routing manuel** - Via paramètres URL

---

## 🚦 Démarrage rapide

### 📋 Prérequis

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Compte Supabase
Clé API Google Gemini
```

### ⚡ Installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/Live-Party-Wall-SAAS.git
cd Live-Party-Wall-SAAS

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés
```

### 🔑 Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Supabase (Dashboard > Settings > API)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Google Gemini (https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=votre_cle_api_gemini
```

### 🗄️ Configuration de la base de données

1. Ouvrez votre [Dashboard Supabase](https://app.supabase.com)
2. Allez dans **SQL Editor**
3. Exécutez le script complet :

```sql
-- Copiez et exécutez : supabase/supabase_complete_setup.sql
```

4. Activez **Realtime** pour les tables :
   - `photos`, `likes`, `reactions`, `event_settings`, `guests`, `photo_battles`

5. Créez votre compte admin dans **Authentication > Users**

### 🎬 Lancement

```bash
# Mode développement web
npm run dev
# → http://localhost:3000

# Mode développement Electron (desktop)
npm run electron:dev

# Build production web
npm run build

# Build + Package Electron
npm run electron:pack
```

---

## 📊 Base de données

<details>
<summary><b>🗂️ Tables principales (cliquez pour développer)</b></summary>

### Tables core

| Table | Description | Relations |
|-------|-------------|-----------|
| **events** | Événements (SaaS multi-tenant) | → photos, guests, settings |
| **photos** | Photos/vidéos partagées | ← events, → likes, reactions |
| **guests** | Invités inscrits | ← events |
| **likes** | Likes sur photos | ← photos |
| **reactions** | Réactions émojis | ← photos |
| **event_settings** | Configuration par événement | ← events |
| **event_organizers** | Organisateurs avec rôles | ← events, auth.users |
| **photo_battles** | Duels entre photos | ← events, photos |

### 🔒 Sécurité

- ✅ **Row Level Security (RLS)** activé sur toutes les tables
- ✅ **Politiques granulaires** par rôle (owner, organizer, viewer)
- ✅ **Lecture publique** pour photos et événements actifs
- ✅ **Modifications authentifiées** pour admin uniquement

### 💾 Storage Buckets

| Bucket | Usage | Politique |
|--------|-------|-----------|
| `party-photos` | Photos invités | Public lecture, upload public |
| `party-frames` | Cadres décoratifs | Public lecture, upload admin |
| `party-avatars` | Avatars invités | Public lecture, upload public |

</details>

---

## 🤖 Intelligence Artificielle

Live Party Wall intègre **Google Gemini 3 Flash** pour :

| Fonctionnalité | Description |
|----------------|-------------|
| 🛡️ **Modération automatique** | Détection de contenu inapproprié (toujours actif) |
| ✍️ **Génération de légendes** | Légendes personnalisées selon type d'événement (max 12 mots) |
| 🏷️ **Tags sémantiques** | Amélioration de la recherche et catégorisation |
| ⚡ **Amélioration qualité** | Optimisation automatique des images de faible qualité |
| 🎯 **Contexte adaptatif** | Personnalisation selon le contexte (mariage, anniversaire...) |

---

## 🎨 Fonctionnalités en détail

<details>
<summary><b>📸 Pour les invités</b></summary>

### Upload de photos
- 📷 Prise directe via caméra
- 🖼️ Upload depuis galerie
- 🎥 Vidéos courtes (max 20s)
- 🗜️ Compression automatique
- ✅ Validation taille/type

### Mode collage
- 🎨 2 à 4 photos assemblées
- 📐 Templates prédéfinis
- 👁️ Prévisualisation temps réel

### Photobooth interactif
- 📹 Capture photo/vidéo
- 🎭 Filtres en temps réel
- 🖼️ Cadres décoratifs (Polaroid, néon, or)
- 📸 Mode rafale (burst)
- ⏱️ Compte à rebours

### Galerie interactive
- 🔍 Recherche textuelle
- 🎯 Filtres par auteur, type, popularité
- 📊 Tri date/popularité
- ⚡ Virtualisation pour performances

### Système social
- ❤️ Likes
- 😂😢🔥😮👍 6 types de réactions émojis
- 1 réaction par utilisateur (modifiable)
- 🔄 Compteurs temps réel

### Profil & Gamification
- 👤 Profil avec nom et avatar
- 📊 Statistiques personnelles
- 🏆 Badges automatiques
- 📈 Classements

### Recherche IA
- 👤 "Retrouve-moi" avec reconnaissance faciale
- 🔍 Filtrage intelligent par visage

### Téléchargement
- 📥 Téléchargement individuel
- 📦 Export ZIP groupé
- 📱 QR code pour accès rapide

</details>

<details>
<summary><b>🎛️ Pour les organisateurs</b></summary>

### Dashboard & Gestion
- 📊 Vue d'ensemble temps réel
- 🎪 Multi-événements (SaaS)
- 🔐 Gestion d'équipe avec rôles
- 👥 Owner, Organizer, Viewer

### Modération
- 📋 Liste complète des photos
- 🗑️ Suppression rapide
- 🚫 Blocage temporaire d'invités
- 📜 Historique des actions

### Paramètres d'événement
- ✅ Activation/désactivation de fonctionnalités
- 🤖 Configuration contexte IA
- 📢 Messages d'alerte
- 🖼️ Images de fond personnalisées
- ⚡ Vitesse de défilement
- ⏱️ Délai carrousel (5-240s)

### Mode projection
- 🖥️ Optimisé grand écran
- 🔄 Transitions automatiques
- ⏯️ Contrôles de lecture
- 🔲 Mode plein écran
- ⏰ Carrousel auto après inactivité

### Analytics
- 📊 Nombre total photos
- ❤️ Likes et réactions
- 👥 Invités inscrits
- 🏆 Top photographes
- ⭐ Photos les plus likées
- 🎖️ Badges attribués
- ⚔️ Résultats battles

### Battles photos
- ⚔️ Création manuelle de duels
- 🤖 Battles automatiques
- 🗳️ Votes temps réel
- 📊 Affichage résultats
- 🖥️ Projection sur grand écran

### Export
- 📦 Export ZIP haute définition
- 🎬 Génération aftermovie automatique
- ⚙️ Personnalisation vidéos
- 📥 Téléchargement facile

### Contrôle mobile
- 📱 Interface optimisée mobile
- ⚡ Gestion rapide
- 👮 Modération simplifiée
- 📊 Stats temps réel
- ⚔️ Création de battles

</details>

---

## ⚡ Temps réel

Toutes ces fonctionnalités utilisent **Supabase Realtime** (WebSockets) :

- 🆕 Nouvelles photos
- ❤️ Likes
- 😊 Réactions
- ⚙️ Paramètres
- ⚔️ Battles
- 👥 Invités
- 📊 Statistiques

---

## 🔒 Sécurité

### ✅ Mesures implémentées

- 🛡️ **Row Level Security (RLS)** - Politiques granulaires
- ✅ **Validation côté client** - Taille, type, longueur
- 🤖 **Modération IA** - Toujours active, non désactivable
- 🔐 **Authentification JWT** - Gestion Supabase
- 🔑 **Variables d'environnement** - Secrets protégés
- 🔒 **HTTPS** - Toutes communications chiffrées
- 🧹 **Sanitization** - Nettoyage des inputs

### 💻 Bonnes pratiques

- ✅ TypeScript strict mode
- ✅ Service Layer Pattern
- ✅ Gestion d'erreurs complète
- ✅ Logging structuré
- ✅ Lazy Loading
- ✅ Virtualisation des listes
- ✅ Compression automatique

---

## 📈 Scalabilité

### Architecture actuelle

- **Frontend** : SPA React déployable sur CDN
- **Backend** : Supabase - scalabilité automatique
- **IA** : Google Gemini API - quota géré par Google

### 🚀 Optimisations possibles

- 💾 Cache des résultats Gemini
- 🌐 CDN pour assets statiques
- 📄 Pagination côté serveur
- 🗜️ Compression serveur supplémentaire
- ⏱️ Rate limiting avancé

### 🔮 Évolutions futures

- 🧪 Tests automatisés (Jest/Vitest, Playwright)
- 📊 Monitoring (Sentry)
- 📈 Analytics (Google Analytics, Plausible)
- 🔔 Notifications push
- 🌍 Multi-langues (i18n)
- 🎨 Système de thèmes
- 🔌 API REST publique
- 🪝 Webhooks

---

## 📚 Documentation complémentaire

| Document | Description |
|----------|-------------|
| [📐 ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture détaillée du système |
| [🔌 API_DOCS.md](./API_DOCS.md) | Documentation complète des services |
| [🗄️ DB_SCHEMA.md](./DB_SCHEMA.md) | Schéma de la base de données |
| [🗺️ ROADMAP.md](./ROADMAP.md) | Feuille de route et futures fonctionnalités |
| [🤝 CONTRIBUTING.md](./CONTRIBUTING.md) | Guide de contribution |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour commencer.

<div align="center">

### 💖 Fait avec passion

Si ce projet vous est utile, n'hésitez pas à ⭐ le repo !

</div>

---

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE.md](./LICENSE.md) pour plus de détails.

---

<div align="center">

**[⬆ Retour en haut](#-live-party-wall)**

Made with ❤️ by [Votre Nom](https://github.com/votre-username)

</div>
