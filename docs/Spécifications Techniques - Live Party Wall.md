Spécifications Techniques - Live Party Wall

1. Introduction Générale

1.1. Contexte et Objectifs du Document

Ce document constitue la spécification technique de référence pour l'application SaaS (Software-as-a-Service) "Live Party Wall". Son objectif principal est de servir de plan directeur pour les équipes de développement actuelles et futures, en détaillant de manière exhaustive l'architecture, les fonctionnalités et les choix technologiques qui sous-tendent le projet. Il est destiné à un public technique, incluant les développeurs, les architectes logiciels et les éventuels repreneurs techniques, afin d'assurer une compréhension commune et de faciliter la maintenance et l'évolution de la plateforme.

Ce document commence par présenter la vision globale du produit avant de plonger dans les détails de son architecture logicielle.

1.2. Vision du Produit

La vision de Live Party Wall est de transformer chaque événement, qu'il soit privé ou professionnel, en une expérience interactive et mémorable. L'objectif est de briser les barrières traditionnelles en faisant des invités les principaux créateurs de contenu. En permettant un partage instantané et ludique de photos et de vidéos sur un grand écran commun, l'application crée une animation collective et engageante qui capture l'authenticité de l'instant. Les cas d'usage clés incluent les mariages, les événements d'entreprise, les anniversaires, les soirées privées, les séminaires et les conférences, où l'engagement des participants est essentiel.

L'analyse de l'architecture logicielle qui suit détaille comment cette vision est techniquement mise en œuvre.

2. Architecture Logicielle et Patterns

2.1. Vue d'Ensemble de l'Architecture

La définition d'une architecture logicielle claire est fondamentale pour garantir la maintenabilité, la robustesse et la scalabilité du projet. Live Party Wall est conçu comme une application web SaaS multi-tenant, capable de gérer de multiples événements simultanément de manière isolée et sécurisée.

L'architecture s'articule autour de deux composants principaux :

* Un frontend moderne développé comme une Single Page Application (SPA) avec React, garantissant une expérience utilisateur fluide et réactive.
* Un backend qui s'appuie sur une approche Backend-as-a-Service (BaaS) fournie par la plateforme Supabase.

Justification Architecturale : Cette architecture découplée a été choisie pour maximiser la vélocité de développement. En s'appuyant sur l'infrastructure managée de Supabase pour les services backend fondamentaux (base de données, authentification, stockage, temps réel), l'équipe de développement peut concentrer ses ressources sur la construction d'une expérience frontend hautement interactive et riche en fonctionnalités, ce qui constitue la principale proposition de valeur de l'application. Cette approche simplifie également la mise à l'échelle et réduit la charge opérationnelle.

Cette structure est soutenue par des patterns de conception spécifiques qui assurent la cohérence et la qualité du code.

2.2. Patterns de Conception Implémentés

Plusieurs patterns architecturaux ont été implémentés pour structurer le code de manière efficace et maintenable.

* Service Layer Pattern
  * Ce pattern isole toute la logique métier et les interactions avec les API externes dans des modules dédiés, situés dans le répertoire /services. Cela garantit que les composants de présentation sont découplés de la logique métier et des préoccupations de récupération de données, les rendant hautement réutilisables, testables et uniquement responsables du rendu de l'interface utilisateur en fonction des props fournies.
* Context API pour l'État Global
  * La gestion de l'état global de l'application est assurée par l'API Context de React, évitant ainsi le "prop drilling" et centralisant l'état partagé. Les contextes suivants sont utilisés :
    * EventContext: Gère les informations de l'événement en cours, assurant le fonctionnement multi-tenant.
    * PhotosContext: Maintient la liste des photos et gère les abonnements aux mises à jour en temps réel.
    * SettingsContext: Contient l'ensemble des paramètres de configuration spécifiques à l'événement.
    * AuthContext: Gère l'état d'authentification des organisateurs.
    * ToastContext: Permet d'afficher des notifications (toasts) à l'utilisateur de manière globale.
* Lazy Loading
  * Afin d'optimiser le temps de chargement initial et d'améliorer les performances perçues, tous les composants principaux de l'application sont chargés de manière différée (lazy-loaded). Le code d'un composant n'est téléchargé que lorsqu'il est sur le point d'être affiché à l'écran.
