Dossier Technique : Partywall

1.0 Introduction Générale

1.1 Contexte et Vision du Projet

Partywall se présente comme une plateforme SaaS (Software as a Service) innovante, conçue pour la création de murs photos interactifs en temps réel. La vision du projet est de transformer les événements en expériences mémorables et profondément engageantes en positionnant les invités comme les principaux créateurs de contenu. Cette interaction est amplifiée par une intégration poussée de l'intelligence artificielle, qui enrichit le contenu partagé et garantit sa pertinence. L'écosystème Partywall inclut également une application web dédiée à la commercialisation et à la gestion des accès, "Partywall License Flow", dont les spécificités sont intégrées à ce document. Ce dossier propose une analyse technique complète de l'architecture globale, de la stack technologique et des fonctionnalités qui constituent la plateforme Partywall.

2.0 Architecture Générale du Système

2.1 Vue d'Ensemble

L'architecture logicielle de Partywall a été stratégiquement conçue pour garantir la scalabilité, la sécurité et la maintenabilité requises par une plateforme SaaS moderne. Le système repose sur un modèle architectural SaaS multi-tenant, où chaque événement est géré comme une entité isolée, assurant ainsi la confidentialité et la séparation des données entre les différents clients.

L'écosystème applicatif est composé de plusieurs composants principaux qui interagissent pour fournir une expérience complète :

* Application Frontend (SPA React) : L'interface utilisateur principale, développée en tant qu'application monopage (Single Page Application), servant à la fois les invités partageant du contenu et les organisateurs gérant l'événement.
* Backend as a Service (Supabase) : Le cœur de l'infrastructure, fournissant la base de données, l'authentification des utilisateurs, les API REST et les fonctionnalités temps réel. Ce choix stratégique permet d'accélérer le cycle de développement en abstrayant l'infrastructure backend, autorisant ainsi l'équipe à se concentrer sur les fonctionnalités métier de l'application.
* Services d'Intelligence Artificielle : Intégration avec des API externes (Google Gemini) pour les fonctionnalités avancées de modération, de génération de légendes et d'amélioration d'images.
* Application Desktop (Electron) : Une version bureautique de l'application, encapsulant le frontend web pour offrir des fonctionnalités spécifiques à cet environnement.
* Plateforme de Licences (Partywall License Flow) : Une application web distincte, mais intégrée à l'écosystème, dédiée à la vente et à la gestion centralisée des licences logicielles.

2.2 Patterns Architecturaux Clés

Pour assurer la clarté, la maintenabilité et l'optimisation du code, l'architecture de Partywall s'appuie sur plusieurs patterns de conception éprouvés :

* Service Layer Pattern : La logique métier est systématiquement isolée dans une couche de services dédiée. Cette séparation des préoccupations rend le code plus modulaire, plus facile à tester et à maintenir, en décorrélant la logique applicative de l'interface utilisateur.
* Context API : L'état global de l'application est géré à l'aide de l'API Context de React. Ce pattern permet un partage de données propre et efficace entre les composants, sans avoir recours à des bibliothèques de gestion d'état plus complexes.
* Lazy Loading : Les composants et les ressources sont chargés à la demande (React.lazy()). Cette approche améliore significativement le temps de chargement initial de l'application en ne téléchargeant que le code nécessaire à la vue actuelle.
* Routing manuel : Le routage est géré de manière explicite via des paramètres d'URL (?mode=guest), un choix délibéré pour maintenir la simplicité et éviter la surcharge d'une bibliothèque de routage complète.

La section suivante détaille les technologies spécifiques qui ont été choisies pour implémenter cette architecture robuste et performante.

3.0 Stack Technologique Détaillée

3.1 Introduction à la Stack

La stack technologique de Partywall a été sélectionnée pour sa modernité, sa performance et sa capacité à évoluer. Elle repose sur un écosystème JavaScript/TypeScript complet, ce qui garantit une cohérence et une efficacité de développement sur l'ensemble des composants de la plateforme, du frontend au backend en passant par l'application de bureau.

3.2 Composants de la Stack

Frontend

