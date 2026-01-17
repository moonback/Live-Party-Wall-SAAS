import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Photo, ReactionCounts } from '../types';
import { applyWatermarkToImage } from '../utils/watermarkUtils';

export interface ExportOptions {
  logoUrl?: string | null;
  logoWatermarkEnabled?: boolean;
}

export const exportPhotosToZip = async (
  photos: Photo[], 
  eventTitle: string,
  options?: ExportOptions
) => {
  const zip = new JSZip();
  const folderName = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_photos`;
  const folder = zip.folder(folderName);

  if (!folder) throw new Error("Impossible de créer le dossier ZIP");

  // Créer un fichier JSON avec les métadonnées
  const metadata = photos.map(p => ({
    id: p.id,
    author: p.author,
    caption: p.caption,
    timestamp: new Date(p.timestamp).toISOString(),
    likes: p.likes_count,
    filename: `photo_${p.id}.jpg`
  }));
  
  folder.file("metadata.json", JSON.stringify(metadata, null, 2));

  // Télécharger et ajouter chaque image
  const promises = photos.map(async (photo) => {
    try {
      let blob: Blob;
      
      // Si c'est une photo et que le filigrane est activé, appliquer le watermark
      if (
        photo.type === 'photo' && 
        options?.logoUrl && 
        options?.logoWatermarkEnabled
      ) {
        blob = await applyWatermarkToImage(photo.url, options.logoUrl);
      } else {
        // Téléchargement normal (vidéo ou photo sans filigrane)
        const response = await fetch(photo.url);
        blob = await response.blob();
      }
      
      // Nom du fichier
      const extension = photo.type === 'video' ? (photo.url.includes('.webm') ? 'webm' : 'mp4') : 'jpg';
      const filename = `photo_${photo.id}.${extension}`;
      
      // Ajouter au ZIP
      folder.file(filename, blob);
    } catch (err) {
      console.error(`Erreur lors du téléchargement de la photo ${photo.id}:`, err);
      folder.file(`error_${photo.id}.txt`, `Impossible de télécharger l'image: ${photo.url}`);
    }
  });

  await Promise.all(promises);

  // Générer le ZIP
  const content = await zip.generateAsync({ type: "blob" });
  
  // Sauvegarder
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(content, `${eventTitle}_${dateStr}.zip`);
};

/**
 * Dessine les métadonnées sur un canvas
 * @param ctx - Contexte canvas 2D
 * @param img - Image chargée
 * @param author - Nom de l'auteur
 * @param likesCount - Nombre de likes
 * @param reactions - Compteurs de réactions
 * @param caption - Légende de la photo
 */