* Routing Manuel
  * Justification : La décision de renoncer à une bibliothèque dédiée comme React Router au profit d'un routage manuel par paramètres d'URL (?mode=guest, ?mode=wall) a été délibérée. Compte tenu de la nature mono-vue et multi-modale de l'application, cette méthode évite la surcharge d'une solution de routage complète, réduit la taille du bundle et simplifie la gestion de l'état lié au mode d'affichage. Le compromis est une structure d'URL moins conventionnelle, ce qui est acceptable pour le cas d'usage de cette application.

La stack technologique qui supporte cette architecture est détaillée dans la section suivante.

3. Stack Technologique Complète

3.1. Technologies Frontend

Le choix d'une stack frontend moderne et performante est crucial pour offrir une expérience utilisateur fluide, interactive et visuellement attrayante. Les technologies sélectionnées forment un écosystème cohérent et éprouvé pour le développement d'applications web réactives.

Technologie	Version	Rôle et Justification
React	19.2	Bibliothèque principale pour la construction de l'interface utilisateur. Son modèle à base de composants et ses Hooks permettent une gestion déclarative et efficace de l'état.
TypeScript	5.8	Sursouche de JavaScript qui ajoute un typage statique strict, améliorant la robustesse du code, la maintenabilité à long terme et l'expérience de développement.
Vite	6.2	Outil de build nouvelle génération qui offre un serveur de développement extrêmement rapide avec Hot Module Replacement (HMR) et un build optimisé pour la production.
Tailwind CSS	4.1	Framework CSS "utility-first" permettant de construire des designs personnalisés rapidement et de manière cohérente directement dans le balisage, sans quitter le contexte du composant.
Framer Motion	12.24	Pilote les animations fluides de l'application, comme "l'explosion" des nouvelles photos sur le mur, qui sont essentielles à l'aspect "live" et engageant du produit.
Lucide React	0.562	Collection d'icônes SVG légères et cohérentes, garantissant une clarté visuelle à travers l'ensemble de l'interface.

Cette interface utilisateur riche communique avec une infrastructure backend robuste et intégrée.

3.2. Backend, Infrastructure et Services IA

L'infrastructure backend repose sur Supabase, une plateforme Backend-as-a-Service qui constitue la pierre angulaire de l'application. Elle fournit une solution tout-en-un pour la base de données, l'authentification, le stockage de fichiers et les fonctionnalités temps réel. Pour les capacités d'intelligence artificielle, l'application s'intègre avec l'API de Google Gemini, ajoutant une couche d'intelligence unique au traitement du contenu.

* Infrastructure Supabase (Backend-as-a-Service)
  * PostgreSQL: Une base de données relationnelle open-source robuste, utilisée comme source de vérité pour toutes les données de l'application. La sécurité est renforcée par l'utilisation intensive des politiques de Row Level Security (RLS).
  * Storage: Service de stockage d'objets utilisé pour héberger tous les fichiers binaires, tels que les photos et vidéos envoyées par les invités, les cadres décoratifs et les avatars des utilisateurs.
  * Realtime: Un service basé sur WebSockets qui permet une synchronisation des données en temps réel entre les clients. Il est utilisé pour propager instantanément les nouvelles photos, les likes et les changements de configuration.
  * Auth: Système d'authentification complet gérant les comptes des organisateurs via un mécanisme de JWT (JSON Web Tokens) basé sur email et mot de passe.
* Intelligence Artificielle (Google Gemini 3 Flash)
  * Modération de contenu: Analyse automatique des images pour détecter et bloquer tout contenu inapproprié (NSFW).
  * Génération de légendes: Création de légendes contextuelles et créatives pour les photos, adaptées au type d'événement (mariage, entreprise, etc.).
  * Analyse de qualité: Évaluation de la qualité des images soumises, avec possibilité d'amélioration automatique.
  * Création de tags sémantiques: Génération de mots-clés pertinents décrivant le contenu de l'image pour faciliter la recherche et la catégorisation.

Ces technologies de base sont complétées par un ensemble d'outils et de bibliothèques tierces.

