import {
  AftermovieAudioOptions,
  AftermovieOptions,
  AftermovieProgress,
  AftermovieResult,
  Photo,
  TransitionType,
} from '../types';
import { drawPngOverlay } from '../utils/imageOverlay';

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Opération annulée', 'AbortError');
  }
}

// Fonction utilitaire pour attendre avec support d'annulation
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException('Opération annulée', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function pickSupportedMimeType(preferred?: string): string {
  if (preferred && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(preferred)) {
    return preferred;
  }

  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];

  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

function sanitizeFilenamePart(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

// Dessin avec effet Ken Burns sur fond flou (Blur + Contain)
function drawImageWithKenBurns(
  ctx: CanvasRenderingContext2D,
  source: ImageBitmap | HTMLImageElement | HTMLVideoElement,
  targetW: number,
  targetH: number,
  progress: number, // 0.0 à 1.0
  kenBurnsParams: { scaleStart: number; scaleEnd: number; panX: number; panY: number }
): void {
  let srcW = 'videoWidth' in source ? source.videoWidth : ('width' in source ? source.width : (source as ImageBitmap).width);
  let srcH = 'videoHeight' in source ? source.videoHeight : ('height' in source ? source.height : (source as ImageBitmap).height);
  
  // Sécurité : si les dimensions ne sont pas encore disponibles (vidéo en cours de chargement)
  if (srcW === 0 || srcH === 0) {
    srcW = targetW;
    srcH = targetH;
  }

  // 1. Fond flou (Blurred Background)
  const coverScale = Math.max(targetW / srcW, targetH / srcH);
  
  // Appliquer Ken Burns sur le fond
  const currentZoomBg = kenBurnsParams.scaleStart + (kenBurnsParams.scaleEnd - kenBurnsParams.scaleStart) * progress;
  const finalScaleBg = coverScale * currentZoomBg * 1.2;

  const drawWBg = srcW * finalScaleBg;
  const drawHBg = srcH * finalScaleBg;

  let dxBg = (targetW - drawWBg) / 2;
  let dyBg = (targetH - drawHBg) / 2;

  dxBg += kenBurnsParams.panX * progress * (drawWBg - targetW) * 0.1;
  dyBg += kenBurnsParams.panY * progress * (drawHBg - targetH) * 0.1;

  ctx.save();
  ctx.filter = 'blur(20px) brightness(0.6)';
  ctx.drawImage(source as CanvasImageSource, dxBg, dyBg, drawWBg, drawHBg);
  ctx.restore();

  // 2. Image principale (Foreground Contain)
  const containScale = Math.min(targetW / srcW, targetH / srcH) * 0.9;
  
  const fgZoom = 1 + (progress * 0.05);
  const finalScaleFg = containScale * fgZoom;

  const drawWFg = srcW * finalScaleFg;
  const drawHFg = srcH * finalScaleFg;

  const dxFg = (targetW - drawWFg) / 2;
  const dyFg = (targetH - drawHFg) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  
  ctx.drawImage(source as CanvasImageSource, dxFg, dyFg, drawWFg, drawHFg);
  ctx.restore();
}

async function loadImageSourceFromUrl(url: string, signal?: AbortSignal): Promise<ImageBitmap | HTMLImageElement> {
  const res = await fetch(url, { mode: 'cors', signal });
  if (!res.ok) {
    throw new Error(`Impossible de charger l'image (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  assertNotAborted(signal);

  if ('createImageBitmap' in window) {
    return await createImageBitmap(blob);
  }

  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.src = objectUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossible de charger l'image"));
  });
  URL.revokeObjectURL(objectUrl);
  return img;
}

// Charge une vidéo et attend qu'elle soit prête à être jouée
async function loadVideoSource(url: string, signal?: AbortSignal): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Important pour Canvas
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto'; // Charger toute la vidéo si possible
    
    // Timeout de sécurité
    const timeout = setTimeout(() => {
        video.src = '';
        reject(new Error('Timeout chargement vidéo'));
    }, 30000);

    let resolved = false;
    const onLoaded = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        // Attendre un peu plus pour être sûr que les métadonnées sont prêtes
        setTimeout(() => resolve(video), 100);
    };

    const onCanPlay = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolve(video);
    };

    const onError = (e: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        video.src = '';
        reject(new Error(`Erreur chargement vidéo: ${e.message || 'unknown'}`));
    };

    video.onloadeddata = onLoaded;
    video.oncanplay = onCanPlay;
    video.onerror = onError;

    if (signal) {
        signal.addEventListener('abort', () => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);
            video.src = '';
            reject(new DOMException('Opération annulée', 'AbortError'));
        }, { once: true });
    }

    video.src = url;
    video.load();
  });
}

// Attend que la vidéo soit prête après un changement de currentTime
async function waitForVideoSeek(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Opération annulée', 'AbortError'));
      return;
    }

    const timeout = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve(); // Timeout : on continue quand même
    }, 500);

    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      // Petite attente supplémentaire pour que la frame soit vraiment prête
      setTimeout(resolve, 50);
    };

    video.addEventListener('seeked', onSeeked, { once: true });

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        reject(new DOMException('Opération annulée', 'AbortError'));
      }, { once: true });
    }
  });
}

function generateKenBurnsParams() {
  const zoomIn = Math.random() > 0.5;
  const scaleStart = zoomIn ? 1.0 : 1.15;
  const scaleEnd = zoomIn ? 1.15 : 1.0;
  const panX = (Math.random() - 0.5) * 2;
  const panY = (Math.random() - 0.5) * 2;
  return { scaleStart, scaleEnd, panX, panY };
}

// Helper pour dessiner un rectangle arrondi (compatible tous navigateurs)
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, width, height, radius);
    return;
  }
  
  // Fallback pour navigateurs plus anciens
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Affichage Légende "Cinéma" moderne avec design complet et professionnel
function drawCinematicLegend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  subtitle?: string
): void {
  // Gradient plus haut pour meilleure visibilité (35% de la hauteur)
  const gradientHeight = height * 0.35;
  
  // Gradient amélioré avec plus de profondeur et opacité
  const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.15, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.95)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.98)');

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  // Padding optimisé pour meilleure proportion
  const paddingX = width * 0.08;
  const paddingY = height * 0.06;
  
  // Zone de texte avec fond semi-transparent pour meilleure lisibilité
  const textAreaY = height - gradientHeight * 0.6;
  const textAreaHeight = gradientHeight * 0.5;
  
  // Fond subtil pour la zone de texte (optionnel, pour plus de contraste)
  ctx.globalAlpha = 0.3;
  const textBgGradient = ctx.createLinearGradient(
    paddingX, textAreaY,
    paddingX, textAreaY + textAreaHeight
  );
  textBgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  textBgGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  textBgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = textBgGradient;
  drawRoundedRect(ctx, paddingX, textAreaY, width - paddingX * 2, textAreaHeight, 16);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Titre avec taille optimisée (proportionnelle mais pas trop grande)
  const titleFontSize = Math.max(24, Math.min(48, Math.round(width * 0.032)));
  ctx.font = `700 ${titleFontSize}px "Inter", system-ui, -apple-system, sans-serif`;
  
  // Gradient élégant sur le texte pour effet premium
  const textGradient = ctx.createLinearGradient(
    width / 2 - width * 0.3, 
    height - paddingY - (subtitle ? titleFontSize * 1.2 : 0), 
    width / 2 + width * 0.3, 
    height - paddingY - (subtitle ? titleFontSize * 1.2 : 0)
  );
  textGradient.addColorStop(0, '#ffffff');
  textGradient.addColorStop(0.25, '#f8f8f8');
  textGradient.addColorStop(0.5, '#ffffff');
  textGradient.addColorStop(0.75, '#f8f8f8');
  textGradient.addColorStop(1, '#ffffff');
  
  ctx.fillStyle = textGradient;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const titleY = subtitle ? height - paddingY - (titleFontSize * 0.4) : height - paddingY;
  
  // Ombre portée prononcée pour le titre (multi-couches pour effet de profondeur)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  // Contour épais pour meilleure lisibilité
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(title, width / 2, titleY);
  
  // Ombre plus douce pour le remplissage
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.fillText(title, width / 2, titleY);

  if (subtitle) {
    // Sous-titre avec style élégant et taille proportionnée
    const subtitleFontSize = Math.max(16, Math.min(28, Math.round(width * 0.022)));
    ctx.font = `600 ${subtitleFontSize}px "Inter", system-ui, -apple-system, sans-serif`;
    
    // Gradient rose/violet pour le sous-titre avec effet glow
    const subtitleGradient = ctx.createLinearGradient(
      width / 2 - width * 0.2, 
      titleY - (titleFontSize * 0.7), 
      width / 2 + width * 0.2, 
      titleY - (titleFontSize * 0.7)
    );
    subtitleGradient.addColorStop(0, 'rgba(236, 72, 153, 1)');
    subtitleGradient.addColorStop(0.3, 'rgba(192, 132, 252, 1)');
    subtitleGradient.addColorStop(0.5, 'rgba(168, 85, 247, 1)');
    subtitleGradient.addColorStop(0.7, 'rgba(192, 132, 252, 1)');
    subtitleGradient.addColorStop(1, 'rgba(236, 72, 153, 1)');
    
    ctx.fillStyle = subtitleGradient;
    const subText = `📸 ${subtitle}`;
    const subtitleY = titleY - (titleFontSize * 0.7);
    
    // Ombre pour le sous-titre
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // Contour pour le sous-titre
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.strokeText(subText, width / 2, subtitleY);
    
    // Glow effect pour le sous-titre
    ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(subText, width / 2, subtitleY);
    
    // Remplissage final
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillText(subText, width / 2, subtitleY);
  }

  ctx.restore();
}

// Légende style bande dessinée avec design complet et professionnel
function drawComicBubble(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
): void {
  if (!text) return;

  // Dimensions optimisées pour un style professionnel (plus compact)
  const bubbleW = Math.min(width * 0.7, 600);
  const bubbleH = Math.max(60, Math.min(height * 0.1, 100));
  const x = (width - bubbleW) / 2;
  const y = height * 0.82; // Position basse pour style cinématique
  const borderRadius = 20; // Coins arrondis plus prononcés

  ctx.save();

  // Ombre portée externe pour effet de profondeur
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  // Fond avec gradient professionnel et effet de profondeur
  const bgGradient = ctx.createLinearGradient(x, y, x, y + bubbleH);
  bgGradient.addColorStop(0, 'rgba(20, 20, 30, 0.95)');
  bgGradient.addColorStop(0.3, 'rgba(15, 15, 25, 0.98)');
  bgGradient.addColorStop(0.5, 'rgba(10, 10, 20, 1)');
  bgGradient.addColorStop(0.7, 'rgba(15, 15, 25, 0.98)');
  bgGradient.addColorStop(1, 'rgba(20, 20, 30, 0.95)');
  
  drawRoundedRect(ctx, x, y, bubbleW, bubbleH, borderRadius);
  ctx.fillStyle = bgGradient;
  ctx.fill();

  // Bordure avec gradient pour effet premium
  ctx.shadowColor = 'transparent';
  const borderGradient = ctx.createLinearGradient(x, y, x, y + bubbleH);
  borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Ligne intérieure subtile pour plus de profondeur
  const innerY = y + 2;
  const innerH = bubbleH - 4;
  const innerW = bubbleW - 4;
  const innerX = x + 2;
  const innerRadius = borderRadius - 2;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
  ctx.stroke();

  // Texte avec typographie professionnelle
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Taille de police optimisée (proportionnelle mais pas trop grande)
  let fontSize = Math.max(20, Math.min(32, Math.round(height * 0.028)));
  ctx.font = `600 ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  
  // Ajuster la taille si le texte est trop long
  const textWidth = ctx.measureText(text).width;
  const maxTextWidth = bubbleW * 0.85;
  if (textWidth > maxTextWidth) {
    const scale = maxTextWidth / textWidth;
    fontSize = Math.max(16, Math.floor(fontSize * scale));
    ctx.font = `600 ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  }

  // Texte avec gradient élégant
  const textGradient = ctx.createLinearGradient(
    width / 2 - bubbleW * 0.3,
    y + bubbleH / 2,
    width / 2 + bubbleW * 0.3,
    y + bubbleH / 2
  );
  textGradient.addColorStop(0, '#ffffff');
  textGradient.addColorStop(0.25, '#f5f5f5');
  textGradient.addColorStop(0.5, '#ffffff');
  textGradient.addColorStop(0.75, '#f5f5f5');
  textGradient.addColorStop(1, '#ffffff');
  
  ctx.fillStyle = textGradient;
  
  // Ombre portée pour le texte (multi-couches)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  // Contour subtil pour le texte
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeText(text, width / 2, y + bubbleH / 2);
  
  // Ombre plus douce pour le remplissage
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillText(text, width / 2, y + bubbleH / 2);
  
  ctx.restore();
}

// Séquences de titre animées améliorées (Intro/Outro)
function drawTextSlide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  subtext: string = '',
  progress: number
): void {
  // Fond avec gradient animé et particules
  const time = progress * Math.PI * 2;
  const gradient = ctx.createRadialGradient(
    width / 2 + Math.sin(time * 0.5) * width * 0.2,
    height / 2 + Math.cos(time * 0.5) * height * 0.2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.8
  );
  
  // Gradient animé qui change de couleur
  const hueShift = Math.sin(time * 0.3) * 30;
  gradient.addColorStop(0, `hsl(${220 + hueShift}, 70%, 15%)`);
  gradient.addColorStop(0.5, `hsl(${240 + hueShift}, 60%, 12%)`);
  gradient.addColorStop(1, `hsl(${260 + hueShift}, 50%, 8%)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Particules animées en arrière-plan
  ctx.save();
  ctx.globalAlpha = 0.3;
  const particleCount = 30;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time;
    const radius = (width * 0.3) + Math.sin(time + i) * (width * 0.1);
    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    const size = 2 + Math.sin(time * 2 + i) * 1;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Animation d'opacité avec courbe d'ease in/out
  const easeInOut = (t: number) => t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
  
  const fadeIn = progress < 0.2 ? progress / 0.2 : 1;
  const fadeOut = progress > 0.8 ? (1 - progress) / 0.2 : 1;
  const opacity = Math.min(fadeIn, fadeOut) * easeInOut(Math.min(progress * 1.25, 1));

  // Animation de scale avec effet "bounce" subtil
  const scaleProgress = Math.min(progress * 1.2, 1);
  const bounce = 1 - Math.pow(1 - scaleProgress, 3);
  const scale = 0.8 + bounce * 0.25; // Scale de 0.8 à 1.05 avec bounce

  // Animation de position (slide up)
  const slideY = (1 - scaleProgress) * height * 0.1;

  ctx.save();
  ctx.translate(width / 2, height / 2 + slideY);
  ctx.scale(scale, scale);

  // Effet de glow pour le titre principal
  const glowIntensity = opacity * 0.8;
  
  // Titre principal avec glow
  ctx.shadowColor = `rgba(236, 72, 153, ${glowIntensity})`;
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.font = `800 ${Math.round(width * 0.08)}px "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  
  // Gradient animé sur le texte
  const textGradient = ctx.createLinearGradient(-width * 0.2, 0, width * 0.2, 0);
  textGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.9})`);
  textGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
  textGradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.9})`);
  
  ctx.fillStyle = textGradient;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const titleY = subtext ? -height * 0.08 : 0;
  ctx.fillText(text, 0, titleY);

  // Sous-titre avec animation décalée
  if (subtext) {
    const subtextDelay = Math.max(0, (progress - 0.15) * 1.2);
    const subtextOpacity = Math.min(subtextDelay, 1) * opacity;
    
    ctx.shadowColor = `rgba(236, 72, 153, ${subtextOpacity * 0.5})`;
    ctx.shadowBlur = 20;
    
    ctx.font = `500 ${Math.round(width * 0.035)}px "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
    
    // Gradient rose pour le sous-titre
    const subtextGradient = ctx.createLinearGradient(-width * 0.15, 0, width * 0.15, 0);
    subtextGradient.addColorStop(0, `rgba(236, 72, 153, ${subtextOpacity * 0.8})`);
    subtextGradient.addColorStop(0.5, `rgba(236, 72, 153, ${subtextOpacity})`);
    subtextGradient.addColorStop(1, `rgba(236, 72, 153, ${subtextOpacity * 0.8})`);
    
    ctx.fillStyle = subtextGradient;
    
    // Animation de slide pour le sous-titre
    const subtextSlideY = (1 - subtextDelay) * 20;
    ctx.fillText(subtext, 0, height * 0.08 + subtextSlideY);
  }

  ctx.restore();

  // Lignes décoratives animées
  ctx.save();
  ctx.strokeStyle = `rgba(236, 72, 153, ${opacity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.globalAlpha = opacity * 0.5;
  
  const lineLength = width * 0.2;
  const lineProgress = Math.min(progress * 1.5, 1);
  
  // Ligne gauche
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height / 2);
  ctx.lineTo(width * 0.1 + lineLength * lineProgress, height / 2);
  ctx.stroke();
  
  // Ligne droite
  ctx.beginPath();
  ctx.moveTo(width * 0.9, height / 2);
  ctx.lineTo(width * 0.9 - lineLength * lineProgress, height / 2);
  ctx.stroke();
  
  ctx.restore();
}

// Fonctions de transition entre photos
function drawTransition(
  ctx: CanvasRenderingContext2D,
  currentImage: ImageBitmap | HTMLImageElement | HTMLVideoElement,
  nextImage: ImageBitmap | HTMLImageElement | HTMLVideoElement | null,
  width: number,
  height: number,
  transitionProgress: number, // 0.0 à 1.0
  transitionType: TransitionType,
  kenBurnsCurrent: { scaleStart: number; scaleEnd: number; panX: number; panY: number },
  kenBurnsNext: { scaleStart: number; scaleEnd: number; panX: number; panY: number }
): void {
  if (transitionType === 'none' || !nextImage || transitionProgress <= 0) {
    // Pas de transition, dessiner seulement l'image actuelle
    drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
    return;
  }

  if (transitionProgress >= 1) {
    // Transition terminée, dessiner seulement l'image suivante
    drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
    return;
  }

  // Easing pour transitions fluides
  const easeInOut = (t: number) => t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const eased = easeInOut(transitionProgress);

  switch (transitionType) {
    case 'fade':
    case 'cross-fade': {
      // Fade: opacité de l'image actuelle diminue, opacité de la suivante augmente
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'slide-left': {
      // Slide left: image actuelle sort à gauche, image suivante entre depuis la droite
      const offset = eased * width;
      
      ctx.save();
      ctx.translate(-offset, 0);
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(width - offset, 0);
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'slide-right': {
      // Slide right: image actuelle sort à droite, image suivante entre depuis la gauche
      const offset = eased * width;
      
      ctx.save();
      ctx.translate(offset, 0);
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(offset - width, 0);
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'slide-up': {
      // Slide up: image actuelle sort en haut, image suivante entre depuis le bas
      const offset = eased * height;
      
      ctx.save();
      ctx.translate(0, -offset);
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(0, height - offset);
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'slide-down': {
      // Slide down: image actuelle sort en bas, image suivante entre depuis le haut
      const offset = eased * height;
      
      ctx.save();
      ctx.translate(0, offset);
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(0, offset - height);
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'zoom-in': {
      // Zoom in: image actuelle zoom out, image suivante zoom in
      const scaleCurrent = 1 + eased * 0.3; // Zoom out
      const scaleNext = 0.7 + eased * 0.3; // Zoom in
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scaleCurrent, scaleCurrent);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scaleNext, scaleNext);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'zoom-out': {
      // Zoom out: image actuelle zoom in, image suivante zoom out
      const scaleCurrent = 0.7 + (1 - eased) * 0.3; // Zoom in
      const scaleNext = 1 + (1 - eased) * 0.3; // Zoom out
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scaleCurrent, scaleCurrent);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scaleNext, scaleNext);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'wipe-left': {
      // Wipe left: masque qui révèle l'image suivante de droite à gauche
      const clipX = eased * width;
      
      // Image actuelle (partie visible)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width - clipX, height);
      ctx.clip();
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      // Image suivante (partie révélée)
      ctx.save();
      ctx.beginPath();
      ctx.rect(width - clipX, 0, clipX, height);
      ctx.clip();
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'wipe-right': {
      // Wipe right: masque qui révèle l'image suivante de gauche à droite
      const clipX = eased * width;
      
      // Image suivante (partie révélée)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, clipX, height);
      ctx.clip();
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      
      // Image actuelle (partie visible)
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, 0, width - clipX, height);
      ctx.clip();
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      break;
    }

    case 'rotate': {
      // Rotate: rotation 3D avec fade
      const rotationAngle = eased * Math.PI; // 0 à 180 degrés
      const scale = 0.8 + (1 - Math.abs(Math.cos(rotationAngle))) * 0.2; // Effet 3D
      
      // Image actuelle (rotation sortante)
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rotationAngle);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      // Image suivante (rotation entrante)
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rotationAngle - Math.PI);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'blur': {
      // Blur: transition avec effet de flou progressif
      const blurAmount = Math.sin(eased * Math.PI) * 20; // Flou max à mi-transition
      
      // Image actuelle (flou puis fade)
      ctx.save();
      if (blurAmount > 0) {
        ctx.filter = `blur(${blurAmount}px)`;
      }
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      // Image suivante (fade puis net)
      ctx.save();
      if (blurAmount > 0) {
        ctx.filter = `blur(${20 - blurAmount}px)`;
      }
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
    }

    case 'pixelate': {
      // Pixelate: effet pixelisé qui se transforme en image nette
      const pixelSize = Math.max(1, 20 * (1 - eased)); // Taille des pixels diminue
      
      // Image actuelle (pixelisée puis fade)
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      if (pixelSize > 1) {
        // Effet pixelisé: dessiner avec résolution réduite puis agrandir
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, Math.floor(width / pixelSize));
        tempCanvas.height = Math.max(1, Math.floor(height / pixelSize));
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(currentImage as CanvasImageSource, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
        } else {
          drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
        }
      } else {
        drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      }
      ctx.restore();
      
      // Image suivante (pixelisée puis nette)
      ctx.save();
      ctx.globalAlpha = eased;
      if (pixelSize > 1) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, Math.floor(width / pixelSize));
        tempCanvas.height = Math.max(1, Math.floor(height / pixelSize));
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(nextImage as CanvasImageSource, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
        } else {
          drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
        }
      } else {
        drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      }
      ctx.restore();
      break;
    }

    default:
      // Fallback: fade
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      drawImageWithKenBurns(ctx, currentImage, width, height, 0.5, kenBurnsCurrent);
      ctx.restore();
      
      ctx.save();
      ctx.globalAlpha = eased;
      drawImageWithKenBurns(ctx, nextImage, width, height, 0, kenBurnsNext);
      ctx.restore();
      break;
  }
}

// Liste des transitions disponibles (sans 'none')
const AVAILABLE_TRANSITIONS: TransitionType[] = [
  'fade',
  'cross-fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'zoom-in',
  'zoom-out',
  'wipe-left',
  'wipe-right',
  'rotate',
  'blur',
  'pixelate'
];

// Sélectionne une transition aléatoire
function getRandomTransition(): TransitionType {
  return AVAILABLE_TRANSITIONS[Math.floor(Math.random() * AVAILABLE_TRANSITIONS.length)];
}

async function createAudioTrackFromFile(
  audio: AftermovieAudioOptions,
  targetDurationSeconds: number,
  signal?: AbortSignal
): Promise<{ track: MediaStreamTrack; cleanup: () => void }> {
  assertNotAborted(signal);

  const audioContext = new AudioContext();
  await audioContext.resume();

  const arrayBuffer = await audio.file.arrayBuffer();
  assertNotAborted(signal);

  const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  assertNotAborted(signal);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = audio.loop;

  const gain = audioContext.createGain();
  gain.gain.value = Math.min(1, Math.max(0, audio.volume));

  const dest = audioContext.createMediaStreamDestination();
  source.connect(gain);
  gain.connect(dest);

  source.start(0);

  if (!audio.loop && buffer.duration > targetDurationSeconds) {
     gain.gain.setValueAtTime(audio.volume, targetDurationSeconds - 2);
     gain.gain.linearRampToValueAtTime(0, targetDurationSeconds);
     source.stop(targetDurationSeconds);
  }

  const track = dest.stream.getAudioTracks()[0];
  if (!track) {
    await audioContext.close();
    throw new Error("Impossible d'ajouter la piste audio (audio track introuvable)");
  }

  const cleanup = () => {
    try {
      source.disconnect();
      gain.disconnect();
      track.stop();
    } catch {}
    void audioContext.close();
  };

  return { track, cleanup };
}

export async function generateTimelapseAftermovie(
  photos: Photo[],
  options: AftermovieOptions,
  audio?: AftermovieAudioOptions,
  onProgress?: (p: AftermovieProgress) => void,
  signal?: AbortSignal
): Promise<AftermovieResult> {
  if (photos.length === 0) throw new Error('Aucune photo sélectionnée');
  
  if (options.width <= 0 || options.height <= 0) throw new Error('Résolution invalide');
  if (options.fps <= 0 || options.fps > 60) throw new Error('FPS invalide');

  assertNotAborted(signal);

  // Cache optimisé pour les médias déjà chargés
  // Utilise ImageBitmap pour meilleures performances (moins de mémoire, plus rapide)
  const mediaCache = new Map<string, ImageBitmap | HTMLImageElement | HTMLVideoElement>();
  const frameOverlayCache = new Map<string, ImageBitmap | HTMLImageElement>();
  
  // Préchargement des images en parallèle (améliore les performances)
  const preloadMedia = async (photoUrls: string[], signal?: AbortSignal): Promise<void> => {
    const loadPromises = photoUrls.slice(0, 10).map(async (url) => { // Précharger les 10 premières
      if (mediaCache.has(url)) return; // Déjà en cache
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) return;
        const blob = await response.blob();
        if ('createImageBitmap' in window) {
          const bitmap = await createImageBitmap(blob);
          mediaCache.set(url, bitmap);
        } else {
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          mediaCache.set(url, img);
        }
      } catch (err) {
        // Ignorer les erreurs de préchargement (sera chargé plus tard si nécessaire)
        if (err instanceof Error && err.name !== 'AbortError') {
          console.warn(`Erreur préchargement ${url}:`, err);
        }
      }
    });
    await Promise.all(loadPromises);
  };
  
  // Précharger les premières photos en arrière-plan
  if (photos.length > 0) {
    const firstPhotos = photos.slice(0, Math.min(10, photos.length)).map(p => p.url);
    preloadMedia(firstPhotos, signal).catch(() => {
      // Ignorer les erreurs de préchargement
    });
  }

  const INTRO_DURATION = options.enableIntroOutro ? 3000 : 0;
  const OUTRO_DURATION = options.enableIntroOutro ? 4000 : 0;
  
  const useRandomTransitions = options.randomTransitions || false;
  const baseTransitionType = options.transitionType || 'none';
  const transitionDuration = options.transitionDuration || 500;
  const hasTransitions = (baseTransitionType !== 'none' || useRandomTransitions) && photos.length > 1;
  
  // Pré-générer les transitions aléatoires pour chaque transition si activé
  const transitionTypes: TransitionType[] = [];
  if (hasTransitions) {
    for (let i = 0; i < photos.length - 1; i++) {
      if (useRandomTransitions) {
        transitionTypes.push(getRandomTransition());
      } else {
        transitionTypes.push(baseTransitionType);
      }
    }
  }
  
  const photoDurations = photos.map(p => {
    if (options.enableSmartDuration) {
      const bonus = Math.min(2000, (p.likes_count || 0) * 500);
      // Pour les vidéos, on peut être plus généreux si elles sont longues
      const baseDuration = p.type === 'video' ? Math.max(options.msPerPhoto, 4000) : options.msPerPhoto; 
      return baseDuration + bonus;
    }
    // Durée fixe : pour vidéo on force au moins 3s si c'est trop court
    if (p.type === 'video') return Math.max(options.msPerPhoto, 3000);
    return options.msPerPhoto;
  });

  // Ajuster les durées pour inclure les transitions (soustraire la durée de transition de chaque photo sauf la dernière)
  const adjustedDurations = photoDurations.map((duration, index) => {
    if (hasTransitions && index < photos.length - 1) {
      // La transition prend du temps sur la photo actuelle
      return Math.max(duration - transitionDuration, duration * 0.5);
    }
    return duration;
  });

  const totalPhotosDuration = adjustedDurations.reduce((a, b) => a + b, 0);
  const totalDurationMs = INTRO_DURATION + totalPhotosDuration + OUTRO_DURATION;
  const durationSeconds = totalDurationMs / 1000;

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context indisponible');

  const mimeType = pickSupportedMimeType(options.mimeType);
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder non supporté');
  }

  const videoStream = canvas.captureStream(options.fps);
  const videoTrack = videoStream.getVideoTracks()[0];
  
  let audioCleanup: (() => void) | undefined;
  let combinedStream: MediaStream = videoStream;
  
  if (audio) {
    onProgress?.({ stage: 'loading', processed: 0, total: photos.length, message: 'Préparation audio…' });
    const { track, cleanup } = await createAudioTrackFromFile(audio, durationSeconds, signal);
    audioCleanup = cleanup;
    combinedStream = new MediaStream([videoTrack, track]);
  }

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: mimeType || undefined,
    videoBitsPerSecond: options.videoBitsPerSecond,
    audioBitsPerSecond: audio ? 128_000 : undefined
  });

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onerror = () => reject(new Error('Erreur MediaRecorder'));
    recorder.onstop = () => resolve();
  });

  recorder.start();

  try {
    const frameInterval = 1000 / options.fps;
    
    const waitForNextFrame = async (startTime: number) => {
        const elapsed = performance.now() - startTime;
        const delay = Math.max(0, frameInterval - elapsed);
        await sleep(delay, signal);
    };

    // --- INTRO ---
    if (options.enableIntroOutro) {
        onProgress?.({ stage: 'rendering', processed: 0, total: photos.length, message: 'Génération Intro…' });
        const introFrames = Math.round((INTRO_DURATION / 1000) * options.fps);
        
        for (let f = 0; f < introFrames; f++) {
            const startFrameTime = performance.now();
            drawTextSlide(ctx, options.width, options.height, options.titleText || 'Aftermovie', new Date().toLocaleDateString(), f / introFrames);
            await waitForNextFrame(startFrameTime);
        }
    }

    // --- PHOTOS & VIDEOS ---
    let nextMediaSource: ImageBitmap | HTMLImageElement | HTMLVideoElement | null = null;
    let nextVideoDuration = 0;
    let nextKenBurns: { scaleStart: number; scaleEnd: number; panX: number; panY: number } | null = null;
    let nextFrameOverlay: ImageBitmap | HTMLImageElement | null = null;
    
    for (let i = 0; i < photos.length; i++) {
        assertNotAborted(signal);
        const photo = photos[i];
        const duration = adjustedDurations[i];
        const frames = Math.round((duration / 1000) * options.fps);
        const transitionFrames = hasTransitions && i < photos.length - 1 
            ? Math.round((transitionDuration / 1000) * options.fps) 
            : 0;
        
        // Utiliser nextMediaSource si disponible (de l'itération précédente), sinon charger
        let mediaSource: ImageBitmap | HTMLImageElement | HTMLVideoElement;
        let videoDuration = 0;
        let kenBurns: { scaleStart: number; scaleEnd: number; panX: number; panY: number };
        let frameOverlay: ImageBitmap | HTMLImageElement | null = null;
        
        if (nextMediaSource) {
            // Réutiliser la photo suivante chargée lors de l'itération précédente
            mediaSource = nextMediaSource;
            videoDuration = nextVideoDuration;
            kenBurns = nextKenBurns || generateKenBurnsParams();
            frameOverlay = nextFrameOverlay;
            // Réinitialiser pour la prochaine itération
            nextMediaSource = null;
            nextVideoDuration = 0;
            nextKenBurns = null;
            nextFrameOverlay = null;
        } else {
            // Charger la photo actuelle (avec cache)
            kenBurns = generateKenBurnsParams();

            onProgress?.({ stage: 'loading', processed: i, total: photos.length, message: `Chargement ${i + 1}/${photos.length}…` });

            // Vérifier le cache
            if (mediaCache.has(photo.url)) {
                mediaSource = mediaCache.get(photo.url)!;
                if (mediaSource instanceof HTMLVideoElement) {
                    videoDuration = mediaSource.duration || 0;
                }
            } else {
                if (photo.type === 'video') {
                    try {
                        const videoEl = await loadVideoSource(photo.url, signal);
                        mediaSource = videoEl;
                        videoDuration = videoEl.duration || 0;
                        
                        // Si la durée n'est pas encore disponible, attendre un peu
                        if (videoDuration === 0 || !isFinite(videoDuration)) {
                            await sleep(500, signal);
                            videoDuration = videoEl.duration || 0;
                        }
                        
                        // Si toujours pas de durée, utiliser une durée par défaut
                        if (videoDuration === 0 || !isFinite(videoDuration)) {
                            videoDuration = duration / 1000; // Utiliser la durée du slot comme fallback
                        }
                        
                        // Mettre en cache
                        mediaCache.set(photo.url, videoEl);
                    } catch (err) {
                        console.error(`Erreur chargement vidéo ${photo.id}:`, err);
                        onProgress?.({ 
                            stage: 'rendering', 
                            processed: i + 1, 
                            total: photos.length, 
                            message: `Erreur vidéo ${i + 1}, passage à la suivante…` 
                        });
                        continue; // Skip si erreur
                    }
                } else {
                    mediaSource = await loadImageSourceFromUrl(photo.url, signal);
                    // Mettre en cache
                    mediaCache.set(photo.url, mediaSource);
                }
            }

            if (options.includeDecorativeFrame && options.decorativeFrameUrl) {
                // Vérifier le cache pour le cadre
                if (frameOverlayCache.has(options.decorativeFrameUrl)) {
                    frameOverlay = frameOverlayCache.get(options.decorativeFrameUrl)!;
                } else {
                    try {
                        frameOverlay = await loadImageSourceFromUrl(options.decorativeFrameUrl, signal);
                        frameOverlayCache.set(options.decorativeFrameUrl, frameOverlay);
                    } catch {}
                }
            }
        }

        // Charger la photo suivante en avance pour les transitions (avec cache)
        if (hasTransitions && i < photos.length - 1 && !nextMediaSource) {
            const nextPhoto = photos[i + 1];
            try {
                // Vérifier le cache
                if (mediaCache.has(nextPhoto.url)) {
                    nextMediaSource = mediaCache.get(nextPhoto.url)!;
                    if (nextMediaSource instanceof HTMLVideoElement) {
                        nextVideoDuration = nextMediaSource.duration || 0;
                    }
                } else {
                    if (nextPhoto.type === 'video') {
                        const nextVideoEl = await loadVideoSource(nextPhoto.url, signal);
                        nextMediaSource = nextVideoEl;
                        nextVideoDuration = nextVideoEl.duration || 0;
                        if (nextVideoDuration === 0 || !isFinite(nextVideoDuration)) {
                            await sleep(500, signal);
                            nextVideoDuration = nextVideoEl.duration || 0;
                        }
                        mediaCache.set(nextPhoto.url, nextVideoEl);
                    } else {
                        nextMediaSource = await loadImageSourceFromUrl(nextPhoto.url, signal);
                        mediaCache.set(nextPhoto.url, nextMediaSource);
                    }
                }
                nextKenBurns = generateKenBurnsParams();
                if (options.includeDecorativeFrame && options.decorativeFrameUrl) {
                    // Vérifier le cache pour le cadre
                    if (frameOverlayCache.has(options.decorativeFrameUrl)) {
                        nextFrameOverlay = frameOverlayCache.get(options.decorativeFrameUrl)!;
                    } else {
                        try {
                            nextFrameOverlay = await loadImageSourceFromUrl(options.decorativeFrameUrl, signal);
                            frameOverlayCache.set(options.decorativeFrameUrl, nextFrameOverlay);
                        } catch {}
                    }
                }
            } catch (err) {
                console.error(`Erreur chargement photo suivante ${nextPhoto.id}:`, err);
                // Continuer sans transition si erreur
            }
        }

        onProgress?.({ stage: 'rendering', processed: i + 1, total: photos.length, message: `Rendu ${photo.type} ${i + 1}…` });

        for (let f = 0; f < frames; f++) {
            const startFrameTime = performance.now();
            const progress = f / frames;
            const isInTransition = hasTransitions && i < photos.length - 1 && f >= frames - transitionFrames;
            const transitionProgress = isInTransition 
                ? (f - (frames - transitionFrames)) / transitionFrames 
                : 0;

            // Gestion Vidéo : Avancer le temps
            if (photo.type === 'video' && mediaSource instanceof HTMLVideoElement) {
                // Vérifier que la vidéo est prête
                if (mediaSource.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                    // Attendre que la vidéo soit prête
                    await new Promise<void>((resolve) => {
                        const onCanPlay = () => {
                            mediaSource.removeEventListener('canplay', onCanPlay);
                            resolve();
                        };
                        mediaSource.addEventListener('canplay', onCanPlay);
                        setTimeout(resolve, 1000); // Timeout de sécurité
                    });
                }
                
                // Mode Timelapse dynamique :
                // Si la vidéo dure 10s et le slot 4s => vitesse x2.5
                // Limite vitesse max x5 pour pas que ce soit ridicule
                let playbackRate = 1.0;
                if (videoDuration > 0 && isFinite(videoDuration)) {
                    const slotSec = duration / 1000;
                    playbackRate = videoDuration / slotSec;
                    if (playbackRate > 5) playbackRate = 5; // Cap speed
                    if (playbackRate < 0.5) playbackRate = 0.5; // Cap slow
                }

                const targetTime = (f / options.fps) * playbackRate;
                
                // Bouclage si on dépasse la fin de la vidéo
                const clampedTime = targetTime % (videoDuration || 1);
                
                // Changer le temps ET attendre que la frame soit prête
                if (Math.abs(mediaSource.currentTime - clampedTime) > 0.1) {
                    mediaSource.currentTime = clampedTime;
                    await waitForVideoSeek(mediaSource, signal);
                }
            }

            // Clear
            ctx.fillStyle = options.backgroundColor || '#000000';
            ctx.fillRect(0, 0, options.width, options.height);

            // Draw Media avec transition si nécessaire
            if (isInTransition && nextMediaSource) {
                // Utiliser la transition spécifique pour cette photo (ou aléatoire)
                const currentTransition = useRandomTransitions && i < transitionTypes.length 
                    ? transitionTypes[i] 
                    : (baseTransitionType !== 'none' ? baseTransitionType : 'fade');
                
                drawTransition(
                    ctx,
                    mediaSource,
                    nextMediaSource,
                    options.width,
                    options.height,
                    transitionProgress,
                    currentTransition,
                    kenBurns,
                    nextKenBurns || { scaleStart: 1, scaleEnd: 1, panX: 0, panY: 0 }
                );
            } else {
                // Draw Media (Blur BG + Contain FG)
                if (options.enableKenBurns) {
                    drawImageWithKenBurns(ctx, mediaSource, options.width, options.height, progress, kenBurns);
                } else {
                    drawImageWithKenBurns(ctx, mediaSource, options.width, options.height, 0, { scaleStart: 1, scaleEnd: 1, panX: 0, panY: 0 });
                }
            }

            // Draw Overlays: Comics OR Standard Title (seulement sur l'image actuelle, pas pendant la transition)
            if (!isInTransition) {
                if (options.enableComicsStyle && photo.caption) {
                    drawComicBubble(ctx, options.width, options.height, photo.caption);
                } else if (options.includeTitle) {
                    if (photo.caption) {
                        drawCinematicLegend(ctx, options.width, options.height, photo.caption, photo.author);
                    } else if (options.titleText) {
                        drawCinematicLegend(ctx, options.width, options.height, options.titleText, photo.author);
                    }
                }
            }

            // Draw Frame Overlay
            const overlayToUse = isInTransition && nextFrameOverlay ? nextFrameOverlay : frameOverlay;
            if (overlayToUse) {
                ctx.drawImage(overlayToUse as CanvasImageSource, 0, 0, options.width, options.height);
            }

            await waitForNextFrame(startFrameTime);
        }
        
        // Cleanup vidéo actuelle (seulement si on ne la réutilise pas pour la prochaine itération)
        // Si nextMediaSource existe, c'est qu'on l'a déjà chargée et on va la réutiliser
        // Sinon, on nettoie la vidéo actuelle
        if (photo.type === 'video' && mediaSource instanceof HTMLVideoElement) {
            // Si la vidéo suivante n'est pas la même que la vidéo actuelle, on nettoie
            if (!nextMediaSource || nextMediaSource !== mediaSource) {
                mediaSource.src = '';
                mediaSource.remove();
            }
        }
    }

    // --- OUTRO ---
    if (options.enableIntroOutro) {
        onProgress?.({ stage: 'rendering', processed: photos.length, total: photos.length, message: 'Génération Outro…' });
        const outroFrames = Math.round((OUTRO_DURATION / 1000) * options.fps);
        
        for (let f = 0; f < outroFrames; f++) {
            const startFrameTime = performance.now();
            drawTextSlide(ctx, options.width, options.height, 'Merci !', 'Live Party Wall', f / outroFrames);
            await waitForNextFrame(startFrameTime);
        }
        
        // Attendre un peu pour s'assurer que toutes les frames de l'outro sont capturées
        const frameInterval = 1000 / options.fps;
        await sleep(frameInterval * 2, signal);
    }

    onProgress?.({ stage: 'encoding', processed: photos.length, total: photos.length, message: 'Finalisation…' });
    
    // Attendre encore un peu avant d'arrêter pour s'assurer que tout est capturé
    await sleep(500, signal);
    
    recorder.stop();
    await stopped;

    const finalMime = (mimeType || recorder.mimeType || 'video/webm').trim() || 'video/webm';
    const blob = new Blob(chunks, { type: finalMime });
    const titlePart = options.titleText ? sanitizeFilenamePart(options.titleText) : 'aftermovie';
    const filename = `${titlePart}_${new Date().toISOString().slice(0, 10)}.webm`;

    onProgress?.({ stage: 'done', processed: photos.length, total: photos.length, message: 'Terminé !' });
    
    return { blob, mimeType: finalMime, filename, durationSeconds };

  } finally {
    try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
    try { videoTrack.stop(); } catch {}
    audioCleanup?.();
  }
}
