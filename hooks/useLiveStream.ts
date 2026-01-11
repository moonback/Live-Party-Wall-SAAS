import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { logger } from '../utils/logger';
import { createLiveStream, stopLiveStream, getActiveLiveStream, subscribeToLiveStreams, type LiveStream } from '../services/liveStreamService';
import { generateSenderId, sendSignalingMessage, subscribeToSignalingMessages } from '../services/webrtcSignalingService';
import { registerViewer, unregisterViewer, updateViewerLastSeen, generateViewerId, subscribeToViewerCount } from '../services/streamViewersService';
import { uploadStreamRecording } from '../services/streamRecordingService';
import { updateViewerCount } from '../services/liveStreamService';

interface UseLiveStreamOptions {
  eventId: string;
  enabled?: boolean; // Si false, ne démarre pas automatiquement
}

interface UseLiveStreamReturn {
  // État du stream
  stream: LiveStream | null;
  isStreaming: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Contrôles
  startStream: (title?: string) => Promise<void>;
  stopStream: () => Promise<void>;
  
  // MediaStream pour la caméra
  mediaStream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  
  // Contrôles de la caméra
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  cameraError: boolean;
  videoDevices: MediaDeviceInfo[];
  switchCamera: () => Promise<void>;
}

/**
 * Hook pour gérer le streaming live via une caméra déportée
 * Utilise WebRTC pour capturer et diffuser le stream en temps réel
 */