3.3. Outils et Bibliothèques Complémentaires

Cet inventaire regroupe les bibliothèques tierces essentielles qui complètent la stack principale en apportant des fonctionnalités spécifiques et ciblées.

* JSZip (3.10): Permet de créer des archives ZIP côté client, une fonctionnalité cruciale pour l'export et le téléchargement groupé de toutes les photos d'un événement.
* File Saver (2.0): Facilite le déclenchement du téléchargement de fichiers (comme les archives ZIP ou les photos individuelles) directement depuis le navigateur de l'utilisateur.
* QRCode React (4.2): Composant React pour générer des QR codes de manière simple et efficace, utilisé notamment pour le partage de liens de téléchargement.
* Face-api.js (0.22): Bibliothèque de reconnaissance faciale en JavaScript qui fonctionne directement dans le navigateur. Elle est au cœur de la fonctionnalité "Retrouve-moi".
* @tanstack/react-virtual (3.13): Outil de virtualisation de listes qui garantit des performances élevées lors de l'affichage de très grandes galeries de photos en ne rendant que les éléments visibles à l'écran.
* Zod (4.3): Bibliothèque de déclaration et de validation de schémas TypeScript, utilisée pour garantir la conformité et la sécurité des données manipulées dans l'application.

L'ensemble de cette stack technologique permet de délivrer un large éventail de fonctionnalités, détaillées dans la section suivante.

4. Spécifications Fonctionnelles Détaillées

4.1. Fonctionnalités pour les Invités

Cette section détaille l'ensemble des fonctionnalités conçues pour les invités, avec pour objectif principal de maximiser leur engagement et leur interaction durant l'événement. L'expérience utilisateur est pensée pour être simple, intuitive et ludique.

1. Upload de photos et vidéos
  * Permet aux invités d'envoyer du contenu de deux manières : en prenant une photo ou une vidéo directement via l'appareil de leur téléphone, ou en sélectionnant des fichiers existants depuis leur galerie.
  * Prend en charge les vidéos courtes, avec une durée maximale de 20 secondes.
  * Intègre une compression automatique des images avant l'envoi pour optimiser la bande passante et la vitesse d'affichage.
  * Effectue une validation côté client sur la taille et le type MIME des fichiers pour garantir leur compatibilité.
2. Mode collage
  * Offre la possibilité d'assembler de 2 à 4 photos en une seule image composite.
  * Propose plusieurs templates prédéfinis (grille, carré, etc.) pour faciliter la création.
  * Affiche une prévisualisation en temps réel du collage avant sa soumission.
3. Photobooth interactif
  * Transforme le téléphone de l'invité en un véritable photobooth.
  * Permet d'appliquer des filtres d'image en temps réel.
  * Propose une sélection de cadres décoratifs (Polaroid, néon, etc.) à superposer sur la photo.
  * Inclut un mode "rafale" (burst mode) et un compte à rebours pour faciliter la prise de vue.
4. Galerie interactive
  * Donne accès à l'ensemble des photos et vidéos partagées durant l'événement.
  * La galerie est optimisée pour la performance grâce à la virtualisation des listes (@tanstack/react-virtual), assurant un défilement fluide même avec des milliers de photos.
  * Propose des outils de tri (par date, par popularité), de filtrage (par auteur, par type de média) et une recherche textuelle.
5. Système de likes et réactions
  * Permet d'interagir avec le contenu partagé via un simple "like" (cœur) ou des réactions émojis plus variées (rire, feu, wow, etc.).
  * Chaque utilisateur ne peut laisser qu'une seule réaction par photo, mais peut la modifier à tout moment.
  * Les compteurs de likes et de réactions sont mis à jour en temps réel pour tous les participants.
6. Profil utilisateur
  * Chaque invité peut créer un profil simple avec son nom et un avatar.
  * Le profil affiche des statistiques personnelles (nombre de photos envoyées, total des likes reçus) et les badges de gamification obtenus.
  * Permet de consulter l'historique des photos envoyées par l'utilisateur.
7. Recherche IA "Retrouve-moi"
  * Une fonctionnalité innovante utilisant la reconnaissance faciale (face-api.js) directement dans le navigateur.
  * Permet à un invité de scanner son visage et de retrouver instantanément toutes les photos de la galerie où il apparaît.
