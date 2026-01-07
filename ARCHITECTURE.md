# 🏗️ Architecture - Live Party Wall

Ce document décrit l'architecture technique complète de l'application Live Party Wall, de la structure frontend aux interactions backend.

---

## 📐 Vue d'Ensemble

Live Party Wall est une **Single Page Application (SPA)** React qui utilise Supabase comme Backend-as-a-Service (BaaS) pour la persistance, l'authentification et la communication en temps réel.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              React 19 + TypeScript + Vite              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Landing  │  │  Guest   │  │   Wall   │  Admin    │  │
│  │  │   Page   │  │  Upload  │  │   View   │  Dashboard │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │         Services Layer (Business Logic)       │     │  │
│  │  │  photoService | geminiService | settings...  │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │         Supabase Client (SDK)               │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend BaaS)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   Storage    │  │   Realtime   │     │
│  │   Database   │  │   (Buckets)  │  │  (WebSocket) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │     Auth     │  │   RLS        │                       │
│  │  (Sessions)  │  │  (Security)  │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│              Google Gemini API (External)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Vision API: Modération, Légendes, Analyse d'images │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Architecture Frontend

### Structure des Composants

L'application suit une architecture **composants fonctionnels** avec React Hooks et un système de routing basé sur l'état local.

```
App.tsx (Root)
├── ToastProvider (Context)
│   └── AppContent
│       ├── Landing (mode: 'landing')
│       ├── GuestUpload (mode: 'guest')
│       ├── GuestGallery (mode: 'gallery')
│       ├── WallView (mode: 'wall')
│       └── AdminLogin / AdminDashboard (mode: 'admin')
```

#### Composants Principaux

| Composant | Responsabilité | Props Principales |
|-----------|----------------|-------------------|
| `Landing` | Page d'accueil avec sélection de mode | `onSelectMode: (mode: ViewMode) => void` |
| `GuestUpload` | Interface d'upload photo/vidéo (caméra/galerie) | `onPhotoUploaded`, `onBack`, `onCollageMode` |
| `GuestGallery` | Galerie photos avec likes, filtres et recherche | `onBack`, `onUploadClick` |
| `CollageMode` | Mode collage pour assembler 2-4 photos | `onCollageUploaded`, `onBack` |
| `WallView` | Affichage mur (grand écran) | `photos: Photo[]`, `onBack` |
| `ProjectionWall` | Mode projection murale (diaporama automatique) | `photos: Photo[]`, `onBack`, `displayDuration`, `transitionDuration` |
| `AdminDashboard` | Dashboard admin (modération, analytics, config) | `onBack` |
| `AdminLogin` | Authentification admin | `onLoginSuccess`, `onBack` |
| `UserOnboarding` | Onboarding utilisateur (nom, avatar) | `onComplete`, `onBack` |
| `StatsPage` | Affichage des statistiques et leaderboard | `photos: Photo[]`, `isDisplayMode?`, `onBack` |
| `HelpPage` | Page d'aide et instructions | `onBack` |
| `Toast` | Notification toast | `message`, `type`, `onClose` |

### Gestion d'État

L'application utilise une combinaison de :

1. **État Local (useState)** : Pour l'état UI (viewMode, photos, etc.)
2. **Context API** : Pour les toasts globaux (`ToastContext`)
3. **Supabase Realtime** : Pour la synchronisation des données en temps réel

```typescript
// Exemple de flux de données
App.tsx
  ├── useState<Photo[]>(photos)        // État local des photos
  ├── subscribeToNewPhotos()            // Subscription Realtime
  └── ToastContext                      // Notifications globales
```

### Lazy Loading

Tous les composants principaux sont chargés de manière **lazy** pour optimiser le temps de chargement initial :

```typescript
const Landing = lazy(() => import('./components/Landing'));
const GuestUpload = lazy(() => import('./components/GuestUpload'));
// ...
```

### Services Layer

Les services encapsulent toute la logique métier et les interactions avec les APIs externes :

```
services/
├── supabaseClient.ts      # Client Supabase configuré
├── photoService.ts         # CRUD photos/vidéos (upload, fetch, delete, likes)
├── geminiService.ts        # Génération de légendes IA
├── aiModerationService.ts  # Modération et analyse d'images
├── settingsService.ts      # Gestion des paramètres d'événement
├── frameService.ts         # Upload/gestion des cadres décoratifs
├── exportService.ts        # Export ZIP des photos
├── gamificationService.ts  # Badges, classements et statistiques
└── localFramesService.ts   # Gestion des cadres locaux (public/cadres)
```

