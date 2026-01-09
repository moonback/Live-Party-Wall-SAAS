import { useState, useRef, useEffect, useCallback } from 'react';
import { BOOMERANG_DURATION } from '../constants';
import { logger } from '../utils/logger';
import { useToast } from '../context/ToastContext';

export const useBoomerangRecording = (stream: MediaStream | null) => {
  const { addToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const autoStopTimeoutRef = useRef<number | null>(null);

  const startRecording = useCallback(() => {
    if (!stream) return;

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
        setVideoPreviewUrl(url);
        setIsRecording(false);
        setVideoDuration(BOOMERANG_DURATION);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());

      // Arrêt automatique après BOOMERANG_DURATION secondes
      autoStopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, BOOMERANG_DURATION * 1000);

    } catch (error) {
      logger.error('Error starting boomerang recording', error, { component: 'useBoomerangRecording', action: 'startRecording' });
      addToast("Erreur lors du démarrage de l'enregistrement boomerang", 'error');
    }
  }, [stream, addToast]);

  const stopRecording = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingStartTime) {
        const duration = (Date.now() - recordingStartTime) / 1000;
        setVideoDuration(duration);
        setRecordingStartTime(null);
      }
    }
  }, [isRecording, recordingStartTime]);

  useEffect(() => {
    if (!isRecording || !recordingStartTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      setVideoDuration(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  const reset = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setRecordedBlob(null);
    setVideoPreviewUrl(null);
    setVideoDuration(0);
    setRecordingStartTime(null);
    recordingChunksRef.current = [];
  }, [videoPreviewUrl]);

  return {
    isRecording,
    recordedBlob,
    videoPreviewUrl,
    videoDuration,
    startRecording,
    stopRecording,
    reset
  };
};