8. Téléchargement de contenu
  * Les invités peuvent télécharger les photos individuellement.
  * Une option permet d'exporter l'intégralité des photos de l'événement dans une archive ZIP.
  * Un QR code peut être généré pour faciliter le téléchargement sur un autre appareil.

Ces fonctionnalités sont complétées par un ensemble d'outils puissants destinés aux organisateurs.

4.2. Fonctionnalités pour les Organisateurs

Les fonctionnalités dédiées aux organisateurs constituent un centre de contrôle complet, leur donnant une maîtrise totale sur le déroulement de l'événement, la modération du contenu et la personnalisation de l'expérience visuelle.

1. Dashboard administrateur
  * Offre une vue d'ensemble centralisée avec des statistiques clés en temps réel (nombre de photos, d'invités, de likes).
  * Permet de gérer plusieurs événements depuis un seul compte, conformément à l'architecture SaaS.
2. Gestion d'événements
  * Interface complète pour créer, modifier et supprimer des événements.
  * Chaque événement se voit attribuer un "slug" unique pour générer des URL partageables et faciles à retenir.
  * Permet de définir le statut de l'événement (actif ou inactif).
3. Gestion d'équipe (Rôles)
  * Possibilité d'ajouter plusieurs collaborateurs à la gestion d'un événement.
  * Un système de rôles (owner, organizer, viewer) permet d'attribuer des permissions granulaires à chaque membre de l'équipe.
4. Modération de contenu
  * Accès à une vue de modération listant toutes les photos soumises.
  * Permet de supprimer manuellement tout contenu jugé inapproprié.
  * Possibilité de bloquer temporairement un invité en cas d'abus.
  * Conserve un historique des actions de modération pour un suivi complet.
5. Paramètres avancés de l'événement
  * Contrôle fin sur l'activation ou la désactivation de chaque fonctionnalité (collage, battles, etc.).
  * Configuration du contexte de l'événement (ex: "Mariage de Sophie et Marc") pour affiner la génération de légendes par l'IA.
  * Personnalisation de l'affichage : images de fond, messages d'alerte, vitesse de défilement, délai du carrousel automatique.
6. Mode projection (Grand Écran)
  * Un mode d'affichage spécialement conçu pour les grands écrans (vidéoprojecteurs, télévisions).
  * Affiche les photos en plein écran avec des transitions automatiques et des contrôles de lecture (pause, vitesse).
7. Statistiques et analytics
  * Fournit des données détaillées sur l'engagement : nombre total de photos, de likes, d'invités, classements des contributeurs les plus actifs et des photos les plus populaires.
8. Gestion des Battles photos
  * Permet de créer manuellement ou automatiquement des "battles", c'est-à-dire des duels entre deux photos.
  * Les invités votent en temps réel pour leur photo préférée, et les résultats sont affichés sur le grand écran.
9. Export et génération d'Aftermovie
  * Permet de télécharger une archive ZIP contenant toutes les photos en haute définition.
  * Inclut une fonctionnalité pour générer automatiquement un "aftermovie", une vidéo en timelapse de toutes les photos de l'événement.
  * Offre des options de personnalisation pour la vidéo générée (images par seconde, transitions, cadres).
10. Contrôle mobile
  * L'interface d'administration est entièrement responsive, permettant aux organisateurs de modérer le contenu et de consulter les statistiques directement depuis leur smartphone.

Ces fonctionnalités sont enrichies par des systèmes transverses qui définissent le caractère unique de l'application.

4.3. Fonctionnalités Transverses (IA, Temps Réel, Gamification)

Cette section regroupe les fonctionnalités qui ne sont pas spécifiques à un rôle mais qui constituent le cœur de l'expérience interactive et dynamique de Live Party Wall.

