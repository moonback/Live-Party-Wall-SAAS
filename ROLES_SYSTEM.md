# Système de Rôles - Admin vs Organisateur

## 📋 Vue d'ensemble

Le système distingue maintenant deux types de rôles :

1. **Super Administrateur de la Plateforme** (`platform_admin`)
   - Accès à tous les événements
   - Peut gérer tous les événements, même ceux dont il n'est pas propriétaire
   - Peut créer, modifier et supprimer n'importe quel événement
   - Peut gérer les autres admins de la plateforme

2. **Organisateur d'Événement** (`event_organizer`)
   - Accès uniquement aux événements dont il est propriétaire ou organisateur
   - Peut gérer les événements qui lui sont assignés
   - Rôles disponibles : `owner`, `organizer`, `viewer`

---

## 🗄️ Structure de la Base de Données

### Table `platform_admins`

Table pour gérer les super-admins de la plateforme.

```sql
CREATE TABLE public.platform_admins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);
```

**Politiques RLS** : Seuls les admins peuvent lire/modifier/supprimer les admins.

### Table `event_organizers`

Table existante pour gérer les organisateurs d'événements.

```sql
CREATE TABLE public.event_organizers (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT CHECK (role IN ('owner', 'organizer', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 Installation

### 1. Exécuter le script SQL

Exécutez le script `supabase/supabase_platform_admins_setup.sql` dans l'éditeur SQL de Supabase.

### 2. Créer le premier admin

Après avoir créé un utilisateur dans Supabase Auth, exécutez :

```sql
-- Trouver l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'votre-email@exemple.com';

-- Créer le premier admin (remplacer USER_ID par l'ID trouvé)
INSERT INTO public.platform_admins (user_id, created_by)
VALUES (
    'USER_ID_ICI',
    'USER_ID_ICI'
);
```

---

## 💻 Utilisation dans le Code

### Vérifier si un utilisateur est admin de la plateforme

```typescript
import { isPlatformAdmin } from '../services/adminService';

// Vérifier l'utilisateur actuel
const isAdmin = await isPlatformAdmin();

// Vérifier un utilisateur spécifique
const isAdmin = await isPlatformAdmin(userId);
```

### Utiliser dans un composant React

```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { isPlatformAdmin, user } = useAuth();
  
  if (isPlatformAdmin) {
    // L'utilisateur est super-admin
  }
};
```

### Vérifier les permissions d'événement

```typescript
import { isEventOrganizer, canEditEvent } from '../services/eventService';

// Vérifier si l'utilisateur est organisateur (admin ou organisateur)
const isOrganizer = await isEventOrganizer(eventId, userId);

// Vérifier si l'utilisateur peut modifier (admin ou owner/organizer)
const canEdit = await canEditEvent(eventId, userId);
```

**Note** : Les admins de la plateforme sont automatiquement considérés comme organisateurs de tous les événements.

---

## 🔐 Permissions

### Super Administrateur

- ✅ Accès à tous les événements
- ✅ Peut créer, modifier, supprimer n'importe quel événement
- ✅ Peut gérer les autres admins
- ✅ Peut voir toutes les photos, invités, statistiques
- ✅ Accès complet au dashboard admin

### Organisateur d'Événement

#### Owner
- ✅ Accès complet à son événement
- ✅ Peut modifier/supprimer l'événement
- ✅ Peut gérer les organisateurs
- ✅ Accès à toutes les fonctionnalités de l'événement

#### Organizer
- ✅ Accès à l'événement
- ✅ Peut modifier les paramètres
- ✅ Peut modérer les photos
- ❌ Ne peut pas supprimer l'événement
- ❌ Ne peut pas gérer les organisateurs

#### Viewer
- ✅ Peut voir les statistiques
- ✅ Peut voir les photos
- ❌ Ne peut pas modifier quoi que ce soit

---

## 📝 Services Disponibles

### `adminService.ts`

- `isPlatformAdmin(userId?)` : Vérifie si un utilisateur est admin
- `getAllPlatformAdmins()` : Liste tous les admins (admin uniquement)
- `addPlatformAdmin(userId)` : Ajoute un admin (admin uniquement)
- `deactivatePlatformAdmin(adminId)` : Désactive un admin (admin uniquement)
- `reactivatePlatformAdmin(adminId)` : Réactive un admin (admin uniquement)

### `eventService.ts`

- `getUserEvents(userId)` : Retourne tous les événements pour un utilisateur
  - Admins : tous les événements
  - Organisateurs : leurs événements uniquement
- `isEventOrganizer(eventId, userId)` : Vérifie si un utilisateur est organisateur
  - Retourne `true` pour les admins
- `canEditEvent(eventId, userId)` : Vérifie si un utilisateur peut modifier
  - Retourne `true` pour les admins

---

## 🎨 Interface Utilisateur

### Affichage du Rôle

Le composant `AdminProfile` affiche automatiquement le rôle de l'utilisateur :

- **Super Administrateur** : Badge violet avec icône Shield
- **Organisateur** : Badge indigo avec icône Users
- **Utilisateur** : Badge gris avec icône User

### Dashboard Admin

Le dashboard admin est accessible à :
- Tous les super-admins de la plateforme
- Tous les organisateurs d'événements (owner, organizer, viewer)

Les permissions sont gérées au niveau des services pour restreindre les actions selon le rôle.

---

## 🔄 Migration depuis l'Ancien Système

Si vous avez déjà des utilisateurs authentifiés :

1. Exécutez le script SQL `supabase_platform_admins_setup.sql`
2. Identifiez les utilisateurs qui doivent être admins
3. Ajoutez-les dans la table `platform_admins`
4. Les autres utilisateurs restent des organisateurs (via `event_organizers`)

---

## ⚠️ Notes Importantes

1. **Premier Admin** : Le premier admin doit être créé manuellement via SQL
2. **RLS** : Les politiques RLS protègent la table `platform_admins`
3. **Cascade** : La suppression d'un utilisateur dans `auth.users` supprime automatiquement son entrée dans `platform_admins`
4. **Performance** : Les vérifications d'admin sont mises en cache dans `AuthContext`

---

## 🐛 Dépannage

### L'utilisateur ne peut pas accéder au dashboard

1. Vérifier qu'il est authentifié : `isAuthenticated === true`
2. Vérifier qu'il est admin OU organisateur d'au moins un événement
3. Vérifier les logs dans la console pour les erreurs RLS

### Les admins ne voient pas tous les événements

1. Vérifier que l'utilisateur est bien dans `platform_admins`
2. Vérifier que `is_active = true`
3. Vérifier que `user_id` correspond bien à l'ID dans `auth.users`

### Erreur RLS lors de la création d'un admin

1. Le premier admin doit être créé manuellement via SQL (bypass RLS)
2. Les admins suivants peuvent être créés via le service `addPlatformAdmin`

---

## 📚 Fichiers Modifiés

- `supabase/supabase_platform_admins_setup.sql` : Script de création de la table
- `services/adminService.ts` : Service pour gérer les admins
- `context/AuthContext.tsx` : Ajout de `isPlatformAdmin`
- `components/AdminProfile.tsx` : Affichage du rôle
- `services/eventService.ts` : Mise à jour des permissions
- `types.ts` : Types pour `PlatformAdmin`

---

**Dernière mise à jour** : 2026-01-15

