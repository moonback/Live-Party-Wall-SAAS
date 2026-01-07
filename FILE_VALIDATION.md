# Validation des Fichiers - Documentation

## 📋 Vue d'ensemble

Ce document décrit les validations de fichiers appliquées dans l'application Live Party Wall pour éviter les uploads de fichiers trop volumineux ou de formats non supportés.

## ⚠️ Problème Potentiel

L'envoi de fichiers trop volumineux ou de formats non supportés (ex: TIFF) peut :
- Faire échouer l'upload
- Saturer le stockage Supabase
- Causer des erreurs côté serveur
- Dégradé l'expérience utilisateur

## ✅ Solution : Validation Systématique

Tous les fichiers sont maintenant validés **avant** l'upload avec les fonctions standardisées de `utils/validation.ts`.

## 🔍 Fonctions de Validation Disponibles

### Pour les Images

#### `validateImageFile(file: File)`
Valide un fichier image avant l'upload.

**Vérifications** :
- ✅ Taille max : 10MB (`MAX_FILE_SIZE`)
- ✅ Types MIME autorisés : `image/jpeg`, `image/png`, `image/webp`

**Utilisation** :
```typescript
import { validateImageFile } from '../utils/validation';

const validation = validateImageFile(file);
if (!validation.valid) {
  addToast(validation.error, 'error');
  return;
}
```

#### `validateBase64Image(base64Image: string)`
Valide une image en base64 avant l'upload.

**Vérifications** :
- ✅ Taille approximative max : 10MB
- ✅ Type MIME depuis le préfixe data URL

**Utilisation** :
```typescript
import { validateBase64Image } from '../utils/validation';

const validation = validateBase64Image(base64Image);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

#### `validateImageBlob(blob: Blob, expectedMimeType?: string)`
Valide un Blob d'image avant l'upload.

**Vérifications** :
- ✅ Taille max : 10MB
- ✅ Type MIME (depuis le blob ou paramètre)

**Utilisation** :
```typescript
import { validateImageBlob } from '../utils/validation';

const validation = validateImageBlob(blob, 'image/jpeg');
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### Pour les Vidéos

#### `validateVideoFile(file: File)`
Valide un fichier vidéo avant l'upload.

**Vérifications** :
- ✅ Taille max : 50MB (`MAX_VIDEO_FILE_SIZE`)
- ✅ Types MIME autorisés : `video/mp4`, `video/webm`, `video/quicktime`

#### `validateVideoBlob(blob: Blob, expectedMimeType?: string)`
Valide un Blob vidéo avant l'upload.

**Vérifications** :
- ✅ Taille max : 50MB
- ✅ Type MIME (depuis le blob ou paramètre)

#### `validateVideoDuration(duration: number)`
Valide la durée d'une vidéo.

**Vérifications** :
- ✅ Durée max : 60 secondes (`MAX_VIDEO_DURATION`)
- ✅ Durée > 0

## 📍 Points de Validation Implémentés

### ✅ Composants

1. **`components/GuestUpload.tsx`**
   - ✅ `validateImageFile` pour les fichiers sélectionnés (ligne 412)
   - ✅ `validateVideoFile` pour les vidéos (ligne 433)
   - ✅ `validateVideoDuration` pour la durée des vidéos (ligne 451)

2. **`components/UserOnboarding.tsx`**
   - ✅ `validateImageFile` pour les avatars uploadés (ligne 212)
   - ✅ Remplace la validation manuelle précédente

### ✅ Services

1. **`services/photoService.ts`**
   - ✅ `validateBase64Image` dans `addPhotoToWall` (avant conversion en blob)
   - ✅ `validateImageBlob` dans `addPhotoToWall` (double vérification)
   - ✅ `validateVideoBlob` dans `addVideoToWall` (avant upload)

2. **`services/guestService.ts`**
   - ✅ `validateBase64Image` dans `registerGuest` (avant conversion en blob)
   - ✅ `validateImageBlob` dans `registerGuest` (double vérification)

3. **`services/frameService.ts`**
   - ✅ Validation du type PNG dans `uploadDecorativeFramePng`
   - ✅ Validation de la taille max 10MB dans `uploadDecorativeFramePng`

## 🔒 Constantes de Validation

Définies dans `constants.ts` :

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const MAX_VIDEO_DURATION = 60; // secondes
```

## 📝 Exemples d'Utilisation

### Exemple 1 : Validation dans un Composant

```typescript
const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Valider le fichier
  const validation = validateImageFile(file);
  if (!validation.valid) {
    addToast(validation.error || 'Fichier invalide', 'error');
    return;
  }

  // Continuer avec le traitement
  // ...
};
```

### Exemple 2 : Validation dans un Service

```typescript
export const addPhotoToWall = async (
  base64Image: string,
  caption: string,
  author: string
): Promise<Photo> => {
  // Valider avant l'upload
  const validation = validateBase64Image(base64Image);
  if (!validation.valid) {
    throw new Error(validation.error || 'Image invalide');
  }

  // Convertir et valider le blob
  const blob = new Blob([...], { type: 'image/jpeg' });
  const blobValidation = validateImageBlob(blob, 'image/jpeg');
  if (!blobValidation.valid) {
    throw new Error(blobValidation.error || 'Blob invalide');
  }

  // Continuer avec l'upload
  // ...
};
```

## 🎯 Bonnes Pratiques

1. **Toujours valider avant l'upload** : Ne jamais faire confiance aux fichiers fournis par l'utilisateur
2. **Double validation** : Valider à la fois le format source (File/base64) et le format final (Blob)
3. **Messages d'erreur clairs** : Utiliser les messages d'erreur retournés par les fonctions de validation
4. **Validation côté client ET serveur** : La validation côté client améliore l'UX, mais le serveur doit aussi valider

## ⚠️ Formats Non Supportés

Les formats suivants sont **explicitement rejetés** :
- ❌ TIFF (`.tiff`, `.tif`)
- ❌ BMP (`.bmp`)
- ❌ GIF (`.gif`) - sauf si ajouté dans `ALLOWED_IMAGE_TYPES`
- ❌ Formats vidéo non listés dans `ALLOWED_VIDEO_TYPES`

## 🔗 Références

- `utils/validation.ts` - Fonctions de validation
- `constants.ts` - Constantes de validation (tailles, types)
- `services/photoService.ts` - Service d'upload de photos/vidéos
- `services/guestService.ts` - Service d'enregistrement d'invités
- `services/frameService.ts` - Service d'upload de cadres

---

**Dernière mise à jour** : 2026-01-15