* Fonctionnalités IA (Google Gemini)
  * Modération automatique : Analyse chaque image soumise pour détecter et rejeter le contenu inapproprié. Cette fonctionnalité est cruciale pour la sécurité de l'événement et est toujours activée.
  * Génération de légendes et de tags : Crée automatiquement des légendes amusantes et des tags sémantiques pour chaque photo, enrichissant le contenu et améliorant la recherche.
  * Amélioration de la qualité : Analyse la qualité de l'image et peut appliquer des optimisations automatiques pour améliorer le rendu sur grand écran.
  * Analyse du contexte de l'événement : Utilise le contexte fourni par l'organisateur pour adapter le ton et le contenu des légendes générées.
* Fonctionnalités Temps Réel (Supabase Realtime)
  * L'utilisation de WebSockets via Supabase Realtime garantit une synchronisation instantanée des données pour tous les participants. Les éléments suivants sont mis à jour en temps réel :
    * Apparition des nouvelles photos sur le mur et dans les galeries.
    * Mise à jour des compteurs de likes et de réactions.
    * Propagation immédiate des changements de paramètres effectués par l'organisateur.
    * Déroulement des battles de photos, avec votes et résultats affichés en direct.
    * Affichage immédiat des nouveaux invités inscrits.
    * Mise à jour automatique des compteurs de statistiques sur le dashboard.
* Gamification et Interactivité
  * Badges et classements : Des badges sont automatiquement attribués aux invités en fonction de leur activité (ex: "meilleur photographe"), et des classements affichent les contributeurs les plus populaires.
  * Effets visuels : Des effets AR, comme des feux d'artifice virtuels, peuvent être déclenchés sur le grand écran lorsque certains seuils sont atteints (ex: une photo atteint 50 likes).
  * Cadres décoratifs : Les organisateurs peuvent sélectionner ou uploader des cadres personnalisés qui sont automatiquement appliqués aux photos, renforçant le thème de l'événement.

Ensemble, ces trois piliers créent l'expérience unique de "Live Party Wall". Les fonctionnalités en temps réel fournissent l'immédiateté essentielle, l'intelligence artificielle ajoute la sécurité et l'enrichissement intelligent, et la gamification stimule l'engagement des participants.

Toutes ces fonctionnalités s'appuient sur une structure de données bien définie, présentée dans la section suivante.

5. Schéma de la Base de Données (PostgreSQL)

Le schéma PostgreSQL est le fondement de l'architecture multi-tenant de Live Party Wall. Il est conçu autour de deux principes fondamentaux : une isolation stricte des données par event_id et une optimisation des performances pour les fonctionnalités temps réel, notamment via la dénormalisation (ex: likes_count) et un indexage complet.

5.1. Description des Tables Principales

Table : events

Table centrale qui stocke les informations de chaque événement créé sur la plateforme.

* id (UUID, PK) : Identifiant unique de l'événement.
* slug (TEXT, UNIQUE) : Identifiant textuel utilisé dans l'URL.
* name (TEXT) : Nom public de l'événement.
* description (TEXT) : Description optionnelle de l'événement.
* owner_id (UUID, FK → auth.users) : Référence au propriétaire principal.
* is_active (BOOLEAN) : Indicateur pour activer ou désactiver l'événement.
* created_at, updated_at (TIMESTAMPTZ) : Timestamps de création et de mise à jour.

Table : photos

Contient les métadonnées de chaque photo ou vidéo partagée.

* id (UUID, PK) : Identifiant unique du média.
* event_id (UUID, FK → events) : Référence à l'événement auquel le média appartient.
* url (TEXT) : URL du fichier dans Supabase Storage.
* caption (TEXT) : Légende générée par l'IA.
* author (TEXT) : Nom de l'invité qui a partagé le média.
* type (TEXT) : Type de média ('photo' ou 'video').
* duration (NUMERIC) : Durée en secondes pour les vidéos.
* likes_count (INTEGER) : Compteur dénormalisé de likes, maintenu par un trigger.
* tags (TEXT[]) : Tableau de tags générés par l'IA (stocké sous forme de tableau JSON).
* created_at (TIMESTAMPTZ) : Timestamp de l'upload.

Table : guests

Stocke les informations d'identité essentielles (nom et URL de l'avatar) pour chaque invité ayant créé un profil au sein d'un événement. Cette table permet l'attribution du contenu et les fonctionnalités de personnalisation.

