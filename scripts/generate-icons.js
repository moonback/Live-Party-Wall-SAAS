import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import toIco from 'to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const svgPath = join(projectRoot, 'public', 'favicon.svg');
const buildDir = join(projectRoot, 'build');

/**
 * Génère les icônes Electron à partir du SVG
 */
async function generateIcons() {
  try {
    // Lire le SVG
    const svgBuffer = readFileSync(svgPath);
    console.log('📸 Lecture du SVG depuis:', svgPath);

    // Générer PNG 512x512 pour Linux et base
    const png512 = await sharp(svgBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    writeFileSync(join(buildDir, 'icon.png'), png512);
    console.log('✅ icon.png (512x512) généré');

    // Générer PNG 256x256 pour ICO
    const png256 = await sharp(svgBuffer)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Générer ICO pour Windows (avec plusieurs tailles)
    const png128 = await sharp(svgBuffer)
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const png64 = await sharp(svgBuffer)
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const png32 = await sharp(svgBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const png16 = await sharp(svgBuffer)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Créer ICO avec plusieurs tailles
    const icoBuffer = await toIco([png16, png32, png64, png128, png256]);
    writeFileSync(join(buildDir, 'icon.ico'), icoBuffer);
    console.log('✅ icon.ico généré (multi-tailles)');

    // Pour macOS ICNS, on génère un PNG 512x512
    // Note: La conversion en ICNS nécessite iconutil (macOS) ou un outil externe
    // On génère un PNG 512x512 qui peut être converti manuellement
    writeFileSync(join(buildDir, 'icon-512.png'), png512);
    console.log('✅ icon-512.png généré (pour conversion ICNS)');
    console.log('⚠️  Pour macOS: Utilisez "iconutil -c icns build/icon-512.png -o build/icon.icns" sur macOS');
    console.log('   Ou utilisez un outil en ligne: https://cloudconvert.com/png-to-icns');

    // Générer aussi un PNG 256x256 pour l'icône de fenêtre Electron
    const png256ForWindow = await sharp(svgBuffer)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    writeFileSync(join(buildDir, 'icon-256.png'), png256ForWindow);
    console.log('✅ icon-256.png généré (pour icône de fenêtre)');

    console.log('\n🎉 Toutes les icônes ont été générées avec succès!');
    console.log('📁 Fichiers créés dans:', buildDir);

  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error);
    process.exit(1);
  }
}

generateIcons();

