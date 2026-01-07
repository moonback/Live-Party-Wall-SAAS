/**
 * Service de détection d'applaudissements via Web Audio API
 * Détecte les applaudissements en analysant les fréquences audio du microphone
 */

interface ApplauseDetectionOptions {
  /** Seuil de détection (0-1), plus élevé = moins sensible */
  threshold?: number;
  /** Durée minimale d'un applaudissement en ms */
  minDuration?: number;
  /** Callback appelé lors de la détection d'un applaudissement */
  onApplause?: () => void;
  /** Callback appelé lors de la détection d'une rafale d'applaudissements */
  onApplauseBurst?: (intensity: number) => void;
}

interface ApplauseDetectionResult {
  /** Arrêter la détection */
  stop: () => void;
  /** Activer/désactiver la détection */
  setEnabled: (enabled: boolean) => void;
  /** Obtenir l'état actuel */
  isEnabled: () => boolean;
}

/**
 * Détecte les applaudissements via le microphone
 * Les applaudissements ont des caractéristiques spécifiques :
 * - Fréquences hautes (2000-4000 Hz)
 * - Pattern rythmique (claps répétés)
 * - Volume élevé soudain
 */
export const startApplauseDetection = async (
  options: ApplauseDetectionOptions = {}
): Promise<ApplauseDetectionResult> => {
  const {
    threshold = 0.6,
    minDuration = 100,
    onApplause,
    onApplauseBurst
  } = options;

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let stream: MediaStream | null = null;
  let animationFrameId: number | null = null;
  let isEnabled = true;
  let lastApplauseTime = 0;
  let applauseCount = 0;
  let applauseStartTime = 0;

  try {
    // Obtenir l'accès au microphone
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Créer le contexte audio
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);

    // Configuration de l'analyseur
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    microphone.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Fonction d'analyse
    const analyze = () => {
      if (!isEnabled || !analyser) return;

      analyser.getByteFrequencyData(dataArray);

      // Analyser les fréquences caractéristiques des applaudissements (2000-4000 Hz)
      // Ces fréquences correspondent approximativement aux indices 85-170 dans le tableau
      const applauseFreqStart = Math.floor((2000 / (audioContext?.sampleRate || 44100)) * bufferLength);
      const applauseFreqEnd = Math.floor((4000 / (audioContext?.sampleRate || 44100)) * bufferLength);
      
      let applauseEnergy = 0;
      for (let i = applauseFreqStart; i < applauseFreqEnd && i < bufferLength; i++) {
        applauseEnergy += dataArray[i];
      }
      applauseEnergy = applauseEnergy / (applauseFreqEnd - applauseFreqStart) / 255; // Normaliser 0-1

      // Détecter un pic d'applaudissement
      if (applauseEnergy > threshold) {
        const now = Date.now();
        
        // Si c'est le début d'une série d'applaudissements
        if (now - lastApplauseTime > 500) {
          applauseCount = 1;
          applauseStartTime = now;
        } else {
          applauseCount++;
        }

        lastApplauseTime = now;

        // Détecter un applaudissement unique
        if (applauseCount === 1 && onApplause) {
          onApplause();
        }

        // Détecter une rafale d'applaudissements (3+ claps en moins de 2 secondes)
        if (applauseCount >= 3 && now - applauseStartTime < 2000 && onApplauseBurst) {
          const intensity = Math.min(applauseCount / 10, 1); // Normaliser l'intensité
          onApplauseBurst(intensity);
          applauseCount = 0; // Reset pour éviter les répétitions
        }
      } else {
        // Reset si pas d'activité depuis plus de 2 secondes
        if (Date.now() - lastApplauseTime > 2000) {
          applauseCount = 0;
        }
      }

      animationFrameId = requestAnimationFrame(analyze);
    };

    // Démarrer l'analyse
    analyze();

  } catch (error) {
    console.error('Erreur lors de la détection d\'applaudissements:', error);
    // Retourner un objet vide si la détection échoue
    return {
      stop: () => {},
      setEnabled: () => {},
      isEnabled: () => false
    };
  }

  return {
    stop: () => {
      isEnabled = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    },
    setEnabled: (enabled: boolean) => {
      isEnabled = enabled;
    },
    isEnabled: () => isEnabled
  };
};

/**
 * Vérifie si la détection d'applaudissements est supportée
 */
export const isApplauseDetectionSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    (window.AudioContext || (window as any).webkitAudioContext)
  );
};