* id (UUID, PK) : Identifiant unique de l'invité.
* event_id (UUID, FK → events) : Référence à l'événement.
* name (TEXT, NOT NULL) : Nom de l'invité.
* avatar_url (TEXT, NOT NULL) : URL de l'avatar de l'invité.
* created_at, updated_at (TIMESTAMPTZ) : Timestamps.

Table : likes

Enregistre chaque "like" donné par un invité à une photo.

* id (UUID, PK) : Identifiant unique du like.
* photo_id (UUID, FK → photos) : Référence à la photo.
* user_identifier (TEXT) : Identifiant de l'invité (son nom).
* created_at (TIMESTAMPTZ) : Timestamp du like.
* Contrainte UNIQUE(photo_id, user_identifier) pour garantir un seul like par invité par photo.

Table : reactions

Enregistre chaque réaction émoji donnée par un invité à une photo.

* id (UUID, PK) : Identifiant unique de la réaction.
* photo_id (UUID, FK → photos) : Référence à la photo.
* user_identifier (TEXT) : Identifiant de l'invité.
* reaction_type (TEXT) : Type d'émoji (ex: 'heart', 'laugh').
* created_at, updated_at (TIMESTAMPTZ) : Timestamps.
* Contrainte UNIQUE(photo_id, user_identifier) pour garantir une seule réaction par invité par photo.

Table : event_settings

Stocke tous les paramètres de configuration spécifiques à un événement (relation 1-1).

* id (UUID, PK) : Identifiant unique des paramètres.
* event_id (UUID, FK → events, UNIQUE) : Assure la relation 1-1.
* auto_carousel_enabled (BOOLEAN)
* auto_carousel_delay (INTEGER)
* battle_mode_enabled (BOOLEAN)
* collage_mode_enabled (BOOLEAN)
* video_capture_enabled (BOOLEAN)
* stats_enabled (BOOLEAN)
* find_me_enabled (BOOLEAN)
* ar_scene_enabled (BOOLEAN)
* caption_generation_enabled (BOOLEAN)
* tags_generation_enabled (BOOLEAN)
* decorative_frame_enabled (BOOLEAN)
* decorative_frame_url (TEXT)
* event_context (TEXT)
* alert_text (TEXT)
* background_desktop_url (TEXT)
* background_mobile_url (TEXT)
* scroll_speed (TEXT)
* slide_transition (TEXT)

Table : event_organizers

Gère les permissions d'accès des différents organisateurs à un événement.

* id (UUID, PK) : Identifiant unique de l'association.
* event_id (UUID, FK → events) : Référence à l'événement.
* user_id (UUID, FK → auth.users) : Référence à l'utilisateur authentifié.
* role (TEXT) : Rôle ('owner', 'organizer', 'viewer').
* created_at (TIMESTAMPTZ) : Timestamp.
* Contrainte UNIQUE(event_id, user_id).

Table : blocked_guests

Liste les invités bloqués temporairement par un organisateur.

* id (UUID, PK) : Identifiant unique du blocage.
* event_id (UUID, FK → events) : Référence à l'événement.
* name (TEXT) : Nom de l'invité bloqué.
* blocked_at (TIMESTAMPTZ) : Date de début du blocage.
* expires_at (TIMESTAMPTZ) : Date de fin du blocage.

Table : photo_battles

Définit les duels entre deux photos.

* id (UUID, PK) : Identifiant unique de la battle.
* event_id (UUID, FK → events) : Référence à l'événement.
* photo_a_id (UUID, FK → photos) : Référence à la première photo.
* photo_b_id (UUID, FK → photos) : Référence à la seconde photo.
* votes_a (INTEGER), votes_b (INTEGER) : Compteurs de votes.
* status (TEXT) : État de la battle ('active', 'completed', 'cancelled').
* created_at, ended_at (TIMESTAMPTZ) : Timestamps de début et de fin.

Table : battle_votes

Enregistre les votes des invités pour une battle.

* id (UUID, PK) : Identifiant unique du vote.
* battle_id (UUID, FK → photo_battles) : Référence à la battle.
* user_identifier (TEXT) : Identifiant de l'invité votant.
* voted_for_photo_id (UUID) : ID de la photo pour laquelle l'invité a voté.
* created_at (TIMESTAMPTZ) : Timestamp.
* Contrainte UNIQUE(battle_id, user_identifier) pour garantir un seul vote par invité par battle.