Composant	Description
React	Bibliothèque JavaScript de pointe pour la construction d'interfaces utilisateur réactives et componentisées.
TypeScript	Sur-ensemble de JavaScript qui ajoute un typage statique, améliorant la robustesse et la maintenabilité du code.
Vite	Outil de build nouvelle génération offrant un serveur de développement extrêmement rapide et une optimisation de build pour la production.
Tailwind CSS	Framework CSS "utility-first" utilisé pour construire rapidement des designs personnalisés directement dans le balisage HTML.

Backend & Infrastructure

Composant	Description
Supabase	Plateforme Backend-as-a-Service (BaaS) qui fournit une suite complète d'outils sur une base open-source.
↳ PostgreSQL	Base de données relationnelle robuste et scalable, constituant le cœur du stockage de données.
↳ Authentification	Service intégré pour la gestion des utilisateurs (inscription, connexion) via email/mot de passe, basé sur JWT.
↳ Row Level Security (RLS)	Mécanisme de sécurité au niveau de la base de données pour définir des politiques d'accès granulaires par ligne.
↳ API REST	Génération automatique d'une API REST complète à partir du schéma de la base de données.
↳ Realtime	Service basé sur des WebSockets pour la synchronisation des données en temps réel entre les clients.

Intelligence Artificielle

Composant	Description
Google Gemini API	Intégration des modèles Gemini 3 Flash et Gemini 2.5 Flash pour la modération de contenu, la génération de légendes, la traduction et l'amélioration de la qualité des images.
Face-api.js	Bibliothèque JavaScript exécutée côté client pour la détection et la reconnaissance faciale, alimentant la fonctionnalité "Retrouve-moi".

Bibliothèques et Utilitaires Clés

Composant	Description
Electron	Framework pour la création d'applications de bureau multiplateformes avec des technologies web.
Framer Motion	Bibliothèque d'animation pour React, utilisée pour créer des transitions fluides et des micro-interactions.
@tanstack/react-virtual	Bibliothèque pour le rendu de listes et de grilles volumineuses (virtualisation), garantissant des performances élevées dans la galerie.
Lucide React	Collection d'icônes SVG légères et personnalisables.
jsPDF	Bibliothèque pour la génération de documents PDF côté client, utilisée pour les factures dans Partywall License Flow.
JSZip & File Saver	Combinaison pour créer, lire et modifier des fichiers .zip et déclencher leur téléchargement, utilisée pour l'export groupé de photos.
QRCode React	Composant React pour la génération de codes QR, utilisé pour le partage d'événements et d'aftermovies.
Zod	Bibliothèque de déclaration et de validation de schémas TypeScript, utilisée pour garantir la validité des données.

Cette combinaison de technologies permet de construire les fonctionnalités riches et interactives qui seront explorées dans la section suivante.

4.0 Analyse des Fonctionnalités et Système de Licences

4.1 Introduction aux Fonctionnalités

La valeur de Partywall réside dans son riche ensemble de fonctionnalités, conçues pour créer une expérience engageante tant pour les invités que pour les organisateurs. L'accès aux fonctionnalités les plus avancées, notamment celles basées sur l'intelligence artificielle, est régi par un système de licences flexible, permettant de segmenter l'offre en fonction des besoins des utilisateurs.

4.2 Fonctionnalités par Rôle

Pour les Invités

* Upload instantané : Partage de photos et vidéos courtes avec compression automatique.
* Mode collage : Assemblage de 2 à 4 photos dans des templates prédéfinis.
* Photobooth interactif : Capture de photos avec filtres et cadres décoratifs en temps réel.
* Likes & réactions : Interaction sociale avec 6 types d'émojis disponibles.
* Recherche IA "Retrouve-moi" : Recherche de photos personnelles via reconnaissance faciale.
* Téléchargement : Export des photos individuellement ou via une archive ZIP.
* Gamification avancée : Système de badges, de points et de classements pour stimuler la participation.
* Conformité RGPD : Gestion fine du consentement et des droits utilisateurs.

Pour les Organisateurs

