import { logger } from './logger';

/**
 * Crée un effet boomerang (lecture avant/arrière) à partir d'une vidéo
 * @param videoBlob - Blob de la vidéo originale
 * @returns Promise résolue avec le Blob de la vidéo boomerang
 */
export const createBoomerangVideo = async (videoBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible d\'obtenir le contexte canvas');
      }

      const videoUrl = URL.createObjectURL(videoBlob);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Définir la taille du canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const fps = 30; // FPS cible pour la vidéo de sortie
        const duration = video.duration;
        const frameTime = 1 / fps;
        
        // Créer un MediaRecorder pour enregistrer la vidéo
        const stream = canvas.captureStream(fps);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm') 
          ? 'video/webm' 
          : 'video/mp4';
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2500000 // 2.5 Mbps
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          URL.revokeObjectURL(videoUrl);
          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          logger.error('Error in MediaRecorder', error, { component: 'boomerangVideo', action: 'createBoomerangVideo' });
          URL.revokeObjectURL(videoUrl);
          reject(new Error('Erreur lors de l\'enregistrement de la vidéo boomerang'));
        };

        mediaRecorder.start();

        // Fonction pour dessiner une frame à un temps donné
        const drawFrameAtTime = (time: number): Promise<void> => {
          return new Promise((frameResolve) => {
            const seekHandler = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              video.removeEventListener('seeked', seekHandler);
              frameResolve();
            };
            video.addEventListener('seeked', seekHandler);
            video.currentTime = Math.min(time, duration);
          });
        };

        // Fonction principale pour créer la vidéo boomerang
        const createBoomerang = async () => {
          try {
            const totalFrames = Math.ceil(duration * fps);
            const frameDelay = 1000 / fps; // Délai entre chaque frame en ms

            // Phase 1 : Lecture normale
            for (let i = 0; i < totalFrames; i++) {
              const t = (i / totalFrames) * duration;
              await drawFrameAtTime(t);
              await new Promise(resolve => setTimeout(resolve, frameDelay));
            }

            // Phase 2 : Lecture inverse
            for (let i = totalFrames - 1; i >= 0; i--) {
              const t = (i / totalFrames) * duration;
              await drawFrameAtTime(t);
              await new Promise(resolve => setTimeout(resolve, frameDelay));
            }

            // Attendre un peu pour s'assurer que toutes les frames sont enregistrées
            setTimeout(() => {
              mediaRecorder.stop();
            }, 500);
          } catch (error) {
            logger.error('Error creating boomerang frames', error, { component: 'boomerangVideo', action: 'createBoomerang' });
            mediaRecorder.stop();
            URL.revokeObjectURL(videoUrl);
            reject(error instanceof Error ? error : new Error('Erreur lors de la création des frames boomerang'));
          }
        };

        // Démarrer la création
        createBoomerang();
      };

      video.onerror = (error) => {
        URL.revokeObjectURL(videoUrl);
        logger.error('Error loading video for boomerang', error, { component: 'boomerangVideo', action: 'createBoomerangVideo' });
        reject(new Error('Erreur lors du chargement de la vidéo'));
      };

      video.load();
    } catch (error) {
      logger.error('Error creating boomerang video', error, { component: 'boomerangVideo', action: 'createBoomerangVideo' });
      reject(error instanceof Error ? error : new Error('Erreur lors de la création de la vidéo boomerang'));
    }
  });
};

