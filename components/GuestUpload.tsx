import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Photo } from '../types';
// MAX_VIDEO_DURATION utilisé dans VideoTimer
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from '../context/EventContext';
import { validateImageFile, validateAuthorName, validateVideoFile, validateVideoDuration } from '../utils/validation';
import { logger } from '../utils/logger';
import { drawPngOverlay } from '../utils/imageOverlay';
import { BURST_DEFAULT_PHOTOS, BURST_CAPTURE_INTERVAL } from '../constants';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { useVideoRecording } from '../hooks/useVideoRecording';
import { useCamera } from '../hooks/useCamera';
import { submitPhoto, submitVideo } from '../services/photoboothService';
import { PhotoboothHeader } from './photobooth/PhotoboothHeader';
import { CameraView } from './photobooth/CameraView';
import { PreviewView } from './photobooth/PreviewView';
import { TimerSettings } from './photobooth/TimerSettings';
import { BurstModeView } from './photobooth/BurstModeView';
import { UploadConfirmation } from './photobooth/UploadConfirmation';

interface GuestUploadProps {
  onPhotoUploaded: (photo: Photo) => void;
  onBack: () => void;
  onCollageMode?: () => void;
}

const GuestUpload: React.FC<GuestUploadProps> = ({ onPhotoUploaded, onBack, onCollageMode }) => {
  const { addToast } = useToast();
  const { settings: eventSettings } = useSettings();
  const { currentEvent } = useEvent();
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('party_user_name') || '';
  });
  const [userDescription, setUserDescription] = useState('');
  
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  
  // Mode rafale
  const [burstMode, setBurstMode] = useState(() => {
    const saved = localStorage.getItem('party_burst_mode');
    return saved !== null ? saved === 'true' : false;
  });
  const [burstPhotos, setBurstPhotos] = useState<string[]>([]);
  const [selectedBurstIndex, setSelectedBurstIndex] = useState<number | null>(null);
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  
  // Préférences du timer depuis localStorage
  const [timerEnabled, setTimerEnabled] = useState(() => {
    const saved = localStorage.getItem('party_timer_enabled');
    return saved !== null ? saved === 'true' : true; // Par défaut activé
  });
  
  const [timerDuration, setTimerDuration] = useState(() => {
    const saved = localStorage.getItem('party_timer_duration');
    return saved !== null ? parseInt(saved, 10) : 3; // Par défaut 3 secondes
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hooks personnalisés
  const {
    preview,
    activeFilter,
    activeFrame,
    setActiveFilter,
    setActiveFrame,
    setPreview,
    loadImage,
    setOriginalImageFromDataUrl,
    reset: resetImageProcessing
  } = useImageProcessing();
  
  const { stream, videoRef, stopCamera, switchCamera, cameraError, videoDevices, startCamera } = useCamera();
  
  const {
    isRecording,
    recordedBlob,
    videoPreviewUrl,
    videoDuration,
    startRecording,
    stopRecording,
    reset: resetVideoRecording
  } = useVideoRecording(stream);

  // Vérifier si la capture vidéo est désactivée
  useEffect(() => {
    if (!eventSettings.video_capture_enabled && mediaType === 'video') {
      setMediaType('photo');
      if (isRecording) {
        stopRecording();
      }
    }
  }, [eventSettings.video_capture_enabled, mediaType, isRecording, stopRecording]);

  // Countdown pour la photo
  useEffect(() => {
    if (countdown === null) return undefined;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // capturePhoto ou captureBurst selon le mode
      // Ces fonctions utilisent des refs et eventSettings qui sont stables
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (burstMode) {
        captureBurst();
      } else {
        capturePhoto();
      }
      setCountdown(null);
      return undefined;
    }
  }, [countdown, burstMode]);

  // Mettre à jour le preview quand une vidéo est enregistrée
  useEffect(() => {
    if (videoPreviewUrl && !preview) {
      setPreview(videoPreviewUrl);
    }
  }, [videoPreviewUrl, preview]);

  // Démarrer la caméra quand pas de preview et pas de rafale en cours
  useEffect(() => {
    if (!preview && !recordedBlob && !videoPreviewUrl && burstPhotos.length === 0) {
      startCamera();
    }
    return () => {
      if (!preview && !recordedBlob && !videoPreviewUrl && burstPhotos.length === 0) {
        stopCamera();
      }
    };
  }, [preview, recordedBlob, videoPreviewUrl, burstPhotos.length, startCamera, stopCamera]);

  const capturePhoto = async (forBurst: boolean = false): Promise<string | null> => {
    if (!forBurst) {
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    }

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
            logger.warn('Overlay frame draw failed', { component: 'GuestUpload', action: 'capturePhoto' }, e);
          }
        }
        // Utiliser la qualité maximale (1.0) sans compression
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        if (forBurst) {
          return dataUrl;
        } else {
          // Définir l'image originale pour que les filtres puissent être appliqués
          setOriginalImageFromDataUrl(dataUrl);
          stopCamera();
          return null;
        }
      }
    }
    return null;
  };

  const captureBurst = async () => {
    if (!videoRef.current || isCapturingBurst) return;

    setIsCapturingBurst(true);
    setFlash(true);
    
    const photos: string[] = [];
    const numPhotos = BURST_DEFAULT_PHOTOS;

    try {
      for (let i = 0; i < numPhotos; i++) {
        const photo = await capturePhoto(true);
        if (photo) {
          photos.push(photo);
        }
        
        // Flash pour chaque photo sauf la dernière
        if (i < numPhotos - 1) {
          setFlash(false);
          await new Promise(resolve => setTimeout(resolve, 50));
          setFlash(true);
          await new Promise(resolve => setTimeout(resolve, BURST_CAPTURE_INTERVAL - 50));
        }
      }
      
      setFlash(false);
      
      if (photos.length > 0) {
        setBurstPhotos(photos);
        setSelectedBurstIndex(0); // Sélectionner la première par défaut
        stopCamera();
      } else {
        addToast('Erreur lors de la capture en rafale', 'error');
        setIsCapturingBurst(false);
      }
    } catch (error) {
      logger.error('Error capturing burst', error, { component: 'GuestUpload', action: 'captureBurst' });
      addToast('Erreur lors de la capture en rafale', 'error');
      setIsCapturingBurst(false);
    }
  };

  const handleBurstPhotoSelect = (index: number) => {
    setSelectedBurstIndex(index);
  };

  const handleBurstPhotoConfirm = () => {
    if (selectedBurstIndex !== null && burstPhotos[selectedBurstIndex]) {
      // Définir l'image originale pour que les filtres puissent être appliqués
      setOriginalImageFromDataUrl(burstPhotos[selectedBurstIndex]);
      setBurstPhotos([]);
      setSelectedBurstIndex(null);
      setIsCapturingBurst(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setBurstPhotos([]);
    setSelectedBurstIndex(null);
    setIsCapturingBurst(false);
    setUserDescription(''); // Réinitialiser la description
    resetImageProcessing();
    resetVideoRecording();
    // Le preview vidéo est géré par le hook
    if (videoPreviewUrl) {
      setPreview(videoPreviewUrl);
    }
  };

  const initiateCapture = () => {
    if (mediaType === 'video') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else {
      // Mode rafale
      if (burstMode) {
        if (timerEnabled && timerDuration > 0) {
          setCountdown(timerDuration);
        } else {
          captureBurst();
        }
      } else {
        // Mode normal : utiliser les préférences du timer depuis localStorage
        if (timerEnabled && timerDuration > 0) {
          setCountdown(timerDuration);
        } else {
          // Timer désactivé ou durée à 0 : capture immédiate
          capturePhoto();
        }
      }
    }
  };

  const handleTimerSettingsSave = (enabled: boolean, duration: number) => {
    setTimerEnabled(enabled);
    setTimerDuration(duration);
    localStorage.setItem('party_timer_enabled', enabled.toString());
    localStorage.setItem('party_timer_duration', duration.toString());
    addToast('Paramètres du timer enregistrés !', 'success');
  };

  const handleBackInternal = () => {
    stopCamera();
    onBack();
  };

  const handleDownload = async () => {
    if (!preview) return;
    try {
      const link = document.createElement('a');
      link.href = preview;
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
      if (file.type.startsWith('image/')) {
        setMediaType('photo');
        const validation = validateImageFile(file);
        if (!validation.valid) {
          addToast(validation.error || 'Fichier invalide', 'error');
          setLoading(false);
          return;
        }
        await loadImage(file);
      } else if (file.type.startsWith('video/')) {
        if (!eventSettings.video_capture_enabled) {
          addToast('La capture vidéo est désactivée par l\'administrateur', 'error');
          setLoading(false);
          return;
        }

        const validation = validateVideoFile(file);
        if (!validation.valid) {
          addToast(validation.error || 'Fichier vidéo invalide', 'error');
          setLoading(false);
          return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);
        setMediaType('video');

        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          const duration = video.duration;
          const durationValidation = validateVideoDuration(duration);
          if (!durationValidation.valid) {
            addToast(durationValidation.error || 'Durée invalide', 'error');
            setPreview(null);
          }
        };
      } else {
        addToast('Type de fichier non supporté', 'error');
      }
    } catch (error) {
      logger.error("Error loading file", error, { component: 'GuestUpload', action: 'handleFileChange' });
      addToast("Erreur lors du chargement du fichier", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    const nameValidation = validateAuthorName(authorName);
    if (!nameValidation.valid) {
      addToast(nameValidation.error || 'Nom invalide', 'error');
      return;
    }

    if (!currentEvent) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }

    setLoading(true);
    // Afficher le message d'analyse IA seulement si la génération de légende est activée
    if (eventSettings.caption_generation_enabled) {
      setLoadingStep('Analyse IA... 🤖');
    } else {
      setLoadingStep('Traitement de la photo... 📸');
    }
    
    try {
      let newPhoto: Photo;

      if (mediaType === 'video' && recordedBlob) {
        setLoadingStep('Validation de la vidéo... 🎬');
        
        const durationValidation = validateVideoDuration(videoDuration);
        if (!durationValidation.valid) {
          addToast(durationValidation.error || 'Durée invalide', 'error');
          setLoading(false);
          return;
        }

        setLoadingStep('Envoi au mur... 🚀');
        newPhoto = await submitVideo({
          videoBlob: recordedBlob,
          authorName,
          userDescription: userDescription.trim() || undefined,
          eventId: currentEvent.id,
          videoDuration,
          eventSettings
        });

        addToast("Vidéo envoyée avec succès ! 🎉", 'success');
      } else {
        // Ne pas afficher le message de génération de légende si désactivé
        if (eventSettings.caption_generation_enabled) {
          setLoadingStep('Analyse IA et génération de légende... 🤖');
        } else {
          setLoadingStep('Traitement de la photo... 📸');
        }
        
        newPhoto = await submitPhoto({
          imageDataUrl: preview,
          authorName,
          userDescription: userDescription.trim() || undefined,
          eventId: currentEvent.id,
          eventSettings,
          activeFilter,
          activeFrame
        });

        addToast("Photo envoyée avec succès ! 🎉", 'success');
      }

      // Afficher la confirmation visuelle
      setShowConfirmation(true);
      setLoading(false);
      
      // Notifier que la photo a été uploadée (sans redirection)
      onPhotoUploaded(newPhoto);
      
    } catch (error) {
      logger.error("Error submitting", error, { component: 'GuestUpload', action: 'handleSubmit' });
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi";
      addToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  const handleConfirmationComplete = () => {
    setShowConfirmation(false);
    // Retourner à l'accueil après l'envoi de la photo
    stopCamera();
    onBack();
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

      <PhotoboothHeader
        onBack={handleBackInternal}
        onCollageMode={onCollageMode}
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        isRecording={isRecording}
        videoCaptureEnabled={eventSettings.video_capture_enabled ?? true}
        collageModeEnabled={eventSettings.collage_mode_enabled ?? true}
        onStopRecording={stopRecording}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full max-w-2xl mx-auto h-full mt-12 sm:mt-16">
        {burstPhotos.length > 0 ? (
          <BurstModeView
            burstPhotos={burstPhotos}
            onSelectPhoto={handleBurstPhotoSelect}
            selectedIndex={selectedBurstIndex}
            onConfirm={handleBurstPhotoConfirm}
          />
        ) : !preview && !recordedBlob && !videoPreviewUrl ? (
          <CameraView
            mediaType={mediaType}
            countdown={countdown}
            isRecording={isRecording}
            videoDuration={videoDuration}
            onCapture={initiateCapture}
            onGalleryClick={triggerInput}
            onSwitchCamera={switchCamera}
            videoDevices={videoDevices}
            decorativeFrameUrl={eventSettings.decorative_frame_url}
            decorativeFrameEnabled={eventSettings.decorative_frame_enabled}
            videoRef={videoRef}
            cameraError={cameraError}
            timerMaxDuration={timerDuration}
            onTimerSettingsClick={() => setShowTimerSettings(true)}
            burstMode={burstMode}
            onBurstModeToggle={() => {
              const newBurstMode = !burstMode;
              setBurstMode(newBurstMode);
              localStorage.setItem('party_burst_mode', newBurstMode.toString());
              addToast(newBurstMode ? 'Mode rafale activé' : 'Mode rafale désactivé', 'success');
            }}
            isCapturingBurst={isCapturingBurst}
          />
        ) : (
          <PreviewView
            preview={preview || ''}
            mediaType={mediaType}
            authorName={authorName}
            onAuthorNameChange={setAuthorName}
            userDescription={userDescription}
            onUserDescriptionChange={setUserDescription}
            onDownload={handleDownload}
            onRetake={handleRetake}
            onSubmit={handleSubmit}
            loading={loading}
            loadingStep={loadingStep}
            showFilters={showFilters}
            showFrames={showFrames}
            activeFilter={activeFilter}
            activeFrame={activeFrame}
            onFilterChange={setActiveFilter}
            onFrameChange={setActiveFrame}
            onToggleFilters={() => { setShowFilters(!showFilters); setShowFrames(false); }}
            onToggleFrames={() => { setShowFrames(!showFrames); setShowFilters(false); }}
            decorativeFrameUrl={eventSettings.decorative_frame_url}
            decorativeFrameEnabled={eventSettings.decorative_frame_enabled}
          />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <TimerSettings
        isOpen={showTimerSettings}
        onClose={() => setShowTimerSettings(false)}
        timerEnabled={timerEnabled}
        timerDuration={timerDuration}
        onSave={handleTimerSettingsSave}
      />

      <UploadConfirmation
        isVisible={showConfirmation}
        onComplete={handleConfirmationComplete}
      />
    </div>
  );
};

export default React.memo(GuestUpload);

