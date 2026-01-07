# Gestion de la Mémoire et Abonnements Realtime

## 📋 Vue d'ensemble

Ce document décrit les bonnes pratiques pour gérer les abonnements Supabase Realtime et éviter les fuites de mémoire dans l'application Live Party Wall.

## ⚠️ Problème Potentiel

Les abonnements Supabase Realtime (`subscribeToNewPhotos`, `subscribeToReactionsUpdates`, etc.) doivent être **systématiquement nettoyés** lorsque les composants React sont démontés. Sinon, cela peut causer :

- **Fuites de mémoire** : Les abonnements continuent d'écouter les événements même après le démontage
- **Performance dégradée** : Accumulation d'abonnements inactifs
- **Comportements inattendus** : Callbacks appelés sur des composants démontés

## ✅ Solution : Nettoyage dans useEffect

### Pattern Standard

```typescript
useEffect(() => {
  const subscription = subscribeToNewPhotos((newPhoto) => {
    // Gérer la nouvelle photo
    handleNewPhoto(newPhoto);
  });

  // ⚠️ CRUCIAL : Nettoyer l'abonnement au démontage
  return () => {
    subscription.unsubscribe();
  };
}, []); // Dépendances vides = s'abonner une seule fois au montage
```

### Pattern avec Plusieurs Abonnements

```typescript
useEffect(() => {
  const sub1 = subscribeToNewPhotos(handleNewPhoto);
  const sub2 = subscribeToReactionsUpdates(handleReactions);
  const interval = setInterval(doSomething, 1000);

  // Nettoyer tous les abonnements et intervals
  return () => {
    sub1.unsubscribe();
    sub2.unsubscribe();
    clearInterval(interval);
  };
}, []);
```

### Utilisation de l'Utilitaire Helper

Pour plus de robustesse, utilisez `utils/subscriptionHelper.ts` :

```typescript
import { combineCleanups, SubscriptionManager } from '../utils/subscriptionHelper';

// Option 1 : combineCleanups
useEffect(() => {
  const sub1 = subscribeToNewPhotos(handler1);
  const sub2 = subscribeToReactionsUpdates(handler2);
  const interval = setInterval(doSomething, 1000);

  return combineCleanups([
    () => sub1.unsubscribe(),
    () => sub2.unsubscribe(),
    () => clearInterval(interval)
  ]);
}, []);

// Option 2 : SubscriptionManager (plus pratique pour plusieurs abonnements)
useEffect(() => {
  const manager = new SubscriptionManager();
  
  manager.add(subscribeToNewPhotos(handler1));
  manager.add(subscribeToReactionsUpdates(handler2));
  manager.addInterval(setInterval(doSomething, 1000));
  
  return () => manager.cleanup();
}, []);
```

## 📍 Vérification des Abonnements

### Abonnements Vérifiés ✅

Tous les abonnements suivants sont correctement nettoyés :

1. **`components/WallView.tsx`**
   - ✅ `subscribeToNewPhotos` (ligne 616)
   - ✅ `subscribeToLikesUpdates` (ligne 662)
   - ✅ `subscribeToReactionsUpdates` (ligne 677)
   - ✅ `subscribeToNewBattles` (ligne 719)
   - ✅ `setInterval` pour battles (ligne 714)

2. **`components/ProjectionWall.tsx`**
   - ✅ `subscribeToNewPhotos` (ligne 177)
   - ✅ `subscribeToLikesUpdates` (ligne 243)
   - ✅ `subscribeToReactionsUpdates` (ligne 262)

3. **`components/GuestGallery.tsx`**
   - ✅ `subscribeToNewPhotos` (ligne 103)
   - ✅ `subscribeToReactionsUpdates` (ligne 108)
   - ✅ `subscribeToNewBattles` (ligne 144)
   - ✅ `setInterval` pour battles (ligne 137)

4. **`components/PhotoBattle.tsx`**
   - ✅ `subscribeToBattleUpdates` (ligne 73)

5. **`components/arEffects/ARSceneManager.tsx`**
   - ✅ `subscribeToLikesUpdates` (ligne 84)
   - ✅ `setInterval` pour heures clés (ligne 154)

6. **`context/PhotosContext.tsx`**
   - ✅ `subscribeToNewPhotos` (ligne 74)
   - ✅ `subscribeToLikesUpdates` (ligne 79)
   - ✅ Abonnement direct Supabase pour suppressions (ligne 84)

7. **`components/AdminDashboard.tsx`**
   - ✅ `subscribeToNewBattles` (ligne 406)

## 🔍 Checklist de Vérification

Lors de l'ajout d'un nouvel abonnement, vérifiez :

- [ ] L'abonnement est créé dans un `useEffect`
- [ ] Le `useEffect` retourne une fonction de nettoyage
- [ ] La fonction de nettoyage appelle `unsubscribe()` sur l'abonnement
- [ ] Les `setInterval` et `setTimeout` sont également nettoyés avec `clearInterval`/`clearTimeout`
- [ ] Les dépendances du `useEffect` sont correctes (généralement `[]` pour s'abonner une seule fois)

## 🛠️ Utilitaires Disponibles

### `utils/subscriptionHelper.ts`

Fournit des fonctions helper pour gérer les abonnements de manière sécurisée :

- **`combineCleanups(cleanups)`** : Combine plusieurs fonctions de nettoyage
- **`cleanupSubscription(subscription)`** : Nettoie un abonnement de manière sécurisée
- **`cleanupInterval(interval)`** : Nettoie un interval de manière sécurisée
- **`cleanupTimeout(timeout)`** : Nettoie un timeout de manière sécurisée
- **`SubscriptionManager`** : Classe pour gérer plusieurs abonnements/intervals/timeouts

## 📝 Exemples d'Erreurs à Éviter

### ❌ Erreur : Oubli du nettoyage

```typescript
// ❌ MAUVAIS - Fuite de mémoire !
useEffect(() => {
  const subscription = subscribeToNewPhotos(handleNewPhoto);
  // Pas de return = pas de nettoyage
}, []);
```

### ❌ Erreur : Nettoyage conditionnel incorrect

```typescript
// ❌ MAUVAIS - Si la condition change, l'abonnement peut ne pas être nettoyé
useEffect(() => {
  if (someCondition) {
    const subscription = subscribeToNewPhotos(handleNewPhoto);
    return () => subscription.unsubscribe(); // Seulement si condition vraie
  }
}, [someCondition]);
```

### ✅ Correction : Toujours nettoyer

```typescript
// ✅ BON - Toujours nettoyer, même si condition fausse
useEffect(() => {
  if (!someCondition) return;
  
  const subscription = subscribeToNewPhotos(handleNewPhoto);
  return () => subscription.unsubscribe(); // Toujours nettoyé
}, [someCondition]);
```

## 🎯 Bonnes Pratiques

1. **Toujours retourner une fonction de nettoyage** dans `useEffect` qui crée un abonnement
2. **Utiliser `combineCleanups`** ou `SubscriptionManager` pour plusieurs abonnements
3. **Nettoyer les intervals/timeouts** avec `clearInterval`/`clearTimeout`
4. **Vérifier les dépendances** du `useEffect` pour éviter les ré-abonnements inutiles
5. **Tester le démontage** des composants pour s'assurer qu'il n'y a pas de fuites

## 🔗 Références

- [React useEffect Cleanup](https://react.dev/reference/react/useEffect#cleanup)
- [Supabase Realtime Subscriptions](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Memory Leaks in React](https://react.dev/learn/escape-hatches#memory-leaks)

---

**Dernière mise à jour** : 2026-01-15

