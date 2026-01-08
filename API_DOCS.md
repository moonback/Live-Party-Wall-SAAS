# 📡 Documentation API - Live Party Wall

Documentation complète des services et fonctions disponibles dans l'application.

---

## 📋 Table des matières

- [Services principaux](#-services-principaux)
- [Service Photos](#-service-photos)
- [Service Événements](#-service-événements)
- [Service Invités](#-service-invités)
- [Service IA (Gemini)](#-service-ia-gemini)
- [Service Paramètres](#-service-paramètres)
- [Service Battles](#-service-battles)
- [Service Export](#-service-export)
- [Client Supabase](#-client-supabase)

---

## 🎯 Services principaux

L'application utilise une architecture **Service Layer** où toute la logique métier est isolée dans des services TypeScript. Ces services communiquent avec Supabase (PostgreSQL, Storage, Realtime) et Google Gemini API.

### Structure

```
services/
├── supabaseClient.ts      # Client Supabase configuré
├── photoService.ts        # Gestion des photos
├── eventService.ts        # Gestion des événements
├── guestService.ts        # Gestion des invités
├── geminiService.ts       # Intégration Google Gemini
├── settingsService.ts     # Paramètres d'événement
├── battleService.ts       # Battles photos
├── exportService.ts       # Export de photos
└── ...
```

---

## 📸 Service Photos

**Fichier** : `services/photoService.ts`

### `uploadPhotoToStorage`

Upload une photo vers Supabase Storage.

```typescript
uploadPhotoToStorage(
  file: File,
  eventId: string,
  fileName?: string
): Promise<string>
```

**Paramètres** :
- `file` : Fichier image/vidéo à uploader
- `eventId` : ID de l'événement
- `fileName` : Nom de fichier optionnel (généré automatiquement si non fourni)

**Retour** : URL publique de la photo uploadée

**Exemple** :
```typescript
const url = await uploadPhotoToStorage(file, eventId);
// Retourne : "https://xxx.supabase.co/storage/v1/object/public/party-photos/..."
```

---

### `addPhotoToWall`

Ajoute une photo au mur (insertion en base de données).

```typescript
addPhotoToWall(
  url: string,
  caption: string,
  author: string,
  eventId: string,
  type?: MediaType,
  duration?: number
): Promise<Photo>
```

**Paramètres** :
- `url` : URL de la photo (Supabase Storage)
- `caption` : Légende générée par IA
- `author` : Nom de l'auteur (invité)
- `eventId` : ID de l'événement
- `type` : Type de média ('photo' | 'video'), défaut 'photo'
- `duration` : Durée en secondes (pour vidéos)

**Retour** : Objet Photo créé

**Exemple** :
```typescript
const photo = await addPhotoToWall(
  'https://.../photo.jpg',
  'Moment magique ! 💍✨',
  'Sophie',
  eventId,
  'photo'
);
```

---

### `getPhotosByEvent`

Récupère toutes les photos d'un événement.

```typescript
getPhotosByEvent(eventId: string): Promise<Photo[]>
```

**Paramètres** :
- `eventId` : ID de l'événement

**Retour** : Liste des photos triées par date (plus récentes en premier)

---

### `deletePhoto`

Supprime une photo (authentifié uniquement).

```typescript
deletePhoto(photoId: string): Promise<void>
```

**Paramètres** :
- `photoId` : ID de la photo à supprimer

**Erreurs** : Lance une erreur si l'utilisateur n'est pas authentifié

---

### `likePhoto`

Ajoute un like à une photo.

```typescript
likePhoto(photoId: string, userIdentifier: string): Promise<void>
```

**Paramètres** :
- `photoId` : ID de la photo
- `userIdentifier` : Identifiant de l'utilisateur (nom invité)

**Note** : Un utilisateur ne peut liker qu'une fois une photo (contrainte UNIQUE)

---

### `unlikePhoto`

Retire un like d'une photo.

```typescript
unlikePhoto(photoId: string, userIdentifier: string): Promise<void>
```

---

### `addReaction`

Ajoute ou modifie une réaction (émoji) sur une photo.

```typescript
addReaction(
  photoId: string,
  userIdentifier: string,
  reactionType: ReactionType
): Promise<void>
```

**Paramètres** :
- `photoId` : ID de la photo
- `userIdentifier` : Identifiant de l'utilisateur
- `reactionType` : Type de réaction ('heart' | 'laugh' | 'cry' | 'fire' | 'wow' | 'thumbsup')

**Note** : Un utilisateur a une seule réaction par photo (mais peut la changer)

---

### `removeReaction`

Retire une réaction d'une photo.

```typescript
removeReaction(photoId: string, userIdentifier: string): Promise<void>
```

---

### `getPhotoReactions`

Récupère toutes les réactions d'une photo avec compteurs.

```typescript
getPhotoReactions(photoId: string): Promise<ReactionCounts>
```

**Retour** : Objet avec compteurs par type de réaction
```typescript
{
  heart: 5,
  laugh: 2,
  fire: 1,
  // ...
}
```

---

## 🎉 Service Événements

**Fichier** : `services/eventService.ts`

### `createEvent`

Crée un nouvel événement.

```typescript
createEvent(
  slug: string,
  name: string,
  description: string | null,
  ownerId?: string
): Promise<Event>
```

**Paramètres** :
- `slug` : Identifiant unique URL (ex: "mariage-sophie-marc")
- `name` : Nom de l'événement
- `description` : Description (optionnel, max 100 caractères)
- `ownerId` : ID du propriétaire (optionnel, utilise auth.uid() si non fourni)

**Retour** : Événement créé

**Erreurs** :
- `23505` : Slug déjà existant
- `42501` : Utilisateur non authentifié

**Exemple** :
```typescript
const event = await createEvent(
  'mariage-sophie-marc',
  'Mariage de Sophie et Marc',
  'Union de deux âmes qui s\'aiment',
  userId
);
```

---

### `getEventBySlug`

Récupère un événement par son slug.

```typescript
getEventBySlug(slug: string): Promise<Event | null>
```

**Paramètres** :
- `slug` : Slug de l'événement

**Retour** : Événement ou `null` si non trouvé

---

### `getUserEvents`

Récupère tous les événements d'un utilisateur.

```typescript
getUserEvents(userId?: string): Promise<Event[]>
```

**Paramètres** :
- `userId` : ID de l'utilisateur (optionnel, utilise auth.uid() si non fourni)

**Retour** : Liste des événements (propriétaire + organisateur)

---

### `updateEvent`

Met à jour un événement.

```typescript
updateEvent(
  eventId: string,
  updates: Partial<Pick<Event, 'name' | 'description' | 'is_active'>>
): Promise<Event>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `updates` : Objet avec les champs à mettre à jour

**Erreurs** : Lance une erreur si l'utilisateur n'est pas propriétaire/organisateur

---

### `deleteEvent`

Supprime un événement (propriétaire uniquement).

```typescript
deleteEvent(eventId: string): Promise<void>
```

**Erreurs** : Lance une erreur si l'utilisateur n'est pas propriétaire

---

### `getEventOrganizers`

Récupère tous les organisateurs d'un événement.

```typescript
getEventOrganizers(eventId: string): Promise<EventOrganizer[]>
```

**Retour** : Liste des organisateurs avec leurs rôles

---

### `addOrganizer`

Ajoute un organisateur à un événement.

```typescript
addOrganizer(
  eventId: string,
  userEmail: string,
  role: 'owner' | 'organizer' | 'viewer'
): Promise<EventOrganizer>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `userEmail` : Email de l'utilisateur à ajouter
- `role` : Rôle de l'organisateur

**Erreurs** : Lance une erreur si l'utilisateur n'est pas propriétaire

---

### `removeOrganizer`

Retire un organisateur d'un événement.

```typescript
removeOrganizer(eventId: string, userId: string): Promise<void>
```

**Erreurs** : Lance une erreur si l'utilisateur n'est pas propriétaire

---

## 👥 Service Invités

**Fichier** : `services/guestService.ts`

### `createGuest`

Crée un nouvel invité.

```typescript
createGuest(
  eventId: string,
  name: string,
  avatarUrl: string
): Promise<Guest>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `name` : Nom de l'invité
- `avatarUrl` : URL de l'avatar (Supabase Storage)

**Retour** : Invité créé

---

### `getGuestByName`

Récupère un invité par son nom et événement.

```typescript
getGuestByName(eventId: string, name: string): Promise<Guest | null>
```

---

### `getGuestsByEvent`

Récupère tous les invités d'un événement.

```typescript
getGuestsByEvent(eventId: string): Promise<Guest[]>
```

---

### `blockGuest`

Bloque temporairement un invité.

```typescript
blockGuest(
  eventId: string,
  name: string,
  durationHours: number
): Promise<void>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `name` : Nom de l'invité à bloquer
- `durationHours` : Durée du blocage en heures

---

## 🤖 Service IA (Gemini)

**Fichier** : `services/geminiService.ts`

### `generateImageCaption`

Génère une légende personnalisée pour une image.

```typescript
generateImageCaption(
  base64Image: string,
  eventContext?: string | null
): Promise<string>
```

**Paramètres** :
- `base64Image` : Image en base64
- `eventContext` : Contexte de l'événement pour personnaliser (ex: "Mariage de Sophie et Marc")

**Retour** : Légende générée (ex: "Moment magique à jamais gravé ! 💍✨")

**Fallback** : Retourne `"Party time! 🎉"` en cas d'erreur

**Exemple** :
```typescript
const caption = await generateImageCaption(base64Image, 'Mariage de Sophie et Marc');
// Retourne : "Sophie et Marc rayonnent d'amour ! 💍✨"
```

---

### `moderateImage`

Modère une image pour vérifier qu'elle est appropriée.

```typescript
moderateImage(base64Image: string): Promise<boolean>
```

**Paramètres** :
- `base64Image` : Image en base64

**Retour** : `true` si appropriée, `false` sinon

**Fallback** : Retourne `true` en cas d'erreur (pour ne pas bloquer l'upload)

---

### `analyzeImageQuality`

Analyse la qualité d'une image.

```typescript
analyzeImageQuality(base64Image: string): Promise<'good' | 'fair' | 'poor'>
```

**Retour** : Qualité de l'image

**Fallback** : Retourne `'good'` en cas d'erreur

---

## ⚙️ Service Paramètres

**Fichier** : `services/settingsService.ts`

### `getSettings`

Récupère les paramètres d'un événement.

```typescript
getSettings(eventId: string): Promise<EventSettings>
```

**Retour** : Paramètres de l'événement

---

### `updateSettings`

Met à jour les paramètres d'un événement.

```typescript
updateSettings(
  eventId: string,
  updates: Partial<EventSettings>
): Promise<EventSettings>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `updates` : Objet avec les paramètres à mettre à jour

**Erreurs** : Lance une erreur si l'utilisateur n'est pas authentifié

---

### `subscribeToSettings`

S'abonne aux changements de paramètres en temps réel.

```typescript
subscribeToSettings(
  eventId: string,
  callback: (settings: EventSettings) => void
): Promise<() => void>
```

**Retour** : Fonction de désabonnement

**Exemple** :
```typescript
const unsubscribe = await subscribeToSettings(eventId, (settings) => {
  console.log('Paramètres mis à jour :', settings);
});

// Plus tard
unsubscribe();
```

---

## 🥊 Service Battles

**Fichier** : `services/battleService.ts`

### `createBattle`

Crée une battle (duel) entre deux photos.

```typescript
createBattle(
  eventId: string,
  photoAId: string,
  photoBId: string
): Promise<PhotoBattle>
```

**Paramètres** :
- `eventId` : ID de l'événement
- `photoAId` : ID de la première photo
- `photoBId` : ID de la seconde photo

**Retour** : Battle créée

---

### `voteBattle`

Vote pour une photo dans une battle.

```typescript
voteBattle(
  battleId: string,
  photoId: string,
  userIdentifier: string
): Promise<void>
```

**Paramètres** :
- `battleId` : ID de la battle
- `photoId` : ID de la photo pour laquelle voter ('photo_a_id' ou 'photo_b_id')
- `userIdentifier` : Identifiant de l'utilisateur

---

## 📥 Service Export

**Fichier** : `services/exportService.ts`

### `exportPhotosAsZip`

Exporte toutes les photos d'un événement en ZIP.

```typescript
exportPhotosAsZip(eventId: string): Promise<Blob>
```

**Paramètres** :
- `eventId` : ID de l'événement

**Retour** : Blob du fichier ZIP

**Exemple** :
```typescript
const zipBlob = await exportPhotosAsZip(eventId);
saveAs(zipBlob, `photos-${eventId}.zip`);
```

---

## 🎬 Service Aftermovie

**Fichier** : `services/aftermovieService.ts`

Génère des vidéos timelapse (aftermovie) à partir des photos d'un événement.

### `generateAftermovie`

Génère une vidéo aftermovie avec les options spécifiées.

```typescript
generateAftermovie(
  photos: Photo[],
  options: AftermovieOptions
): Promise<AftermovieResult>
```

**Paramètres** :
- `photos` : Liste des photos à inclure dans l'aftermovie
- `options` : Options de génération (résolution, FPS, transitions, etc.)

**Retour** : Objet avec le blob vidéo, le MIME type, le nom de fichier et la durée

---

## 📸 Service Photobooth

**Fichier** : `services/photoboothService.ts`

Gère l'upload de photos depuis le photobooth avec traitement IA complet.

### `submitPhoto`

Soumet une photo depuis le photobooth avec modération IA, génération de légende, et application de cadres.

```typescript
submitPhoto(params: SubmitPhotoParams): Promise<Photo>
```

**Paramètres** :
- `imageDataUrl` : Image en base64
- `authorName` : Nom de l'auteur
- `eventId` : ID de l'événement
- `eventSettings` : Paramètres de l'événement
- `activeFilter` : Filtre actif
- `activeFrame` : Cadre décoratif actif

**Retour** : Photo créée avec légende IA et modération

### `submitVideo`

Soumet une vidéo depuis le photobooth.

```typescript
submitVideo(params: SubmitVideoParams): Promise<Photo>
```

**Paramètres** :
- `videoBlob` : Blob de la vidéo
- `eventId` : ID de l'événement
- `videoDuration` : Durée en secondes
- `eventSettings` : Paramètres de l'événement

---

## 🤖 Service IA (AI Service)

**Fichier** : `services/aiService.ts`

Service unifié pour toutes les opérations IA (modération, légendes, tags).

### `analyzeAndCaptionImage`

Analyse une image et génère une légende avec modération.

```typescript
analyzeAndCaptionImage(
  base64Image: string,
  eventContext?: string | null
): Promise<{ caption: string; analysis: ImageAnalysis; tags?: string[] }>
```

**Retour** : Légende générée, analyse (modération + qualité), et tags optionnels

---

## 🎨 Service Cadres

**Fichier** : `services/frameService.ts`

Gère les cadres décoratifs pour les photos.

### `getFrames`

Récupère tous les cadres disponibles.

```typescript
getFrames(): Promise<Frame[]>
```

### `uploadFrame`

Upload un nouveau cadre (admin uniquement).

```typescript
uploadFrame(file: File, name: string): Promise<Frame>
```

---

## 🎮 Service Gamification

**Fichier** : `services/gamificationService.ts`

Gère les badges, classements et statistiques de gamification.

### `calculateAuthorStats`

Calcule les statistiques d'un auteur (nombre de photos, likes, badges).

```typescript
calculateAuthorStats(
  author: string,
  photos: Photo[]
): AuthorStats
```

### `getLeaderboard`

Génère le classement des auteurs.

```typescript
getLeaderboard(photos: Photo[]): LeaderboardEntry[]
```

---

## 👤 Service Reconnaissance Faciale

**Fichier** : `services/faceRecognitionService.ts`

Gère la reconnaissance faciale pour la fonctionnalité "Retrouve-moi".

### `detectFaces`

Détecte les visages dans une image.

```typescript
detectFaces(imageUrl: string): Promise<FaceDetection[]>
```

### `findPhotosWithFace`

Trouve toutes les photos contenant un visage similaire.

```typescript
findPhotosWithFace(
  referenceImageUrl: string,
  photos: Photo[]
): Promise<Photo[]>
```

---

## 🎯 Service Battles Automatiques

**Fichier** : `services/autoBattleService.ts`

Gère les battles photos automatiques.

### `createAutoBattle`

Crée automatiquement une battle entre deux photos populaires.

```typescript
createAutoBattle(eventId: string): Promise<PhotoBattle | null>
```

---

## 👏 Service Détection d'Applaudissements

**Fichier** : `services/applauseDetectionService.ts`

Détecte les applaudissements pour déclencher des effets AR.

### `detectApplause`

Détecte les applaudissements depuis l'audio du microphone.

```typescript
detectApplause(audioContext: AudioContext): Promise<boolean>
```

---

## 🖼️ Service Cadres Locaux

**Fichier** : `services/localFramesService.ts`

Gère les cadres stockés localement (fallback si Supabase indisponible).

### `getLocalFrames`

Récupère les cadres locaux.

```typescript
getLocalFrames(): Frame[]
```

---

## 🔌 Client Supabase

**Fichier** : `services/supabaseClient.ts`

### `supabase`

Client Supabase configuré et exporté.

```typescript
import { supabase } from './services/supabaseClient';

// Exemple d'utilisation
const { data, error } = await supabase
  .from('photos')
  .select('*')
  .eq('event_id', eventId);
```

### `isSupabaseConfigured`

Vérifie si Supabase est configuré.

```typescript
isSupabaseConfigured(): boolean
```

**Retour** : `true` si les variables d'environnement sont présentes

---

## 🔄 Realtime Subscriptions

### Exemple : S'abonner aux nouvelles photos

```typescript
import { supabase } from './services/supabaseClient';

const channel = supabase
  .channel(`photos:${eventId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'photos',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    const newPhoto = payload.new as Photo;
    // Traiter la nouvelle photo
    addPhotoToState(newPhoto);
  })
  .subscribe();

// Désabonnement
supabase.removeChannel(channel);
```

### Exemple : S'abonner aux mises à jour de likes

```typescript
const channel = supabase
  .channel(`likes:${eventId}`)
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'likes',
    filter: `photo_id=eq.${photoId}`
  }, (payload) => {
    // Mettre à jour le compteur de likes
    updateLikesCount(payload);
  })
  .subscribe();
```

---

## 🎮 Service Télécommande ESP32

**Fichier** : `services/remoteControlService.ts`

Permet de contrôler le mur à distance via un ESP32 connecté à Internet. L'ESP32 envoie des commandes HTTP POST vers Supabase, et l'application React les reçoit en temps réel via Supabase Realtime.

### Architecture

```
ESP32 (Boutons) → HTTP POST → Supabase (table remote_commands) → Realtime → React App → Actions du Mur
```

### Types de commandes

```typescript
type RemoteCommandType = 
  | 'TOGGLE_AUTO_SCROLL'    // Active/désactive l'auto-scroll
  | 'TRIGGER_AR_EFFECT'     // Déclenche un effet AR (nécessite ar_scene_enabled = true)
  | 'TOGGLE_QR_CODES'       // Affiche/masque les QR codes
  | 'SHOW_RANDOM_PHOTO'     // Affiche une photo aléatoire en plein écran (lightbox)
  | 'CLOSE_RANDOM_PHOTO';   // Ferme le lightbox (photo en plein écran)
```

### `subscribeToRemoteCommands`

S'abonne aux nouvelles commandes distantes pour un événement.

```typescript
subscribeToRemoteCommands(
  eventId: string,
  onCommand: (command: RemoteCommand) => void
): { unsubscribe: () => void }
```

**Paramètres** :
- `eventId` : ID de l'événement concerné
- `onCommand` : Callback appelé lorsqu'une nouvelle commande est reçue

**Retour** : Objet avec méthode `unsubscribe()` pour se désabonner

**Exemple d'utilisation** :

```typescript
import { subscribeToRemoteCommands } from './services/remoteControlService';

useEffect(() => {
  if (!currentEvent?.id) return;

  const subscription = subscribeToRemoteCommands(currentEvent.id, (command) => {
    switch (command.command_type) {
      case 'TOGGLE_AUTO_SCROLL':
        setIsPaused(!isPaused);
        break;
      case 'TRIGGER_AR_EFFECT':
        arSceneManagerRef.current?.triggerRandomEffect();
        break;
      case 'TOGGLE_QR_CODES':
        setShowQrCodes(!showQrCodes);
        break;
      case 'SHOW_RANDOM_PHOTO':
        // Afficher une photo aléatoire en plein écran
        if (displayedPhotos.length > 0) {
          const randomIndex = Math.floor(Math.random() * displayedPhotos.length);
          setLightboxIndex(randomIndex);
        }
        break;
      case 'CLOSE_RANDOM_PHOTO':
        // Fermer le lightbox
        setLightboxIndex(null);
        break;
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [currentEvent?.id, isPaused, showQrCodes]);
```

### Interface `RemoteCommand`

```typescript
interface RemoteCommand {
  id: string;
  event_id: string;
  command_type: RemoteCommandType;
  command_value: string | null;
  processed: boolean;
  created_at: string;
}
```

### Envoi de commande depuis ESP32

L'ESP32 envoie une requête HTTP POST vers Supabase :

```http
POST /rest/v1/remote_commands
Content-Type: application/json
apikey: VOTRE_SUPABASE_ANON_KEY

{
  "event_id": "uuid-de-l-evenement",
  "command_type": "SHOW_RANDOM_PHOTO",
  "command_value": null,
  "processed": false
}
```

**Exemple de code ESP32** : Voir `docs/esp32/esp32_remote_control.ino`

### Table Supabase `remote_commands`

La table stocke les commandes envoyées par l'ESP32 :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `event_id` | UUID | ID de l'événement (FK → events) |
| `command_type` | TEXT | Type de commande (CHECK constraint) |
| `command_value` | TEXT | Valeur optionnelle (nullable) |
| `processed` | BOOLEAN | Indique si la commande a été traitée |
| `created_at` | TIMESTAMPTZ | Date de création |

**RLS** : INSERT public autorisé (pas d'authentification requise), filtré par `event_id`

**Realtime** : Activé pour recevoir les commandes en temps réel

**Migration SQL** : Voir `supabase/supabase_remote_commands_setup.sql`

### Sécurité

- Les commandes sont filtrées par `event_id` pour isoler les événements
- Les commandes sont marquées comme `processed = true` après traitement pour éviter les doubles traitements
- Pas d'authentification requise pour INSERT (comme demandé), mais isolation par `event_id`

---

## ⚠️ Gestion des erreurs

Tous les services suivent un pattern de gestion d'erreurs cohérent :

```typescript
try {
  const result = await someServiceFunction();
  return result;
} catch (error) {
  logger.error('Error in service', error, { component: 'serviceName', action: 'functionName' });
  throw error instanceof Error ? error : new Error('Erreur générique');
}
```

### Types d'erreurs courants

- **Supabase RLS** : `42501` - Insufficient privilege
- **Unique violation** : `23505` - Contrainte unique violée
- **Foreign key** : `23503` - Référence invalide
- **Gemini API** : Rate limiting, quota dépassé, API indisponible

---

## 📝 Notes importantes

1. **Authentification** : Certaines fonctions nécessitent une authentification Supabase
2. **RLS** : Les politiques RLS de Supabase contrôlent l'accès aux données
3. **Fallbacks** : Les services IA retournent des valeurs par défaut en cas d'erreur
4. **Validation** : Tous les inputs sont validés avant traitement
5. **Logging** : Toutes les erreurs sont loggées avec contexte

---

**Dernière mise à jour** : 2026-01-15