* Dashboard temps réel : Suivi des statistiques de l'événement en direct (photos, likes, invités), propulsé par le service Realtime de Supabase.
* Multi-événements : Gestion de plusieurs événements depuis un seul compte.
* Modération IA : Filtrage automatique du contenu inapproprié.
* Personnalisation complète : Configuration des fonctionnalités, de l'apparence (logo, fond) et du comportement de l'IA.
* Mode projection : Interface optimisée pour l'affichage sur grand écran avec transitions automatiques.
* Battles photos : Création de duels de photos avec vote en direct du public.
* Aftermovie avancé : Génération de vidéos souvenirs (timelapse) avec de multiples options de personnalisation.
* Partage direct : Génération de QR code et de lien de téléchargement pour les aftermovies.
* Statistiques téléchargements : Suivi du nombre de téléchargements pour chaque aftermovie.
* Gestion d'équipe : Attribution de rôles (Owner, Organizer, Viewer) avec des permissions distinctes.

4.3 Le Système de Gamification

Pour encourager une participation active et ludique, Partywall intègre un système de gamification complet reposant sur trois piliers :

* Badges (12 types) : Des récompenses virtuelles sont attribuées pour des actions spécifiques. Exemples : Oiseau matinal (première photo postée), Star (photo la plus likée), Papillon social (plus de réactions variées), Viral (photo avec une croissance rapide de popularité).
* Système de points : Un score est calculé pour chaque invité en fonction de ses contributions : 10 points par photo postée, 5 points par like reçu, 3 points par réaction reçue, ainsi que des bonus pour la qualité et la variété.
* Milestones & Classements : La progression des utilisateurs est suivie via plus de 20 objectifs à atteindre. Un classement dynamique, mis à jour en temps réel grâce au service Realtime de Supabase, affiche le podium des participants les plus engagés.

4.4 Le Système de Licences

Le modèle économique de Partywall s'articule autour d'un système de licences qui segmente l'offre et contrôle l'accès aux fonctionnalités premium. Ces licences, dont les clés se terminent par un suffixe distinctif (PART ou PROS), sont générées et gérées via l'application dédiée "Partywall License Flow".

Caractéristique	Licence PART (Particulier)	Licence PROS (Professionnel)
Suffixe de la clé	Se termine par PART	Se termine par PROS
Limite d'événements	1 événement maximum	20 événements maximum
Accès aux fonctionnalités IA	🚫 Désactivé	✅ Activé (modération, légendes, traduction, tags)
Accès à "Retrouve-moi"	🚫 Désactivé	✅ Activé
Capture vidéo	🚫 Désactivé	✅ Activé
Aftermovies dans la galerie	🚫 Désactivé	✅ Activé
Génération des Aftermovies	Modes "Rapide" (720p) et "Standard" (1080p) disponibles.	Tous les modes disponibles : "Rapide", "Standard", "Qualité" (1080p • 20 Mbps), "Story" (9:16).
Amélioration IA Aftermovies	🚫 Désactivé	✅ Activé (sélection, transitions et durées intelligentes)

Note : En cas de licence invalide ou expirée, l'application affiche un écran de blocage avec la date d'expiration et des options pour réessayer la vérification ou se déconnecter.

La gestion de ces fonctionnalités et licences repose sur une structure de base de données robuste, détaillée dans la section suivante.

5.0 Architecture de la Base de Données (Supabase)

5.1 Structure et Schéma

La base de données PostgreSQL, gérée via la plateforme Supabase, constitue la fondation sur laquelle repose l'ensemble de l'application Partywall. Son architecture est conçue pour un modèle SaaS multi-tenant, où les données de chaque événement sont logiquement isolées pour garantir la sécurité et l'intégrité.

