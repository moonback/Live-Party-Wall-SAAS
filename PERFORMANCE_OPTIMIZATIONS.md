# Optimisations de Performance - Wall View

## 📋 Vue d'ensemble

Ce document décrit les optimisations de performance appliquées au composant `WallView` pour éviter les ralentissements et les re-renders inutiles lors de l'affichage de nombreuses images en temps réel.

## ⚠️ Problèmes Identifiés

1. **Re-renders inutiles** : Toute la galerie se re-rendait lorsqu'une seule photo recevait un like
2. **Callbacks non mémorisés** : Les callbacks créaient de nouvelles références à chaque render
3. **Composants non mémorisés** : `GridView` et `VirtualColumn` se re-rendaient même sans changements
4. **Mise à jour inefficace des likes** : Utilisation de `map()` sur tout le tableau au lieu de mettre à jour uniquement la photo concernée

## ✅ Optimisations Appliquées

### 1. Mémorisation des Callbacks avec `useCallback`

**Avant** :
```typescript
const closeLightbox = () => {
  setLightboxIndex(null);
  setWinnerPhotoForLightbox(null);
};
```

**Après** :
```typescript
const closeLightbox = useCallback(() => {
  setLightboxIndex(null);
  setWinnerPhotoForLightbox(null);
}, []);
```

**Bénéfices** :
- Les callbacks ont une référence stable
- Les composants enfants ne se re-rendent pas inutilement
- Meilleure performance lors des interactions utilisateur

**Callbacks optimisés** :
- `closeLightbox`
- `prevLightbox`
- `nextLightbox`
- `handleBattleFinished`
- `handlePhotoClick` (dans GridView)

### 2. Mémorisation des Composants avec `React.memo`

**Composants mémorisés** :
- ✅ `GridView` - Mémorisé avec `React.memo`
- ✅ `VirtualColumn` - Mémorisé avec `React.memo`
- ✅ `PhotoCard` - Déjà mémorisé, optimisé avec `useMemo` pour les badges
- ✅ `WallView` - Déjà mémorisé avec `React.memo`

**Bénéfices** :
- Les composants ne se re-rendent que si leurs props changent réellement
- Réduction significative des re-renders inutiles
- Meilleure performance avec de nombreuses photos

### 3. Optimisation de la Mise à Jour des Likes

**Avant** :
```typescript
setLocalPhotos((prev) =>
  prev.map((photo) =>
    photo.id === photoId ? { ...photo, likes_count: newLikesCount } : photo
  )
);
```

**Après** :
```typescript
setLocalPhotos((prev) => {
  const photoIndex = prev.findIndex(p => p.id === photoId);
  if (photoIndex === -1) return prev; // Photo non trouvée
  
  const currentPhoto = prev[photoIndex];
  if (currentPhoto.likes_count === newLikesCount) return prev; // Pas de changement
  
  // Créer un nouveau tableau avec seulement la photo mise à jour
  const updated = [...prev];
  updated[photoIndex] = { ...currentPhoto, likes_count: newLikesCount };
  return updated;
});
```

**Bénéfices** :
- Vérification si la photo existe avant de mettre à jour
- Vérification si le nombre de likes a vraiment changé
- Création d'un nouveau tableau uniquement si nécessaire
- Évite les re-renders inutiles de toutes les photos

### 4. Mémorisation des Calculs dans PhotoCard

**Avant** :
```typescript
const photoBadge = getPhotoBadge(photo, allPhotos);
const authorHasPhotographerBadge = hasPhotographerBadge(photo.author, allPhotos);
```

**Après** :
```typescript
const photoBadge = useMemo(() => getPhotoBadge(photo, allPhotos), [photo.id, photo.likes_count, allPhotos.length]);
const authorHasPhotographerBadge = useMemo(() => hasPhotographerBadge(photo.author, allPhotos), [photo.author, allPhotos.length]);
```

**Bénéfices** :
- Les badges ne sont recalculés que si nécessaire
- Réduction des calculs redondants
- Meilleure performance lors du scroll

### 5. Lazy Loading des Composants Lourds

**Composants lazy-loaded** :
- ✅ `Lightbox` - Chargé uniquement quand nécessaire

**Code** :
```typescript
const Lightbox = lazy(() => import('./Lightbox'));
```

**Bénéfices** :
- Réduction de la taille du bundle initial
- Chargement à la demande
- Meilleur temps de chargement initial

## 📊 Impact des Optimisations

### Avant les Optimisations
- ❌ Re-render de toutes les photos lors d'un like
- ❌ Callbacks recréés à chaque render
- ❌ Composants enfants re-rendus inutilement
- ❌ Calculs redondants des badges

### Après les Optimisations
- ✅ Mise à jour uniquement de la photo concernée
- ✅ Callbacks stables avec `useCallback`
- ✅ Composants mémorisés avec `React.memo`
- ✅ Calculs mémorisés avec `useMemo`

## 🔍 Vérifications de Performance

### Checklist
- [x] Tous les callbacks sont mémorisés avec `useCallback`
- [x] Les composants enfants sont mémorisés avec `React.memo`
- [x] Les calculs coûteux sont mémorisés avec `useMemo`
- [x] Les mises à jour de likes ne touchent que la photo concernée
- [x] Les composants lourds sont lazy-loaded
- [x] Les dépendances des hooks sont correctes

## 🎯 Bonnes Pratiques Appliquées

1. **Mémorisation des Callbacks** : Utiliser `useCallback` pour tous les callbacks passés en props
2. **Mémorisation des Composants** : Utiliser `React.memo` pour les composants enfants
3. **Mémorisation des Calculs** : Utiliser `useMemo` pour les calculs coûteux
4. **Mises à Jour Ciblées** : Mettre à jour uniquement ce qui a changé
5. **Lazy Loading** : Charger les composants lourds à la demande

## 📝 Notes Techniques

### Dépendances des Hooks

Les dépendances des hooks sont soigneusement choisies pour éviter les re-renders inutiles tout en garantissant que les valeurs sont à jour :

```typescript
// ✅ Bon : Dépendances minimales
const nextLightbox = useCallback(() => {
  // ...
}, [displayedPhotos.length]); // Seulement la longueur, pas le tableau complet

// ❌ Éviter : Dépendances trop larges
const nextLightbox = useCallback(() => {
  // ...
}, [displayedPhotos]); // Re-créer le callback à chaque changement de photo
```

### Comparaison des Props

`React.memo` compare les props par référence. Pour les objets et tableaux, il faut s'assurer que les références ne changent pas inutilement :

```typescript
// ✅ Bon : Référence stable
const photosReactions = useMemo(() => new Map(...), [deps]);

// ❌ Éviter : Nouvelle référence à chaque render
const photosReactions = new Map(...);
```

## 🔗 Références

- [React.memo](https://react.dev/reference/react/memo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [useMemo](https://react.dev/reference/react/useMemo)
- [React.lazy](https://react.dev/reference/react/lazy)

---

**Dernière mise à jour** : 2026-01-15

