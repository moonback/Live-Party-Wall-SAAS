/**
 * Utilitaires pour appliquer un filigrane (watermark) sur les images
 */

/**
 * Applique un filigrane logo sur une image avant téléchargement
 * @param imageUrl - URL de l'image à traiter
 * @param logoUrl - URL du logo à appliquer en filigrane
 * @returns Promise résolue avec le Blob de l'image avec filigrane
 */
export const applyWatermarkToImage = async (
  imageUrl: string,
  logoUrl: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Charger l'image principale
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        // Charger le logo
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        
        logo.onload = () => {
          try {
            // Créer le canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }
            
            // Dessiner l'image principale
            ctx.drawImage(img, 0, 0);
            
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
            
            // Appliquer un blur léger au fond
            ctx.filter = 'blur(4px)';
            ctx.fillRect(
              logoX - backgroundPadding,
              logoY - backgroundPadding,
              logoWidth + (backgroundPadding * 2),
              logoHeight + (backgroundPadding * 2)
            );
            ctx.filter = 'none';
            
            // Redessiner le fond avec blur
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
            
            // Convertir en Blob
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/jpeg', 0.95);
          } catch (error) {
            reject(error);
          }
        };
        
        logo.onerror = () => {
          reject(new Error('Failed to load logo'));
        };
        
        logo.src = logoUrl;
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