Table Principale	Description et Relations
events	Table centrale qui définit chaque événement. Reliée à presque toutes les autres tables.
photos	Stocke les métadonnées de chaque photo ou vidéo partagée. Reliée à events, guests, likes, reactions.
guests	Contient les informations sur les invités inscrits pour un événement spécifique. Reliée à events.
licenses	Gère les licences des utilisateurs, y compris leur type et leur date d'expiration. Reliée aux utilisateurs (auth.users).
event_organizers	Table de jonction qui associe des utilisateurs à des événements avec des rôles spécifiques. Reliée à events et auth.users.
event_settings	Stocke la configuration personnalisée pour chaque événement (relation 1-1 avec events).
aftermovies	Contient les informations sur les vidéos souvenirs générées pour un événement. Reliée à events.
photo_battles	Gère les duels de photos, leurs votes et leurs résultats. Reliée à events et photos.
likes	Enregistre les "likes" sur les photos. Reliée à photos.
reactions	Enregistre les réactions (émojis) sur les photos. Reliée à photos.
blocked_guests	Gère les invités temporairement bloqués par les organisateurs. Reliée à events.

5.2 Sécurité et Contrôle d'Accès

La sécurité des données est une priorité absolue dans une application SaaS multi-tenant. La stratégie de sécurité de Partywall s'appuie sur plusieurs couches de protection offertes par Supabase :

* Row Level Security (RLS) : Le RLS est activé sur toutes les tables de la base de données. C'est le principal mécanisme de sécurité, garantissant qu'un utilisateur ne peut accéder qu'aux données auxquelles il est explicitement autorisé.
* Politiques par Rôle : Des politiques de sécurité granulaires sont définies pour différents rôles d'utilisateurs (owner, organizer, viewer), limitant les opérations de lecture, d'écriture, de modification et de suppression en fonction des permissions de chaque rôle.
* Validation des Données : La validation est effectuée à la fois côté client (via des bibliothèques comme Zod) pour une meilleure expérience utilisateur, et côté serveur (via les contraintes de la base de données) pour garantir l'intégrité des données.

5.3 Gestion du Stockage (Storage Buckets)

Le stockage des fichiers (images, vidéos, avatars) est géré par le service Supabase Storage, qui organise les fichiers dans des conteneurs logiques appelés "buckets", chacun avec sa propre politique d'accès.

Bucket	Usage et Politique d'Accès
party-photos	Stockage des photos et vidéos des invités, ainsi que des aftermovies. Lecture publique. Upload public pour les photos des invités ; upload restreint aux administrateurs pour les aftermovies.
party-frames	Contient les cadres décoratifs pour le mode Photobooth. Lecture publique, upload restreint aux administrateurs.
party-avatars	Stocke les avatars des profils invités. Lecture publique, upload public pour les utilisateurs authentifiés.
party-backgrounds	Héberge les images de fond et les logos personnalisés pour les événements. Lecture publique, upload restreint aux administrateurs.

La section suivante fournit les instructions pratiques pour configurer un environnement de développement local basé sur cette architecture.

6.0 Guide d'Installation et de Déploiement

6.1 Préparation de l'Environnement

Cette section fournit un guide étape par étape pour configurer un environnement de développement local fonctionnel de la plateforme Partywall. Suivre ces instructions permettra de lancer l'application et de commencer à contribuer au projet.

Prérequis

Avant de commencer, assurez-vous que les outils suivants sont installés sur votre machine :

* Node.js (version 18.0.0 ou supérieure)
* npm (inclus avec Node.js)
* Git
* Un compte Supabase (un compte gratuit est suffisant pour démarrer)
* Une clé API pour Google Gemini

6.2 Configuration du Projet

1. Clonage du Dépôt Clonez le code source du projet depuis son dépôt Git sur votre machine locale.
2. Installation des Dépendances Naviguez jusqu'au répertoire racine du projet cloné et exécutez la commande suivante pour installer toutes les bibliothèques nécessaires :
3. Configuration des Variables d'Environnement Créez un fichier nommé .env à la racine du projet et ajoutez les variables suivantes. Les valeurs pour Supabase se trouvent dans les paramètres de votre projet (Settings > API).

Variable	Description	Requis
VITE_SUPABASE_URL	L'URL de votre projet Supabase.	✅ Oui
VITE_SUPABASE_ANON_KEY	La clé publique anonyme (anon public key) de votre projet Supabase.	✅ Oui
VITE_GEMINI_API_KEY	Votre clé API personnelle pour accéder aux services de Google Gemini.	✅ Oui

