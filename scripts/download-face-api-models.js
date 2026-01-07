/**
 * Script pour télécharger les modèles face-api.js
 * Les modèles seront placés dans public/models/face-api/
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models', 'face-api');

// Liste des modèles à télécharger
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
];

/**
 * Télécharge un fichier depuis une URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Suivre les redirections
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${response.statusCode} pour ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Supprimer le fichier en cas d'erreur
      reject(err);
    });
  });
}

/**
 * Télécharge tous les modèles
 */
async function downloadModels() {
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log('📥 Téléchargement des modèles face-api.js...\n');
  
  for (const model of MODELS) {
    const url = `${MODEL_BASE_URL}/${model}`;
    const outputPath = path.join(OUTPUT_DIR, model);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log(`✓ ${model} (déjà présent)`);
      continue;
    }
    
    try {
      console.log(`⬇️  Téléchargement de ${model}...`);
      await downloadFile(url, outputPath);
      console.log(`✓ ${model} téléchargé`);
    } catch (error) {
      console.error(`✗ Erreur lors du téléchargement de ${model}:`, error.message);
    }
  }
  
  console.log('\n✅ Téléchargement terminé !');
  console.log(`📁 Modèles disponibles dans: ${OUTPUT_DIR}`);
}

// Exécuter le script
downloadModels().catch(console.error);

