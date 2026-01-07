# 🎮 Photo Battle - Documentation

## 📋 Vue d'Ensemble

Photo Battle est une fonctionnalité interactive qui permet à deux photos de s'affronter. Les invités votent en temps réel pour leur photo préférée. La photo gagnante reste affichée, la perdante disparaît.

## 🎯 Fonctionnalités

### Pour les Invités (Galerie)
- **Affichage des battles actives** : Liste des battles en cours avec timer
- **Vote interactif** : Clic sur une photo pour voter
- **Mises à jour en temps réel** : Les votes sont mis à jour instantanément
- **Indicateurs visuels** : Badges "Votre vote", pourcentages, barres de progression
- **Résultats** : Affichage du gagnant avec badge trophée

### Pour le Mur (Grand Écran)
- **Mode compact** : Affichage optimisé pour le grand écran
- **Mises à jour en temps réel** : Synchronisation avec les votes des invités
- **Effet visuel fort** : Animation et mise en évidence du gagnant

## 🗄️ Base de Données

### Tables Créées

#### `photo_battles`
- `id` (UUID) : Identifiant unique
- `photo1_id` (UUID) : Référence à la première photo
- `photo2_id` (UUID) : Référence à la deuxième photo
- `status` (TEXT) : 'active', 'finished', 'cancelled'
- `winner_id` (UUID) : Photo gagnante (null si égalité)
- `votes1_count` (INTEGER) : Compteur de votes pour photo1
- `votes2_count` (INTEGER) : Compteur de votes pour photo2
- `created_at` (TIMESTAMPTZ) : Date de création
- `finished_at` (TIMESTAMPTZ) : Date de fin
- `expires_at` (TIMESTAMPTZ) : Date d'expiration automatique

#### `battle_votes`
- `id` (UUID) : Identifiant unique
- `battle_id` (UUID) : Référence à la battle
- `user_identifier` (TEXT) : ID utilisateur (localStorage)
- `voted_for_photo_id` (UUID) : Photo pour laquelle l'utilisateur a voté
- `created_at` (TIMESTAMPTZ) : Date du vote
- **Contrainte unique** : `(battle_id, user_identifier)` - Un utilisateur ne peut voter qu'une fois par battle

### Triggers SQL

1. **`update_battle_votes_count()`** : Met à jour automatiquement les compteurs de votes
2. **`finish_battle_if_expired()`** : Termine automatiquement les battles expirées

## 🔧 Installation

### 1. Exécuter le script SQL

```bash
# Dans Supabase SQL Editor, exécuter :
supabase/supabase_photo_battles_setup.sql
```

### 2. Vérifier les tables

Les tables `photo_battles` et `battle_votes` doivent être créées avec RLS activé.

### 3. Activer Realtime

Les tables sont automatiquement ajoutées à la publication Realtime pour les mises à jour en temps réel.

## 📦 Services

### `battleService.ts`

#### Fonctions Principales

- **`getActiveBattles(userId?)`** : Récupère toutes les battles actives
- **`createBattle(photo1Id, photo2Id, durationMinutes)`** : Crée une nouvelle battle
- **`voteForBattle(battleId, photoId, userId)`** : Vote pour une photo
- **`finishBattle(battleId)`** : Termine une battle manuellement
- **`subscribeToBattleUpdates(battleId, callback)`** : S'abonne aux mises à jour d'une battle
- **`subscribeToNewBattles(callback)`** : S'abonne aux nouvelles battles

## 🎨 Composants

### `PhotoBattle.tsx`

Composant React qui affiche une battle avec :
- Deux photos côte à côte
- Barres de progression avec pourcentages
- Timer de fin
- Indicateurs de vote utilisateur
- Badge gagnant
- Mode compact pour le mur

#### Props

```typescript
interface PhotoBattleProps {
  battle: PhotoBattle;
  userId: string;
  onBattleFinished?: (battleId: string, winnerId: string | null) => void;
  compact?: boolean; // Mode compact pour le mur
}
```

## 🚀 Utilisation

### Créer une Battle (Admin)

```typescript
import { createBattle } from '../services/battleService';

// Créer une battle de 30 minutes
const battle = await createBattle(photo1Id, photo2Id, 30);
```

### Afficher les Battles dans un Composant

```typescript
import { PhotoBattle } from './components/PhotoBattle';
import { getActiveBattles } from '../services/battleService';

const [battles, setBattles] = useState<PhotoBattle[]>([]);

useEffect(() => {
  const loadBattles = async () => {
    const activeBattles = await getActiveBattles(userId);
    setBattles(activeBattles);
  };
  loadBattles();
}, [userId]);

// Rendu
{battles.map(battle => (
  <PhotoBattle
    key={battle.id}
    battle={battle}
    userId={userId}
    onBattleFinished={(battleId) => {
      setBattles(prev => prev.filter(b => b.id !== battleId));
    }}
  />
))}
```

## 🎯 Intégration

### Dans GuestGallery

Les battles sont affichées en haut de la galerie avec un bouton toggle "Battles".

### Dans WallView

Les battles sont affichées en mode compact en haut du mur (maximum 2 battles simultanées).

## ⚙️ Configuration

### Durée par défaut

Les battles expirent automatiquement après 30 minutes par défaut (configurable lors de la création).

### Limite d'affichage

- **Galerie** : Toutes les battles actives (limité à 10 par requête)
- **Mur** : Maximum 2 battles simultanées

## 🔄 Flux de Données

1. **Création** : Admin crée une battle via `createBattle()`
2. **Affichage** : Les battles actives sont chargées via `getActiveBattles()`
3. **Vote** : L'utilisateur vote via `voteForBattle()`
4. **Mise à jour** : Les compteurs sont mis à jour via trigger SQL
5. **Temps réel** : Les clients sont notifiés via Realtime
6. **Fin** : La battle se termine automatiquement ou manuellement

## 🎨 Personnalisation

### Styles

Les styles sont définis dans `PhotoBattle.tsx` avec Tailwind CSS :
- Mode normal : Affichage complet avec détails
- Mode compact : Affichage optimisé pour le mur

### Animations

- Barres de progression animées
- Badge gagnant avec bounce
- Transitions fluides

## 🐛 Dépannage

### Les battles ne s'affichent pas

1. Vérifier que les tables existent dans Supabase
2. Vérifier que RLS est activé
3. Vérifier que Realtime est activé pour les tables

### Les votes ne se mettent pas à jour

1. Vérifier la connexion Realtime
2. Vérifier que les triggers SQL sont actifs
3. Vérifier les logs de la console

## 📝 Notes

- Un utilisateur ne peut voter qu'une fois par battle
- Les battles expirées sont automatiquement terminées
- En cas d'égalité, `winner_id` reste `null`
- Les battles terminées ne sont plus affichées dans la liste active

## 🔮 Améliorations Futures

- [ ] Création automatique de battles (algorithme de sélection)
- [ ] Historique des battles terminées
- [ ] Statistiques par battle
- [ ] Notifications push pour les nouvelles battles
- [ ] Mode tournoi (plusieurs battles en cascade)

