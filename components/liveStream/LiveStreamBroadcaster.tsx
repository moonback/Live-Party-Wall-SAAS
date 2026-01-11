import React, { useState } from 'react';
import { Radio, Video, VideoOff, Camera, CameraOff, RotateCcw } from 'lucide-react';
import { useLiveStream } from '../../hooks/useLiveStream';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { logger } from '../../utils/logger';

interface LiveStreamBroadcasterProps {
  className?: string;
}

/**
 * Composant pour démarrer/arrêter le streaming live depuis l'interface admin
 */
export const LiveStreamBroadcaster: React.FC<LiveStreamBroadcasterProps> = ({
  className = ''
}) => {
  const { currentEvent } = useEvent();
  const { addToast } = useToast();
  const [streamTitle, setStreamTitle] = useState('');

  const {
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
  } = useLiveStream({
    eventId: currentEvent?.id || '',
    enabled: true
  });

  const handleStartStream = async () => {
    if (!currentEvent?.id) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }

    if (!streamTitle.trim()) {
      addToast("Veuillez entrer un titre pour le stream", 'error');
      return;
    }

    try {
      await startStream(streamTitle.trim());
    } catch (err) {
      logger.error("Error starting stream", err, {
        component: 'LiveStreamBroadcaster',
        action: 'handleStartStream'
      });
    }
  };

  const handleStopStream = async () => {
    try {
      await stopStream();
      setStreamTitle('');
    } catch (err) {
      logger.error("Error stopping stream", err, {
        component: 'LiveStreamBroadcaster',
        action: 'handleStopStream'
      });
    }
  };

  if (!currentEvent) {
    return (
      <div className={`p-4 bg-slate-800 rounded-lg ${className}`}>
        <p className="text-slate-400">Aucun événement sélectionné</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Radio className="w-6 h-6 text-pink-400" />
        <h2 className="text-xl font-bold text-white">Diffusion Live</h2>
      </div>

      {/* Prévisualisation de la caméra */}
      <div className="mb-6 relative bg-black rounded-lg overflow-hidden aspect-video">
        {mediaStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <CameraOff className="w-12 h-12 mx-auto mb-2" />
              <p>Caméra non démarrée</p>
            </div>
          </div>
        )}

        {/* Indicateur de streaming */}
        {isStreaming && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-bold">EN DIRECT</span>
          </div>
        )}

        {/* Erreur caméra */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
            <div className="text-center text-white p-4">
              <CameraOff className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Erreur d'accès à la caméra</p>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles de la caméra */}
      <div className="flex gap-2 mb-6">
        {!mediaStream ? (
          <button
            onClick={startCamera}
            disabled={isInitializing}
            className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Démarrer la caméra</span>
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <CameraOff className="w-5 h-5" />
              <span>Arrêter la caméra</span>
            </button>
            {videoDevices.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                title="Changer de caméra"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Formulaire de démarrage du stream */}
      {mediaStream && !isStreaming && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Titre du stream (optionnel)
          </label>
          <input
            type="text"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            placeholder="Ex: Soirée complète - 2026"
            className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      )}

      {/* Contrôles du stream */}
      <div className="flex gap-2">
        {!isStreaming ? (
          <button
            onClick={handleStartStream}
            disabled={!mediaStream || isInitializing || !streamTitle.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            <Video className="w-5 h-5" />
            <span>{isInitializing ? 'Démarrage...' : 'Démarrer le stream'}</span>
          </button>
        ) : (
          <button
            onClick={handleStopStream}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            <VideoOff className="w-5 h-5" />
            <span>Arrêter le stream</span>
          </button>
        )}
      </div>

      {/* Informations du stream */}
      {stream && isStreaming && (
        <div className="mt-6 p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">Stream actif</p>
          <p className="text-white font-semibold">{stream.title || 'Sans titre'}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            {viewerCount > 0 && (
              <p className="text-slate-300">
                👁️ {viewerCount} spectateur{viewerCount > 1 ? 's' : ''}
              </p>
            )}
            {isRecording && (
              <p className="text-red-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                Enregistrement en cours
              </p>
            )}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-600 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