const drawMetadataOnCanvas = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  author: string,
  likesCount: number,
  reactions: ReactionCounts,
  caption: string
) => {
  // Calculer les dimensions pour le panneau d'information
  const padding = Math.max(24, img.width * 0.03);
  const fontSize = Math.max(18, img.width * 0.028);
  const smallFontSize = Math.max(14, img.width * 0.022);
  const lineHeight = fontSize * 1.5;
  const sectionSpacing = lineHeight * 0.6;
  const panelPadding = padding * 1.8;
  const borderRadius = Math.max(12, img.width * 0.015);

  // Calculer la hauteur totale du panneau
  let panelHeight = panelPadding * 2;
  let yOffset = panelPadding;

  // Auteur
  if (author) {
    panelHeight += lineHeight;
  }

  // Likes
  panelHeight += lineHeight + sectionSpacing;

  // Réactions
  const totalReactions = Object.values(reactions || {}).reduce((sum, count) => sum + (count || 0), 0);
  if (totalReactions > 0) {
    panelHeight += lineHeight + sectionSpacing;
  }

  // Légende
  let captionLines: string[] = [];
  if (caption) {
    ctx.font = `${smallFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
    const maxWidth = img.width - padding * 2 - panelPadding * 2;
    const words = caption.split(' ');
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        captionLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) {
      captionLines.push(currentLine);
    }

    panelHeight += captionLines.length * (lineHeight * 0.9) + sectionSpacing;
  }

  // Position du panneau (en bas avec marge)
  const panelY = img.height - panelHeight - padding;
  const panelX = padding;
  const panelWidth = img.width - padding * 2;

  // Dessiner un gradient pour le fond du panneau
  const gradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
  
  // Dessiner le panneau avec coins arrondis (méthode compatible)
  ctx.beginPath();
  const x = panelX;
  const y = panelY;
  const w = panelWidth;
  const h = panelHeight;
  const r = borderRadius;
  
  // Dessiner un rectangle arrondi manuellement
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();

  // Ajouter une bordure subtile
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Configuration du texte
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';

  // Dessiner l'auteur avec style moderne
  if (author) {
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`📸 ${author}`, panelX + panelPadding, panelY + yOffset);
    yOffset += lineHeight + sectionSpacing;
    
    // Séparateur visuel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + panelPadding, panelY + yOffset - sectionSpacing / 2);
    ctx.lineTo(panelX + panelWidth - panelPadding, panelY + yOffset - sectionSpacing / 2);
    ctx.stroke();
  }

  // Dessiner les likes avec style
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillStyle = '#ff6b9d';
  ctx.fillText(`❤️ ${likesCount}`, panelX + panelPadding, panelY + yOffset);
  yOffset += lineHeight + sectionSpacing;
  
  // Séparateur visuel
  if (totalReactions > 0 || captionLines.length > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + panelPadding, panelY + yOffset - sectionSpacing / 2);
    ctx.lineTo(panelX + panelWidth - panelPadding, panelY + yOffset - sectionSpacing / 2);
    ctx.stroke();
  }

  // Dessiner les réactions
  if (totalReactions > 0) {
    const reactionEmojis: Record<string, string> = {
      heart: '❤️',
      laugh: '😂',
      cry: '😢',
      fire: '🔥',
      wow: '😮',
      thumbsup: '👍'
    };

    const reactionTexts: string[] = [];
    Object.entries(reactions || {}).forEach(([type, count]) => {
      if (count && count > 0) {
        reactionTexts.push(`${reactionEmojis[type] || '•'} ${count}`);
      }
    });

    if (reactionTexts.length > 0) {
      ctx.font = `500 ${fontSize * 0.95}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Réactions: ${reactionTexts.join('  ')}`, panelX + panelPadding, panelY + yOffset);
      yOffset += lineHeight + sectionSpacing;
      
      // Séparateur visuel avant la légende
      if (captionLines.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + panelPadding, panelY + yOffset - sectionSpacing / 2);
        ctx.lineTo(panelX + panelWidth - panelPadding, panelY + yOffset - sectionSpacing / 2);
        ctx.stroke();
      }
    }
  }

  // Dessiner la légende avec style
  if (captionLines.length > 0) {
    ctx.font = `${smallFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    let lineY = panelY + yOffset;
    
    captionLines.forEach((line) => {
      ctx.fillText(line, panelX + panelPadding, lineY);
      lineY += lineHeight * 0.9;
    });
  }
};

/**
 * Dessine les métadonnées sur une image et retourne un Blob PNG
 * @param imageUrl - URL de l'image
 * @param author - Nom de l'auteur
 * @param likesCount - Nombre de likes
 * @param reactions - Compteurs de réactions
 * @param caption - Légende de la photo
 * @param logoUrl - URL du logo pour filigrane (optionnel)
 * @param logoWatermarkEnabled - Activer le filigrane (optionnel)
 * @returns Promise résolue avec un Blob PNG
 */
const drawMetadataOnImage = async (
  imageUrl: string,
  author: string,
  likesCount: number,
  reactions: ReactionCounts,
  caption: string,
  logoUrl?: string | null,
  logoWatermarkEnabled?: boolean
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Essayer d'abord avec CORS
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Créer un canvas avec la même taille que l'image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner l'image
        ctx.drawImage(img, 0, 0);

        // Dessiner les métadonnées
        drawMetadataOnCanvas(ctx, img, author, likesCount, reactions, caption);

        // Fonction pour appliquer le filigrane et convertir en PNG
        const applyWatermarkAndConvert = () => {
          // Appliquer le filigrane si activé
          if (logoUrl && logoWatermarkEnabled) {
            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            
            logo.onload = () => {
              try {
                // Calculer la taille du logo (environ 8% de la largeur de l'image, max 150px)
                const logoMaxWidth = Math.min(img.width * 0.08, 150);
                const logoAspectRatio = logo.width / logo.height;
                const logoWidth = logoMaxWidth;
                const logoHeight = logoWidth / logoAspectRatio;
                
                // Position : bas à gauche avec padding (2% de l'image)
                const padding = Math.max(img.width, img.height) * 0.02;
                const logoX = padding;
                const logoY = img.height - logoHeight - padding;
                
                // Dessiner un fond semi-transparent pour le logo
                const backgroundPadding = 8;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(
                  logoX - backgroundPadding,
                  logoY - backgroundPadding,
                  logoWidth + (backgroundPadding * 2),
                  logoHeight + (backgroundPadding * 2)
                );
                
                // Dessiner le logo avec opacité
                ctx.globalAlpha = 0.8;
                ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                ctx.globalAlpha = 1.0;
              } catch (err) {
                console.warn('Erreur lors du dessin du logo:', err);
              }
              
              // Convertir en PNG
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Impossible de convertir le canvas en blob'));
                }
              }, 'image/png');
            };
            
            logo.onerror = () => {
              // Continuer sans logo si erreur de chargement
              console.warn('Erreur lors du chargement du logo pour filigrane');
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Impossible de convertir le canvas en blob'));
                }
              }, 'image/png');
            };
            
            logo.src = logoUrl;
          } else {
            // Convertir en PNG sans filigrane
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Impossible de convertir le canvas en blob'));
              }
            }, 'image/png');
          }
        };

        applyWatermarkAndConvert();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      // Si CORS échoue, essayer de charger via fetch pour contourner CORS
      if (img.crossOrigin === 'anonymous' && !imageUrl.startsWith('data:')) {
        // Essayer de charger l'image via fetch (proxy ou CORS configuré)
        fetch(imageUrl, { mode: 'cors' })
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.blob();
          })
          .then(blob => {
            const imgRetry = new Image();
            const objectUrl = URL.createObjectURL(blob);
            
            imgRetry.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = imgRetry.width;
                canvas.height = imgRetry.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error('Impossible de créer le contexte canvas'));
                  return;
                }
                ctx.drawImage(imgRetry, 0, 0);
                // Réutiliser la fonction de dessin
                drawMetadataOnCanvas(ctx, imgRetry, author, likesCount, reactions, caption);
                
                // Appliquer le filigrane si activé
                const applyWatermarkAndConvert = () => {
                  if (logoUrl && logoWatermarkEnabled) {
                    const logo = new Image();
                    logo.onload = () => {
                      try {
                        const logoMaxWidth = Math.min(imgRetry.width * 0.08, 150);
                        const logoAspectRatio = logo.width / logo.height;
                        const logoWidth = logoMaxWidth;
                        const logoHeight = logoWidth / logoAspectRatio;
                        const padding = Math.max(imgRetry.width, imgRetry.height) * 0.02;
                        const logoX = padding;
                        const logoY = imgRetry.height - logoHeight - padding;
                        const backgroundPadding = 8;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.fillRect(
                          logoX - backgroundPadding,
                          logoY - backgroundPadding,
                          logoWidth + (backgroundPadding * 2),
                          logoHeight + (backgroundPadding * 2)
                        );
                        ctx.globalAlpha = 0.8;
                        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                        ctx.globalAlpha = 1.0;
                      } catch (err) {
                        console.warn('Erreur lors du dessin du logo:', err);
                      }
                      
                      // Nettoyer l'URL et convertir
                      URL.revokeObjectURL(objectUrl);
                      canvas.toBlob((blob) => {
                        if (blob) {
                          resolve(blob);
                        } else {
                          reject(new Error('Impossible de convertir le canvas en blob'));
                        }
                      }, 'image/png');
                    };
                    logo.onerror = () => {
                      // Continuer sans logo si erreur
                      URL.revokeObjectURL(objectUrl);
                      canvas.toBlob((blob) => {
                        if (blob) {
                          resolve(blob);
                        } else {
                          reject(new Error('Impossible de convertir le canvas en blob'));
                        }
                      }, 'image/png');
                    };
                    logo.src = logoUrl;
                  } else {
                    // Nettoyer l'URL et convertir sans filigrane
                    URL.revokeObjectURL(objectUrl);
                    canvas.toBlob((blob) => {
                      if (blob) {
                        resolve(blob);
                      } else {
                        reject(new Error('Impossible de convertir le canvas en blob'));
                      }
                    }, 'image/png');
                  }
                };
                
                applyWatermarkAndConvert();
              } catch (err) {
                URL.revokeObjectURL(objectUrl);
                reject(err);
              }
            };
            
            imgRetry.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              // Si fetch échoue aussi, essayer sans CORS en dernier recours
              const imgFallback = new Image();
              imgFallback.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = imgFallback.width;
                  canvas.height = imgFallback.height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    reject(new Error('Impossible de créer le contexte canvas'));
                    return;
                  }
                  // Utiliser toBlob au lieu de toDataURL pour éviter CORS
                  ctx.drawImage(imgFallback, 0, 0);
                  drawMetadataOnCanvas(ctx, imgFallback, author, likesCount, reactions, caption);
                  
                  // Appliquer le filigrane si activé
            if (logoUrl && logoWatermarkEnabled) {
              const logo = new Image();
              logo.onload = () => {
                try {
                  const logoMaxWidth = Math.min(imgRetry.width * 0.08, 150);
                  const logoAspectRatio = logo.width / logo.height;
                  const logoWidth = logoMaxWidth;
                  const logoHeight = logoWidth / logoAspectRatio;
                  const padding = Math.max(imgRetry.width, imgRetry.height) * 0.02;
                  const logoX = padding;
                  const logoY = imgRetry.height - logoHeight - padding;
                  const backgroundPadding = 8;
                  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                  ctx.fillRect(
                    logoX - backgroundPadding,
                    logoY - backgroundPadding,
                    logoWidth + (backgroundPadding * 2),
                    logoHeight + (backgroundPadding * 2)
                  );
                  ctx.globalAlpha = 0.8;
                  ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                  ctx.globalAlpha = 1.0;
                } catch (err) {
                  console.warn('Erreur lors du dessin du logo:', err);
                }
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Impossible de convertir le canvas en blob'));
                  }
                }, 'image/png');
              };
              logo.onerror = () => {
                // Continuer sans logo si erreur
                canvas.toBlob((blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Impossible de convertir le canvas en blob'));
                  }
                }, 'image/png');
              };
              logo.src = logoUrl;
            } else {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Impossible de convertir le canvas en blob'));
                }
              }, 'image/png');
            }
          } catch (err) {
            reject(err);
          }
        };
        imgRetry.onerror = () => {
          reject(new Error(`Impossible de charger l'image: ${imageUrl}`));
        };
        imgRetry.src = imageUrl;
      } else {
        reject(new Error(`Impossible de charger l'image: ${imageUrl}`));
      }
    };

    img.src = imageUrl;
  });
};

