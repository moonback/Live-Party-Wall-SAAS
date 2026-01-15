import React, { useState, useRef, useEffect } from 'react';
import { createCollage, CollageTemplate, getTemplatesForImageCount } from '../utils/collageUtils';
import { addPhotoToWall } from '../services/photoService';
import { generateImageCaption } from '../services/geminiService';
import { isImageAppropriate } from '../services/aiModerationService';
import { Photo } from '../types';
import { CAMERA_VIDEO_CONSTRAINTS, MAX_AUTHOR_NAME_LENGTH, MAX_USER_DESCRIPTION_LENGTH, MIN_COLLAGE_PHOTOS, MAX_COLLAGE_PHOTOS, COLLAGE_GAP } from '../constants';
import { useToast } from '../context/ToastContext';
import { useEvent } from '../context/EventContext';
import { useDemoLimit } from '../hooks/useDemoLimit';
import { validateAuthorName } from '../utils/validation';
import { Camera, X, Grid3x3, LayoutGrid, Square, RotateCcw, Upload, ArrowLeft, FlipHorizontal, Zap, GripVertical, Download } from 'lucide-react';
import { getSettings, subscribeToSettings, EventSettings, defaultSettings } from '../services/settingsService';
import { drawPngOverlay } from '../utils/imageOverlay';
import { useAdaptiveCameraResolution } from '../hooks/useAdaptiveCameraResolution';

interface CollageModeProps {
  onCollageUploaded: (photo: Photo) => void;
  onBack: () => void;
}

