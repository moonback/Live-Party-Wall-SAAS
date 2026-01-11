# 🎛️ Guide Organisateur - Live Party Wall

Guide complet pour les organisateurs d'événements utilisant Live Party Wall.

---

## 📋 Table des matières

- [Premiers pas](#premiers-pas)
- [Création et gestion d'événements](#création-et-gestion-dévénements)
- [Dashboard et statistiques](#dashboard-et-statistiques)
- [Modération](#modération)
- [Paramètres d'événement](#paramètres-dévénement)
- [Mode projection](#mode-projection)
- [Battles photos](#battles-photos)
- [Aftermovies](#aftermovies)
- [Gestion d'équipe](#gestion-déquipe)
- [Contrôle mobile](#contrôle-mobile)
- [Conseils et bonnes pratiques](#conseils-et-bonnes-pratiques)

---

## 🚀 Premiers pas

### Connexion

1. Accédez à la page d'accueil de Live Party Wall
2. Cliquez sur **"Je suis organisateur"** ou **"Admin"**
3. Connectez-vous avec votre email et mot de passe
4. Vous serez redirigé vers votre dashboard

### Création de votre premier événement

1. Dans le dashboard, cliquez sur **"Créer un événement"**
2. Remplissez les informations :
   - **Nom de l'événement** : Nom visible par les invités
   - **Slug** : URL unique (ex: `mon-mariage-2024`)
   - **Description** : Description optionnelle de l'événement
3. Cliquez sur **"Créer"**
4. Votre événement est maintenant actif !

### Accès à votre événement

Les invités peuvent accéder à votre événement via :
- **URL directe** : `votre-domaine.com?event=votre-slug`
- **QR Code** : Générez un QR code depuis le dashboard pour partage facile

---

## 🎪 Création et gestion d'événements

### Multi-événements (Architecture SaaS)

Live Party Wall supporte la gestion de **plusieurs événements simultanément** :

- **Sélection d'événement** : Utilisez le sélecteur en haut du dashboard pour basculer entre vos événements
- **Création illimitée** : Créez autant d'événements que nécessaire
- **Isolation complète** : Chaque événement est indépendant (photos, invités, paramètres)

### État d'un événement

- **Actif** : Les invités peuvent partager des photos
- **Inactif** : L'événement est en pause (les invités ne peuvent plus partager)

### Gestion des événements

- **Modifier** : Changez le nom, la description ou le slug
- **Dupliquer** : Créez un nouvel événement basé sur un existant (utile pour événements récurrents)
- **Archiver** : Désactivez un événement terminé

---

## 📊 Dashboard et statistiques

### Vue d'ensemble temps réel

Le dashboard affiche en temps réel :

- **📸 Nombre total de photos** : Compteur mis à jour instantanément
- **❤️ Likes et réactions** : Total des interactions
- **👥 Invités inscrits** : Nombre d'invités ayant partagé au moins une photo
- **🏆 Top photographes** : Classement des invités les plus actifs
- **⭐ Photos les plus likées** : Top des photos populaires
- **🎖️ Badges attribués** : Vue d'ensemble des badges obtenus
- **📈 Classements** : Leaderboard avec système de points
- **⚔️ Résultats battles** : Historique des battles photos

### Analytics détaillés

Accédez à la page **Analytics** pour :
- Graphiques de tendances
- Statistiques par période
- Analyse de l'engagement
- Répartition des types de contenu (photos/vidéos)

---

## 👮 Modération

### Modération automatique par IA

Live Party Wall utilise **Google Gemini** pour modérer automatiquement le contenu :

- ✅ **Toujours active** : La modération IA ne peut pas être désactivée
- 🛡️ **Détection de contenu inapproprié** : Images, textes, contexte
- ⚡ **Temps réel** : Vérification avant publication
- 🚫 **Rejet automatique** : Les contenus inappropriés sont rejetés

### Modération manuelle

#### Supprimer une photo

1. Allez dans **Dashboard > Modération**
2. Parcourez la liste des photos
3. Cliquez sur **🗑️ Supprimer** sur la photo concernée
4. Confirmez la suppression

#### Bloquer un invité

1. Dans la section **Modération**
2. Trouvez la photo de l'invité à bloquer
3. Cliquez sur **🚫 Bloquer l'invité**
4. L'invité ne pourra plus partager de photos (temporairement)

#### Débloquer un invité

1. Allez dans **Modération > Invités bloqués**
2. Cliquez sur **✅ Débloquer** à côté du nom de l'invité

### Historique des actions

Toutes les actions de modération sont enregistrées :
- Suppressions de photos
- Blocages d'invités
- Modifications de paramètres

---

## ⚙️ Paramètres d'événement

### Activation/Désactivation de fonctionnalités

Contrôlez quelles fonctionnalités sont disponibles pour vos invités :

- ✅ **Upload de photos** : Activer/désactiver le partage
- ✅ **Upload de vidéos** : Autoriser les vidéos courtes
- ✅ **Mode collage** : Permettre l'assemblage de plusieurs photos
- ✅ **Photobooth** : Activer le mode photobooth avec caméra
- ✅ **Likes** : Activer le système de likes
- ✅ **Réactions** : Activer les réactions émojis (6 types)
- ✅ **Gamification** : Activer badges, points et classements
- ✅ **Battles photos** : Activer les duels entre photos
- ✅ **Recherche IA "Retrouve-moi"** : Activer la reconnaissance faciale
- ✅ **Téléchargement** : Permettre le téléchargement de photos

### Personnalisation visuelle

#### Images de fond

- **Desktop** : Image de fond pour les écrans d'ordinateur
- **Mobile** : Image de fond pour les smartphones/tablettes
- **Format recommandé** : 1920x1080 (desktop), 1080x1920 (mobile)
- **Taille max** : 10MB

#### Logo personnalisé

- Remplace le titre "Live Party Wall" sur la landing page
- **Format recommandé** : PNG avec fond transparent
- **Taille max** : 2MB
- **Affichage** : Centré en haut de la page

### Configuration IA

#### Contexte de l'événement

Définissez le contexte pour améliorer les légendes générées par l'IA :

- **Exemples** : "Mariage élégant", "Anniversaire enfant", "Événement d'entreprise"
- **Impact** : Les légendes seront adaptées au contexte
- **Longueur** : Maximum 50 caractères

#### Messages d'alerte

Affichez un message d'alerte en haut du mur :

- **Texte personnalisé** : Ex: "N'oubliez pas de partager vos photos !"
- **Couleur** : Personnalisable
- **Visibilité** : Toujours visible ou temporaire

### Paramètres d'affichage

#### Vitesse de défilement

- **Rapide** : 2 secondes par photo
- **Normal** : 5 secondes par photo
- **Lent** : 10 secondes par photo
- **Personnalisé** : 1 à 30 secondes

#### Délai carrousel

Temps avant que le carrousel automatique ne démarre après inactivité :
- **Min** : 5 secondes
- **Max** : 240 secondes (4 minutes)
- **Défaut** : 30 secondes

---

## 🖥️ Mode projection

### Configuration

Le mode projection est optimisé pour l'affichage sur grand écran (TV, projecteur, écran LED) :

1. **Accéder au mode projection** :
   - Depuis le dashboard, cliquez sur **"Mode projection"**
   - Ou utilisez l'URL : `?mode=wall`

2. **Caractéristiques** :
   - Interface simplifiée (pas d'interactions utilisateur)
   - Transitions automatiques fluides
   - Optimisé pour la lecture seule
   - Plein écran disponible

### Contrôles

- **⏯️ Play/Pause** : Contrôler le défilement
- **⏭️ Suivant** : Passer à la photo suivante
- **⏮️ Précédent** : Revenir à la photo précédente
- **🔲 Plein écran** : Activer le mode plein écran (F11)

### Transitions

- **Fondu** : Transition douce entre les photos
- **Glissement** : Transition dynamique
- **Zoom** : Effet de zoom sur les photos

### Carrousel automatique

Après une période d'inactivité (configurable), le mur reprend automatiquement le défilement.

---

## ⚔️ Battles photos

### Créer une battle

Les battles photos permettent de créer des duels entre deux photos pour que les invités votent :

1. **Accéder aux battles** :
   - Dashboard > **Battles**
   - Ou Contrôle mobile > **Battles**

2. **Créer une battle manuelle** :
   - Cliquez sur **"Créer une battle"**
   - Sélectionnez la première photo
   - Sélectionnez la deuxième photo
   - Cliquez sur **"Lancer la battle"**

3. **Battles automatiques** :
   - Activez les battles automatiques dans les paramètres
   - Le système créera automatiquement des duels entre photos populaires

### Gérer les battles

- **Voir les résultats** : Consultez les votes en temps réel
- **Terminer une battle** : Clôturez une battle et affichez le gagnant
- **Projection** : Affichez les résultats sur le grand écran

### Projection des résultats

Les résultats des battles peuvent être projetés sur grand écran avec :
- Animation de victoire
- Affichage des scores
- Trophées et effets visuels

---

## 🎬 Aftermovies

### Génération d'aftermovie

Créez des vidéos timelapse automatiques à partir des photos de l'événement :

1. **Accéder à la génération** :
   - Dashboard > **Aftermovies**
   - Cliquez sur **"Créer un aftermovie"**

2. **Sélectionner les photos** :
   - Choisissez les photos à inclure
   - Utilisez les filtres pour sélectionner rapidement

3. **Réorganiser les photos** :
   - **Drag & Drop** : Glissez-déposez pour réorganiser
   - **Boutons ⬆️⬇️** : Déplacez une photo vers le haut ou le bas
   - **🔄 Réinitialiser** : Retour à l'ordre chronologique

4. **Choisir le preset** :
   - **HD (720p)** : 1280x720, 30fps - Idéal pour partage web
   - **Full HD (1080p)** : 1920x1080, 30fps - Qualité maximale
   - **Story (9:16)** : 1080x1920, 30fps - Optimisé Instagram/TikTok

5. **Personnaliser** :
   - **Durée par photo** : 0.5s à 5s (défaut : 2s)
   - **Audio de fond** : Upload un fichier audio (MP3, WAV)
   - **Volume** : 0-100%
   - **Boucle audio** : Répéter la musique si la vidéo est plus longue

6. **Générer** :
   - Cliquez sur **"Générer l'aftermovie"**
   - Suivez la progression en temps réel
   - La génération se fait en arrière-plan

### Partage et distribution

Une fois l'aftermovie généré :

1. **Upload automatique** : La vidéo est automatiquement uploadée vers Supabase Storage

2. **QR Code** : Un QR code est généré automatiquement pour téléchargement mobile

3. **Lien de partage** : 
   - URL publique pour téléchargement direct
   - Bouton **"Copier le lien"** pour partage facile

4. **Affichage dans la galerie** : 
   - Les aftermovies apparaissent dans la galerie des invités
   - Bouton de téléchargement direct disponible

5. **Compteur de téléchargements** :
   - Suivez le nombre de téléchargements en temps réel
   - Statistiques disponibles dans le dashboard

### Gestion des aftermovies

- **Voir la liste** : Consultez tous les aftermovies générés
- **Télécharger** : Téléchargez l'aftermovie en local
- **Partager** : Copiez le lien ou le QR code
- **Supprimer** : Supprimez un aftermovie (si nécessaire)

---

## 👥 Gestion d'équipe

### Rôles disponibles

Live Party Wall supporte 3 rôles pour la gestion d'équipe :

#### 👑 Owner (Propriétaire)
- **Accès complet** : Toutes les fonctionnalités
- **Gestion d'équipe** : Ajouter/supprimer des organisateurs
- **Paramètres** : Modifier tous les paramètres
- **Suppression** : Peut supprimer l'événement

#### 🎛️ Organizer (Organisateur)
- **Gestion quotidienne** : Modération, battles, aftermovies
- **Paramètres** : Modifier la plupart des paramètres
- **Pas de gestion d'équipe** : Ne peut pas ajouter/supprimer d'organisateurs

#### 👁️ Viewer (Observateur)
- **Lecture seule** : Consultation des statistiques et photos
- **Pas de modifications** : Ne peut pas modifier les paramètres

### Ajouter un organisateur

1. Allez dans **Dashboard > Équipe**
2. Cliquez sur **"Ajouter un organisateur"**
3. Entrez l'email de la personne
4. Sélectionnez le rôle (Organizer ou Viewer)
5. Cliquez sur **"Inviter"**
6. La personne recevra un email d'invitation

### Gérer les membres

- **Voir la liste** : Consultez tous les membres de l'équipe
- **Modifier le rôle** : Changez le rôle d'un membre
- **Supprimer** : Retirez un membre de l'équipe (sauf Owner)

---

## 📱 Contrôle mobile

### Interface mobile optimisée

Le contrôle mobile permet de gérer votre événement depuis votre smartphone :

1. **Accéder** : `?mode=mobile-control`
2. **Connexion** : Connectez-vous avec vos identifiants admin

### Fonctionnalités disponibles

#### 📊 Statistiques rapides
- Vue d'ensemble en temps réel
- Compteurs de photos, likes, invités
- Top photos et photographes

#### 👮 Modération simplifiée
- Liste des photos récentes
- Suppression rapide
- Blocage d'invités

#### ⚔️ Création de battles
- Créer des battles en quelques clics
- Sélection rapide de photos
- Lancement immédiat

#### ⚙️ Configuration rapide
- Activer/désactiver des fonctionnalités
- Modifier les paramètres d'affichage
- Gérer les messages d'alerte

#### 🎬 Aftermovies
- Lancer la génération
- Suivre la progression
- Partager les liens

### Notifications visuelles

Lorsque vous activez une fonctionnalité depuis le contrôle mobile :
- **Mode Battle** : Animation sur le grand écran avec trophées
- **Retrouve-moi** : Animation avec icônes de recherche
- **Mode Collage** : Animation avec grilles
- Les invités voient immédiatement l'activation sur le mur

---

## 💡 Conseils et bonnes pratiques

### Avant l'événement

1. **Testez en amont** :
   - Créez un événement de test
   - Vérifiez le mode projection
   - Testez l'upload de photos

2. **Configurez les paramètres** :
   - Personnalisez le fond et le logo
   - Configurez le contexte IA
   - Activez/désactivez les fonctionnalités nécessaires

3. **Préparez le matériel** :
   - Écran/projecteur pour le mode projection
   - Connexion internet stable
   - Tablette/smartphone pour le contrôle mobile

### Pendant l'événement

1. **Surveillez le dashboard** :
   - Vérifiez les statistiques en temps réel
   - Surveillez la modération
   - Créez des battles pour animer

2. **Utilisez le contrôle mobile** :
   - Gérez l'événement depuis votre téléphone
   - Créez des battles rapidement
   - Modérez si nécessaire

3. **Interagissez avec les invités** :
   - Créez des battles amusantes
   - Partagez les aftermovies en direct
   - Encouragez les invités à partager

### Après l'événement

1. **Générez les aftermovies** :
   - Créez plusieurs versions (HD, Story)
   - Partagez les liens avec les invités
   - Téléchargez pour archivage

2. **Exportez les photos** :
   - Utilisez l'export ZIP depuis le dashboard
   - Téléchargez toutes les photos en haute qualité

3. **Archivez l'événement** :
   - Désactivez l'événement
   - Conservez les données pour référence

### Optimisation des performances

- **Connexion internet** : Assurez-vous d'avoir une connexion stable
- **Mode projection** : Utilisez un navigateur moderne (Chrome, Firefox, Edge)
- **Cache** : Les images sont mises en cache automatiquement
- **Pagination** : Pour les grands événements, la pagination est automatique

---

## ❓ Questions fréquentes

### Comment partager l'URL de l'événement ?

L'URL de votre événement est : `votre-domaine.com?event=votre-slug`

Vous pouvez :
- Partager directement l'URL
- Générer un QR code depuis le dashboard
- Afficher l'URL sur le grand écran

### Les invités doivent-ils créer un compte ?

Non ! Les invités n'ont pas besoin de compte. Ils peuvent :
- Partager des photos directement
- Se créer un profil avec nom et avatar (optionnel)
- Accéder à toutes les fonctionnalités sans authentification

### Comment désactiver temporairement l'upload ?

Allez dans **Paramètres > Fonctionnalités** et désactivez **"Upload de photos"**. Les invités pourront toujours voir les photos existantes mais ne pourront plus en partager.

### Puis-je modifier les photos après upload ?

Non, les invités ne peuvent pas modifier leurs photos après upload. Seuls les organisateurs peuvent supprimer des photos via la modération.

### Combien de photos peut-on partager ?

Il n'y a pas de limite technique. Cependant, pour les très grands événements (1000+ photos), la pagination est automatique pour optimiser les performances.

### Les aftermovies sont-ils stockés indéfiniment ?

Oui, les aftermovies sont stockés dans Supabase Storage. Vous pouvez les supprimer manuellement si nécessaire.

---

## 🆘 Support

### Besoin d'aide ?

- **Documentation** : Consultez les autres guides dans `/docs`
- **FAQ** : Voir [FAQ.md](./FAQ.md)
- **Issues** : Signalez un problème sur GitHub

---

**Dernière mise à jour** : 2026-01-15