/**
 * Interface pour le callback de progression
 */
export interface ExportProgress {
  processed: number;
  total: number;
  currentPhoto?: string;
  message?: string;
}

/**
 * Exporte toutes les photos en PNG avec métadonnées superposées
 * @param photos - Liste des photos avec leurs métadonnées
 * @param reactionsMap - Map des réactions par photo ID
 * @param eventTitle - Titre de l'événement
 * @param onProgress - Callback optionnel pour suivre la progression
 * @param batchSize - Taille des lots pour le traitement (défaut: 5)
 * @param options - Options d'export (logo, filigrane)
 */
export const exportPhotosWithMetadataToZip = async (
  photos: Photo[],
  reactionsMap: Map<string, ReactionCounts>,
  eventTitle: string,
  onProgress?: (progress: ExportProgress) => void,
  batchSize: number = 5,
  options?: ExportOptions
) => {
  const zip = new JSZip();
  const folderName = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_photos_with_metadata`;
  const folder = zip.folder(folderName);

  if (!folder) throw new Error("Impossible de créer le dossier ZIP");

  // Filtrer uniquement les photos (pas les vidéos)
  const photosOnly = photos.filter(p => p.type === 'photo');

  if (photosOnly.length === 0) {
    throw new Error("Aucune photo à exporter");
  }

  const total = photosOnly.length;
  let processed = 0;

  // Traiter par lots pour éviter de surcharger le navigateur
  for (let i = 0; i < photosOnly.length; i += batchSize) {
    const batch = photosOnly.slice(i, i + batchSize);
    
    // Traiter le lot actuel
    const batchPromises = batch.map(async (photo, batchIndex) => {
      try {
        // Notifier la progression
        if (onProgress) {
          onProgress({
            processed: processed,
            total: total,
            currentPhoto: photo.author || 'Anonyme',
            message: `Traitement de la photo ${processed + 1}/${total}...`
          });
        }

        const reactions = reactionsMap.get(photo.id) || {};
        const blob = await drawMetadataOnImage(
          photo.url,
          photo.author || 'Anonyme',
          photo.likes_count,
          reactions,
          photo.caption || '',
          options?.logoUrl,
          options?.logoWatermarkEnabled
        );

        // Nom du fichier avec index pour l'ordre
        const globalIndex = i + batchIndex;
        const indexStr = String(globalIndex + 1).padStart(4, '0');
        const authorStr = (photo.author || 'anonyme').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${indexStr}_${authorStr}_${photo.id.substring(0, 8)}.png`;

        folder.file(filename, blob);
        processed++;

        // Notifier la progression après traitement
        if (onProgress) {
          onProgress({
            processed: processed,
            total: total,
            currentPhoto: photo.author || 'Anonyme',
            message: `Photo ${processed}/${total} traitée`
          });
        }
      } catch (err) {
        console.error(`Erreur lors du traitement de la photo ${photo.id}:`, err);
        folder.file(`error_${photo.id}.txt`, `Impossible de traiter l'image: ${photo.url}\nErreur: ${err instanceof Error ? err.message : String(err)}`);
        processed++;
        
        if (onProgress) {
          onProgress({
            processed: processed,
            total: total,
            message: `Erreur sur la photo ${processed}/${total}`
          });
        }
      }
    });

    // Attendre que le lot soit terminé avant de passer au suivant
    await Promise.all(batchPromises);

    // Petite pause entre les lots pour laisser le navigateur respirer
    if (i + batchSize < photosOnly.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Notifier la fin du traitement
  if (onProgress) {
    onProgress({
      processed: total,
      total: total,
      message: 'Génération du fichier ZIP...'
    });
  }

  // Générer le ZIP
  const content = await zip.generateAsync({ 
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  // Sauvegarder
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(content, `${eventTitle}_photos_with_metadata_${dateStr}.zip`);

  // Notifier la fin
  if (onProgress) {
    onProgress({
      processed: total,
      total: total,
      message: 'Export terminé !'
    });
  }
};

