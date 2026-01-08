import { useState, useRef, useEffect, useCallback } from 'react';
import { MAX_VIDEO_DURATION } from '../constants';
import { logger } from '../utils/logger';
import { useToast } from '../context/ToastContext';

export const useVideoRecording = (stream: MediaStream | null) => {
  const { addToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = useCallback(() => {
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
        setVideoPreviewUrl(url);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (error) {
      logger.error('Error starting video recording', error, { component: 'useVideoRecording', action: 'startRecording' });
      addToast("Erreur lors du démarrage de l'enregistrement vidéo", 'error');
    }
  }, [stream, addToast]);

  const stopRecording = useCallback(() => {
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

      if (elapsed >= MAX_VIDEO_DURATION) {
        stopRecording();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime, stopRecording]);

  const reset = useCallback(() => {
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
    videoRef,
    startRecording,
    stopRecording,
    reset
  };
};