const CollageMode: React.FC<CollageModeProps> = ({ onCollageUploaded, onBack }) => {
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  const { isLimitReached, photosCount, maxPhotos } = useDemoLimit();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate>('2x2');
  const [previewCollage, setPreviewCollage] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('party_user_name') || '';
  });
  const [userDescription, setUserDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [eventSettings, setEventSettings] = useState<EventSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isBurstMode, setIsBurstMode] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const burstModeRef = useRef(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [captureAnimation, setCaptureAnimation] = useState<number | null>(null);

  useAdaptiveCameraResolution(videoRef as React.RefObject<HTMLVideoElement>, stream, {
    preferredWidth: 1920,
    preferredHeight: 1080,
    fallbackWidth: 1280,
    fallbackHeight: 720
  });

  // Charger les settings
  useEffect(() => {
    if (!currentEvent?.id) return;
    
    setMounted(true);
    let mounted = true;
    getSettings(currentEvent.id)
      .then((s: EventSettings) => {
        if (mounted) {
          setEventSettings(s);
        }
      })
      .catch((e) => console.error(e));

    const sub = subscribeToSettings(currentEvent.id, (s: EventSettings) => {
      setEventSettings(s);
    });
    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, [currentEvent?.id]);

  // Démarrer la caméra
  const startCamera = async (preferredFacingMode?: 'user' | 'environment') => {
    try {
      const mode = preferredFacingMode || facingMode;
      const constraints: MediaStreamConstraints = {
        video: {
          ...CAMERA_VIDEO_CONSTRAINTS,
          facingMode: mode
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setFacingMode(mode);
      setCameraError(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(true);
      addToast("Impossible d'accéder à la caméra", 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleSwitchCamera = () => {
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextFacingMode);
  };

  // Démarrer le compte à rebours
  const initiatePhotoCapture = () => {
    if (isLimitReached) {
      addToast(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      return;
    }

    if (capturedImages.length >= MAX_COLLAGE_PHOTOS) {
      addToast(`Maximum ${MAX_COLLAGE_PHOTOS} photos autorisées`, 'error');
      return;
    }
    if (isBurstMode) {
      setCountdown(2); // Countdown de 2 secondes pour le mode rafale
    } else {
      setCountdown(3);
    }
  };

  useEffect(() => {
    if (countdown === null) return undefined;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      capturePhoto();
      setCountdown(null);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Capturer une photo
  const capturePhoto = async () => {
    if (isLimitReached) {
      addToast(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      return;
    }

    setFlash(true);
    setCaptureAnimation(capturedImages.length);
    setTimeout(() => setFlash(false), 500);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Utiliser les dimensions originales de la vidéo sans redimensionnement
      const width = video.videoWidth;
      const height = video.videoHeight;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // Overlay PNG (cadre décoratif) au moment de la capture
        if (eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url) {
          try {
            await drawPngOverlay(ctx, eventSettings.decorative_frame_url, width, height);
          } catch (e) {
            console.warn('Overlay frame draw failed:', e);
          }
        }
        // Utiliser la qualité maximale (1.0) sans compression
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const newImages = [...capturedImages, dataUrl];
        const newImageCount = newImages.length;
        setCapturedImages(newImages);
        
        // Mode rafale : continuer la capture
        if (isBurstMode && burstModeRef.current) {
          const newBurstCount = burstCount + 1;
          setBurstCount(newBurstCount);
          
          // Vérifier si on peut continuer (on a capturé moins que le maximum)
          // Utiliser newImageCount qui est la valeur locale correcte
          if (newImageCount < MAX_COLLAGE_PHOTOS) {
            // Continuer le mode rafale après un court délai
            setTimeout(() => {
              // Vérifier que le mode rafale est toujours actif via le ref
              // et vérifier le nombre d'images actuel depuis l'état
              setCapturedImages(currentImages => {
                if (burstModeRef.current && currentImages.length < MAX_COLLAGE_PHOTOS) {
                  setCountdown(2); // Countdown de 2 secondes pour la prochaine photo
                } else {
                  // On a atteint le maximum ou le mode rafale a été désactivé
                  burstModeRef.current = false;
                  setIsBurstMode(false);
                  setBurstCount(0);
                  if (currentImages.length >= MAX_COLLAGE_PHOTOS) {
                    addToast('Mode rafale terminé !', 'success');
                  }
                }
                return currentImages; // Ne pas modifier l'état
              });
            }, 600);
          } else {
            // On a atteint le maximum
            burstModeRef.current = false;
            setIsBurstMode(false);
            setBurstCount(0);
            addToast('Mode rafale terminé !', 'success');
            // La prévisualisation sera générée automatiquement via le useEffect
          }
        }
      }
    }
  };

  // Supprimer une photo capturée
  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewCollage(null);
  };

  // Réinitialiser toutes les photos
  const resetAll = () => {
    setCapturedImages([]);
    setPreviewCollage(null);
    setSelectedTemplate('2x2');
    setAuthorName('');
    setUserDescription('');
    burstModeRef.current = false;
    setIsBurstMode(false);
    setBurstCount(0);
  };

  // Mode rafale : capture rapide de plusieurs photos
  const startBurstMode = () => {
    if (capturedImages.length >= MAX_COLLAGE_PHOTOS) {
      addToast(`Maximum ${MAX_COLLAGE_PHOTOS} photos autorisées`, 'error');
      return;
    }
    burstModeRef.current = true;
    setIsBurstMode(true);
    setBurstCount(0);
    initiatePhotoCapture(); // Démarrer la première capture
  };

  // Réorganisation par drag & drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newImages = [...capturedImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setCapturedImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Animation de capture
  useEffect(() => {
    if (captureAnimation !== null) {
      const timer = setTimeout(() => setCaptureAnimation(null), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [captureAnimation]);

  // Générer la prévisualisation du collage
  useEffect(() => {
    // En mode rafale, ne pas générer la prévisualisation pendant la capture
    // Elle sera générée automatiquement à la fin du mode rafale
    if (isBurstMode) {
      // Ne pas supprimer la prévisualisation existante si elle existe déjà
      return;
    }
    
    if (capturedImages.length >= MIN_COLLAGE_PHOTOS) {
      const generatePreview = async () => {
        try {
          const collage = await createCollage(capturedImages, selectedTemplate, COLLAGE_GAP);
          setPreviewCollage(collage);
        } catch (error) {
          console.error('Erreur lors de la génération du collage:', error);
          addToast('Erreur lors de la création du collage', 'error');
        }
      };
      generatePreview();
    } else {
      setPreviewCollage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImages, selectedTemplate, isBurstMode]);

  // Mettre à jour le template selon le nombre d'images
  useEffect(() => {
    if (capturedImages.length >= MIN_COLLAGE_PHOTOS) {
      const availableTemplates = getTemplatesForImageCount(capturedImages.length);
      if (!availableTemplates.includes(selectedTemplate)) {
        setSelectedTemplate(availableTemplates[0] || '2x2');
      }
    }
  }, [capturedImages.length, selectedTemplate]);

  // Démarrer la caméra quand nécessaire
  useEffect(() => {
    if (capturedImages.length < MAX_COLLAGE_PHOTOS && !cameraError) {
      startCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImages.length]);

  // Uploader le collage
  const handleUpload = async () => {
    if (isLimitReached) {
      addToast(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      return;
    }

    if (!previewCollage) {
      addToast('Veuillez créer un collage d\'abord', 'error');
      return;
    }

    if (capturedImages.length < MIN_COLLAGE_PHOTOS) {
      addToast(`Veuillez capturer au moins ${MIN_COLLAGE_PHOTOS} photos`, 'error');
      return;
    }

    const validation = validateAuthorName(authorName);
    if (!validation.valid) {
      addToast(validation.error || 'Nom invalide', 'error');
      return;
    }

    setLoading(true);
    // Afficher le message d'analyse IA seulement si la génération de légende est activée
    if (eventSettings.caption_generation_enabled) {
      setLoadingStep('Vérification de la photo...');
    } else {
      setLoadingStep('Traitement du collage...');
    }

    try {
      // Modération IA (toujours activée)
      const moderation = await isImageAppropriate(previewCollage);
      if (!moderation.approved) {
        addToast(
          moderation.reason || 'Cette photo ne respecte pas les règles de modération',
          'error'
        );
        setLoading(false);
        return;
      }

      // Générer la légende seulement si activée dans les paramètres
      let caption = '';
      if (eventSettings.caption_generation_enabled) {
        setLoadingStep('Génération de la légende...');
        caption = await generateImageCaption(previewCollage, eventSettings.event_context, authorName, undefined);
      }

      if (!currentEvent) {
        addToast("Aucun événement sélectionné", 'error');
        setLoading(false);
        return;
      }
      setLoadingStep('Upload en cours...');
      const photo = await addPhotoToWall(
        currentEvent.id, 
        previewCollage, 
        caption, 
        authorName,
        undefined, // tags
        userDescription.trim() || undefined
      );

      addToast('Collage ajouté au mur ! 🎉', 'success');
      onCollageUploaded(photo);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      addToast('Erreur lors de l\'upload du collage', 'error');
      setLoading(false);
    }
  };

  const availableTemplates = getTemplatesForImageCount(capturedImages.length);
  const canCaptureMore = capturedImages.length < MAX_COLLAGE_PHOTOS;
  const canCreateCollage = capturedImages.length >= MIN_COLLAGE_PHOTOS;

  const getTemplateIcon = (template: CollageTemplate) => {
    switch (template) {
      case '2x2':
        return <Grid3x3 className="w-4 h-4" />;
      case '1+3':
      case '3+1':
      case '1+2':
      case '2+1':
        return <LayoutGrid className="w-4 h-4" />;
      case '2+2':
        return <Square className="w-4 h-4" />;
      default:
        return <Grid3x3 className="w-4 h-4" />;
    }
  };

  const getTemplateLabel = (template: CollageTemplate): string => {
    const labels: Record<CollageTemplate, string> = {
      '2x2': '2x2',
      '1+3': '1+3',
      '3+1': '3+1',
      '2+2': '2+2',
      '1+2': '1+2',
      '2+1': '2+1',
    };
    return labels[template];
  };

  return (
    <div 
      className="min-h-screen w-full bg-slate-950 text-white relative overflow-x-hidden"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Alerte limite atteinte */}
      {isLimitReached && (
        <div className="w-full px-4 pt-4 pb-2 z-50">
          <div className="bg-gradient-to-r from-red-600/95 via-orange-600/95 to-red-600/95 border-2 border-red-400/80 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm sm:text-base mb-1">Limite de photos atteinte</p>
                <p className="text-white/90 text-xs sm:text-sm">
                  La licence DEMO permet un maximum de {maxPhotos} photos par événement. ({photosCount}/{maxPhotos} photos)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        <div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-blob animation-delay-2000"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%)',
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Header - Optimisé mobile */}
      <header 
        className={`relative z-10 flex items-center justify-between p-3 sm:p-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <button
          onClick={onBack}
          className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-white/70 hover:text-white active:scale-95 transition-all duration-300 group touch-manipulation"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        </button>
        <h1 
          className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-center flex-1"
          style={{
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Mode Collage
        </h1>
        <div className="w-11 sm:w-14" />
      </header>

      {/* Main Content - Optimisé pour mobile avec scroll fluide */}
      <main className="relative z-10 w-full max-w-md mx-auto px-3 sm:px-4 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
        
        {/* Progress Indicator - Optimisé mobile */}
        <div 
          className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            animationDelay: '100ms',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-white/80">Photos capturées</span>
            <span className="text-xs sm:text-sm font-bold text-white">
              {capturedImages.length}/{MAX_COLLAGE_PHOTOS}
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(capturedImages.length / MAX_COLLAGE_PHOTOS) * 100}%` }}
            />
          </div>
        </div>

        {/* Camera Section - Optimisé mobile */}
        {canCaptureMore && (
          <div 
            className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              animationDelay: '200ms',
            }}
          >
            {cameraError ? (
              <div className="h-[60vh] sm:h-auto sm:aspect-video flex items-center justify-center p-6 sm:p-8">
                <div className="text-center">
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-white/30" />
                  <p className="text-sm sm:text-base text-white/60">Caméra indisponible</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[60vh] sm:h-auto sm:aspect-video object-cover"
                />
                {flash && (
                  <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
                )}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="text-center">
                      <div className="text-6xl sm:text-8xl font-bold text-white animate-scale-in drop-shadow-2xl">{countdown}</div>
                      {isBurstMode && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400">
                          <Zap className="w-5 h-5 animate-pulse" />
                          <span className="text-sm font-bold">Mode rafale</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera Controls - Position optimisée mobile */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10">
                  <button
                    onClick={handleSwitchCamera}
                    className="p-2 sm:p-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 text-white transition-all duration-300 shadow-lg active:scale-95 touch-manipulation"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                    title="Changer de caméra"
                    aria-label="Changer de caméra"
                  >
                    <FlipHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {!isBurstMode && (
                    <button
                      onClick={startBurstMode}
                      className={`p-2 sm:p-3 rounded-full backdrop-blur-xl border text-white transition-all duration-300 shadow-lg active:scale-95 touch-manipulation ${
                        isBurstMode 
                          ? 'bg-yellow-500/80 border-yellow-400 hover:bg-yellow-500' 
                          : 'bg-white/10 hover:bg-white/20 active:bg-white/25 border-white/20'
                      }`}
                      style={{
                        boxShadow: isBurstMode 
                          ? '0 4px 16px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      }}
                      title="Mode rafale"
                      aria-label="Mode rafale"
                    >
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                  {isBurstMode && (
                    <div className="px-3 py-1.5 rounded-full backdrop-blur-xl bg-yellow-500/80 border border-yellow-400 text-white text-xs font-bold">
                      Rafale: {burstCount + 1}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Capture Button - Optimisé mobile avec meilleure accessibilité */}
            <div className="p-3 sm:p-4">
              <button
                onClick={initiatePhotoCapture}
                disabled={countdown !== null || cameraError || isBurstMode || isLimitReached}
                className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 touch-manipulation min-h-[48px] sm:min-h-[56px] relative overflow-hidden"
                style={{
                  background: countdown !== null || cameraError || isBurstMode
                    ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                    : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))',
                  boxShadow: countdown !== null || cameraError || isBurstMode
                    ? '0 4px 16px rgba(0, 0, 0, 0.2)'
                    : '0 8px 32px rgba(236, 72, 153, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
                onTouchStart={(e) => {
                  if (!e.currentTarget.disabled && countdown === null && !cameraError) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 1), rgba(139, 92, 246, 1))';
                  }
                }}
                onTouchEnd={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = countdown !== null || cameraError
                      ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                      : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))';
                  }
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled && countdown === null && !cameraError) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 1), rgba(139, 92, 246, 1))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = countdown !== null || cameraError
                      ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                      : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))';
                  }
                }}
              >
                {isBurstMode ? (
                  <>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    <span>Mode rafale actif...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Capturer la photo {capturedImages.length + 1}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Captured Images Grid - Optimisé mobile */}
        {capturedImages.length > 0 && (
          <div 
            className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              animationDelay: '300ms',
            }}
          >
            <h3 className="text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Photos capturées</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {capturedImages.map((img, index) => (
                <div 
                  key={index} 
                  className={`relative group touch-manipulation ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index ? 'ring-2 ring-pink-500 scale-105' : ''
                  } ${
                    captureAnimation === index ? 'animate-pulse scale-110' : ''
                  } transition-all duration-300`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-white/30 active:border-white/40 transition-all duration-300 relative">
                    <img
                      src={img}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Animation de capture */}
                    {captureAnimation === index && (
                      <div className="absolute inset-0 bg-white/30 animate-ping" />
                    )}
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-xl bg-red-500/90 hover:bg-red-500 active:bg-red-600 border border-white/20 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 shadow-lg active:scale-95 touch-manipulation z-10"
                    style={{
                      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                    }}
                    aria-label={`Supprimer la photo ${index + 1}`}
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-xl bg-black/60 border border-white/10 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <GripVertical className="w-3 h-3 opacity-50" />
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            {capturedImages.length > 0 && (
              <button
                onClick={resetAll}
                className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-white/80 hover:text-white active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px]"
                style={{
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Template Selection - Optimisé mobile avec scroll horizontal si nécessaire */}
        {canCreateCollage && (
          <div 
            className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              animationDelay: '400ms',
            }}
          >
            <h3 className="text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Template de collage</h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {availableTemplates.map((template) => (
                <button
                  key={template}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2 active:scale-95 touch-manipulation min-h-[70px] sm:min-h-[80px] ${
                    selectedTemplate === template
                      ? 'border-pink-500 bg-pink-500/20 text-white shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 hover:border-white/20 text-white/70'
                  }`}
                  style={{
                    boxShadow: selectedTemplate === template 
                      ? '0 4px 16px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  }}
                  aria-label={`Template ${getTemplateLabel(template)}`}
                >
                  <div className={selectedTemplate === template ? 'scale-110' : ''}>
                    {getTemplateIcon(template)}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium">{getTemplateLabel(template)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section - Optimisé mobile */}
        <div 
          className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            animationDelay: '500ms',
          }}
        >
          <h3 className="text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Prévisualisation</h3>
          {previewCollage ? (
            <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden border-2 border-white/10">
              <img
                src={previewCollage}
                alt="Collage preview"
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="aspect-square bg-white/5 rounded-lg sm:rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center mb-3 sm:mb-4">
              <div className="text-center text-white/40 px-4">
                <Grid3x3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                <p className="text-[10px] sm:text-xs">Capturez {MIN_COLLAGE_PHOTOS} photos minimum</p>
              </div>
            </div>
          )}

          {/* Author Name Input - Optimisé mobile */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-white/80 mb-1.5 sm:mb-2">
              Votre nom
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Entrez votre nom"
              maxLength={MAX_AUTHOR_NAME_LENGTH}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 focus:border-pink-500/50 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all duration-300 touch-manipulation"
              style={{
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* User Description Input - Optimisé mobile */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-white/80 mb-1.5 sm:mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="Ajoutez une description..."
              maxLength={MAX_USER_DESCRIPTION_LENGTH}
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 focus:border-pink-500/50 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all duration-300 touch-manipulation resize-none"
              style={{
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            />
            {userDescription.length > 0 && (
              <div className="text-xs text-white/50 mt-1 text-right">
                {userDescription.length}/{MAX_USER_DESCRIPTION_LENGTH}
              </div>
            )}
          </div>

          {/* Download Preview Button */}
          {previewCollage && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewCollage;
                link.download = `collage-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addToast('Collage téléchargé !', 'success');
              }}
              className="w-full mb-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-medium text-sm text-white/80 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 touch-manipulation backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le collage</span>
            </button>
          )}

          {/* Upload Button - Optimisé mobile */}
          <button
            onClick={handleUpload}
            disabled={!canCreateCollage || !previewCollage || !authorName.trim() || loading || isBurstMode || isLimitReached}
            className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 touch-manipulation min-h-[48px] sm:min-h-[56px]"
            style={{
              background: loading || !canCreateCollage || !previewCollage || !authorName.trim()
                ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))',
              boxShadow: loading || !canCreateCollage || !previewCollage || !authorName.trim()
                ? '0 4px 16px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(236, 72, 153, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
            onTouchStart={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 1), rgba(139, 92, 246, 1))';
              }
            }}
            onTouchEnd={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = loading || !canCreateCollage || !previewCollage || !authorName.trim()
                  ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                  : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))';
              }
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 1), rgba(139, 92, 246, 1))';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = loading || !canCreateCollage || !previewCollage || !authorName.trim()
                  ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 0.8))'
                  : 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8))';
              }
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                <span className="text-xs sm:text-sm">{loadingStep}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Publier le collage</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CollageMode;
