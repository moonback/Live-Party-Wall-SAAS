import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Radio } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { getActiveLiveStream, subscribeToLiveStreams, type LiveStream } from '../../services/liveStreamService';
import { generateSenderId, sendSignalingMessage, subscribeToSignalingMessages } from '../../services/webrtcSignalingService';
import { registerViewer, unregisterViewer, updateViewerLastSeen, generateViewerId, subscribeToViewerCount } from '../../services/streamViewersService';
import { logger } from '../../utils/logger';

interface LiveStreamViewerProps {
  className?: string;
  onStreamEnd?: () => void;
  onStreamStart?: () => void;
}

/**
 * Composant pour afficher le stream live sur le mur
 * Utilise WebRTC pour recevoir et afficher le stream en temps réel
 */
export const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  className = '',
  onStreamEnd,
  onStreamStart
}) => {
  const { currentEvent } = useEvent();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const viewerIdRef = useRef<string | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger le stream actif et s'abonner aux changements
  useEffect(() => {
    if (!currentEvent?.id) return;

    setIsLoading(true);
    
    // Récupérer le stream actif initial
    getActiveLiveStream(currentEvent.id)
      .then((activeStream) => {
        setStream(activeStream);
        setIsLoading(false);
        
        if (activeStream) {
          // Démarrer la réception du stream
          startReceivingStream(activeStream);
        }
      })
      .catch((err) => {
        logger.error("Error loading active stream", err, {
          component: 'LiveStreamViewer',
          action: 'loadStream'
        });
        setError("Erreur lors du chargement du stream");
        setIsLoading(false);
      });

    // S'abonner aux changements
    const unsubscribe = subscribeToLiveStreams(currentEvent.id, (activeStream) => {
      setStream(activeStream);
      
      if (activeStream && activeStream.is_active) {
        startReceivingStream(activeStream);
        if (onStreamStart) {
          onStreamStart();
        }
      } else {
        stopReceivingStream();
        if (onStreamEnd) {
          onStreamEnd();
        }
      }
    });

    return () => {
      unsubscribe();
      stopReceivingStream();
    };
  }, [currentEvent?.id, onStreamEnd]);

  /**
   * Démarre la réception du stream via WebRTC avec signalisation
   */
  const startReceivingStream = async (activeStream: LiveStream) => {
    try {
      streamIdRef.current = activeStream.id;
      
      // Générer un ID unique pour ce viewer
      viewerIdRef.current = generateViewerId();
      
      // Enregistrer le viewer
      await registerViewer(activeStream.id, activeStream.event_id, viewerIdRef.current);
      
      // Créer la PeerConnection WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Gérer les tracks reçus
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch(err => {
            logger.error("Error playing received stream", err, {
              component: 'LiveStreamViewer',
              action: 'ontrack'
            });
          });
        }
      };

      // Gérer les ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && streamIdRef.current && viewerIdRef.current) {
          sendSignalingMessage(
            streamIdRef.current,
            activeStream.event_id,
            'viewer',
            viewerIdRef.current,
            'ice-candidate',
            { candidate: event.candidate }
          ).catch(err => {
            logger.error("Error sending ICE candidate", err, {
              component: 'LiveStreamViewer',
              action: 'onicecandidate'
            });
          });
        }
      };

      // S'abonner aux messages de signalisation du broadcaster
      const unsubscribeSignaling = subscribeToSignalingMessages(
        activeStream.id,
        viewerIdRef.current,
        'viewer',
        async (message) => {
          try {
            if (message.message_type === 'offer' && message.message_data.sdp) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.message_data.sdp));
              
              // Créer et envoyer la réponse
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              if (streamIdRef.current && viewerIdRef.current) {
                await sendSignalingMessage(
                  streamIdRef.current,
                  activeStream.event_id,
                  'viewer',
                  viewerIdRef.current,
                  'answer',
                  { sdp: answer }
                );
              }
            } else if (message.message_type === 'ice-candidate' && message.message_data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(message.message_data.candidate));
            }
          } catch (err) {
            logger.error("Error handling signaling message", err, {
              component: 'LiveStreamViewer',
              action: 'handleSignalingMessage'
            });
          }
        }
      );

      peerConnectionRef.current = pc;

      // Mettre en place le heartbeat pour maintenir le viewer actif
      heartbeatIntervalRef.current = setInterval(() => {
        if (streamIdRef.current && viewerIdRef.current) {
          updateViewerLastSeen(streamIdRef.current, viewerIdRef.current).catch(err => {
            logger.error("Error updating viewer last seen", err, {
              component: 'LiveStreamViewer',
              action: 'heartbeat'
            });
          });
        }
      }, 10000); // Toutes les 10 secondes

      // S'abonner au compteur de viewers
      const unsubscribeViewers = subscribeToViewerCount(
        activeStream.id,
        (count) => {
          setViewerCount(count);
        }
      );

      // Stocker les fonctions de cleanup
      (pc as any).cleanup = () => {
        unsubscribeSignaling();
        unsubscribeViewers();
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };

      logger.info("Started receiving stream via WebRTC", null, {
        component: 'LiveStreamViewer',
        action: 'startReceivingStream',
        streamId: activeStream.id
      });
      
      setError(null);
    } catch (err) {
      logger.error("Error receiving stream", err, {
        component: 'LiveStreamViewer',
        action: 'startReceivingStream'
      });
      setError("Erreur lors de la réception du stream");
    }
  };

  /**
   * Arrête la réception du stream
   */
  const stopReceivingStream = async () => {
    // Nettoyer le heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Retirer le viewer
    if (streamIdRef.current && viewerIdRef.current) {
      await unregisterViewer(streamIdRef.current, viewerIdRef.current);
    }

    // Fermer la PeerConnection
    if (peerConnectionRef.current) {
      if ((peerConnectionRef.current as any).cleanup) {
        (peerConnectionRef.current as any).cleanup();
      }
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    viewerIdRef.current = null;
    streamIdRef.current = null;
    setViewerCount(0);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-black/50 ${className}`}>
        <div className="text-center text-white">
          <Radio className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Chargement du stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-900/50 ${className}`}>
        <div className="text-center text-white">
          <Video className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!stream || !stream.is_active) {
    return null; // Pas de stream actif, ne rien afficher
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`relative w-full h-full bg-black ${className}`}
      >
        {/* Indicateur "LIVE" */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-bold text-sm">LIVE</span>
        </div>

        {/* Titre du stream (si disponible) */}
        {stream.title && (
          <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="text-sm font-semibold">{stream.title}</p>
          </div>
        )}

        {/* Vidéo */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />

        {/* Overlay avec informations */}
        <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white px-4 py-2 rounded-lg">
          <p className="text-xs">
            {stream.created_by && `Diffusé par ${stream.created_by}`}
            {(viewerCount > 0 || stream.viewer_count > 0) && ` • ${viewerCount || stream.viewer_count} spectateur${(viewerCount || stream.viewer_count) > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Message si le stream n'est pas encore connecté */}
        {!videoRef.current?.srcObject && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
              <p className="text-lg">Connexion au stream...</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

