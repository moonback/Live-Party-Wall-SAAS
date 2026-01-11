# 🏗️ Architecture - Partywall

Ce document décrit l'architecture technique complète de l'application Partywall.

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture générale](#-architecture-générale)
- [Frontend](#-frontend)
- [Backend & Infrastructure](#-backend--infrastructure)
- [Base de données](#-base-de-données)
- [Flux de données](#-flux-de-données)
- [Sécurité](#-sécurité)
- [Performance](#-performance)

---

## 🎯 Vue d'ensemble

Partywall est une **application web SaaS** construite avec une architecture moderne et scalable :

- **Frontend** : React 19 avec TypeScript, Vite, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Storage, Realtime, Auth)
- **IA** : Google Gemini 3 Flash pour modération et légendes
- **Déploiement** : Application web (SPA) + option Electron pour desktop

### Principes architecturaux

- ✅ **Séparation des responsabilités** : Services isolés, composants "stupides"
- ✅ **Type Safety** : TypeScript strict partout
- ✅ **Performance** : Lazy loading, virtualisation, compression
- ✅ **Scalabilité** : Architecture SaaS multi-événements
- ✅ **Sécurité** : RLS Supabase, validation côté client et serveur

---

## 🏛️ Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application (SPA)                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │Components│  │ Contexts │  │  Hooks   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │         │              │              │             │   │
│  │         └──────────────┼──────────────┘             │   │
│  │                       │                            │   │
│  │              ┌─────────▼─────────┐                  │   │
│  │              │   Services Layer  │                  │   │
│  │              │  (Business Logic) │                  │   │
│  │              └─────────┬─────────┘                  │   │
│  └───────────────────────┼───────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    SUPABASE (Backend)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Storage    │  │   Realtime   │      │
│  │  (Database)  │  │   (Files)    │  │ (WebSockets) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘           │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │     Auth      │                        │
│                    │  (JWT Tokens) │                        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              GOOGLE GEMINI API (IA)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Modération de contenu                              │   │
│  │  • Génération de légendes                             │   │
│  │  • Amélioration d'images                              │   │
│  │  • Analyse de qualité                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend

### Structure des composants

```
components/
├── landing/           # Landing page SaaS
│   ├── Hero.tsx       # Hero section avec scène 3D
│   ├── Features.tsx   # Section fonctionnalités
│   └── ...
├── gallery/           # Galerie de photos
├── projection/        # Mode projection grand écran
├── wall/              # Mur interactif
├── stats/             # Statistiques et analytics
└── ...
```

### Patterns utilisés

#### 1. Service Layer Pattern

Toute la logique métier est isolée dans `/services` :

```typescript
// ❌ Mauvais : Logique dans le composant
const GuestUpload = () => {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { ... });
    // ...
  };
};

// ✅ Bon : Service isolé
// services/photoService.ts
export const uploadPhoto = async (file: File, eventId: string): Promise<Photo> => {
  // Logique métier isolée
};

// components/GuestUpload.tsx
const GuestUpload = () => {
  const handleUpload = async (file: File) => {
    const photo = await uploadPhoto(file, currentEvent.id);
    // ...
  };
};
```

#### 2. Context API pour l'état global

```typescript
// context/EventContext.tsx
export const EventProvider: React.FC = ({ children }) => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  // ...
  return (
    <EventContext.Provider value={{ currentEvent, setCurrentEvent, ... }}>
      {children}
    </EventContext.Provider>
  );
};

// Utilisation dans les composants
const MyComponent = () => {
  const { currentEvent } = useEvent();
  // ...
};
```

#### 3. Lazy Loading pour la performance

```typescript
// App.tsx
const GuestUpload = lazy(() => import('./components/GuestUpload'));
const WallView = lazy(() => import('./components/WallView'));

// Utilisation avec Suspense
<Suspense fallback={<LoadingSpinner />}>
  <GuestUpload />
</Suspense>
```

### Gestion d'état

- **État local** : `useState`, `useReducer` pour l'état composant
- **État global** : Context API pour l'état partagé (événements, photos, settings)
- **Pas de Redux/Zustand** : Context API suffit pour la taille actuelle

### Routing

Routing manuel basé sur les paramètres d'URL (`?mode=guest`, `?mode=wall`, etc.) :

```typescript
// App.tsx
const [viewMode, setViewMode] = useState<ViewMode>('landing');

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') as ViewMode;
  if (mode) setViewMode(mode);
}, []);
```

---

## 🔧 Backend & Infrastructure

### Supabase

Supabase fournit tous les services backend nécessaires :

#### 1. PostgreSQL (Base de données)

- **Tables principales** : `events`, `photos`, `guests`, `likes`, `event_settings`
- **RLS (Row Level Security)** : Sécurité au niveau des lignes
- **Indexes** : Optimisation des requêtes fréquentes
- **Triggers** : Mise à jour automatique des compteurs (likes, etc.)

#### 2. Storage (Fichiers)

- **Buckets** :
  - `party-photos` : Photos des invités
  - `party-frames` : Cadres décoratifs
  - `party-avatars` : Avatars des utilisateurs
- **Politiques** : Accès public en lecture, upload authentifié pour certains buckets

#### 3. Realtime (WebSockets)

Synchronisation temps réel pour :
- Nouvelles photos sur le mur
- Mises à jour de likes
- Changements de paramètres d'événement
- Nouveaux invités

```typescript
// Exemple d'abonnement Realtime
const subscription = supabase
  .channel('photos')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'photos',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Nouvelle photo reçue
    addPhotoToState(payload.new);
  })
  .subscribe();
```

#### 4. Auth (Authentification)

- **Email/Password** : Pour les organisateurs
- **JWT Tokens** : Gestion automatique par Supabase
- **RLS** : Les politiques utilisent `auth.uid()` pour filtrer par utilisateur

### Google Gemini API

Intégration pour :

1. **Modération de contenu** :
   ```typescript
   const isAppropriate = await moderateImage(base64Image);
   if (!isAppropriate) {
     throw new Error('Contenu inapproprié');
   }
   ```

2. **Génération de légendes** :
   ```typescript
   const caption = await generateImageCaption(base64Image, eventContext);
   // "Moment magique à jamais gravé ! 💍✨"
   ```

3. **Amélioration d'images** : Analyse de qualité et suggestions

4. **Génération de tags** : Tags sémantiques pour améliorer la recherche

---

## 🎬 Génération d'Aftermovies

Les aftermovies sont générés côté client avec les technologies suivantes :

### Technologies utilisées

- **Canvas API** : Dessin des frames vidéo
- **MediaRecorder API** : Encodage vidéo
- **Web Workers** : Traitement en arrière-plan pour ne pas bloquer l'UI
- **JSZip** : Compression si nécessaire

### Processus de génération

```typescript
1. Sélection des photos
   ↓
2. Chargement et redimensionnement des images
   ↓
3. Création d'un canvas pour chaque frame
   ↓
4. Application des transitions (fade, slide, etc.)
   ↓
5. Encodage vidéo avec MediaRecorder
   ↓
6. Upload vers Supabase Storage
   ↓
7. Insertion dans la table aftermovies
```

### Options de personnalisation

- **Résolution** : HD (720p), Full HD (1080p), Story (9:16)
- **Durée par photo** : 0.5s à 5s
- **Transitions** : fade, slide, zoom, etc.
- **Audio** : Musique de fond avec contrôle volume
- **Cadres décoratifs** : Overlay PNG optionnel

---

## 🗄️ Base de données

### Schéma principal

```
events (Événements)
├── id (UUID, PK)
├── slug (TEXT, UNIQUE) -- Identifiant URL
├── name (TEXT)
├── description (TEXT)
├── owner_id (UUID, FK → auth.users)
├── created_at (TIMESTAMPTZ)
└── is_active (BOOLEAN)

photos (Photos)
├── id (UUID, PK)
├── url (TEXT) -- URL Supabase Storage
├── caption (TEXT) -- Légende générée par IA
├── author (TEXT) -- Nom de l'invité
├── event_id (UUID, FK → events)
├── type (TEXT) -- 'photo' | 'video'
├── duration (NUMERIC) -- Pour les vidéos
├── likes_count (INTEGER)
├── tags (TEXT[]) -- Tags suggérés par l'IA
├── user_description (TEXT) -- Description utilisateur
└── created_at (TIMESTAMPTZ)

guests (Invités)
├── id (UUID, PK)
├── event_id (UUID, FK → events)
├── name (TEXT)
├── avatar_url (TEXT)
└── created_at (TIMESTAMPTZ)

likes (Likes)
├── id (UUID, PK)
├── photo_id (UUID, FK → photos)
├── user_identifier (TEXT) -- Nom invité
└── created_at (TIMESTAMPTZ)

reactions (Réactions)
├── id (UUID, PK)
├── photo_id (UUID, FK → photos)
├── user_identifier (TEXT)
├── reaction_type (TEXT) -- 'heart' | 'laugh' | 'cry' | 'fire' | 'wow' | 'thumbsup'
└── created_at (TIMESTAMPTZ)

event_settings (Paramètres)
├── id (UUID, PK)
├── event_id (UUID, FK → events, UNIQUE)
├── frame_enabled (BOOLEAN)
├── battle_mode_enabled (BOOLEAN)
├── collage_mode_enabled (BOOLEAN)
├── event_context (TEXT) -- Contexte pour IA
├── alert_text (TEXT) -- Message d'alerte
└── ... (autres paramètres)

event_organizers (Organisateurs)
├── id (UUID, PK)
├── event_id (UUID, FK → events)
├── user_id (UUID, FK → auth.users)
└── role (TEXT) -- 'owner' | 'organizer' | 'viewer'

photo_battles (Battles)
├── id (UUID, PK)
├── event_id (UUID, FK → events)
├── photo_a_id (UUID, FK → photos)
├── photo_b_id (UUID, FK → photos)
├── votes_a (INTEGER)
├── votes_b (INTEGER)
├── status (TEXT) -- 'active' | 'completed' | 'cancelled'
└── created_at (TIMESTAMPTZ)

aftermovies (Aftermovies)
├── id (UUID, PK)
├── event_id (UUID, FK → events)
├── url (TEXT) -- URL Supabase Storage
├── storage_path (TEXT)
├── filename (TEXT)
├── file_size (BIGINT)
├── duration_seconds (NUMERIC)
├── download_count (INTEGER)
└── created_at (TIMESTAMPTZ)
```

### Relations

- **events** → **photos** : 1-N (un événement a plusieurs photos)
- **events** → **guests** : 1-N (un événement a plusieurs invités)
- **events** → **event_settings** : 1-1 (un événement a un seul paramètre)
- **events** → **aftermovies** : 1-N (un événement a plusieurs aftermovies)
- **photos** → **likes** : 1-N (une photo a plusieurs likes)
- **photos** → **reactions** : 1-N (une photo a plusieurs réactions)
- **photos** → **photo_battles** : N-N (une photo peut être dans plusieurs battles)
- **events** → **event_organizers** : 1-N (un événement a plusieurs organisateurs)

### Indexes

Index créés pour optimiser les requêtes fréquentes :

```sql
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_events_slug ON events(slug);
```

---

## 🔄 Flux de données

### Upload d'une photo

```
1. Invité prend/choisit une photo
   ↓
2. Composant GuestUpload valide le fichier
   ↓
3. Service photoService.uploadPhoto() :
   - Compresse l'image
   - Upload vers Supabase Storage
   - Génère une URL publique
   ↓
4. Service geminiService :
   - Modère le contenu (isAppropriate)
   - Génère une légende (generateCaption)
   - Analyse la qualité
   ↓
5. Service photoService.addPhotoToWall() :
   - Insère dans la table photos
   - Met à jour les statistiques
   ↓
6. Supabase Realtime :
   - Émet un événement INSERT
   - Tous les clients connectés reçoivent la nouvelle photo
   ↓
7. Composants WallView et ProjectionWall :
   - Reçoivent la nouvelle photo via subscription
   - Affichent en temps réel
```

### Synchronisation temps réel

```typescript
// 1. Abonnement aux nouvelles photos
useEffect(() => {
  const channel = supabase
    .channel(`photos:${eventId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'photos',
      filter: `event_id=eq.${eventId}`
    }, (payload) => {
      setPhotos(prev => [...prev, payload.new as Photo]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [eventId]);
```

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des politiques spécifiques :

```sql
-- Exemple : Politique pour les photos
CREATE POLICY "Public Read Photos"
ON photos FOR SELECT
TO anon, authenticated
USING (event_id IN (
  SELECT id FROM events WHERE is_active = true
));
```

### Validation côté client

- **Taille de fichier** : Max 10MB pour photos, 50MB pour vidéos
- **Types MIME** : Seulement images/vidéos autorisés
- **Longueur de texte** : Limites sur noms, descriptions, légendes

### Variables d'environnement

- **Préfixe `VITE_`** : Variables exposées au client (URL Supabase, clé anon)
- **Sans préfixe** : Variables serveur uniquement (clé Gemini côté serveur idéalement)

---

## ⚡ Performance

### Optimisations frontend

1. **Lazy Loading** : Tous les composants principaux sont lazy-loaded
2. **Virtualisation** : `@tanstack/react-virtual` pour les grandes listes
3. **Compression d'images** : Compression avant upload
4. **Memoization** : `useMemo`, `useCallback` pour éviter les re-renders
5. **Code Splitting** : Vite fait automatiquement le code splitting

### Optimisations backend

1. **Indexes** : Sur toutes les colonnes fréquemment requêtées
2. **Pagination** : Limite des résultats pour les grandes listes
3. **Caching** : Cache des résultats Gemini (évite les appels répétés)
4. **Realtime sélectif** : Abonnements uniquement aux données nécessaires

---

## 📊 Monitoring & Analytics

### Métriques suivies

- Nombre de photos par événement
- Nombre de likes
- Nombre d'invités
- Temps de traitement IA
- Erreurs et exceptions

### Logs

- **Console** : Logs de développement
- **Supabase Logs** : Logs des requêtes SQL
- **Error Tracking** : À implémenter (Sentry, etc.)

---

**Dernière mise à jour** : 2026-01-15

