# 🔌 Documentation API - Partywall

Ce document décrit toutes les fonctions et services disponibles dans l'application Partywall.

---

## 📋 Table des matières

- [Services Photos](#services-photos)
- [Services Événements](#services-événements)
- [Services Invités](#services-invités)
- [Services IA](#services-ia)
- [Services Battles](#services-battles)
- [Services Aftermovies](#services-aftermovies)
- [Services Gamification](#services-gamification)
- [Services Paramètres](#services-paramètres)
- [Services Export](#services-export)
- [Services RGPD](#services-rgpd)
- [Client Supabase](#client-supabase)

---

## 📸 Services Photos

### `photoService.ts`

#### `addPhotoToWall(eventId, base64Image, caption, author, tags?, userDescription?)`

Upload une photo vers Supabase Storage et insère un enregistrement en base.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `base64Image: string` - Image en base64
- `caption: string` - Légende de la photo
- `author: string` - Nom de l'auteur
- `tags?: string[]` - Tags suggérés par l'IA (optionnel)
- `userDescription?: string` - Description saisie par l'utilisateur (optionnel)

**Retour** : `Promise<Photo>`

**Exemple** :
```typescript
const photo = await addPhotoToWall(
  eventId,
  base64Image,
  "Moment magique ! ✨",
  "Sophie",
  ["sourire", "groupe"],
  "Photo prise pendant le toast"
);
```

#### `getPhotos(eventId, limit?, offset?)`

Récupère les photos d'un événement avec pagination.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `limit?: number` - Nombre de photos à récupérer (défaut: 50)
- `offset?: number` - Offset pour pagination (défaut: 0)

**Retour** : `Promise<Photo[]>`

#### `deletePhoto(photoId)`

Supprime une photo (admin uniquement).

**Paramètres** :
- `photoId: string` - ID de la photo

**Retour** : `Promise<void>`

#### `likePhoto(photoId, userIdentifier)`

Ajoute un like à une photo.

**Paramètres** :
- `photoId: string` - ID de la photo
- `userIdentifier: string` - Identifiant utilisateur (nom ou ID)

**Retour** : `Promise<void>`

#### `unlikePhoto(photoId, userIdentifier)`

Retire un like d'une photo.

**Paramètres** :
- `photoId: string` - ID de la photo
- `userIdentifier: string` - Identifiant utilisateur

**Retour** : `Promise<void>`

#### `addReaction(photoId, userIdentifier, reactionType)`

Ajoute ou modifie une réaction sur une photo.

**Paramètres** :
- `photoId: string` - ID de la photo
- `userIdentifier: string` - Identifiant utilisateur
- `reactionType: ReactionType` - Type de réaction ('heart', 'laugh', 'cry', 'fire', 'wow', 'thumbsup')

**Retour** : `Promise<void>`

#### `removeReaction(photoId, userIdentifier)`

Retire une réaction d'une photo.

**Paramètres** :
- `photoId: string` - ID de la photo
- `userIdentifier: string` - Identifiant utilisateur

**Retour** : `Promise<void>`

#### `getPhotoReactions(photoId)`

Récupère les compteurs de réactions pour une photo.

**Paramètres** :
- `photoId: string` - ID de la photo

**Retour** : `Promise<ReactionCounts>`

---

## 🎪 Services Événements

### `eventService.ts`

#### `createEvent(slug, name, description, ownerId?)`

Crée un nouvel événement.

**Paramètres** :
- `slug: string` - Identifiant unique pour l'URL (ex: "mariage-sophie-marc")
- `name: string` - Nom de l'événement
- `description: string | null` - Description de l'événement
- `ownerId?: string` - ID du propriétaire (optionnel, utilise auth.uid() si non fourni)

**Retour** : `Promise<Event>`

**Exemple** :
```typescript
const event = await createEvent(
  "mariage-sophie-marc",
  "Mariage de Sophie et Marc",
  "Célébration de l'union de Sophie et Marc"
);
```

#### `getEventBySlug(slug)`

Récupère un événement par son slug.

**Paramètres** :
- `slug: string` - Slug de l'événement

**Retour** : `Promise<Event | null>`

#### `getEventById(eventId)`

Récupère un événement par son ID.

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<Event | null>`

#### `updateEvent(eventId, updates)`

Met à jour un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `updates: EventUpdate` - Objet avec les champs à mettre à jour

**Retour** : `Promise<Event>`

#### `deleteEvent(eventId)`

Supprime un événement (owner uniquement).

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<void>`

#### `getUserEvents(userId)`

Récupère tous les événements d'un utilisateur.

**Paramètres** :
- `userId: string` - ID de l'utilisateur

**Retour** : `Promise<Event[]>`

#### `addEventOrganizer(eventId, userId, role)`

Ajoute un organisateur à un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `userId: string` - ID de l'utilisateur
- `role: 'owner' | 'organizer' | 'viewer'` - Rôle de l'organisateur

**Retour** : `Promise<EventOrganizer>`

#### `removeEventOrganizer(eventId, userId)`

Retire un organisateur d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `userId: string` - ID de l'utilisateur

**Retour** : `Promise<void>`

---

## 👥 Services Invités

### `guestService.ts`

#### `createGuest(eventId, name, avatarUrl)`

Crée un nouvel invité.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `name: string` - Nom de l'invité
- `avatarUrl: string` - URL de l'avatar

**Retour** : `Promise<Guest>`

#### `getGuestByName(eventId, name)`

Récupère un invité par son nom.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `name: string` - Nom de l'invité

**Retour** : `Promise<Guest | null>`

#### `getGuests(eventId)`

Récupère tous les invités d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<Guest[]>`

#### `blockGuest(eventId, name, durationMinutes)`

Bloque temporairement un invité.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `name: string` - Nom de l'invité
- `durationMinutes: number` - Durée du blocage en minutes

**Retour** : `Promise<BlockedGuest>`

#### `unblockGuest(eventId, name)`

Débloque un invité.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `name: string` - Nom de l'invité

**Retour** : `Promise<void>`

#### `isGuestBlocked(eventId, name)`

Vérifie si un invité est bloqué.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `name: string` - Nom de l'invité

**Retour** : `Promise<boolean>`

---

## 🤖 Services IA

### `geminiService.ts`

#### `moderateContent(base64Image)`

Modère le contenu d'une image (détection de contenu inapproprié).

**Paramètres** :
- `base64Image: string` - Image en base64

**Retour** : `Promise<{ safe: boolean; reason?: string }>`

**Exemple** :
```typescript
const moderation = await moderateContent(base64Image);
if (!moderation.safe) {
  throw new Error("Contenu inapproprié détecté");
}
```

#### `generateImageCaption(base64Image, eventContext?)`

Génère une légende personnalisée pour une image.

**Paramètres** :
- `base64Image: string` - Image en base64
- `eventContext?: string | null` - Contexte de l'événement (optionnel)

**Retour** : `Promise<string>`

#### `generateImageTags(base64Image)`

Génère des tags sémantiques pour une image.

**Paramètres** :
- `base64Image: string` - Image en base64

**Retour** : `Promise<string[]>`

#### `enhanceImageQuality(base64Image)`

Améliore la qualité d'une image (débruitage, balance des blancs, netteté).

**Paramètres** :
- `base64Image: string` - Image en base64

**Retour** : `Promise<string>` - Image améliorée en base64

#### `translateCaption(caption, targetLanguage)`

Traduit une légende dans une langue cible.

**Paramètres** :
- `caption: string` - Légende à traduire
- `targetLanguage: string` - Code langue cible (ex: 'en', 'es', 'de')

**Retour** : `Promise<string>`

**Langues supportées** : FR, EN, ES, DE, IT, PT, NL, PL, RU, JA, ZH, KO, AR

---

## ⚔️ Services Battles

### `battleService.ts`

#### `createBattle(eventId, photo1Id, photo2Id, expiresInMinutes?)`

Crée une battle entre deux photos.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `photo1Id: string` - ID de la première photo
- `photo2Id: string` - ID de la deuxième photo
- `expiresInMinutes?: number` - Durée de la battle en minutes (optionnel)

**Retour** : `Promise<PhotoBattle>`

#### `voteBattle(battleId, photoId, userIdentifier)`

Vote pour une photo dans une battle.

**Paramètres** :
- `battleId: string` - ID de la battle
- `photoId: string` - ID de la photo pour laquelle voter
- `userIdentifier: string` - Identifiant utilisateur

**Retour** : `Promise<void>`

#### `getBattle(battleId)`

Récupère une battle par son ID.

**Paramètres** :
- `battleId: string` - ID de la battle

**Retour** : `Promise<PhotoBattle | null>`

#### `getActiveBattles(eventId)`

Récupère toutes les battles actives d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<PhotoBattle[]>`

#### `finishBattle(battleId)`

Termine une battle manuellement.

**Paramètres** :
- `battleId: string` - ID de la battle

**Retour** : `Promise<void>`

---

## 🎬 Services Aftermovies

### `aftermovieService.ts`

#### `generateAftermovie(eventId, photoIds, options)`

Génère un aftermovie (timelapse) à partir de photos sélectionnées.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `photoIds: string[]` - IDs des photos à inclure
- `options: AftermovieOptions` - Options de génération (qualité, transitions, audio, etc.)

**Retour** : `Promise<AftermovieResult>`

**Exemple** :
```typescript
const result = await generateAftermovie(eventId, photoIds, {
  width: 1920,
  height: 1080,
  fps: 30,
  msPerPhoto: 2000,
  videoBitsPerSecond: 12_000_000,
  includeTitle: true,
  titleText: "Mariage Sophie et Marc",
  transitionType: 'fade',
  transitionDuration: 1000
});
```

### `aftermovieShareService.ts`

#### `uploadAftermovie(eventId, blob, filename, title?)`

Upload un aftermovie vers Supabase Storage.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `blob: Blob` - Fichier vidéo
- `filename: string` - Nom du fichier
- `title?: string` - Titre de l'aftermovie (optionnel)

**Retour** : `Promise<Aftermovie>`

#### `getAftermovies(eventId)`

Récupère tous les aftermovies d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<Aftermovie[]>`

#### `incrementDownloadCount(aftermovieId)`

Incrémente le compteur de téléchargements d'un aftermovie.

**Paramètres** :
- `aftermovieId: string` - ID de l'aftermovie

**Retour** : `Promise<void>`

---

## 🏆 Services Gamification

### `gamificationService.ts`

#### `calculateAuthorStats(eventId, author)`

Calcule les statistiques d'un auteur (photos, likes, réactions, badges, score).

**Paramètres** :
- `eventId: string` - ID de l'événement
- `author: string` - Nom de l'auteur

**Retour** : `Promise<AuthorStats>`

#### `getBadgesForAuthor(eventId, author)`

Récupère tous les badges d'un auteur.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `author: string` - Nom de l'auteur

**Retour** : `Promise<Badge[]>`

#### `getLeaderboard(eventId, limit?)`

Récupère le classement des participants.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `limit?: number` - Nombre de participants à retourner (défaut: 10)

**Retour** : `Promise<LeaderboardEntry[]>`

#### `getMilestonesForAuthor(eventId, author)`

Récupère les milestones débloqués et à débloquer pour un auteur.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `author: string` - Nom de l'auteur

**Retour** : `Promise<{ unlocked: Milestone[]; next: Milestone | null }>`

---

## ⚙️ Services Paramètres

### `settingsService.ts`

#### `getEventSettings(eventId)`

Récupère les paramètres d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement

**Retour** : `Promise<EventSettings>`

#### `updateEventSettings(eventId, updates)`

Met à jour les paramètres d'un événement.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `updates: Partial<EventSettings>` - Objet avec les champs à mettre à jour

**Retour** : `Promise<EventSettings>`

**Exemple** :
```typescript
await updateEventSettings(eventId, {
  caption_generation_enabled: true,
  battle_mode_enabled: true,
  event_context: "Mariage de Sophie et Marc",
  caption_language: "fr"
});
```

---

## 📦 Services Export

### `exportService.ts`

#### `exportPhotosAsZip(eventId, photoIds?)`

Exporte des photos en ZIP.

**Paramètres** :
- `eventId: string` - ID de l'événement
- `photoIds?: string[]` - IDs des photos à exporter (optionnel, toutes si non fourni)

**Retour** : `Promise<Blob>` - Fichier ZIP

**Exemple** :
```typescript
const zipBlob = await exportPhotosAsZip(eventId, selectedPhotoIds);
const url = URL.createObjectURL(zipBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'photos.zip';
a.click();
```

---

## 🛡️ Services RGPD

### `rgpdService.ts`

#### `getConsent()`

Récupère le consentement RGPD de l'utilisateur.

**Retour** : `Promise<ConsentData | null>`

#### `setConsent(consent)`

Enregistre le consentement RGPD de l'utilisateur.

**Paramètres** :
- `consent: ConsentData` - Données de consentement

**Retour** : `Promise<void>`

#### `exportUserData(userIdentifier)`

Exporte toutes les données d'un utilisateur (RGPD - droit à la portabilité).

**Paramètres** :
- `userIdentifier: string` - Identifiant utilisateur

**Retour** : `Promise<Blob>` - Fichier JSON avec les données

#### `deleteUserData(userIdentifier)`

Supprime toutes les données d'un utilisateur (RGPD - droit à l'effacement).

**Paramètres** :
- `userIdentifier: string` - Identifiant utilisateur

**Retour** : `Promise<void>`

---

## 🔌 Client Supabase

### `supabaseClient.ts`

#### `supabase`

Client Supabase configuré avec les credentials d'environnement.

**Utilisation** :
```typescript
import { supabase } from './services/supabaseClient';

// Requête directe
const { data, error } = await supabase
  .from('photos')
  .select('*')
  .eq('event_id', eventId);

// Realtime subscription
const subscription = supabase
  .channel('photos')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'photos'
  }, (payload) => {
    console.log('Nouvelle photo:', payload.new);
  })
  .subscribe();
```

#### `isSupabaseConfigured()`

Vérifie si Supabase est correctement configuré.

**Retour** : `boolean`

---

## 🔄 Realtime Subscriptions

Tous les services utilisent Supabase Realtime pour la synchronisation automatique. Les subscriptions sont gérées via les Contexts React :

- **PhotosContext** : Synchronise les photos, likes, réactions
- **SettingsContext** : Synchronise les paramètres d'événement
- **EventContext** : Synchronise les événements actifs

**Exemple de subscription manuelle** :
```typescript
const subscription = supabase
  .channel('photos')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'photos',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    if (payload.eventType === 'INSERT') {
      addPhoto(payload.new as Photo);
    } else if (payload.eventType === 'DELETE') {
      removePhoto(payload.old.id);
    }
  })
  .subscribe();

// N'oubliez pas de se désabonner
return () => {
  subscription.unsubscribe();
};
```

---

## ⚠️ Gestion d'erreurs

Tous les services gèrent les erreurs de manière cohérente :

- **Erreurs Supabase** : Loggées avec `logger.error()` et propagées
- **Erreurs IA** : Fallbacks (légendes par défaut si erreur Gemini)
- **Erreurs validation** : Messages d'erreur explicites

**Exemple** :
```typescript
try {
  const photo = await addPhotoToWall(eventId, base64Image, caption, author);
  addToast('Photo uploadée avec succès !', 'success');
} catch (error) {
  logger.error('Upload failed', error, { component: 'photoService' });
  addToast('Erreur lors de l\'upload', 'error');
}
```

---

## 📚 Types TypeScript

Tous les types sont définis dans `types.ts` :

- `Photo`, `PhotoRow`
- `Event`, `EventRow`, `EventUpdate`
- `Guest`, `GuestRow`
- `PhotoBattle`, `BattleRow`
- `Aftermovie`, `AftermovieRow`
- `ReactionType`, `ReactionCounts`
- `Badge`, `AuthorStats`, `LeaderboardEntry`
- Et plus...

---

**Dernière mise à jour** : 2026-01-15

