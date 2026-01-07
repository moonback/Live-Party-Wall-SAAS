# 🤝 Guide de Contribution - Live Party Wall

Merci de votre intérêt pour contribuer à Live Party Wall ! Ce document fournit les guidelines pour contribuer efficacement au projet.

---

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Code](#standards-de-code)
- [Workflow Git](#workflow-git)
- [Tests](#tests)
- [Documentation](#documentation)
- [Questions](#questions)

---

## 📜 Code de Conduite

### Nos Standards

- ✅ Soyez respectueux et inclusif
- ✅ Acceptez les critiques constructives avec grâce
- ✅ Concentrez-vous sur ce qui est meilleur pour la communauté
- ✅ Montrez de l'empathie envers les autres membres

### Comportements Inacceptables

- ❌ Langage ou images sexualisés
- ❌ Attaques personnelles ou politiques
- ❌ Harcèlement public ou privé
- ❌ Publication d'informations privées sans permission

---

## 🚀 Comment Contribuer

### 1. Signaler un Bug

Si vous trouvez un bug :

1. **Vérifiez** qu'il n'existe pas déjà une issue ouverte
2. **Créez une nouvelle issue** avec :
   - Un titre clair et descriptif
   - Une description détaillée du problème
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs. le comportement actuel
   - Votre environnement (OS, navigateur, version Node.js)
   - Des captures d'écran si applicable

**Template d'Issue** :
```markdown
## Description du Bug
[Description claire du problème]

## Étapes pour Reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Scroller jusqu'à '...'
4. Voir l'erreur

## Comportement Attendu
[Ce qui devrait se passer]

## Comportement Actuel
[Ce qui se passe réellement]

## Environnement
- OS: [e.g. Windows 10, macOS 13, Linux]
- Navigateur: [e.g. Chrome 120, Firefox 121]
- Node.js: [e.g. 18.17.0]
```

### 2. Proposer une Fonctionnalité

Si vous avez une idée d'amélioration :

1. **Vérifiez** la [ROADMAP.md](./ROADMAP.md) pour voir si c'est déjà planifié
2. **Créez une issue** avec :
   - Un titre descriptif
   - Une explication détaillée de la fonctionnalité
   - Le cas d'usage et la valeur ajoutée
   - Des exemples visuels si applicable

### 3. Soumettre une Pull Request

1. **Forkez** le repository
2. **Créez une branche** depuis `main` :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-bug
   ```
3. **Faites vos modifications** en suivant les [Standards de Code](#standards-de-code)
4. **Testez** vos changements localement
5. **Commitez** avec des messages clairs :
   ```bash
   git commit -m "feat: ajout de la fonctionnalité X"
   # ou
   git commit -m "fix: correction du bug Y"
   ```
6. **Pushez** vers votre fork :
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
7. **Ouvrez une Pull Request** sur GitHub avec :
   - Un titre clair
   - Une description détaillée des changements
   - Une référence aux issues liées (si applicable)
   - Des captures d'écran si UI modifiée

---

## 📝 Standards de Code

### TypeScript

- ✅ **Utilisez TypeScript** pour tout nouveau code
- ✅ **Définissez les types** explicitement (évitez `any`)
- ✅ **Utilisez les interfaces** pour les objets complexes
- ✅ **Documentez** les fonctions complexes avec JSDoc

**Exemple** :
```typescript
/**
 * Upload une photo vers Supabase Storage
 * @param base64Image - Image en base64
 * @param caption - Légende de la photo
 * @param author - Nom de l'auteur
 * @returns Promise résolue avec l'objet Photo créé
 * @throws Error si Supabase n'est pas configuré ou en cas d'erreur upload
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

- ✅ **Utilisez des composants fonctionnels** avec Hooks
- ✅ **Nommez les composants** en PascalCase
- ✅ **Extrayez la logique métier** dans des services
- ✅ **Utilisez TypeScript** pour les props

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

- **Fichiers** : `camelCase.tsx` pour composants, `camelCase.ts` pour utilitaires
- **Composants** : `PascalCase`
- **Fonctions/Variables** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`
- **Types/Interfaces** : `PascalCase`

**Exemple** :
```typescript
// Fichier: photoService.ts
export const MAX_PHOTOS = 100;

interface PhotoUploadResult {
  success: boolean;
  photo?: Photo;
}

export const uploadPhoto = async (file: File): Promise<PhotoUploadResult> => {
  // ...
};
```

### Formatage

- ✅ **Utilisez Prettier** (configuration à venir)
- ✅ **Indentation** : 2 espaces
- ✅ **Guillemets** : Simple quotes pour JS/TS, double pour JSX
- ✅ **Point-virgule** : Oui
- ✅ **Trailing commas** : Oui dans les objets/arrays multilignes

**Exemple** :
```typescript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};
```

### Structure des Fichiers

- ✅ **Un composant par fichier**
- ✅ **Services dans `/services`**
- ✅ **Utils dans `/utils`**
- ✅ **Types partagés dans `types.ts`**

---

## 🔀 Workflow Git

### Convention de Nommage des Branches

- `feature/nom-fonctionnalite` : Nouvelle fonctionnalité
- `fix/nom-bug` : Correction de bug
- `docs/nom-documentation` : Amélioration de la documentation
- `refactor/nom-refactoring` : Refactoring de code
- `test/nom-test` : Ajout/modification de tests

### Messages de Commit

Suivez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de changement de code)
- `refactor` : Refactoring
- `test` : Tests
- `chore` : Tâches de maintenance

**Exemples** :
```bash
feat(upload): ajout de la validation de taille de fichier
fix(wall): correction du scroll infini qui plantait
docs(readme): mise à jour des instructions d'installation
refactor(services): extraction de la logique de modération
```

### Pull Request

- ✅ **Titre clair** : Résume les changements
- ✅ **Description détaillée** : Explique le "quoi" et le "pourquoi"
- ✅ **Référence aux issues** : `Closes #123` ou `Fixes #456`
- ✅ **Screenshots** : Si modification UI
- ✅ **Tests** : Mentionnez si vous avez testé manuellement

**Template** :
```markdown
## Description
[Description des changements]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai testé mes changements localement
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes commits suivent la convention de nommage
```

---

## 🧪 Tests

### Tests à Implémenter

Actuellement, les tests ne sont pas encore en place. Voici ce qui est prévu :

#### Unit Tests (Services)

Testez les services isolément avec des mocks :

```typescript
// Exemple futur
describe('photoService', () => {
  it('should upload a photo successfully', async () => {
    // Mock Supabase
    const mockPhoto = { id: '123', url: '...' };
    // Test
    const result = await addPhotoToWall(base64, 'caption', 'author');
    expect(result).toEqual(mockPhoto);
  });
});
```

#### Integration Tests

Testez les flux complets :

```typescript
// Exemple futur
describe('Photo Upload Flow', () => {
  it('should upload, moderate, and display photo', async () => {
    // Test du flux complet
  });
});
```

#### E2E Tests

Utilisez Playwright ou Cypress pour tester les scénarios utilisateur.

### Tests Manuels

En attendant les tests automatisés, testez manuellement :

1. **Upload de photo** : Vérifiez que l'upload fonctionne
2. **Modération** : Testez avec différentes images
3. **Realtime** : Ouvrez deux onglets et vérifiez la synchronisation
4. **Mobile** : Testez sur un vrai appareil mobile
5. **Admin** : Testez toutes les fonctionnalités admin

---

## 📚 Documentation

### Code Comments

- ✅ **Documentez** les fonctions complexes avec JSDoc
- ✅ **Expliquez** le "pourquoi" pas le "quoi" (le code doit être auto-explicatif)
- ✅ **Ajoutez des commentaires** pour les algorithmes non-triviaux

**Exemple** :
```typescript
/**
 * Analyse une image avec Gemini pour détecter le contenu inapproprié.
 * En cas d'erreur API, retourne des valeurs "safe" par défaut pour ne pas bloquer l'expérience.
 */
export const analyzeImage = async (base64Image: string): Promise<ImageAnalysis> => {
  // ...
};
```

### Documentation Utilisateur

Si vous ajoutez une fonctionnalité utilisateur :

1. **Mettez à jour** `README.md` si nécessaire
2. **Ajoutez des exemples** dans la documentation
3. **Créez un guide** si la fonctionnalité est complexe

### Documentation Technique

Si vous modifiez l'architecture :

1. **Mettez à jour** `ARCHITECTURE.md`
2. **Mettez à jour** `API_DOCS.md` si vous ajoutez/modifiez des services
3. **Mettez à jour** `DB_SCHEMA.md` si vous modifiez la base de données

---

## 🎯 Priorités de Contribution

### Facile (Bon pour commencer)

- 🐛 Correction de bugs mineurs
- 📝 Amélioration de la documentation
- 🎨 Amélioration de l'UI/UX (petites modifications)
- ♿ Accessibilité (labels, ARIA, etc.)

### Moyen

- ✨ Nouvelles fonctionnalités simples
- 🔧 Refactoring de code
- 🧪 Ajout de tests
- 📊 Amélioration des analytics

### Avancé

- 🏗️ Modifications architecturales majeures
- 🔐 Améliorations de sécurité
- ⚡ Optimisations de performance
- 🌐 Intégrations externes

---

## ❓ Questions

### Avant de Commencer

Si vous n'êtes pas sûr de quelque chose :

1. **Consultez** la documentation existante
2. **Cherchez** dans les issues existantes
3. **Ouvrez une issue** pour discuter avant de coder (pour les gros changements)

### Besoin d'Aide ?

- 📧 Ouvrez une issue avec le label `question`
- 💬 Discutez dans les discussions GitHub (si activées)
- 📖 Consultez la [documentation](./README.md)

---

## ✅ Checklist Avant de Soumettre

- [ ] Mon code suit les standards du projet
- [ ] J'ai testé mes changements localement
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes commits suivent la convention de nommage
- [ ] Ma branche est à jour avec `main`
- [ ] J'ai résolu tous les conflits
- [ ] J'ai vérifié qu'il n'y a pas d'erreurs de lint/TypeScript

---

## 🙏 Merci !

Merci de prendre le temps de contribuer à Live Party Wall ! Chaque contribution, même petite, est appréciée et fait une différence.

---

**Dernière mise à jour** : 2026-01-15

