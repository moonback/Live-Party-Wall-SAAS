# 🤝 Guide de Contribution - Partywall

Merci de votre intérêt pour contribuer à Partywall ! Ce guide vous aidera à comprendre comment contribuer efficacement au projet.

---

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Processus de développement](#processus-de-développement)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Pull Requests](#pull-requests)
- [Questions](#questions)

---

## 📜 Code de conduite

### Nos valeurs

- **Respect** : Traitez tous les contributeurs avec respect et bienveillance
- **Inclusion** : Accueillez les contributions de tous, peu importe le niveau d'expérience
- **Collaboration** : Travaillez ensemble pour améliorer le projet
- **Qualité** : Maintenez des standards de code élevés

### Comportement attendu

- ✅ Utiliser un langage accueillant et inclusif
- ✅ Respecter les différents points de vue et expériences
- ✅ Accepter gracieusement les critiques constructives
- ✅ Se concentrer sur ce qui est meilleur pour la communauté
- ✅ Faire preuve d'empathie envers les autres membres

### Comportement inacceptable

- ❌ Langage ou images sexualisés
- ❌ Trolling, commentaires insultants/désobligeants
- ❌ Harcèlement public ou privé
- ❌ Publication d'informations privées sans permission
- ❌ Autre conduite jugée inappropriée dans un contexte professionnel

---

## 🚀 Comment contribuer

### Signaler un bug

1. **Vérifier les issues existantes** - Assurez-vous que le bug n'a pas déjà été signalé
2. **Créer une nouvelle issue** - Utilisez le template "Bug Report"
3. **Fournir des détails** :
   - Description claire du bug
   - Étapes pour reproduire
   - Comportement attendu vs actuel
   - Environnement (OS, navigateur, version)
   - Captures d'écran si applicable

### Proposer une fonctionnalité

1. **Vérifier la roadmap** - Consultez [ROADMAP.md](./ROADMAP.md) pour voir si c'est déjà prévu
2. **Créer une nouvelle issue** - Utilisez le template "Feature Request"
3. **Décrire la fonctionnalité** :
   - Cas d'usage détaillé
   - Bénéfices attendus
   - Alternatives considérées
   - Mockups/wireframes si applicable

### Contribuer au code

1. **Fork le projet** - Créez un fork sur GitHub
2. **Créer une branche** - `git checkout -b feature/ma-fonctionnalite`
3. **Développer** - Implémentez votre fonctionnalité ou correction
4. **Tester** - Assurez-vous que tout fonctionne
5. **Commit** - Utilisez des messages de commit clairs
6. **Push** - `git push origin feature/ma-fonctionnalite`
7. **Pull Request** - Ouvrez une PR avec une description détaillée

---

## 🔧 Processus de développement

### Setup de l'environnement

1. **Cloner le fork** :
   ```bash
   git clone https://github.com/votre-username/Partywall-SAAS.git
   cd Partywall-SAAS
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env
   # Éditer .env avec vos credentials
   ```

4. **Lancer en développement** :
   ```bash
   npm run dev
   ```

### Workflow Git

1. **Synchroniser avec upstream** :
   ```bash
   git remote add upstream https://github.com/moonback/Partywall-SAAS.git
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Créer une branche** :
   ```bash
   # Convention de nommage des branches
   git checkout -b feature/ma-fonctionnalite      # Nouvelle fonctionnalité
   git checkout -b fix/correction-bug             # Correction de bug
   git checkout -b docs/amelioration-readme       # Documentation
   git checkout -b refactor/optimisation-service   # Refactoring
   ```

3. **Développer et commit** :
   ```bash
   git add .
   # Utiliser des messages de commit conventionnels
   git commit -m "feat: Ajout de la fonctionnalité X"
   ```

4. **Push et PR** :
   ```bash
   git push origin feature/ma-fonctionnalite
   # Puis ouvrir une PR sur GitHub
   ```

### Conventions de commits

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
# Types de commits
feat: Ajout d'une nouvelle fonctionnalité
fix: Correction d'un bug
docs: Modification de la documentation
style: Changements de formatage (pas de changement de code)
refactor: Refactoring du code
perf: Amélioration de performance
test: Ajout ou modification de tests
chore: Tâches de maintenance

# Exemples
git commit -m "feat: Ajout du mode collage pour photos"
git commit -m "fix: Correction du bug de chargement des photos"
git commit -m "docs: Mise à jour de ARCHITECTURE.md"
git commit -m "refactor: Optimisation de photoService.ts"
git commit -m "perf: Amélioration du lazy loading des images"
```

### Gestion des branches

**Branches principales** :
- `main` : Branche de production (stable)
- `develop` : Branche de développement (si elle existe)

**Branches de fonctionnalité** :
- `feature/nom-fonctionnalite` : Nouvelle fonctionnalité
- `fix/nom-bug` : Correction de bug
- `docs/nom-doc` : Documentation
- `refactor/nom-refactor` : Refactoring

**Règles** :
- Une branche = une fonctionnalité/bug
- Garder les branches à jour avec `main`
- Supprimer les branches après merge

---

## 📐 Standards de code

### TypeScript

- ✅ **Toujours utiliser TypeScript** pour nouveau code
- ✅ **Éviter `any`** : Utiliser `unknown` ou types explicites
- ✅ **Interfaces pour objets complexes** : Définir dans `types.ts` si partagé
- ✅ **JSDoc pour fonctions complexes** : Documenter les paramètres et retours

**Exemple** :
```typescript
/**
 * Upload une photo vers Supabase Storage
 * @param base64Image - Image en base64
 * @param caption - Légende de la photo
 * @param author - Nom de l'auteur
 * @returns Promise résolue avec l'objet Photo créé
 */
export const addPhotoToWall = async (
  base64Image: string,
  caption: string,
  author: string
): Promise<Photo> => {
  // ...
};
```

### React

- ✅ **Composants fonctionnels uniquement** : Pas de classes
- ✅ **Hooks pour état et effets** : `useState`, `useEffect`, `useContext`
- ✅ **Props typées** : Toujours définir une interface pour les props
- ✅ **Nommage PascalCase** : `GuestUpload`, `WallView`

**Exemple** :
```typescript
interface GuestUploadProps {
  onPhotoUploaded: (photo: Photo) => void;
  onBack: () => void;
}

export const GuestUpload: React.FC<GuestUploadProps> = ({
  onPhotoUploaded,
  onBack
}) => {
  // ...
};
```

### Nommage

- **Fichiers** : `camelCase.tsx` (composants), `camelCase.ts` (services/utils)
- **Composants** : `PascalCase`
- **Fonctions/Variables** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`
- **Types/Interfaces** : `PascalCase`

### Formatage

- **Indentation** : 2 espaces
- **Guillemets** : Simple quotes pour JS/TS, double pour JSX
- **Point-virgule** : Oui
- **Trailing commas** : Oui dans objets/arrays multilignes

---

## 🧪 Tests

### Structure des tests (À implémenter)

```
tests/
├── unit/           # Tests unitaires (services, utils)
├── integration/    # Tests d'intégration (flux complets)
└── e2e/            # Tests end-to-end (Playwright)
```

### Bonnes pratiques

- ✅ Tester les cas d'erreur (API down, validation échouée)
- ✅ Mocker les appels externes (Supabase, Gemini)
- ✅ Tester les edge cases (fichiers très gros, réseau lent)
- ✅ Maintenir une couverture de code > 80%

### Exécuter les tests (À implémenter)

```bash
npm test              # Tests unitaires
npm run test:e2e      # Tests E2E
npm run test:coverage # Couverture de code
```

### Tests manuels recommandés

Avant de soumettre une PR, testez manuellement :

1. **Upload de photos** :
   - [ ] Upload photo simple
   - [ ] Upload vidéo
   - [ ] Upload avec filtres/cadres
   - [ ] Upload depuis photobooth
   - [ ] Vérifier modération IA

2. **Affichage** :
   - [ ] Photos s'affichent en temps réel
   - [ ] Likes/réactions fonctionnent
   - [ ] Galerie avec filtres
   - [ ] Mode projection

3. **Admin** :
   - [ ] Dashboard fonctionne
   - [ ] Paramètres sauvegardés
   - [ ] Battles créées
   - [ ] Aftermovies générés

4. **Multi-événements** :
   - [ ] Création d'événement
   - [ ] Changement d'événement
   - [ ] Isolation des données

---

## 📚 Documentation

### Code Comments

- ✅ **JSDoc pour fonctions publiques** : Services, utilitaires complexes
- ✅ **Commentaires pour "pourquoi"** : Expliquer les décisions, pas le "quoi"
- ✅ **Éviter les commentaires évidents** : Le code doit être auto-explicatif

### Documentation utilisateur

- ✅ **Mettre à jour README.md** : Si nouvelle fonctionnalité utilisateur
- ✅ **Mettre à jour ARCHITECTURE.md** : Si modification architecturale
- ✅ **Mettre à jour API_DOCS.md** : Si nouveau service ou endpoint
- ✅ **Mettre à jour DB_SCHEMA.md** : Si modification base de données

---

## 🔍 Pull Requests

### Checklist avant PR

- [ ] Code suit les conventions (nommage, formatage)
- [ ] Types TypeScript corrects (pas d'erreurs, pas de `any`)
- [ ] Gestion d'erreurs appropriée (try/catch, fallbacks pour IA)
- [ ] Tests manuels effectués (upload, affichage, erreurs)
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de `console.log` oubliés (utiliser `logger`)
- [ ] Pas de code commenté mort
- [ ] Variables d'environnement vérifiées (pas de secrets dans le code)

### Template de PR

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. Étape 1
2. Étape 2
3. ...

## Captures d'écran (si applicable)
...

## Checklist
- [ ] Code testé
- [ ] Documentation mise à jour
- [ ] Pas de breaking changes (ou documentés)
```

### Review Process

1. **Automated checks** - CI/CD vérifie le code (si configuré)
2. **Code review** - Au moins un maintainer doit approuver
3. **Tests** - Tous les tests doivent passer (tests manuels minimum)
4. **Merge** - Squash and merge pour maintenir un historique propre

### Checklist pour les reviewers

- [ ] Code suit les conventions du projet
- [ ] Types TypeScript corrects (pas d'erreurs)
- [ ] Gestion d'erreurs appropriée
- [ ] Pas de secrets dans le code
- [ ] Documentation mise à jour si nécessaire
- [ ] Tests manuels effectués
- [ ] Pas de breaking changes (ou documentés)

---

## 🚫 Anti-patterns à éviter

### ❌ À ne pas faire

- ❌ **Logique métier dans composants** : Extraire dans services
- ❌ **Props drilling excessif** : Utiliser Context si nécessaire
- ❌ **État global inutile** : Préférer état local quand possible
- ❌ **Re-renders inutiles** : Utiliser `useMemo`, `useCallback` si nécessaire
- ❌ **Appels API dans composants** : Utiliser les services
- ❌ **Types `any`** : Toujours typer explicitement
- ❌ **Composants trop gros** : Extraire en sous-composants
- ❌ **Duplication de code** : Extraire en fonctions/services réutilisables

### ✅ À faire

- ✅ **Composants petits et focalisés** : Une responsabilité par composant
- ✅ **Services réutilisables** : Logique partagée dans services
- ✅ **Types partagés** : Définir dans `types.ts`
- ✅ **Constantes centralisées** : Définir dans `constants.ts`
- ✅ **Gestion d'erreurs robuste** : Try/catch, fallbacks, logging

---

## 💬 Questions

### Où poser des questions ?

- **Issues GitHub** : Pour questions techniques ou fonctionnelles
- **Discussions GitHub** : Pour discussions générales
- **Email** : Pour questions privées ou sensibles

### Questions fréquentes

**Q: Puis-je travailler sur une fonctionnalité de la roadmap ?**
R: Oui ! Vérifiez d'abord qu'il n'y a pas déjà une issue ou PR en cours. Consultez [ROADMAP.md](./ROADMAP.md) pour voir les fonctionnalités prévues.

**Q: Comment savoir quoi travailler ?**
R: Consultez les issues avec le label `good first issue` ou `help wanted`. Les issues prioritaires sont marquées avec `priority: high`.

**Q: Puis-je contribuer même si je suis débutant ?**
R: Absolument ! Les contributions de tous niveaux sont les bienvenues. Commencez par des petites améliorations (documentation, corrections de typos, etc.).

**Q: Combien de temps prend une PR ?**
R: Cela dépend de la complexité. Les PR simples peuvent être mergées rapidement. Les PR complexes peuvent prendre plusieurs jours pour review.

**Q: Dois-je créer une issue avant de commencer à travailler ?**
R: Pour les petites corrections, non. Pour les nouvelles fonctionnalités importantes, oui, pour discuter de l'approche avant de commencer.

**Q: Comment tester mes changements localement ?**
R: Utilisez `npm run dev` pour le développement web, ou `npm run electron:dev` pour Electron. Assurez-vous d'avoir configuré Supabase et Gemini API.

**Q: Que faire si je rencontre un problème ?**
R: Consultez la section [Troubleshooting](./README.md#-troubleshooting) du README, ou créez une issue avec les détails du problème.

---

## 🎉 Remerciements

Merci de contribuer à Partywall ! Chaque contribution, grande ou petite, est appréciée et aide à améliorer le projet pour tous.

---

**Dernière mise à jour** : 2026-01-15
