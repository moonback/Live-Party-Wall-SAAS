### Dossier Technique : Application Live Party Wall

##### **Version :**  1.0

##### **Date :**  24 mai 2024

##### **Audience :**  Développeurs, Architectes Logiciels, Chefs de Projet

#### 1.0 Introduction et Vision du Projet

L'application  **Live Party Wall**  est une solution web en temps réel conçue pour transformer l'animation d'événements. Son objectif principal est de créer un mur de souvenirs interactif et collectif en permettant aux invités de partager instantanément leurs photos sur un grand écran. Le différenciateur clé du projet réside dans son intégration native d'une intelligence artificielle (Google Gemini) qui automatise des processus cruciaux tels que la modération de contenu, l'amélioration de la qualité visuelle et la génération de légendes créatives, garantissant ainsi une expérience fluide, sécurisée et engageante.Ce dossier technique est destiné à une audience technique, incluant les développeurs, architectes et chefs de projet. Il a pour but de détailler l'architecture fonctionnelle et technique de l'application, de justifier les choix technologiques et de fournir les procédures complètes d'installation et de configuration de l'environnement de développement.Nous allons maintenant analyser les différentes facettes de l'application, en commençant par son architecture fonctionnelle et l'expérience utilisateur qu'elle propose.

#### 2.0 Architecture Fonctionnelle et Rôles Utilisateurs

La compréhension de l'architecture fonctionnelle de Live Party Wall est essentielle pour saisir les choix techniques qui en découlent. La structure de l'application est organisée autour de trois interfaces ou "modes" distincts, chacun étant méticuleusement conçu pour répondre aux besoins d'un type d'utilisateur spécifique. Sur le plan technique, chaque mode correspond à un point d'entrée de l'application, piloté par un paramètre d'URL (/?mode=guest, /?mode=wall, /?mode=admin), ce qui permet une séparation claire des logiques d'affichage et de fonctionnement.

##### 2.1 Interface Invité (Web Mobile)

L'interface destinée aux invités est optimisée pour le mobile et vise à maximiser l'engagement par une simplicité d'utilisation exemplaire. Elle transforme chaque participant en un créateur de contenu actif.

* **Capture et Création :**  
* **Upload Simplifié :**  Permet une prise de photo directe via la caméra du smartphone ou un import depuis la galerie, éliminant toute friction.  
* **Mode Collage :**  Offre la possibilité d'assembler de 2 à 4 photos via 6 templates prédéfinis (ex: 2x2, 1+3, 3+1), permettant de raconter de mini-histoires visuelles.  
* **Zoom Caméra Avancé :**  Intègre des contrôles précis comme le "pinch-to-zoom" pour un cadrage parfait.  
* **Résolution Adaptative :**  Détecte et utilise automatiquement la meilleure résolution de caméra disponible pour garantir des clichés de haute qualité.  
* **Enrichissement par l'IA :**  
* **Amélioration d'Image :**  Applique automatiquement des filtres et des ajustements pour optimiser la qualité visuelle de chaque cliché.  
* **Génération de Légendes :**  Utilise l'IA pour créer des légendes amusantes et contextuelles, ajoutant une touche de surprise et d'humour.  
* **Modération Préventive :**  Analyse chaque image avant sa publication pour détecter et bloquer tout contenu inapproprié.  
* **Interaction et Gamification :**  
* **Galerie Interactive :**  Permet de visualiser toutes les photos partagées et d'interagir via un système de "likes".  
* **Système de Badges :**  Récompense les utilisateurs les plus actifs avec des distinctions (ex: "Photographe de la soirée", "Star du mur") pour encourager la participation.  
* **Classement en Temps Réel :**  Affiche un leaderboard basé sur le nombre de photos et de "likes", stimulant une compétition amicale.  
* **Personnalisation et Feedback :**  
* **Cadres Décoratifs :**  Applique automatiquement des cadres thématiques (ex: Polaroid) pour renforcer l'identité visuelle de l'événement.  
* **Notifications de Suivi :**  Fournit un feedback immédiat via des notifications "toast" pour confirmer le succès de chaque envoi.

##### 2.2 Interface Mur (Grand Écran)

Le "Mur" est le point focal visuel de l'événement, projeté sur grand écran. Cette interface est conçue pour être dynamique, esthétique et entièrement automatisée.