5.2. Relations et Contraintes

L'intégrité référentielle des données est assurée par un ensemble de relations clés entre les tables, principalement via des clés étrangères (FK) avec suppressions en cascade (ON DELETE CASCADE).

* events → photos : Relation 1-N.
* events → guests : Relation 1-N.
* events → event_settings : Relation 1-1.
* events → event_organizers : Relation 1-N.
* photos → likes : Relation 1-N.
* photos → reactions : Relation 1-N.
* photos → photo_battles : Relation 1-N.
* auth.users → events : Relation 1-N.
* auth.users → event_organizers : Relation 1-N.

Pour garantir des temps de réponse rapides, des index ont été créés sur les colonnes fréquemment utilisées dans les clauses WHERE et JOIN, comme events.slug ou photos.event_id.

5.3. Politiques de Sécurité (Row Level Security - RLS)

La sécurité et la confidentialité des données sont gérées directement au niveau de la base de données via le mécanisme de Row Level Security (RLS) de PostgreSQL. Chaque table est protégée par des politiques qui définissent des règles d'accès granulaires pour chaque type d'opération (SELECT, INSERT, UPDATE, DELETE) en fonction du rôle de l'utilisateur.

* Lecture publique : Les données nécessaires à l'affichage public, comme les photos d'un événement actif, sont accessibles en lecture à tous les utilisateurs.
* Insertion publique : Les invités, même non authentifiés, sont autorisés à insérer de nouvelles données dans des tables spécifiques (photos, likes), mais uniquement pour l'événement en cours.
* Modification authentifiée : Seuls les utilisateurs authentifiés avec un rôle d'organisateur ou de propriétaire peuvent modifier les données sensibles, comme les paramètres d'un événement.
* Suppression authentifiée : De même, la suppression de données est une action restreinte aux organisateurs authentifiés.

6. Gestion du Stockage des Fichiers (Supabase Storage)

6.1. Stratégie des Buckets

Supabase Storage est le service utilisé pour héberger tous les fichiers binaires de l'application. La stratégie de stockage est organisée autour de "buckets" dédiés, chacun ayant sa propre finalité et ses propres politiques d'accès pour une gestion claire et sécurisée des ressources.

1. Bucket : party-photos
  * Finalité : Stocke toutes les photos et vidéos envoyées par les invités.
  * Politiques d'accès :
    * Lecture : Publique.
    * Écriture : Publique, mais les politiques de stockage sous-jacentes et les fonctions RLS de la base de données garantissent que les invités ne peuvent téléverser des fichiers que dans le dossier correspondant à l'événement ({event_id}) auquel ils participent.
    * Suppression : Restreinte aux organisateurs authentifiés.
  * Structure de nommage : {event_id}/{photo_id}.jpg
2. Bucket : party-frames
  * Finalité : Contient les fichiers image des cadres décoratifs.
  * Politiques d'accès :
    * Lecture : Publique.
    * Écriture / Suppression : Restreinte aux organisateurs authentifiés.
  * Structure de nommage : {frame_name}.png
3. Bucket : party-avatars
  * Finalité : Héberge les images d'avatar des invités.
  * Politiques d'accès :
    * Lecture : Publique.
    * Écriture : Publique.
    * Suppression : Restreinte aux organisateurs authentifiés.
  * Structure de nommage : {event_id}/{guest_name}.jpg

La mise en place de l'environnement de développement pour interagir avec ces services est décrite ci-après.

7. Guide d'Installation et de Déploiement

7.1. Prérequis Techniques

Cette section constitue le point de départ pour tout développeur souhaitant configurer un environnement de développement local pour Live Party Wall.

* Logiciels :
  * Node.js (version >= 18.0.0)
  * npm (version >= 9.0.0)
  * Git
* Comptes et Clés API :
  * Un compte Supabase avec un projet actif.
  * Une clé API pour Google Gemini.

7.2. Configuration de l'Environnement

La configuration de l'environnement local se déroule en trois étapes principales.

