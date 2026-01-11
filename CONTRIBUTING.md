# 🤝 Guide de Contribution - Partywall

Merci de votre intérêt pour contribuer à Partywall ! Ce guide vous aidera à contribuer efficacement au projet.

---

## 📋 Table des matières

- [Code de conduite](#-code-de-conduite)
- [Comment contribuer](#-comment-contribuer)
- [Processus de développement](#-processus-de-développement)
- [Standards de code](#-standards-de-code)
- [Tests](#-tests)
- [Documentation](#-documentation)
- [Pull Requests](#-pull-requests)

---

## 📜 Code de conduite

### Nos valeurs

- ✅ **Respect** : Respect mutuel entre tous les contributeurs
- ✅ **Bienveillance** : Environnement accueillant et inclusif
- ✅ **Ouverture** : Accepter les critiques constructives
- ✅ **Collaboration** : Travailler ensemble vers un objectif commun

### Comportement attendu

- Utiliser un langage accueillant et inclusif
- Respecter les différents points de vue et expériences
- Accepter gracieusement les critiques constructives
- Se concentrer sur ce qui est meilleur pour la communauté
- Faire preuve d'empathie envers les autres membres

### Comportement inacceptable

- Langage ou images sexualisés
- Commentaires désobligeants, dégradants ou injurieux
- Harcèlement public ou privé
- Publication d'informations privées sans permission
- Autre conduite jugée inappropriée

---

## 🚀 Comment contribuer

### Signaler un bug

1. **Vérifier** que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/moonback/Live-Party-Wall-SAAS/issues)
2. **Créer une nouvelle issue** avec le template suivant :

```markdown
## Description du bug
Description claire et concise du bug.

## Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Scroller jusqu'à '...'
4. Voir l'erreur

## Comportement attendu
Ce qui devrait se passer.

## Comportement actuel
Ce qui se passe réellement.

## Captures d'écran
Si applicable, ajouter des captures d'écran.

## Environnement
- OS: [ex: Windows 11, macOS 14, Ubuntu 22.04]
- Navigateur: [ex: Chrome 120, Firefox 121, Safari 17]
- Version de l'app: [ex: 1.0.0]

## Informations supplémentaires
Toute autre information pertinente.
```

### Proposer une fonctionnalité

1. **Vérifier** que la fonctionnalité n'a pas déjà été proposée
2. **Créer une nouvelle issue** avec le label `enhancement` :

```markdown
## Description de la fonctionnalité
Description claire et concise de la fonctionnalité proposée.

## Cas d'usage
Décrire quand et comment cette fonctionnalité serait utilisée.

## Bénéfices attendus
Pourquoi cette fonctionnalité serait utile.

## Mockups/Wireframes
Si applicable, ajouter des mockups ou wireframes.

## Alternatives considérées
Décrire les alternatives que vous avez considérées.

## Informations supplémentaires
Toute autre information pertinente.
```

### Contribuer au code

1. **Fork** le projet
2. **Créer une branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Développer** votre fonctionnalité en suivant les standards
4. **Tester** votre code manuellement
5. **Commit** vos changements avec [Conventional Commits](https://www.conventionalcommits.org/)
6. **Push** vers la branche (`git push origin feature/AmazingFeature`)
7. **Ouvrir une Pull Request** avec une description détaillée

---

## 💻 Processus de développement

### 1. Configuration de l'environnement

```bash
# Cloner votre fork
git clone https://github.com/moonback/Live-Party-Wall-SAAS.git
cd Live-Party-Wall-SAAS

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Remplir les variables d'environnement

# Lancer en mode développement
npm run dev
```

### 2. Structure des branches

- `main` : Branche principale (production) - **Ne jamais commit directement**
- `develop` : Branche de développement (si applicable)
- `feature/*` : Nouvelles fonctionnalités (ex: `feature/add-dark-mode`)
- `bugfix/*` : Corrections de bugs (ex: `bugfix/fix-upload-error`)
- `hotfix/*` : Corrections urgentes pour production (ex: `hotfix/security-patch`)
- `docs/*` : Améliorations de documentation (ex: `docs/update-readme`)

**Convention de nommage** : Utiliser des noms descriptifs en kebab-case.

### 3. Workflow Git

```bash
# 1. Mettre à jour votre fork
git checkout main
git pull upstream main

# 2. Créer une nouvelle branche
git checkout -b feature/ma-fonctionnalite

# 3. Développer et commit
git add .
git commit -m "feat: Ajouter ma fonctionnalité"

# 4. Push vers votre fork
git push origin feature/ma-fonctionnalite

# 5. Ouvrir une Pull Request sur GitHub
```

---

## 📝 Standards de code

### TypeScript

- ✅ **Toujours utiliser TypeScript** (pas de JavaScript)
- ✅ **Éviter `any`** : Utiliser `unknown` ou types explicites
- ✅ **Types stricts** : Activer `strict: true` dans tsconfig.json
- ✅ **Interfaces pour objets complexes** : Définir dans `types.ts`

**Exemple** :
```typescript
// ❌ Mauvais
function processData(data: any) {
  return data.value;
}

// ✅ Bon
interface Data {
  value: string;
}

function processData(data: Data): string {
  return data.value;
}
```

### React

- ✅ **Composants fonctionnels uniquement** (pas de classes)
- ✅ **Hooks pour l'état** : `useState`, `useEffect`, `useContext`
- ✅ **Props typées** : Toujours définir une interface pour les props
- ✅ **Nommage PascalCase** : `GuestUpload`, `WallView`

**Exemple** :
```typescript
// ❌ Mauvais
const Component = (props) => {
  return <div>{props.name}</div>;
};

// ✅ Bon
interface ComponentProps {
  name: string;
  onAction: () => void;
}

const Component: React.FC<ComponentProps> = ({ name, onAction }) => {
  return <div>{name}</div>;
};
```

### Nommage

- **Fichiers** : `camelCase.tsx` (composants), `camelCase.ts` (services)
- **Composants** : `PascalCase`
- **Fonctions/Variables** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`
- **Types/Interfaces** : `PascalCase`

### Formatage

- **Indentation** : 2 espaces
- **Guillemets** : Simple quotes pour JS/TS, double pour JSX
- **Point-virgule** : Oui
- **Trailing commas** : Oui dans objets/arrays multilignes

### Architecture

- **Service Layer** : Toute la logique métier dans `/services`
- **Composants "stupides"** : UI uniquement, pas de logique métier
- **Context API** : Pour l'état global partagé
- **Lazy Loading** : Pour les composants lourds

---

## 🧪 Tests

### Tests à implémenter (Roadmap)

- [ ] **Tests unitaires** : Services avec mocks (Jest/Vitest)
- [ ] **Tests d'intégration** : Flux complets (upload → affichage)
- [ ] **Tests E2E** : Scénarios utilisateur (Playwright)

### Structure de tests (future)

```
tests/
├── unit/
│   ├── services/
│   │   ├── photoService.test.ts
│   │   ├── geminiService.test.ts
│   │   └── ...
│   └── utils/
│       ├── validation.test.ts
│       └── ...
├── integration/
│   └── flows/
│       ├── upload-flow.test.ts
│       └── aftermovie-flow.test.ts
└── e2e/
    └── scenarios/
        ├── guest-journey.spec.ts
        └── admin-journey.spec.ts
```

### Bonnes pratiques

- ✅ **Tester les cas d'erreur** : API down, validation échouée, réseau lent
- ✅ **Mocker les appels externes** : Supabase, Gemini API
- ✅ **Tester les edge cases** : Fichiers très gros, images corrompues, timeout
- ✅ **Maintenir une couverture > 80%** : Objectif pour la v1.0
- ✅ **Tests isolés** : Chaque test doit être indépendant
- ✅ **Nommage clair** : `describe('photoService', () => { it('should upload photo successfully', ...) })`

### Exemple de test unitaire (future)

```typescript
// tests/unit/services/photoService.test.ts
import { uploadPhotoToStorage } from '@/services/photoService';
import { supabase } from '@/services/supabaseClient';

jest.mock('@/services/supabaseClient');

describe('photoService', () => {
  it('should upload photo successfully', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const eventId = 'test-event-id';
    
    // Mock Supabase response
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' } })
    });
    
    const url = await uploadPhotoToStorage(file, eventId);
    
    expect(url).toBeDefined();
    expect(url).toContain('test.jpg');
  });
});
```

---

## 📚 Documentation

### Code Comments

- ✅ **JSDoc pour fonctions publiques** : Services, utilitaires complexes
- ✅ **Commentaires pour "pourquoi"** : Expliquer les décisions, pas le "quoi"
- ✅ **Éviter les commentaires évidents** : Le code doit être auto-explicatif

**Exemple** :
```typescript
/**
 * Upload une photo vers Supabase Storage
 * @param file - Fichier image/vidéo à uploader
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec l'URL publique de la photo
 */
export const uploadPhotoToStorage = async (
  file: File,
  eventId: string
): Promise<string> => {
  // ...
};
```

### Documentation utilisateur

- Mettre à jour `README.md` si nouvelle fonctionnalité utilisateur
- Mettre à jour `ARCHITECTURE.md` si modification architecturale
- Mettre à jour `API_DOCS.md` si nouveau service
- Mettre à jour `DB_SCHEMA.md` si modification base de données

---

## 🔀 Pull Requests

### Avant de soumettre

- [ ] Code suit les conventions (nommage, formatage)
- [ ] Types TypeScript corrects (pas d'erreurs)
- [ ] Gestion d'erreurs appropriée
- [ ] Tests manuels effectués
- [ ] Documentation mise à jour
- [ ] Pas de `console.log` oubliés
- [ ] Pas de code commenté mort
- [ ] Pas de secrets dans le code

### Format du commit

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: Ajouter la fonctionnalité X
fix: Corriger le bug Y
docs: Mettre à jour la documentation
style: Formatage du code
refactor: Refactorisation du code
test: Ajouter des tests
chore: Tâches de maintenance
```

**Exemples** :
```bash
git commit -m "feat: Ajouter le mode collage pour les photos"
git commit -m "fix: Corriger l'upload de vidéos > 20s"
git commit -m "docs: Mettre à jour API_DOCS.md"
```

### Description de la PR

Template à suivre :

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. Étapes pour tester
2. ...

## Checklist
- [ ] Code testé
- [ ] Documentation mise à jour
- [ ] Pas de breaking changes
```

### Review process

1. **Automatique** : CI/CD vérifie le code
2. **Manuel** : Au moins un maintainer doit approuver
3. **Feedback** : Les commentaires seront adressés
4. **Merge** : Une fois approuvé, la PR sera mergée

---

## 🐛 Signaler des problèmes

### Issues

Utiliser les templates d'issues :
- 🐛 **Bug Report** : Pour signaler un bug
- ✨ **Feature Request** : Pour proposer une fonctionnalité
- 📚 **Documentation** : Pour améliorer la documentation
- ❓ **Question** : Pour poser une question

### Informations à fournir

**Pour un bug** :
- Description claire
- Étapes pour reproduire
- Comportement attendu vs actuel
- Environnement (OS, navigateur, version)
- Captures d'écran/logs

**Pour une fonctionnalité** :
- Description détaillée
- Cas d'usage
- Bénéfices attendus
- Mockups/wireframes si applicable

---

## 📞 Contact

- **GitHub Issues** : Pour les bugs et fonctionnalités
- **Email** : [votre-email@example.com]
- **Discord/Slack** : [lien si applicable]

---

## 🙏 Remerciements

Merci à tous les contributeurs qui rendent ce projet possible !

---

**Dernière mise à jour** : 2026-01-15