1. Configuration de la Base de Données Supabase
  * Accédez à l'éditeur SQL (SQL Editor) dans le tableau de bord de votre projet Supabase.
  * Exécutez le contenu du script supabase/supabase_complete_setup.sql. Ce script crée toutes les tables, les politiques RLS, les index et les buckets de stockage.
  * Exécutez ensuite le contenu du script supabase/supabase_licenses_setup.sql pour initialiser le système de licences.
  * Activez la fonctionnalité Realtime en allant dans Database > Replication. Activez la réplication pour les tables suivantes : photos, likes, reactions, event_settings, guests, photo_battles, aftermovies, event_organizers, licenses.

6.3 Lancement de l'Application

* Mode Développement (Web & Electron) Pour lancer l'application web en mode développement avec rechargement à chaud :
* L'application sera accessible à l'adresse http://localhost:3000.
* Pour lancer la version de bureau :
* Build de Production (Web & Electron) Pour créer une version optimisée de l'application web pour le déploiement :
* Les fichiers de sortie seront générés dans le dossier dist/.
* Pour créer les installateurs de l'application de bureau :
* Les fichiers de distribution seront générés dans le dossier release/.
* Prévisualisation du build de production Pour tester localement le build de production avant déploiement :

La section finale de ce document fournit des directives pour les développeurs souhaitant contribuer au projet de manière cohérente et sécurisée.

7.0 Guide de Contribution et Bonnes Pratiques

7.1 Introduction à la Contribution

Les contributions au projet Partywall sont les bienvenues. Pour maintenir un haut niveau de qualité, de cohérence et de maintenabilité du code, il est essentiel que tous les contributeurs respectent les conventions et les bonnes pratiques établies, détaillées ci-dessous.

7.2 Conventions de Code

* Structure du code : Utiliser des composants fonctionnels React avec des Hooks. Isoler la logique métier dans des services dédiés.
* Typage : Appliquer un typage strict avec TypeScript. L'usage du type any doit être évité autant que possible au profit de types plus spécifiques.
* Nommage : Suivre les conventions standards : PascalCase pour les composants et les types, et camelCase pour les fonctions, variables et hooks.
* Organisation des fichiers : Respecter l'arborescence du projet, en plaçant les composants dans le dossier components/, les vues de page dans views/, et la logique métier dans lib/.

7.3 Workflow Git

Le processus de contribution via Git est standardisé pour garantir une intégration fluide des nouvelles fonctionnalités et des correctifs :

1. Créer une nouvelle branche de fonctionnalité à partir de la branche main.
2. Effectuer des commits atomiques et réguliers avec des messages clairs.
3. Pousser la branche sur le dépôt distant.
4. Ouvrir une Pull Request en décrivant les changements apportés pour initier le processus de revue de code.

7.4 Sécurité et Conformité RGPD

La plateforme est conçue pour être conforme au Règlement Général sur la Protection des Données (RGPD). Les contributeurs doivent maintenir cette conformité en respectant les points suivants :

* Gestion du consentement des cookies : La bannière de consentement doit permettre aux utilisateurs de personnaliser leurs préférences pour les cookies non essentiels.
* Politique de confidentialité : Toutes les informations relatives à la collecte et à l'utilisation des données doivent être clairement documentées et accessibles.
* Droits des utilisateurs : L'application doit fournir des mécanismes permettant aux utilisateurs d'exercer leurs droits fondamentaux. Les implémentations techniques incluent l'export des données en JSON (portabilité) et des fonctions pour l'effacement complet.
* Versioning du consentement : Le système doit suivre les versions de la politique de confidentialité acceptées par l'utilisateur pour garantir une traçabilité rigoureuse.

8.0 Conclusion

L'architecture de Partywall constitue une fondation technique robuste et moderne. En s'appuyant sur une stack éprouvée (React, TypeScript) et une plateforme BaaS performante comme Supabase, le projet garantit à la fois une scalabilité, une sécurité et une maintenabilité élevées. L'intégration stratégique de services d'intelligence artificielle, couplée à un design applicatif centré sur l'expérience utilisateur et la conformité réglementaire, positionne Partywall comme une solution SaaS complète et pérenne pour le marché de l'événementiel interactif.