export const useLiveStream = (options: UseLiveStreamOptions): UseLiveStreamReturn => {
  const { eventId, enabled = true } = options;
  const { addToast } = useToast();
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Charger les devices vidéo disponibles
  useEffect(() => {
    const loadVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoDevices);
        
        // Sélectionner le premier device par défaut
        if (videoDevices.length > 0 && !currentDeviceId) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        logger.error("Error loading video devices", error, {
          component: 'useLiveStream',
          action: 'loadVideoDevices'
        });
      }
    };
    
    loadVideoDevices();
  }, [currentDeviceId]);

  // S'abonner aux changements de streams
  useEffect(() => {
    if (!enabled) return;
    
    // Récupérer le stream actif initial
    getActiveLiveStream(eventId).then(setStream);
    
    // S'abonner aux changements
    const unsubscribe = subscribeToLiveStreams(eventId, (activeStream) => {
      setStream(activeStream);
      setIsStreaming(activeStream?.is_active ?? false);
      
      if (activeStream?.id) {
        streamIdRef.current = activeStream.id;
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [eventId, enabled]);

  // Mettre à jour le video element quand le stream change
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        logger.error("Error playing video stream", err, {
          component: 'useLiveStream',
          action: 'playVideo'
        });
      });
    }
  }, [mediaStream]);

  /**
   * Démarre la caméra
   */
  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: currentDeviceId ? undefined : 'environment'
        },
        audio: true // Inclure l'audio pour le stream complet
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      
      logger.info("Camera started successfully", null, {
        component: 'useLiveStream',
        action: 'startCamera'
      });
    } catch (error) {
      logger.error("Error starting camera", error, {
        component: 'useLiveStream',
        action: 'startCamera'
      });
      setCameraError(true);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      addToast("Erreur d'accès à la caméra", 'error');
    }
  }, [currentDeviceId, addToast]);

  /**
   * Arrête la caméra
   */
  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraError(false);
  }, [mediaStream]);

  /**
   * Change de caméra
   */
  const switchCamera = useCallback(async () => {
    if (videoDevices.length < 2) return;
    
    const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    
    setCurrentDeviceId(nextDevice.deviceId);
    
    // Redémarrer la caméra avec le nouveau device
    if (mediaStream) {
      stopCamera();
      await new Promise(resolve => setTimeout(resolve, 100));
      await startCamera();
    }
  }, [videoDevices, currentDeviceId, mediaStream, stopCamera, startCamera]);

  /**
   * Démarre le streaming live avec WebRTC et enregistrement
   */
  const startStream = useCallback(async (title?: string) => {
    if (isStreaming) {
      logger.warn("Stream already active", null, {
        component: 'useLiveStream',
        action: 'startStream'
      });
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // 1. Démarrer la caméra si pas déjà démarrée
      if (!mediaStream) {
        await startCamera();
        // Attendre que le mediaStream soit mis à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentStream = mediaStream;
        if (!currentStream) {
          throw new Error("Impossible de démarrer la caméra");
        }
      }

      // 2. Créer le stream dans la base de données
      const newStream = await createLiveStream(eventId, title);
      streamIdRef.current = newStream.id;
      setStream(newStream);
      setIsStreaming(true);
      recordingStartTimeRef.current = Date.now();
      
      // 3. Générer un ID unique pour le broadcaster
      broadcasterIdRef.current = generateSenderId();
      
      // 4. Créer la PeerConnection WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Ajouter les tracks du mediaStream à la PeerConnection
      if (currentMediaStream) {
        currentMediaStream.getTracks().forEach(track => {
          pc.addTrack(track, currentMediaStream!);
        });
      }

      // Gérer les ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && streamIdRef.current && broadcasterIdRef.current) {
          sendSignalingMessage(
            streamIdRef.current,
            eventId,
            'broadcaster',
            broadcasterIdRef.current,
            'ice-candidate',
            { candidate: event.candidate }
          ).catch(err => {
            logger.error("Error sending ICE candidate", err, {
              component: 'useLiveStream',
              action: 'onicecandidate'
            });
          });
        }
      };

      // Créer et envoyer l'offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (streamIdRef.current && broadcasterIdRef.current) {
        await sendSignalingMessage(
          streamIdRef.current,
          eventId,
          'broadcaster',
          broadcasterIdRef.current,
          'offer',
          { sdp: offer }
        );
      }

      // S'abonner aux réponses des viewers
      const unsubscribeSignaling = subscribeToSignalingMessages(
        streamIdRef.current!,
        broadcasterIdRef.current,
        'broadcaster',
        async (message) => {
          try {
            if (message.message_type === 'answer' && message.message_data.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.message_data.sdp));
            } else if (message.message_type === 'ice-candidate' && message.message_data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(message.message_data.candidate));
            }
          } catch (err) {
            logger.error("Error handling signaling message", err, {
              component: 'useLiveStream',
              action: 'handleSignalingMessage'
            });
          }
        }
      );

      peerConnectionRef.current = pc;

      // 5. Démarrer l'enregistrement pour replay
      if (currentMediaStream) {
        const mediaRecorder = new MediaRecorder(currentMediaStream, {
          mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4',
          videoBitsPerSecond: 2500000 // 2.5 Mbps pour une bonne qualité
        });

        chunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Uploader l'enregistrement
          if (chunksRef.current.length > 0 && streamIdRef.current) {
            try {
              const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
              const duration = recordingStartTimeRef.current 
                ? (Date.now() - recordingStartTimeRef.current) / 1000 
                : undefined;
              
              await uploadStreamRecording(
                eventId,
                streamIdRef.current,
                blob,
                title,
                duration,
                recordingStartTimeRef.current ? new Date(recordingStartTimeRef.current).toISOString() : undefined,
                new Date().toISOString()
              );
              
              logger.info("Stream recording uploaded", null, {
                component: 'useLiveStream',
                action: 'uploadRecording'
              });
            } catch (err) {
              logger.error("Error uploading stream recording", err, {
                component: 'useLiveStream',
                action: 'uploadRecording'
              });
            }
          }
        };

        mediaRecorder.start(1000); // Enregistrer des chunks toutes les secondes
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      }

      // 6. S'abonner au compteur de viewers
      const unsubscribeViewers = subscribeToViewerCount(
        newStream.id,
        (count) => {
          setViewerCount(count);
          // Mettre à jour le compteur dans la base
          if (streamIdRef.current) {
            updateViewerCount(streamIdRef.current, count).catch(err => {
              logger.error("Error updating viewer count", err, {
                component: 'useLiveStream',
                action: 'updateViewerCount'
              });
            });
          }
        }
      );

      // Nettoyer les subscriptions à l'arrêt
      const cleanup = () => {
        unsubscribeSignaling();
        unsubscribeViewers();
      };
      
      // Stocker la fonction de cleanup
      (pc as any).cleanup = cleanup;

      addToast("Stream live démarré avec succès", 'success');
      logger.info("Live stream started", null, {
        component: 'useLiveStream',
        action: 'startStream',
        streamId: newStream.id
      });
    } catch (error) {
      logger.error("Error starting live stream", error, {
        component: 'useLiveStream',
        action: 'startStream'
      });
      setError(error instanceof Error ? error.message : "Erreur lors du démarrage du stream");
      addToast("Erreur lors du démarrage du stream", 'error');
    } finally {
      setIsInitializing(false);
    }
  }, [isStreaming, mediaStream, eventId, startCamera, addToast]);

  /**
   * Arrête le streaming live
   */
  const stopStream = useCallback(async () => {
    if (!isStreaming || !streamIdRef.current) {
      return;
    }

    try {
      // Arrêter le MediaRecorder (déclenchera l'upload de l'enregistrement)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        setIsRecording(false);
      }

      // Fermer la PeerConnection
      if (peerConnectionRef.current) {
        if ((peerConnectionRef.current as any).cleanup) {
          (peerConnectionRef.current as any).cleanup();
        }
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Arrêter le stream dans la base de données
      await stopLiveStream(streamIdRef.current);
      streamIdRef.current = null;
      broadcasterIdRef.current = null;
      recordingStartTimeRef.current = null;
      setStream(null);
      setIsStreaming(false);
      setViewerCount(0);
      
      // Arrêter la caméra
      stopCamera();

      addToast("Stream live arrêté", 'success');
      logger.info("Live stream stopped", null, {
        component: 'useLiveStream',
        action: 'stopStream'
      });
    } catch (error) {
      logger.error("Error stopping live stream", error, {
        component: 'useLiveStream',
        action: 'stopStream'
      });
      setError(error instanceof Error ? error.message : "Erreur lors de l'arrêt du stream");
      addToast("Erreur lors de l'arrêt du stream", 'error');
    }
  }, [isStreaming, stopCamera, addToast]);

  // Nettoyage à la destruction
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [stopCamera]);

  return {
    stream,
    isStreaming,
    isInitializing,
    error,
    startStream,
    stopStream,
    mediaStream,
    videoRef,
    startCamera,
    stopCamera,
    cameraError,
    videoDevices,
    switchCamera,
    viewerCount,
    isRecording
  };
};