* **Affichage Dynamique :**  
* **Temps Réel :**  Les nouvelles photos apparaissent instantanément grâce à une communication via websockets (Supabase Realtime), créant un effet "wow".  
* **Mode Maçonnerie (Masonry) :**  Organise les photos dans une grille dynamique et esthétique qui s'adapte à tous les formats. L'utilisation de la virtualisation (@tanstack/react-virtual) garantit des performances fluides même avec un grand volume d'images.  
* **Auto-Scroll Intelligent :**  Fait défiler le contenu de manière continue et infinie, assurant que le mur reste animé sans aucune intervention manuelle.  
* **Modes Immersifs :**  
* **Mode Projection :**  Propose un diaporama plein écran avec des transitions professionnelles (fondu, zoom, glissement, flou) pour mettre en valeur les photos lors des moments clés.  
* **Effets Visuels :**  Ajoute des animations subtiles, comme des particules en arrière-plan, pour enrichir l'expérience visuelle et créer une ambiance immersive.  
* **Accessibilité et Contrôle :**  
* **QR Code Dynamique :**  Génère et affiche un QR code en permanence, via la bibliothèque QRCode React, pour permettre aux invités de rejoindre l'expérience de manière simple et rapide.  
* **Configuration en Direct :**  Permet à l'administrateur de personnaliser le titre de l'événement, la vitesse de défilement et les types de transitions en temps réel.

##### 2.3 Interface d'Administration

L'interface d'administration est un tableau de bord complet qui donne à l'organisateur un contrôle total sur le déroulement de l'animation.

* **Contrôle et Modération :**  
* **Dashboard de Modération :**  Offre une vue d'ensemble de toutes les soumissions et permet la suppression de tout contenu indésirable en un seul clic.  
* **Authentification Sécurisée :**  L'accès à cette interface est protégé par un système d'authentification robuste (Supabase Auth).  
* **Personnalisation de l'Événement :**  
* **Configuration Globale :**  Permet de définir le titre et le sous-titre de l'événement.  
* **Activation de Fonctionnalités :**  Offre la possibilité d'activer ou de désactiver des modules spécifiques comme le mode Collage, la capture vidéo ou la modération par IA, pour adapter l'expérience au ton de l'événement.  
* **Gestion des Cadres :**  Permet de téléverser et de gérer des cadres décoratifs personnalisés pour une intégration parfaite avec l'image de marque.  
* **Analyse et Export :**  
* **Statistiques en Temps Réel :**  Fournit des indicateurs clés sur l'engagement, tels que le nombre total de photos, les pics d'activité et le classement des participants.  
* **Export des Souvenirs :**  Propose une fonctionnalité pour télécharger l'intégralité des photos et de leurs métadonnées dans une seule archive ZIP, une opération rendue possible côté client par les bibliothèques JSZip et File Saver.Cette riche architecture fonctionnelle repose sur une stack technique moderne et cohérente, que nous allons maintenant détailler.

#### 3.0 Architecture Technique et Stack Technologique

Les choix technologiques de Live Party Wall ont été guidés par des impératifs de robustesse, de performance en temps réel et d'évolutivité. L'architecture s'appuie sur un écosystème JavaScript moderne pour le front-end et sur un Backend-as-a-Service (BaaS) puissant pour l'infrastructure, ce qui permet de se concentrer sur la valeur fonctionnelle tout en garantissant une fondation technique solide.Le tableau ci-dessous synthétise la stack technologique du projet.| Composant | Technologie | Rôle et Justification || \------ | \------ | \------ || **Frontend** | React 19.2, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.1 | Crée les interfaces utilisateur réactives et robustes en s'appuyant sur des fonctionnalités avancées comme les Hooks, Suspense et Lazy Loading. Vite assure un développement rapide, tandis que TypeScript garantit la sécurité de typage. || **Backend & Infra** | Supabase (PostgreSQL, Storage, Realtime, Auth) | Sert de Backend-as-a-Service, gérant la base de données relationnelle, le stockage de fichiers, l'authentification des administrateurs et la communication temps réel via websockets. || **Intelligence Artificielle** | Google Gemini 3 Flash | Agit comme le moteur multimodal pour l'analyse d'images, la modération de contenu, l'amélioration visuelle et la génération de légendes contextuelles. || **Bibliothèques Clés** | JSZip, File Saver, QRCode React, @tanstack/react-virtual | Fournissent des fonctionnalités spécifiques : génération d'archives ZIP pour l'export, téléchargement côté client, affichage de QR codes et virtualisation pour l'affichage performant de longues listes de photos. |  
Explorons maintenant plus en profondeur le cœur de l'infrastructure backend, Supabase.

#### 4.0 Infrastructure Backend : Focus sur Supabase

Supabase est la pierre angulaire de l'infrastructure de Live Party Wall. En tant que solution Backend-as-a-Service (BaaS) open source, elle fournit l'ensemble des services nécessaires à l'application, de la persistance des données à la communication en temps réel, en passant par la sécurité. Cette section détaille l'utilisation de chaque composant majeur de Supabase au sein du projet.

##### 4.1 Base de Données (PostgreSQL) et Schéma

Le système s'appuie sur une base de données relationnelle  **PostgreSQL**  gérée par Supabase. Le schéma est conçu pour être simple et efficace, articulé autour des tables principales suivantes :

