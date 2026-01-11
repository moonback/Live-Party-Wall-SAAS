# ❓ FAQ - Live Party Wall

Foire aux questions complète pour Live Party Wall.

---

## 📋 Table des matières

- [Général](#général)
- [Pour les organisateurs](#pour-les-organisateurs)
- [Pour les invités](#pour-les-invités)
- [Technique](#technique)
- [Sécurité et confidentialité](#sécurité-et-confidentialité)
- [Problèmes et dépannage](#problèmes-et-dépannage)

---

## 🌐 Général

### Qu'est-ce que Live Party Wall ?

Live Party Wall est une plateforme SaaS qui permet de créer un mur photo interactif en temps réel pour vos événements. Les invités peuvent partager leurs photos qui apparaissent instantanément sur grand écran, enrichies par l'intelligence artificielle.

### Pour quels types d'événements ?

Live Party Wall convient à tous types d'événements :
- 💍 Mariages
- 🎂 Anniversaires
- 🏢 Événements d'entreprise
- 🎊 Soirées privées
- 🤝 Team building
- 📊 Séminaires & Conférences

### Comment ça fonctionne ?

1. **L'organisateur** crée un événement et configure les paramètres
2. **Les invités** accèdent à l'événement via URL ou QR code
3. **Les invités** partagent leurs photos depuis leur smartphone
4. **Les photos** apparaissent instantanément sur le grand écran
5. **L'IA** génère des légendes personnalisées et modère le contenu

### Est-ce gratuit ?

Live Party Wall est open-source et gratuit. Vous devez cependant :
- Avoir un compte Supabase (gratuit disponible)
- Avoir une clé API Google Gemini (gratuite disponible)
- Héberger l'application (Vercel, Netlify, etc. - gratuit disponible)

### Puis-je l'utiliser sans connexion internet ?

Non, Live Party Wall nécessite une connexion internet pour :
- Synchroniser les photos en temps réel
- Utiliser l'IA pour les légendes et la modération
- Stocker les photos dans le cloud

---

## 🎛️ Pour les organisateurs

### Comment créer un événement ?

1. Connectez-vous avec vos identifiants admin
2. Cliquez sur **"Créer un événement"**
3. Remplissez le nom, le slug (URL unique) et la description
4. Cliquez sur **"Créer"**

Voir le [Guide Organisateur](./GUIDE_ORGANISATEUR.md) pour plus de détails.

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

### Comment fonctionne la modération IA ?

Live Party Wall utilise **Google Gemini** pour modérer automatiquement le contenu :
- ✅ **Toujours active** : La modération IA ne peut pas être désactivée
- 🛡️ **Détection de contenu inapproprié** : Images, textes, contexte
- ⚡ **Temps réel** : Vérification avant publication
- 🚫 **Rejet automatique** : Les contenus inappropriés sont rejetés

### Puis-je désactiver la modération IA ?

Non, la modération IA est toujours active pour garantir un contenu approprié. C'est une mesure de sécurité essentielle.

### Comment bloquer un invité ?

1. Allez dans **Dashboard > Modération**
2. Trouvez une photo de l'invité à bloquer
3. Cliquez sur **🚫 Bloquer l'invité**
4. L'invité ne pourra plus partager de photos (temporairement)

### Comment générer un aftermovie ?

1. Allez dans **Dashboard > Aftermovies**
2. Cliquez sur **"Créer un aftermovie"**
3. Sélectionnez les photos à inclure
4. Réorganisez les photos si nécessaire
5. Choisissez le preset (HD, Full HD, Story)
6. Personnalisez (durée, audio)
7. Cliquez sur **"Générer"**

Voir le [Guide Organisateur](./GUIDE_ORGANISATEUR.md) pour plus de détails.

### Les aftermovies sont-ils stockés indéfiniment ?

Oui, les aftermovies sont stockés dans Supabase Storage. Vous pouvez les supprimer manuellement si nécessaire.

### Comment créer une battle photo ?

1. Allez dans **Dashboard > Battles** ou **Contrôle mobile > Battles**
2. Cliquez sur **"Créer une battle"**
3. Sélectionnez deux photos
4. Cliquez sur **"Lancer la battle"**

Les invités pourront voter et les résultats seront affichés en temps réel.

### Puis-je gérer plusieurs événements ?

Oui ! Live Party Wall supporte la gestion de plusieurs événements simultanément. Utilisez le sélecteur d'événement en haut du dashboard pour basculer entre vos événements.

### Comment ajouter des organisateurs à mon équipe ?

1. Allez dans **Dashboard > Équipe**
2. Cliquez sur **"Ajouter un organisateur"**
3. Entrez l'email de la personne
4. Sélectionnez le rôle (Organizer ou Viewer)
5. Cliquez sur **"Inviter"**

### Quels sont les rôles disponibles ?

- **👑 Owner (Propriétaire)** : Accès complet, gestion d'équipe
- **🎛️ Organizer (Organisateur)** : Gestion quotidienne, pas de gestion d'équipe
- **👁️ Viewer (Observateur)** : Lecture seule, consultation des statistiques

---

## 👥 Pour les invités

### Dois-je créer un compte ?

Non ! Vous pouvez partager des photos sans compte. Cependant, créer un profil vous permet de :
- Voir vos statistiques personnelles
- Gagner des badges
- Apparaître dans les classements

### Comment partager une photo ?

1. Cliquez sur **"Partager une photo"** ou l'icône 📸
2. Choisissez votre source (caméra ou galerie)
3. La photo est automatiquement uploadée et apparaît sur le grand écran !

Voir le [Guide Invité](./GUIDE_INVITE.md) pour plus de détails.

### Puis-je modifier ou supprimer mes photos ?

Non, vous ne pouvez pas modifier ou supprimer vos photos après upload. Contactez l'organisateur si nécessaire.

### Pourquoi ma photo n'apparaît pas ?

Plusieurs raisons possibles :
- **Modération** : Votre photo a été rejetée par l'IA (contenu inapproprié)
- **Upload en cours** : Attendez quelques secondes
- **Connexion** : Vérifiez votre connexion internet

### Combien de photos puis-je partager ?

Il n'y a pas de limite ! Partagez autant de photos que vous voulez.

### Comment fonctionne la recherche "Retrouve-moi" ?

La recherche utilise la reconnaissance faciale (IA) pour trouver toutes les photos où vous apparaissez :

1. Cliquez sur **"Retrouve-moi"**
2. Prenez une photo de votre visage ou utilisez une photo existante
3. L'IA analyse et trouve toutes les photos où vous apparaissez

### Puis-je télécharger toutes les photos de l'événement ?

Oui ! Utilisez le mode sélection dans la galerie pour télécharger plusieurs photos en ZIP.

### Comment liker une photo ?

- **Sur une photo** : Cliquez sur le ❤️
- **Dans la galerie** : Double-cliquez sur une photo
- **Animation** : Un cœur animé apparaît pour confirmer votre like

### Comment ajouter une réaction ?

1. Cliquez sur l'icône **😊** sous une photo
2. Choisissez une réaction (❤️, 😂, 😢, 🔥, 😮, 👍)
3. Vous pouvez changer votre réaction à tout moment

### Comment voir mes statistiques ?

Accédez à votre profil pour voir :
- Nombre de photos partagées
- Likes et réactions reçus
- Badges obtenus
- Score de gamification
- Classement

### Comment gagner des badges ?

Participez activement à l'événement :
- Partagez des photos
- Likez et réagissez aux photos des autres
- Soyez régulier dans vos partages

Voir le [Guide Invité](./GUIDE_INVITE.md) pour la liste complète des badges.

### Les photos sont-elles stockées indéfiniment ?

Les photos sont stockées tant que l'événement est actif. L'organisateur peut archiver l'événement à tout moment.

---

## 🔧 Technique

### Quelles sont les technologies utilisées ?

- **Frontend** : React 19.2, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.1
- **Backend** : Supabase (PostgreSQL, Storage, Realtime, Auth)
- **IA** : Google Gemini 3 Flash
- **Animation** : Framer Motion 12.24

### Quelle est la taille maximale d'une photo ?

- **Photos** : 10MB maximum
- **Vidéos** : 20 secondes maximum, 50MB maximum
- **Compression automatique** : Les photos sont automatiquement compressées

### Quels formats de fichiers sont supportés ?

- **Photos** : JPG, JPEG, PNG, WebP
- **Vidéos** : MP4, WebM, MOV

### Comment fonctionne le temps réel ?

Live Party Wall utilise **Supabase Realtime** (WebSockets) pour synchroniser :
- Nouvelles photos
- Likes et réactions
- Paramètres
- Battles
- Statistiques

### Quelle connexion internet est nécessaire ?

- **Minimum** : 1 Mbps pour upload de photos
- **Recommandé** : 5 Mbps pour expérience optimale
- **Wi-Fi** : Recommandé pour les invités

### Puis-je utiliser Live Party Wall hors ligne ?

Non, Live Party Wall nécessite une connexion internet pour fonctionner.

### Comment fonctionne le cache ?

Live Party Wall utilise un Service Worker pour mettre en cache :
- Images déjà chargées
- Ressources statiques
- Support offline partiel (consultation des photos déjà chargées)

### Quelle est la limite de photos par événement ?

Il n'y a pas de limite technique. Pour les très grands événements (1000+ photos), la pagination est automatique.

---

## 🔒 Sécurité et confidentialité

### Mes données sont-elles sécurisées ?

Oui, Live Party Wall utilise :
- **HTTPS** : Toutes les communications sont chiffrées
- **Row Level Security (RLS)** : Sécurité au niveau des lignes dans Supabase
- **Authentification JWT** : Gestion sécurisée des sessions
- **Modération IA** : Filtrage automatique du contenu inapproprié

### Qui peut voir mes photos ?

- **Tous les invités** de l'événement peuvent voir les photos
- **L'organisateur** peut voir et modérer toutes les photos
- **Public** : Les photos sont publiques pour l'événement (pas d'accès externe)

### Puis-je supprimer mes données ?

Oui, vous pouvez :
- **Supprimer vos données locales** : Via la page "Gestion des données"
- **Demander la suppression** : Contactez l'organisateur
- **Révocation du consentement** : Retirez votre consentement à tout moment

### Comment fonctionne la conformité RGPD ?

Live Party Wall est 100% conforme au RGPD avec :
- **Banner de consentement** : Affichage automatique
- **4 catégories de cookies** : Essentiels, analytiques, marketing, fonctionnels
- **Politique de confidentialité** : Page dédiée accessible
- **Droits des utilisateurs** : Accès, portabilité, effacement, opposition
- **Gestion des données** : Page dédiée pour exercer ses droits

Voir la [Politique de confidentialité](../components/rgpd/PrivacyPolicy.tsx) pour plus de détails.

### Les photos sont-elles modérées ?

Oui, toutes les photos sont modérées automatiquement par l'IA avant publication. La modération IA est toujours active et ne peut pas être désactivée.

### Puis-je signaler une photo inappropriée ?

Contactez l'organisateur de l'événement. L'organisateur peut supprimer la photo via la modération.

---

## 🐛 Problèmes et dépannage

### Ma photo ne s'upload pas

Vérifiez :
1. **Connexion internet** : Assurez-vous d'avoir une connexion stable
2. **Taille du fichier** : Vérifiez que la photo fait moins de 10MB
3. **Format** : Vérifiez que le format est supporté (JPG, PNG, WebP)
4. **Modération** : Votre photo a peut-être été rejetée par l'IA

### Le mode projection ne fonctionne pas

Vérifiez :
1. **Navigateur** : Utilisez un navigateur moderne (Chrome, Firefox, Edge)
2. **Connexion** : Assurez-vous d'avoir une connexion internet stable
3. **Plein écran** : Appuyez sur F11 pour activer le plein écran
4. **Actualiser** : Rechargez la page si nécessaire

### Les photos ne s'affichent pas en temps réel

Vérifiez :
1. **Connexion** : Assurez-vous d'avoir une connexion internet stable
2. **WebSockets** : Vérifiez que les WebSockets ne sont pas bloqués
3. **Actualiser** : Rechargez la page si nécessaire

### L'aftermovie ne se génère pas

Vérifiez :
1. **Photos sélectionnées** : Assurez-vous d'avoir sélectionné au moins 2 photos
2. **Connexion** : Une connexion stable est nécessaire pour la génération
3. **Navigateur** : Utilisez un navigateur moderne
4. **Patience** : La génération peut prendre plusieurs minutes selon le nombre de photos

### Je ne peux pas me connecter en tant qu'organisateur

Vérifiez :
1. **Identifiants** : Vérifiez votre email et mot de passe
2. **Compte** : Assurez-vous que votre compte existe dans Supabase
3. **Rôle** : Vérifiez que vous avez le rôle d'organisateur pour l'événement

### La recherche "Retrouve-moi" ne fonctionne pas

Vérifiez :
1. **Caméra** : Autorisez l'accès à la caméra
2. **Photo claire** : Prenez une photo claire de votre visage
3. **Navigateur** : Utilisez un navigateur moderne
4. **Patience** : L'analyse peut prendre quelques secondes

### Les badges ne s'affichent pas

Les badges sont calculés en temps réel. Attendez quelques secondes après avoir partagé une photo ou reçu un like.

### Je ne peux pas télécharger les photos

Vérifiez :
1. **Connexion** : Assurez-vous d'avoir une connexion internet stable
2. **Navigateur** : Utilisez un navigateur moderne
3. **Permissions** : Vérifiez les permissions de téléchargement de votre navigateur

---

## 🆘 Support

### Où trouver de l'aide ?

- **Documentation** : Consultez les guides dans `/docs`
  - [Guide Organisateur](./GUIDE_ORGANISATEUR.md)
  - [Guide Invité](./GUIDE_INVITE.md)
- **GitHub** : Ouvrez une issue sur [GitHub](https://github.com/moonback/Live-Party-Wall-SAAS/issues)
- **Organisateur** : Contactez l'organisateur de l'événement

### Comment signaler un bug ?

Ouvrez une [issue](https://github.com/moonback/Live-Party-Wall-SAAS/issues) avec :
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Environnement (OS, navigateur, version)

### Comment proposer une fonctionnalité ?

Ouvrez une [issue](https://github.com/moonback/Live-Party-Wall-SAAS/issues) avec le label `enhancement` :
- Description détaillée
- Cas d'usage
- Bénéfices attendus

---

**Dernière mise à jour** : 2026-01-15

