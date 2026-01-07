# Icônes Electron

Ce dossier contient les icônes nécessaires pour le build Electron de l'application.

## Fichiers requis

- **icon.ico** : Icône pour Windows (format ICO, multi-tailles: 16x16, 32x32, 64x64, 128x128, 256x256)
- **icon.icns** : Icône pour macOS (format ICNS, recommandé: 512x512px)
- **icon.png** : Icône pour Linux (format PNG, 512x512px)
- **icon-256.png** : Icône pour la fenêtre Electron (256x256px)
- **icon-512.png** : Icône source pour conversion ICNS (512x512px)

## Génération des icônes

Les icônes sont générées automatiquement à partir du fichier `public/favicon.svg`.

### Génération automatique

```bash
npm run generate:icons
```

Ce script génère automatiquement :
- ✅ `icon.png` (512x512) pour Linux
- ✅ `icon.ico` (multi-tailles) pour Windows
- ✅ `icon-256.png` pour l'icône de fenêtre Electron
- ✅ `icon-512.png` pour la conversion ICNS

### macOS (icon.icns)

Pour macOS, vous devez générer le fichier ICNS manuellement :

**Sur macOS :**
```bash
iconutil -c icns build/icon-512.png -o build/icon.icns
```

**Ou utilisez un outil en ligne :**
- https://cloudconvert.com/png-to-icns
- https://www.icoconverter.com/

## Utilisation

Les icônes sont automatiquement utilisées lors du build Electron :
- **Windows** : `icon.ico` est utilisé pour l'installateur et l'application
- **macOS** : `icon.icns` est utilisé pour l'application et le DMG
- **Linux** : `icon.png` est utilisé pour l'application
- **Fenêtre Electron** : `icon-256.png` est utilisé comme icône de fenêtre

## Note

Les icônes sont générées à partir de `public/favicon.svg`. Si vous modifiez le SVG, relancez `npm run generate:icons` pour régénérer toutes les icônes.

