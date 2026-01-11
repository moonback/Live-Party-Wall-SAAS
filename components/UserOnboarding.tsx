import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, User, Upload, ArrowRight, ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useEvent } from '../context/EventContext';
import { validateAuthorName, validateImageFile, MAX_AUTHOR_NAME_LENGTH } from '../utils/validation';
import { useAdaptiveCameraResolution } from '../hooks/useAdaptiveCameraResolution';
import { saveUserAvatar } from '../utils/userAvatar';
import { registerGuest, isGuestBlocked, getBlockedGuestInfo } from '../services/guestService';
import { getSettings, subscribeToSettings, defaultSettings } from '../services/settingsService';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStaticAssetPath } from '../utils/electronPaths';

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
      setBackgroundDesktopUrl(defaultSettings.background_desktop_url);
      setBackgroundMobileUrl(defaultSettings.background_mobile_url);
      return;
    }

    getSettings(currentEvent.id).then(settings => {
      setBackgroundDesktopUrl(settings.background_desktop_url ?? defaultSettings.background_desktop_url);
      setBackgroundMobileUrl(settings.background_mobile_url ?? defaultSettings.background_mobile_url);
    });

    // Realtime Subscription pour les changements de fond
    const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
      setBackgroundDesktopUrl(newSettings.background_desktop_url ?? defaultSettings.background_desktop_url);
      setBackgroundMobileUrl(newSettings.background_mobile_url ?? defaultSettings.background_mobile_url);
    });

    return () => {
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
      saveUserAvatar(userName, avatarPhoto);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onComplete(userName, avatarPhoto);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement";
      addToast(errorMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
        <div className="mb-6 flex justify-between items-center px-2">
          <div className="flex gap-2 w-full max-w-[120px]">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'}`} />
          </div>
          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Étape {step} sur 2</span>
        </div>

        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-500">
          
          {/* STEP 1: USERNAME */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">
                  Quel est ton prénom ou pseudo&nbsp;?
                </h1>
                <p className="text-slate-400">
                  Indique le nom qui s'affichera à côté de ta photo sur le mur, pour que tes amis et invités puissent te reconnaître facilement&nbsp;!
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && userName.trim() && handleNextStep()}
                    placeholder="Ton pseudo ou prénom"
                    maxLength={MAX_AUTHOR_NAME_LENGTH}
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-xl text-white placeholder-white/20 focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 transition-all"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20">
                    {userName.length}/{MAX_AUTHOR_NAME_LENGTH}
                  </div>
                </div>

                <div className="flex gap-3">
                  {onBack && (
                    <button onClick={onBack} className="px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={handleNextStep}
                    disabled={!userName.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    Suivant <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AVATAR */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={handlePrevStep} className="mb-6 flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-bold text-sm">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-white mb-2">
                  Prends ta photo de profil&nbsp;! <span role="img" aria-label="Appareil photo">📸</span>
                </h1>
                <p className="text-slate-400">
                  Cette photo apparaîtra à côté de ton nom sur le mur.
                </p>
              </div>

              <div className="mb-8">
                {!avatarPhoto ? (
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/10 shadow-inner group">
                    {flash && <div className="absolute inset-0 bg-white z-50 animate-flash" />}
                    
                    {!cameraError && stream ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Camera className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{cameraError ? 'Accès caméra refusé' : 'Initialisation...'}</p>
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold transition-all">
                          Uploader une photo
                        </button>
                      </div>
                    )}

                    {!cameraError && stream && (
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                        <button onClick={switchCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white hover:bg-black/60 transition-all">
                          <Camera className="w-6 h-6" />
                        </button>
                        <button onClick={captureAvatar} className="w-16 h-16 bg-white rounded-full border-4 border-white/30 shadow-2xl hover:scale-110 active:scale-90 transition-all" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white hover:bg-black/60 transition-all">
                          <Upload className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-pink-500 shadow-2xl shadow-pink-500/20 group">
                    <img src={avatarPhoto} alt="Avatar" className="w-full h-full object-cover scale-x-[-1]" />
                    <button onClick={retakeAvatar} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

              <button
                onClick={handleSubmit}
                disabled={!avatarPhoto || isRegistering}
                className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isRegistering ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check className="w-6 h-6" /> C'est parti !</>
                )}
              </button>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(UserOnboarding);