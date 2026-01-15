import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Photo } from '../types';
import { getPhotos } from '../services/photoService';
import { 
  loadFaceModels, 
  detectFaces, 
  findPhotosWithFace, 
  loadImageFromBase64 
} from '../services/faceRecognitionService';
import { getFaceDescriptor } from '../services/faceStorageService';
import { useToast } from '../context/ToastContext';
import { useEvent } from '../context/EventContext';
import { ArrowLeft, Camera, Search, Loader2, User, Image as ImageIcon, X, Sparkles, CheckCircle, AlertCircle, RefreshCw, Zap, ArrowRight, Download, Heart } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import { CAMERA_VIDEO_CONSTRAINTS } from '../constants';
import { logger } from '../utils/logger';
import { QRCodeCanvas } from 'qrcode.react';

interface FindMeProps {
  onBack: () => void;
  onPhotoClick?: (photo: Photo) => void;
}

const FindMe: React.FC<FindMeProps> = ({ onBack, onPhotoClick }) => {
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  const isMobile = useIsMobile();
  
  // États de la caméra
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // États de la reconnaissance faciale
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchingPhotos, setMatchingPhotos] = useState<Array<{ id: string; url: string; similarity: number }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [faceDetections, setFaceDetections] = useState<Array<{ box: { x: number; y: number; width: number; height: number }; landmarks: Array<{ x: number; y: number }> }>>([]);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [usingSavedDescriptor, setUsingSavedDescriptor] = useState(false);
  const [savedDescriptorAvailable, setSavedDescriptorAvailable] = useState(false);
  const [checkingSavedDescriptor, setCheckingSavedDescriptor] = useState(true);
  
  // Charger les modèles au montage
  useEffect(() => {
    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const loaded = await loadFaceModels();
        if (!loaded) {
          addToast(
            'Les modèles de reconnaissance faciale ne sont pas disponibles. Veuillez télécharger les modèles (voir README.md dans public/models/face-api/)',
            'error'
          );
        }
      } catch (error) {
        logger.error('Error loading face models', error, { component: 'FindMe' });
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          addToast(
            'Les modèles de reconnaissance faciale sont manquants. Veuillez télécharger les modèles depuis le dépôt GitHub (voir README.md dans public/models/face-api/)',
            'error'
          );
        } else if (errorMessage.includes('tensor') || errorMessage.includes('shape') || errorMessage.includes('values')) {
          addToast(
            'Les modèles de reconnaissance faciale semblent corrompus ou incomplets. Veuillez les re-télécharger depuis GitHub (voir README.md dans public/models/face-api/)',
            'error'
          );
        } else {
          addToast('Erreur lors du chargement des modèles de reconnaissance faciale', 'error');
        }
      } finally {
        setModelsLoading(false);
      }
    };
    
    loadModels();
  }, [addToast]);
  
  // Charger toutes les photos au montage
  useEffect(() => {
    if (!currentEvent?.id) {
      // Pas d'événement sélectionné, ne pas charger les photos
      setAllPhotos([]);
      return;
    }

    const loadPhotos = async () => {
      try {
        const photos = await getPhotos(currentEvent.id);
        setAllPhotos(photos);
      } catch (error) {
        logger.error('Error loading photos', error, { component: 'FindMe' });
        addToast('Erreur lors du chargement des photos', 'error');
      }
    };
    
    loadPhotos();
  }, [currentEvent?.id, addToast]);

  // Vérifier si un descripteur facial sauvegardé existe
  useEffect(() => {
    const checkSavedDescriptor = async () => {
      setCheckingSavedDescriptor(true);
      
      if (!currentEvent?.id) {
        setSavedDescriptorAvailable(false);
        setCheckingSavedDescriptor(false);
        return;
      }

      const userName = localStorage.getItem('party_user_name');
      if (!userName) {
        setSavedDescriptorAvailable(false);
        setCheckingSavedDescriptor(false);
        return;
      }

      try {
        const descriptor = await getFaceDescriptor(userName, currentEvent.id);
        if (descriptor) {
          setSavedDescriptorAvailable(true);
          logger.info('Saved face descriptor found', {
            component: 'FindMe',
            userName,
            eventId: currentEvent.id
          });
        } else {
          setSavedDescriptorAvailable(false);
        }
      } catch (error) {
        logger.warn('Error checking for saved descriptor', error, {
          component: 'FindMe'
        });
        setSavedDescriptorAvailable(false);
      } finally {
        setCheckingSavedDescriptor(false);
      }
    };

    checkSavedDescriptor();
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
      logger.error('Camera access error', err, { component: 'FindMe' });
      setCameraError(true);
      addToast("Impossible d'accéder à la caméra", 'error');
    }
  };
  
  // Arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  // Démarrer la caméra au montage (seulement si pas de descripteur sauvegardé)
  useEffect(() => {
    // Attendre que la vérification du descripteur soit terminée
    if (checkingSavedDescriptor) {
      return;
    }
    
    // Ne pas démarrer la caméra automatiquement si un descripteur sauvegardé est disponible
    // L'utilisateur pourra choisir de l'utiliser ou de capturer une nouvelle photo
    if (!savedDescriptorAvailable && !capturedImage && !usingSavedDescriptor && !stream) {
      startCamera();
    }
    
    return () => {
      // Ne pas arrêter la caméra si on utilise le descripteur sauvegardé
      if (!usingSavedDescriptor) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSavedDescriptor, savedDescriptorAvailable]);
  
  // Basculer entre caméra avant/arrière
  const handleSwitchCamera = () => {
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextFacingMode);
  };
  
  // Capturer une photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        addToast('Erreur lors de la capture', 'error');
        return;
      }
      
      // Ajuster la taille du canvas à la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image de la vidéo sur le canvas
      ctx.drawImage(video, 0, 0);
      
      // Convertir en base64 avec qualité maximale HD
      const base64Image = canvas.toDataURL('image/jpeg', 1.0);
      setCapturedImage(base64Image);
      
      // Détecter le visage
      await detectFaceInCapturedImage(base64Image);
      
      // Arrêter la caméra
      stopCamera();
    } catch (error) {
      logger.error('Error capturing photo', error, { component: 'FindMe' });
      addToast('Erreur lors de la capture', 'error');
    }
  };
  
  // Détecter le visage dans l'image capturée
  const detectFaceInCapturedImage = async (base64Image: string) => {
    try {
      const img = await loadImageFromBase64(base64Image);
      const detections = await detectFaces(img);
      
      if (detections.length === 0) {
        setFaceDetected(false);
        setFaceDetections([]);
        addToast('Aucun visage détecté. Veuillez réessayer.', 'info');
        return;
      }
      
      if (detections.length > 1) {
        addToast('Plusieurs visages détectés. Utilisez le visage le plus proche.', 'info');
      }
      
      // Extraire les informations de détection pour l'affichage
      const detectionData = detections.map(detection => ({
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height
        },
        landmarks: detection.landmarks.positions.map((pos: any) => ({
          x: pos.x,
          y: pos.y
        }))
      }));
      
      setFaceDetections(detectionData);
      setFaceDetected(true);
      
      // Dessiner les détections sur le canvas
      drawFaceDetections(img, detectionData);
      
      // Utiliser le premier visage détecté (le plus grand généralement)
      const referenceDescriptor = detections[0].descriptor;
      
      // Rechercher les photos correspondantes
      await searchForMatchingPhotos(referenceDescriptor);
    } catch (error) {
      logger.error('Error detecting face', error, { component: 'FindMe' });
      addToast('Erreur lors de la détection du visage', 'error');
      setFaceDetected(false);
      setFaceDetections([]);
    }
  };

  // Dessiner les détections de visage sur le canvas (fonction simplifiée, le rendu est géré par useEffect)
  const drawFaceDetections = (img: HTMLImageElement, detections: Array<{ box: { x: number; y: number; width: number; height: number }; landmarks: Array<{ x: number; y: number }> }>) => {
    // Les détections sont stockées dans l'état et rendues par le useEffect
    // Cette fonction est appelée pour déclencher le stockage des détections
  };
  
  // Rechercher les photos correspondantes
  const searchForMatchingPhotos = async (referenceDescriptor: Float32Array) => {
    if (allPhotos.length === 0) {
      addToast('Aucune photo disponible', 'info');
      return;
    }
    
    setIsSearching(true);
    setMatchingPhotos([]);
    
    try {
      const matches = await findPhotosWithFace(
        referenceDescriptor,
        allPhotos.map(p => ({ id: p.id, url: p.url, type: p.type })),
        // Callback de progression pour mettre à jour l'UI
        (current, total, photoId) => {
          // Optionnel : on pourrait afficher un pourcentage de progression
          // Pour l'instant, on laisse juste l'indicateur de chargement
        }
      );
      
      if (matches.length === 0) {
        addToast('Aucune photo correspondante trouvée', 'info');
      } else {
        addToast(`${matches.length} photo(s) trouvée(s) !`, 'success');
      }
      
      setMatchingPhotos(matches);
    } catch (error) {
      logger.error('Error searching for matching photos', error, { component: 'FindMe' });
      addToast('Erreur lors de la recherche', 'error');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Utiliser le descripteur sauvegardé
  const useSavedDescriptor = async () => {
    if (!currentEvent?.id) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    const userName = localStorage.getItem('party_user_name');
    if (!userName) {
      addToast('Nom d\'utilisateur non trouvé', 'error');
      return;
    }

    try {
      const descriptor = await getFaceDescriptor(userName, currentEvent.id);
      if (!descriptor) {
        addToast('Descripteur facial non trouvé', 'error');
        setSavedDescriptorAvailable(false);
        return;
      }

      setUsingSavedDescriptor(true);
      setFaceDetected(true);
      setCapturedImage(null); // Pas d'image à afficher car on utilise le descripteur sauvegardé
      
      // Rechercher directement les photos correspondantes
      await searchForMatchingPhotos(descriptor);
      
      addToast('Descripteur sauvegardé utilisé', 'success');
    } catch (error) {
      logger.error('Error using saved descriptor', error, { component: 'FindMe' });
      addToast('Erreur lors de l\'utilisation du descripteur sauvegardé', 'error');
      setUsingSavedDescriptor(false);
    }
  };

  // Réinitialiser et reprendre la caméra
  const handleReset = () => {
    setCapturedImage(null);
    setFaceDetected(false);
    setMatchingPhotos([]);
    setFaceDetections([]);
    setUsingSavedDescriptor(false);
    startCamera();
  };
  
  // Obtenir la photo complète depuis l'ID
  const getPhotoById = (id: string): Photo | undefined => {
    return allPhotos.find(p => p.id === id);
  };

  // Photo sélectionnée dans la lightbox
  const selectedPhoto = useMemo(() => {
    if (selectedPhotoIndex === null) return null;
    const match = matchingPhotos[selectedPhotoIndex];
    if (!match) return null;
    return getPhotoById(match.id);
  }, [selectedPhotoIndex, matchingPhotos, allPhotos]);

  // URL de téléchargement pour le QR code
  const downloadUrl = useMemo(() => {
    if (!selectedPhoto) return '';
    return selectedPhoto.url;
  }, [selectedPhoto]);

  // Navigation dans la lightbox
  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (selectedPhotoIndex === null) return;
    if (direction === 'next') {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % matchingPhotos.length);
    } else {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + matchingPhotos.length) % matchingPhotos.length);
    }
  };

  // Ouvrir la lightbox
  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  // Fermer la lightbox
  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  // Gestion des touches clavier pour la lightbox
  useEffect(() => {
    if (selectedPhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        navigateLightbox('next');
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, matchingPhotos.length]);

  // Synchroniser le canvas de détection avec l'image affichée
  useEffect(() => {
    if (!faceDetected || faceDetections.length === 0 || !detectionCanvasRef.current || !capturedImage) return;

    const canvas = detectionCanvasRef.current;
    const img = new Image();
    img.src = capturedImage;

    img.onload = () => {
      const imgElement = document.querySelector('img[alt="Photo capturée"]') as HTMLImageElement;
      if (!imgElement) return;

      // Attendre que l'image soit rendue
      const updateCanvasSize = () => {
        const rect = imgElement.getBoundingClientRect();
        const scaleX = rect.width / img.width;
        const scaleY = rect.height / img.height;

        // Ajuster la taille du canvas pour correspondre à l'image affichée
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redessiner les détections
        faceDetections.forEach((detection, index) => {
          const { box, landmarks } = detection;

          const colors = [
            { box: '#10b981', landmarks: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
            { box: '#3b82f6', landmarks: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
            { box: '#f59e0b', landmarks: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
            { box: '#ef4444', landmarks: '#f87171', bg: 'rgba(239, 68, 68, 0.1)' },
          ];
          const color = colors[index % colors.length];

          // Fond semi-transparent pour le rectangle
          ctx.fillStyle = color.bg;
          ctx.fillRect(box.x, box.y, box.width, box.height);

          // Dessiner le rectangle de détection
          ctx.strokeStyle = color.box;
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Ajouter un label avec le numéro du visage
          const labelText = `Visage ${index + 1}${index === 0 ? ' (utilisé)' : ''}`;
          const labelPadding = 8;
          const labelHeight = 24;
          const labelWidth = ctx.measureText(labelText).width + labelPadding * 2;

          // Fond du label
          ctx.fillStyle = color.box;
          ctx.fillRect(box.x, box.y - labelHeight, labelWidth, labelHeight);

          // Texte du label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(labelText, box.x + labelPadding, box.y - 6);

          // Dessiner les landmarks (points de repère) - seulement pour le premier visage
          if (index === 0) {
            ctx.fillStyle = color.landmarks;
            landmarks.forEach(landmark => {
              ctx.beginPath();
              ctx.arc(landmark.x, landmark.y, 2.5, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        });
      };

      // Attendre un peu pour que l'image soit rendue
      setTimeout(updateCanvasSize, 100);
      
      // Réécouter les changements de taille
      const resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      
      resizeObserver.observe(imgElement);
      
      return () => {
        resizeObserver.disconnect();
      };
    };
  }, [faceDetected, faceDetections, capturedImage]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-pink-600/20 via-purple-600/25 to-cyan-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/25 to-purple-600/20 rounded-full blur-[120px]" />
      </div>
      
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-gray-900/98 backdrop-blur-xl border-b border-gray-800/80 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack} 
              className="relative p-2 -ml-2 active:scale-95 touch-manipulation hover:bg-gray-800/80 active:bg-gray-800 rounded-full transition-all duration-200 group"
              aria-label="Retour"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-300 blur-sm" />
              <ArrowLeft className="relative w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform duration-200" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-lg" />
                <User className="relative w-5 h-5 md:w-6 md:h-6 text-pink-400" />
              </div>
              <span className="bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                Retrouve-moi
              </span>
            </h1>
            <div className="w-9" />
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-8 overflow-y-auto relative z-10 w-full max-w-7xl mx-auto">
        {checkingSavedDescriptor ? (
          <div className="flex flex-col items-center gap-6 text-white text-center max-w-md px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
              <Loader2 className="relative w-16 h-16 animate-spin text-pink-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vérification en cours...
              </p>
              <p className="text-sm text-gray-400">
                Recherche d'un descripteur facial sauvegardé
              </p>
            </div>
          </div>
        ) : modelsLoading ? (
          <div className="flex flex-col items-center gap-6 text-white text-center max-w-md px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
              <Loader2 className="relative w-16 h-16 animate-spin text-pink-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Chargement des modèles IA...
              </p>
              <p className="text-sm text-gray-400">
                Initialisation de la reconnaissance faciale
              </p>
            </div>
            <div className="w-full max-w-xs h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : cameraError ? (
          <div className="flex flex-col items-center gap-6 text-white text-center max-w-md px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
              <div className="relative w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Accès à la caméra refusé</h2>
              <p className="text-gray-400">
                Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
              </p>
            </div>
            <button
              onClick={() => startCamera()}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Réessayer
            </button>
          </div>
        ) : savedDescriptorAvailable && !usingSavedDescriptor && !capturedImage && !stream ? (
          <div className="w-full max-w-2xl space-y-6">
            {/* Carte pour utiliser le descripteur sauvegardé */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-gray-700/50 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-2 border-pink-500/30">
                    <Sparkles className="w-10 h-10 text-pink-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Descripteur facial sauvegardé trouvé
                  </h2>
                  <p className="text-gray-400 text-base md:text-lg">
                    Nous avons trouvé votre descripteur facial enregistré lors de l'inscription.
                    Vous pouvez l'utiliser directement pour rechercher vos photos, ou capturer une nouvelle photo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button
                    onClick={useSavedDescriptor}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Utiliser le descripteur sauvegardé
                  </button>
                  <button
                    onClick={() => {
                      setSavedDescriptorAvailable(false);
                      startCamera();
                    }}
                    className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-xl font-semibold transition-all border border-gray-600/50 hover:border-gray-500 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Prendre une nouvelle photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : usingSavedDescriptor && !capturedImage ? (
          <div className="w-full max-w-4xl space-y-6">
            {/* Indicateur que le descripteur sauvegardé est utilisé */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-green-500/30 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full blur-lg" />
                  <CheckCircle className="relative w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Descripteur sauvegardé utilisé</h3>
                  <p className="text-sm text-gray-300">Recherche en cours avec votre descripteur facial enregistré...</p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-700/50 rounded-xl transition-all active:scale-95"
                  aria-label="Réinitialiser"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
            </div>
            
            {/* Résultats de recherche */}
            {isSearching ? (
              <div className="flex flex-col items-center gap-6 text-white py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
                  <Loader2 className="relative w-16 h-16 animate-spin text-pink-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold">Recherche en cours...</p>
                  <p className="text-sm text-gray-400">Analyse de {allPhotos.length} photo(s) avec l'IA</p>
                </div>
                <div className="w-full max-w-md h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </div>
            ) : matchingPhotos.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-lg" />
                      <Sparkles className="relative w-6 h-6 text-pink-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {matchingPhotos.length} photo{matchingPhotos.length > 1 ? 's' : ''} trouvée{matchingPhotos.length > 1 ? 's' : ''} !
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {matchingPhotos.map((match, index) => {
                    const photo = getPhotoById(match.id);
                    if (!photo) return null;
                    const similarityPercent = Math.round(match.similarity * 100);
                    
                    return (
                      <div
                        key={match.id}
                        onClick={() => openLightbox(index)}
                        className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/50 hover:border-pink-500/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          animation: 'slideInBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <img 
                            src={match.url} 
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500/90 to-purple-500/90 text-white px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/20">
                            <Zap className="w-3 h-3" />
                            {similarityPercent}%
                          </div>
                          {similarityPercent >= 80 && (
                            <div className="absolute top-2 left-2 bg-yellow-500/90 text-white p-1 rounded-full shadow-lg">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{photo.caption || 'Sans légende'}</p>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{photo.author}</span>
                            </div>
                            {photo.likes_count > 0 && (
                              <div className="flex items-center gap-1 text-pink-400">
                                <Heart className="w-3 h-3 fill-current" />
                                <span>{photo.likes_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 text-white py-12 text-center max-w-md">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-700/30 rounded-full blur-2xl" />
                  <div className="relative w-24 h-24 rounded-full bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold">Aucune correspondance</h2>
                  <p className="text-gray-400">
                    Aucune photo sur le mur ne contient un visage similaire au vôtre.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Réessayer
                </button>
              </div>
            )}
          </div>
        ) : capturedImage ? (
          <div className="w-full max-w-4xl space-y-6">
            {/* Image capturée - Premium Card */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-lg" />
                    <CheckCircle className="relative w-6 h-6 text-green-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Photo capturée</h2>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-700/50 rounded-xl transition-all active:scale-95 group"
                  aria-label="Reprendre"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </div>
               <div className="relative rounded-xl overflow-hidden border-2 border-gray-700/50 bg-black">
                 <div className="relative w-full">
                   <img 
                     src={capturedImage} 
                     alt="Photo capturée" 
                     className="w-full h-auto block"
                   />
                   {/* Canvas pour afficher les détections - Superposé sur l'image */}
                   {faceDetected && faceDetections.length > 0 && (
                     <canvas
                       ref={detectionCanvasRef}
                       className="absolute top-0 left-0 w-full h-auto pointer-events-none"
                       style={{ 
                         imageRendering: 'auto',
                         objectFit: 'contain'
                       }}
                     />
                   )}
                 </div>
                 {faceDetected && (
                   <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm border border-white/20 z-10">
                     <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                     <User className="w-4 h-4" />
                     <span>{faceDetections.length} visage{faceDetections.length > 1 ? 's' : ''} détecté{faceDetections.length > 1 ? 's' : ''}</span>
                   </div>
                 )}
                 {faceDetected && faceDetections.length > 1 && (
                   <div className="absolute bottom-3 left-3 bg-blue-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border border-white/20 z-10">
                     Utilisation du visage le plus proche
                   </div>
                 )}
               </div>
            </div>
            
            {/* Résultats de recherche */}
            {isSearching ? (
              <div className="flex flex-col items-center gap-6 text-white py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
                  <Loader2 className="relative w-16 h-16 animate-spin text-pink-500" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold">Recherche en cours...</p>
                  <p className="text-sm text-gray-400">Analyse de {allPhotos.length} photo(s) avec l'IA</p>
                </div>
                <div className="w-full max-w-md h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </div>
            ) : matchingPhotos.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-lg" />
                      <Sparkles className="relative w-6 h-6 text-pink-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {matchingPhotos.length} photo{matchingPhotos.length > 1 ? 's' : ''} trouvée{matchingPhotos.length > 1 ? 's' : ''} !
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {matchingPhotos.map((match, index) => {
                    const photo = getPhotoById(match.id);
                    if (!photo) return null;
                    const similarityPercent = Math.round(match.similarity * 100);
                    
                    return (
                      <div
                        key={match.id}
                        onClick={() => openLightbox(index)}
                        className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/50 hover:border-pink-500/50 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          animation: 'slideInBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <img 
                            src={match.url} 
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500/90 to-purple-500/90 text-white px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/20">
                            <Zap className="w-3 h-3" />
                            {similarityPercent}%
                          </div>
                          {similarityPercent >= 80 && (
                            <div className="absolute top-2 left-2 bg-yellow-500/90 text-white p-1 rounded-full shadow-lg">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{photo.caption || 'Sans légende'}</p>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{photo.author}</span>
                            </div>
                            {photo.likes_count > 0 && (
                              <div className="flex items-center gap-1 text-pink-400">
                                <Heart className="w-3 h-3 fill-current" />
                                <span>{photo.likes_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : faceDetected ? (
              <div className="flex flex-col items-center gap-6 text-white py-12 text-center max-w-md">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-700/30 rounded-full blur-2xl" />
                  <div className="relative w-24 h-24 rounded-full bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold">Aucune correspondance</h2>
                  <p className="text-gray-400">
                    Aucune photo sur le mur ne contient un visage similaire au vôtre.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Réessayer
                </button>
              </div>
            ) : null}
          </div>
        ) : !savedDescriptorAvailable && !usingSavedDescriptor ? (
          <div className="w-full max-w-3xl space-y-6 md:space-y-8">
            {/* Instructions Premium */}
            <div className="text-center text-white space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full mb-2">
                <Zap className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold">Reconnaissance faciale IA</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
                Prenez une photo de votre visage
              </h2>
              <p className="text-gray-400 text-lg">
                Nous allons rechercher vos photos sur le mur avec l'intelligence artificielle
              </p>
            </div>
            
            {/* Caméra Premium */}
            <div className="relative bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl w-full max-w-lg mx-auto aspect-[3/4] md:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Overlay de guidage moderne */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                <div className="relative w-full h-full border-2 border-white/20 rounded-2xl overflow-hidden">
                  {/* Scanner Animation Line */}
                  <div 
                    className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_15px_rgba(236,72,153,0.8)]"
                    style={{ animation: 'scan 3s ease-in-out infinite' }}
                  />
                  
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-l-4 border-pink-500/80 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-r-4 border-pink-500/80 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-l-4 border-pink-500/80 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-r-4 border-pink-500/80 rounded-br-xl" />
                  
                  {/* Face Guide Silhouette (optional, subtle) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-48 h-64 border-2 border-white rounded-[50%]" />
                  </div>
                </div>
              </div>
              
              {/* Instructions flottantes */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg">
                <p className="text-sm text-white font-medium whitespace-nowrap">Placez votre visage dans le cadre</p>
              </div>
            </div>
            
            <style>{`
              @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            `}</style>
            
            {/* Contrôles Premium */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleSwitchCamera}
                className="p-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-xl rounded-full transition-all border border-gray-700/50 hover:border-gray-600 shadow-lg hover:scale-110 active:scale-95 group"
                aria-label="Basculer la caméra"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-300 blur-sm" />
                <Camera className="relative w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={capturePhoto}
                disabled={!stream}
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xl hover:shadow-pink-500/50 hover:scale-110 active:scale-95 overflow-hidden group"
                aria-label="Capturer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Camera className="relative w-10 h-10 md:w-12 md:h-12 text-white" />
                {stream && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                )}
              </button>
              
              <div className="w-16" />
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Lightbox pour afficher la photo en grand avec QR code */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-y-auto"
          onClick={closeLightbox}
          style={{
            animation: 'fadeIn 0.3s ease-out forwards',
          }}
        >
          <div
            className={`relative w-full ${isMobile ? 'min-h-screen' : 'max-w-6xl max-h-[90vh]'} flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 md:gap-6 p-4 md:p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer - Position adaptée mobile/desktop */}
            <button
              onClick={closeLightbox}
              className={`absolute ${isMobile ? 'top-4 right-4' : '-top-4 -right-4 md:-top-6 md:-right-6'} bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border-2 border-white/20 text-white ${isMobile ? 'px-4 py-2' : 'px-5 py-2.5'} rounded-2xl backdrop-blur-xl transition-all duration-300 font-bold text-sm shadow-2xl hover:scale-110 active:scale-95 z-50`}
              aria-label="Fermer"
            >
              <span className="flex items-center gap-2">
                <X className="w-5 h-5" />
                {!isMobile && <span>Fermer</span>}
              </span>
            </button>

            {/* Navigation - Adaptée pour mobile */}
            {matchingPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('prev');
                  }}
                  className={`absolute ${isMobile ? 'left-2 top-1/2' : 'left-0 top-1/2 -translate-x-4 md:-translate-x-16'} -translate-y-1/2 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 active:scale-95 border-2 border-white/30 text-white ${isMobile ? 'w-10 h-10' : 'w-14 h-14 md:w-16 md:h-16'} rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-2xl hover:scale-110 z-50 flex items-center justify-center`}
                  aria-label="Photo précédente"
                >
                  <ArrowLeft className={isMobile ? 'w-5 h-5' : 'w-8 h-8'} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('next');
                  }}
                  className={`absolute ${isMobile ? 'right-2 top-1/2' : 'right-0 top-1/2 translate-x-4 md:translate-x-16'} -translate-y-1/2 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 active:scale-95 border-2 border-white/30 text-white ${isMobile ? 'w-10 h-10' : 'w-14 h-14 md:w-16 md:h-16'} rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-2xl hover:scale-110 z-50 flex items-center justify-center`}
                  aria-label="Photo suivante"
                >
                  <ArrowRight className={isMobile ? 'w-5 h-5' : 'w-8 h-8'} />
                </button>
              </>
            )}

            {/* Image principale - Adaptée mobile */}
            <div className={`${isMobile ? 'w-full flex-1' : 'flex-1'} flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 ${isMobile ? 'p-2' : 'p-4 md:p-6'} min-h-0`}>
              <div className="relative w-full h-full flex items-center justify-center">
                {selectedPhoto.type === 'video' ? (
                  <video
                    src={selectedPhoto.url}
                    className={`w-full ${isMobile ? 'max-h-[50vh]' : 'max-h-[70vh] md:max-h-[80vh]'} object-contain rounded-xl`}
                    controls
                    playsInline
                    autoPlay
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption}
                    className={`w-full ${isMobile ? 'max-h-[50vh]' : 'max-h-[70vh] md:max-h-[80vh]'} object-contain rounded-xl`}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </div>

            {/* Sidebar avec infos et QR code - Adaptée mobile */}
            <div className={`${isMobile ? 'w-full' : 'w-full md:w-80'} flex flex-col gap-4 ${isMobile ? 'pb-4' : ''}`}>
              {/* Infos photo */}
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-700/50 shadow-xl">
                <div className="space-y-3 md:space-y-4">
                  {/* Header avec similarité */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-lg" />
                        <Sparkles className="relative w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-gray-300">Correspondance</span>
                    </div>
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5">
                      <Zap className="w-3 h-3 md:w-4 md:h-4" />
                      {Math.round(matchingPhotos[selectedPhotoIndex].similarity * 100)}%
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <p className="text-base md:text-lg lg:text-xl font-bold text-white mb-2 line-clamp-3">
                      {selectedPhoto.caption}
                    </p>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                      <User className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{selectedPhoto.author}</span>
                    </div>
                  </div>

                  {/* Likes */}
                  {selectedPhoto.likes_count > 0 && (
                    <div className="flex items-center gap-2 text-pink-400">
                      <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                      <span className="text-sm md:text-base font-semibold">{selectedPhoto.likes_count} like{selectedPhoto.likes_count > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-[10px] md:text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                    {new Date(selectedPhoto.timestamp).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* QR Code pour télécharger - Optimisé mobile */}
              <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-2xl p-3 md:p-4 lg:p-5 shadow-2xl border-2 border-white/50 relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                {/* QR Code Container */}
                <div className="relative bg-white p-2 md:p-3 rounded-xl shadow-inner border border-gray-200/50 flex justify-center">
                  <QRCodeCanvas
                    value={downloadUrl}
                    size={isMobile ? 160 : 200}
                    level={"H"}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    includeMargin={false}
                    key={selectedPhoto.id}
                  />
                  {/* Logo overlay center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 md:p-2 shadow-lg border border-gray-200/30">
                      <Download className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6 md:w-8 md:h-8'} text-gray-800`} />
                    </div>
                  </div>
                </div>

                {/* Text avec animations */}
                <div className="text-center mt-2 md:mt-3 relative z-10">
                  <p className="text-gray-900 font-extrabold text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] mb-1 group-hover:text-pink-600 transition-colors">
                    Télécharger
                  </p>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-600 font-extrabold text-[9px] md:text-[10px] lg:text-xs">
                    cette photo !
                  </p>
                </div>

                {/* Decorative corner marks */}
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 md:w-3 md:h-3 border-t-2 border-l-2 border-pink-400/40 rounded-tl-lg" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 md:w-3 md:h-3 border-t-2 border-r-2 border-pink-400/40 rounded-tr-lg" />
                <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 md:w-3 md:h-3 border-b-2 border-l-2 border-pink-400/40 rounded-bl-lg" />
                <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 md:w-3 md:h-3 border-b-2 border-r-2 border-pink-400/40 rounded-br-lg" />
              </div>

              {/* Compteur */}
              {matchingPhotos.length > 1 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-xl px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-gray-700/50 text-white text-xs md:text-sm font-bold">
                    <span>{selectedPhotoIndex + 1}</span>
                    <span className="text-gray-400">/</span>
                    <span>{matchingPhotos.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindMe;