1. Clonage du dépôt
  * Récupérez le code source depuis le dépôt Git.
2. Installation des dépendances
  * Exécutez la commande npm install à la racine du projet.
3. Configuration des variables d'environnement
  * Créez un fichier .env à la racine du projet et remplissez-le avec les clés API requises.

Variable	Description	Source
VITE_SUPABASE_URL	L'URL unique de votre projet Supabase.	Dashboard Supabase > Settings > API > Project URL
VITE_SUPABASE_ANON_KEY	La clé API publique (anonyme) de votre projet Supabase.	Dashboard Supabase > Settings > API > anon/public key
GEMINI_API_KEY	Votre clé API personnelle pour les services Google Gemini.	Google AI Studio

7.3. Initialisation de la Base de Données

Avant de lancer l'application, la base de données Supabase doit être préparée à l'aide d'un script d'initialisation.

1. Exécution du script SQL
  * Dans l'éditeur SQL de votre dashboard Supabase, exécutez le script de setup complet. Ce script se charge de créer : toutes les tables, les relations, les index, les politiques RLS, les triggers, ainsi que les buckets de stockage avec leurs politiques d'accès.
2. Activation de la réplication "Realtime"
  * Dans le dashboard Supabase (Database > Replication), activez manuellement la réplication pour les tables nécessitant une synchronisation en temps réel : photos, likes, reactions, event_settings, guests, et photo_battles.

7.4. Scripts de Lancement et de Build

Le projet est fourni avec plusieurs scripts npm pour faciliter le développement et le déploiement.

Script	Description
npm run dev	Lance le serveur de développement web avec rechargement à chaud (HMR).
npm run build	Construit la version de production de l'application web (SPA).
npm run preview	Prévisualise le build de production localement.
npm run electron:dev	Lance la version de bureau (Electron) en mode développement.
npm run electron:build	Construit les installateurs de production pour l'application de bureau.
npm run electron:pack	Construit et empaquète l'application de bureau.
npm run generate:icons	Génère les icônes pour l'application Electron.
npm run download:face-models	Télécharge les modèles pour la bibliothèque face-api.js.

8. Scalabilité et Évolutions Futures

8.1. Optimisations Possibles

Bien que l'architecture actuelle soit conçue pour être scalable, plusieurs optimisations peuvent être envisagées pour améliorer davantage les performances et la résilience à grande échelle.

* Mise en cache : Implémenter une couche de cache pour les résultats de l'API Gemini afin de réduire les appels redondants et les coûts associés.
* CDN (Content Delivery Network) : Utiliser un CDN pour servir les assets statiques (cadres décoratifs, modèles face-api) afin de réduire la latence.
* Pagination côté serveur : Pour les événements avec un très grand nombre de photos, remplacer la virtualisation côté client par une pagination côté serveur pour réduire la charge initiale des données.
* Rate Limiting : Mettre en place des limitations de taux plus strictes sur les uploads de fichiers pour se prémunir contre les abus.

8.2. Feuille de Route et Évolutions Futures

Cette section présente une vision des développements futurs qui pourraient enrichir l'application.

* Tests automatisés : Mettre en place une suite de tests complète, incluant des tests unitaires (avec Vitest) et de bout en bout (avec Playwright), pour garantir la non-régression.
* Monitoring : Intégrer un service de suivi des erreurs comme Sentry pour détecter et diagnostiquer proactivement les problèmes en production.
* Multi-langues : Ajouter le support de l'internationalisation (i18n) pour rendre l'application accessible à un public mondial.
* API REST : Exposer une API REST publique pour permettre des intégrations avec des services tiers.
* Webhooks : Implémenter un système de webhooks pour notifier des systèmes externes lors d'événements clés (ex: une nouvelle photo a été ajoutée).

Ce document de spécifications fournit un plan directeur robuste de l'état actuel de Live Party Wall. Les développements futurs, tels que décrits dans la feuille de route, devront adhérer aux principes architecturaux fondamentaux établis ici : un frontend découplé, une dépendance aux services managés pour la scalabilité, et un modèle de données sécurisé par conception. Cela garantira que la plateforme évolue de manière cohérente, maintenable et scalable.