**Principe** : Les composants appellent les services, qui gèrent les appels API et la transformation des données.

---

## 🗄️ Architecture Backend (Supabase)

### Base de Données PostgreSQL

#### Tables Principales

1. **`photos`** : Stocke les métadonnées des photos
   - `id` (UUID, PK)
   - `url` (TEXT) : URL publique Supabase Storage
   - `caption` (TEXT) : Légende générée par IA
   - `author` (TEXT) : Nom de l'auteur
   - `created_at` (TIMESTAMPTZ)
   - `likes_count` (INTEGER) : Compteur de likes
   - `type` (TEXT) : 'photo' ou 'video'
   - `duration` (NUMERIC) : Durée en secondes (pour vidéos)

2. **`likes`** : Table de jointure pour les likes
   - `id` (UUID, PK)
   - `photo_id` (UUID, FK → photos.id)
   - `user_identifier` (TEXT) : ID unique client (localStorage)
   - `created_at` (TIMESTAMPTZ)
   - Contrainte unique : `(photo_id, user_identifier)`

3. **`event_settings`** : Configuration de l'événement (singleton)
   - `id` (BIGINT, PK, toujours = 1)
   - `event_title` (TEXT)
   - `event_subtitle` (TEXT)
   - `scroll_speed` (TEXT) : 'slow' | 'normal' | 'fast'
   - `slide_transition` (TEXT) : 'fade' | 'slide' | 'zoom'
   - `decorative_frame_enabled` (BOOLEAN)
   - `decorative_frame_url` (TEXT, nullable)
   - `caption_generation_enabled` (BOOLEAN)
   - `content_moderation_enabled` (BOOLEAN)
   - `video_capture_enabled` (BOOLEAN)
   - `collage_mode_enabled` (BOOLEAN)
   - `stats_enabled` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

#### Row Level Security (RLS)

Toutes les tables sont protégées par RLS avec les politiques suivantes :

**Table `photos`** :
- ✅ **SELECT** : Public (anon + authenticated)
- ✅ **INSERT** : Public (anon + authenticated)
- ❌ **DELETE** : Authenticated uniquement (admin)

**Table `likes`** :
- ✅ **SELECT** : Public
- ✅ **INSERT** : Public
- ✅ **DELETE** : Public (pour unlike)

**Table `event_settings`** :
- ✅ **SELECT** : Public
- ❌ **UPDATE/INSERT** : Authenticated uniquement (admin)

### Storage (Buckets)

1. **`party-photos`** : Stockage des photos uploadées
   - Public : ✅ Lecture publique
   - Upload : ✅ Public (anon + authenticated)
   - Delete : ❌ Authenticated uniquement (admin)

2. **`party-frames`** : Stockage des cadres décoratifs
   - Public : ✅ Lecture publique
   - Upload/Update/Delete : ❌ Authenticated uniquement (admin)

### Realtime (WebSockets)

Supabase Realtime est activé pour :

- **Table `photos`** : Événements `INSERT` → Notification instantanée aux clients
- **Table `likes`** : Événements `INSERT`/`DELETE` → Mise à jour des compteurs

**Flux Realtime** :
```
1. Client A upload une photo
   ↓
2. INSERT dans table `photos`
   ↓
3. Supabase Realtime émet événement
   ↓
4. Tous les clients abonnés reçoivent la nouvelle photo
   ↓
5. WallView et GuestGallery se mettent à jour automatiquement
```

### Authentification

- **Provider** : Supabase Auth (email/password)
- **Sessions** : Gérées par Supabase (JWT tokens)
- **Usage** : Uniquement pour l'accès admin (modération, configuration)

---

## 🔄 Flux de Données

### Upload d'une Photo (Flux Complet)

```
1. GuestUpload Component
   │
   ├─> 2. Capture/Select Image (File)
   │
   ├─> 3. validateImageFile() [utils/validation.ts]
   │
   ├─> 4. Process Image (resize, compress) [utils/imageFilters.ts]
   │
   ├─> 5. aiModerationService.isImageAppropriate()
   │    │
   │    └─> Google Gemini API (Vision)
   │        └─> Analyse: contenu, visages, qualité
   │
   ├─> 6. geminiService.generateImageCaption()
   │    │
   │    └─> Google Gemini API (Text Generation)
   │        └─> Légende festive générée
   │
   ├─> 7. photoService.addPhotoToWall()
   │    │
   │    ├─> Convert Base64 → Blob
   │    ├─> Upload to Supabase Storage (bucket: party-photos)
   │    ├─> Get Public URL
   │    └─> INSERT into table `photos`
   │
   └─> 8. Supabase Realtime émet événement INSERT
        │
        └─> 9. Tous les clients reçoivent la nouvelle photo
             ├─> WallView se met à jour
             └─> GuestGallery se met à jour
```

