# 🖼️ Guide: Cadres Locaux depuis public/cadres/

## ✨ Nouvelle Fonctionnalité

Vous pouvez maintenant **sélectionner des cadres PNG** directement depuis votre dossier `public/cadres/` sans avoir à les uploader vers Supabase à chaque fois.

---

## 📁 Structure des Fichiers

```
public/
└── cadres/
    ├── frames-manifest.json      # Liste des cadres disponibles
    ├── elegant-gold.png           # Cadre 1
    ├── elegant-gold-thumb.png     # Miniature (optionnel)
    ├── simple-white.png           # Cadre 2
    ├── neon-pink.png              # Cadre 3
    ├── christmas.png              # Cadre 4
    └── README.md                  # Documentation
```

---

## 🚀 Comment Ajouter un Cadre

### Étape 1: Créer votre PNG

Créez un fichier PNG transparent avec:
- **Taille**: 1920×1080px (16:9) ou 1080×1920px (9:16)
- **Fond**: Transparent (alpha channel)
- **Poids**: < 500 KB
- **Nom**: `mon-cadre-noel.png` (kebab-case, pas d'espaces)

### Étape 2: Créer une miniature (optionnel)

Pour un aperçu rapide dans l'admin:
- **Taille**: 300×200px
- **Nom**: `mon-cadre-noel-thumb.png`

### Étape 3: Placer les fichiers

```bash
# Copier dans le dossier public/cadres/
cp mon-cadre-noel.png public/cadres/
cp mon-cadre-noel-thumb.png public/cadres/
```

### Étape 4: Éditer le manifest

Ouvrez `public/cadres/frames-manifest.json` et ajoutez:

```json
{
  "id": "mon-cadre-noel",
  "name": "Mon Cadre Noël",
  "filename": "mon-cadre-noel.png",
  "thumbnail": "mon-cadre-noel-thumb.png",
  "category": "seasonal"
}
```

### Étape 5: Redémarrer l'app

```bash
npm run dev
```

Le cadre apparaît maintenant dans **Admin > Configuration > Choisir un cadre** ! ✨

---

## 🎨 Catégories Disponibles

| Catégorie | Emoji | Description |
|-----------|-------|-------------|
| `universal` | ⭐ | Usage général, minimaliste |
| `wedding` | 💍 | Mariages, élégants |
| `birthday` | 🎂 | Anniversaires, festifs |
| `party` | 🎉 | Soirées, néon |
| `corporate` | 💼 | Entreprise, professionnels |
| `seasonal` | 🎄 | Noël, Halloween, été |
| `retro` | 📼 | Vintage, années 80/90 |

---

## 📋 Exemple de Manifest Complet

```json
[
  {
    "id": "elegant-gold",
    "name": "Élégant Doré",
    "filename": "elegant-gold.png",
    "thumbnail": "elegant-gold-thumb.png",
    "category": "wedding"
  },
  {
    "id": "simple-white",
    "name": "Bordure Blanche Simple",
    "filename": "simple-white.png",
    "thumbnail": "simple-white-thumb.png",
    "category": "universal"
  },
  {
    "id": "neon-pink",
    "name": "Néon Rose",
    "filename": "neon-pink.png",
    "thumbnail": "neon-pink-thumb.png",
    "category": "party"
  }
]
```

---

## 🎯 Utilisation dans l'Admin

### 1. Ouvrir la galerie

1. Connectez-vous en **Admin**
2. Allez dans **Configuration**
3. Section **Cadre décoratif (PNG)**
4. Cliquez sur **"Choisir un cadre"** (bouton rose)

### 2. Filtrer par catégorie

- Cliquez sur une catégorie (Mariage, Anniversaire, etc.)
- Seuls les cadres de cette catégorie s'affichent

### 3. Sélectionner un cadre

- Cliquez sur un cadre dans la grille
- Un aperçu s'affiche immédiatement
- Cliquez sur **"Sauvegarder les paramètres"**

### 4. Tester

- Ouvrez le mode **Invité** (photobooth)
- Le cadre apparaît en overlay sur la caméra
- Prenez une photo → le cadre est incrusté ✨

---

## 🆚 Cadres Locaux vs Upload Supabase

| Fonctionnalité | Cadres Locaux | Upload Supabase |
|----------------|---------------|-----------------|
| **Stockage** | `public/cadres/` | Bucket `party-frames` |
| **Vitesse** | ⚡ Instantané | 🐢 Upload requis |
| **Gestion** | Fichiers locaux | Cloud (persistant) |
| **Idéal pour** | Cadres prédéfinis | Cadres personnalisés ponctuels |
| **Limite** | Taille du projet | Quota Supabase |

**💡 Recommandation:**
- Utilisez **cadres locaux** pour vos designs récurrents (logo entreprise, thèmes standards)
- Utilisez **upload Supabase** pour des cadres ponctuels (événement spécifique, test rapide)

---

## 🛠️ Outils pour Créer des Cadres

### Design
- **[Figma](https://figma.com)** (gratuit) - Design collaboratif
- **[Canva Pro](https://canva.com)** - Templates prêts à l'emploi
- **[Photopea](https://photopea.com)** (gratuit) - Clone Photoshop en ligne
- **[GIMP](https://gimp.org)** (gratuit) - Logiciel open-source

### Ressources Gratuites
- **[Freepik](https://freepik.com)** - Frames PNG
- **[Pngwing](https://pngwing.com)** - Bordures transparentes
- **[Flaticon](https://flaticon.com)** - Éléments décoratifs
- **[Remove.bg](https://remove.bg)** - Retirer l'arrière-plan

---

## 🐛 Dépannage

### Le cadre ne s'affiche pas dans la galerie

✅ **Vérifications:**
1. Le fichier PNG est bien dans `public/cadres/`
2. Le nom dans `frames-manifest.json` correspond exactement au nom du fichier
3. Le JSON est valide (pas de virgule en trop, guillemets corrects)
4. Rechargez la page admin (Ctrl+R)

### Erreur "Failed to fetch frames-manifest.json"

✅ **Solution:**
- Le fichier `frames-manifest.json` n'existe pas ou est mal placé
- Créez-le dans `public/cadres/frames-manifest.json`
- Vérifiez que le JSON est valide

### Le cadre est déformé sur la caméra

✅ **Solution:**
- Vérifiez les dimensions du PNG (16:9 ou 9:16)
- Assurez-vous que le fond est transparent
- Testez avec un cadre plus simple pour isoler le problème

### La miniature ne s'affiche pas

✅ **Solution:**
- Si pas de miniature, le cadre complet est utilisé (fallback automatique)
- Créez une miniature 300×200px pour de meilleures performances

---

## 📦 Pack de Démarrage (Exemples)

Voici 6 cadres d'exemple à créer pour commencer:

### 1. Bordure Blanche Simple
```
Taille: 1920×1080px
Style: Rectangle blanc 20px, coins arrondis
Catégorie: universal
```

### 2. Élégant Doré
```
Taille: 1920×1080px
Style: Bordure dorée ornée, style baroque
Catégorie: wedding
```

### 3. Néon Rose
```
Taille: 1920×1080px
Style: Bordure néon rose avec glow effect
Catégorie: party
```

### 4. Confettis Anniversaire
```
Taille: 1920×1080px
Style: Confettis colorés sur les bords
Catégorie: birthday
```

### 5. Noël Festif
```
Taille: 1920×1080px
Style: Guirlandes, flocons de neige
Catégorie: seasonal
```

### 6. Polaroid Vintage
```
Taille: 1920×1080px
Style: Cadre blanc épais en bas (style Polaroid)
Catégorie: retro
```

---

## 🚀 Prochaines Améliorations

- [ ] Prévisualisation en plein écran avant sélection
- [ ] Upload de cadres locaux via l'admin (sans FTP)
- [ ] Éditeur de cadre intégré (texte, couleurs)
- [ ] Import/export de packs de cadres
- [ ] Animations sur les cadres (pulsation, rotation)

---

## 📝 Résumé

1. ✅ Créez vos PNG transparents
2. ✅ Placez-les dans `public/cadres/`
3. ✅ Ajoutez-les au `frames-manifest.json`
4. ✅ Redémarrez l'app
5. ✅ Sélectionnez dans Admin > Configuration > Choisir un cadre
6. ✅ Testez dans le mode Invité

**C'est tout ! 🎉**

---

## 🆘 Besoin d'Aide?

- Consultez `public/cadres/README.md` pour plus de détails
- Vérifiez les exemples dans `frames-manifest.json`
- Testez avec un cadre simple d'abord (bordure blanche)

Bon design ! 🎨

