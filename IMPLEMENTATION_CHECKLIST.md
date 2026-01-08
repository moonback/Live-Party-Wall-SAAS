# ✅ Checklist d'Implémentation - Système de Rôles Admin/Organisateur

## 📋 Étape 1 : Base de Données

### Scripts SQL à exécuter (dans l'ordre)

- [ ] **1.1** Exécuter `supabase/supabase_platform_admins_setup.sql`
  - Crée la table `platform_admins`
  - Configure les politiques RLS pour la table
  - Crée la fonction `is_platform_admin()`

- [ ] **1.2** Exécuter `supabase/supabase_rls_admin_support.sql`
  - Met à jour la fonction `is_event_organizer()` pour inclure les admins
  - Met à jour toutes les politiques RLS pour supporter les admins
  - Permet aux admins d'accéder à tous les événements

### Créer le premier admin

- [ ] **1.3** Trouver l'ID de l'utilisateur dans Supabase :
  ```sql
  SELECT id, email FROM auth.users WHERE email = 'votre-email@exemple.com';
  ```

- [ ] **1.4** Créer le premier admin (remplacer `USER_ID_ICI` par l'ID trouvé) :
  ```sql
  INSERT INTO public.platform_admins (user_id, created_by)
  VALUES ('USER_ID_ICI', 'USER_ID_ICI');
  ```

---

## 📋 Étape 2 : Vérification du Code

### Fichiers créés/modifiés

- [x] `services/adminService.ts` - Service pour gérer les admins
- [x] `context/AuthContext.tsx` - Ajout de `isPlatformAdmin`
- [x] `components/AdminProfile.tsx` - Affichage du rôle
- [x] `services/eventService.ts` - Mise à jour des permissions
- [x] `supabase/supabase_platform_admins_setup.sql` - Script SQL
- [x] `supabase/supabase_rls_admin_support.sql` - Script RLS
- [x] `ROLES_SYSTEM.md` - Documentation

### Vérifications fonctionnelles

- [ ] **2.1** Tester la connexion avec un compte admin
  - Se connecter avec un compte admin
  - Vérifier que `isPlatformAdmin === true` dans le contexte
  - Vérifier que le badge "Super Administrateur" s'affiche

- [ ] **2.2** Tester l'accès aux événements (admin)
  - Vérifier que l'admin voit TOUS les événements dans `EventSelector`
  - Vérifier que l'admin peut accéder à n'importe quel événement
  - Vérifier que l'admin peut modifier n'importe quel événement

- [ ] **2.3** Tester la connexion avec un compte organisateur
  - Se connecter avec un compte organisateur (non-admin)
  - Vérifier que `isPlatformAdmin === false`
  - Vérifier que le badge "Organisateur" s'affiche

- [ ] **2.4** Tester l'accès aux événements (organisateur)
  - Vérifier que l'organisateur voit uniquement SES événements
  - Vérifier que l'organisateur peut modifier SES événements
  - Vérifier que l'organisateur NE PEUT PAS modifier les autres événements

---

## 📋 Étape 3 : Tests de Permissions

### Permissions Admin

- [ ] **3.1** Admin peut créer un événement
- [ ] **3.2** Admin peut modifier n'importe quel événement
- [ ] **3.3** Admin peut supprimer n'importe quel événement
- [ ] **3.4** Admin peut voir toutes les photos
- [ ] **3.5** Admin peut supprimer n'importe quelle photo
- [ ] **3.6** Admin peut modifier les paramètres de n'importe quel événement
- [ ] **3.7** Admin peut gérer les organisateurs de n'importe quel événement

### Permissions Organisateur

- [ ] **3.8** Organisateur peut créer un événement (devient owner)
- [ ] **3.9** Organisateur peut modifier SES événements uniquement
- [ ] **3.10** Organisateur (owner) peut supprimer SES événements
- [ ] **3.11** Organisateur peut voir les photos de SES événements
- [ ] **3.12** Organisateur peut supprimer les photos de SES événements
- [ ] **3.13** Organisateur peut modifier les paramètres de SES événements
- [ ] **3.14** Organisateur (owner) peut gérer les organisateurs de SES événements

---

## 📋 Étape 4 : Tests RLS (Row Level Security)

### Vérifier les politiques RLS dans Supabase

- [ ] **4.1** Tester la lecture des événements
  - Admin : peut lire tous les événements (actifs ou non)
  - Organisateur : peut lire ses événements
  - Invité : peut lire uniquement les événements actifs

- [ ] **4.2** Tester la création d'événements
  - Admin : peut créer pour n'importe qui
  - Organisateur : peut créer uniquement pour lui-même

- [ ] **4.3** Tester la modification d'événements
  - Admin : peut modifier tous les événements
  - Organisateur : peut modifier uniquement ses événements

- [ ] **4.4** Tester la suppression d'événements
  - Admin : peut supprimer tous les événements
  - Owner : peut supprimer ses événements
  - Organisateur (non-owner) : ne peut pas supprimer

---

## 📋 Étape 5 : Interface Utilisateur

### Affichage des rôles

- [ ] **5.1** Badge "Super Administrateur" (violet) s'affiche pour les admins
- [ ] **5.2** Badge "Organisateur" (indigo) s'affiche pour les organisateurs
- [ ] **5.3** Badge "Utilisateur" (gris) s'affiche pour les autres

### Dashboard Admin

- [ ] **5.4** Admin voit tous les événements dans `EventSelector`
- [ ] **5.5** Organisateur voit uniquement ses événements dans `EventSelector`
- [ ] **5.6** Les onglets du dashboard sont accessibles selon les permissions

---

## 📋 Étape 6 : Documentation

- [x] **6.1** Documentation créée : `ROLES_SYSTEM.md`
- [x] **6.2** Checklist créée : `IMPLEMENTATION_CHECKLIST.md`
- [ ] **6.3** Mettre à jour `README.md` si nécessaire
- [ ] **6.4** Mettre à jour `ARCHITECTURE.md` si nécessaire

---

## 🐛 Dépannage

### Problèmes courants

#### L'admin ne voit pas tous les événements

1. Vérifier que l'utilisateur est bien dans `platform_admins`
2. Vérifier que `is_active = true`
3. Vérifier que `user_id` correspond à l'ID dans `auth.users`
4. Vérifier que le script `supabase_rls_admin_support.sql` a été exécuté

#### Erreur RLS lors de l'accès aux événements

1. Vérifier que la fonction `is_event_organizer()` a été mise à jour
2. Vérifier que la fonction `is_platform_admin()` existe
3. Vérifier les logs Supabase pour les erreurs RLS

#### Le badge de rôle ne s'affiche pas correctement

1. Vérifier que `AuthContext` charge bien `isPlatformAdmin`
2. Vérifier la console pour les erreurs
3. Vérifier que `AdminProfile` utilise bien `isPlatformAdmin` du contexte

---

## ✅ Validation Finale

Une fois toutes les étapes complétées :

- [ ] Tous les tests passent
- [ ] Les admins ont accès à tous les événements
- [ ] Les organisateurs ont accès uniquement à leurs événements
- [ ] Les politiques RLS fonctionnent correctement
- [ ] L'interface affiche correctement les rôles
- [ ] La documentation est à jour

---

**Date de création** : 2026-01-15  
**Dernière mise à jour** : 2026-01-15