### Affichage du Mur (WallView)

```
1. App.tsx charge les photos initiales
   │
   ├─> photoService.getPhotos()
   │   └─> SELECT * FROM photos ORDER BY created_at
   │
   └─> subscribeToNewPhotos()
       └─> Supabase Channel: 'public:photos'
           └─> Écoute événements INSERT
               └─> Ajoute nouvelles photos à l'état local

2. WallView reçoit photos[] en props
   │
   ├─> Mode Masonry: Grille responsive
   │
   └─> Mode Kiosque: Diaporama plein écran
       ├─> settingsService.getSettings() (titre, vitesse, transition)
       └─> Auto-play avec transitions
```

### Système de Likes

```
1. GuestGallery: User clique sur ❤️
   │
   ├─> photoService.toggleLike(photoId, userIdentifier)
   │   │
   │   ├─> Check if like exists (SELECT from likes)
   │   │
   │   ├─> Si existe: DELETE like + decrement counter
   │   │
   │   └─> Si n'existe pas: INSERT like + increment counter
   │
   └─> Supabase Realtime émet événement
       └─> Tous les clients mettent à jour le compteur
```

---

## 🔌 Intégrations Externes

### Google Gemini API

**Endpoints utilisés** :
- `models.generateContent()` : Génération de contenu multimodal

**Usages** :
1. **Génération de légendes** (`geminiService.ts`)
   - Input : Image (base64) + Prompt texte
   - Output : Légende festive (string)

2. **Modération et analyse** (`aiModerationService.ts`)
   - Input : Image (base64) + Prompt JSON structuré
   - Output : JSON avec `isAppropriate`, `hasFaces`, `quality`, etc.

**Modèles utilisés** :
- **Légendes** : `gemini-2.5-flash` (rapide, économique)
- **Modération** : `gemini-3-flash-preview` (multimodal, analyse avancée)

---

## 🎯 Patterns Architecturaux

### 1. Service Layer Pattern

Toute la logique métier est isolée dans les services, les composants restent "stupides" (presentation only).

```typescript
// ❌ Mauvais : Logique dans le composant
const GuestUpload = () => {
  const upload = async () => {
    const blob = await convertBase64ToBlob(image);
    await supabase.storage.from('party-photos').upload(...);
    // ...
  };
};

// ✅ Bon : Service encapsule la logique
const GuestUpload = () => {
  const upload = async () => {
    await photoService.addPhotoToWall(base64, caption, author);
  };
};
```

### 2. Context API pour l'État Global

Les toasts sont gérés via un Context pour éviter le prop drilling.

### 3. Lazy Loading pour la Performance

Tous les composants lourds sont chargés à la demande.

### 4. Type Safety avec TypeScript

Tous les types sont définis dans `types.ts` et réutilisés partout.

---

## 🔒 Sécurité

### Côté Client
- Validation stricte des fichiers (taille, type MIME)
- Sanitization des inputs texte (prévention XSS)
- Gestion des erreurs avec fallbacks

### Côté Backend (Supabase)
- **RLS** : Protection au niveau des lignes
- **Storage Policies** : Contrôle d'accès aux buckets
- **Auth** : Sessions sécurisées pour les admins
- **API Keys** : Clés publiques uniquement (pas de secrets côté client)

---

## 📊 Performance

### Optimisations Actuelles
- ✅ Lazy loading des composants
- ✅ Compression d'images avant upload
- ✅ Limite de photos en mémoire (`MAX_PHOTOS_HISTORY = 50`)
- ✅ Cache Control sur les assets Supabase Storage

### Optimisations Futures (Roadmap)
- ⏳ Virtualisation de la grille photos (`react-window`)
- ⏳ PWA avec cache offline
- ⏳ Image lazy loading avec intersection observer

---

## 🧪 Tests (À Implémenter)

L'architecture est prête pour les tests :

- **Unit Tests** : Services (mocks Supabase/Gemini)
- **Integration Tests** : Flux complets (upload → affichage)
- **E2E Tests** : Scénarios utilisateur (Playwright/Cypress)

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React](https://react.dev)
- [Documentation Gemini API](https://ai.google.dev/docs)
- [Vite Documentation](https://vitejs.dev)