* **photos**  : Stocke les métadonnées de chaque photo envoyée, incluant l'URL de l'image, la légende, l'auteur et les timestamps.  
* **likes**  : Gère les interactions de type "like" sur les photos, liant un utilisateur à une photo.  
* **event\_settings**  : Contient les paramètres de configuration de l'événement, tels que le titre, l'état d'activation des fonctionnalités (collage, vidéo), etc.

##### 4.2 Stockage de Fichiers (Storage)

**Supabase Storage**  est utilisé pour le stockage de tous les objets binaires. Deux buckets distincts sont configurés pour une gestion claire des ressources :

* **party-photos**  : Contient toutes les images et les collages envoyés par les invités.  
* **party-frames**  : Stocke les fichiers image des cadres décoratifs personnalisés que l'administrateur peut téléverser.

##### 4.3 Mises à Jour en Temps Réel (Realtime)

Le service  **Supabase Realtime**  est fondamental pour la fonctionnalité principale du "Mur". Basé sur des websockets, il permet de diffuser les changements de la base de données aux clients connectés. L'application écoute les insertions sur les tables photos et les modifications sur la table likes, ce qui permet aux nouvelles photos et aux compteurs de "likes" d'apparaître instantanément sur le grand écran sans nécessiter de rechargement de la page.

##### 4.4 Authentification et Sécurité (Auth & RLS)

**Supabase Auth**  est utilisé pour sécuriser l'accès à l'interface d'administration. Il gère l'authentification des utilisateurs et la gestion des sessions, garantissant que seuls les organisateurs autorisés peuvent accéder au tableau de bord. La sécurité des données est renforcée par la mise en place de politiques de  **Row Level Security (RLS)**  sur toutes les tables. Ces règles garantissent que les utilisateurs ne peuvent accéder ou modifier que les données explicitement autorisées par leur rôle, protégeant ainsi l'intégrité de la base de données au niveau le plus bas.Au-delà de cette infrastructure robuste, la véritable innovation de l'application réside dans son intégration de l'intelligence artificielle.

#### 5.0 Implémentation de l'Intelligence Artificielle avec Google Gemini

L'intégration de l'intelligence artificielle est le principal différenciateur technique et fonctionnel de Live Party Wall. L'application utilise le modèle multimodal  **Google Gemini 3 Flash**  pour automatiser des tâches complexes qui, autrement, nécessiteraient une intervention manuelle ou seraient impossibles à réaliser à grande échelle. L'IA agit comme un co-pilote invisible qui enrichit l'expérience utilisateur tout en assurant la sécurité du contenu.Les trois missions principales confiées à l'IA sont les suivantes :

1. **Modération Automatique et Préventive**  Le modèle Gemini analyse chaque image soumise avant sa publication sur le mur. Il est entraîné à détecter un large éventail de contenus inappropriés. Ce processus agit comme un filtre préventif, garantissant la sécurité et la sérénité de l'événement sans nécessiter une surveillance manuelle constante de la part de l'organisateur.  
2. **Analyse et Amélioration d'Image**  L'IA évalue chaque cliché pour en comprendre le contenu et la qualité. Elle effectue une analyse multi-facettes incluant la  **détection de visages** , l'évaluation de la  **qualité**  (luminosité, contraste) et la  **suggestion de filtres**  pertinents. Ce traitement garantit un rendu visuel de haute qualité et homogène sur le mur, sublimant les contributions des invités.  
3. **Génération de Contenu Créatif**  En analysant le contenu visuel de la photo, Gemini génère automatiquement des légendes amusantes, pertinentes et contextuelles. Cette fonctionnalité ajoute une dimension de divertissement et de surprise, transformant chaque publication en un mini-moment engageant pour tous les participants.La combinaison d'une infrastructure solide et d'une IA intelligente est complétée par des mesures de sécurité rigoureuses à tous les niveaux de l'application.

#### 6.0 Procédures de Sécurité

La sécurité est une préoccupation majeure pour une application événementielle gérant du contenu généré par les utilisateurs. Live Party Wall intègre une approche de sécurité multi-couches pour protéger à la fois l'application, ses données et l'expérience des participants.

* **Row Level Security (RLS) :**  Comme mentionné précédemment, toutes les tables de la base de données Supabase sont protégées par des politiques RLS strictes. C'est la défense la plus fondamentale, garantissant que les requêtes ne peuvent accéder qu'aux données autorisées, même en cas de faille applicative.  
* **Authentification Admin :**  L'accès au panneau d'administration est strictement contrôlé par Supabase Auth, qui gère l'authentification et les sessions des organisateurs.  
* **Modération par IA :**  L'analyse préventive des images par Google Gemini constitue la première ligne de défense active contre la publication de contenu inapproprié.  
* **Validation Côté Client :**  Des validations sont mises en place sur le front-end pour contrôler les types de fichiers, leur taille et les entrées utilisateur avant même leur envoi au serveur.  
* **Sanitization des Entrées :**  Toutes les entrées utilisateur affichées dans l'application sont systématiquement nettoyées pour prévenir les attaques de type Cross-Site Scripting (XSS).La section suivante fournit des instructions pratiques pour mettre en place l'environnement de développement et lancer l'application localement.

