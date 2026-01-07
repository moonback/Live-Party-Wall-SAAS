# 🖼️ Cadres Décoratifs Prédéfinis

Ce dossier contient les **cadres PNG** disponibles par défaut dans l'admin.

## 📋 Comment ajouter un nouveau cadre

### 1. Préparer le fichier PNG
- **Format**: PNG avec fond transparent (alpha channel)
- **Taille recommandée**: 1920×1080px (16:9) ou 1080×1920px (9:16)
- **Poids**: < 500 KB (pour le chargement rapide)
- **Nom**: utilise des tirets (ex: `mon-cadre-noel.png`)

### 2. Créer une miniature (optionnel mais recommandé)
- **Format**: PNG transparent
- **Taille**: 300×200px
- **Nom**: `mon-cadre-noel-thumb.png`

### 3. Ajouter au manifest
Édite `frames-manifest.json` et ajoute:

```json
{
  "id": "mon-cadre-noel",
  "name": "Mon Cadre Noël",
  "filename": "mon-cadre-noel.png",
  "thumbnail": "mon-cadre-noel-thumb.png",
  "category": "seasonal"
}
```

### 4. Placer les fichiers
- Place `mon-cadre-noel.png` dans `public/cadres/`
- Place `mon-cadre-noel-thumb.png` dans `public/cadres/` (si créé)

### 5. Redémarrer l'app
```bash
npm run dev
```

Le nouveau cadre apparaîtra dans la galerie admin ! ✨

---

## 🎨 Catégories disponibles

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| `universal` | Usage général | Bordures simples, minimalistes |
| `wedding` | Mariages | Élégants, romantiques, dorés |
| `birthday` | Anniversaires | Confettis, ballons, colorés |
| `party` | Soirées | Néon, disco, festifs |
| `corporate` | Entreprise | Professionnels, logos |
| `seasonal` | Saisonnier | Noël, Halloween, été |
| `retro` | Vintage | Polaroid, années 80/90 |

---

## 📐 Template Photoshop/Figma

### Calques recommandés:
1. **Background** (transparent)
2. **Border/Frame** (éléments décoratifs)
3. **Text Layer** (optionnel: titre, date)
4. **Effects** (ombres, lueurs)

### Zone de sécurité:
Laisse un **espace vide central** d'au moins:
- **Landscape (16:9)**: 1400×800px centré
- **Portrait (9:16)**: 600×1200px centré

Cela garantit que la photo reste visible sous le cadre.

---

## 🚀 Exemples de Design

### Mariage Élégant
```
╔═══════════════════════════════════════╗
║  💍 Marie & Thomas • 15 Juin 2026    ║
║                                       ║
║           [PHOTO VISIBLE]             ║
║                                       ║
║       🌸 Château de Versailles 🌸     ║
╚═══════════════════════════════════════╝
```

### Anniversaire Fun
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎉🎈 JOYEUX 30 ANS ! 🎈🎉          ┃
┃                                      ┃
┃           [PHOTO VISIBLE]            ┃
┃                                      ┃
┃       #PARTYWALL #BESTDAY            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Corporate Moderne
```
┌──────────────────────────────────────┐
│  LOGO ENTREPRISE                     │
│                                      │
│           [PHOTO VISIBLE]            │
│                                      │
│  "Innovation · Excellence"          │
└──────────────────────────────────────┘
```

---

## 🛠️ Outils Recommandés

- **[Figma](https://figma.com)** (gratuit) - Design web
- **[Canva Pro](https://canva.com)** - Templates prêts
- **[Photopea](https://photopea.com)** (gratuit) - Clone Photoshop en ligne
- **[GIMP](https://gimp.org)** (gratuit) - Logiciel open-source
- **[Remove.bg](https://remove.bg)** - Retirer l'arrière-plan

---

## 📦 Pack de Cadres Gratuits

Tu peux télécharger des packs gratuits sur:
- [Freepik](https://freepik.com) - Frames PNG
- [Pngwing](https://pngwing.com) - Bordures transparentes
- [Flaticon](https://flaticon.com) - Éléments décoratifs

**Important**: Vérifie les licences avant usage commercial !

---

## 🐛 Dépannage

### Le cadre ne s'affiche pas
- ✅ Vérifie que le fichier est bien dans `public/cadres/`
- ✅ Vérifie que le nom dans `frames-manifest.json` correspond exactement
- ✅ Recharge la page admin (Ctrl+R)

### Le cadre est déformé
- ✅ Vérifie les dimensions (16:9 ou 9:16)
- ✅ Assure-toi que le PNG a un fond transparent

### Erreur 404 au chargement
- ✅ Le chemin dans le manifest doit être relatif (juste le nom du fichier)
- ✅ Pas d'espaces dans les noms de fichiers

---

## 💡 Astuces

1. **Garde les fichiers légers** (< 500 KB) pour un chargement rapide
2. **Utilise des noms descriptifs** pour faciliter la sélection
3. **Crée des miniatures** pour un aperçu rapide dans l'admin
4. **Teste sur mobile** avant de valider (les cadres s'adaptent en responsive)
5. **Archive les anciens cadres** dans un sous-dossier `_archive/`

---

## 📝 Manifest Schema

```typescript
interface Frame {
  id: string;           // Identifiant unique (kebab-case)
  name: string;         // Nom affiché dans l'admin
  filename: string;     // Nom du fichier PNG
  thumbnail: string;    // Nom de la miniature (optionnel)
  category: string;     // Catégorie (voir liste ci-dessus)
}
```

---

Bon design ! 🎨

