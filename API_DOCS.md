# 📡 Documentation API - Live Party Wall

Ce document décrit toutes les APIs et services disponibles dans l'application, incluant les appels Supabase, les services internes et les intégrations externes.

---

## 📋 Table des Matières

- [Services Internes](#services-internes)
  - [Photo Service](#photo-service)
  - [Settings Service](#settings-service)
  - [Frame Service](#frame-service)
  - [Export Service](#export-service)
- [Services IA](#services-ia)
  - [Gemini Service](#gemini-service)
  - [AI Moderation Service](#ai-moderation-service)
- [Supabase Client](#supabase-client)
- [Intégrations Externes](#intégrations-externes)

---

## Services Internes

### Photo Service

**Fichier** : `services/photoService.ts`

Service principal pour la gestion des photos (CRUD, likes, realtime).

#### `addPhotoToWall(base64Image, caption, author)`

Upload une photo vers Supabase Storage et insère un enregistrement dans la base de données.

**Paramètres** :
- `base64Image: string` - Image en base64 (avec ou sans préfixe data:image)
- `caption: string` - Légende de la photo
- `author: string` - Nom de l'auteur

**Retourne** : `Promise<Photo>`

**Exemple** :
```typescript
const photo = await addPhotoToWall(
  'data:image/jpeg;base64,/9j/4AAQ...',
  'Super soirée ! 🎉',
  'Alice'
);
```

**Flux** :
1. Convertit base64 → Blob
2. Upload vers `party-photos` bucket
3. Récupère l'URL publique
4. Insère dans la table `photos` avec `type: 'photo'`
5. Retourne l'objet Photo mappé

**Erreurs** :
- `Error("Supabase n'est pas configuré")` si les credentials sont manquants
- Erreurs Supabase (upload, insert)

---

#### `addVideoToWall(videoBlob, caption, author, duration)`

Upload une vidéo vers Supabase Storage et insère un enregistrement dans la base de données.

**Paramètres** :
- `videoBlob: Blob` - Fichier vidéo (Blob)
- `caption: string` - Légende de la vidéo
- `author: string` - Nom de l'auteur
- `duration: number` - Durée en secondes

**Retourne** : `Promise<Photo>` (type: 'video')

**Exemple** :
```typescript
const video = await addVideoToWall(
  videoBlob,
  'Moment mémorable ! 🎬',
  'Bob',
  15.5
);
```

**Flux** :
1. Génère un filename unique avec extension appropriée (.mp4, .webm, .mov)
2. Upload vers `party-photos` bucket
3. Récupère l'URL publique
4. Insère dans la table `photos` avec `type: 'video'` et `duration`
5. Retourne l'objet Photo mappé

**Erreurs** :
- `Error("Supabase n'est pas configuré")` si les credentials sont manquants
- Erreurs Supabase (upload, insert)

---

#### `getPhotos()`

Récupère toutes les photos de la base de données, triées par date de création (ascendante).

**Paramètres** : Aucun

**Retourne** : `Promise<Photo[]>`

**Exemple** :
```typescript
const photos = await getPhotos();
// [{ id: '...', url: '...', caption: '...', ... }, ...]
```

**Flux** :
1. SELECT * FROM photos ORDER BY created_at ASC
2. Mappe les résultats vers le type `Photo`

**Note** : Retourne un tableau vide si Supabase n'est pas configuré ou en cas d'erreur.

---

#### `subscribeToNewPhotos(onNewPhoto)`

S'abonne aux nouvelles photos en temps réel via Supabase Realtime.

**Paramètres** :
- `onNewPhoto: (photo: Photo) => void` - Callback appelé à chaque nouvelle photo

**Retourne** : `{ unsubscribe: () => void }`

**Exemple** :
```typescript
const subscription = subscribeToNewPhotos((newPhoto) => {
  console.log('Nouvelle photo:', newPhoto);
  setPhotos(prev => [...prev, newPhoto]);
});

// Plus tard, pour se désabonner
subscription.unsubscribe();
```

**Flux** :
1. Crée un channel Supabase Realtime : `public:photos`
2. Écoute les événements `INSERT` sur la table `photos`
3. Appelle `onNewPhoto` avec la photo transformée

**Note** : Retourne un objet avec `unsubscribe` no-op si Supabase n'est pas configuré.

---

#### `toggleLike(photoId, userIdentifier)`

Like/Unlike une photo. Gère automatiquement le compteur et évite les doublons.

**Paramètres** :
- `photoId: string` - UUID de la photo
- `userIdentifier: string` - Identifiant unique client (généré côté client, stocké en localStorage)

**Retourne** : `Promise<{ newCount: number; isLiked: boolean }>`

**Exemple** :
```typescript
const { newCount, isLiked } = await toggleLike(
  '123e4567-e89b-12d3-a456-426614174000',
  'user-abc-123'
);
```

**Flux** :
1. Vérifie si un like existe déjà (SELECT from `likes`)
2. Si existe : DELETE like + décrémente `likes_count`
3. Si n'existe pas : INSERT like + incrémente `likes_count`
4. Retourne le nouveau compteur et l'état

**Erreurs** :
- `Error("Supabase non configuré")` si les credentials sont manquants

---

#### `getUserLikes(userIdentifier)`

Récupère la liste des IDs de photos likées par un utilisateur.

**Paramètres** :
- `userIdentifier: string` - Identifiant unique client

**Retourne** : `Promise<string[]>` - Tableau d'UUIDs de photos

**Exemple** :
```typescript
const likedPhotoIds = await getUserLikes('user-abc-123');
// ['123e4567-...', '789e0123-...']
```

#### `toggleReaction(photoId, userIdentifier, reactionType)`

Ajoute, modifie ou supprime une réaction emoji pour une photo.

**Paramètres** :
- `photoId: string` - UUID de la photo
- `userIdentifier: string` - Identifiant unique client
- `reactionType: ReactionType | null` - Type de réaction (`'heart'`, `'laugh'`, `'cry'`, `'fire'`, `'wow'`, `'thumbsup'`) ou `null` pour supprimer

**Retourne** : `Promise<{ reactions: ReactionCounts; userReaction: ReactionType | null }>`

**Exemple** :
```typescript
const { reactions, userReaction } = await toggleReaction(
  '123e4567-e89b-12d3-a456-426614174000',
  'user-abc-123',
  'laugh'
);
// reactions: { laugh: 5, heart: 2, fire: 1 }
// userReaction: 'laugh'
```

**Flux** :
1. Vérifie si une réaction existe déjà (SELECT from `reactions`)
2. Si existe et même type : DELETE réaction
3. Si existe et type différent : UPDATE `reaction_type`
4. Si n'existe pas : INSERT nouvelle réaction
5. Retourne les nouveaux compteurs et la réaction de l'utilisateur

#### `getPhotoReactions(photoId)`

Récupère les compteurs de réactions pour une photo.

**Paramètres** :
- `photoId: string` - UUID de la photo

**Retourne** : `Promise<ReactionCounts>` - Objet avec les compteurs par type

**Exemple** :
```typescript
const reactions = await getPhotoReactions('123e4567-e89b-12d3-a456-426614174000');
// { heart: 3, laugh: 5, fire: 2, wow: 1 }
```

#### `getUserReaction(photoId, userIdentifier)`

Récupère la réaction actuelle d'un utilisateur pour une photo.

**Paramètres** :
- `photoId: string` - UUID de la photo
- `userIdentifier: string` - Identifiant unique client

**Retourne** : `Promise<ReactionType | null>` - Type de réaction ou `null` si aucune

**Exemple** :
```typescript
const reaction = await getUserReaction('123e4567-...', 'user-abc-123');
// 'laugh' ou null
```

#### `getUserReactions(userIdentifier)`

Récupère toutes les réactions d'un utilisateur (map photoId → reactionType).

**Paramètres** :
- `userIdentifier: string` - Identifiant unique client

**Retourne** : `Promise<Map<string, ReactionType>>` - Map des réactions de l'utilisateur

**Exemple** :
```typescript
const userReactions = await getUserReactions('user-abc-123');
// Map { 'photo-id-1' => 'laugh', 'photo-id-2' => 'fire', ... }
```

#### `subscribeToReactionsUpdates(onReactionsUpdate)`

S'abonne aux mises à jour de réactions en temps réel.

**Paramètres** :
- `onReactionsUpdate: (photoId: string, reactions: ReactionCounts) => void` - Callback appelé quand les réactions changent

**Retourne** : `{ unsubscribe: () => void }` - Objet avec méthode pour se désabonner

**Exemple** :
```typescript
const subscription = subscribeToReactionsUpdates((photoId, reactions) => {
  console.log(`Photo ${photoId} a maintenant:`, reactions);
});

// Plus tard
subscription.unsubscribe();
```

---

#### `deletePhoto(photoId, photoUrl)`

Supprime une photo (base de données + storage). **Admin uniquement**.

**Paramètres** :
- `photoId: string` - UUID de la photo
- `photoUrl: string` - URL complète de la photo (pour extraire le filename)

**Retourne** : `Promise<void>`

**Exemple** :
```typescript
await deletePhoto(
  '123e4567-...',
  'https://xxx.supabase.co/storage/v1/object/public/party-photos/123.jpg'
);
```

**Flux** :
1. DELETE de la table `photos` (déclenche CASCADE sur `likes`)
2. Extrait le filename de l'URL
3. DELETE du fichier dans le bucket `party-photos`

**Erreurs** :
- Erreurs Supabase (DB ou Storage)

---

#### `deleteAllPhotos()`

Supprime **toutes** les photos. **Admin uniquement, destructif**.

**Paramètres** : Aucun

**Retourne** : `Promise<void>`

**Exemple** :
```typescript
await deleteAllPhotos(); // ⚠️ Action irréversible
```

**Flux** :
1. Récupère toutes les photos (SELECT url)
2. Extrait les filenames
3. DELETE toutes les lignes de `photos` (par batch d'IDs)
4. DELETE tous les fichiers du storage (par batch de 100)

**Note** : Cette opération est irréversible. Utiliser avec précaution.

---

### Settings Service

**Fichier** : `services/settingsService.ts`

Gestion des paramètres de l'événement (singleton).

#### `getSettings()`

Récupère la configuration de l'événement (toujours ID = 1).

**Paramètres** : Aucun

**Retourne** : `Promise<EventSettings>`

**Exemple** :
```typescript
const settings = await getSettings();
// {
//   event_title: 'Party Wall',
//   event_subtitle: 'Live',
//   scroll_speed: 'normal',
//   slide_transition: 'fade',
//   decorative_frame_enabled: false,
//   decorative_frame_url: null
// }
```

**Flux** :
1. SELECT * FROM event_settings WHERE id = 1 LIMIT 1
2. Merge avec les valeurs par défaut si la table est vide
3. Retourne les settings ou defaults

**Type** :
```typescript
interface EventSettings {
  id?: number;
  event_title: string;
  event_subtitle: string;
  scroll_speed: 'slow' | 'normal' | 'fast';
  slide_transition: 'fade' | 'slide' | 'zoom';
  decorative_frame_enabled: boolean;
  decorative_frame_url: string | null;
  caption_generation_enabled: boolean;
  content_moderation_enabled: boolean;
  video_capture_enabled: boolean;
  collage_mode_enabled: boolean;
  stats_enabled: boolean;
}
```

---

#### `updateSettings(settings)`

Met à jour la configuration de l'événement. **Admin uniquement**.

**Paramètres** :
- `settings: Partial<EventSettings>` - Objet partiel avec les champs à mettre à jour

**Retourne** : `Promise<EventSettings | null>`

**Exemple** :
```typescript
const updated = await updateSettings({
  event_title: 'Anniversaire Marie',
  scroll_speed: 'fast'
});
```

**Flux** :
1. UPSERT dans `event_settings` (id = 1)
2. Met à jour `updated_at`
3. Retourne les settings mis à jour

**Erreurs** :
- Erreurs Supabase (permissions, validation)

---

#### `subscribeToSettings(onUpdate)`

S'abonne aux mises à jour des paramètres en temps réel.

**Paramètres** :
- `onUpdate: (settings: EventSettings) => void` - Callback appelé à chaque mise à jour

**Retourne** : `{ unsubscribe: () => void }`

**Exemple** :
```typescript
const subscription = subscribeToSettings((settings) => {
  console.log('Settings mis à jour:', settings);
  setSettings(settings);
});
```

---

### Frame Service

**Fichier** : `services/frameService.ts`

Gestion des cadres décoratifs (upload vers Supabase Storage).

#### `uploadDecorativeFramePng(file)`

Upload un cadre décoratif (PNG) dans le bucket `party-frames`. **Admin uniquement**.

**Paramètres** :
- `file: File` - Fichier PNG

**Retourne** : `Promise<UploadFrameResult>`

**Exemple** :
```typescript
const file = event.target.files[0]; // Input file
const { publicUrl, path } = await uploadDecorativeFramePng(file);
```

**Type de retour** :
```typescript
interface UploadFrameResult {
  publicUrl: string;
  path: string;
}
```

**Flux** :
1. Valide que le fichier est un PNG
2. Génère un path unique : `frames/{timestamp}-{random}-{filename}`
3. Upload vers le bucket `party-frames` (upsert = true)
4. Retourne l'URL publique et le path

**Erreurs** :
- `Error("Supabase n'est pas configuré")`
- `Error("Le cadre doit être un fichier PNG")`
- Erreurs Supabase (upload, permissions)

---

### Gamification Service

**Fichier** : `services/gamificationService.ts`

Service de gamification pour calculer les badges, classements et statistiques par auteur.

#### `calculateAuthorStats(photos)`

Calcule les statistiques agrégées par auteur (nombre de photos, total de likes, moyenne).

**Paramètres** :
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `Map<string, AuthorStats>` - Map avec l'auteur comme clé

**Exemple** :
```typescript
const statsMap = calculateAuthorStats(photos);
const aliceStats = statsMap.get('Alice');
// { author: 'Alice', photoCount: 5, totalLikes: 23, averageLikes: 4.6, badges: [] }
```

#### `generateLeaderboard(photos)`

Génère le classement des auteurs trié par nombre de photos puis par likes totaux.

**Paramètres** :
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `Promise<LeaderboardEntry[]>` - Tableau trié avec rangs

**Exemple** :
```typescript
const leaderboard = generateLeaderboard(photos);
// [
//   { rank: 1, author: 'Alice', photoCount: 10, totalLikes: 45, badges: [BADGES.photographer] },
//   { rank: 2, author: 'Bob', photoCount: 8, totalLikes: 32, badges: [] },
//   ...
// ]
```

#### `getTopPhotographer(photos)`

Trouve l'auteur avec le plus de photos (Badge "Photographe de la soirée").

**Paramètres** :
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `AuthorStats | null` - Stats de l'auteur avec le badge, ou null si aucune photo

#### `getStarPhoto(photos)`

Trouve la photo la plus likée (Badge "Star du mur").

**Paramètres** :
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `Photo | null` - Photo la plus likée, ou null si aucune photo

#### `getAuthorBadges(author, photos)`

Récupère tous les badges d'un auteur.

**Paramètres** :
- `author: string` - Nom de l'auteur
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `Badge[]` - Tableau de badges (peut être vide)

#### `getPhotoBadge(photo, photos)`

Récupère le badge d'une photo si elle est la "Star du mur".

**Paramètres** :
- `photo: Photo` - Photo à vérifier
- `photos: Photo[]` - Tableau de toutes les photos

**Retourne** : `Badge | null` - Badge "Star du mur" ou null

---

### Export Service

**Fichier** : `services/exportService.ts`

Export de toutes les photos en ZIP avec métadonnées.

#### `exportPhotosToZip(photos, eventTitle)`

Génère un fichier ZIP contenant toutes les photos et un fichier JSON de métadonnées.

**Paramètres** :
- `photos: Photo[]` - Tableau de photos à exporter
- `eventTitle: string` - Titre de l'événement (pour le nom du ZIP)

**Retourne** : `Promise<void>` (télécharge le fichier automatiquement)

**Exemple** :
```typescript
const photos = await getPhotos();
const settings = await getSettings();
await exportPhotosToZip(photos, settings.event_title);
// Télécharge: "Party_Wall_2026-01-15.zip"
```

**Structure du ZIP** :
```
{eventTitle}_photos/
├── metadata.json          # Métadonnées JSON
├── photo_{id1}.jpg
├── photo_{id2}.jpg
└── ...
```

**Format metadata.json** :
```json
[
  {
    "id": "uuid",
    "author": "Alice",
    "caption": "Super soirée ! 🎉",
    "timestamp": "2026-01-15T20:30:00.000Z",
    "likes": 5,
    "filename": "photo_uuid.jpg"
  }
]
```

**Flux** :
1. Crée un dossier ZIP avec le nom de l'événement
2. Génère `metadata.json` avec toutes les métadonnées
3. Télécharge chaque image depuis l'URL Supabase
4. Ajoute chaque image au ZIP
5. Génère le blob ZIP et déclenche le téléchargement via `file-saver`

**Erreurs** :
- Erreurs réseau lors du téléchargement des images
- Erreurs JSZip (génération du ZIP)

---

## Services IA

### Gemini Service

**Fichier** : `services/geminiService.ts`

Génération de légendes automatiques avec Google Gemini.

#### `generateImageCaption(base64Image)`

Génère une légende festive et contextuelle pour une image.

**Paramètres** :
- `base64Image: string` - Image en base64

**Retourne** : `Promise<string>` - Légende générée (max 12 mots, en français)

**Exemple** :
```typescript
const caption = await generateImageCaption('data:image/jpeg;base64,...');
// "Super soirée entre amis ! 🎉✨"
```

**Flux** :
1. Nettoie le base64 (enlève le préfixe data:image si présent)
2. Appelle Gemini API avec le modèle `gemini-2.5-flash`
3. Envoie l'image + prompt de génération (défini dans `constants.ts`)
4. Retourne la légende trimée

**Prompt utilisé** (défini dans `constants.ts`) :
```
Tu es l'animateur virtuel star du "Live Party Wall", le cœur battant de cet événement ! 🎉 
Ta mission est de transformer chaque image projetée sur le grand écran en un moment de gloire collectif. 🖥️✨

Analyse avec précision la photo (détecte s'il s'agit d'un collage, d'un portrait, de nourriture ou d'un moment de danse) :

1. CONTENU : 
   - Si c'est un collage (2 à 4 photos) : commente la créativité ou la mini-histoire racontée.
   - Si des personnes sont visibles : fais-en les "Stars du mur" avec un compliment spontané ou un clin d'œil complice.
   - Si c'est un objet, un plat ou un cocktail : rends-le irrésistible, festif et "instagrammable".

2. STYLE & TON :
   - Maximum 12 mots. Uniquement en français.
   - Ton "électrique", drôle, chaleureux et 100% inclusif.
   - Utilise des jeux de mots liés à l'univers de la fête et de l'événementiel.
   - Multiplie les émojis pour booster l'énergie visuelle sur le mur.

3. CONTRAINTES :
   - Pas de hashtags, pas de phrases génériques type "Super photo".
   - Ne mentionne jamais que tu es une IA ou que tu suis des consignes.
   - La légende doit provoquer un effet "wow" immédiat et inciter les autres à liker dans la galerie ! 🚀
```

**Erreurs** :
- Retourne un fallback : `"Party time! 🎉"` en cas d'erreur API
- Retourne un fallback : `"Souvenir mémorable ! 🎉"` en cas d'erreur inattendue

---

### AI Moderation Service

**Fichier** : `services/aiModerationService.ts`

Modération automatique et analyse d'images avec Gemini Vision.

#### `analyzeImage(base64Image)`

Analyse complète d'une image : détection de visages, modération, qualité, suggestions de filtres.

**Paramètres** :
- `base64Image: string` - Image en base64

**Retourne** : `Promise<ImageAnalysis>`

**Exemple** :
```typescript
const analysis = await analyzeImage('data:image/jpeg;base64,...');
// {
//   hasFaces: true,
//   faceCount: 2,
//   isAppropriate: true,
//   suggestedFilter: 'warm',
//   quality: 'good'
// }
```

**Type de retour** :
```typescript
interface ImageAnalysis {
  hasFaces: boolean;
  faceCount: number;
  isAppropriate: boolean;
  moderationReason?: string;
  suggestedFilter?: 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
  quality: 'good' | 'fair' | 'poor';
}
```

**Flux** :
1. Nettoie le base64
2. Appelle Gemini API avec un prompt JSON structuré
3. Parse la réponse JSON (nettoie les markdown si présent)
4. Valide et applique des valeurs par défaut
5. Retourne l'analyse

**Erreurs** :
- Retourne des valeurs par défaut "safe" en cas d'erreur :
  ```typescript
  {
    hasFaces: false,
    faceCount: 0,
    isAppropriate: true, // Par défaut, on accepte
    suggestedFilter: 'none',
    quality: 'fair'
  }
  ```

---

#### `isImageAppropriate(base64Image)`

Vérifie si une image est appropriée pour publication (wrapper autour de `analyzeImage`).

**Paramètres** :
- `base64Image: string` - Image en base64

**Retourne** : `Promise<{ approved: boolean; reason?: string; analysis?: ImageAnalysis }>`

**Exemple** :
```typescript
const { approved, reason, analysis } = await isImageAppropriate(base64);
if (!approved) {
  console.error('Photo rejetée:', reason);
}
```

**Flux** :
1. Appelle `analyzeImage()`
2. Vérifie `isAppropriate`
3. Retourne un objet avec `approved`, `reason` (si rejetée) et `analysis` complète

---

## Supabase Client

**Fichier** : `services/supabaseClient.ts`

Client Supabase configuré et exporté pour utilisation dans toute l'application.

#### `supabase`

Instance du client Supabase créée avec `createClient()`.

**Configuration** :
- URL : `import.meta.env.VITE_SUPABASE_URL`
- Anon Key : `import.meta.env.VITE_SUPABASE_ANON_KEY`

**Usage** :
```typescript
import { supabase } from './services/supabaseClient';

// Exemple d'utilisation directe
const { data, error } = await supabase
  .from('photos')
  .select('*');
```

**Erreurs** :
- Lance une erreur au chargement si les credentials sont manquants

---

#### `isSupabaseConfigured()`

Vérifie si Supabase est correctement configuré.

**Retourne** : `boolean`

**Exemple** :
```typescript
if (!isSupabaseConfigured()) {
  console.error('Supabase non configuré');
  return;
}
```

---

## Intégrations Externes

### Google Gemini API

**SDK** : `@google/genai`

**Configuration** :
- API Key : `process.env.GEMINI_API_KEY` (injectée via Vite)
- Modèle : `gemini-3-flash-preview`

**Endpoints utilisés** :
- `ai.models.generateContent()` : Génération de contenu multimodal (texte + image)

**Limites** :
- Rate limiting selon le plan Google AI Studio
- Taille max d'image : Selon les limites Gemini (généralement ~20MB)

**Documentation** : [https://ai.google.dev/docs](https://ai.google.dev/docs)

---

## 🔐 Authentification

### Supabase Auth

**Provider** : Email/Password (Supabase Auth)

**Usage** :
```typescript
import { supabase } from './services/supabaseClient';

// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
});

// Vérifier la session
const { data: { session } } = await supabase.auth.getSession();

// Déconnexion
await supabase.auth.signOut();
```

**Sessions** : Gérées automatiquement par Supabase (JWT tokens, refresh automatique)

---

## 📊 Realtime Subscriptions

Toutes les subscriptions utilisent Supabase Realtime (WebSockets).

### Channel : `public:photos`

Écoute les événements `INSERT` sur la table `photos`.

### Channel : `public:event_settings`

Écoute les événements `UPDATE` sur la table `event_settings`.

### Channel : `public:likes:updates`

Écoute les événements `INSERT`/`DELETE` sur la table `likes` et recalcule automatiquement les compteurs.

### Channel : `public:reactions:updates`

Écoute les événements `INSERT`/`UPDATE`/`DELETE` sur la table `reactions` et met à jour les compteurs en temps réel.

---

## 🚨 Gestion des Erreurs

Tous les services suivent un pattern de gestion d'erreurs cohérent :

1. **Validation** : Vérification des paramètres d'entrée
2. **Try/Catch** : Capture des erreurs API
3. **Fallbacks** : Valeurs par défaut pour les services IA
4. **Logging** : `console.error()` pour le debugging
5. **Propagation** : Les erreurs critiques sont propagées au composant appelant

---

## 📝 Notes Importantes

- **Tous les appels Supabase** nécessitent que RLS soit correctement configuré
- **Les services IA** peuvent échouer silencieusement avec des fallbacks
- **Les uploads** sont limités par la taille max de Supabase Storage (généralement 50MB par fichier)
- **Les subscriptions Realtime** doivent être désabonnées pour éviter les fuites mémoire

