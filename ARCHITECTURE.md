# 🏗️ Architecture - Live Party Wall

Ce document décrit l'architecture technique complète de l'application Live Party Wall.

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

Live Party Wall est une **application web SaaS** construite avec une architecture moderne et scalable :

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
├── guest_name (TEXT)
└── created_at (TIMESTAMPTZ)

event_settings (Paramètres)
├── id (UUID, PK)
├── event_id (UUID, FK → events, UNIQUE)
├── frame_enabled (BOOLEAN)
├── battle_mode_enabled (BOOLEAN)
├── collage_mode_enabled (BOOLEAN)
└── ... (autres paramètres)

event_organizers (Organisateurs)
├── id (UUID, PK)
├── event_id (UUID, FK → events)
├── user_id (UUID, FK → auth.users)
└── role (TEXT) -- 'owner' | 'organizer' | 'viewer'

subscriptions (Abonnements)
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── plan_type (TEXT) -- Type de plan (monthly_pro, event_starter, etc.)
├── status (TEXT) -- 'active' | 'expired' | 'cancelled' | 'pending_activation'
├── start_date (TIMESTAMPTZ)
├── end_date (TIMESTAMPTZ) -- NULL pour abonnements mensuels
├── events_limit (INTEGER) -- NULL = illimité
├── photos_per_event_limit (INTEGER) -- NULL = illimité
└── features (JSONB) -- Fonctionnalités activées

subscription_events (Liens abonnements-événements)
├── id (UUID, PK)
├── subscription_id (UUID, FK → subscriptions)
├── event_id (UUID, FK → events)
└── used_at (TIMESTAMPTZ)
```

### Relations

- **events** → **photos** : 1-N (un événement a plusieurs photos)
- **events** → **guests** : 1-N (un événement a plusieurs invités)
- **events** → **event_settings** : 1-1 (un événement a un seul paramètre)
- **photos** → **likes** : 1-N (une photo a plusieurs likes)
- **events** → **event_organizers** : 1-N (un événement a plusieurs organisateurs)
- **auth.users** → **subscriptions** : 1-N (un utilisateur peut avoir plusieurs abonnements)
- **subscriptions** → **subscription_events** : 1-N (un abonnement peut être utilisé pour plusieurs événements)
- **events** → **subscriptions** : N-1 (un événement est lié à un abonnement via subscription_id)

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

### Création d'un événement avec vérification d'abonnement

```
1. Organisateur clique sur "Créer un événement"
   ↓
2. Service eventService.createEvent() :
   - Vérifie l'authentification
   - Valide le slug
   ↓
3. Service subscriptionService.canCreateEvent() :
   - Récupère l'abonnement actif de l'utilisateur
   - Vérifie les limites (nombre d'événements pour packs volume)
   - Retourne { can: boolean, reason?: string, subscriptionId?: string }
   ↓
4. Si can = false :
   - Lance une erreur avec le message explicatif
   - L'utilisateur voit un message d'upgrade
   ↓
5. Si can = true :
   - Crée l'événement avec subscription_id
   - Pour packs volume : consomme un événement via subscriptionService.useSubscriptionEvent()
   - Crée l'entrée dans event_organizers
```

### Upload d'une photo avec vérification de limites

```
1. Invité prend/choisit une photo
   ↓
2. Composant GuestUpload valide le fichier
   ↓
3. Service photoService.addPhotoToWall() :
   - Compte les photos existantes pour l'événement
   ↓
4. Service subscriptionService.canUploadPhoto() :
   - Récupère l'abonnement lié à l'événement (ou actif de l'owner)
   - Vérifie la limite photos_per_event_limit
   - Retourne { can: boolean, reason?: string, limit?: number, remaining?: number }
   ↓
5. Si can = false :
   - Lance une erreur avec le message explicatif
   - L'utilisateur voit un message d'upgrade
   ↓
6. Si can = true :
   - Compresse l'image
   - Upload vers Supabase Storage
   - Génère une URL publique
   ↓
7. Service geminiService :
   - Modère le contenu (isAppropriate)
   - Génère une légende (generateCaption)
   - Analyse la qualité
   ↓
8. Service photoService.addPhotoToWall() :
   - Insère dans la table photos
   - Met à jour les statistiques
   ↓
9. Supabase Realtime :
   - Émet un événement INSERT
   - Tous les clients connectés reçoivent la nouvelle photo
   ↓
10. Composants WallView et ProjectionWall :
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

## 💳 Système d'Abonnements

### Vue d'ensemble

Le système d'abonnements permet de gérer les plans des organisateurs et de limiter l'utilisation selon le type d'abonnement souscrit.

### Types d'abonnements

1. **Abonnements mensuels** :
   - `monthly_pro` : 29€/mois, événements illimités, photos illimitées
   - `monthly_studio` : 99€/mois, événements illimités, toutes fonctionnalités

2. **Packs événements ponctuels** :
   - `event_starter` : 49€, 1 événement, 100 photos max
   - `event_pro` : 99€, 1 événement, photos illimitées
   - `event_premium` : 199€, 1 événement, toutes fonctionnalités

3. **Packs volume** :
   - `volume_10` : 290€/événement, 10 événements, photos illimitées
   - `volume_50` : 198€/événement, 50 événements, photos illimitées

### Service subscriptionService

**Fonctions principales** :

- `getUserActiveSubscription(userId)` : Récupère l'abonnement actif d'un utilisateur
- `canCreateEvent(userId)` : Vérifie si l'utilisateur peut créer un événement
- `canUploadPhoto(eventId, currentPhotoCount)` : Vérifie si on peut uploader une photo
- `useSubscriptionEvent(subscriptionId, eventId)` : Consomme un événement d'un pack volume
- `getRemainingEvents(subscriptionId)` : Nombre d'événements restants
- `activateSubscription(subscriptionId)` : Active un abonnement (admin)

### Vérification des limites

Les limites sont vérifiées automatiquement :

1. **Création d'événement** : `eventService.createEvent()` appelle `canCreateEvent()` avant création
2. **Upload de photo** : `photoService.addPhotoToWall()` appelle `canUploadPhoto()` avant upload
3. **Messages d'erreur** : Messages clairs avec proposition d'upgrade si limite atteinte

### Panneau admin

Le composant `SubscriptionManagement` permet aux admins de :
- Voir tous les abonnements
- Activer les abonnements après paiement manuel
- Modifier le statut des abonnements
- Voir les événements restants pour les packs volume

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

