import React, { useEffect, useState } from 'react';
import { Video, Play, Download, Eye, Clock } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { getStreamRecordings, incrementRecordingViewCount, type StreamRecording } from '../../services/streamRecordingService';
import { logger } from '../../utils/logger';
import { useToast } from '../../context/ToastContext';

interface StreamRecordingsListProps {
  className?: string;
}

/**
 * Composant pour afficher la liste des enregistrements de streams (replays)
 */
export const StreamRecordingsList: React.FC<StreamRecordingsListProps> = ({
  className = ''
}) => {
  const { currentEvent } = useEvent();
  const { addToast } = useToast();
  const [recordings, setRecordings] = useState<StreamRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

  // Charger les enregistrements
  useEffect(() => {
    if (!currentEvent?.id) return;

    const loadRecordings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getStreamRecordings(currentEvent.id);
        setRecordings(data);
      } catch (err) {
        logger.error("Error loading stream recordings", err, {
          component: 'StreamRecordingsList',
          action: 'loadRecordings'
        });
        setError("Erreur lors du chargement des enregistrements");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, [currentEvent?.id]);

  const handlePlayRecording = async (recording: StreamRecording) => {
    try {
      // Incrémenter le compteur de vues
      await incrementRecordingViewCount(recording.id);
      
      // Ouvrir dans un nouvel onglet
      window.open(recording.url, '_blank', 'noopener,noreferrer');
      
      setPlayingRecordingId(recording.id);
      setTimeout(() => setPlayingRecordingId(null), 2000);
    } catch (err) {
      logger.error("Error playing recording", err, {
        component: 'StreamRecordingsList',
        action: 'handlePlayRecording'
      });
      addToast("Erreur lors de l'ouverture du replay", 'error');
    }
  };

  const handleDownloadRecording = (recording: StreamRecording) => {
    try {
      const link = document.createElement('a');
      link.href = recording.url;
      link.download = recording.filename;
      link.click();
    } catch (err) {
      logger.error("Error downloading recording", err, {
        component: 'StreamRecordingsList',
        action: 'handleDownloadRecording'
      });
      addToast("Erreur lors du téléchargement", 'error');
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <p>Chargement des replays...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-red-400">
            <Video className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-pink-400" />
          <h2 className="text-xl font-bold text-white">Replays</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Aucun replay disponible</p>
            <p className="text-sm mt-2">Les enregistrements apparaîtront ici après chaque stream</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Video className="w-6 h-6 text-pink-400" />
        <h2 className="text-xl font-bold text-white">Replays</h2>
        <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
          {recordings.length}
        </span>
      </div>

      <div className="space-y-4">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-pink-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-2 truncate">
                  {recording.title || 'Stream sans titre'}
                </h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(recording.duration_seconds)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>{formatFileSize(recording.file_size)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{recording.view_count} vue{recording.view_count > 1 ? 's' : ''}</span>
                  </div>
                  
                  <span className="text-xs">
                    {formatDate(recording.started_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayRecording(recording)}
                  disabled={playingRecordingId === recording.id}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  <span>{playingRecordingId === recording.id ? 'Ouverture...' : 'Voir'}</span>
                </button>
                
                <button
                  onClick={() => handleDownloadRecording(recording)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

