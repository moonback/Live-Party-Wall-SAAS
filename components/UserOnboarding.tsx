import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, User, Upload, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useEvent } from '../context/EventContext';
import { validateAuthorName, validateImageFile, MAX_AUTHOR_NAME_LENGTH } from '../utils/validation';
import { useAdaptiveCameraResolution } from '../hooks/useAdaptiveCameraResolution';
import { saveUserAvatar } from '../utils/userAvatar';
import { registerGuest, isGuestBlocked, getBlockedGuestInfo } from '../services/guestService';
import { getSettings, subscribeToSettings, defaultSettings } from '../services/settingsService';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStaticAssetPath } from '../utils/electronPaths';
import { loadFaceModels, detectFaces, loadImageFromBase64 } from '../services/faceRecognitionService';
import { saveFaceDescriptor } from '../services/faceStorageService';
import { logger } from '../utils/logger';

interface UserOnboardingProps {
  onComplete: (userName: string, avatarUrl: string) => void;
  onBack?: () => void;
}

/**
 * Composant d'onboarding pour demander le nom d'utilisateur et prendre une photo d'avatar
 */
const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete, onBack }) => {
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState('');
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [backgroundDesktopUrl, setBackgroundDesktopUrl] = useState<string | null>(defaultSettings.background_desktop_url);
  const [backgroundMobileUrl, setBackgroundMobileUrl] = useState<string | null>(defaultSettings.background_mobile_url);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook pour la résolution adaptative de la caméra
  useAdaptiveCameraResolution(videoRef as React.RefObject<HTMLVideoElement>, stream, {
    preferredWidth: 1280,
    preferredHeight: 720,
    fallbackWidth: 640,
    fallbackHeight: 480
  });

  // Gérer l'initialisation de la caméra seulement à l'étape 2
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (step !== 2 || avatarPhoto) return;

      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setCameraError(false);
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920, min: 1280 }, // Full HD idéal, HD minimum
            height: { ideal: 1080, min: 720 }  // Full HD idéal, HD minimum
          }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          } else {
            setTimeout(() => {
              if (videoRef.current && mounted) {
                videoRef.current.srcObject = mediaStream;
              }
            }, 100);
          }
        } else {
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Erreur caméra:', error);
        if (mounted) {
          setCameraError(true);
        }
      }
    };
    
    initCamera();
    
    return () => {
      mounted = false;
    };
  }, [facingMode, avatarPhoto, step]);

  // Mettre à jour le srcObject quand le stream change
  useEffect(() => {
    if (stream && videoRef.current && step === 2) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, step]);

  // Charger les settings de l'événement pour le fond
  useEffect(() => {
    if (!currentEvent?.id) {
      // Réinitialiser aux valeurs par défaut si pas d'événement
      const defaultDesktop = defaultSettings.background_desktop_url;
      const defaultMobile = defaultSettings.background_mobile_url;
      setBackgroundDesktopUrl(prev => prev !== defaultDesktop ? defaultDesktop : prev);
      setBackgroundMobileUrl(prev => prev !== defaultMobile ? defaultMobile : prev);
      return;
    }

    let isMounted = true;

    getSettings(currentEvent.id).then(settings => {
      if (!isMounted) return;
      const desktopUrl = settings.background_desktop_url ?? defaultSettings.background_desktop_url;
      const mobileUrl = settings.background_mobile_url ?? defaultSettings.background_mobile_url;
      setBackgroundDesktopUrl(prev => prev !== desktopUrl ? desktopUrl : prev);
      setBackgroundMobileUrl(prev => prev !== mobileUrl ? mobileUrl : prev);
    });

    // Realtime Subscription pour les changements de fond
    const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
      if (!isMounted) return;
      const desktopUrl = newSettings.background_desktop_url ?? defaultSettings.background_desktop_url;
      const mobileUrl = newSettings.background_mobile_url ?? defaultSettings.background_mobile_url;
      setBackgroundDesktopUrl(prev => prev !== desktopUrl ? desktopUrl : prev);
      setBackgroundMobileUrl(prev => prev !== mobileUrl ? mobileUrl : prev);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [currentEvent?.id]);

  const handleNextStep = () => {
    const nameValidation = validateAuthorName(userName);
    if (!nameValidation.valid) {
      addToast(nameValidation.error || 'Nom invalide', 'error');
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
      // Arrêter la caméra en revenant en arrière
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    } else if (onBack) {
      onBack();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const captureAvatar = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Qualité maximale HD
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    setAvatarPhoto(dataUrl);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  const retakeAvatar = () => {
    setAvatarPhoto(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      addToast(validation.error || 'Fichier invalide', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setAvatarPhoto(result);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!avatarPhoto) {
      addToast('Veuillez prendre une photo', 'error');
      return;
    }

    // Vérifier si l'utilisateur est bloqué
    if (!currentEvent) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }

    const blocked = await isGuestBlocked(currentEvent.id, userName);
    if (blocked) {
      const blockInfo = await getBlockedGuestInfo(currentEvent.id, userName);
      const remainingMinutes = blockInfo.remainingMinutes || 0;
      addToast(`Vous êtes temporairement bloqué. Réessayez dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`, 'error');
      return;
    }

    setIsRegistering(true);
    try {
      await registerGuest(currentEvent.id, avatarPhoto, userName);
      // Stocker les données avec l'ID de l'événement pour la persistance
      localStorage.setItem('party_user_name', userName);
      localStorage.setItem('party_user_avatar', avatarPhoto);
      localStorage.setItem('party_user_event_id', currentEvent.id);
      // Sauvegarder l'avatar de manière asynchrone (avec compression)
      saveUserAvatar(userName, avatarPhoto).catch(error => {
        console.warn('Failed to save user avatar to mapping:', error);
        // Ne pas bloquer l'application si la sauvegarde échoue
      });

      // Détecter et sauvegarder le descripteur facial de manière asynchrone
      // Ne pas bloquer l'inscription si la détection échoue
      (async () => {
        try {
          // Charger les modèles de reconnaissance faciale
          const modelsLoaded = await loadFaceModels();
          if (!modelsLoaded) {
            logger.warn('Face recognition models not loaded, skipping face descriptor save', {
              component: 'UserOnboarding'
            });
            return;
          }

          // Charger l'image depuis base64
          const imageElement = await loadImageFromBase64(avatarPhoto);
          
          // Détecter les visages dans l'image
          const detections = await detectFaces(imageElement);
          
          if (detections.length > 0) {
            // Sélectionner le visage le plus grand (ou le premier si un seul)
            let selectedDetection = detections[0];
            if (detections.length > 1) {
              // Trouver le visage avec la plus grande surface
              let maxArea = selectedDetection.detection.box.width * selectedDetection.detection.box.height;
              for (const detection of detections) {
                const area = detection.detection.box.width * detection.detection.box.height;
                if (area > maxArea) {
                  maxArea = area;
                  selectedDetection = detection;
                }
              }
            }

            // Sauvegarder le descripteur facial
            await saveFaceDescriptor(userName, currentEvent.id, selectedDetection.descriptor);
            logger.info('Face descriptor saved successfully', {
              component: 'UserOnboarding',
              userName,
              eventId: currentEvent.id
            });
          } else {
            logger.warn('No face detected in avatar photo', {
              component: 'UserOnboarding',
              userName
            });
          }
        } catch (error) {
          // Erreur silencieuse - ne pas bloquer l'inscription
          logger.warn('Failed to detect and save face descriptor', error, {
            component: 'UserOnboarding',
            userName,
            eventId: currentEvent.id
          });
        }
      })();

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Afficher le message de succès
      setShowSuccess(true);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        onComplete(userName, avatarPhoto);
      }, 2000);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement";
      addToast(errorMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background Image - Responsive */}
      <img
        src={
          isMobile
            ? (backgroundMobileUrl || getStaticAssetPath('background-mobile.png'))
            : (backgroundDesktopUrl || getStaticAssetPath('background-desktop.png'))
        }
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{
          minWidth: '100%',
          minHeight: '100%',
        }}
      />

      {/* Overlay sombre pour améliorer la lisibilité */}
      <div className="fixed inset-0 bg-black/40 z-[1] pointer-events-none" />

      <div className="relative z-[2] w-full max-w-md">
        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex justify-between items-center px-2"
        >
          <div className="flex gap-1.5 w-full max-w-[100px] sm:max-w-[120px]">
            <motion.div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'}`}
              animate={step >= 1 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: step >= 1 ? Infinity : 0 }}
            />
            <motion.div
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'}`}
              animate={step >= 2 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: step >= 2 ? Infinity : 0 }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-pink-400 uppercase tracking-widest">Étape {step} sur 2</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          {/* Gradient background animé */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'linear',
            }}
          />
          
          {/* STEP 1: USERNAME */}
          <AnimatePresence mode="wait">
            {step === 1 && !showSuccess && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <motion.div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl sm:rounded-3xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg shadow-pink-500/30"
                    animate={{ rotate: [0, 5] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatType: 'reverse',
                      ease: 'easeInOut' 
                    }}
                  >
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl sm:rounded-3xl blur-md opacity-50"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Quel est ton prénom ou pseudo&nbsp;?
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400">
                    Indique le nom qui s'affichera à côté de ta photo sur le mur, pour que tes amis et invités puissent te reconnaître facilement&nbsp;!
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="relative group">
                    <motion.input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && userName.trim() && handleNextStep()}
                      placeholder="Ton pseudo ou prénom"
                      maxLength={MAX_AUTHOR_NAME_LENGTH}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-2 border-white/10 rounded-xl sm:rounded-2xl text-lg sm:text-xl text-white placeholder-white/20 focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 transition-all relative z-10"
                      autoFocus
                      whileFocus={{ scale: 1.01 }}
                    />
                    <motion.div
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-white/20"
                      animate={{ opacity: userName.length > 0 ? 1 : 0.5 }}
                    >
                      {userName.length}/{MAX_AUTHOR_NAME_LENGTH}
                    </motion.div>
                    {userName.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2"
                      >
                        <Sparkles className="w-4 h-4 text-pink-400" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    {onBack && (
                      <motion.button
                        onClick={onBack}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
                      >
                        Annuler
                      </motion.button>
                    )}
                    <motion.button
                      onClick={handleNextStep}
                      disabled={!userName.trim()}
                      whileHover={userName.trim() ? { scale: 1.02 } : {}}
                      whileTap={userName.trim() ? { scale: 0.98 } : {}}
                      className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl sm:rounded-2xl text-white font-black text-base sm:text-lg shadow-xl shadow-pink-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                      style={{
                        boxShadow: userName.trim()
                          ? '0 10px 40px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.2)'
                          : 'none',
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={userName.trim() ? {
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        } : {}}
                        transition={{ duration: 2, repeat: userName.trim() ? Infinity : 0 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={userName.trim() ? { x: '100%' } : { x: '-100%' }}
                        transition={{ duration: 1, repeat: userName.trim() ? Infinity : 0, ease: 'linear' }}
                      />
                      <span className="relative z-10">Suivant</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 2: AVATAR */}
          <AnimatePresence mode="wait">
            {step === 2 && !showSuccess && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <motion.button
                  onClick={handlePrevStep}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="mb-4 sm:mb-6 flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-bold text-xs sm:text-sm group"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" /> Retour
                </motion.button>

                <div className="text-center mb-4 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Prends ta photo de profil&nbsp;! <span role="img" aria-label="Appareil photo">📸</span>
                  </h1>
                  <p className="text-sm sm:text-base text-slate-400">
                    Cette photo apparaîtra à côté de ton nom sur le mur.
                  </p>
                </div>

                <div className="mb-6 sm:mb-8">
                  {!avatarPhoto ? (
                    <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/10 shadow-inner group">
                      {flash && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 bg-white z-50"
                        />
                      )}
                      
                      {!cameraError && stream ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                          <motion.div
                            className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center mb-3 sm:mb-4"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                          </motion.div>
                          <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">{cameraError ? 'Accès caméra refusé' : 'Initialisation...'}</p>
                          <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-[10px] sm:text-xs font-bold transition-all border border-white/10"
                          >
                            Uploader une photo
                          </motion.button>
                        </div>
                      )}

                      {!cameraError && stream && (
                        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center items-center gap-4 sm:gap-6">
                          <motion.button
                            onClick={switchCamera}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 sm:p-3 bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl text-white hover:bg-black/60 transition-all border border-white/10"
                          >
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                          </motion.button>
                          <motion.button
                            onClick={captureAvatar}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full border-4 border-white/30 shadow-2xl shadow-white/20 relative overflow-hidden group"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 opacity-0 group-hover:opacity-20"
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />
                          </motion.button>
                          <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 sm:p-3 bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl text-white hover:bg-black/60 transition-all border border-white/10"
                          >
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-pink-500 shadow-2xl shadow-pink-500/20 group"
                    >
                      <img src={avatarPhoto} alt="Avatar" className="w-full h-full object-cover scale-x-[-1]" />
                      <motion.button
                        onClick={retakeAvatar}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-all border border-white/10"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                      <motion.div
                        className="absolute inset-0 border-4 border-pink-500 rounded-2xl sm:rounded-3xl"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                <motion.button
                  onClick={handleSubmit}
                  disabled={!avatarPhoto || isRegistering}
                  whileHover={avatarPhoto && !isRegistering ? { scale: 1.02 } : {}}
                  whileTap={avatarPhoto && !isRegistering ? { scale: 0.98 } : {}}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl sm:rounded-2xl text-white font-black text-base sm:text-lg shadow-xl shadow-pink-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden group"
                  style={{
                    boxShadow: avatarPhoto && !isRegistering
                      ? '0 10px 40px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.2)'
                      : 'none',
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={avatarPhoto && !isRegistering ? {
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    } : {}}
                    transition={{ duration: 2, repeat: avatarPhoto && !isRegistering ? Infinity : 0 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={avatarPhoto && !isRegistering ? { x: '100%' } : { x: '-100%' }}
                    transition={{ duration: 1, repeat: avatarPhoto && !isRegistering ? Infinity : 0, ease: 'linear' }}
                  />
                  {isRegistering ? (
                    <motion.div
                      className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white/30 border-t-white rounded-full relative z-10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                      <span className="relative z-10">C'est parti !</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 3: SUCCESS MESSAGE */}
          <AnimatePresence mode="wait">
            {showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg shadow-green-500/30"
                  >
                    <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-full blur-md opacity-50"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-3xl font-black text-white mb-2"
                  >
                    Inscription validée ! 🎉
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm sm:text-base text-slate-300 mb-6"
                  >
                    Redirection en cours...
                  </motion.p>

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(UserOnboarding);