#### 7.0 Guide d'Installation et de Configuration

Cette section fournit les instructions étape par étape nécessaires pour cloner, configurer et lancer l'application Live Party Wall dans un environnement de développement local.

##### 7.1 Prérequis

Avant de commencer, assurez-vous que les outils suivants sont installés sur votre machine :

* **Node.js**  (version 18 ou supérieure)  
* Un compte  **Supabase**  (le plan gratuit est suffisant)  
* Une clé API  **Google AI Studio**  pour l'accès à Gemini  
* **Git**  pour cloner le dépôt du code source

##### 7.2 Configuration de l'Environnement

1. Clonez le projet depuis son dépôt Git.  
2. À la racine du projet cloné, créez un fichier nommé .env.  
3. Remplissez ce fichier avec les variables d'environnement requises, comme décrit dans le tableau ci-dessous :| Variable | Description | Requis || \------ | \------ | \------ || VITE\_SUPABASE\_URL | URL de votre projet Supabase | ✅ Oui || VITE\_SUPABASE\_ANON\_KEY | Clé anonyme (publique) de votre projet Supabase | ✅ Oui || GEMINI\_API\_KEY | Votre clé API Google Gemini | ✅ Oui |

**Note de sécurité :**  Le fichier .env contient des informations sensibles et ne doit jamais être versionné dans Git. Il est déjà inclus dans le fichier .gitignore du projet pour prévenir toute erreur de manipulation.

##### 7.3 Initialisation de la Base de Données Supabase

Pour que l'application fonctionne correctement, la base de données et le stockage Supabase doivent être initialisés. Rendez-vous dans l' **éditeur SQL**  de votre projet Supabase et exécutez les scripts SQL fournis dans le dépôt, en respectant scrupuleusement l'ordre suivant :

1. supabase\_setup.sql  
2. supabase\_admin\_setup.sql  
3. supabase\_likes\_setup.sql  
4. supabase\_settings\_setup.sql  
5. supabase\_migration\_frames.sql  
6. supabase\_video\_capture\_setting\_migration.sql  
7. supabase\_collage\_mode\_setting\_migration.sql**Important :**  Après avoir exécuté les scripts, vous devez activer manuellement la diffusion en temps réel. Allez dans Database \> Replication dans votre dashboard Supabase et activez la réplication pour les tables photos et likes.

##### 7.4 Configuration de l'Authentification Admin

Pour accéder à l'interface d'administration, un compte utilisateur doit être créé.

1. Rendez-vous sur votre  **Dashboard Supabase \> Authentication \> Users** .  
2. Cliquez sur  **"Invite user"**  ou  **"Add user"**  pour créer un compte administrateur avec une adresse e-mail et un mot de passe.  
3. (Optionnel mais recommandé) Pour renforcer la sécurité, désactivez l'inscription publique en allant dans  **Authentication \> Settings \> Auth Providers**  et en désactivant le fournisseur Email.

##### 7.5 Commandes de Lancement

Une fois l'environnement configuré, vous pouvez utiliser les commandes npm suivantes depuis le terminal à la racine du projet :| Commande | Description || \------ | \------ || npm run dev | Lance le serveur de développement avec rechargement à chaud (HMR). || npm run build | Compile et optimise l'application pour un déploiement en production. || npm run preview | Permet de prévisualiser localement la version de production après un build. |  
Ces instructions permettent à un développeur de prendre en main le projet et de lancer un environnement de développement fonctionnel rapidement.

#### 8.0 Conclusion et Perspectives

Live Party Wall est une application techniquement aboutie qui démontre une synergie réussie entre une stack front-end moderne et réactive (React/Vite), un backend BaaS puissant et scalable (Supabase), et une intégration d'intelligence artificielle (Google Gemini) qui apporte une valeur ajoutée significative. L'architecture est conçue pour la performance en temps réel, la sécurité et la facilité de maintenance.Le projet identifie également des limitations actuelles, telles que l'absence d'un mode PWA (Progressive Web App) pour une utilisation hors ligne et une bascule de caméra non native sur mobile. Ces points, ainsi que d'autres améliorations futures, sont documentés dans le fichier ROADMAP.md, ce qui témoigne de la maturité du projet et de sa vision à long terme.En conclusion, Live Party Wall se positionne comme une solution techniquement solide et innovante, prête à être évaluée, déployée ou enrichie par de nouvelles contributions.  
