import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { analyzeAndCaptionImage, isImageAppropriate } from '../services/aiService';
import { applyImageFilter, enhanceImageQuality, FilterType, FrameType } from '../utils/imageFilters';
import { addPhotoToWall, addVideoToWall } from '../services/photoService';
import { Photo } from '../types';
import { MAX_IMAGE_WIDTH, IMAGE_QUALITY, CAMERA_VIDEO_CONSTRAINTS, MAX_AUTHOR_NAME_LENGTH, MAX_VIDEO_DURATION } from '../constants';
import { useToast } from '../context/ToastContext';
import { validateImageFile, validateAuthorName, validateVideoFile, validateVideoDuration } from '../utils/validation';
import { logger } from '../utils/logger';
import { Download, Wand2, Frame, Palette, SwitchCamera, Video, Camera as CameraIcon, Grid3x3, ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { drawPngOverlay, composeDataUrlWithPngOverlay } from '../utils/imageOverlay';
import { useAdaptiveCameraResolution } from '../hooks/useAdaptiveCameraResolution';
import { saveUserAvatar, getCurrentUserAvatar } from '../utils/userAvatar';
import { useImageCompression } from '../hooks/useImageCompression';

interface GuestUploadProps {
  onPhotoUploaded: (photo: Photo) => void;
  onBack: () => void;
  onCollageMode?: () => void;
}

const GuestUpload: React.FC<GuestUploadProps> = ({ onPhotoUploaded, onBack, onCollageMode }) => {
  const { addToast } = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Image brute
  const [preview, setPreview] = useState<string | null>(null); // Image affichée (filtrée) ou URL vidéo
  const { settings: eventSettings } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [authorName, setAuthorName] = useState(() => {
    // Charger le nom depuis localStorage
    return localStorage.getItem('party_user_name') || '';
  });
  
  // État des filtres
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [activeFrame, setActiveFrame] = useState<FrameType>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [showFrames, setShowFrames] = useState(false);

  // Mode photo/vidéo
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Hook pour la résolution adaptative
  const cameraResolution = useAdaptiveCameraResolution(videoRef, stream, {
    preferredWidth: 1920,
    preferredHeight: 1080,
    fallbackWidth: 1280,
    fallbackHeight: 720
  });

  // Hook pour la compression d'images avec Web Worker
  const { compressImage, isCompressing: isCompressingImage } = useImageCompression();

  // Les settings sont maintenant gérés par SettingsContext

  // Vérifier si la capture vidéo est désactivée et forcer le mode photo
  useEffect(() => {
    if (!eventSettings.video_capture_enabled && mediaType === 'video') {
      setMediaType('photo');
      if (isRecording) {
        stopVideoRecording();
      }
    }
  }, [eventSettings.video_capture_enabled, mediaType, isRecording]);

  // Appliquer les filtres quand activeFilter ou activeFrame change
  useEffect(() => {
    if (!originalImage) return;

    const processImage = async () => {
      try {
        const processed = await applyImageFilter(originalImage, activeFilter, activeFrame);
        setPreview(processed);
      } catch (err) {
        logger.error("Erreur filtre", err, { component: 'GuestUpload', action: 'applyFilters' });
      }
    };
    processImage();
  }, [activeFilter, activeFrame, originalImage]);


  // Resize image avec Web Worker (non-bloquant)
  const resizeImage = async (file: File): Promise<string> => {
    try {
      const result = await compressImage(file, {
        maxWidth: MAX_IMAGE_WIDTH,
        quality: IMAGE_QUALITY
      });
      return result.dataUrl;
    } catch (error) {
      // Fallback vers l'ancienne méthode si le worker échoue
      logger.warn('Web Worker compression failed, using fallback', error, { component: 'GuestUpload', action: 'resizeImage' });
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = MAX_IMAGE_WIDTH / img.width;
          
          if (scaleSize < 1) {
              canvas.width = MAX_IMAGE_WIDTH;
              canvas.height = img.height * scaleSize;
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        };
        img.onerror = reject;
      });
    }
  };

  const startCamera = async (deviceId?: string, preferredFacingMode?: 'user' | 'environment') => {
    try {
      if (stream && !deviceId && !preferredFacingMode) return;
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Constraintes avec résolution adaptative
      const constraints: MediaTrackConstraints = {
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        aspectRatio: { ideal: 16 / 9 }
      };

      if (deviceId) {
        constraints.deviceId = { exact: deviceId };
      } else {
        const facing = preferredFacingMode || facingMode;
        constraints.facingMode = facing;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: constraints, 
        audio: false 
      });
      
      setStream(mediaStream);
      setCameraError(false);
      
      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      if (settings.deviceId) {
        setCurrentDeviceId(settings.deviceId);
      }
      
      // Détecter le facingMode réel
      if (settings.facingMode) {
        setFacingMode(settings.facingMode);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerer les devices si nécessaire
      if (videoDevices.length === 0) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(inputs);
        } catch (e) {
          logger.error("Error enumerating devices", e, { component: 'GuestUpload', action: 'startCamera' });
        }
      }
    } catch (err) {
      logger.error("Camera access error", err, { component: 'GuestUpload', action: 'startCamera' });
      setCameraError(true);
      addToast("Impossible d'accéder à la caméra", 'error');
    }
  };

  const handleSwitchCamera = () => {
    // Méthode 1: Si on a plusieurs devices, basculer entre eux
    if (videoDevices.length >= 2) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      startCamera(nextDevice.deviceId);
      return;
    }
    
    // Méthode 2: Bascule native front/back avec facingMode
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(undefined, nextFacingMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const initiatePhotoCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      capturePhoto();
      setCountdown(null);
    }
  }, [countdown]);

  const capturePhoto = async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > MAX_IMAGE_WIDTH) {
        const ratio = MAX_IMAGE_WIDTH / width;
        width = MAX_IMAGE_WIDTH;
        height = height * ratio;
      }

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
            logger.warn('Overlay frame draw failed', e, { component: 'GuestUpload', action: 'applyFilters' });
          }
        }
        const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
        setOriginalImage(dataUrl); // Sauvegarde l'original
        setPreview(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (!preview) {
      startCamera();
    }
    return () => stopCamera();
  }, [preview]);

  const handleRetake = () => {
    setPreview(null);
    setOriginalImage(null);
    setRecordedBlob(null);
    setVideoDuration(0);
    setActiveFilter('none');
    setActiveFrame('none');
    setAuthorName('');
  };

  // Gérer l'enregistrement vidéo
  const startVideoRecording = () => {
    if (!stream || !videoRef.current) return;

    try {
      recordingChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreview(url);
        stopCamera();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (error) {
      logger.error('Error starting video recording', error, { component: 'GuestUpload', action: 'startVideoRecording' });
      addToast("Erreur lors du démarrage de l'enregistrement vidéo", 'error');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingStartTime) {
        const duration = (Date.now() - recordingStartTime) / 1000;
        setVideoDuration(duration);
        setRecordingStartTime(null);
      }
    }
  };

  // Timer pour l'enregistrement vidéo
  useEffect(() => {
    if (!isRecording || !recordingStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      setVideoDuration(elapsed);

      // Arrêter automatiquement à la durée max
      if (elapsed >= MAX_VIDEO_DURATION) {
        stopVideoRecording();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  const initiateCapture = () => {
    if (mediaType === 'video') {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    } else {
      setCountdown(3);
    }
  };

  const handleBackInternal = () => {
    stopCamera();
    onBack();
  };

  const handleDownload = async () => {
    if (!preview) return;
    try {
      let toDownload = preview;
      if (eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url) {
        // S'assurer que le téléchargement contient bien l'incrustation
        toDownload = await composeDataUrlWithPngOverlay(preview, eventSettings.decorative_frame_url, IMAGE_QUALITY);
      }
      const link = document.createElement('a');
      link.href = toDownload;
      link.download = `party-wall-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Photo téléchargée !", 'success');
    } catch (e) {
      logger.error("Error downloading", e, { component: 'GuestUpload', action: 'handleDownload' });
      addToast("Erreur lors du téléchargement", 'error');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setLoading(true);
    setLoadingStep('Chargement...');

    try {
      // Vérifier si c'est une image ou une vidéo
      if (file.type.startsWith('image/')) {
        setMediaType('photo');
        const validation = validateImageFile(file);
        if (!validation.valid) {
          addToast(validation.error || 'Fichier invalide', 'error');
          setLoading(false);
          startCamera();
          return;
        }

        const resized = await resizeImage(file);
        setOriginalImage(resized);
        setPreview(resized);
        setMediaType('photo');
      } else if (file.type.startsWith('video/')) {
        // Vérifier si la capture vidéo est activée
        if (!eventSettings.video_capture_enabled) {
          addToast('La capture vidéo est désactivée par l\'administrateur', 'error');
          setLoading(false);
          startCamera();
          return;
        }

        const validation = validateVideoFile(file);
        if (!validation.valid) {
          addToast(validation.error || 'Fichier vidéo invalide', 'error');
          setLoading(false);
          startCamera();
          return;
        }

        // Créer une URL pour la prévisualisation
        const url = URL.createObjectURL(file);
        setPreview(url);
        setRecordedBlob(file);
        setMediaType('video');

        // Obtenir la durée de la vidéo
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          const duration = video.duration;
          setVideoDuration(duration);
          const durationValidation = validateVideoDuration(duration);
          if (!durationValidation.valid) {
            addToast(durationValidation.error || 'Durée invalide', 'error');
            setPreview(null);
            setRecordedBlob(null);
            setVideoDuration(0);
            startCamera();
          }
        };
      } else {
        addToast('Type de fichier non supporté', 'error');
        startCamera();
      }
    } catch (error) {
      logger.error("Error loading file", error, { component: 'GuestUpload', action: 'handleFileSelect' });
      addToast("Erreur lors du chargement du fichier", 'error');
      startCamera();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    // Validation du nom
    const nameValidation = validateAuthorName(authorName);
    if (!nameValidation.valid) {
      addToast(nameValidation.error || 'Nom invalide', 'error');
      return;
    }

    setLoading(true);
    setLoadingStep('Analyse IA... 🤖');
    
    try {
      let newPhoto: Photo;

      if (mediaType === 'video' && recordedBlob) {
        // Upload vidéo
        setLoadingStep('Validation de la vidéo... 🎬');
        
        // Validation de la durée
        const durationValidation = validateVideoDuration(videoDuration);
        if (!durationValidation.valid) {
          addToast(durationValidation.error || 'Durée invalide', 'error');
          setLoading(false);
          return;
        }

        // Génération de la légende (optionnelle pour les vidéos)
        let caption = '';
        if (eventSettings.caption_generation_enabled) {
          setLoadingStep('Génération de la légende... ✍️');
          // Pour les vidéos, on peut générer une légende basique ou utiliser la première frame
          caption = 'Vidéo de la fête ! 🎉';
        }

        // Upload
        setLoadingStep('Envoi au mur... 🚀');
        const finalAuthorName = authorName || 'Invité VIP';
        newPhoto = await addVideoToWall(
          recordedBlob,
          caption,
          finalAuthorName,
          videoDuration
        );
        
        // Sauvegarder l'avatar si disponible
        const currentAvatar = getCurrentUserAvatar();
        if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
          saveUserAvatar(finalAuthorName, currentAvatar);
        }

        addToast("Vidéo envoyée avec succès ! 🎉", 'success');
      } else {
        // Upload photo (logique existante)
        // 1. Modération automatique + Génération de légende en 1 seul appel (optimisation coûts)
        setLoadingStep('Analyse IA et génération de légende... 🤖');
        
        // Préparer l'image finale pour l'analyse (après filtres et cadres)
        let imageForAnalysis = preview;
        
        // 2b. Incruster le cadre décoratif dans l'image finale (après filtres)
        if (eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url) {
          setLoadingStep('Application du cadre... 🖼️');
          try {
            imageForAnalysis = await composeDataUrlWithPngOverlay(imageForAnalysis, eventSettings.decorative_frame_url, IMAGE_QUALITY);
          } catch (e) {
            logger.warn('Overlay composition failed', e, { component: 'GuestUpload', action: 'handleSubmit' });
          }
        }

        // Appel combiné : modération + légende en 1 seul appel API (réduction de 50% des coûts)
        const aiResult = await analyzeAndCaptionImage(
          imageForAnalysis, 
          eventSettings.caption_generation_enabled ? eventSettings.event_context : null
        );
        
        // Vérifier la modération
        if (!aiResult.analysis.isAppropriate) {
          addToast(
            aiResult.analysis.moderationReason || "Cette photo ne peut pas être publiée pour des raisons de modération.",
            'error'
          );
          setLoading(false);
          return;
        }

        const analysis = aiResult.analysis;

        // 2. (Optionnel) Amélioration de la qualité si pas de filtre
        let finalImage = imageForAnalysis;
        if (activeFilter === 'none' && activeFrame === 'none' && (analysis.quality === 'poor' || analysis.quality === 'fair')) {
          setLoadingStep('Amélioration de la qualité... ✨');
          try {
            finalImage = await enhanceImageQuality(imageForAnalysis);
          } catch (enhanceError) {
            logger.warn("Quality enhancement failed", enhanceError, { component: 'GuestUpload', action: 'handleSubmit' });
          }
        }

        // 3. Utiliser la légende générée (ou vide si désactivée)
        const caption = eventSettings.caption_generation_enabled ? aiResult.caption : '';

        // 4. Upload
        setLoadingStep('Envoi au mur... 🚀');
        const finalAuthorName = authorName || 'Invité VIP';
        newPhoto = await addPhotoToWall(
          finalImage, 
          caption, 
          finalAuthorName
        );
        
        // Sauvegarder l'avatar si disponible
        const currentAvatar = getCurrentUserAvatar();
        if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
          saveUserAvatar(finalAuthorName, currentAvatar);
        }

        // 5. Feedback
        let successMessage = "Photo envoyée avec succès ! 🎉";
        if (analysis.hasFaces) {
          successMessage += ` (${analysis.faceCount} ${analysis.faceCount > 1 ? 'visages' : 'visage'} détecté${analysis.faceCount > 1 ? 's' : ''})`;
        }
        addToast(successMessage, 'success');
      }

      onPhotoUploaded(newPhoto);
      setPreview(null);
      setOriginalImage(null);
      setRecordedBlob(null);
      setVideoDuration(0);
      // Ne pas réinitialiser le nom d'utilisateur, il est déjà sauvegardé
      
    } catch (error) {
      logger.error("Error submitting", error, { component: 'GuestUpload', action: 'handleSubmit' });
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi";
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-pink-600 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-indigo-600 rounded-full blur-[160px]"></div>
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_45%)]"></div>
      </div>
      
      {flash && <div className="absolute inset-0 z-50 bg-white animate-flash pointer-events-none"></div>}

      {/* Header */}
      <header className="p-2 sm:p-4 flex items-center justify-between z-20 absolute top-0 w-full bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={handleBackInternal} 
          className="relative text-white bg-black/40 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-black/60 active:bg-black/70 active:scale-95 transition-all duration-200 text-sm sm:text-base font-medium border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl group"
          aria-label="Retour"
        >
          <span className="relative flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Retour</span>
          </span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center">
          <h2 className="font-handwriting text-lg sm:text-2xl text-pink-500 drop-shadow-md">Photobooth</h2>
          {/* Bouton Mode Collage */}
          {onCollageMode && eventSettings.collage_mode_enabled && (
            <button
              onClick={onCollageMode}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-500/80 hover:bg-purple-500 text-white transition-all flex items-center gap-0.5 sm:gap-1"
              title="Mode Collage"
            >
              <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Collage</span>
            </button>
          )}
          {/* Bascule Photo/Vidéo - Affiché uniquement si la capture vidéo est activée */}
          {eventSettings.video_capture_enabled && (
            <div className="flex items-center gap-1 sm:gap-2 bg-black/30 backdrop-blur-md rounded-full p-0.5 sm:p-1 border border-white/20">
              <button
                onClick={() => {
                  if (isRecording) stopVideoRecording();
                  setMediaType('photo');
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  mediaType === 'photo' 
                    ? 'bg-pink-500 text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
                disabled={isRecording}
              >
                <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                <span className="hidden sm:inline">Photo</span>
              </button>
              <button
                onClick={() => {
                  if (isRecording) stopVideoRecording();
                  setMediaType('video');
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  mediaType === 'video' 
                    ? 'bg-pink-500 text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
                disabled={isRecording}
              >
                <Video className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                <span className="hidden sm:inline">Vidéo</span>
              </button>
            </div>
          )}
        </div>
        <div className="w-12 sm:w-20"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full max-w-2xl mx-auto h-full mt-12 sm:mt-16">
        
        {!preview ? (
          /* CAMERA MODE */
          <div className="absolute inset-0 w-full h-full bg-black z-10">
            {!cameraError ? (
              <div 
                ref={videoContainerRef}
                className="absolute inset-0 overflow-hidden"
              >
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {/* Overlay live (cadre décoratif) */}
                {eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url && (
                  <img
                    src={eventSettings.decorative_frame_url}
                    alt="Cadre décoratif"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-10"
                  />
                )}
              </div>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                  <p className="text-4xl mb-4">📷</p>
                  <p className="animate-pulse">Caméra non détectée</p>
                  <button onClick={triggerInput} className="mt-6 text-pink-400 underline font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 rounded">
                    Choisir un fichier
                  </button>
               </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && mediaType === 'photo' && (
              <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 backdrop-blur-sm transition-all">
                <div key={countdown} className="flex flex-col items-center justify-center animate-[pulse_1s_ease-in-out]">
                  {countdown > 0 ? (
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white/10 backdrop-blur-md border-2 sm:border-4 border-white/30 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.4)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20"></div>
                      <span className="text-6xl sm:text-9xl font-black text-white drop-shadow-lg select-none relative z-10 pb-2">
                        {countdown}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center animate-bounce">
                      <span className="text-5xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none rotate-[-3deg]">
                        SMILE!
                      </span>
                      <span className="text-4xl sm:text-6xl mt-4 filter drop-shadow-lg">✨</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timer d'enregistrement vidéo */}
            {isRecording && mediaType === 'video' && (
              <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 bg-red-500/90 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 rounded-full border-2 border-red-400 shadow-lg animate-pulse">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {Math.floor(videoDuration)}s / {MAX_VIDEO_DURATION}s
                  </span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 pb-4 sm:pb-6 flex items-center justify-center space-x-6 sm:space-x-12 bg-gradient-to-t from-black/90 via-black/80 to-transparent backdrop-blur-sm pointer-events-none sm:pointer-events-auto">
              <button 
                onClick={triggerInput}
                className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
                aria-label="Choisir un fichier depuis la galerie"
              >
                 <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
                    <span role="img" aria-hidden="true" className="text-xl sm:text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">📂</span>
                 </div>
                 <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Galerie</span>
              </button>

              <button
                onClick={initiateCapture}
                disabled={!!cameraError || (countdown !== null && mediaType === 'photo')}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-[6px] border-white/90 flex items-center justify-center bg-transparent transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-pink-400/80 pointer-events-auto group
                  ${(countdown !== null && mediaType === 'photo') ? 'opacity-40 scale-95 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white active:scale-95'}
                `}
                aria-label={mediaType === 'video' ? (isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement') : 'Prendre une photo'}
              >
                {/* Glow effect */}
                {!cameraError && countdown === null && (
                  <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                    isRecording && mediaType === 'video'
                      ? 'bg-red-500/30 animate-pulse'
                      : mediaType === 'video'
                      ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                      : 'bg-pink-500/20 group-hover:bg-pink-500/30'
                  } blur-xl`} />
                )}
                <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-transparent transition-all duration-300 shadow-md ${
                  isRecording && mediaType === 'video'
                    ? 'bg-red-600 animate-pulse'
                    : mediaType === 'video'
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 group-hover:border-white/50 group-hover:scale-105 group-hover:shadow-lg'
                    : countdown !== null
                    ? 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 animate-pulse'
                    : 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 group-hover:border-white/50 group-hover:scale-105 group-hover:shadow-lg'
                }`}>
                  {/* Inner shine */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                </div>
              </button>

              {/* Bascule caméra - Toujours visible si plusieurs devices ou si facingMode est supporté */}
              {(videoDevices.length > 1 || videoDevices.length === 0) && (
                <button 
                  onClick={handleSwitchCamera}
                  className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
                  title={facingMode === 'user' ? 'Passer à la caméra arrière' : 'Passer à la caméra avant'}
                  aria-label={facingMode === 'user' ? 'Passer à la caméra arrière' : 'Passer à la caméra avant'}
                >
                   <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
                      <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                   </div>
                   <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Caméra</span>
                </button>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        ) : (
          /* PREVIEW & EDIT MODE */
          <div className="absolute inset-0 z-10 bg-black animate-fade-in-up flex flex-col">
            
            {/* Toolbar Top */}
            <div className="absolute top-14 sm:top-20 right-2 sm:right-4 z-30 flex flex-col gap-2 sm:gap-3">
               {mediaType === 'photo' && (
                 <button 
                   onClick={handleDownload}
                   className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all text-white touch-manipulation"
                   title="Télécharger"
                 >
                   <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                 </button>
               )}
               {mediaType === 'photo' && (
                 <>
                   <button 
                     onClick={() => { setShowFilters(!showFilters); setShowFrames(false); }}
                     className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur border flex items-center justify-center transition-all touch-manipulation ${showFilters ? 'bg-pink-500 border-pink-400 text-white' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
                     title="Filtres"
                   >
                     <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                   </button>
                   <button 
                     onClick={() => { setShowFrames(!showFrames); setShowFilters(false); }}
                     className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur border flex items-center justify-center transition-all touch-manipulation ${showFrames ? 'bg-pink-500 border-pink-400 text-white' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
                     title="Cadres"
                   >
                     <Frame className="w-4 h-4 sm:w-5 sm:h-5" />
                   </button>
                 </>
               )}
            </div>

            {/* Filter/Frame Selector Panel */}
            {(showFilters || showFrames) && (
              <div className="absolute top-14 sm:top-20 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex gap-1.5 sm:gap-2 animate-scale-in max-w-[95%] sm:max-w-[90%] overflow-x-auto scrollbar-hide">
                {showFilters && (
                  <>
                    {(['none', 'vintage', 'blackwhite', 'warm', 'cool'] as FilterType[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${activeFilter === f ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                      >
                        {f === 'blackwhite' ? 'N&B' : f}
                      </button>
                    ))}
                  </>
                )}
                {showFrames && (
                  <>
                    {(['none', 'polaroid', 'neon', 'gold', 'simple'] as FrameType[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveFrame(f)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${activeFrame === f ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Media Preview */}
            <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-900">
               <div className="absolute inset-0 flex items-center justify-center">
                 {mediaType === 'video' && preview ? (
                   <video
                     ref={previewVideoRef}
                     src={preview}
                     controls
                     className="w-full h-full max-h-[80vh] object-contain"
                     autoPlay
                     loop
                     playsInline
                   />
                 ) : (
                   <>
                     <img 
                       src={preview} 
                       alt="Preview" 
                       className="w-full h-full max-h-[80vh] object-contain"
                       style={{
                         maxWidth: '100%',
                         height: 'auto'
                       }}
                     />
                     {/* Overlay visuel en preview */}
                     {eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url && (
                       <img
                         src={eventSettings.decorative_frame_url}
                         alt="Cadre décoratif"
                         className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                       />
                     )}
                   </>
                 )}
               </div>
               
               {/* Author Name Input */}
               <div className="absolute bottom-20 sm:bottom-28 left-0 w-full px-4 sm:px-6 flex justify-center z-20">
                  <div className="bg-black/40 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl w-full max-w-sm border border-white/10 shadow-lg">
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Votre nom..."
                      className="w-full text-center font-bold text-lg sm:text-2xl text-white placeholder-white/50 bg-transparent border-none outline-none focus:ring-0"
                      maxLength={MAX_AUTHOR_NAME_LENGTH}
                      autoFocus
                      inputMode="text"
                    />
                  </div>
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex space-x-3 sm:space-x-4 z-20">
              <button
                onClick={handleRetake}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full font-bold border border-white/20 active:scale-95 transition-all hover:bg-white/20 touch-manipulation text-xl sm:text-2xl"
                disabled={loading}
                title="Refaire"
              >
                ↺
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="relative flex-1 py-3 sm:py-4 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-xl sm:rounded-2xl font-bold shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border border-pink-400/50 touch-manipulation text-sm sm:text-base overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                   <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse text-xs sm:text-sm">{loadingStep}</span>
                   </>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 sm:gap-2 font-semibold">
                    <span role="img" aria-label="Poster" className="text-base sm:text-lg">✨</span>
                    <span className="hidden sm:inline">ENVOYER AU MUR</span>
                    <span className="sm:hidden">ENVOYER</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />
    </div>
  );
};

export default React.memo(GuestUpload);
